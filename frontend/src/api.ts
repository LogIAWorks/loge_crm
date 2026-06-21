// Capa de datos del CRM sobre Supabase (sustituye al backend Express + SQLite).
// Expone api(path, options) compatible con fetch, para que las páginas casi no cambien.
import { supabase } from './supabase';

// "Hoy" en horario de Madrid (YYYY-MM-DD).
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
const startOfMonth = () => today().slice(0, 8) + '01';
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
};

// Lee el primer valor no vacío entre varias claves (esquema antiguo/nuevo).
const coalesce = (o: any, ...keys: string[]) => {
  for (const k of keys) { if (o[k] != null && o[k] !== '') return o[k]; }
  return null;
};

const TABLES = ['leads', 'clients', 'interactions', 'payments', 'tasks', 'affiliates'];

// Respuesta tipo fetch para no tocar el código de las páginas.
const ok = (body: any) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number, error: string) => ({ ok: false, status, json: async () => ({ error }) });

async function getAll(table: string) {
  const { data, error } = await supabase.from(table).select('*').order('id', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---- Agregados (antes endpoints del backend) ----

async function dashboard() {
  const t = today();
  const [leads, clients, payments, tasks] = await Promise.all([
    getAll('leads'), getAll('clients'), getAll('payments'), getAll('tasks'),
  ]);
  const leadActivo = (l: any) => !l.estado || !['Cerrado', 'Perdido'].includes(l.estado);
  const leadFollow = (l: any) => coalesce(l, 'proximo_follow_up', 'fecha_proxima_accion');
  const activeLeads = leads.filter(leadActivo);
  const overdueLeads = activeLeads
    .filter(l => { const f = leadFollow(l); return f && f < t; })
    .sort((a, b) => (leadFollow(a) > leadFollow(b) ? 1 : -1))
    .slice(0, 10)
    .map(l => ({ id: l.id, empresa: l.empresa, contacto: l.contacto, follow_up: leadFollow(l), interes: coalesce(l, 'interes_principal', 'servicio_interesado'), nota_corta: l.nota_corta, notas: l.notas }));
  const pendientes = payments.filter(p => !p.estado || p.estado !== 'cobrado');
  // Los clientes de Baja no tienen nada que revisar: fuera de los avisos de revisión.
  const clienteRevisable = (c: any) => c.estado_cliente !== 'Baja' && c.proxima_revision && c.proxima_revision !== '' && c.proxima_revision < t;
  const overdueClients = clients
    .filter(clienteRevisable)
    .sort((a, b) => (a.proxima_revision > b.proxima_revision ? 1 : -1))
    .slice(0, 10)
    .map(c => ({ id: c.id, empresa: c.empresa, servicio: c.servicio_contratado || '', proxima_revision: c.proxima_revision, notas: c.notas || '' }));
  const recentTasks = tasks
    .filter(t2 => !t2.estado || t2.estado !== 'Completado')
    .sort((a, b) => ((a.fecha_limite || '') > (b.fecha_limite || '') ? 1 : -1))
    .slice(0, 5);

  // Ingresos cobrados de los últimos 6 meses (para la gráfica de barras)
  const now = new Date();
  const revenueByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-ES', { month: 'short' });
    const total = payments
      .filter(p => p.estado === 'cobrado' && String(coalesce(p, 'fecha') || '').slice(0, 7) === ym)
      .reduce((s, p) => s + (Number(p.importe) || 0), 0);
    revenueByMonth.push({ label, total });
  }

  // Embudo de ventas: nº de leads por estado
  const FUNNEL = ['Prospecto', 'Contactado', 'Reunión Agendada', 'Propuesta Enviada', 'Esperando respuesta', 'Cerrado'];
  const pipelineFunnel = FUNNEL.map(estado => ({ estado, count: leads.filter(l => (l.estado || 'Prospecto') === estado).length }));

  // Alertas "Requiere acción" — calculadas aquí para no recargar las tablas en /api/alerts.
  const alertsList: any[] = [];
  activeLeads.forEach(l => { const f = leadFollow(l); if (f && f < t) alertsList.push({ type: 'lead', empresa: l.empresa, titulo: coalesce(l, 'proxima_accion', 'interes_principal', 'servicio_interesado') || 'Follow-up pendiente', fecha: f }); });
  tasks.filter(t2 => t2.estado === 'Bloqueado').forEach(t2 => alertsList.push({ type: 'task', empresa: coalesce(t2, 'empresa_relacionada', 'relacionado_con') || 'Interno', titulo: t2.titulo, fecha: t2.bloqueos }));
  pendientes.forEach(p => { const f = coalesce(p, 'fecha_prevista_cobro', 'fecha_vencimiento', 'fecha'); if (f && f < t) alertsList.push({ type: 'payment', empresa: p.cliente, titulo: p.concepto, fecha: f }); });
  clients.filter(c => c.estado_cliente === 'En Riesgo').forEach(c => alertsList.push({ type: 'risk', empresa: c.empresa, titulo: c.riesgos, fecha: 'Inmediato' }));

  return {
    revenueByMonth,
    pipelineFunnel,
    alerts: alertsList,
    leadsActivos: activeLeads.length,
    followUpsVencidos: overdueLeads.length,
    clientesActivos: clients.filter(c => !c.estado_cliente || c.estado_cliente !== 'Baja').length,
    pagosPendientesCount: pendientes.length,
    pagosPendientesTotal: pendientes.reduce((s, p) => s + (Number(p.importe) || 0), 0),
    cobradoMes: payments.filter(p => p.estado === 'cobrado' && p.fecha >= startOfMonth() && p.fecha <= t).reduce((s, p) => s + (Number(p.importe) || 0), 0),
    tareasPendientesCount: tasks.filter(t2 => !t2.estado || t2.estado !== 'Completado').length,
    clientesRevisionCount: clients.filter(clienteRevisable).length,
    comisionesPendientesTotal: payments.filter(p => p.afiliado_id && p.comision_estado !== 'pagada').reduce((s, p) => s + (Number(p.importe) || 0) * (Number(p.comision_pct) || 0) / 100, 0),
    recentTasks,
    overdueLeads,
    overdueClients,
  };
}

async function alerts() {
  const t = today();
  const [leads, tasks, payments, clients] = await Promise.all([
    getAll('leads'), getAll('tasks'), getAll('payments'), getAll('clients'),
  ]);
  const out: any[] = [];
  leads.filter(l => (!l.estado || !['Cerrado', 'Perdido'].includes(l.estado))).forEach(l => {
    const fecha = coalesce(l, 'proximo_follow_up', 'fecha_proxima_accion');
    if (fecha && fecha < t) out.push({ type: 'lead', empresa: l.empresa, titulo: coalesce(l, 'proxima_accion', 'interes_principal') || 'Follow-up pendiente', fecha });
  });
  tasks.filter(t2 => t2.estado === 'Bloqueado').forEach(t2 => {
    out.push({ type: 'task', empresa: coalesce(t2, 'empresa_relacionada', 'relacionado_con') || 'Interno', titulo: t2.titulo, fecha: t2.bloqueos });
  });
  payments.filter(p => (!p.estado || p.estado !== 'cobrado')).forEach(p => {
    const fecha = coalesce(p, 'fecha_prevista_cobro', 'fecha_vencimiento', 'fecha');
    if (fecha && fecha < t) out.push({ type: 'payment', empresa: p.cliente, titulo: p.concepto, fecha });
  });
  clients.filter(c => c.estado_cliente === 'En Riesgo').forEach(c => {
    out.push({ type: 'risk', empresa: c.empresa, titulo: c.riesgos, fecha: 'Inmediato' });
  });
  return out;
}

async function weeklyReport() {
  const t = today();
  const week = daysAgo(7);
  const som = startOfMonth();
  const [leads, interactions, payments] = await Promise.all([
    getAll('leads'), getAll('interactions'), getAll('payments'),
  ]);
  const pipelineMap: Record<string, { estado: string; count: number; valor: number }> = {};
  leads.forEach(l => {
    const e = l.estado || 'null';
    if (!pipelineMap[e]) pipelineMap[e] = { estado: l.estado, count: 0, valor: 0 };
    pipelineMap[e].count++;
    pipelineMap[e].valor += Number(l.valor_estimado) || 0;
  });
  return {
    pipeline: Object.values(pipelineMap),
    newLeads: leads.filter(l => l.fecha_primer_contacto && l.fecha_primer_contacto >= week),
    overdueActions: leads.filter(l => { const f = coalesce(l, 'proximo_follow_up', 'fecha_proxima_accion'); return f && f < t; }),
    weekInteractions: interactions.filter(i => i.fecha && i.fecha >= week),
    monthRevenue: payments.filter(p => p.estado === 'cobrado' && p.fecha >= som).reduce((s, p) => s + (Number(p.importe) || 0), 0),
    pendingRevenue: payments.filter(p => !p.estado || p.estado !== 'cobrado').reduce((s, p) => s + (Number(p.importe) || 0), 0),
  };
}

async function company(name: string) {
  const [leads, clients, interactions, payments] = await Promise.all([
    supabase.from('leads').select('*').eq('empresa', name),
    supabase.from('clients').select('*').eq('empresa', name),
    supabase.from('interactions').select('*').eq('empresa', name).order('fecha', { ascending: false }),
    supabase.from('payments').select('*').eq('cliente', name).order('fecha', { ascending: false }),
  ]);
  return { leads: leads.data || [], clients: clients.data || [], interactions: interactions.data || [], payments: payments.data || [] };
}

async function affiliatesSummary() {
  const [affiliates, payments] = await Promise.all([getAll('affiliates'), getAll('payments')]);
  const com = (p: any) => (Number(p.importe) || 0) * (Number(p.comision_pct) || 0) / 100;
  const commissions = payments
    .filter(p => p.afiliado_id)
    .map(p => ({ ...p, afiliado_nombre: affiliates.find(a => a.id === p.afiliado_id)?.nombre || '', comision_importe: com(p) }));
  const summary = affiliates.map(a => {
    const propias = commissions.filter(c => c.afiliado_id === a.id);
    const total = propias.reduce((s, c) => s + com(c), 0);
    const pagada = propias.filter(c => c.comision_estado === 'pagada').reduce((s, c) => s + com(c), 0);
    return {
      ...a,
      num_ventas: propias.length,
      ventas_generadas: propias.reduce((s, c) => s + (Number(c.importe) || 0), 0),
      comision_total: total,
      comision_pagada: pagada,
      comision_pendiente: total - pagada,
    };
  });
  return {
    affiliates: summary,
    commissions,
    totals: {
      comision_total: summary.reduce((s, a) => s + a.comision_total, 0),
      comision_pagada: summary.reduce((s, a) => s + a.comision_pagada, 0),
      comision_pendiente: summary.reduce((s, a) => s + a.comision_pendiente, 0),
    },
  };
}

async function getSettings() {
  const { data } = await supabase.from('settings').select('*');
  const s: Record<string, string> = {};
  (data || []).forEach((r: any) => { s[r.key] = r.value; });
  return s;
}

// ---- Router compatible con fetch ----
export async function api(path: string, options: any = {}): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  const url = path.replace(/^\/api\//, '').replace(/^\//, '');
  const [resource, idOrSub, sub] = url.split('?')[0].split('/');

  try {
    // Endpoints de solo lectura / agregados
    if (resource === 'dashboard') return ok(await dashboard());
    if (resource === 'alerts') return ok(await alerts());
    if (resource === 'report' && idOrSub === 'weekly') return ok(await weeklyReport());
    if (resource === 'company') return ok(await company(decodeURIComponent(idOrSub)));
    if (resource === 'affiliates' && idOrSub === 'summary') return ok(await affiliatesSummary());

    if (resource === 'settings') {
      if (method === 'GET') return ok(await getSettings());
      if (method === 'PUT') {
        const rows = Object.keys(body || {}).map(k => ({ key: k, value: body[k] }));
        const { error } = await supabase.from('settings').upsert(rows);
        if (error) return fail(500, error.message);
        return ok({ success: true });
      }
    }

    if (TABLES.includes(resource)) {
      if (method === 'GET') return ok(await getAll(resource));

      if (method === 'POST') {
        const { data, error } = await supabase.from(resource).insert(body).select('id').single();
        if (error) return fail(500, error.message);
        // Al registrar interacción, actualizar último contacto de lead/cliente (igual que el backend)
        if (resource === 'interactions' && body?.empresa && body?.fecha) {
          await supabase.from('leads').update({ ultimo_contacto: body.fecha }).eq('empresa', body.empresa);
          await supabase.from('clients').update({ ultima_revision: body.fecha }).eq('empresa', body.empresa);
        }
        return ok({ id: data?.id });
      }

      if (method === 'PATCH') {
        const { error } = await supabase.from(resource).update(body).eq('id', idOrSub);
        if (error) return fail(500, error.message);
        return ok({ success: true });
      }

      if (method === 'DELETE') {
        // Al borrar afiliado, desvincular sus comisiones de los pagos
        if (resource === 'affiliates') {
          await supabase.from('payments').update({ afiliado_id: null, comision_pct: null, comision_estado: null }).eq('afiliado_id', idOrSub);
        }
        const { error } = await supabase.from(resource).delete().eq('id', idOrSub);
        if (error) return fail(500, error.message);
        return ok({ success: true });
      }
    }

    return fail(404, 'Not found: ' + path);
  } catch (e: any) {
    return fail(500, e?.message || 'Error');
  }
}

// Compatibilidad: las páginas importan estos helpers para construir headers.
// Ya no se usan (Supabase gestiona la auth), se mantienen como no-op.
export const authHeaders = (): Record<string, string> => ({});
export const jsonHeaders = (): Record<string, string> => ({ 'Content-Type': 'application/json' });
export const setAccessToken = (_t: string | null) => {};
