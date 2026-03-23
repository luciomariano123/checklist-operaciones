-- ─────────────────────────────────────────────────────────────────────────────
-- Schema: checklist_operaciones
-- Cheques de pago diferido no garantizados
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Clientes ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clientes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cuit          VARCHAR(11) NOT NULL UNIQUE,
  denominacion  VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Evaluaciones (casos) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evaluaciones (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id                UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cuit                      VARCHAR(11) NOT NULL,
  denominacion              VARCHAR(255),
  numero_cuenta_comitente   VARCHAR(50),
  moneda                    VARCHAR(10) DEFAULT 'ARS',
  plazo                     VARCHAR(50),
  tipo_operacion            VARCHAR(10) CHECK (tipo_operacion IN ('compra', 'venta')),
  fecha_operacion           DATE,
  fecha_ultimo_eecc         DATE,
  observaciones             TEXT,
  estado_general            VARCHAR(20) CHECK (estado_general IN ('aceptable', 'no_aceptable', 'pendiente')),
  motivos_rechazo           JSONB DEFAULT '[]',
  creado_por                VARCHAR(100),
  actualizado_por           VARCHAR(100),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Respuestas checklist ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS respuestas_checklist (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id   UUID NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  item_id         INTEGER NOT NULL CHECK (item_id BETWEEN 1 AND 14),
  respuesta       VARCHAR(2) CHECK (respuesta IN ('si', 'no')),
  observacion     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (evaluacion_id, item_id)
);

-- ─── Métricas financieras ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS metricas_financieras (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id       UUID NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE UNIQUE,
  activo_corriente    NUMERIC(20, 2),
  activo_no_corriente NUMERIC(20, 2),
  pasivo_corriente    NUMERIC(20, 2),
  pasivo_no_corriente NUMERIC(20, 2),
  linea_solicitada    NUMERIC(20, 2),
  -- Calculados (guardados para trazabilidad)
  activo_total        NUMERIC(20, 2) GENERATED ALWAYS AS (COALESCE(activo_corriente, 0) + COALESCE(activo_no_corriente, 0)) STORED,
  pasivo_total        NUMERIC(20, 2) GENERATED ALWAYS AS (COALESCE(pasivo_corriente, 0) + COALESCE(pasivo_no_corriente, 0)) STORED,
  patrimonio_neto     NUMERIC(20, 2) GENERATED ALWAYS AS (
    (COALESCE(activo_corriente, 0) + COALESCE(activo_no_corriente, 0)) -
    (COALESCE(pasivo_corriente, 0) + COALESCE(pasivo_no_corriente, 0))
  ) STORED,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Documentos ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id   UUID NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  nombre          VARCHAR(255) NOT NULL,
  categoria       VARCHAR(50) NOT NULL,
  storage_path    TEXT,
  url             TEXT,
  mime_type       VARCHAR(100),
  size_bytes      BIGINT,
  comentario      TEXT,
  checklist_item_id INTEGER,
  cargado_por     VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Observaciones internas ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS observaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id   UUID NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  texto           TEXT NOT NULL,
  usuario         VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Historial de cambios ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS historial_cambios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id   UUID NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  campo           VARCHAR(100),
  valor_anterior  TEXT,
  valor_nuevo     TEXT,
  usuario         VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_evaluaciones_cuit ON evaluaciones(cuit);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_estado ON evaluaciones(estado_general);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha ON evaluaciones(fecha_operacion);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_created ON evaluaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_respuestas_evaluacion ON respuestas_checklist(evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_documentos_evaluacion ON documentos(evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_historial_evaluacion ON historial_cambios(evaluacion_id);

-- ─── Función para updated_at automático ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evaluaciones_updated_at
  BEFORE UPDATE ON evaluaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_metricas_updated_at
  BEFORE UPDATE ON metricas_financieras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS (Row Level Security) — ejemplo básico ────────────────────────────────

ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Política básica: todos los usuarios autenticados pueden leer/escribir
-- (ajustar según roles en producción)
CREATE POLICY "Authenticated users read evaluaciones"
  ON evaluaciones FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users write evaluaciones"
  ON evaluaciones FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users update evaluaciones"
  ON evaluaciones FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users read documentos"
  ON documentos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users write documentos"
  ON documentos FOR INSERT
  TO authenticated WITH CHECK (true);

-- ─── Storage bucket (ejecutar desde Supabase Dashboard o CLI) ────────────────
-- supabase storage create-bucket documentos_operaciones --public=false
-- O desde el dashboard: Storage → New Bucket → "documentos-operaciones"

-- ─── Datos de ejemplo (seeds) ────────────────────────────────────────────────

INSERT INTO clientes (cuit, denominacion) VALUES
  ('20123456789', 'Empresa Demo S.A.'),
  ('30987654321', 'Comercial Norte SRL')
ON CONFLICT (cuit) DO NOTHING;
