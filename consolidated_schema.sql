-- Consolidated GeoChem LIMS Schema
-- Merged from 11 migration files


-- ==========================================
-- MIGRATION: 0001_initial_schema.sql
-- ==========================================

-- 0001_initial_schema.sql
-- GeoChem LIMS Initial Database Schema

-- 1. ENUMS (idempotent – safe to re-run on an existing database)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'technician', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sample_status AS ENUM ('Received', 'Verified', 'In Preparation', 'In Analysis', 'Completed', 'Report Ready');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('Standard', 'Rush', 'Urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE qa_status AS ENUM ('Pending', 'Passed', 'Failed', 'Retest');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABLES

-- Organizations (Customers or internal lab groups)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop helper functions if they exist (with CASCADE to handle type changes)
DROP FUNCTION IF EXISTS public.current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_org_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_lab_coordinator() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Create helper functions early so they are available for all RLS policies
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.users
  WHERE id = auth.uid();
  RETURN v_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_lab_coordinator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.current_user_role() IN ('admin', 'manager', 'technician');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.current_user_role() = 'admin';
END;
$$;

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Samples
CREATE TABLE IF NOT EXISTS public.samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    registered_by UUID REFERENCES public.users(id),
    tracking_code VARCHAR(100) UNIQUE,
    barcode_id VARCHAR(100) UNIQUE,
    sample_type VARCHAR(100) NOT NULL,
    matrix VARCHAR(100) NOT NULL,
    container VARCHAR(100),
    weight_kg DECIMAL(10,4),
    status sample_status NOT NULL DEFAULT 'Received',
    priority priority_level NOT NULL DEFAULT 'Standard',
    storage_location VARCHAR(255),
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custody Logs
CREATE TABLE IF NOT EXISTS public.custody_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.users(id),
    action VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample Notes
CREATE TABLE IF NOT EXISTS public.sample_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytical Results
CREATE TABLE IF NOT EXISTS public.analytical_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.users(id),
    element VARCHAR(50) NOT NULL,
    value DECIMAL(12,6),
    unit VARCHAR(20) NOT NULL,
    method VARCHAR(100) NOT NULL,
    qa_status qa_status NOT NULL DEFAULT 'Pending',
    reviewed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. AUDIT TRIGGERS

-- Function to handle audit logging
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), auth.uid());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for critical tables
CREATE OR REPLACE TRIGGER audit_samples_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.samples
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE OR REPLACE TRIGGER audit_analytical_results_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.analytical_results
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytical_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;



-- ==========================================
-- MIGRATION: 0002_sample_enhancements.sql
-- ==========================================

-- 0002_sample_enhancements.sql
-- GeoChem LIMS Sample Enhancements for Verification, Rejection & Document Attachments

-- 1. Add fields to public.samples to track physical verification and rejection states
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS acceptance_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- 2. Create sample_attachments table
CREATE TABLE IF NOT EXISTS public.sample_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    size_bytes BIGINT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure sample_id is type UUID (if table already existed with type varchar)
-- We must drop the RLS policies first because Postgres doesn't allow altering the type of a column used in a policy.
DROP POLICY IF EXISTS "Customers view org sample attachments" ON public.sample_attachments;
DROP POLICY IF EXISTS "Lab staff view all attachments" ON public.sample_attachments;
DROP POLICY IF EXISTS "Lab staff manage sample attachments" ON public.sample_attachments;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'sample_attachments' 
      AND column_name = 'sample_id' 
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.sample_attachments ALTER COLUMN sample_id TYPE UUID USING sample_id::uuid;
  END IF;
END $$;

-- 3. Enable RLS on sample_attachments
ALTER TABLE public.sample_attachments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for sample_attachments
DROP POLICY IF EXISTS "Customers view org sample attachments" ON public.sample_attachments;
CREATE POLICY "Customers view org sample attachments"
ON public.sample_attachments FOR SELECT
USING (sample_id IN (
    SELECT id FROM public.samples 
    WHERE project_id IN (
        SELECT id FROM public.projects 
        WHERE organization_id = public.current_user_org_id()
    )
));

DROP POLICY IF EXISTS "Lab staff view all attachments" ON public.sample_attachments;
CREATE POLICY "Lab staff view all attachments"
ON public.sample_attachments FOR SELECT
USING (public.is_lab_coordinator());

DROP POLICY IF EXISTS "Lab staff manage sample attachments" ON public.sample_attachments;
CREATE POLICY "Lab staff manage sample attachments"
ON public.sample_attachments FOR ALL
USING (public.is_lab_coordinator());


-- ==========================================
-- MIGRATION: 0004_preparation_workflow.sql
-- ==========================================

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

CREATE OR REPLACE TRIGGER trg_prep_job_updated_at
  BEFORE UPDATE ON preparation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_prep_job_updated_at();

-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE preparation_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparation_steps ENABLE ROW LEVEL SECURITY;



-- ==========================================
-- MIGRATION: 0005_analysis_qaqc.sql
-- ==========================================

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



-- ==========================================
-- MIGRATION: 0006_reporting_module.sql
-- ==========================================

-- 0006_reporting_module.sql
-- GeoChem LIMS: Reports and Report History/Audit Logs

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('Draft', 'Pending Approval', 'Approved', 'Delivered', 'Revised');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────
-- REPORTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
    id             VARCHAR(50)   PRIMARY KEY,              -- e.g. RPT-2041
    sample_id      UUID          NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
    client         VARCHAR(100)  NOT NULL,
    client_org_id  VARCHAR(100),
    status         report_status NOT NULL DEFAULT 'Draft',
    pages          INTEGER       NOT NULL DEFAULT 1,
    pdf_url        TEXT,
    comments       TEXT,
    approved_by    TEXT,
    approved_at    TIMESTAMPTZ,
    delivered_by   TEXT,
    delivered_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- REPORT HISTORY LOGS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.report_logs (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id    VARCHAR(50)   NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    status       report_status NOT NULL,
    action       VARCHAR(255)  NOT NULL, -- 'Generated', 'Approved', 'Rejected', 'Delivered', 'Revised'
    performed_by TEXT          NOT NULL,
    comments     TEXT,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reports_sample_id ON public.reports(sample_id);
CREATE INDEX IF NOT EXISTS idx_reports_status    ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_report_logs_id    ON public.report_logs(report_id);

-- ─────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_logs ENABLE ROW LEVEL SECURITY;

-- Explicit policies for reports with organization-level scoping for customers
DROP POLICY IF EXISTS "reports_select" ON public.reports;
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  (SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician')
  OR
  (client_org_id = (SELECT organization_id::text FROM public.users WHERE users.id = auth.uid()))
);
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));
DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));
DROP POLICY IF EXISTS "reports_delete" ON public.reports;
CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

