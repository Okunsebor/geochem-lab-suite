-- 0019_generate_next_sample_id.sql
-- Create database-backed safe generation of next sample ID sequence

CREATE OR REPLACE FUNCTION public.get_next_sample_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_num INT;
  v_next_num INT;
BEGIN
  -- Extract the maximum numeric value from matching GCS-XXXXX format IDs
  SELECT MAX((substring(id FROM '^GCS-([0-9]+)')::INT)) INTO v_max_num
  FROM public.samples
  WHERE id ~ '^GCS-[0-9]+$';

  IF v_max_num IS NULL THEN
    v_next_num := 24000;
  ELSE
    v_next_num := v_max_num + 1;
  END IF;

  RETURN 'GCS-' || v_next_num::TEXT;
END;
$$;

-- Grant execution permissions to authenticated users
REVOKE ALL ON FUNCTION public.get_next_sample_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_sample_id TO authenticated;
