/**
 * TtlCommand.js
 * Comando TTL — devuelve el tiempo de vida restante de una clave en segundos.
 *
 * Sintaxis: TTL clave
 * Respuesta:
 *   :N   → segundos restantes (redondeado hacia arriba)
 *   :-1  → la clave existe pero no tiene expiracion
 *   :-2  → la clave no existe o ya expiro
 */

export class TtlCommand {
  static get nombre() { return 'TTL'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {string[]} args
   * @param {number} db
   * @returns {number|{ err: string }}
   */
  execute(store, args, db) {
    if (args.length !== 1) {
      return { err: 'ERR numero de argumentos incorrecto para el comando TTL' };
    }

    const entrada = store.get(db, args[0]);
    if (!entrada) return -2;

    return entrada.getTtlSegundos();
  }
}
