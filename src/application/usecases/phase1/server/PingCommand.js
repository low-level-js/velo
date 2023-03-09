/**
 * PingCommand.js
 * Comando PING — verifica la conectividad con el servidor.
 *
 * Sintaxis: PING [mensaje]
 * Respuesta: +PONG | $mensaje (si se paso argumento)
 */

export class PingCommand {
  static get nombre() { return 'PING'; }

  /**
   * @param {*} _store
   * @param {string[]} args
   * @returns {{ ok: string }|string}
   */
  execute(_store, args) {
    if (args.length > 0) {
      return args.join(' ');
    }
    return { ok: 'PONG' };
  }
}
