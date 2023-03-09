/**
 * SetCommand.js
 * Comando SET — almacena un valor de tipo string bajo una clave.
 *
 * Sintaxis:
 *   SET clave valor [EX segundos] [PX milisegundos] [NX] [XX]
 *
 * Opciones:
 *   EX  → expira en N segundos
 *   PX  → expira en N milisegundos
 *   NX  → solo establece si la clave NO existe
 *   XX  → solo establece si la clave YA existe
 *
 * Respuesta: +OK | $-1 (null cuando NX/XX no se cumplen)
 */

import { KeyEntry, TipoDato } from '../../../../domain/entities/KeyEntry.js';

export class SetCommand {
  static get nombre() { return 'SET'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {{ ok: string }|null|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length < 2) {
      return { err: 'ERR numero de argumentos incorrecto para el comando SET' };
    }

    const [clave, valor] = args;
    let expiresAt = null;
    let soloSiNoExiste = false;
    let soloSiExiste = false;

    // Parsear opciones adicionales
    let i = 2;
    while (i < args.length) {
      const opcion = args[i].toUpperCase();

      if (opcion === 'EX') {
        const segundos = parseInt(args[++i], 10);
        if (isNaN(segundos) || segundos <= 0) {
          return { err: 'ERR el valor de EX debe ser un entero positivo' };
        }
        expiresAt = Date.now() + segundos * 1000;
      } else if (opcion === 'PX') {
        const ms = parseInt(args[++i], 10);
        if (isNaN(ms) || ms <= 0) {
          return { err: 'ERR el valor de PX debe ser un entero positivo' };
        }
        expiresAt = Date.now() + ms;
      } else if (opcion === 'NX') {
        soloSiNoExiste = true;
      } else if (opcion === 'XX') {
        soloSiExiste = true;
      } else {
        return { err: `ERR opcion desconocida: ${args[i]}` };
      }
      i++;
    }

    if (soloSiNoExiste && soloSiExiste) {
      return { err: 'ERR las opciones NX y XX son mutuamente exclusivas' };
    }

    const existe = store.exists(db, clave);

    if (soloSiNoExiste && existe) return null;
    if (soloSiExiste && !existe) return null;

    store.set(db, clave, new KeyEntry(valor, TipoDato.STRING, expiresAt));
    return { ok: 'OK' };
  }
}
