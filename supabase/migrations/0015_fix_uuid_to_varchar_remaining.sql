-- 0015_fix_uuid_to_varchar_remaining.sql

-- 1. Alter record_id in audit_logs to accommodate the string-based sample IDs
ALTER TABLE public.audit_logs ALTER COLUMN record_id TYPE VARCHAR(100);

-- 2. Update tracking event function to accept VARCHAR instead of UUID for p_sample_id
DROP FUNCTION IF EXISTS public.gcs_insert_tracking_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID);

CREATE OR REPLACE FUNCTION public.gcs_insert_tracking_event(
  p_sample_id VARCHAR(100),
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
    p_metadata
  );

  INSERT INTO public.tracking_updates (
    sample_id,
    update_type,
    summary,
    stage,
    performed_by,
    metadata
  ) VALUES (
    p_sample_id,
    p_event_type,
    p_summary,
    p_stage,
    v_name,
    p_metadata
  );
END;
$$;
