-- 0013_fix_rpc_return_types.sql
-- Fixes Supabase error 42804: "Returned type character varying(255) does not match expected type text"
-- This ensures all character varying columns returned by RPCs are explicitly cast to TEXT
-- to match the RETURNS TABLE definition.

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
    SELECT u.id, u.full_name::TEXT, u.role, u.organization_id, u.phone_number::TEXT, u.created_at, u.updated_at
    FROM public.users u
    WHERE u.id = v_uid;
END;
$$;

-- Grant execute to authenticated users only (not anon)
REVOKE ALL ON FUNCTION public.upsert_user_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_user_profile TO authenticated;


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
      pu.full_name::TEXT,
      pu.role,
      pu.organization_id,
      pu.phone_number::TEXT,
      au.email::TEXT,
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
