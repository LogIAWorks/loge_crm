# LOGE CRM

CRM personalizado para LOGE S.L., diseñado para ejecutarse localmente en un Mac Mini y estar disponible 24/7. Integra gestión de leads, clientes, pagos e interacciones con automatización conectada a Claude y OpenClaw.

## Stack
- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + Vite + Tailwind CSS v3

## Requisitos
- Node.js (v18+)
- npm

## Instalación y Ejecución Local

1. En la carpeta raíz del proyecto, instala todas las dependencias:
   ```bash
   npm install
   ```
   *(Esto instalará tanto las dependencias del servidor como las del cliente).*

2. Para entorno de desarrollo (con autorecarga rápida en Frontend y Backend):
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

3. Para probar el modo de Producción (el que usa el Mac Mini):
   ```bash
   npm start
   ```
   El backend y frontend se compilarán y servirán en `http://localhost:3100`.

## Instalación Automática en Mac Mini (LaunchAgent)

Para que el CRM arranque siempre que el Mac Mini inicie:

1. Edita el archivo `com.logeworks.logecrm.plist` si es necesario, asegurándote de que la ruta al ejecutable de `npm` y la carpeta `logecrm` son correctas.
2. Copia el archivo `.plist` a la carpeta de LaunchAgents del sistema:
   ```bash
   cp com.logeworks.logecrm.plist ~/Library/LaunchAgents/
   ```
3. Carga el agente:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.logeworks.logecrm.plist
   ```
4. A partir de ahora, el servicio estará activo en `http://localhost:3100` y reiniciará automáticamente si falla o el Mac se reinicia.

## Notas sobre Seguridad y API
- Para que OpenClaw y Claude puedan consultar la API interna (ej: `GET /api/leads`), deben enviar el header:
  `X-CRM-API-KEY: loge123` (configurable en Settings).
- La URL base de OpenClaw se puede configurar desde el panel de ajustes (Settings) en la propia aplicación.
