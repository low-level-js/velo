/**
 * ICommandHandler.js
 * Puerto (interfaz) que define el contrato que debe cumplir cada caso de uso
 * que maneja un comando del protocolo.
 *
 * Cada comando (SET, GET, DEL, etc.) es un handler independiente que
 * implementa este contrato.
 */

/**
 * @interface ICommandHandler
 * Contrato para los manejadores de comandos de la Fase 1.
 */
export class ICommandHandler {
  /**
   * Nombre del comando en mayusculas (ej: 'SET', 'GET').
   * @type {string}
   */
  static get nombre() { throw new Error('Propiedad estatica no implementada: nombre'); }

  /**
   * Ejecuta el comando con los argumentos dados y devuelve el resultado.
   *
   * El resultado puede ser:
   *  - string         → se serializa como Bulk String
   *  - number         → se serializa como Integer
   *  - null           → se serializa como Null Bulk String
   *  - string[]       → se serializa como Array de Bulk Strings
   *  - { ok: string } → se serializa como Simple String (ej: 'OK')
   *  - { err: string }→ se serializa como Error
   *
   * @param {import('../entities/KeyEntry.js').KeyEntry} _store - Instancia del almacen
   * @param {string[]} _args - Argumentos del comando (sin el nombre del comando)
   * @param {number} _db - Indice de la base de datos activa para la conexion
   * @returns {*} Resultado del comando
   */
  execute(_store, _args, _db) { throw new Error('Metodo no implementado: execute'); } // eslint-disable-line
}
