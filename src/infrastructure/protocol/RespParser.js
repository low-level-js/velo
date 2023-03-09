/**
 * RespParser.js
 * Parser incremental del protocolo RESP (serialization protocol).
 *
 * Tipos soportados:
 *   +  Simple String   →  "+OK\r\n"
 *   -  Error           →  "-ERR mensaje\r\n"
 *   :  Integer         →  ":42\r\n"
 *   $  Bulk String     →  "$5\r\nhello\r\n"  |  "$-1\r\n" (null)
 *   *  Array           →  "*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n"
 *
 * El parser es incremental: acumula fragmentos de Buffer entre paquetes TCP
 * y emite comandos completos a medida que llegan.
 *
 * Uso:
 *   const parser = new RespParser();
 *   parser.on('comando', (args) => manejar(args));
 *   socket.on('data', (chunk) => parser.feed(chunk));
 */

import { EventEmitter } from 'events';

export class RespParser extends EventEmitter {
  constructor() {
    super();

    /**
     * Buffer interno que acumula los bytes recibidos via TCP.
     * Se usa concatenacion con Buffer.concat para eficiencia.
     * @type {Buffer}
     */
    this._buffer = Buffer.alloc(0);
  }

  /**
   * Alimenta nuevos bytes al parser.
   * Intenta parsear todos los mensajes completos que esten en el buffer.
   * @param {Buffer} chunk - Fragmento de datos recibido del socket TCP
   */
  feed(chunk) {
    this._buffer = Buffer.concat([this._buffer, chunk]);
    this._procesarBuffer();
  }

  /**
   * Intenta parsear mensajes completos del buffer interno.
   * Mientras haya datos suficientes, parsea y emite eventos.
   */
  _procesarBuffer() {
    while (this._buffer.length > 0) {
      const resultado = this._parsear(0);

      if (resultado === null) {
        // No hay suficientes datos para un mensaje completo: esperar mas
        break;
      }

      const { valor, avance } = resultado;

      // Consumir los bytes procesados del buffer
      this._buffer = this._buffer.slice(avance);

      // Emitir el comando completo (siempre debe ser un Array de strings)
      this.emit('comando', valor);
    }
  }

  /**
   * Parsea un valor RESP a partir de la posicion indicada en el buffer.
   * @param {number} offset - Posicion inicial de lectura en el buffer
   * @returns {{ valor: *, avance: number }|null} Resultado o null si incompleto
   */
  _parsear(offset) {
    if (offset >= this._buffer.length) return null;

    const tipo = String.fromCharCode(this._buffer[offset]);

    switch (tipo) {
      case '+': return this._parsearLineaSimple(offset + 1);
      case '-': return this._parsearLineaSimple(offset + 1);
      case ':': return this._parsearEntero(offset + 1);
      case '$': return this._parsearBulkString(offset + 1);
      case '*': return this._parsearArray(offset + 1);
      default:
        // Protocolo inline: clientes que envian comandos como texto plano
        // ej: "PING\r\n" sin el prefijo RESP
        return this._parsearInline(offset);
    }
  }

  /**
   * Parsea una linea que termina en CRLF.
   * @param {number} offset
   * @returns {{ valor: string, avance: number }|null}
   */
  _parsearLinea(offset) {
    const idx = this._buffer.indexOf('\r\n', offset);
    if (idx === -1) return null;

    const linea = this._buffer.toString('utf-8', offset, idx);
    return { valor: linea, avance: idx + 2 };
  }

  /**
   * Parsea Simple String o Error (una linea terminada en CRLF).
   * @param {number} offset
   * @returns {{ valor: string, avance: number }|null}
   */
  _parsearLineaSimple(offset) {
    return this._parsearLinea(offset);
  }

  /**
   * Parsea un Integer RESP.
   * @param {number} offset
   * @returns {{ valor: number, avance: number }|null}
   */
  _parsearEntero(offset) {
    const resultado = this._parsearLinea(offset);
    if (!resultado) return null;
    return { valor: parseInt(resultado.valor, 10), avance: resultado.avance };
  }

  /**
   * Parsea un Bulk String RESP.
   * Soporta null bulk string ($-1\r\n).
   * @param {number} offset
   * @returns {{ valor: string|null, avance: number }|null}
   */
  _parsearBulkString(offset) {
    const longitudRes = this._parsearLinea(offset);
    if (!longitudRes) return null;

    const longitud = parseInt(longitudRes.valor, 10);

    // Null bulk string
    if (longitud === -1) {
      return { valor: null, avance: longitudRes.avance };
    }

    // Verificar que hay suficientes bytes para el contenido + CRLF final
    const inicio = longitudRes.avance;
    const fin = inicio + longitud;

    if (this._buffer.length < fin + 2) return null;

    const contenido = this._buffer.toString('utf-8', inicio, fin);
    return { valor: contenido, avance: fin + 2 };
  }

  /**
   * Parsea un Array RESP.
   * Soporta arrays nulos (*-1\r\n) y arrays vacios (*0\r\n).
   * @param {number} offset
   * @returns {{ valor: Array, avance: number }|null}
   */
  _parsearArray(offset) {
    const conteoRes = this._parsearLinea(offset);
    if (!conteoRes) return null;

    const conteo = parseInt(conteoRes.valor, 10);

    // Array nulo
    if (conteo === -1) {
      return { valor: null, avance: conteoRes.avance };
    }

    const elementos = [];
    let posActual = conteoRes.avance;

    for (let i = 0; i < conteo; i++) {
      const elemento = this._parsear(posActual);
      if (!elemento) return null;

      elementos.push(elemento.valor);
      posActual = elemento.avance;
    }

    return { valor: elementos, avance: posActual };
  }

  /**
   * Parsea un comando en formato inline (texto plano separado por espacios).
   * Permite compatibilidad con herramientas simples como netcat o telnet.
   * Ej: "PING\r\n" o "SET clave valor\r\n"
   * @param {number} offset
   * @returns {{ valor: string[], avance: number }|null}
   */
  _parsearInline(offset) {
    const idx = this._buffer.indexOf('\r\n', offset);
    if (idx === -1) return null;

    const linea = this._buffer.toString('utf-8', offset, idx).trim();
    if (!linea) return null;

    // Separar por espacios respetando comillas simples y dobles
    const tokens = [];
    let token = '';
    let dentroComillas = false;
    let tipoComilla = '';

    for (const char of linea) {
      if ((char === '"' || char === "'") && !dentroComillas) {
        dentroComillas = true;
        tipoComilla = char;
      } else if (char === tipoComilla && dentroComillas) {
        dentroComillas = false;
        tipoComilla = '';
      } else if (char === ' ' && !dentroComillas) {
        if (token) {
          tokens.push(token);
          token = '';
        }
      } else {
        token += char;
      }
    }

    if (token) tokens.push(token);

    return { valor: tokens, avance: idx + 2 };
  }

  /**
   * Limpia el buffer interno. Util al cerrar la conexion.
   */
  reset() {
    this._buffer = Buffer.alloc(0);
  }
}
