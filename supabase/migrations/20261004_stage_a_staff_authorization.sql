-- ========================================================
-- CAMPUSWAVE MIGRATION: STAGE A — SECURE OWNER & STAFF AUTHORIZATION
-- ========================================================

-- 1. AUTHORIZED STAFF TABLE
-- Restricted store of approved staff emails for RJ and Admin privileges.
-- Students are never listed here. Plaintext passwords are NEVER stored.

CREATE TABLE IF NOT EXISTS public.authorized_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role public.user_role NOT NULL CHECK (role IN ('rj', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index on normalized (trimmed lowercase) email
CREATE UNIQUE INDEX IF NOT EXISTS idx_authorized_staff_email_norm 
  ON public.authorized_staff (lower(trim(email)));

-- Enable Row Level Security
ALTER TABLE public.authorized_staff ENABLE ROW LEVEL SECURITY;

-- 2. HARDENED GET_USER_ROLE FUNCTION
-- Evaluates caller's role based solely on authenticated session (auth.uid()).
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. AUTHORIZED STAFF RLS POLICIES
-- Only verified Station Administrators can inspect or manage authorized staff records.
-- Students and RJs have zero direct access.
DROP POLICY IF EXISTS "Admins manage authorized staff" ON public.authorized_staff;
CREATE POLICY "Admins manage authorized staff" ON public.authorized_staff
  FOR ALL USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- 4. INITIAL STATION OWNER RECORD
-- Seeds the initial station owner/admin authorization.
INSERT INTO public.authorized_staff (email, role, is_active)
VALUES ('jalagadugulavivekraj@gmail.com', 'admin', true)
ON CONFLICT (lower(trim(email)))
DO UPDATE SET role = 'admin', is_active = true, updated_at = NOW();

-- 5. INITIAL OWNER DELETION & DEACTIVATION PROTECTION TRIGGER
-- Prevents accidental deletion, deactivation, or demotion of the primary station owner.
CREATE OR REPLACE FUNCTION public.protect_initial_owner_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF lower(trim(OLD.email)) = 'jalagadugulavivekraj@gmail.com' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Action Prohibited: The initial station owner record (jalagadugulavivekraj@gmail.com) cannot be deleted.';
    ELSIF TG_OP = 'UPDATE' AND (NEW.is_active = false OR NEW.role <> 'admin') THEN
      RAISE EXCEPTION 'Action Prohibited: The initial station owner record cannot be deactivated or demoted.';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_owner_staff ON public.authorized_staff;
CREATE TRIGGER trg_protect_owner_staff
  BEFORE UPDATE OR DELETE ON public.authorized_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_initial_owner_staff();

-- 6. SECURE ROLE SYNCHRONIZATION FUNCTION (RPC)
-- Securely synchronizes the authenticated user's profile role with their authorized_staff status.
-- Cannot be tricked by client-supplied IDs or roles; strictly reads auth.uid() & auth.users.
CREATE OR REPLACE FUNCTION public.sync_authorized_staff_role()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_staff_role public.user_role;
  v_target_role public.user_role := 'student';
  v_updated_profile public.profiles%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthenticated session', 'role', 'anon');
  END IF;

  -- Read authenticated email directly from auth.users
  SELECT lower(trim(email)) INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NOT NULL THEN
    -- Check active authorized_staff
    SELECT role INTO v_staff_role
    FROM public.authorized_staff
    WHERE lower(trim(email)) = v_email AND is_active = true
    LIMIT 1;

    IF v_staff_role IS NOT NULL THEN
      v_target_role := v_staff_role;
    END IF;
  END IF;

  -- Update profile role to match authorization
  UPDATE public.profiles
  SET role = v_target_role,
      updated_at = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_updated_profile;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'role', v_target_role
  );
END;
$$;

-- 7. AUTOMATIC USER PROVISIONING TRIGGER
-- Ensures any newly registered Supabase Auth user automatically gets their authorized role
-- or default 'student' upon account creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_norm_email TEXT;
  v_assigned_role public.user_role := 'student';
  v_staff_role public.user_role;
  v_full_name TEXT;
BEGIN
  v_norm_email := lower(trim(NEW.email));
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(v_norm_email, '@', 1));

  -- Check if this email is in authorized_staff
  SELECT role INTO v_staff_role
  FROM public.authorized_staff
  WHERE lower(trim(email)) = v_norm_email AND is_active = true
  LIMIT 1;

  IF v_staff_role IS NOT NULL THEN
    v_assigned_role := v_staff_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, v_norm_email, v_full_name, v_assigned_role)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = v_assigned_role,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. SYNC EXISTING PROFILES IF OWNER HAS ALREADY REGISTERED
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE lower(trim(email)) = 'jalagadugulavivekraj@gmail.com';

-- 9. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.sync_authorized_staff_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
