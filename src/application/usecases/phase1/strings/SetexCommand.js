/**
 * SetexCommand.js
 * Comando SETEX — almacena un valor con expiracion en segundos.
 * Equivalente a SET clave valor EX segundos.
 *
 * Sintaxis: SETEX clave segundos valor
 * Respuesta: +OK
 * Error: si segundos <= 0 o no es entero
 */

import { KeyEntry, TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class SetexCommand {
  static get nombre() { return 'SETEX'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {{ ok: string }|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 3) {
      return { err: 'ERR numero de argumentos incorrecto para el comando SETEX' };
    }

    const [clave, segStr, valor] = args;
    const segundos = parseInt(segStr, 10);

    if (isNaN(segundos) || segundos <= 0) {
      return { err: 'ERR el tiempo de expiracion debe ser un entero positivo mayor que cero' };
    }

    store.set(db, clave, new KeyEntry(valor, TipoDato.STRING, Date.now() + segundos * 1000));
    return { ok: 'OK' };
  }
}
