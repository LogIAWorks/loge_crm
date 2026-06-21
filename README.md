# LOGE CRM

CRM personalizado para LOGE S.L. Gestiona leads, clientes, pagos, interacciones, tareas, calendario y comisiones de colaboradores.

## Stack
- **Frontend**: React + Vite + Tailwind CSS v3 + TypeScript
- **Backend / Datos / Auth**: **Supabase** (PostgreSQL + Auth). El frontend habla directamente con Supabase a través de `frontend/src/api.ts`.

> Nota: la carpeta `backend/` (Express + SQLite) corresponde a la primera versión y **ya no se usa**: toda la lógica de datos vive ahora en Supabase. Se mantiene solo como referencia histórica.

## Requisitos
- Node.js v18+
- Una cuenta/proyecto de Supabase

## Configuración
Crea `frontend/.env` con las claves **públicas** de tu proyecto Supabase:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

> La `anon key` es pública por diseño; la seguridad real la dan las **políticas RLS** de Supabase (activadas). Nunca pongas la `service_role` key en el frontend.

## Instalación y ejecución (desarrollo)
```bash
cd frontend
npm install
npm run dev
```
La app queda en `http://localhost:5173`.

## Build de producción
```bash
cd frontend
npm run build      # genera frontend/dist
```
El despliegue se hace con Netlify (ver `netlify.toml`).

## Autenticación
Los usuarios inician sesión con usuario (ej. `edu`, `oscar`) que internamente se mapea a `usuario@loge.es` contra Supabase Auth. Para añadir o restablecer usuarios, usa el panel de Supabase → Authentication → Users.

## Integraciones (opcionales)
En **Ajustes** se pueden guardar las claves de Claude API y OpenClaw. Se almacenan en la tabla `settings` de Supabase; el formulario es de solo escritura (no muestra el valor guardado).
