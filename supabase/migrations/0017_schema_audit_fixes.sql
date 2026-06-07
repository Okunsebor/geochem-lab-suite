-- 0017_schema_audit_fixes.sql

-- 1. Create missing storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('barcodes', 'barcodes', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true) ON CONFLICT DO NOTHING;

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

-- Enable RLS for instruments
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab staff view instruments"
  ON public.instruments FOR SELECT
  USING (true); -- Assuming all authenticated users can view

CREATE POLICY "Lab staff manage instruments"
  ON public.instruments FOR ALL
  USING (true);

-- 3. Add missing columns to tracking_updates referenced by 0015
ALTER TABLE public.tracking_updates ADD COLUMN IF NOT EXISTS update_type TEXT;
ALTER TABLE public.tracking_updates ADD COLUMN IF NOT EXISTS performed_by TEXT;

-- 4. Ensure samples columns align with use-samples-core payload
-- (These were mostly handled by 0013, but ensuring safeties)
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS client_org_id VARCHAR(100);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS technician VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS received_from VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS registered_by_user_id VARCHAR(100);
