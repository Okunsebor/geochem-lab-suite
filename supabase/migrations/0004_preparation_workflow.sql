-- 0004_preparation_workflow.sql
-- GeoChem LIMS: Preparation Workflow Tables

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE prep_stage AS ENUM ('Drying', 'Crushing', 'Splitting', 'Pulverizing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE prep_step_status AS ENUM ('Queued', 'In Progress', 'Completed', 'Skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE prep_job_status AS ENUM ('Active', 'Completed', 'On Hold');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────
-- PREPARATION JOBS
-- One record per sample enrolled in prep workflow
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS preparation_jobs (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id      UUID         NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  overall_status prep_job_status NOT NULL DEFAULT 'Active',
  current_stage  prep_stage   NOT NULL DEFAULT 'Drying',
  created_by     TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (sample_id)
);

-- ─────────────────────────────────────────────
-- PREPARATION STEPS
-- One record per stage per job
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS preparation_steps (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID             NOT NULL REFERENCES preparation_jobs(id) ON DELETE CASCADE,
  sample_id        UUID             NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  stage            prep_stage       NOT NULL,
  status           prep_step_status NOT NULL DEFAULT 'Queued',
  technician_name  TEXT,
  technician_id    TEXT,
  equipment        TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  duration_minutes INT GENERATED ALWAYS AS (
    CASE
      WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (completed_at - started_at))::INT / 60
      ELSE NULL
    END
  ) STORED,
  notes            TEXT,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  UNIQUE (job_id, stage)
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_prep_jobs_sample_id    ON preparation_jobs(sample_id);
CREATE INDEX IF NOT EXISTS idx_prep_jobs_status       ON preparation_jobs(overall_status);
CREATE INDEX IF NOT EXISTS idx_prep_steps_job_id      ON preparation_steps(job_id);
CREATE INDEX IF NOT EXISTS idx_prep_steps_sample_id   ON preparation_steps(sample_id);
CREATE INDEX IF NOT EXISTS idx_prep_steps_stage       ON preparation_steps(stage);
CREATE INDEX IF NOT EXISTS idx_prep_steps_status      ON preparation_steps(status);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_prep_job_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prep_job_updated_at ON preparation_jobs;
CREATE TRIGGER trg_prep_job_updated_at
  BEFORE UPDATE ON preparation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_prep_job_updated_at();

-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE preparation_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparation_steps ENABLE ROW LEVEL SECURITY;

-- Explicit lab staff policies for prep records
CREATE POLICY "prep_jobs_select" ON preparation_jobs FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "prep_jobs_insert" ON preparation_jobs FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "prep_jobs_update" ON preparation_jobs FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "prep_jobs_delete" ON preparation_jobs FOR DELETE USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','manager','technician'));

CREATE POLICY "prep_steps_select" ON preparation_steps FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "prep_steps_insert" ON preparation_steps FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "prep_steps_update" ON preparation_steps FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "prep_steps_delete" ON preparation_steps FOR DELETE USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','manager','technician'));