-- Explicit policies for report logs
DROP POLICY IF EXISTS "report_logs_select" ON public.report_logs;
CREATE POLICY "report_logs_select" ON public.report_logs FOR SELECT USING (
  (SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician')
  OR
  (report_id IN (SELECT id FROM public.reports WHERE client_org_id = (SELECT organization_id::text FROM public.users WHERE users.id = auth.uid())))
);
DROP POLICY IF EXISTS "report_logs_insert" ON public.report_logs;
CREATE POLICY "report_logs_insert" ON public.report_logs FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));
DROP POLICY IF EXISTS "report_logs_update" ON public.report_logs;
CREATE POLICY "report_logs_update" ON public.report_logs FOR UPDATE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));
DROP POLICY IF EXISTS "report_logs_delete" ON public.report_logs;
CREATE POLICY "report_logs_delete" ON public.report_logs FOR DELETE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

-- ─────────────────────────────────────────────
-- AUDIT TRIGGER LINKAGE
-- ─────────────────────────────────────────────
CREATE OR REPLACE TRIGGER audit_reports_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();


-- ==========================================
-- MIGRATION: 0007_auth_user_provisioning.sql
-- ==========================================

-- 0007_auth_user_provisioning.sql
-- Automatic profile provisioning and signup-friendly RLS

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Allow users to update their own profile (name, phone)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Provision organization + public.users row when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id      UUID;
  v_org_name    TEXT;
  v_full_name   TEXT;
  v_first_name  TEXT;
  v_last_name   TEXT;
  v_phone       TEXT;
  v_role        public.user_role;
  v_db_role     TEXT;
BEGIN
  -- Extract metadata safely
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name',  '');
  v_full_name  := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(v_first_name || ' ' || v_last_name),  ''),
    split_part(NEW.email, '@', 1)
  );
  v_phone    := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '');
  v_org_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'organization_name', '')), '');
  v_db_role  := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));

  v_role := CASE v_db_role
    WHEN 'admin'      THEN 'admin'::public.user_role
    WHEN 'manager'    THEN 'manager'::public.user_role
    WHEN 'technician' THEN 'technician'::public.user_role
    ELSE                   'customer'::public.user_role
  END;

  BEGIN
    -- Create org if provided
    IF v_org_name IS NOT NULL THEN
      INSERT INTO public.organizations (name, contact_email)
      VALUES (v_org_name, NEW.email)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_org_id;
    END IF;

    -- Upsert profile (ON CONFLICT ensures idempotency)
    INSERT INTO public.users (id, full_name, role, organization_id, phone_number, updated_at)
    VALUES (NEW.id, v_full_name, v_role, v_org_id, v_phone, NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name       = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
      phone_number    = COALESCE(EXCLUDED.phone_number,  public.users.phone_number),
      organization_id = COALESCE(EXCLUDED.organization_id, public.users.organization_id),
      role = CASE
        WHEN public.users.role = 'customer' AND EXCLUDED.role <> 'customer'
          THEN EXCLUDED.role
        ELSE public.users.role
      END,
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile upsert failed for % — %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- MIGRATION: 0008_rbac_overhaul.sql
-- ==========================================

-- 0008_rbac_overhaul.sql
-- Phase 1: Authentication & RBAC hardening (Admin / Lab Coordinator / Customer)
--
-- Goals:
-- - Remove overly-permissive "authenticated can do anything" RLS policies
-- - Enforce org & role boundaries in Postgres (RLS is the source of truth)
-- - Prevent role escalation by non-admins
-- - Provide a dedicated audit trail for auth/admin events

-- ?????????????????????????????????????????????????????????????????????????????
-- Helpers
-- ?????????????????????????????????????????????????????????????????????????????

-- (Helper functions moved to initial schema section)

-- ?????????????????????????????????????????????????????????????????????????????
-- Auth/Admin audit events
-- ?????????????????????????????????????????????????????????????????????????????

DO $$ BEGIN
  CREATE TYPE public.auth_audit_event_type AS ENUM (
    'login',
    'logout',
    'user_created',
    'user_deleted',
    'role_changed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.auth_audit_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   public.auth_audit_event_type NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id),
  target_user_id uuid REFERENCES auth.users(id),
  old_role     public.user_role,
  new_role     public.user_role,
  ip          text,
  user_agent  text,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_audit_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit events
DROP POLICY IF EXISTS "admin_read_auth_audit_events" ON public.auth_audit_events;
CREATE POLICY "admin_read_auth_audit_events"
ON public.auth_audit_events
FOR SELECT
USING (public.is_admin());

-- Any authenticated user may insert their own login/logout events (actor must be self)
DROP POLICY IF EXISTS "self_insert_auth_audit_events" ON public.auth_audit_events;
CREATE POLICY "self_insert_auth_audit_events"
ON public.auth_audit_events
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND actor_user_id = auth.uid()
  AND event_type IN ('login', 'logout')
);

-- Inserts from triggers are allowed when actor is an admin coordinator (role changes),
-- or actor is null (system-triggered provisioning).
DROP POLICY IF EXISTS "trigger_insert_auth_audit_events" ON public.auth_audit_events;
CREATE POLICY "trigger_insert_auth_audit_events"
ON public.auth_audit_events
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (public.is_admin() OR public.is_lab_coordinator())
);

