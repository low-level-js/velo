/**
 * KeysCommand.js
 * Comando KEYS — devuelve todas las claves activas que coinciden con un patron glob.
 *
 * Sintaxis: KEYS patron
 * Patron: * (todas), h?llo, h*llo, h[ae]llo
 * Respuesta: *N (array de bulk strings)
 *
 * Advertencia: en produccion con muchas claves, KEYS puede ser lento.
 * Prefiere usar SCAN para iteracion incremental (fase futura).
 */

export class KeysCommand {
  static get nombre() { return 'KEYS'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {string[]|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 1) {
      return { err: 'ERR numero de argumentos incorrecto para el comando KEYS' };
    }
    return store.keys(db, args[0]);
  }
}
