# Sincronización de pagos en el CRM (Pagos como única fuente de verdad)

Fecha: 2026-06-26

## Problema

El CRM tiene dos mundos de "pagos" desconectados:

1. **Tabla `payments`** (página Pagos): cada cobro tiene `estado`
   (`pendiente`/`cobrado`/`parcial`/`vencido`), `importe`, `fecha`, `cliente`, `client_id`.
   Es donde se gestionan los cobros realmente.
2. **Tabla `clients`** (ficha de cliente): tiene campos propios e independientes
   `estado_pago` (`Al día`/`Pendiente`/`Retraso`/`Moroso`), `cobrado`, `pendiente`.
   - `estado_pago` es un desplegable **manual** que no mira los pagos reales.
   - `cobrado`/`pendiente` existen en BD pero **ningún código los rellena**, siempre valen 0.

Consecuencias observadas por el usuario:
- En **Clientes**, marcar un pago como cobrado no cambia el semáforo (sigue amarillo) ni
  muestra "Cobrado" (importes siempre a 0).
- En **Dashboard → "Cobrado (Mes)"**, el filtro usa solo la columna `fecha` y exige que
  caiga en el mes actual; pagos con la fecha en otra columna (`fecha_prevista_cobro`/
  `fecha_vencimiento`) no suman aunque estén cobrados.

## Decisiones (acordadas con el usuario)

1. **Pagos es la única fuente de verdad.** El estado de pago e importes del cliente se
   **derivan** de sus pagos. Ya no se editan a mano.
2. **Fecha de cobro automática:** al marcar un pago como `cobrado`, si la fecha está
   vacía o es futura se registra la fecha de cobro = hoy. Así "marcar cobrado" siempre
   cuenta en el mes en curso, sin pasos manuales. Reutiliza la columna `fecha` (sin columna nueva).
3. **Semáforo de cliente, 3 niveles por vencimiento:**
   - 🟢 `Al día` = sin pagos sin cobrar.
   - 🟡 `Pendiente` = tiene pagos sin cobrar pero no vencidos (fecha futura o sin fecha).
   - 🔴 `Retraso` = tiene pagos sin cobrar con fecha ya pasada.
   - `—` (gris) = sin ningún pago registrado.
4. **Fechas de seguimiento opcionales** en todo el CRM (clientes ya cerrados/pagados no
   necesitan seguimiento).

## Diseño

### Cálculo derivado (frontend, sin tocar BD)

En [Clients.tsx](../../../frontend/src/pages/Clients.tsx) la página carga también los pagos
(`/api/payments`) y, por cada cliente, cruza sus pagos:
- Un pago pertenece al cliente si `p.client_id === c.id` o, en su defecto, `p.cliente === c.empresa`.
- `cobrado` = Σ importes de pagos con `estado === 'cobrado'`.
- `pendiente` = Σ importes de pagos con `estado !== 'cobrado'`.
- `estado_pago` derivado según la regla de 3 niveles; `'—'` si no tiene pagos.
- Fecha del pago para "vencido": `coalesce(fecha_prevista_cobro, fecha_vencimiento, fecha)`,
  comparada con hoy (Europe/Madrid).

`getCobrado`/`getPendiente`/`getEstadoPago` leen de este cálculo, no de columnas de BD.
Se elimina el desplegable manual "Estado Pago" del formulario y se deja de enviar al guardar.
El color del semáforo pasa a 3 estados (verde/amarillo/rojo) + gris para `'—'`.

### Dashboard "Cobrado (Mes)"

En [api.ts](../../../frontend/src/api.ts):
- Helper `paymentDate(p) = coalesce(p, 'fecha_prevista_cobro', 'fecha_vencimiento', 'fecha')`.
- `cobradoMes` y `revenueByMonth` usan `paymentDate(p)` (en vez de solo `p.fecha`) para
  decidir el mes; se mantiene el filtro `estado === 'cobrado'`.

### Fecha de cobro automática + aviso

En [Payments.tsx](../../../frontend/src/pages/Payments.tsx):
- Al cambiar el estado a `cobrado`, si la fecha está vacía o es futura, se pone hoy
  automáticamente (`onChange` del selector de estado). Salvaguarda equivalente en
  `handleSubmit` para que ningún cobro se guarde con fecha futura/vacía.
- Si aun así se deja una fecha futura en un cobro (edición manual), se muestra un aviso
  ámbar bajo el campo de fecha. No bloquea el guardado.

Motivo: el usuario cobra en el momento (mes actual) pero los pagos llevan una fecha
*prevista* futura; con la regla anterior ("usar la fecha tal cual") el cobro aparecía en
un mes futuro. La fecha automática hace que "marcar cobrado" se refleje siempre en el mes
en curso (validado en flujo real: Guridi Parte 2 de pendiente→cobrado, dashboard
3.114,64 € → 3.387,50 €).

### Reinicio mensual (comportamiento dinámico, ya existente)

`cobradoMes` y `revenueByMonth` calculan el rango con la fecha actual
(`startOfMonth()`/`today()`), por lo que al cambiar de mes el contador "se reinicia" solo y
pasa a contar el nuevo mes. Verificado simulando 2026-07-01 (resultado 0 € hasta que haya
cobros con fecha de julio).

### Fechas de seguimiento opcionales

Quitar `required` de:
- Clientes: "Próxima Revisión" ([Clients.tsx](../../../frontend/src/pages/Clients.tsx)).
- Leads/Pipeline: "Próximo follow-up" y "Último contacto"
  ([Pipeline.tsx](../../../frontend/src/pages/Pipeline.tsx)).
- Tareas: la fecha límite ya es opcional.

Las alertas del dashboard ya ignoran fechas vacías, por lo que dejarlas en blanco no genera avisos.

## Fuera de alcance

- No se modifica el esquema de Supabase (las columnas `estado_pago`/`cobrado`/`pendiente`
  quedan sin uso, sin riesgo de romper datos).
- La página de Pagos no cambia (ya es la fuente de verdad).
- Vista 360° ya calcula "Total Facturado" desde pagos cobrados; se mantiene.

## Verificación

- Lanzar en local (`npm run dev`) con `frontend/.env` (claves públicas de Supabase).
- Con Playwright: marcar un pago como cobrado y comprobar que (a) el cliente pasa a verde
  "Al día"/muestra "Cobrado" y (b) "Cobrado (Mes)" del dashboard refleja el importe.
- Comprobar que se puede guardar un cliente/lead sin fecha de seguimiento.
