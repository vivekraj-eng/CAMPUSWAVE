-- ========================================================
-- CAMPUSWAVE MIGRATION: PHASE 9 — ADMIN SECURITY & RLS HARDENING
-- ========================================================

-- 1. PROFILES RLS & PRIVILEGE ESCALATION PREVENTION
-- Prevent client-side role escalation: normal users may update their profile fields
-- (bio, phone, avatar_url, etc.) but CANNOT alter their own 'role' column.
-- Only verified Station Administrators may alter user roles.

CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF public.get_user_role() <> 'admin' THEN
      RAISE EXCEPTION 'Access Denied: Only Station Administrators can modify user authorization roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_role_update();

-- Update profiles RLS policies
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;

CREATE POLICY "Public profiles are readable" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND (
      public.get_user_role() = 'admin' OR 
      role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

CREATE POLICY "Admins manage all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role() = 'admin');

-- 2. CONTACT MESSAGES ADMIN POLICIES
DROP POLICY IF EXISTS "Admins delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins delete contact messages" ON public.contact_messages
  FOR DELETE USING (public.get_user_role() = 'admin');

-- 3. CLUB APPLICATIONS ADMIN POLICIES
DROP POLICY IF EXISTS "Admins delete applications" ON public.club_applications;
CREATE POLICY "Admins delete applications" ON public.club_applications
  FOR DELETE USING (public.get_user_role() = 'admin');

-- 4. SONG REQUESTS & SHOUTOUTS ADMIN DELETION POLICIES
DROP POLICY IF EXISTS "Admins delete song requests" ON public.song_requests;
CREATE POLICY "Admins delete song requests" ON public.song_requests
  FOR DELETE USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins delete shoutouts" ON public.shoutouts;
CREATE POLICY "Admins delete shoutouts" ON public.shoutouts
  FOR DELETE USING (public.get_user_role() = 'admin');

-- 5. RADIO SCHEDULE ADMIN POLICIES
-- Ensure Admins have full access on schedule
DROP POLICY IF EXISTS "Admins manage schedule" ON public.radio_schedule;
CREATE POLICY "Admins manage schedule" ON public.radio_schedule
  FOR ALL USING (public.get_user_role() = 'admin');
