-- 0005_analysis_qaqc.sql
-- GeoChem LIMS: Analysis Runs, Calibration Records, QA Flags, Analytical Methods

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE run_status AS ENUM ('Queued','Running','Complete','Failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE check_type AS ENUM ('Duplicate','Blank','CRM','Standard','Spike'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE flag_severity AS ENUM ('Low','Medium','High'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE flag_status AS ENUM ('Open','Pending Approval','Approved','Revised'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────
-- ANALYTICAL METHODS LIBRARY
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytical_methods (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT    NOT NULL UNIQUE,         -- "FA-AAS", "ICP-MS-51E"
  name               TEXT    NOT NULL,
  description        TEXT,
  elements_targeted  TEXT[]  NOT NULL DEFAULT '{}',
  instrument_types   TEXT[]  NOT NULL DEFAULT '{}',
  detection_limits   JSONB   NOT NULL DEFAULT '{}',   -- {"Au": 0.001, "Cu": 0.01}
  duplicate_rpd_pct  NUMERIC NOT NULL DEFAULT 10,     -- QC threshold: duplicate RPD %
  blank_multiplier   NUMERIC NOT NULL DEFAULT 1.0,    -- blank must be < multiplier × DL
  crm_tolerance_pct  NUMERIC NOT NULL DEFAULT 5,      -- CRM ± tolerance %
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- ANALYTICAL RUNS
-- One record per instrument run session per sample
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytical_runs (
  id             TEXT        PRIMARY KEY,              -- RUN-XXXXX
  sample_id      UUID        NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  instrument_id  TEXT        NOT NULL,
  method         TEXT        NOT NULL,
  analyst_name   TEXT        NOT NULL,
  status         run_status  NOT NULL DEFAULT 'Queued',
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  raw_file_url   TEXT,
  raw_file_name  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- ANALYTICAL RESULTS (full schema with run linkage)
-- Augments existing analytical_results table
-- ─────────────────────────────────────────────
ALTER TABLE analytical_results
  ADD COLUMN IF NOT EXISTS run_id         TEXT,
  ADD COLUMN IF NOT EXISTS analyst_name   TEXT,
  ADD COLUMN IF NOT EXISTS instrument_id  TEXT,
  ADD COLUMN IF NOT EXISTS flag_reason    TEXT,
  ADD COLUMN IF NOT EXISTS analyzed_at    TIMESTAMPTZ DEFAULT now();

-- ─────────────────────────────────────────────
-- CALIBRATION RECORDS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calibration_records (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id     TEXT        NOT NULL,
  performed_by      TEXT        NOT NULL,
  calibration_date  TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_due_date     TIMESTAMPTZ NOT NULL,
  standard_used     TEXT        NOT NULL,
  r2_value          NUMERIC     NOT NULL,
  pass_status       BOOLEAN     NOT NULL DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- QA FLAGS
-- Anomaly flags with full resolution lifecycle
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_flags (
  id                 TEXT        PRIMARY KEY,           -- QF-XXXXX
  sample_id          UUID        NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  run_id             TEXT,
  element            TEXT        NOT NULL,
  check_type         check_type  NOT NULL,
  observed_value     NUMERIC     NOT NULL,
  expected_value     NUMERIC,
  tolerance          NUMERIC,
  percent_deviation  NUMERIC,
  severity           flag_severity NOT NULL DEFAULT 'Low',
  status             flag_status   NOT NULL DEFAULT 'Open',
  raised_by          TEXT        NOT NULL,
  raised_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by        TEXT,
  resolved_at        TIMESTAMPTZ,
  resolution         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_runs_sample_id     ON analytical_runs(sample_id);
CREATE INDEX IF NOT EXISTS idx_runs_instrument_id ON analytical_runs(instrument_id);
CREATE INDEX IF NOT EXISTS idx_runs_status        ON analytical_runs(status);
CREATE INDEX IF NOT EXISTS idx_flags_sample_id    ON qa_flags(sample_id);
CREATE INDEX IF NOT EXISTS idx_flags_status       ON qa_flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_severity     ON qa_flags(severity);
CREATE INDEX IF NOT EXISTS idx_flags_raised_at    ON qa_flags(raised_at DESC);
CREATE INDEX IF NOT EXISTS idx_cal_instrument_id  ON calibration_records(instrument_id);

-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE analytical_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_flags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytical_methods  ENABLE ROW LEVEL SECURITY;

