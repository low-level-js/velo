/**
 * RespSerializer.js
 * Serializa valores JavaScript al formato RESP para enviarlos por el socket TCP.
 *
 * Tipos generados:
 *   +  Simple String   →  "+OK\r\n"
 *   -  Error           →  "-ERR mensaje\r\n"
 *   :  Integer         →  ":42\r\n"
 *   $  Bulk String     →  "$5\r\nhello\r\n"
 *   $  Null            →  "$-1\r\n"
 *   *  Array           →  "*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n"
 *
 * Todos los metodos devuelven strings (no Buffer) por simplicidad.
 * El socket los acepta directamente con socket.write(string).
 */

const CRLF = '\r\n';

export class RespSerializer {
  /**
   * Serializa un Simple String (respuestas de estado como OK, PONG, etc.)
   * @param {string} valor
   * @returns {string}
   */
  static simpleString(valor) {
    return `+${valor}${CRLF}`;
  }

  /**
   * Serializa un mensaje de Error.
   * @param {string} mensaje - Si no tiene prefijo de tipo, se agrega ERR automaticamente
   * @returns {string}
   */
  static error(mensaje) {
    // Prefijos estandar: ERR, WRONGTYPE, NOSCRIPT, BUSYKEY, etc.
    const tienePrefijo = /^[A-Z]+\s/.test(mensaje);
    const texto = tienePrefijo ? mensaje : `ERR ${mensaje}`;
    return `-${texto}${CRLF}`;
  }

  /**
   * Serializa un Integer.
   * @param {number} valor
   * @returns {string}
   */
  static integer(valor) {
    return `:${valor}${CRLF}`;
  }

  /**
   * Serializa un Bulk String.
   * @param {string|Buffer} valor
   * @returns {string}
   */
  static bulkString(valor) {
    if (valor === null || valor === undefined) {
      return RespSerializer.nullBulk();
    }

    const contenido = valor instanceof Buffer ? valor.toString('utf-8') : String(valor);
    return `$${Buffer.byteLength(contenido, 'utf-8')}${CRLF}${contenido}${CRLF}`;
  }

  /**
   * Serializa un Null Bulk String (representa ausencia de valor).
   * @returns {string}
   */
  static nullBulk() {
    return `$-1${CRLF}`;
  }

  /**
   * Serializa un Array RESP.
   * Cada elemento del array se serializa segun su tipo:
   *   - null/undefined  → Null Bulk String
   *   - number          → Integer
   *   - string          → Bulk String
   *   - Array           → Array anidado (recursivo)
   *   - { ok: string }  → Simple String
   *   - { err: string } → Error
   * @param {Array|null} elementos
   * @returns {string}
   */
  static array(elementos) {
    if (elementos === null || elementos === undefined) {
      return `*-1${CRLF}`;
    }

    const partes = [`*${elementos.length}${CRLF}`];

    for (const elemento of elementos) {
      partes.push(RespSerializer.serializar(elemento));
    }

    return partes.join('');
  }

  /**
   * Serializa automaticamente un valor segun su tipo JavaScript.
   * Es el metodo principal que usa ClientConnection para construir respuestas.
   *
   * Convencion de retorno de Use Cases:
   *   { ok: 'OK' }      → Simple String "+OK\r\n"
   *   { err: 'mensaje' }→ Error "-ERR mensaje\r\n"
   *   number            → Integer ":n\r\n"
   *   string            → Bulk String "$n\r\nvalor\r\n"
   *   null              → Null Bulk String "$-1\r\n"
   *   string[]          → Array "*n\r\n..."
   *
   * @param {*} valor
   * @returns {string}
   */
  static serializar(valor) {
    if (valor === null || valor === undefined) {
      return RespSerializer.nullBulk();
    }

    if (typeof valor === 'object' && 'ok' in valor) {
      return RespSerializer.simpleString(valor.ok);
    }

    if (typeof valor === 'object' && 'err' in valor) {
      return RespSerializer.error(valor.err);
    }

    if (typeof valor === 'number') {
      return RespSerializer.integer(valor);
    }

    if (typeof valor === 'string') {
      return RespSerializer.bulkString(valor);
    }

    if (Array.isArray(valor)) {
      return RespSerializer.array(valor);
    }

    // Fallback: convertir a string
    return RespSerializer.bulkString(String(valor));
  }
}
