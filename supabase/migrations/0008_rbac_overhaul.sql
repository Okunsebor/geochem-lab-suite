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
$;

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
$;

DROP TRIGGER IF EXISTS trg_audit_user_lifecycle_events ON public.users;
CREATE TRIGGER trg_audit_user_lifecycle_events
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_lifecycle_events();

-- ?????????????????????????????????????????????????????????????????????????????
-- Replace permissive RLS policies with role/org policies
-- ?????????????????????????????????????????????????????????????????????????????

-- Preparation workflow (lab only)
DROP POLICY IF EXISTS "prep_jobs_lab_access" ON public.preparation_jobs;
DROP POLICY IF EXISTS "prep_steps_lab_access" ON public.preparation_steps;

CREATE POLICY "lab_manage_preparation_jobs"
ON public.preparation_jobs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

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

CREATE POLICY "lab_manage_analytical_runs"
ON public.analytical_runs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "lab_manage_calibration_records"
ON public.calibration_records
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "lab_manage_qa_flags"
ON public.qa_flags
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "lab_read_analytical_methods"
ON public.analytical_methods
FOR SELECT
USING (public.is_lab_coordinator());

