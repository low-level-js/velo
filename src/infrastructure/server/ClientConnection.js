/**
 * ClientConnection.js
 * Maneja el ciclo de vida completo de una conexion TCP individual.
 *
 * Flujo por cada mensaje recibido:
 *   1. Acumula fragmentos en el RespParser
 *   2. El parser emite un evento 'comando' con el array de tokens
 *   3. Se valida el comando y se delega al CommandRegistry
 *   4. La respuesta se serializa con RespSerializer y se escribe al socket
 *
 * Cada conexion mantiene su propio indice de base de datos activo (SELECT).
 */

import { RespParser } from '../protocol/RespParser.js';
import { RespSerializer } from '../protocol/RespSerializer.js';

export class ClientConnection {
  /**
   * @param {import('net').Socket} socket - Socket TCP de la conexion entrante
   * @param {import('../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {import('../../application/CommandRegistry.js').CommandRegistry} registry
   * @param {import('../../config/Config.js').default} config
   */
  constructor(socket, store, registry, config) {
    this._socket = socket;
    this._store = store;
    this._registry = registry;
    this._config = config;

    /** Base de datos activa para esta conexion (cambia con SELECT) */
    this._db = 0;

    /** Parser incremental de RESP para esta conexion */
    this._parser = new RespParser();

    this._configurarEventos();
  }

  /**
   * Registra todos los listeners del socket y del parser.
   */
  _configurarEventos() {
    // Alimentar datos al parser cuando llegan del socket
    this._socket.on('data', (chunk) => {
      try {
        this._parser.feed(chunk);
      } catch (err) {
        console.error(`[velo:conexion] Error al parsear datos: ${err.message}`);
        this._enviarError('ERR error interno al procesar el comando');
      }
    });

    // El parser emite un array de tokens por cada comando completo
    this._parser.on('comando', async (tokens) => {
      await this._manejarComando(tokens);
    });

    // Conexion cerrada por el cliente
    this._socket.on('close', () => {
      if (this._config.LOG_LEVEL === 'debug') {
        const dir = `${this._socket.remoteAddress}:${this._socket.remotePort}`;
        console.log(`[velo:conexion] Cliente desconectado: ${dir}`);
      }
      this._parser.reset();
    });

    // Error en el socket (ej: reset por el cliente)
    this._socket.on('error', (err) => {
      if (err.code !== 'ECONNRESET') {
        console.error(`[velo:conexion] Error en socket: ${err.message}`);
      }
    });
  }

  /**
   * Recibe los tokens de un comando, los ejecuta y escribe la respuesta al socket.
   * @param {string[]|null} tokens
   */
  async _manejarComando(tokens) {
    if (!tokens || tokens.length === 0) {
      this._enviarError('ERR comando vacio');
      return;
    }

    const nombre = String(tokens[0]).toUpperCase();
    const args = tokens.slice(1);

    if (this._config.LOG_LEVEL === 'debug') {
      const dir = `${this._socket.remoteAddress}:${this._socket.remotePort}`;
      console.log(`[velo:cmd] ${dir} db=${this._db} >>> ${nombre} ${args.join(' ')}`);
    }

    try {
      const resultado = await this._registry.execute(nombre, args, this._store, this._db);

      // El comando SELECT necesita cambiar el db de esta conexion
      if (nombre === 'SELECT' && typeof resultado === 'object' && resultado !== null && 'nuevoDb' in resultado) {
        this._db = resultado.nuevoDb;
        this._enviar(RespSerializer.simpleString('OK'));
        return;
      }

      this._enviar(RespSerializer.serializar(resultado));
    } catch (err) {
      console.error(`[velo:cmd] Error al ejecutar '${nombre}': ${err.message}`);
      this._enviarError(`ERR ${err.message}`);
    }
  }

  /**
   * Escribe datos al socket si esta disponible.
   * @param {string} datos
   */
  _enviar(datos) {
    if (!this._socket.destroyed) {
      this._socket.write(datos);
    }
  }

  /**
   * Escribe un mensaje de error al socket.
   * @param {string} mensaje
   */
  _enviarError(mensaje) {
    this._enviar(RespSerializer.error(mensaje));
  }
}
