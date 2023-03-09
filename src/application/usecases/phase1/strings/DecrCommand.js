/**
 * DecrCommand.js
 * Comando DECR — decrementa el valor entero de una clave en 1.
 * Si la clave no existe, se inicializa en 0 antes de decrementar.
 *
 * Sintaxis: DECR clave
 * Respuesta: :N (nuevo valor)
 * Error: WRONGTYPE si no es string | ERR si el valor no es entero
 */

import { KeyEntry, TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class DecrCommand {
  static get nombre() { return 'DECR'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 1) {
      return { err: 'ERR numero de argumentos incorrecto para el comando DECR' };
    }

    const clave = args[0];
    const entrada = store.get(db, clave);

    if (entrada && entrada.type !== TipoDato.STRING) {
      return { err: 'WRONGTYPE la operacion no es compatible con el tipo almacenado en esta clave' };
    }

    const valorActual = entrada ? entrada.value : '0';
    const numero = parseInt(valorActual, 10);

    if (isNaN(numero) || String(numero) !== valorActual) {
      return { err: 'ERR el valor no es un entero o esta fuera del rango permitido' };
    }

    const nuevoValor = numero - 1;
    const expiresAt = entrada ? entrada.expiresAt : null;
    store.set(db, clave, new KeyEntry(String(nuevoValor), TipoDato.STRING, expiresAt));
    return nuevoValor;
  }
}
