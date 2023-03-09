/**
 * InMemoryStore.js
 * Implementacion concreta del puerto IDataStore.
 * Almacena todos los datos en memoria usando estructuras Map de JavaScript.
 *
 * Arquitectura interna:
 *   bases: Map<dbIndex, Map<key, KeyEntry>>
 *
 * Manejo de expiracion:
 *   - Lazy: cada lectura verifica si la clave expiro antes de devolverla.
 *   - Sweep periodico: un timer elimina proactivamente claves expiradas para
 *     liberar memoria sin esperar a que sean leidas.
 */

import { IDataStore } from '../../domain/ports/IDataStore.js';
import { KeyEntry } from '../../domain/entities/KeyEntry.js';
import Config from '../../config/Config.js';

/**
 * Convierte un patron glob simple (soporta * y ?) a RegExp.
 * @param {string} patron
 * @returns {RegExp}
 */
function globARegExp(patron) {
  const escapado = patron
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escapa caracteres especiales de regex
    .replace(/\*/g, '.*')                   // * → cualquier cantidad de caracteres
    .replace(/\?/g, '.');                   // ? → exactamente un caracter
  return new RegExp(`^${escapado}$`, 'i');
}

export class InMemoryStore extends IDataStore {
  constructor() {
    super();

    /**
     * Mapa principal: indice de base de datos → mapa de claves.
     * @type {Map<number, Map<string, KeyEntry>>}
     */
    this._bases = new Map();

    // Pre-inicializar todas las bases de datos configuradas
    for (let i = 0; i < Config.DB_COUNT; i++) {
      this._bases.set(i, new Map());
    }

    /** @type {NodeJS.Timeout|null} */
    this._sweepTimer = null;
  }

  /**
   * Devuelve el mapa de la base de datos indicada.
   * Lanza error si el indice esta fuera de rango.
   * @param {number} db
   * @returns {Map<string, KeyEntry>}
   */
  _obtenerBase(db) {
    if (db < 0 || db >= Config.DB_COUNT) {
      throw new Error(`Base de datos fuera de rango: ${db} (max: ${Config.DB_COUNT - 1})`);
    }
    return this._bases.get(db);
  }

  /**
   * Obtiene una entrada valida (no expirada). Si expiro, la elimina (lazy).
   * @param {number} db
   * @param {string} key
   * @returns {KeyEntry|null}
   */
  get(db, key) {
    const base = this._obtenerBase(db);
    const entrada = base.get(key);

    if (!entrada) return null;

    if (entrada.isExpired()) {
      base.delete(key);
      return null;
    }

    return entrada;
  }

  /**
   * Almacena una entrada.
   * @param {number} db
   * @param {string} key
   * @param {KeyEntry} entry
   */
  set(db, key, entry) {
    this._obtenerBase(db).set(key, entry);
  }

  /**
   * Elimina una o mas claves.
   * @param {number} db
   * @param {...string} keys
   * @returns {number} Cantidad de claves efectivamente eliminadas
   */
  del(db, ...keys) {
    const base = this._obtenerBase(db);
    let eliminadas = 0;

    for (const key of keys) {
      if (base.delete(key)) eliminadas++;
    }

    return eliminadas;
  }

  /**
   * Verifica si una clave existe y no ha expirado.
   * @param {number} db
   * @param {string} key
   * @returns {boolean}
   */
  exists(db, key) {
    return this.get(db, key) !== null;
  }

  /**
   * Devuelve todas las claves que coinciden con el patron glob.
   * @param {number} db
   * @param {string} patron
   * @returns {string[]}
   */
  keys(db, patron) {
    const base = this._obtenerBase(db);
    const regexp = globARegExp(patron);
    const resultado = [];

    for (const [key, entrada] of base) {
      if (entrada.isExpired()) {
        base.delete(key);
        continue;
      }
      if (regexp.test(key)) {
        resultado.push(key);
      }
    }

    return resultado;
  }

  /**
   * Devuelve el numero de claves activas en la base indicada.
   * @param {number} db
   * @returns {number}
   */
  dbsize(db) {
    const base = this._obtenerBase(db);
    let activas = 0;

    for (const [key, entrada] of base) {
      if (entrada.isExpired()) {
        base.delete(key);
      } else {
        activas++;
      }
    }

    return activas;
  }

  /**
   * Elimina todas las claves de la base indicada.
   * @param {number} db
   */
  flushDb(db) {
    this._obtenerBase(db).clear();
  }

  /**
   * Elimina todas las claves de todas las bases de datos.
   */
  flushAll() {
    for (const base of this._bases.values()) {
      base.clear();
    }
  }

  /**
   * Inicia el timer de sweep periodico que elimina claves expiradas.
   * El intervalo se configura con SWEEP_INTERVAL_MS en el .env.
   */
  iniciarSweep() {
    if (this._sweepTimer) return;

    this._sweepTimer = setInterval(() => {
      let totalEliminadas = 0;

      for (const base of this._bases.values()) {
        for (const [key, entrada] of base) {
          if (entrada.isExpired()) {
            base.delete(key);
            totalEliminadas++;
          }
        }
      }

      if (totalEliminadas > 0 && Config.LOG_LEVEL === 'debug') {
        console.log(`[velo:store] Sweep: ${totalEliminadas} clave(s) expirada(s) eliminada(s)`);
      }
    }, Config.SWEEP_INTERVAL_MS);

    // Permite que Node.js cierre aunque el timer este activo
    this._sweepTimer.unref();
  }

  /**
   * Detiene el timer de sweep periodico.
   */
  detenerSweep() {
    if (this._sweepTimer) {
      clearInterval(this._sweepTimer);
      this._sweepTimer = null;
    }
  }
}
