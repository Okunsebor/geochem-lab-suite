import fs from 'fs';
import path from 'path';

const migrationsDir = 'c:/Users/PROF. OKUNSEBOR/geochem-lab-suite/supabase/migrations';

function getFilePath(filename) {
  return path.join(migrationsDir, filename);
}

function updateFile(filename, updater) {
  const p = getFilePath(filename);
  const content = fs.readFileSync(p, 'utf8');
  const newContent = updater(content);
  if (content !== newContent) {
    fs.writeFileSync(p, newContent, 'utf8');
    console.log(`Updated: ${filename}`);
  } else {
    console.log(`No changes needed for: ${filename}`);
  }
}

// 1. Audit and Fix 0009_realtime_sample_tracking.sql
updateFile('0009_realtime_sample_tracking.sql', (content) => {
  // Replace RLS Policies
  let res = content.replace(
    /DO \$+[\s\S]*?CREATE POLICY "sample_logs_select_authenticated"[\s\S]*?END \$+;/g,
    () => `DO $$
BEGIN
  CREATE POLICY "sample_logs_select"
    ON public.sample_logs FOR SELECT TO authenticated
    USING (
      public.is_lab_coordinator()
      OR sample_id IN (
        SELECT s.id FROM public.samples s
        JOIN public.projects p ON s.project_id = p.id
        WHERE p.organization_id = public.current_user_org_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`
  );

  res = res.replace(
    /DO \$+[\s\S]*?CREATE POLICY "sample_logs_insert_authenticated"[\s\S]*?END \$+;/g,
    () => `DO $$
BEGIN
  CREATE POLICY "sample_logs_insert"
    ON public.sample_logs FOR INSERT TO authenticated
    WITH CHECK (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "sample_logs_update"
    ON public.sample_logs FOR UPDATE TO authenticated
    USING (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "sample_logs_delete"
    ON public.sample_logs FOR DELETE TO authenticated
    USING (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`
  );

  res = res.replace(
    /DO \$+[\s\S]*?CREATE POLICY "tracking_updates_select_authenticated"[\s\S]*?END \$+;/g,
    () => `DO $$
BEGIN
  CREATE POLICY "tracking_updates_select"
    ON public.tracking_updates FOR SELECT TO authenticated
    USING (
      public.is_lab_coordinator()
      OR sample_id IN (
        SELECT s.id FROM public.samples s
        JOIN public.projects p ON s.project_id = p.id
        WHERE p.organization_id = public.current_user_org_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`
  );

  res = res.replace(
    /DO \$+[\s\S]*?CREATE POLICY "tracking_updates_insert_authenticated"[\s\S]*?END \$+;/g,
    () => `DO $$
BEGIN
  CREATE POLICY "tracking_updates_insert"
    ON public.tracking_updates FOR INSERT TO authenticated
    WITH CHECK (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "tracking_updates_update"
    ON public.tracking_updates FOR UPDATE TO authenticated
    USING (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "tracking_updates_delete"
    ON public.tracking_updates FOR DELETE TO authenticated
    USING (public.is_lab_coordinator());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`
  );

  // Replace public.gcs_insert_tracking_event function
  res = res.replace(
    /CREATE OR REPLACE FUNCTION public\.gcs_insert_tracking_event[\s\S]*?END;\n\$+;/g,
    () => `CREATE OR REPLACE FUNCTION public.gcs_insert_tracking_event(
  p_sample_id UUID,
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
    v_name,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;`
  );

  // Replace NEW.technician references in gcs_on_samples_tracking
  // Also eliminate dead 'Registered' workflow state check
  res = res.replace(
    /CREATE OR REPLACE FUNCTION public\.gcs_on_samples_tracking\(\)[\s\S]*?RETURN NEW;[\s\S]*?END;[\s\S]*?\$+;/g,
    () => `CREATE OR REPLACE FUNCTION public.gcs_on_samples_tracking()
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
      NULL,
      jsonb_build_object('source', 'samples.insert')
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_event_label := CASE NEW.status::TEXT
      WHEN 'Verified' THEN 'Sample Verified'
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
      NULL,
      jsonb_build_object('source', 'samples.update', 'from', OLD.status, 'to', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;`
  );

  // Replaces remaining single dollar signs in RLS or other constructs
  res = res.replace(/(DO|END|AS) \$(\n|\s|;)/g, '$1 $$$$$2');

  return res;
});

