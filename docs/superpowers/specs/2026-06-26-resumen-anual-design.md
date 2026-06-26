# Pestaña "Resumen Anual"

Fecha: 2026-06-26

## Objetivo

Nueva pestaña en el sidebar con una vista anual de ingresos cobrados, con selector de año
(flechas) para navegar entre años (2026, 2027, 2028…). Complementa la gráfica de "últimos 6
meses" del dashboard, que solo muestra una ventana móvil.

## Decisiones (acordadas con el usuario)

- Pestaña propia en el sidebar, llamada **"Resumen Anual"**, ruta `/annual`.
- Contenido: **gráfica de barras de 12 meses** (Ene→Dic) de ingresos **cobrados** del año
  elegido + **tarjetas resumen**: total del año, media mensual, mejor mes.
- Selector de año con **flechas** `‹ 2026 ›`. Empieza en el año actual; años sin datos = barras a 0.
- 100% dinámico (sin meses ni años hardcodeados).

## Diseño

### Routing y navegación
- `frontend/src/components/Sidebar.tsx`: añadir item `{ name: 'Resumen Anual', path: '/annual', icon: BarChart3 }`.
- `frontend/src/App.tsx`: importar `Annual` y añadir `<Route path="/annual" element={<Annual />} />`.

### Página `frontend/src/pages/Annual.tsx`
- Carga todos los pagos vía `api('/api/payments')` (mismo patrón que Payments/Clients).
- Estado `year` inicializado a `new Date().getFullYear()`. Flechas `setYear(y ± 1)`.
- Fecha de un pago: `coalesce(fecha_prevista_cobro, fecha_vencimiento, fecha)` (igual que el
  resto del CRM). Solo cuentan los pagos con `estado === 'cobrado'`.
- Serie mensual: para cada mes `m` (0–11), `ym = "${year}-${MM}"`; total = Σ importes de
  pagos cobrados cuya fecha empiece por `ym`.
- Tarjetas: total del año = Σ serie; media mensual = total / 12; mejor mes = mes con mayor total.
- Gráfica de barras reutilizando el estilo del dashboard (gradiente brand). Contenedor con
  `overflow-x-auto` y ancho mínimo para que las 12 barras se lean en móvil (responsive).
- Formato moneda: `€${n.toLocaleString('es-ES')}`.

## Fuera de alcance
- No se toca el dashboard ni el resto de páginas.
- No se añaden columnas ni endpoints (cálculo en frontend desde `payments`).

## Verificación
- Playwright: entrar, abrir "Resumen Anual", comprobar 12 meses (Ene–Dic) y que la barra de
  junio refleja el total real; navegar a 2027 (barras a 0) y volver a 2026.
