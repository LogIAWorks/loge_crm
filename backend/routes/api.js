const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// "Hoy" en horario de Madrid (en-CA da formato YYYY-MM-DD). Evita desfases por UTC cerca de medianoche.
const todayMadrid = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

// Toda la API exige un token válido de Supabase (login con edu/oscar).
router.use(requireAuth);

// ======================= LEADS =======================

router.get('/leads', (req, res) => {
  db.all("SELECT * FROM leads ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/leads', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.status(400).json({error: 'Empty body'});
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO leads (${fields.join(', ')}) VALUES (${placeholders})`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

router.patch('/leads/:id', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.json({ success: true });
  const setString = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);
  db.run(`UPDATE leads SET ${setString} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

router.delete('/leads/:id', (req, res) => {
  db.run('DELETE FROM leads WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// ======================= CLIENTS =======================

router.get('/clients', (req, res) => {
  db.all("SELECT * FROM clients ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/clients', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.status(400).json({error: 'Empty body'});
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO clients (${fields.join(', ')}) VALUES (${placeholders})`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

router.patch('/clients/:id', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.json({ success: true });
  const setString = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);
  db.run(`UPDATE clients SET ${setString} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

router.delete('/clients/:id', (req, res) => {
  db.run('DELETE FROM clients WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// ======================= INTERACTIONS =======================

router.get('/interactions', (req, res) => {
  db.all("SELECT * FROM interactions ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/interactions', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.status(400).json({error: 'Empty body'});
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO interactions (${fields.join(', ')}) VALUES (${placeholders})`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Auto-update Lead or Client last contact date
    const { empresa, fecha } = req.body;
    if (empresa && fecha) {
      db.run("UPDATE leads SET ultimo_contacto = ? WHERE empresa = ?", [fecha, empresa]);
      db.run("UPDATE clients SET ultima_revision = ? WHERE empresa = ?", [fecha, empresa]);
    }
    res.json({ id: this.lastID });
  });
});

router.patch('/interactions/:id', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.json({ success: true });
  const setString = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);
  db.run(`UPDATE interactions SET ${setString} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

router.delete('/interactions/:id', (req, res) => {
  db.run('DELETE FROM interactions WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// ======================= PAYMENTS =======================

router.get('/payments', (req, res) => {
  db.all("SELECT * FROM payments ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/payments', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.status(400).json({error: 'Empty body'});
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO payments (${fields.join(', ')}) VALUES (${placeholders})`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

router.patch('/payments/:id', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.json({ success: true });
  const setString = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);
  db.run(`UPDATE payments SET ${setString} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

router.delete('/payments/:id', (req, res) => {
  db.run('DELETE FROM payments WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// ======================= TASKS =======================

router.get('/tasks', (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/tasks', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.status(400).json({error: 'Empty body'});
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO tasks (${fields.join(', ')}) VALUES (${placeholders})`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

router.patch('/tasks/:id', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.json({ success: true });
  const setString = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);
  db.run(`UPDATE tasks SET ${setString} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

router.delete('/tasks/:id', (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

// ======================= SETTINGS =======================

router.get('/settings', (req, res) => {
  db.all("SELECT * FROM settings", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  });
});

router.put('/settings', (req, res) => {
  const keys = Object.keys(req.body);
  if (keys.length === 0) return res.json({ success: true });
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    keys.forEach(k => { stmt.run([k, req.body[k]]); });
    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// ======================= DASHBOARD =======================
// Key: uses COALESCE and IS NULL checks to handle the dual-column problem
// where data may live in old columns OR new columns depending on when it was created.

router.get('/dashboard', (req, res) => {
  const data = {
    leadsActivos: 0,
    followUpsVencidos: 0,
    clientesActivos: 0,
    pagosPendientesCount: 0,
    pagosPendientesTotal: 0,
    cobradoMes: 0,
    tareasPendientesCount: 0,
    clientesRevisionCount: 0,
    comisionesPendientesTotal: 0,
    recentTasks: [],
    overdueLeads: [],
    overdueClients: [],
  };

  const today = todayMadrid();
  const startStr = today.slice(0, 8) + '01';

  db.serialize(() => {
    // Active leads (not closed, not lost)
    db.get("SELECT COUNT(*) as n FROM leads WHERE estado IS NULL OR estado NOT IN ('Cerrado', 'Perdido')", (e, r) => { data.leadsActivos = r?.n || 0; });

    // Overdue follow-ups: COALESCE prioritises the new column; avoids false positives from stale old column
    db.get(`SELECT COUNT(*) as n FROM leads
      WHERE (estado IS NULL OR estado NOT IN ('Cerrado', 'Perdido'))
      AND COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) IS NOT NULL
      AND COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) < ?`, [today], (e, r) => { data.followUpsVencidos = r?.n || 0; });

    // Active clients: NULL estado_cliente = active (they just haven't been categorized)
    db.get("SELECT COUNT(*) as n FROM clients WHERE estado_cliente IS NULL OR estado_cliente != 'Baja'", (e, r) => { data.clientesActivos = r?.n || 0; });

    // Pending payments count & total
    db.get("SELECT COUNT(*) as n, SUM(importe) as total FROM payments WHERE estado IS NULL OR estado != 'cobrado'", (e, r) => {
      data.pagosPendientesCount = r?.n || 0;
      data.pagosPendientesTotal = r?.total || 0;
    });

    // Revenue collected this month (only up to today to avoid counting future-dated entries)
    db.get("SELECT SUM(importe) as total FROM payments WHERE estado = 'cobrado' AND fecha >= ? AND fecha <= ?", [startStr, today], (e, r) => {
      data.cobradoMes = r?.total || 0;
    });

    // Pending tasks
    db.get("SELECT COUNT(*) as n FROM tasks WHERE estado IS NULL OR estado NOT IN ('Completado')", (e, r) => { data.tareasPendientesCount = r?.n || 0; });

    // Clients needing revision (overdue proxima_revision)
    db.get("SELECT COUNT(*) as n FROM clients WHERE proxima_revision IS NOT NULL AND proxima_revision != '' AND proxima_revision < ?", [today], (e, r) => { data.clientesRevisionCount = r?.n || 0; });

    // Comisiones de afiliados pendientes de pagar (importe * pct sobre pagos con afiliado y comisión no pagada)
    db.get("SELECT COALESCE(SUM(importe * COALESCE(comision_pct,0) / 100), 0) as total FROM payments WHERE afiliado_id IS NOT NULL AND (comision_estado IS NULL OR comision_estado != 'pagada')", (e, r) => { data.comisionesPendientesTotal = r?.total || 0; });

    // Recent pending tasks (for widget)
    db.all("SELECT * FROM tasks WHERE estado IS NULL OR estado NOT IN ('Completado') ORDER BY fecha_limite ASC LIMIT 5", (e, rows) => { data.recentTasks = rows || []; });

    // Overdue leads (for detail list) — COALESCE prioritises new column
    db.all(`SELECT id, empresa, contacto, COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) as follow_up,
      COALESCE(interes_principal, servicio_interesado) as interes, nota_corta, notas
      FROM leads
      WHERE (estado IS NULL OR estado NOT IN ('Cerrado', 'Perdido'))
      AND COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) IS NOT NULL
      AND COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) < ?
      ORDER BY COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) ASC LIMIT 10`, [today], (e, rows) => { data.overdueLeads = rows || []; });

    // Clients needing revision (detail)
    db.all(`SELECT id, empresa, COALESCE(servicio_contratado, '') as servicio, proxima_revision,
      COALESCE(notas, '') as notas
      FROM clients
      WHERE proxima_revision IS NOT NULL AND proxima_revision != '' AND proxima_revision < ?
      ORDER BY proxima_revision ASC LIMIT 10`, [today], (e, rows) => { data.overdueClients = rows || []; });

    db.get("SELECT 1", () => res.json(data));
  });
});

// ======================= ALERTS =======================

router.get('/alerts', (req, res) => {
  const today = todayMadrid();
  const allAlerts = [];

  db.serialize(() => {
    // Overdue lead follow-ups — COALESCE prioritises new column to avoid stale-column false positives
    db.all(`SELECT 'lead' as type, empresa,
      COALESCE(proxima_accion, interes_principal, 'Follow-up pendiente') as titulo,
      COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) as fecha
      FROM leads
      WHERE (estado IS NULL OR estado NOT IN ('Cerrado', 'Perdido'))
      AND COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) IS NOT NULL
      AND COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) < ?`, [today], (err, rows) => {
      if (rows) allAlerts.push(...rows);
    });

    // Blocked tasks
    db.all(`SELECT 'task' as type,
      COALESCE(empresa_relacionada, related_empresa, relacionado_con, 'Interno') as empresa,
      titulo, bloqueos as fecha
      FROM tasks WHERE estado = 'Bloqueado'`, (err, rows) => {
      if (rows) allAlerts.push(...rows);
    });

    // Overdue payments (check both date columns)
    db.all(`SELECT 'payment' as type, cliente as empresa, concepto as titulo,
      COALESCE(fecha_prevista_cobro, fecha_vencimiento, fecha) as fecha
      FROM payments
      WHERE (estado IS NULL OR estado != 'cobrado')
      AND COALESCE(fecha_prevista_cobro, fecha_vencimiento, fecha) < ?`, [today], (err, rows) => {
      if (rows) allAlerts.push(...rows);
    });

    // Clients at risk
    db.all("SELECT 'risk' as type, empresa, riesgos as titulo, 'Inmediato' as fecha FROM clients WHERE estado_cliente = 'En Riesgo'", (err, rows) => {
      if (rows) allAlerts.push(...rows);
    });

    db.get("SELECT 1", () => res.json(allAlerts));
  });
});

// ======================= COMPANY 360° VIEW =======================

router.get('/company/:name', (req, res) => {
  const name = req.params.name;
  const result = {};
  db.serialize(() => {
    db.all("SELECT * FROM leads WHERE empresa = ?", [name], (err, rows) => { result.leads = rows || []; });
    db.all("SELECT * FROM clients WHERE empresa = ?", [name], (err, rows) => { result.clients = rows || []; });
    db.all("SELECT * FROM interactions WHERE empresa = ? ORDER BY fecha DESC", [name], (err, rows) => { result.interactions = rows || []; });
    db.all("SELECT * FROM payments WHERE cliente = ? ORDER BY fecha DESC", [name], (err, rows) => { result.payments = rows || []; });
    db.get("SELECT 1", () => { res.json(result); });
  });
});

// ======================= WEEKLY REPORT =======================

router.get('/report/weekly', (req, res) => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];
  const todayStr = todayMadrid();
  const startOfMonth = todayStr.slice(0, 8) + '01';

  const report = {};
  db.serialize(() => {
    db.all("SELECT estado, COUNT(*) as count, SUM(valor_estimado) as valor FROM leads GROUP BY estado", (err, rows) => {
      report.pipeline = rows || [];
    });
    db.all("SELECT * FROM leads WHERE fecha_primer_contacto >= ? ORDER BY fecha_primer_contacto DESC", [weekStr], (err, rows) => {
      report.newLeads = rows || [];
    });
    db.all(`SELECT * FROM leads
      WHERE COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) IS NOT NULL
      AND COALESCE(NULLIF(proximo_follow_up,''), NULLIF(fecha_proxima_accion,'')) < ?`, [todayStr], (err, rows) => {
      report.overdueActions = rows || [];
    });
    db.all("SELECT * FROM interactions WHERE fecha >= ? ORDER BY fecha DESC", [weekStr], (err, rows) => {
      report.weekInteractions = rows || [];
    });
    db.get("SELECT SUM(importe) as total FROM payments WHERE estado = 'cobrado' AND fecha >= ?", [startOfMonth], (err, row) => {
      report.monthRevenue = row?.total || 0;
    });
    db.get("SELECT SUM(importe) as total FROM payments WHERE estado IS NULL OR estado != 'cobrado'", (err, row) => {
      report.pendingRevenue = row?.total || 0;
    });
    db.get("SELECT 1", () => { res.json(report); });
  });
});

// ======================= AFFILIATES =======================

router.get('/affiliates', (req, res) => {
  db.all("SELECT * FROM affiliates ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/affiliates', (req, res) => {
  const body = { ...req.body };
  if (!body.created_at) body.created_at = new Date().toISOString().split('T')[0];
  const fields = Object.keys(body);
  const values = Object.values(body);
  if (fields.length === 0) return res.status(400).json({ error: 'Empty body' });
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO affiliates (${fields.join(', ')}) VALUES (${placeholders})`;
  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

router.patch('/affiliates/:id', (req, res) => {
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  if (fields.length === 0) return res.json({ success: true });
  const setString = fields.map(f => `${f} = ?`).join(', ');
  values.push(req.params.id);
  db.run(`UPDATE affiliates SET ${setString} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

router.delete('/affiliates/:id', (req, res) => {
  // Desvincular comisiones de pagos antes de borrar para no dejar referencias huérfanas
  db.run('UPDATE payments SET afiliado_id = NULL, comision_pct = NULL, comision_estado = NULL WHERE afiliado_id = ?', [req.params.id], () => {
    db.run('DELETE FROM affiliates WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, changes: this.changes });
    });
  });
});

// Resumen de comisiones por afiliado + listado de comisiones individuales
router.get('/affiliates/summary', (req, res) => {
  db.serialize(() => {
    db.all('SELECT * FROM affiliates', (err, affiliates) => {
      if (err) return res.status(500).json({ error: err.message });
      db.all(`SELECT p.id, p.cliente, p.concepto, p.importe, p.estado, p.fecha,
                     p.afiliado_id, p.comision_pct, p.comision_estado, a.nombre as afiliado_nombre
              FROM payments p JOIN affiliates a ON a.id = p.afiliado_id
              WHERE p.afiliado_id IS NOT NULL
              ORDER BY p.id DESC`, (err2, commissions) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const comisionImporte = (c) => (Number(c.importe) || 0) * (Number(c.comision_pct) || 0) / 100;
        const summary = (affiliates || []).map(a => {
          const propias = (commissions || []).filter(c => c.afiliado_id === a.id);
          const ventas = propias.reduce((s, c) => s + (Number(c.importe) || 0), 0);
          const total = propias.reduce((s, c) => s + comisionImporte(c), 0);
          const pagada = propias.filter(c => c.comision_estado === 'pagada').reduce((s, c) => s + comisionImporte(c), 0);
          return {
            ...a,
            num_ventas: propias.length,
            ventas_generadas: ventas,
            comision_total: total,
            comision_pagada: pagada,
            comision_pendiente: total - pagada,
          };
        });
        const totals = {
          comision_total: summary.reduce((s, a) => s + a.comision_total, 0),
          comision_pagada: summary.reduce((s, a) => s + a.comision_pagada, 0),
          comision_pendiente: summary.reduce((s, a) => s + a.comision_pendiente, 0),
        };
        const commissionsWithImporte = (commissions || []).map(c => ({ ...c, comision_importe: comisionImporte(c) }));
        res.json({ affiliates: summary, commissions: commissionsWithImporte, totals });
      });
    });
  });
});

module.exports = router;
