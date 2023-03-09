/**
 * GetCommand.js
 * Comando GET — obtiene el valor asociado a una clave de tipo string.
 *
 * Sintaxis: GET clave
 * Respuesta: $valor | $-1 (si no existe o expiro)
 * Error: WRONGTYPE si la clave no es de tipo string
 */

import { TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class GetCommand {
  static get nombre() { return 'GET'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {string|null|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 1) {
      return { err: 'ERR numero de argumentos incorrecto para el comando GET' };
    }

    const entrada = store.get(db, args[0]);
    if (!entrada) return null;

    if (entrada.type !== TipoDato.STRING) {
      return { err: 'WRONGTYPE la operacion no es compatible con el tipo almacenado en esta clave' };
    }

    return entrada.value;
  }
}
