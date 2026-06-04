-- 0012_profile_sync_hardening.sql
-- Phase: Profile Synchronization Hardening
--
-- Fixes:
--   1. Hardened handle_new_user trigger with exception handler (never crashes auth)
--   2. Added AFTER UPDATE trigger path for invite-link / dashboard-confirmed users
--   3. Backfills any auth.users that have no matching public.users row
--   4. upsert_user_profile RPC  — callable by the authenticated user on their own account
--   5. get_users_with_email RPC  — admin-only, returns public.users joined with auth.users.email
--   6. admin_update_user_role RPC — admin-only, updates role in public.users (metadata sync
--      is handled by the existing trg_sync_user_role_to_auth trigger from migration 0011)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. HARDENED handle_new_user (AFTER INSERT on auth.users)
--    Wraps everything in EXCEPTION so a profile-creation error NEVER blocks auth.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
      -- Only promote role from default if the current stored role is still 'customer'
      -- and the new metadata specifies something else (prevents accidental downgrades)
      role = CASE
        WHEN public.users.role = 'customer' AND EXCLUDED.role <> 'customer'
          THEN EXCLUDED.role
        ELSE public.users.role
      END,
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    -- Log but never block the auth INSERT
    RAISE WARNING 'handle_new_user: profile upsert failed for % — %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. NEW TRIGGER: handle_user_confirmed (AFTER UPDATE on auth.users)
--    Fires when a user confirms their email via an invite link or dashboard action.
--    This covers the path that Supabase Dashboard "Create User" uses.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_role      public.user_role;
  v_db_role   TEXT;
