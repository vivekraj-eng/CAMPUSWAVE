-- ========================================================
-- CAMPUSWAVE — PRODUCTION SUPABASE BACKEND & SECURITY HARDENING
-- Migration: 20261007_production_backend_security.sql
-- ========================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure user_role enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('student', 'rj', 'admin');
  END IF;
END$$;

-- 1. AUTHORIZED STAFF DIRECTORY (Privilege Boundary)
CREATE TABLE IF NOT EXISTS public.authorized_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role public.user_role NOT NULL CHECK (role IN ('rj', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index on normalized email
CREATE UNIQUE INDEX IF NOT EXISTS idx_authorized_staff_email_norm 
  ON public.authorized_staff (lower(trim(email)));

-- Enable RLS on authorized_staff
ALTER TABLE public.authorized_staff ENABLE ROW LEVEL SECURITY;

-- Helper to check user role from session
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policy for authorized_staff: Only verified Admins can read or write
DROP POLICY IF EXISTS "Admins manage authorized staff" ON public.authorized_staff;
CREATE POLICY "Admins manage authorized staff" ON public.authorized_staff
  FOR ALL USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Seed Initial Owner as Station Administrator (Zero password, uses Supabase Auth)
INSERT INTO public.authorized_staff (email, role, is_active)
VALUES ('jalagadugulavivekraj@gmail.com', 'admin', true)
ON CONFLICT (lower(trim(email)))
DO UPDATE SET role = 'admin', is_active = true, updated_at = NOW();

-- Initial Owner Protection Trigger
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

-- 2. PREVENT CLIENT-SIDE ROLE ESCALATION ON PROFILES
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

-- 3. SECURE ROLE SYNCHRONIZATION RPC (Callable by authenticated users)
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
  v_full_name TEXT;
  v_updated_profile public.profiles%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthenticated session', 'role', 'anon');
  END IF;

  SELECT lower(trim(email)), COALESCE(raw_user_meta_data->>'full_name', split_part(lower(trim(email)), '@', 1))
  INTO v_email, v_full_name
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NOT NULL THEN
    SELECT role INTO v_staff_role
    FROM public.authorized_staff
    WHERE lower(trim(email)) = v_email AND is_active = true
    LIMIT 1;

    IF v_staff_role IS NOT NULL THEN
      v_target_role := v_staff_role;
    END IF;
  END IF;

  -- Upsert profile so the row is guaranteed to exist with authoritative role
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, COALESCE(v_email, ''), COALESCE(v_full_name, 'Listener'), v_target_role)
  ON CONFLICT (id) DO UPDATE
    SET role = v_target_role,
        updated_at = NOW()
  RETURNING * INTO v_updated_profile;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'role', v_target_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_authorized_staff_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;

-- 4. NEW USER AUTOMATIC PROVISIONING TRIGGER
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

-- 5. DUPLICATE SUBMISSION CONSTRAINTS & PERFORMANCE INDEXES

-- Deduplicate pending song requests by same student email and track
CREATE UNIQUE INDEX IF NOT EXISTS idx_song_request_dedup 
  ON public.song_requests (lower(trim(student_email)), lower(trim(song_name))) 
  WHERE status = 'pending';

-- Deduplicate pending shout-outs by same student email and message
CREATE UNIQUE INDEX IF NOT EXISTS idx_shoutout_dedup 
  ON public.shoutouts (lower(trim(student_email)), md5(lower(trim(message)))) 
  WHERE status = 'pending';

-- Deduplicate pending club applications by student email
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_app_pending_email 
  ON public.club_applications (lower(trim(email))) 
  WHERE status = 'pending';

-- Deduplicate pending club applications by registered user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_app_pending_user 
  ON public.club_applications (user_id) 
  WHERE status = 'pending' AND user_id IS NOT NULL;

-- Deduplicate event registrations by event and student email
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_reg_email 
  ON public.event_registrations (event_id, lower(trim(user_email)));

-- Deduplicate new contact messages by email and message hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_message_dedup 
  ON public.contact_messages (lower(trim(email)), md5(lower(trim(message)))) 
  WHERE status = 'new';

-- 6. CONCURRENCY & QUERY PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_shows_host_id ON public.shows(host_id);
CREATE INDEX IF NOT EXISTS idx_shows_is_active ON public.shows(is_active);
CREATE INDEX IF NOT EXISTS idx_podcasts_host_id ON public.podcasts(host_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_show_id ON public.podcasts(show_id);
CREATE INDEX IF NOT EXISTS idx_radio_schedule_day ON public.radio_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_song_requests_user ON public.song_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_status ON public.song_requests(status);
CREATE INDEX IF NOT EXISTS idx_shoutouts_user ON public.shoutouts(user_id);
CREATE INDEX IF NOT EXISTS idx_shoutouts_status ON public.shoutouts(status);
CREATE INDEX IF NOT EXISTS idx_club_applications_user ON public.club_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_club_applications_status ON public.club_applications(status);
CREATE INDEX IF NOT EXISTS idx_event_reg_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_event ON public.event_registrations(event_id);
