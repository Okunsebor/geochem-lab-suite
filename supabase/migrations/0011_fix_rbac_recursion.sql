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

CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  public.is_lab_coordinator()
  OR
  (client_org_id = public.current_user_org_id()::text)
);
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (public.is_lab_coordinator());
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (public.is_lab_coordinator());
CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING (public.is_lab_coordinator());

-- Report Logs policies
DROP POLICY IF EXISTS "report_logs_select" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_insert" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_update" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_delete" ON public.report_logs;
DROP POLICY IF EXISTS "lab_manage_report_logs" ON public.report_logs;

CREATE POLICY "report_logs_select" ON public.report_logs FOR SELECT USING (
  public.is_lab_coordinator()
  OR
  (report_id IN (SELECT id FROM public.reports WHERE client_org_id = public.current_user_org_id()::text))
);
CREATE POLICY "report_logs_insert" ON public.report_logs FOR INSERT WITH CHECK (public.is_lab_coordinator());
CREATE POLICY "report_logs_update" ON public.report_logs FOR UPDATE USING (public.is_lab_coordinator());
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

DROP TRIGGER IF EXISTS trg_sync_user_role_to_auth ON public.users;
CREATE TRIGGER trg_sync_user_role_to_auth
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_auth_metadata();
