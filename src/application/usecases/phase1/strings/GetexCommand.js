/**
 * GetexCommand.js
 * Comando GETEX — obtiene el valor de una clave y opcionalmente modifica su expiracion.
 *
 * Sintaxis:
 *   GETEX clave
 *   GETEX clave EX segundos
 *   GETEX clave PX milisegundos
 *   GETEX clave EXAT timestamp_unix_segundos
 *   GETEX clave PXAT timestamp_unix_ms
 *   GETEX clave PERSIST
 *
 * Respuesta: $valor | $-1 (si no existe)
 * Error: WRONGTYPE si la clave no es de tipo string
 */

import { TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class GetexCommand {
  static get nombre() { return 'GETEX'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {string|null|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length === 0) {
      return { err: 'ERR numero de argumentos incorrecto para el comando GETEX' };
    }

    const clave = args[0];
    const entrada = store.get(db, clave);

    if (!entrada) return null;

    if (entrada.type !== TipoDato.STRING) {
      return { err: 'WRONGTYPE la operacion no es compatible con el tipo almacenado en esta clave' };
    }

    // Sin opciones: solo devuelve el valor sin cambiar la expiracion
    if (args.length === 1) {
      return entrada.value;
    }

    const opcion = args[1].toUpperCase();

    switch (opcion) {
      case 'EX': {
        const segundos = parseInt(args[2], 10);
        if (isNaN(segundos) || segundos <= 0) {
          return { err: 'ERR el valor de EX debe ser un entero positivo' };
        }
        entrada.expiresAt = Date.now() + segundos * 1000;
        break;
      }
      case 'PX': {
        const ms = parseInt(args[2], 10);
        if (isNaN(ms) || ms <= 0) {
          return { err: 'ERR el valor de PX debe ser un entero positivo' };
        }
        entrada.expiresAt = Date.now() + ms;
        break;
      }
      case 'EXAT': {
        const ts = parseInt(args[2], 10);
        if (isNaN(ts) || ts <= 0) {
          return { err: 'ERR el valor de EXAT debe ser un timestamp unix positivo' };
        }
        entrada.expiresAt = ts * 1000;
        break;
      }
      case 'PXAT': {
        const tsMs = parseInt(args[2], 10);
        if (isNaN(tsMs) || tsMs <= 0) {
          return { err: 'ERR el valor de PXAT debe ser un timestamp unix en ms positivo' };
        }
        entrada.expiresAt = tsMs;
        break;
      }
      case 'PERSIST': {
        // Elimina la expiracion (la clave se vuelve persistente)
        entrada.expiresAt = null;
        break;
      }
      default:
        return { err: `ERR opcion desconocida para GETEX: ${args[1]}` };
    }

    return entrada.value;
  }
}
