/**
 * MsetCommand.js
 * Comando MSET — almacena multiples pares clave-valor en una sola operacion atomica.
 * Nunca falla; sobreescribe claves existentes.
 *
 * Sintaxis: MSET clave valor [clave valor ...]
 * Respuesta: +OK
 */

import { KeyEntry, TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class MsetCommand {
  static get nombre() { return 'MSET'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {{ ok: string }|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length === 0 || args.length % 2 !== 0) {
      return { err: 'ERR numero de argumentos incorrecto para el comando MSET (se requieren pares clave-valor)' };
    }

    for (let i = 0; i < args.length; i += 2) {
      store.set(db, args[i], new KeyEntry(args[i + 1], TipoDato.STRING, null));
    }

    return { ok: 'OK' };
  }
}
