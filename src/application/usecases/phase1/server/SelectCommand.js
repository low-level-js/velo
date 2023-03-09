/**
 * SelectCommand.js
 * Comando SELECT — cambia la base de datos activa para la conexion actual.
 *
 * Sintaxis: SELECT indice
 * Respuesta: objeto especial { nuevoDb: N } que ClientConnection interpreta
 *            para actualizar su estado interno, luego envia +OK al cliente.
 * Error: si el indice esta fuera del rango configurado (0 a DB_COUNT-1)
 */

import Config from '../../../../config/Config.js';

export class SelectCommand {
  static get nombre() { return 'SELECT'; }

  /**
   * @param {*} _store
   * @param {string[]} args
   * @returns {{ nuevoDb: number }|{ err: string }}
   */
  execute(_store, args) {
    if (args.length !== 1) {
      return { err: 'ERR numero de argumentos incorrecto para el comando SELECT' };
    }

    const indice = parseInt(args[0], 10);

    if (isNaN(indice) || indice < 0 || indice >= Config.DB_COUNT) {
      return { err: `ERR el indice de base de datos esta fuera de rango. Rango valido: 0 a ${Config.DB_COUNT - 1}` };
    }

    // ClientConnection detecta esta forma especial y actualiza this._db
    return { nuevoDb: indice };
  }
}
