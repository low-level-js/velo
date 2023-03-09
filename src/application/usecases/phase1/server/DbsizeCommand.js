/**
 * DbsizeCommand.js
 * Comando DBSIZE — devuelve el numero de claves activas en la base de datos actual.
 *
 * Sintaxis: DBSIZE
 * Respuesta: :N
 */

export class DbsizeCommand {
  static get nombre() { return 'DBSIZE'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 0) {
      return { err: 'ERR numero de argumentos incorrecto para el comando DBSIZE' };
    }
    return store.dbsize(db);
  }
}
