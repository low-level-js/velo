/**
 * IDataStore.js
 * Puerto (interfaz) que define el contrato que debe cumplir cualquier
 * implementacion de almacen de datos en el sistema.
 *
 * En JavaScript no existe una interfaz nativa, por lo que este archivo
 * sirve como documentacion de contrato via JSDoc. Las implementaciones
 * deben extender esta clase y sobreescribir todos sus metodos.
 */

/**
 * @interface IDataStore
 * Contrato para el almacen de datos en memoria.
 */
export class IDataStore {
  /**
   * Obtiene la entrada asociada a una clave en la base de datos indicada.
   * Realiza limpieza lazy si la clave expiro.
   * @param {number} db - Indice de la base de datos
   * @param {string} key - Clave a buscar
   * @returns {import('../entities/KeyEntry.js').KeyEntry|null}
   */
  get(db, key) { throw new Error('Metodo no implementado: get'); }          // eslint-disable-line

  /**
   * Almacena una entrada en la base de datos indicada.
   * @param {number} db - Indice de la base de datos
   * @param {string} key - Clave
   * @param {import('../entities/KeyEntry.js').KeyEntry} entry - Entrada a almacenar
   * @returns {void}
   */
  set(db, key, entry) { throw new Error('Metodo no implementado: set'); }   // eslint-disable-line

  /**
   * Elimina una o mas claves de la base de datos indicada.
   * @param {number} db - Indice de la base de datos
   * @param {...string} keys - Claves a eliminar
   * @returns {number} Cantidad de claves eliminadas
   */
  del(db, ...keys) { throw new Error('Metodo no implementado: del'); }      // eslint-disable-line

  /**
   * Verifica si una clave existe en la base de datos indicada (sin expirar).
   * @param {number} db
   * @param {string} key
   * @returns {boolean}
   */
  exists(db, key) { throw new Error('Metodo no implementado: exists'); }    // eslint-disable-line

  /**
   * Devuelve todas las claves de la base de datos que coinciden con el patron.
   * @param {number} db
   * @param {string} pattern - Patron glob (soporta * y ?)
   * @returns {string[]}
   */
  keys(db, pattern) { throw new Error('Metodo no implementado: keys'); }    // eslint-disable-line

  /**
   * Devuelve el numero de claves en la base de datos indicada.
   * @param {number} db
   * @returns {number}
   */
  dbsize(db) { throw new Error('Metodo no implementado: dbsize'); }         // eslint-disable-line

  /**
   * Elimina todas las claves de la base de datos indicada.
   * @param {number} db
   * @returns {void}
   */
  flushDb(db) { throw new Error('Metodo no implementado: flushDb'); }       // eslint-disable-line

  /**
   * Elimina todas las claves de todas las bases de datos.
   * @returns {void}
   */
  flushAll() { throw new Error('Metodo no implementado: flushAll'); }       // eslint-disable-line

  /**
   * Inicia el timer de limpieza periodica de claves expiradas.
   * @returns {void}
   */
  iniciarSweep() { throw new Error('Metodo no implementado: iniciarSweep'); } // eslint-disable-line

  /**
   * Detiene el timer de limpieza periodica.
   * @returns {void}
   */
  detenerSweep() { throw new Error('Metodo no implementado: detenerSweep'); } // eslint-disable-line
}