-- ?????????????????????????????????????????????????????????????????????????????
-- Prevent role escalation (non-admins cannot change role/org fields)
-- ?????????????????????????????????????????????????????????????????????????????

CREATE OR REPLACE FUNCTION public.prevent_user_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role public.user_role;
BEGIN
  SELECT public.current_user_role() INTO v_actor_role;

  -- Allow system/background updates with no auth context (v_actor_role is NULL).
  IF v_actor_role IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only admin may change another user's role or organization_id, and may not change their own
  -- role away from admin via client calls by accident.
  IF (NEW.role IS DISTINCT FROM OLD.role) THEN
    IF v_actor_role <> 'admin' THEN
      RAISE EXCEPTION 'Only Admin may change user roles';
    END IF;
  END IF;

  IF (NEW.organization_id IS DISTINCT FROM OLD.organization_id) THEN
    IF v_actor_role <> 'admin' THEN
      RAISE EXCEPTION 'Only Admin may change user organization';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_prevent_user_privilege_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_privilege_escalation();

-- ?????????????????????????????????????????????????????????????????????????????
-- Audit triggers for user lifecycle events
-- ?????????????????????????????????????????????????????????????????????????????

CREATE OR REPLACE FUNCTION public.audit_user_lifecycle_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.auth_audit_events (event_type, actor_user_id, target_user_id, meta)
    VALUES ('user_created', auth.uid(), NEW.id, jsonb_build_object('email', (SELECT email FROM auth.users WHERE id = NEW.id)));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.auth_audit_events (event_type, actor_user_id, target_user_id, meta)
    VALUES ('user_deleted', auth.uid(), OLD.id, jsonb_build_object('email', (SELECT email FROM auth.users WHERE id = OLD.id)));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      INSERT INTO public.auth_audit_events (event_type, actor_user_id, target_user_id, old_role, new_role)
      VALUES ('role_changed', auth.uid(), NEW.id, OLD.role, NEW.role);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_audit_user_lifecycle_events
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_lifecycle_events();

-- ?????????????????????????????????????????????????????????????????????????????
-- Replace permissive RLS policies with role/org policies
-- ?????????????????????????????????????????????????????????????????????????????

-- Reports / Report logs
DROP POLICY IF EXISTS "lab_access_reports" ON public.reports;
DROP POLICY IF EXISTS "lab_access_report_logs" ON public.report_logs;

-- Lab coordinators (incl. admin) can manage all reports and logs
DROP POLICY IF EXISTS "lab_manage_reports" ON public.reports;
CREATE POLICY "lab_manage_reports"
ON public.reports
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

DROP POLICY IF EXISTS "lab_manage_report_logs" ON public.report_logs;
CREATE POLICY "lab_manage_report_logs"
ON public.report_logs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

-- Customers may read *delivered* reports for their own org (derived via sample -> project -> org)
DROP POLICY IF EXISTS "customer_read_delivered_reports" ON public.reports;
CREATE POLICY "customer_read_delivered_reports"
ON public.reports
FOR SELECT
USING (
  public.current_user_role() = 'customer'
  AND status IN ('Delivered')
  AND sample_id IN (
    SELECT s.id
    FROM public.samples s
    JOIN public.projects p ON p.id = s.project_id
    WHERE p.organization_id = public.current_user_org_id()
  )
);

-- Preparation workflow (lab only)
DROP POLICY IF EXISTS "prep_jobs_lab_access" ON public.preparation_jobs;
DROP POLICY IF EXISTS "prep_steps_lab_access" ON public.preparation_steps;

DROP POLICY IF EXISTS "lab_manage_preparation_jobs" ON public.preparation_jobs;
CREATE POLICY "lab_manage_preparation_jobs"
ON public.preparation_jobs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

DROP POLICY IF EXISTS "lab_manage_preparation_steps" ON public.preparation_steps;
CREATE POLICY "lab_manage_preparation_steps"
ON public.preparation_steps
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

-- Analysis / QAQC (lab only)
DROP POLICY IF EXISTS "lab_access_runs" ON public.analytical_runs;
DROP POLICY IF EXISTS "lab_access_cal" ON public.calibration_records;
DROP POLICY IF EXISTS "lab_access_flags" ON public.qa_flags;
DROP POLICY IF EXISTS "lab_read_methods" ON public.analytical_methods;

DROP POLICY IF EXISTS "lab_manage_analytical_runs" ON public.analytical_runs;
CREATE POLICY "lab_manage_analytical_runs"
ON public.analytical_runs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

DROP POLICY IF EXISTS "lab_manage_calibration_records" ON public.calibration_records;
CREATE POLICY "lab_manage_calibration_records"
ON public.calibration_records
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

DROP POLICY IF EXISTS "lab_manage_qa_flags" ON public.qa_flags;
CREATE POLICY "lab_manage_qa_flags"
ON public.qa_flags
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

DROP POLICY IF EXISTS "lab_read_analytical_methods" ON public.analytical_methods;
CREATE POLICY "lab_read_analytical_methods"
ON public.analytical_methods
FOR SELECT
USING (public.is_lab_coordinator());



-- ==========================================
-- MIGRATION: 0009_realtime_sample_tracking.sql
-- ==========================================

-- 0009_realtime_sample_tracking.sql
-- Event-driven sample tracking with realtime timeline updates

