/**
 * server.js
 * Punto de entrada principal del servidor Velo.
 *
 * Secuencia de arranque:
 *   1. Carga la configuracion desde .env
 *   2. Instancia el almacen de datos en memoria
 *   3. Inicia el sweep periodico de claves expiradas
 *   4. Instancia el registro de comandos
 *   5. Crea y arranca el servidor TCP
 *   6. Registra manejadores de senales para cierre ordenado
 */

import Config from './config/Config.js';
import { InMemoryStore } from './infrastructure/storage/InMemoryStore.js';
import { CommandRegistry } from './application/CommandRegistry.js';
import { TcpServer } from './infrastructure/server/TcpServer.js';
import pkg from '../package.json' with { type: 'json' };

// ── Arranque ──────────────────────────────────────────────────

console.log('============================================================');
console.log(` Velo - Almacen de datos en memoria`);
console.log(` Autor : ${pkg.author}`);
console.log(` Pkg   : ${pkg.name}  v${pkg.version}`);
console.log('============================================================');

const store    = new InMemoryStore();
const registry = new CommandRegistry();
const servidor = new TcpServer(store, registry, Config);

// Iniciar el sweep de claves expiradas
store.iniciarSweep();

// Arrancar el servidor TCP
try {
  await servidor.iniciar();
} catch (err) {
  console.error(`[velo:servidor] Error al iniciar el servidor: ${err.message}`);
  process.exit(1);
}

// ── Cierre ordenado ───────────────────────────────────────────

async function detenerServidor(senal) {
  console.log(`\n[velo:servidor] Senal recibida: ${senal}. Cerrando servidor...`);
  try {
    await servidor.detener();
  } catch (err) {
    console.error(`[velo:servidor] Error durante el cierre: ${err.message}`);
  }
  process.exit(0);
}

process.on('SIGTERM', () => detenerServidor('SIGTERM'));
process.on('SIGINT',  () => detenerServidor('SIGINT'));

// Capturar errores no manejados para evitar cierres abruptos
process.on('uncaughtException', (err) => {
  console.error(`[velo:servidor] Excepcion no capturada: ${err.message}`);
  console.error(err.stack);
});

process.on('unhandledRejection', (razon) => {
  console.error(`[velo:servidor] Promesa rechazada sin manejar: ${razon}`);
});
