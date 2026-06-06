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
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  (SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician')
  OR
  (client_org_id = (SELECT organization_id::text FROM public.users WHERE users.id = auth.uid()))
);
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

-- Explicit policies for report logs
CREATE POLICY "report_logs_select" ON public.report_logs FOR SELECT USING (
  (SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician')
  OR
  (report_id IN (SELECT id FROM public.reports WHERE client_org_id = (SELECT organization_id::text FROM public.users WHERE users.id = auth.uid())))
);
CREATE POLICY "report_logs_insert" ON public.report_logs FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "report_logs_update" ON public.report_logs FOR UPDATE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));
CREATE POLICY "report_logs_delete" ON public.report_logs FOR DELETE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

-- ─────────────────────────────────────────────
-- AUDIT TRIGGER LINKAGE
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_reports_changes ON public.reports;
CREATE TRIGGER audit_reports_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
