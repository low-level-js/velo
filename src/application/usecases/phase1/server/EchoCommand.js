/**
 * EchoCommand.js
 * Comando ECHO — devuelve el mensaje que se le pasa como argumento.
 *
 * Sintaxis: ECHO mensaje
 * Respuesta: $mensaje
 */

export class EchoCommand {
  static get nombre() { return 'ECHO'; }

  /**
   * @param {*} _store
   * @param {string[]} args
   * @returns {string|{ err: string }}
   */
  execute(_store, args) {
    if (args.length !== 1) {
      return { err: 'ERR numero de argumentos incorrecto para el comando ECHO' };
    }
    return args[0];
  }
}
