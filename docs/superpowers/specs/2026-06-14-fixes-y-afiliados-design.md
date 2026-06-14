# LogeCRM — Arreglos + Módulo de Afiliados (2026-06-14)

## Contexto
CRM interno de Loge S.L. (React + Vite frontend en :5173, Express + SQLite backend en :3100).
Páginas: Dashboard, Pipeline, Clientes, Tareas, Interacciones, Pagos, Ajustes.
Datos reales que NO se deben tocar: leads id 4-12, clients id 4-6, interactions id 1/3/4, payments id 1-17.

## Parte A — Arreglos
1. **Vista 360°** (`Company360Modal`) está programada pero no se usa. Conectarla mediante un botón aparte en las filas de Clientes y Pipeline (el clic en la fila sigue abriendo edición).
2. **Header** sin título para `/tasks` y `/affiliates`. Añadir.
3. **Token API** de Ajustes no se aplica (frontend hardcodea `loge123`, backend siempre lo acepta). Hacer que el token guardado se use; mantener compatibilidad.
4. **Fechas UTC** → calcular "hoy" en horario Europe/Madrid (backend dashboard/alerts/report y comparaciones frontend).
5. **Comparación de fecha** de revisión en Clientes normalizada a solo fecha.
6. Bugs adicionales detectados al probar en vivo con Playwright.

## Parte B — Afiliados / Colaboradores
### Modelo de datos
Nueva tabla `affiliates`: `id, nombre, telefono, email, comision_pct REAL, iban, nif, tipo, notas, created_at`.
Migración en `payments`: `afiliado_id INTEGER, comision_pct REAL, comision_estado TEXT` (pendiente/pagada).

### Comisiones
- % por colaborador (default editable por cobro).
- Se asigna en el formulario de Pagos: selector de colaborador + % (autorrellenado) → comisión = `importe × % / 100`.
- Comisión sobre lo cobrado. Estado pendiente/pagada por cobro.

### API
- CRUD `/api/affiliates`.
- `GET /api/affiliates/summary` → por afiliado: ventas generadas, comisión total, pendiente, pagada.
- Reusar `PATCH /api/payments/:id` para marcar comisión pagada.

### Frontend
- Página `Affiliates.tsx` + ruta + item en Sidebar.
- CRUD de afiliados (tabla + modal igual que el resto).
- 3 tarjetas resumen: total generado / pendiente / pagado.
- Lista de comisiones con botón "Marcar como pagada".
- Formulario de Pagos: bloque opcional Colaborador + % + comisión calculada + estado.
- Dashboard: aviso de comisiones pendientes.

## Parte C — Test + limpieza
- Playwright recorre cada página y acción (CRUD en todas las entidades + afiliados, drag&drop pipeline, informe semanal, ajustes, ficha 360, comisiones).
- Datos de test con prefijo `ZZTEST_`. Al final borrar solo lo `ZZTEST_`, dejando intactos los datos reales.
