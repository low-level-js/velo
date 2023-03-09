/**
 * AppendCommand.js
 * Comando APPEND — agrega una cadena al final del valor de una clave string.
 * Si la clave no existe, se crea con el valor proporcionado.
 *
 * Sintaxis: APPEND clave valor
 * Respuesta: :N (longitud del string resultante en bytes)
 * Error: WRONGTYPE si la clave existe y no es de tipo string
 */

import { KeyEntry, TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class AppendCommand {
  static get nombre() { return 'APPEND'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 2) {
      return { err: 'ERR numero de argumentos incorrecto para el comando APPEND' };
    }

    const [clave, sufijo] = args;
    const entrada = store.get(db, clave);

    if (entrada && entrada.type !== TipoDato.STRING) {
      return { err: 'WRONGTYPE la operacion no es compatible con el tipo almacenado en esta clave' };
    }

    const valorActual = entrada ? entrada.value : '';
    const nuevoValor = valorActual + sufijo;
    const expiresAt = entrada ? entrada.expiresAt : null;

    store.set(db, clave, new KeyEntry(nuevoValor, TipoDato.STRING, expiresAt));
    return Buffer.byteLength(nuevoValor, 'utf-8');
  }
}
