/**
 * MgetCommand.js
 * Comando MGET — obtiene los valores de multiples claves en una sola llamada.
 * Las claves que no existen o son de tipo distinto a string devuelven null.
 *
 * Sintaxis: MGET clave [clave ...]
 * Respuesta: *N (array de bulk strings y/o null)
 */

import { TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class MgetCommand {
  static get nombre() { return 'MGET'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {Array<string|null>|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length === 0) {
      return { err: 'ERR numero de argumentos incorrecto para el comando MGET' };
    }

    return args.map((clave) => {
      const entrada = store.get(db, clave);
      if (!entrada || entrada.type !== TipoDato.STRING) return null;
      return entrada.value;
    });
  }
}
