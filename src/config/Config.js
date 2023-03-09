/**
 * Config.js
 * Lee y expone la configuracion del archivo .env ubicado en la raiz del proyecto.
 * No utiliza dependencias externas, solo el modulo fs nativo de Node.js.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Parsea un archivo .env con el formato KEY=VALUE.
 * Ignora lineas vacias y comentarios (que comienzan con #).
 * @param {string} filePath - Ruta absoluta al archivo .env
 * @returns {Record<string, string>} Objeto con las variables encontradas
 */
function parseEnvFile(filePath) {
  let contenido;

  try {
    contenido = readFileSync(filePath, 'utf-8');
  } catch {
    // Si no existe el archivo .env se continua con variables de entorno del sistema
    return {};
  }

  const resultado = {};

  for (const linea of contenido.split('\n')) {
    const lineaTrimmed = linea.trim();

    // Ignorar lineas vacias y comentarios
    if (!lineaTrimmed || lineaTrimmed.startsWith('#')) continue;

    const indiceIgual = lineaTrimmed.indexOf('=');
    if (indiceIgual === -1) continue;

    const clave = lineaTrimmed.slice(0, indiceIgual).trim();
    const valor = lineaTrimmed.slice(indiceIgual + 1).trim();

    // Eliminar comillas simples o dobles alrededor del valor
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      resultado[clave] = valor.slice(1, -1);
    } else {
      resultado[clave] = valor;
    }
  }

  return resultado;
}

// Ruta al archivo .env en la raiz del proyecto (dos niveles arriba de src/config/)
const rutaEnv = resolve(__dirname, '../../.env');
const variablesEnv = parseEnvFile(rutaEnv);

/**
 * Obtiene el valor de una variable: primero busca en process.env (permite
 * sobreescribir desde el sistema operativo), luego en el .env, y finalmente
 * devuelve el valor por defecto si ninguno esta disponible.
 * @param {string} clave
 * @param {string} [valorDefecto]
 * @returns {string}
 */
function obtener(clave, valorDefecto = '') {
  return process.env[clave] ?? variablesEnv[clave] ?? valorDefecto;
}

/**
 * Configuracion global del servidor Velo.
 * Singleton inmutable exportado para toda la aplicacion.
 */
const Config = Object.freeze({
  /** Host en el que escucha el servidor TCP */
  HOST: obtener('HOST', '127.0.0.1'),

  /** Puerto del servidor TCP */
  PORT: parseInt(obtener('PORT', '6380'), 10),

  /** Maximo de conexiones simultaneas permitidas */
  MAX_CONNECTIONS: parseInt(obtener('MAX_CONNECTIONS', '100'), 10),

  /** Nivel de log: debug | info | warn | error */
  LOG_LEVEL: obtener('LOG_LEVEL', 'info'),

  /** Numero de bases de datos disponibles */
  DB_COUNT: parseInt(obtener('DB_COUNT', '16'), 10),

  /** Intervalo en ms para el sweep de claves expiradas */
  SWEEP_INTERVAL_MS: parseInt(obtener('SWEEP_INTERVAL_MS', '1000'), 10),
});

export default Config;
