/**
 * KeyEntry.js
 * Entidad del dominio que representa una entrada almacenada en la base de datos.
 * Encapsula el valor, su tipo de dato, y la informacion de expiracion.
 */

/**
 * Tipos de dato soportados por el almacen.
 * @readonly
 * @enum {string}
 */
export const TipoDato = Object.freeze({
  STRING: 'string',
  LIST: 'list',
  HASH: 'hash',
  SET: 'set',
});

/**
 * Representa una entrada en el almacen de datos en memoria.
 */
export class KeyEntry {
  /**
   * @param {*} value - Valor almacenado (string, array, Map, Set, etc.)
   * @param {string} type - Tipo del valor (usar TipoDato)
   * @param {number|null} expiresAt - Timestamp en ms (Date.now()) cuando expira, o null si no tiene TTL
   */
  constructor(value, type = TipoDato.STRING, expiresAt = null) {
    this.value = value;
    this.type = type;
    this.expiresAt = expiresAt;
  }

  /**
   * Indica si la clave ya expiro comparando con el tiempo actual.
   * @returns {boolean}
   */
  isExpired() {
    if (this.expiresAt === null) return false;
    return Date.now() >= this.expiresAt;
  }

  /**
   * Devuelve el TTL restante en segundos, o -1 si no tiene expiracion, o -2 si ya expiro.
   * @returns {number}
   */
  getTtlSegundos() {
    if (this.expiresAt === null) return -1;
    if (this.isExpired()) return -2;
    return Math.ceil((this.expiresAt - Date.now()) / 1000);
  }

  /**
   * Devuelve el TTL restante en milisegundos, o -1 si no tiene expiracion, o -2 si ya expiro.
   * @returns {number}
   */
  getTtlMs() {
    if (this.expiresAt === null) return -1;
    if (this.isExpired()) return -2;
    return this.expiresAt - Date.now();
  }
}
