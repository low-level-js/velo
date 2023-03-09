/**
 * SetnxCommand.js
 * Comando SETNX (SET if Not eXists) — establece el valor solo si la clave no existe.
 * Equivalente a SET clave valor NX.
 *
 * Sintaxis: SETNX clave valor
 * Respuesta: :1 (se establecio) | :0 (ya existia, no se modifico)
 */

import { KeyEntry, TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class SetnxCommand {
  static get nombre() { return 'SETNX'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 2) {
      return { err: 'ERR numero de argumentos incorrecto para el comando SETNX' };
    }

    const [clave, valor] = args;

    if (store.exists(db, clave)) return 0;

    store.set(db, clave, new KeyEntry(valor, TipoDato.STRING, null));
    return 1;
  }
}