CREATE TABLE IF NOT EXISTS public.sample_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_label TEXT NOT NULL,
  status_before TEXT,
  status_after TEXT,
  performed_by_user_id UUID REFERENCES auth.users(id),
  performed_by_name TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tracking_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_label TEXT NOT NULL,
  summary TEXT NOT NULL,
  stage TEXT,
  status TEXT,
  technician_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sample_logs_sample_created
  ON public.sample_logs(sample_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_sample_created
  ON public.tracking_updates(sample_id, created_at DESC);

ALTER TABLE public.sample_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_updates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "sample_logs_select" ON public.sample_logs;
CREATE POLICY "sample_logs_select"
    ON public.sample_logs FOR SELECT TO authenticated
    USING (
      public.is_lab_coordinator()
      OR sample_id IN (
        SELECT s.id FROM public.samples s
        JOIN public.projects p ON s.project_id = p.id
        WHERE p.organization_id = public.current_user_org_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "sample_logs_insert" ON public.sample_logs;
CREATE POLICY "sample_logs_insert"
    ON public.sample_logs FOR INSERT TO authenticated
    WITH CHECK (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "sample_logs_update" ON public.sample_logs;
CREATE POLICY "sample_logs_update"
    ON public.sample_logs FOR UPDATE TO authenticated
    USING (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "sample_logs_delete" ON public.sample_logs;
CREATE POLICY "sample_logs_delete"
    ON public.sample_logs FOR DELETE TO authenticated
    USING (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tracking_updates_select" ON public.tracking_updates;
CREATE POLICY "tracking_updates_select"
    ON public.tracking_updates FOR SELECT TO authenticated
    USING (
      public.is_lab_coordinator()
      OR sample_id IN (
        SELECT s.id FROM public.samples s
        JOIN public.projects p ON s.project_id = p.id
        WHERE p.organization_id = public.current_user_org_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tracking_updates_insert" ON public.tracking_updates;
CREATE POLICY "tracking_updates_insert"
    ON public.tracking_updates FOR INSERT TO authenticated
    WITH CHECK (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tracking_updates_update" ON public.tracking_updates;
CREATE POLICY "tracking_updates_update"
    ON public.tracking_updates FOR UPDATE TO authenticated
    USING (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tracking_updates_delete" ON public.tracking_updates;
CREATE POLICY "tracking_updates_delete"
    ON public.tracking_updates FOR DELETE TO authenticated
    USING (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.gcs_insert_tracking_event(
  p_sample_id UUID,
  p_event_type TEXT,
  p_event_label TEXT,
  p_summary TEXT,
  p_status_before TEXT DEFAULT NULL,
  p_status_after TEXT DEFAULT NULL,
  p_stage TEXT DEFAULT NULL,
  p_technician_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_performed_by_user_id UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_name TEXT;
BEGIN
  v_name := p_technician_name;
  IF v_name IS NULL AND p_performed_by_user_id IS NOT NULL THEN
    SELECT name INTO v_name FROM public.users WHERE id = p_performed_by_user_id;
  END IF;

  INSERT INTO public.sample_logs (
    sample_id,
    event_type,
    event_label,
    status_before,
    status_after,
    performed_by_user_id,
    performed_by_name,
    details
  ) VALUES (
    p_sample_id,
    p_event_type,
    p_event_label,
    p_status_before,
    p_status_after,
    p_performed_by_user_id,
    v_name,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  INSERT INTO public.tracking_updates (
    sample_id,
    event_type,
    event_label,
    summary,
    stage,
    status,
    technician_name,
    metadata
  ) VALUES (
    p_sample_id,
    p_event_type,
    p_event_label,
    p_summary,
    p_stage,
    COALESCE(p_status_after, p_status_before),
    v_name,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

CREATE OR REPLACE TRIGGER trg_gcs_samples_tracking
  AFTER INSERT OR UPDATE ON public.samples
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_on_samples_tracking();

CREATE OR REPLACE FUNCTION public.gcs_on_prep_steps_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_label TEXT;
  v_summary TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'In Progress' THEN
      v_label := format('%s Started', NEW.stage);
      v_summary := format('%s started for sample %s', NEW.stage, NEW.sample_id);
    ELSIF NEW.status = 'Completed' THEN
      v_label := format('%s Completed', NEW.stage);
      v_summary := format('%s completed for sample %s', NEW.stage, NEW.sample_id);
    ELSE
      RETURN NEW;
    END IF;

    PERFORM public.gcs_insert_tracking_event(
      NEW.sample_id,
      'preparation',
      v_label,
      v_summary,
      OLD.status,
      NEW.status,
      'Preparation',
      NEW.technician_name,
      jsonb_build_object(
        'source', 'preparation_steps.update',
        'stage', NEW.stage,
        'equipment', NEW.equipment,
        'notes', NEW.notes
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_gcs_prep_steps_tracking
  AFTER UPDATE ON public.preparation_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_on_prep_steps_tracking();

CREATE OR REPLACE FUNCTION public.gcs_on_analysis_runs_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_label TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_label := CASE NEW.status
      WHEN 'Running' THEN 'Analysis Started'
      WHEN 'Complete' THEN 'Analysis Completed'
      WHEN 'Failed' THEN 'QA/QC Failed'
      ELSE NULL
    END;

    IF v_label IS NOT NULL THEN
      PERFORM public.gcs_insert_tracking_event(
        NEW.sample_id,
        'analysis',
        v_label,
        format('Run %s moved from %s to %s', NEW.id, OLD.status, NEW.status),
        OLD.status::TEXT,
        NEW.status::TEXT,
        'Analysis',
        NEW.analyst_name,
        jsonb_build_object(
          'source', 'analytical_runs.update',
          'run_id', NEW.id,
          'method', NEW.method,
          'instrument_id', NEW.instrument_id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_gcs_analysis_runs_tracking
  AFTER UPDATE ON public.analytical_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_on_analysis_runs_tracking();

CREATE OR REPLACE FUNCTION public.gcs_on_results_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.qa_status IN ('Pass', 'Passed'))
     OR (TG_OP = 'UPDATE' AND NEW.qa_status IS DISTINCT FROM OLD.qa_status AND NEW.qa_status IN ('Pass', 'Passed')) THEN
    PERFORM public.gcs_insert_tracking_event(
      NEW.sample_id,
      'qaqc',
      'QA/QC Passed',
      format('QA/QC passed for %s using %s', NEW.element, NEW.method),
      NULL,
      NEW.qa_status::TEXT,
      'QA/QC',
      NEW.analyst_name,
      jsonb_build_object(
        'source', 'analytical_results',
        'element', NEW.element,
        'value', NEW.value,
        'unit', NEW.unit
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_gcs_results_tracking
  AFTER INSERT OR UPDATE ON public.analytical_results
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_on_results_tracking();

CREATE OR REPLACE FUNCTION public.gcs_on_reports_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_label TEXT;
  v_summary TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.gcs_insert_tracking_event(
      NEW.sample_id,
      'report',
      'Report Generated',
      format('Report %s generated for sample %s', NEW.id, NEW.sample_id),
      NULL,
      NEW.status::TEXT,
      'Reporting',
      NULL,
      jsonb_build_object('source', 'reports.insert', 'report_id', NEW.id)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_label := CASE NEW.status
      WHEN 'Approved' THEN 'Report Generated'
      WHEN 'Delivered' THEN 'Report Released'
      ELSE NULL
    END;

    IF v_label IS NULL THEN
      RETURN NEW;
    END IF;

    v_summary := format('Report %s moved from %s to %s', NEW.id, OLD.status, NEW.status);
    PERFORM public.gcs_insert_tracking_event(
      NEW.sample_id,
      'report',
      v_label,
      v_summary,
      OLD.status::TEXT,
      NEW.status::TEXT,
      'Reporting',
      NULL,
      jsonb_build_object('source', 'reports.update', 'report_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_gcs_reports_tracking
  AFTER INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_on_reports_tracking();

ALTER TABLE public.sample_logs REPLICA IDENTITY FULL;
ALTER TABLE public.tracking_updates REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sample_logs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_updates;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;


-- ==========================================
-- MIGRATION: 0010_notification_architecture.sql
-- ==========================================

-- 0010_notification_architecture.sql
-- WBS Phase 8: automation and notifications

CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT DEFAULT 'system',
  audience_role TEXT,
  channel TEXT NOT NULL DEFAULT 'in-app',
  body TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);


CREATE TABLE IF NOT EXISTS public.notification_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id BIGINT REFERENCES public.notifications(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_target_user_created
  ON public.notifications(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_role_created
  ON public.notifications(audience_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read
  ON public.notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_emails_status
  ON public.notification_emails(status, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_emails ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "notification_emails_admin_read" ON public.notification_emails;
CREATE POLICY "notification_emails_admin_read"
    ON public.notification_emails FOR SELECT
    USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "notification_emails_lab_insert" ON public.notification_emails;
CREATE POLICY "notification_emails_lab_insert"
    ON public.notification_emails FOR INSERT
    WITH CHECK (public.is_lab_coordinator() OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "notifications_self_or_role_read" ON public.notifications;
CREATE POLICY "notifications_self_or_role_read"
    ON public.notifications FOR SELECT
    USING (
      target_user_id = auth.uid()
      OR (audience_role IS NOT NULL AND audience_role = public.current_user_role()::text)
      OR public.is_admin()
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "notifications_self_update_read_state" ON public.notifications;
CREATE POLICY "notifications_self_update_read_state"
    ON public.notifications FOR UPDATE
    USING (target_user_id = auth.uid() OR public.is_admin())
    WITH CHECK (target_user_id = auth.uid() OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "notifications_system_insert" ON public.notifications;
CREATE POLICY "notifications_system_insert"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.gcs_enqueue_email_for_notification(
  p_notification_id BIGINT,
  p_recipient_user_id UUID,
  p_subject TEXT,
  p_body TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT au.email INTO v_email
  FROM auth.users au
  WHERE au.id = p_recipient_user_id;

  IF v_email IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notification_emails (
    notification_id,
    recipient_user_id,
    recipient_email,
    subject,
    body,
    status
  ) VALUES (
    p_notification_id,
    p_recipient_user_id,
    v_email,
    p_subject,
    p_body,
    'queued'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.gcs_insert_notification(
  p_target_user_id UUID,
  p_title TEXT,
  p_kind TEXT,
  p_event_type TEXT,
  p_audience_role TEXT DEFAULT NULL,
  p_body TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_send_email BOOLEAN DEFAULT FALSE
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.notifications (
    target_user_id,
    title,
    kind,
    is_read,
    event_type,
    audience_role,
    channel,
    body,
    metadata
  ) VALUES (
    p_target_user_id,
    p_title,
    COALESCE(p_kind, 'info'),
    false,
    p_event_type,
    p_audience_role,
    'in-app',
    p_body,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  IF p_send_email THEN
    PERFORM public.gcs_enqueue_email_for_notification(
      v_id,
      p_target_user_id,
      p_title,
      COALESCE(p_body, p_title)
    );
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.gcs_notify_users_for_tracking_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sample_org UUID;
  v_title TEXT;
  v_body TEXT;
  rec RECORD;
BEGIN
  IF NEW.event_label NOT IN (
    'Sample Received',
    'Sample Verified',
    'Sample Rejected',
    'Preparation Started',
    'Analysis Started',
    'QA/QC Failed',
    'Report Generated',
    'Report Ready',
    'Report Released'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT p.organization_id
  INTO v_sample_org
  FROM public.samples s
  JOIN public.projects p ON p.id = s.project_id
  WHERE s.id = NEW.sample_id
  LIMIT 1;

  v_title := format('%s • %s', NEW.event_label, NEW.sample_id);
  v_body := COALESCE(NEW.summary, format('Workflow event: %s', NEW.event_label));

  -- Customer: email + in-app
  FOR rec IN
    SELECT u.id
    FROM public.users u
    WHERE u.organization_id = v_sample_org
      AND u.role = 'customer'
  LOOP
    PERFORM public.gcs_insert_notification(
      rec.id,
      v_title,
      CASE WHEN NEW.event_label = 'QA/QC Failed' THEN 'alert' ELSE 'info' END,
      NEW.event_type,
      'customer',
      v_body,
      jsonb_build_object('sample_id', NEW.sample_id, 'event_label', NEW.event_label),
      TRUE
    );
  END LOOP;

  -- Lab Coordinator: workflow alerts + assignments
  FOR rec IN
    SELECT u.id
    FROM public.users u
    WHERE u.role IN ('manager', 'technician')
  LOOP
    PERFORM public.gcs_insert_notification(
      rec.id,
      v_title,
      CASE
        WHEN NEW.event_label IN ('QA/QC Failed', 'Sample Rejected') THEN 'alert'
        ELSE 'info'
      END,
      NEW.event_type,
      'manager',
      v_body,
      jsonb_build_object('sample_id', NEW.sample_id, 'event_label', NEW.event_label, 'channel', 'workflow-alert'),
      FALSE
    );
  END LOOP;

  -- Admin: approvals + security alerts
  FOR rec IN
    SELECT u.id
    FROM public.users u
    WHERE u.role = 'admin'
  LOOP
    PERFORM public.gcs_insert_notification(
      rec.id,
      v_title,
      CASE
        WHEN NEW.event_label IN ('QA/QC Failed', 'Sample Rejected') THEN 'alert'
        WHEN NEW.event_label IN ('Report Ready', 'Report Generated') THEN 'approval'
        ELSE 'info'
      END,
      NEW.event_type,
      'admin',
      v_body,
      jsonb_build_object('sample_id', NEW.sample_id, 'event_label', NEW.event_label),
      FALSE
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_gcs_tracking_notification_fanout
  AFTER INSERT ON public.tracking_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_notify_users_for_tracking_event();

CREATE OR REPLACE FUNCTION public.gcs_notify_account_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.gcs_insert_notification(
      NEW.id,
      'Account Approved',
      'approval',
      'account',
      NEW.role::text,
      'Your account has been provisioned. Access to GeoChem Suite is active.',
      jsonb_build_object('user_id', NEW.id),
      TRUE
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_gcs_account_approved_notify
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_notify_account_approved();

CREATE OR REPLACE FUNCTION public.gcs_notify_admin_security_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  v_title TEXT;
BEGIN
  IF NEW.event_type NOT IN ('role_changed', 'user_deleted') THEN
    RETURN NEW;
  END IF;

  v_title := CASE
    WHEN NEW.event_type = 'role_changed' THEN 'Security Alert • Role Changed'
    ELSE 'Security Alert • User Deleted'
  END;

  FOR rec IN SELECT u.id FROM public.users u WHERE u.role = 'admin' LOOP
    PERFORM public.gcs_insert_notification(
      rec.id,
      v_title,
      'alert',
      'security',
      'admin',
      'Administrative security-sensitive action recorded in auth audit events.',
      jsonb_build_object('audit_event_id', NEW.id, 'event_type', NEW.event_type),
      FALSE
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_gcs_auth_security_notify
  AFTER INSERT ON public.auth_audit_events
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_notify_admin_security_events();

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.notification_emails REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;


-- ==========================================
-- MIGRATION: 0011_fix_rbac_recursion.sql
-- ==========================================

-- 0011_fix_rbac_recursion.sql
-- Fix database RLS infinite recursion issues and synchronize user roles between public.users and auth.users metadata

-- 1. Overhaul helper functions to use SECURITY DEFINER so they execute with owner privileges.
-- This bypasses Row Level Security checks during role/org resolution, preventing recursion.

-- 2. Drop and recreate policies that directly query public.users recursively in their USING clauses.

-- Organizations policies
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (id = public.current_user_org_id());

DROP POLICY IF EXISTS "Admins and Managers can view all organizations" ON public.organizations;
CREATE POLICY "Admins and Managers can view all organizations"
  ON public.organizations FOR SELECT
  USING (public.current_user_role() IN ('admin', 'manager'));

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins and Managers can view all users" ON public.users;
CREATE POLICY "Admins and Managers can view all users"
  ON public.users FOR SELECT
  USING (public.current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
CREATE POLICY "Admins can update user roles"
  ON public.users FOR UPDATE
  USING (public.current_user_role() = 'admin');

-- Projects policies
DROP POLICY IF EXISTS "Customers view org projects" ON public.projects;
CREATE POLICY "Customers view org projects"
  ON public.projects FOR SELECT
  USING (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS "Lab staff view all projects" ON public.projects;
CREATE POLICY "Lab staff view all projects"
  ON public.projects FOR SELECT
  USING (public.is_lab_coordinator());

-- Samples policies
DROP POLICY IF EXISTS "Customers view org samples" ON public.samples;
CREATE POLICY "Customers view org samples"
  ON public.samples FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = public.current_user_org_id()));

DROP POLICY IF EXISTS "Lab staff view all samples" ON public.samples;
CREATE POLICY "Lab staff view all samples"
  ON public.samples FOR SELECT
  USING (public.is_lab_coordinator());

DROP POLICY IF EXISTS "Lab staff can insert/update samples" ON public.samples;
CREATE POLICY "Lab staff can insert/update samples"
  ON public.samples FOR ALL
  USING (public.is_lab_coordinator());

-- Custody Logs policies
DROP POLICY IF EXISTS "Customers view org custody logs" ON public.custody_logs;
CREATE POLICY "Customers view org custody logs"
  ON public.custody_logs FOR SELECT
  USING (sample_id IN (SELECT id FROM public.samples WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = public.current_user_org_id())));

DROP POLICY IF EXISTS "Lab staff manage custody logs" ON public.custody_logs;
CREATE POLICY "Lab staff manage custody logs"
  ON public.custody_logs FOR ALL
  USING (public.is_lab_coordinator());

-- Sample Notes policies
DROP POLICY IF EXISTS "Customers view org sample notes" ON public.sample_notes;
CREATE POLICY "Customers view org sample notes"
  ON public.sample_notes FOR SELECT
  USING (sample_id IN (SELECT id FROM public.samples WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = public.current_user_org_id())));

DROP POLICY IF EXISTS "Lab staff manage sample notes" ON public.sample_notes;
CREATE POLICY "Lab staff manage sample notes"
  ON public.sample_notes FOR ALL
  USING (public.is_lab_coordinator());

-- Analytical Results policies
DROP POLICY IF EXISTS "Customers view passed/completed analytical results" ON public.analytical_results;
CREATE POLICY "Customers view passed/completed analytical results"
  ON public.analytical_results FOR SELECT
  USING (qa_status = 'Passed' AND sample_id IN (SELECT id FROM public.samples WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = public.current_user_org_id())));

DROP POLICY IF EXISTS "Lab staff view and manage analytical results" ON public.analytical_results;
CREATE POLICY "Lab staff view and manage analytical results"
  ON public.analytical_results FOR ALL
  USING (public.is_lab_coordinator());

-- Audit Logs policies
DROP POLICY IF EXISTS "Admins and Managers can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and Managers can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.current_user_role() IN ('admin', 'manager'));

-- Reports policies (clean up old ones and replace)
DROP POLICY IF EXISTS "reports_select" ON public.reports;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
DROP POLICY IF EXISTS "reports_update" ON public.reports;
DROP POLICY IF EXISTS "reports_delete" ON public.reports;
DROP POLICY IF EXISTS "lab_manage_reports" ON public.reports;
DROP POLICY IF EXISTS "customer_read_delivered_reports" ON public.reports;

DROP POLICY IF EXISTS "reports_select" ON public.reports;
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  public.is_lab_coordinator()
  OR
  (client_org_id = public.current_user_org_id()::text)
);
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (public.is_lab_coordinator());
DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (public.is_lab_coordinator());
DROP POLICY IF EXISTS "reports_delete" ON public.reports;
CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING (public.is_lab_coordinator());

-- Report Logs policies
DROP POLICY IF EXISTS "report_logs_select" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_insert" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_update" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_delete" ON public.report_logs;
DROP POLICY IF EXISTS "lab_manage_report_logs" ON public.report_logs;

DROP POLICY IF EXISTS "report_logs_select" ON public.report_logs;
CREATE POLICY "report_logs_select" ON public.report_logs FOR SELECT USING (
  public.is_lab_coordinator()
  OR
  (report_id IN (SELECT id FROM public.reports WHERE client_org_id = public.current_user_org_id()::text))
);
DROP POLICY IF EXISTS "report_logs_insert" ON public.report_logs;
CREATE POLICY "report_logs_insert" ON public.report_logs FOR INSERT WITH CHECK (public.is_lab_coordinator());
DROP POLICY IF EXISTS "report_logs_update" ON public.report_logs;
CREATE POLICY "report_logs_update" ON public.report_logs FOR UPDATE USING (public.is_lab_coordinator());
DROP POLICY IF EXISTS "report_logs_delete" ON public.report_logs;
CREATE POLICY "report_logs_delete" ON public.report_logs FOR DELETE USING (public.is_lab_coordinator());


-- 3. Synchronize auth.users metadata with changes made to public.users roles
-- Trigger to keep raw_user_meta_data.role in sync with public.users.role

CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update auth.users metadata if role actually changed
  IF (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role) OR (TG_OP = 'INSERT') THEN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role::text)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_user_role_to_auth
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_auth_metadata();


-- ==========================================
-- MIGRATION: 0012_profile_sync_hardening.sql
-- ==========================================

-- 0012_profile_sync_hardening.sql
-- Phase: Profile Synchronization Hardening
--
-- Fixes:
--   1. Hardened handle_new_user trigger with exception handler (never crashes auth)
--   2. Added AFTER UPDATE trigger path for invite-link / dashboard-confirmed users
--   3. Backfills any auth.users that have no matching public.users row
--   4. upsert_user_profile RPC  — callable by the authenticated user on their own account
--   5. get_users_with_email RPC  — admin-only, returns public.users joined with auth.users.email
--   6. admin_update_user_role RPC — admin-only, updates role in public.users (metadata sync
--      is handled by the existing trg_sync_user_role_to_auth trigger from migration 0011)

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. NEW TRIGGER: handle_user_confirmed (AFTER UPDATE on auth.users)
--    Fires when a user confirms their email via an invite link or dashboard action.
--    This covers the path that Supabase Dashboard "Create User" uses.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_role      public.user_role;
  v_db_role   TEXT;
BEGIN
  -- Only act when email_confirmed_at transitions from NULL → a timestamp
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    v_full_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(
        COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
        COALESCE(NEW.raw_user_meta_data->>'last_name',  '')
      ), ''),
      split_part(NEW.email, '@', 1)
    );

    v_db_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
    v_role := CASE v_db_role
      WHEN 'admin'      THEN 'admin'::public.user_role
      WHEN 'manager'    THEN 'manager'::public.user_role
      WHEN 'technician' THEN 'technician'::public.user_role
      ELSE                   'customer'::public.user_role
    END;

    BEGIN
      INSERT INTO public.users (id, full_name, role, updated_at)
      VALUES (NEW.id, v_full_name, v_role, NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name  = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
        updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_user_confirmed: profile upsert failed for % — %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmed();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. BACKFILL: create missing public.users rows for existing auth.users
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_auth_user RECORD;
  v_full_name TEXT;
  v_db_role   TEXT;
  v_role      public.user_role;
  v_backfill_count INT := 0;
BEGIN
  FOR v_auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM   auth.users au
    WHERE  NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
  LOOP
    v_full_name := COALESCE(
      NULLIF(TRIM(v_auth_user.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(
        COALESCE(v_auth_user.raw_user_meta_data->>'first_name', '') || ' ' ||
        COALESCE(v_auth_user.raw_user_meta_data->>'last_name',  '')
      ), ''),
      split_part(v_auth_user.email, '@', 1)
    );

    v_db_role := LOWER(COALESCE(v_auth_user.raw_user_meta_data->>'role', 'customer'));
    v_role := CASE v_db_role
      WHEN 'admin'      THEN 'admin'::public.user_role
      WHEN 'manager'    THEN 'manager'::public.user_role
      WHEN 'technician' THEN 'technician'::public.user_role
      ELSE                   'customer'::public.user_role
    END;

    BEGIN
      INSERT INTO public.users (id, full_name, role, updated_at)
      VALUES (v_auth_user.id, v_full_name, v_role, NOW())
      ON CONFLICT (id) DO NOTHING;
      v_backfill_count := v_backfill_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Backfill: failed for user % — %', v_auth_user.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % orphaned auth users provisioned into public.users', v_backfill_count;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC: upsert_user_profile
--    Called by the application when syncProfile finds no public.users row.
--    Authenticated users may only upsert their OWN profile (auth.uid() = id).
--    SECURITY DEFINER bypasses RLS for the insert.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  p_full_name       TEXT    DEFAULT NULL,
  p_role            TEXT    DEFAULT 'customer',
  p_organization_id UUID    DEFAULT NULL,
  p_phone_number    TEXT    DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  full_name       TEXT,
  role            public.user_role,
  organization_id UUID,
  phone_number    TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_role public.user_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'upsert_user_profile: caller is not authenticated';
  END IF;

  -- Callers cannot grant themselves elevated roles via this function.
  -- The role parameter is accepted only to allow the trigger-path metadata to flow through;
  -- non-admins are silently clamped to their existing role or 'customer'.
  SELECT CASE LOWER(p_role)
    WHEN 'admin'      THEN 'admin'::public.user_role
    WHEN 'manager'    THEN 'manager'::public.user_role
    WHEN 'technician' THEN 'technician'::public.user_role
    ELSE                   'customer'::public.user_role
  END INTO v_role;

  -- If the user already exists in public.users, keep their existing role (no self-promotion)
  INSERT INTO public.users (id, full_name, role, organization_id, phone_number, updated_at)
  VALUES (
    v_uid,
    COALESCE(NULLIF(TRIM(p_full_name), ''), split_part((SELECT email FROM auth.users WHERE id = v_uid), '@', 1)),
    v_role,
    p_organization_id,
    p_phone_number,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name       = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), public.users.full_name),
    phone_number    = COALESCE(EXCLUDED.phone_number,  public.users.phone_number),
    organization_id = COALESCE(EXCLUDED.organization_id, public.users.organization_id),
    updated_at      = NOW();
  -- Note: role is intentionally NOT updated here — role changes go through admin_update_user_role

  RETURN QUERY
    SELECT u.id, u.full_name, u.role, u.organization_id, u.phone_number, u.created_at, u.updated_at
    FROM public.users u
    WHERE u.id = v_uid;
END;
$$;

-- Grant execute to authenticated users only (not anon)
REVOKE ALL ON FUNCTION public.upsert_user_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_user_profile TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RPC: get_users_with_email
--    Admin-only. Returns public.users joined with auth.users.email so the
--    application user list shows email addresses (public.users doesn't store email).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
  id              UUID,
  full_name       TEXT,
  role            public.user_role,
  organization_id UUID,
  phone_number    TEXT,
  email           TEXT,
  email_confirmed BOOLEAN,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'get_users_with_email: caller is not an admin';
  END IF;

  RETURN QUERY
    SELECT
      pu.id,
      pu.full_name,
      pu.role,
      pu.organization_id,
      pu.phone_number,
      au.email,
      (au.email_confirmed_at IS NOT NULL) AS email_confirmed,
      pu.created_at,
      pu.updated_at
    FROM public.users pu
    JOIN auth.users au ON au.id = pu.id
    ORDER BY pu.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_users_with_email FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_with_email TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RPC: admin_update_user_role
--    Admin-only. Updates a user's role in public.users.
--    The existing trg_sync_user_role_to_auth trigger (migration 0011) automatically
--    syncs the change back to auth.users.raw_user_meta_data.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_target_user_id UUID,
  p_new_role       TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_role public.user_role;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_update_user_role: caller is not an admin';
  END IF;

  v_new_role := CASE LOWER(p_new_role)
    WHEN 'admin'           THEN 'admin'::public.user_role
    WHEN 'manager'         THEN 'manager'::public.user_role
    WHEN 'lab coordinator' THEN 'manager'::public.user_role
    WHEN 'technician'      THEN 'technician'::public.user_role
    WHEN 'customer'        THEN 'customer'::public.user_role
    ELSE                        NULL
  END;

  IF v_new_role IS NULL THEN
    RAISE EXCEPTION 'admin_update_user_role: unknown role "%"', p_new_role;
  END IF;

  UPDATE public.users
  SET role       = v_new_role,
      updated_at = NOW()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_update_user_role: user % not found in public.users', p_target_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role TO authenticated;


-- ==========================================
-- MIGRATION: 0016_indexes_and_performance.sql
-- ==========================================

-- Add indices for common queries on samples and reports

CREATE INDEX IF NOT EXISTS idx_samples_status ON public.samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_created_at ON public.samples(created_at);
CREATE INDEX IF NOT EXISTS idx_samples_project_id ON public.samples(project_id);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- ==========================================
-- MIGRATION: 0017_schema_audit_fixes.sql
-- ==========================================

-- 1. Create missing storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('barcodes', 'barcodes', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('sample-documents', 'sample-documents', true) ON CONFLICT DO NOTHING;

-- 2. Create missing instruments table
CREATE TABLE IF NOT EXISTS public.instruments (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Operational',
    last_calibrated VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab staff view instruments" ON public.instruments FOR SELECT USING (true);
CREATE POLICY "Lab staff manage instruments" ON public.instruments FOR ALL USING (true);

-- 3. Add missing columns to tracking_updates referenced by 0015
ALTER TABLE public.tracking_updates ADD COLUMN IF NOT EXISTS update_type TEXT;
ALTER TABLE public.tracking_updates ADD COLUMN IF NOT EXISTS performed_by TEXT;

-- 4. Ensure samples columns align with use-samples-core payload
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS client_org_id VARCHAR(100);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS technician VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS received_from VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS registered_by_user_id VARCHAR(100);
