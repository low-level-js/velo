/**
 * StrlenCommand.js
 * Comando STRLEN — devuelve la longitud en bytes del valor string de una clave.
 * Devuelve 0 si la clave no existe.
 *
 * Sintaxis: STRLEN clave
 * Respuesta: :N (bytes)
 * Error: WRONGTYPE si la clave no es de tipo string
 */

import { TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class StrlenCommand {
  static get nombre() { return 'STRLEN'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 1) {
      return { err: 'ERR numero de argumentos incorrecto para el comando STRLEN' };
    }

    const entrada = store.get(db, args[0]);
    if (!entrada) return 0;

    if (entrada.type !== TipoDato.STRING) {
      return { err: 'WRONGTYPE la operacion no es compatible con el tipo almacenado en esta clave' };
    }

    return Buffer.byteLength(entrada.value, 'utf-8');
  }
}
