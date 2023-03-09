/**
 * TypeCommand.js
 * Comando TYPE — devuelve el tipo del valor almacenado en una clave.
 *
 * Sintaxis: TYPE clave
 * Respuesta: +string | +list | +hash | +set | +none (si no existe)
 */

export class TypeCommand {
  static get nombre() { return 'TYPE'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {{ ok: string }|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 1) {
      return { err: 'ERR numero de argumentos incorrecto para el comando TYPE' };
    }

    const entrada = store.get(db, args[0]);
    if (!entrada) return { ok: 'none' };

    return { ok: entrada.type };
  }
}
