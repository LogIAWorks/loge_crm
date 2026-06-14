const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'crm.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to SQLite database');
    initDb();
  }
});

function initDb() {
  const addCol = (table, name, def) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err || !rows) return;
      if (!rows.some(r => r.name === name)) {
        console.log(`Migrating: Adding ${name} to ${table}`);
        db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
      }
    });
  };

  db.serialize(() => {
    // 1. Core Tables Creation
    db.run(`CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa TEXT,
      sector TEXT,
      ciudad TEXT,
      contacto TEXT,
      telefono TEXT,
      email TEXT,
      estado TEXT,
      responsable TEXT,
      fecha_primer_contacto TEXT,
      valor_estimado REAL,
      servicio_interesado TEXT,
      notas TEXT,
      proxima_accion TEXT,
      fecha_proxima_accion TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa TEXT,
      servicio_contratado TEXT,
      fecha_inicio TEXT,
      valor REAL,
      estado_proyecto TEXT,
      satisfaccion INTEGER,
      notas TEXT,
      proxima_revision TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      empresa TEXT,
      tipo TEXT,
      responsable TEXT,
      resumen TEXT,
      proximo_paso TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT,
      concepto TEXT,
      importe REAL,
      fecha TEXT,
      estado TEXT,
      notas TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT,
      descripcion TEXT,
      prioridad TEXT,
      estado TEXT,
      asignado_a TEXT,
      fecha_limite TEXT,
      empresa_relacionada TEXT,
      bloqueos TEXT,
      resultado TEXT,
      created_at TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS affiliates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      telefono TEXT,
      email TEXT,
      comision_pct REAL,
      iban TEXT,
      nif TEXT,
      tipo TEXT,
      notas TEXT,
      created_at TEXT
    )`);

    // 2. Settings Defaults
    db.get("SELECT count(*) as count FROM settings", (err, row) => {
      if (row && row.count === 0) {
        const stmt = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
        stmt.run('claude_api_key', '');
        stmt.run('openclaw_token', '');
        stmt.run('crm_api_key', 'loge123');
        stmt.finalize();
      }
    });

    // 3. Automated Schema Migrations
    const migrations = {
      leads: [
        ['cargo', 'TEXT'], ['web', 'TEXT'], ['tamano_empresa', 'TEXT'], ['origen', 'TEXT'], 
        ['prioridad', 'TEXT'], ['problema_detectado', 'TEXT'], ['solucion_propuesta', 'TEXT'], 
        ['probabilidad_cierre', 'TEXT'], ['ultimo_contacto', 'TEXT'], ['motivo_perdida', 'TEXT'],
        ['interes_principal', 'TEXT'], ['proximo_follow_up', 'TEXT'], ['nota_corta', 'TEXT']
      ],
      clients: [
        ['contacto', 'TEXT'], ['estado_cliente', 'TEXT'], ['estado_pago', 'TEXT'], 
        ['cobrado', 'REAL'], ['pendiente', 'REAL'], ['recurrencia', 'TEXT'], 
        ['mantenimiento', 'TEXT'], ['riesgos', 'TEXT'], ['siguiente_accion', 'TEXT'], 
        ['ultima_revision', 'TEXT'], ['potencial_crecimiento', 'TEXT'], ['upsell', 'TEXT'],
        ['importe', 'REAL'], ['proximo_paso', 'TEXT'], ['proxima_revision', 'TEXT']
      ],
      interactions: [
        ['detalle', 'TEXT'], ['resultado', 'TEXT'], ['fecha_siguiente_paso', 'TEXT'], ['importancia', 'TEXT'],
        ['resumen_corto', 'TEXT'], ['siguiente_paso', 'TEXT']
      ],
      payments: [
        ['pagos_hechos', 'REAL'], ['pagos_pendientes', 'REAL'], ['fecha_vencimiento', 'TEXT'],
        ['pagos_fraccionados', 'TEXT'], ['factura_emitida', 'TEXT'], ['contrato_firmado', 'TEXT'],
        ['fecha_prevista_cobro', 'TEXT'], ['metodo_pago', 'TEXT'],
        ['afiliado_id', 'INTEGER'], ['comision_pct', 'REAL'], ['comision_estado', 'TEXT']
      ],
      tasks: [
        ['descripcion', 'TEXT'], ['asignado_a', 'TEXT'], ['empresa_relacionada', 'TEXT'], 
        ['bloqueos', 'TEXT'], ['resultado', 'TEXT'], ['relacionado_con', 'TEXT']
      ]
    };

    Object.keys(migrations).forEach(table => {
      migrations[table].forEach(([name, def]) => addCol(table, name, def));
    });

  });
}

module.exports = db;