// 2. Audit and Fix 0008_rbac_overhaul.sql
updateFile('0008_rbac_overhaul.sql', (content) => {
  // Replace helper functions with correct SECURITY DEFINER implementations
  const res = content.replace(
    /-- Helpers[\s\S]*?(?=-- Auth\/Admin)/,
    () => `-- Helpers
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

-- ?????????????????????????????????????????????????????????????????????????????
`
  );

  return res;
});

// 3. Audit and Fix 0011_fix_rbac_recursion.sql
updateFile('0011_fix_rbac_recursion.sql', (content) => {
  // Remove helper function definitions current_user_role, current_user_org_id, is_lab_coordinator, is_admin
  const res = content.replace(
    /CREATE OR REPLACE FUNCTION public\.current_user_role\(\)[\s\S]*?-- 2\. Drop and recreate policies/g,
    () => `-- 2. Drop and recreate policies`
  );
  return res;
});

// 4. Audit and Fix 0007_auth_user_provisioning.sql
updateFile('0007_auth_user_provisioning.sql', (content) => {
  // Replace handle_new_user definition with secure hardened exception handler version from 0012
  let res = content.replace(
    /CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)[\s\S]*?RETURN NEW;[\s\S]*?END;[\s\S]*?\$+;/g,
    () => `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id      UUID;
  v_org_name    TEXT;
  v_full_name   TEXT;
  v_first_name  TEXT;
  v_last_name   TEXT;
  v_phone       TEXT;
  v_role        public.user_role;
  v_db_role     TEXT;
BEGIN
  -- Extract metadata safely
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name',  '');
  v_full_name  := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(v_first_name || ' ' || v_last_name),  ''),
    split_part(NEW.email, '@', 1)
  );
  v_phone    := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '');
  v_org_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'organization_name', '')), '');
  v_db_role  := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));

  v_role := CASE v_db_role
    WHEN 'admin'      THEN 'admin'::public.user_role
    WHEN 'manager'    THEN 'manager'::public.user_role
    WHEN 'technician' THEN 'technician'::public.user_role
    ELSE                   'customer'::public.user_role
  END;

  BEGIN
    -- Create org if provided
    IF v_org_name IS NOT NULL THEN
      INSERT INTO public.organizations (name, contact_email)
      VALUES (v_org_name, NEW.email)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_org_id;
    END IF;

    -- Upsert profile (ON CONFLICT ensures idempotency)
    INSERT INTO public.users (id, full_name, role, organization_id, phone_number, updated_at)
    VALUES (NEW.id, v_full_name, v_role, v_org_id, v_phone, NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name       = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
      phone_number    = COALESCE(EXCLUDED.phone_number,  public.users.phone_number),
      organization_id = COALESCE(EXCLUDED.organization_id, public.users.organization_id),
      role = CASE
        WHEN public.users.role = 'customer' AND EXCLUDED.role <> 'customer'
          THEN EXCLUDED.role
        ELSE public.users.role
      END,
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile upsert failed for % — %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;`
  );

  // Fix single dollar signs if any
  res = res.replace(/(DO|END|AS) \$(\n|\s|;)/g, '$1 $$$$$2');

  return res;
});

// 5. Audit and Fix 0012_profile_sync_hardening.sql
updateFile('0012_profile_sync_hardening.sql', (content) => {
  // Remove duplicate handle_new_user definition and its trigger recreation from 0012
  const res = content.replace(
    /-- 1\. HARDENED handle_new_user[\s\S]*?-- 2\. NEW TRIGGER: handle_user_confirmed/g,
    () => `-- 2. NEW TRIGGER: handle_user_confirmed`
  );
  return res;
});

// 6. Repair any remaining single dollar signs across all files in migrations directory
const files = fs.readdirSync(migrationsDir);
for (const file of files) {
  if (file.endsWith('.sql')) {
    updateFile(file, (content) => {
      // Find single $ dollar quoting errors, and replace with $$
      let replaced = content.replace(/(DO|END|AS) \$(\n|\s|;)/g, '$1 $$$$$2');
      // Let's also check for '$ ;'
      replaced = replaced.replace(/(DO|END|AS) \$ ;/g, '$1 $$$$ ;');
      return replaced;
    });
  }
}

console.log('Audit and fix script execution finished.');
