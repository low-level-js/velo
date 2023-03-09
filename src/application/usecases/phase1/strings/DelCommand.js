/**
 * DelCommand.js
 * Comando DEL — elimina una o mas claves del almacen.
 *
 * Sintaxis: DEL clave [clave ...]
 * Respuesta: :N (cantidad de claves eliminadas)
 */

export class DelCommand {
  static get nombre() { return 'DEL'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length === 0) {
      return { err: 'ERR numero de argumentos incorrecto para el comando DEL' };
    }
    return store.del(db, ...args);
  }
}
