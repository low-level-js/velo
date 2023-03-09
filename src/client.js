/**
 * client.js
 * Cliente REPL interactivo de Velo.
 *
 * Comportamiento:
 *   - Se conecta al servidor Velo por TCP
 *   - Muestra un prompt con host:puerto y base de datos activa
 *   - Acepta comandos como texto, los serializa a RESP y los envia
 *   - Imprime las respuestas formateadas en la terminal
 *   - Soporta historial de comandos con flechas arriba/abajo (via readline)
 *   - Comandos locales: exit / quit (cerrar), clear (limpiar pantalla)
 *   - Se intenta reconectar automaticamente si cae la conexion
 *
 * Uso:
 *   node src/client.js [host] [puerto]
 *   node src/client.js 127.0.0.1 6380
 */

import net      from 'net';
import readline from 'readline';
import Config   from './config/Config.js';
import { RespParser }     from './infrastructure/protocol/RespParser.js';
import { RespSerializer } from './infrastructure/protocol/RespSerializer.js';
import pkg from '../package.json' with { type: 'json' };

// ── Configuracion de conexion ────────────────────────────────

const HOST  = process.argv[2] ?? Config.HOST;
const PORT  = parseInt(process.argv[3] ?? Config.PORT, 10);

// Base de datos activa (se actualiza localmente al ejecutar SELECT)
let dbActiva = 0;

// Referencias al socket y al REPL para poder recrearlos al reconectar
let socket  = null;
let rl      = null;

// Cola de resolvers para sincronizar respuestas con comandos enviados
/** @type {Array<(respuesta: *) => void>} */
const colaResolvers = [];

// ── Formateo de respuestas RESP ───────────────────────────────

const RESET   = '\x1b[0m';
const ROJO    = '\x1b[31m';
const VERDE   = '\x1b[32m';
const AMARILLO= '\x1b[33m';
const CYAN    = '\x1b[36m';
const GRIS    = '\x1b[90m';

/**
 * Formatea un valor decodificado por RespParser para mostrarlo en terminal.
 * Replica el estilo de salida de los clientes RESP estandar.
 * @param {*} valor - Valor parseado
 * @param {number} [nivel=0] - Nivel de anidamiento (para arrays)
 * @returns {string}
 */
function formatearRespuesta(valor, nivel = 0) {
  const indent = '   '.repeat(nivel);

  // Null
  if (valor === null) {
    return `${GRIS}(nil)${RESET}`;
  }

  // Error (las lineas de error del parser se devuelven como string con prefijo '-')
  if (typeof valor === 'string' && valor.__esError) {
    return `${ROJO}(error) ${valor.mensaje}${RESET}`;
  }

  // Simple String (prefijo '+') o resultado ok
  if (typeof valor === 'object' && valor !== null && 'ok' in valor) {
    return `${VERDE}${valor.ok}${RESET}`;
  }

  // Integer
  if (typeof valor === 'number') {
    return `${AMARILLO}(integer) ${valor}${RESET}`;
  }

  // Bulk String
  if (typeof valor === 'string') {
    return `${CYAN}"${valor}"${RESET}`;
  }

  // Array
  if (Array.isArray(valor)) {
    if (valor.length === 0) {
      return `${GRIS}(array vacio)${RESET}`;
    }

    return valor.map((elemento, i) => {
      const num = `${indent}${GRIS}${i + 1})${RESET} `;
      return num + formatearRespuesta(elemento, nivel + 1);
    }).join('\n');
  }

  return String(valor);
}

// ── Parser de respuestas del servidor (reutiliza RespParser) ──

/**
 * Parsea la respuesta RESP recibida del servidor y resuelve el resolver pendiente.
 * @param {Buffer} chunk
 * @param {RespParser} parser
 */
function manejarRespuesta(chunk, parser) {
  parser.feed(chunk);
}

// ── Serializar comando a RESP ─────────────────────────────────

/**
 * Convierte una linea de texto del usuario en un frame RESP Array.
 * Tokeniza respetando comillas simples y dobles.
 * @param {string} linea
 * @returns {string} Frame RESP listo para enviar
 */
function serializarComando(linea) {
  const tokens = tokenizar(linea);
  if (tokens.length === 0) return '';
  return RespSerializer.array(tokens);
}

/**
 * Tokeniza una linea respetando comillas.
 * @param {string} linea
 * @returns {string[]}
 */
