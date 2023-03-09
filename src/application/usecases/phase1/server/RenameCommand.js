/**
 * RenameCommand.js
 * Comando RENAME — renombra una clave existente.
 * Si la clave destino ya existe, la sobreescribe.
 *
 * Sintaxis: RENAME clave nuevaClave
 * Respuesta: +OK
 * Error: ERR si la clave origen no existe
 */

export class RenameCommand {
  static get nombre() { return 'RENAME'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {{ ok: string }|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 2) {
      return { err: 'ERR numero de argumentos incorrecto para el comando RENAME' };
    }

    const [claveOrigen, claveDestino] = args;
    const entrada = store.get(db, claveOrigen);

    if (!entrada) {
      return { err: 'ERR no existe la clave' };
    }

    // Copiar la entrada al nuevo nombre
    store.set(db, claveDestino, entrada);

    // Eliminar la clave original
    store.del(db, claveOrigen);

    return { ok: 'OK' };
  }
}
