# ============================================================
# Velo — Almacen de datos en memoria
# Autor: Joel Jaime <joel@alblandino.com>
# ============================================================

.PHONY: server client dev install clean info

# Carga las variables del archivo .env para usarlas en el Makefile
ifneq (,$(wildcard .env))
  include .env
  export
endif

# Puerto con valor por defecto si el archivo .env no esta disponible
PORT ?= 6380
HOST ?= 127.0.0.1

# ── Comandos principales ──────────────────────────────────────

## Inicia el servidor TCP de Velo
server:
	@echo "[velo] Iniciando servidor en $(HOST):$(PORT)..."
	node src/server.js

## Abre el cliente REPL interactivo conectado al servidor
client:
	@echo "[velo] Conectando cliente a $(HOST):$(PORT)..."
	node src/client.js

## Inicia el servidor en modo desarrollo (recarga automatica al guardar)
dev:
	@echo "[velo] Modo desarrollo activo - recarga automatica habilitada"
	node --watch src/server.js

## Instala las dependencias del proyecto (ninguna por ahora, solo confirma)
install:
	@echo "[velo] Sin dependencias externas. Node.js >= 20 requerido."
	node --version

## Elimina archivos generados y temporales
clean:
	@echo "[velo] Limpiando archivos temporales..."
	@if exist logs\NUL rmdir /s /q logs 2>nul || true

## Muestra informacion del proyecto y configuracion activa
info:
	@echo "============================================"
	@echo " Velo - Almacen de datos en memoria"
	@echo " Autor : Joel Jaime <joel@alblandino.com>"
	@echo " Pkg   : @low-level-js/velo"
	@echo "============================================"
	@echo " HOST              : $(HOST)"
	@echo " PORT              : $(PORT)"
	@echo " MAX_CONNECTIONS   : $(MAX_CONNECTIONS)"
	@echo " LOG_LEVEL         : $(LOG_LEVEL)"
	@echo " DB_COUNT          : $(DB_COUNT)"
	@echo " SWEEP_INTERVAL_MS : $(SWEEP_INTERVAL_MS)"
	@echo "============================================"
