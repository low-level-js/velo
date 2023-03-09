/**
 * ExpireCommand.js
 * Comando EXPIRE — establece un tiempo de expiracion en segundos para una clave.
 *
 * Sintaxis: EXPIRE clave segundos
 * Respuesta: :1 (si se establecio) | :0 (si la clave no existe)
 */

export class ExpireCommand {
  static get nombre() { return 'EXPIRE'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 2) {
      return { err: 'ERR numero de argumentos incorrecto para el comando EXPIRE' };
    }

    const [clave, segStr] = args;
    const segundos = parseInt(segStr, 10);

    if (isNaN(segundos)) {
      return { err: 'ERR el valor no es un entero o esta fuera del rango permitido' };
    }
    if (segundos < 0) {
      return { err: 'ERR el tiempo de expiracion no puede ser negativo' };
    }

    const entrada = store.get(db, clave);
    if (!entrada) return 0;

    entrada.expiresAt = Date.now() + segundos * 1000;
    return 1;
  }
}
