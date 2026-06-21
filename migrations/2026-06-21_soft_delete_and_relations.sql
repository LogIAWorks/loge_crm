-- Migración aplicada el 2026-06-21 (Supabase, proyecto pbieredtatoqkiuzmvuv).
-- Cambios ADITIVOS y compatibles hacia atrás (no rompen versiones anteriores del frontend).
-- Backup previo realizado antes de ejecutar.

-- ── #4 Soft-delete: borrado lógico en vez de físico ───────────────────────────
ALTER TABLE leads        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE clients      ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE payments     ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tasks        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE affiliates   ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── #1 Relaciones por ID (integridad referencial) ─────────────────────────────
ALTER TABLE payments     ADD COLUMN IF NOT EXISTS client_id bigint;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS client_id bigint;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS lead_id bigint;

-- Backfill: enlazar registros existentes (por nombre) a su id
UPDATE payments p     SET client_id = c.id FROM clients c WHERE p.client_id IS NULL AND lower(trim(p.cliente)) = lower(trim(c.empresa));
UPDATE interactions i SET client_id = c.id FROM clients c WHERE i.client_id IS NULL AND lower(trim(i.empresa)) = lower(trim(c.empresa));
UPDATE interactions i SET lead_id   = l.id FROM leads   l WHERE i.lead_id   IS NULL AND lower(trim(i.empresa)) = lower(trim(l.empresa));

-- Claves foráneas (nullable, ON DELETE SET NULL para no bloquear borrados)
ALTER TABLE payments     ADD CONSTRAINT payments_client_id_fkey     FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE interactions ADD CONSTRAINT interactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE interactions ADD CONSTRAINT interactions_lead_id_fkey   FOREIGN KEY (lead_id)   REFERENCES leads(id)   ON DELETE SET NULL;

-- Evitar clientes duplicados por nombre (ignorando los borrados lógicamente)
CREATE UNIQUE INDEX clients_empresa_unique ON clients (lower(trim(empresa))) WHERE deleted_at IS NULL;