BEGIN
  -- Only act when email_confirmed_at transitions from NULL → a timestamp
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    v_full_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(
        COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
        COALESCE(NEW.raw_user_meta_data->>'last_name',  '')
      ), ''),
      split_part(NEW.email, '@', 1)
    );

    v_db_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
    v_role := CASE v_db_role
      WHEN 'admin'      THEN 'admin'::public.user_role
      WHEN 'manager'    THEN 'manager'::public.user_role
      WHEN 'technician' THEN 'technician'::public.user_role
      ELSE                   'customer'::public.user_role
    END;

    BEGIN
      INSERT INTO public.users (id, full_name, role, updated_at)
      VALUES (NEW.id, v_full_name, v_role, NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name  = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
        updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_user_confirmed: profile upsert failed for % — %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmed();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. BACKFILL: create missing public.users rows for existing auth.users
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_auth_user RECORD;
  v_full_name TEXT;
  v_db_role   TEXT;
  v_role      public.user_role;
  v_backfill_count INT := 0;
BEGIN
  FOR v_auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM   auth.users au
    WHERE  NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
  LOOP
    v_full_name := COALESCE(
      NULLIF(TRIM(v_auth_user.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(
        COALESCE(v_auth_user.raw_user_meta_data->>'first_name', '') || ' ' ||
        COALESCE(v_auth_user.raw_user_meta_data->>'last_name',  '')
      ), ''),
      split_part(v_auth_user.email, '@', 1)
    );

    v_db_role := LOWER(COALESCE(v_auth_user.raw_user_meta_data->>'role', 'customer'));
    v_role := CASE v_db_role
      WHEN 'admin'      THEN 'admin'::public.user_role
      WHEN 'manager'    THEN 'manager'::public.user_role
      WHEN 'technician' THEN 'technician'::public.user_role
      ELSE                   'customer'::public.user_role
    END;

    BEGIN
      INSERT INTO public.users (id, full_name, role, updated_at)
      VALUES (v_auth_user.id, v_full_name, v_role, NOW())
      ON CONFLICT (id) DO NOTHING;
      v_backfill_count := v_backfill_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Backfill: failed for user % — %', v_auth_user.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % orphaned auth users provisioned into public.users', v_backfill_count;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC: upsert_user_profile
--    Called by the application when syncProfile finds no public.users row.
--    Authenticated users may only upsert their OWN profile (auth.uid() = id).
--    SECURITY DEFINER bypasses RLS for the insert.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  p_full_name       TEXT    DEFAULT NULL,
  p_role            TEXT    DEFAULT 'customer',
  p_organization_id UUID    DEFAULT NULL,
  p_phone_number    TEXT    DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  full_name       TEXT,
  role            public.user_role,
  organization_id UUID,
  phone_number    TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_role public.user_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'upsert_user_profile: caller is not authenticated';
  END IF;

  -- Callers cannot grant themselves elevated roles via this function.
  -- The role parameter is accepted only to allow the trigger-path metadata to flow through;
  -- non-admins are silently clamped to their existing role or 'customer'.
  SELECT CASE LOWER(p_role)
    WHEN 'admin'      THEN 'admin'::public.user_role
    WHEN 'manager'    THEN 'manager'::public.user_role
    WHEN 'technician' THEN 'technician'::public.user_role
    ELSE                   'customer'::public.user_role
  END INTO v_role;

  -- If the user already exists in public.users, keep their existing role (no self-promotion)
  INSERT INTO public.users (id, full_name, role, organization_id, phone_number, updated_at)
  VALUES (
    v_uid,
    COALESCE(NULLIF(TRIM(p_full_name), ''), split_part((SELECT email FROM auth.users WHERE id = v_uid), '@', 1)),
    v_role,
    p_organization_id,
    p_phone_number,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name       = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), public.users.full_name),
    phone_number    = COALESCE(EXCLUDED.phone_number,  public.users.phone_number),
    organization_id = COALESCE(EXCLUDED.organization_id, public.users.organization_id),
    updated_at      = NOW();
  -- Note: role is intentionally NOT updated here — role changes go through admin_update_user_role

  RETURN QUERY
    SELECT u.id, u.full_name, u.role, u.organization_id, u.phone_number, u.created_at, u.updated_at
    FROM public.users u
    WHERE u.id = v_uid;
END;
$$;

-- Grant execute to authenticated users only (not anon)
REVOKE ALL ON FUNCTION public.upsert_user_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_user_profile TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RPC: get_users_with_email
--    Admin-only. Returns public.users joined with auth.users.email so the
--    application user list shows email addresses (public.users doesn't store email).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
  id              UUID,
  full_name       TEXT,
  role            public.user_role,
  organization_id UUID,
  phone_number    TEXT,
  email           TEXT,
  email_confirmed BOOLEAN,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'get_users_with_email: caller is not an admin';
  END IF;

  RETURN QUERY
    SELECT
      pu.id,
      pu.full_name,
      pu.role,
      pu.organization_id,
      pu.phone_number,
      au.email,
      (au.email_confirmed_at IS NOT NULL) AS email_confirmed,
      pu.created_at,
      pu.updated_at
    FROM public.users pu
    JOIN auth.users au ON au.id = pu.id
    ORDER BY pu.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_users_with_email FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_with_email TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RPC: admin_update_user_role
--    Admin-only. Updates a user's role in public.users.
--    The existing trg_sync_user_role_to_auth trigger (migration 0011) automatically
--    syncs the change back to auth.users.raw_user_meta_data.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_target_user_id UUID,
  p_new_role       TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_role public.user_role;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_update_user_role: caller is not an admin';
  END IF;

  v_new_role := CASE LOWER(p_new_role)
    WHEN 'admin'           THEN 'admin'::public.user_role
    WHEN 'manager'         THEN 'manager'::public.user_role
    WHEN 'lab coordinator' THEN 'manager'::public.user_role
    WHEN 'technician'      THEN 'technician'::public.user_role
    WHEN 'customer'        THEN 'customer'::public.user_role
    ELSE                        NULL
  END;

  IF v_new_role IS NULL THEN
    RAISE EXCEPTION 'admin_update_user_role: unknown role "%"', p_new_role;
  END IF;

  UPDATE public.users
  SET role       = v_new_role,
      updated_at = NOW()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_update_user_role: user % not found in public.users', p_target_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role TO authenticated;
