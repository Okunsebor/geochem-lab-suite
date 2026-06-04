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
LANGUAGE sql
STABLE
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_lab_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_user_role() IN ('admin', 'manager', 'technician')
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_user_role() = 'admin'
$$;

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT u.organization_id
  FROM public.users u
  WHERE u.id = auth.uid()
$$;

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

DROP TRIGGER IF EXISTS trg_prevent_user_privilege_escalation ON public.users;
CREATE TRIGGER trg_prevent_user_privilege_escalation
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

DROP TRIGGER IF EXISTS trg_audit_user_lifecycle_events ON public.users;
CREATE TRIGGER trg_audit_user_lifecycle_events
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
CREATE POLICY "lab_manage_reports"
ON public.reports
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "lab_manage_report_logs"
ON public.report_logs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

-- Customers may read *delivered* reports for their own org (derived via sample -> project -> org)
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

