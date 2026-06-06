-- 0007_auth_user_provisioning.sql
-- Automatic profile provisioning and signup-friendly RLS

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Allow users to update their own profile (name, phone)
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Provision organization + public.users row when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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
$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
