-- 0016_indexes_and_performance.sql
-- Add indices for common queries on samples and reports

CREATE INDEX IF NOT EXISTS idx_samples_status ON public.samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_created_at ON public.samples(created_at);
CREATE INDEX IF NOT EXISTS idx_samples_project_id ON public.samples(project_id);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);
