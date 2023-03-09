/**
 * CommandRegistry.js
 * Registro central de todos los comandos disponibles en el servidor.
 * Mapea nombre de comando (string en mayusculas) a su instancia de handler.
 *
 * Para agregar un nuevo comando:
 *   1. Crear el archivo en src/application/usecases/phaseN/
 *   2. Importarlo aqui y registrarlo en el constructor
 */

// ── Fase 1: Strings ──────────────────────────────────────────
import { SetCommand }    from './usecases/phase1/strings/SetCommand.js';
import { GetCommand }    from './usecases/phase1/strings/GetCommand.js';
import { DelCommand }    from './usecases/phase1/strings/DelCommand.js';
import { ExistsCommand } from './usecases/phase1/strings/ExistsCommand.js';
import { ExpireCommand } from './usecases/phase1/strings/ExpireCommand.js';
import { TtlCommand }    from './usecases/phase1/strings/TtlCommand.js';
import { IncrCommand }   from './usecases/phase1/strings/IncrCommand.js';
import { DecrCommand }   from './usecases/phase1/strings/DecrCommand.js';
import { MgetCommand }   from './usecases/phase1/strings/MgetCommand.js';
import { MsetCommand }   from './usecases/phase1/strings/MsetCommand.js';
import { AppendCommand } from './usecases/phase1/strings/AppendCommand.js';
import { StrlenCommand } from './usecases/phase1/strings/StrlenCommand.js';
import { SetnxCommand }  from './usecases/phase1/strings/SetnxCommand.js';
import { SetexCommand }  from './usecases/phase1/strings/SetexCommand.js';
import { GetexCommand }  from './usecases/phase1/strings/GetexCommand.js';

// ── Fase 1: Servidor ─────────────────────────────────────────
import { PingCommand }    from './usecases/phase1/server/PingCommand.js';
import { EchoCommand }    from './usecases/phase1/server/EchoCommand.js';
import { DbsizeCommand }  from './usecases/phase1/server/DbsizeCommand.js';
import { FlushallCommand }from './usecases/phase1/server/FlushallCommand.js';
import { KeysCommand }    from './usecases/phase1/server/KeysCommand.js';
import { TypeCommand }    from './usecases/phase1/server/TypeCommand.js';
import { RenameCommand }  from './usecases/phase1/server/RenameCommand.js';
import { SelectCommand }  from './usecases/phase1/server/SelectCommand.js';

export class CommandRegistry {
  constructor() {
    /**
     * Mapa de nombre en mayusculas → instancia del handler
     * @type {Map<string, object>}
     */
    this._comandos = new Map();

    this._registrarFase1();
  }

  /**
   * Registra todos los comandos de la Fase 1.
   */
  _registrarFase1() {
    const handlers = [
      // Strings
      new SetCommand(),
      new GetCommand(),
      new DelCommand(),
      new ExistsCommand(),
      new ExpireCommand(),
      new TtlCommand(),
      new IncrCommand(),
      new DecrCommand(),
      new MgetCommand(),
      new MsetCommand(),
      new AppendCommand(),
      new StrlenCommand(),
      new SetnxCommand(),
      new SetexCommand(),
      new GetexCommand(),
      // Servidor
      new PingCommand(),
      new EchoCommand(),
      new DbsizeCommand(),
      new FlushallCommand(),
      new KeysCommand(),
      new TypeCommand(),
      new RenameCommand(),
      new SelectCommand(),
    ];

    for (const handler of handlers) {
      const nombre = handler.constructor.nombre;
      this._comandos.set(nombre, handler);
    }
  }

  /**
   * Ejecuta un comando por nombre.
   * @param {string} nombre - Nombre del comando en mayusculas
   * @param {string[]} args - Argumentos del comando
   * @param {import('../infrastructure/storage/InMemoryStore.js').InMemoryStore} store
   * @param {number} db - Indice de la base de datos activa
   * @returns {*} Resultado del comando para serializar
   */
  execute(nombre, args, store, db) {
    const handler = this._comandos.get(nombre);

    if (!handler) {
      return { err: `ERR comando desconocido: '${nombre.toLowerCase()}'` };
    }

    return handler.execute(store, args, db);
  }

  /**
   * Devuelve la lista de nombres de comandos registrados.
   * @returns {string[]}
   */
  listarComandos() {
    return Array.from(this._comandos.keys()).sort();
  }
}
