/**
 * ExistsCommand.js
 * Comando EXISTS — verifica si una o mas claves existen en el almacen.
 *
 * Sintaxis: EXISTS clave [clave ...]
 * Respuesta: :N (cantidad de claves que existen; una clave repetida cuenta N veces)
 */

export class ExistsCommand {
  static get nombre() { return 'EXISTS'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length === 0) {
      return { err: 'ERR numero de argumentos incorrecto para el comando EXISTS' };
    }

    let conteo = 0;
    for (const clave of args) {
      if (store.exists(db, clave)) conteo++;
    }
    return conteo;
  }
}
