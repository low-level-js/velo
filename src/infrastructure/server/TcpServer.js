/**
 * TcpServer.js
 * Servidor TCP que acepta conexiones entrantes y crea una ClientConnection
 * por cada cliente conectado.
 *
 * Caracteristicas:
 *   - Limite configurable de conexiones simultaneas (MAX_CONNECTIONS)
 *   - Logs en espanol sin ñ ni emojis
 *   - Manejo de SIGTERM y SIGINT para cierre ordenado
 */

import net from 'net';
import { ClientConnection } from './ClientConnection.js';

export class TcpServer {
  /**
   * @param {import('../../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {import('../../application/CommandRegistry.js').CommandRegistry} registry
   * @param {import('../../config/Config.js').default} config
   */
  constructor(store, registry, config) {
    this._store = store;
    this._registry = registry;
    this._config = config;

    /** Conjunto de sockets activos para rastrear conexiones */
    this._conexionesActivas = new Set();

    /** Instancia del servidor TCP nativo */
    this._servidor = net.createServer((socket) => this._manejarConexion(socket));

    this._configurarEventosServidor();
  }

  /**
   * Registra eventos del servidor TCP.
   */
  _configurarEventosServidor() {
    this._servidor.on('error', (err) => {
      console.error(`[velo:servidor] Error TCP: ${err.message}`);

      if (err.code === 'EADDRINUSE') {
        console.error(`[velo:servidor] El puerto ${this._config.PORT} ya esta en uso. Verifica que no haya otra instancia corriendo.`);
        process.exit(1);
      }
    });

    this._servidor.on('close', () => {
      console.log('[velo:servidor] Servidor detenido.');
    });
  }

  /**
   * Maneja una nueva conexion entrante.
   * Si se supera el limite de MAX_CONNECTIONS, cierra la conexion inmediatamente.
   * @param {net.Socket} socket
   */
  _manejarConexion(socket) {
    if (this._conexionesActivas.size >= this._config.MAX_CONNECTIONS) {
      console.warn(
        `[velo:servidor] Limite de conexiones alcanzado (${this._config.MAX_CONNECTIONS}). ` +
        `Rechazando ${socket.remoteAddress}:${socket.remotePort}`
      );
      socket.destroy();
      return;
    }

    // Activar keep-alive para detectar clientes caidos
    socket.setKeepAlive(true, 60000);

    this._conexionesActivas.add(socket);

    if (this._config.LOG_LEVEL !== 'error') {
      console.log(
        `[velo:servidor] Cliente conectado: ${socket.remoteAddress}:${socket.remotePort} ` +
        `(activas: ${this._conexionesActivas.size})`
      );
    }

    // Crear la conexion que maneja el ciclo de vida del cliente
    new ClientConnection(socket, this._store, this._registry, this._config);

    socket.on('close', () => {
      this._conexionesActivas.delete(socket);
    });

    socket.on('error', () => {
      this._conexionesActivas.delete(socket);
    });
  }

  /**
   * Inicia el servidor TCP en el host y puerto configurados.
   * @returns {Promise<void>} Resuelve cuando el servidor esta listo para aceptar conexiones
   */
  iniciar() {
    return new Promise((resolve, reject) => {
      this._servidor.listen(this._config.PORT, this._config.HOST, () => {
        console.log(`[velo:servidor] Servidor iniciado en ${this._config.HOST}:${this._config.PORT}`);
        console.log(`[velo:servidor] Bases de datos disponibles: ${this._config.DB_COUNT} (0 a ${this._config.DB_COUNT - 1})`);
        console.log(`[velo:servidor] Limite de conexiones: ${this._config.MAX_CONNECTIONS}`);
        console.log(`[velo:servidor] Nivel de log: ${this._config.LOG_LEVEL}`);
        resolve();
      });

      this._servidor.once('error', reject);
    });
  }

  /**
   * Cierra el servidor de forma ordenada:
   * 1. Deja de aceptar nuevas conexiones
   * 2. Cierra todas las conexiones activas
   * 3. Detiene el sweep del store
   * @returns {Promise<void>}
   */
  detener() {
    return new Promise((resolve) => {
      console.log(`[velo:servidor] Iniciando cierre ordenado... (${this._conexionesActivas.size} conexiones activas)`);

      // Cerrar todas las conexiones activas
      for (const socket of this._conexionesActivas) {
        socket.destroy();
      }
      this._conexionesActivas.clear();

      // Detener el sweep del almacen
      this._store.detenerSweep();

      this._servidor.close(() => {
        console.log('[velo:servidor] Cierre completado.');
        resolve();
      });
    });
  }
}
