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
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Linked to Supabase Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Samples
CREATE TABLE public.samples (
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
CREATE TABLE public.custody_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.users(id),
    action VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample Notes
CREATE TABLE public.sample_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytical Results
CREATE TABLE public.analytical_results (
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
CREATE TABLE public.audit_logs (
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
CREATE TRIGGER audit_samples_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.samples
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_analytical_results_changes
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