function tokenizar(linea) {
  const tokens = [];
  let token = '';
  let dentroComillas = false;
  let tipoComilla = '';

  for (const char of linea.trim()) {
    if ((char === '"' || char === "'") && !dentroComillas) {
      dentroComillas = true;
      tipoComilla = char;
    } else if (char === tipoComilla && dentroComillas) {
      dentroComillas = false;
      tipoComilla = '';
    } else if (char === ' ' && !dentroComillas) {
      if (token) { tokens.push(token); token = ''; }
    } else {
      token += char;
    }
  }

  if (token) tokens.push(token);
  return tokens;
}

// ── Conexion TCP ──────────────────────────────────────────────

/**
 * Construye el string del prompt segun host, puerto y db activa.
 * @returns {string}
 */
function construirPrompt() {
  return `${CYAN}velo${RESET} ${HOST}:${PORT}[${dbActiva}]> `;
}

/**
 * Crea y devuelve una nueva conexion TCP al servidor Velo.
 * @returns {Promise<net.Socket>}
 */
function conectar() {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({ host: HOST, port: PORT }, () => {
      console.log(`\n[velo:cliente] Conectado a ${HOST}:${PORT}`);
      console.log('[velo:cliente] Escribe un comando o "exit" para salir.\n');
      resolve(s);
    });

    s.once('error', reject);
  });
}

// ── REPL principal ────────────────────────────────────────────

async function iniciarRepl() {
  // Intentar conectar al servidor
  try {
    socket = await conectar();
  } catch (err) {
    console.error(`${ROJO}[velo:cliente] No se pudo conectar a ${HOST}:${PORT}: ${err.message}${RESET}`);
    console.error(`[velo:cliente] Asegurate de que el servidor este corriendo con: make server`);
    process.exit(1);
  }

  // Parser para las respuestas del servidor
  const parserRespuesta = new RespParser();

  parserRespuesta.on('comando', (valor) => {
    const resolver = colaResolvers.shift();
    if (resolver) resolver(valor);
  });

  socket.on('data', (chunk) => {
    manejarRespuesta(chunk, parserRespuesta);
  });

  socket.on('close', () => {
    console.log(`\n${AMARILLO}[velo:cliente] Conexion cerrada por el servidor.${RESET}`);
    rl?.close();
    process.exit(0);
  });

  socket.on('error', (err) => {
    console.error(`\n${ROJO}[velo:cliente] Error de socket: ${err.message}${RESET}`);
  });

  // Interfaz readline para el REPL
  rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
    prompt: construirPrompt(),
    terminal: true,
    historySize: 200,
  });

  rl.prompt();

  rl.on('line', async (linea) => {
    const lineaTrimmed = linea.trim();

    if (!lineaTrimmed) {
      rl.prompt();
      return;
    }

    // Comandos locales del cliente
    if (lineaTrimmed.toLowerCase() === 'exit' || lineaTrimmed.toLowerCase() === 'quit') {
      console.log('[velo:cliente] Desconectando...');
      socket.destroy();
      rl.close();
      process.exit(0);
    }

    if (lineaTrimmed.toLowerCase() === 'clear') {
      process.stdout.write('\x1b[2J\x1b[0f');
      rl.setPrompt(construirPrompt());
      rl.prompt();
      return;
    }

    // Serializar y enviar el comando
    const frame = serializarComando(lineaTrimmed);
    if (!frame) {
      rl.prompt();
      return;
    }

    // Detectar SELECT localmente para actualizar el prompt
    const tokens = tokenizar(lineaTrimmed);
    const nombreCmd = tokens[0]?.toUpperCase();

    // Esperar la respuesta del servidor de forma asincrona
    const respuesta = await new Promise((resolve) => {
      colaResolvers.push(resolve);
      socket.write(frame);
    });

    // Si era SELECT y fue exitoso, actualizar db local
    if (nombreCmd === 'SELECT' && respuesta === 'OK') {
      const nuevoDb = parseInt(tokens[1], 10);
      if (!isNaN(nuevoDb)) {
        dbActiva = nuevoDb;
        rl.setPrompt(construirPrompt());
      }
    }

    // Imprimir la respuesta formateada
    console.log(formatearRespuesta(respuesta));
    rl.setPrompt(construirPrompt());
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n[velo:cliente] Sesion terminada.');
    socket?.destroy();
    process.exit(0);
  });
}

// ── Entrada ───────────────────────────────────────────────────

console.log('============================================================');
console.log(' Velo - Cliente REPL interactivo');
console.log(` Autor : ${pkg.author}`);
console.log(` Pkg   : ${pkg.name}  v${pkg.version}`);
console.log('============================================================');

iniciarRepl().catch((err) => {
  console.error(`${ROJO}[velo:cliente] Error fatal: ${err.message}${RESET}`);
  process.exit(1);
});
