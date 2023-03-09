/**
 * FlushallCommand.js
 * Comando FLUSHALL — elimina todas las claves de todas las bases de datos.
 *
 * Sintaxis: FLUSHALL
 * Respuesta: +OK
 */

export class FlushallCommand {
  static get nombre() { return 'FLUSHALL'; }

  /**
   * @param {import('../../../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @returns {{ ok: string }}
   */
  execute(store) {
    store.flushAll();
    return { ok: 'OK' };
  }
}
