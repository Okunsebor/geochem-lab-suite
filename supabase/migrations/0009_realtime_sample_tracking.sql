-- 0009_realtime_sample_tracking.sql
-- Event-driven sample tracking with realtime timeline updates

CREATE TABLE IF NOT EXISTS public.sample_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id TEXT NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
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
  sample_id TEXT NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
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
  CREATE POLICY "sample_logs_select_authenticated"
    ON public.sample_logs FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "sample_logs_insert_authenticated"
    ON public.sample_logs FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "tracking_updates_select_authenticated"
    ON public.tracking_updates FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "tracking_updates_insert_authenticated"
    ON public.tracking_updates FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.gcs_insert_tracking_event(
  p_sample_id TEXT,
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
BEGIN
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
    p_technician_name,
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
    p_technician_name,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.gcs_on_samples_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_label TEXT;
  v_summary TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.gcs_insert_tracking_event(
      NEW.id,
      'status',
      'Sample Received',
      format('Sample %s received by GeoChem intake', NEW.id),
      NULL,
      NEW.status::TEXT,
      'Intake',
      NEW.technician,
      jsonb_build_object('source', 'samples.insert')
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_event_label := CASE NEW.status::TEXT
      WHEN 'Verified' THEN 'Sample Verified'
      WHEN 'Registered' THEN 'Sample Registered'
      WHEN 'In Preparation' THEN 'Preparation Started'
      WHEN 'In Analysis' THEN 'Analysis Started'
      WHEN 'Completed' THEN 'Sample Completed'
      WHEN 'Report Ready' THEN 'Report Generated'
      ELSE format('Status Updated: %s', NEW.status::TEXT)
    END;

    v_summary := format('Status changed from %s to %s', OLD.status::TEXT, NEW.status::TEXT);

    PERFORM public.gcs_insert_tracking_event(
      NEW.id,
      'status',
      v_event_label,
      v_summary,
      OLD.status::TEXT,
      NEW.status::TEXT,
      'Workflow',
      NEW.technician,
      jsonb_build_object('source', 'samples.update', 'from', OLD.status, 'to', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gcs_samples_tracking ON public.samples;
CREATE TRIGGER trg_gcs_samples_tracking
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

DROP TRIGGER IF EXISTS trg_gcs_prep_steps_tracking ON public.preparation_steps;
CREATE TRIGGER trg_gcs_prep_steps_tracking
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

DROP TRIGGER IF EXISTS trg_gcs_analysis_runs_tracking ON public.analytical_runs;
CREATE TRIGGER trg_gcs_analysis_runs_tracking
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

DROP TRIGGER IF EXISTS trg_gcs_results_tracking ON public.analytical_results;
CREATE TRIGGER trg_gcs_results_tracking
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

DROP TRIGGER IF EXISTS trg_gcs_reports_tracking ON public.reports;
CREATE TRIGGER trg_gcs_reports_tracking
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
