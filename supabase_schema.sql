-- ========================================================
-- CAMPUSWAVE — OFFICIAL SUPABASE POSTGRESQL SCHEMA & RLS
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TYPE user_role AS ENUM ('student', 'rj', 'admin');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  department TEXT,
  year TEXT,
  bio TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SHOWS & CATEGORIES
CREATE TABLE IF NOT EXISTS public.shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  tagline TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Music',
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  host_name TEXT NOT NULL,
  schedule_time TEXT,
  cover_image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PODCASTS & EPISODES
CREATE TABLE IF NOT EXISTS public.podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  rj_name TEXT NOT NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration TEXT NOT NULL DEFAULT '30 min',
  description TEXT,
  category TEXT DEFAULT 'Talk',
  cover_image TEXT,
  audio_url TEXT,
  plays_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RADIO SCHEDULE (WEEKLY TIMETABLE)
CREATE TABLE IF NOT EXISTS public.radio_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week TEXT NOT NULL, -- 'Monday', 'Tuesday', ..., 'Sunday'
  start_time TEXT NOT NULL,  -- e.g. '08:00'
  end_time TEXT NOT NULL,    -- e.g. '10:00'
  show_title TEXT NOT NULL,
  rj_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'Campus', -- 'Campus', 'CampusWave', 'Club', 'Event', 'Important'
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published'
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EVENTS & REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  registration_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  phone TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

-- 7. SONG REQUESTS & SHOUT-OUTS
CREATE TABLE IF NOT EXISTS public.song_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL DEFAULT 'Song Request',
  song_name TEXT NOT NULL,
  song_title TEXT,
  artist_name TEXT,
  dedication TEXT,
  message_to_rj TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'played', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shoutouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  dedication TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'aired', 'archived', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CLUB APPLICATIONS
CREATE TABLE IF NOT EXISTS public.club_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  college_email TEXT,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  academic_year TEXT,
  preferred_team TEXT NOT NULL, -- 'Radio Jockey', 'Content & Scriptwriting', 'Audio Production', 'Technical', 'Social Media', 'Design', 'Event Management'
  skills TEXT,
  skills_interests TEXT,
  introduction TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  category TEXT DEFAULT 'ON AIR', -- 'ON AIR', 'CONTENT', 'PRODUCTION', 'TECHNICAL', 'CREATIVE', 'EVENTS'
  social_link TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. RADIO LIVE METADATA
CREATE TABLE IF NOT EXISTS public.radio_now_playing (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_live BOOLEAN NOT NULL DEFAULT false,
  current_show_title TEXT DEFAULT 'Studio Standby',
  current_rj TEXT DEFAULT 'Campus Wave RJ',
  current_track TEXT,
  current_artist TEXT,
  listener_count INTEGER DEFAULT NULL,
  stream_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoutouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_now_playing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to prevent client-side role escalation
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

-- Profiles: Public can read basic profiles; user can update their own non-role fields; admin full access
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

-- Shows: Public can view active shows; RJs and Admins can insert/update/delete
CREATE POLICY "Active shows are readable" ON public.shows
  FOR SELECT USING (true);

CREATE POLICY "RJs can manage their own shows" ON public.shows
  FOR ALL USING (
    (public.get_user_role() = 'rj' AND host_id = auth.uid()) OR
    public.get_user_role() = 'admin'
  );

-- Podcasts: Public can read; RJs can manage own; Admin can manage all
CREATE POLICY "Podcasts readable by everyone" ON public.podcasts
  FOR SELECT USING (true);

CREATE POLICY "RJs can manage own podcasts" ON public.podcasts
  FOR ALL USING (
    (public.get_user_role() = 'rj' AND host_id = auth.uid()) OR
    public.get_user_role() = 'admin'
  );

-- Schedule: Public can read; Admins can manage
CREATE POLICY "Schedule is readable" ON public.radio_schedule
  FOR SELECT USING (true);

CREATE POLICY "Admins manage schedule" ON public.radio_schedule
  FOR ALL USING (public.get_user_role() = 'admin');

-- Announcements: Public can read published; Admins can manage
CREATE POLICY "Announcements readable" ON public.announcements
  FOR SELECT USING (status = 'published' OR public.get_user_role() = 'admin');

CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL USING (public.get_user_role() = 'admin');

-- Events: Public can view; Admins can manage
CREATE POLICY "Events readable" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Admins manage events" ON public.events
  FOR ALL USING (public.get_user_role() = 'admin');

-- Event Registrations: Anyone/Student can register; user can see own; Admin can see all
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (true);

-- Song Requests: Anyone can insert (must be pending); users can see own; RJ and Admin can view all
CREATE POLICY "Students create song requests" ON public.song_requests
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Users read own requests or RJ/Admin" ON public.song_requests
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.get_user_role() IN ('rj', 'admin')
  );

CREATE POLICY "RJ/Admin update request status" ON public.song_requests
  FOR UPDATE USING (public.get_user_role() IN ('rj', 'admin'));

CREATE POLICY "Admins delete song requests" ON public.song_requests
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Shout-outs: Anyone can insert (must be pending); users can see own; RJ and Admin view all
CREATE POLICY "Students create shoutouts" ON public.shoutouts
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Users read own shoutouts or RJ/Admin" ON public.shoutouts
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.get_user_role() IN ('rj', 'admin')
  );

CREATE POLICY "RJ/Admin update shoutout status" ON public.shoutouts
  FOR UPDATE USING (public.get_user_role() IN ('rj', 'admin'));

CREATE POLICY "Admins delete shoutouts" ON public.shoutouts
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Club Applications: Students can submit & view own; Admin can review
CREATE POLICY "Submit club application" ON public.club_applications
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Students read own application" ON public.club_applications
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Admins manage applications" ON public.club_applications
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins delete applications" ON public.club_applications
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Team Members: Public readable; Admin manages
CREATE POLICY "Team members are readable" ON public.team_members
  FOR SELECT USING (true);

CREATE POLICY "Admins manage team members" ON public.team_members
  FOR ALL USING (public.get_user_role() = 'admin');

-- Contact Messages: Anyone can insert; Admin can read
CREATE POLICY "Submit contact message" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view contact messages" ON public.contact_messages
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins delete contact messages" ON public.contact_messages
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Radio Now Playing: Public readable; RJ and Admin update
CREATE POLICY "Now playing readable" ON public.radio_now_playing
  FOR SELECT USING (true);

CREATE POLICY "RJ/Admin update now playing" ON public.radio_now_playing
  FOR UPDATE USING (public.get_user_role() IN ('rj', 'admin'));

-- Analytics: Anyone can insert events; Admin can read
CREATE POLICY "Insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins read analytics" ON public.analytics_events
  FOR SELECT USING (public.get_user_role() = 'admin');

-- ========================================================
-- 13. AUTHORIZED STAFF & PRIVILEGED ROLES
-- ========================================================

CREATE TABLE IF NOT EXISTS public.authorized_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role public.user_role NOT NULL CHECK (role IN ('rj', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_authorized_staff_email_norm 
  ON public.authorized_staff (lower(trim(email)));

ALTER TABLE public.authorized_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage authorized staff" ON public.authorized_staff;
CREATE POLICY "Admins manage authorized staff" ON public.authorized_staff
  FOR ALL USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Seed Initial Owner
INSERT INTO public.authorized_staff (email, role, is_active)
VALUES ('jalagadugulavivekraj@gmail.com', 'admin', true)
ON CONFLICT (lower(trim(email)))
DO UPDATE SET role = 'admin', is_active = true, updated_at = NOW();

-- Initial Owner Deletion Protection Trigger
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

-- Secure Role Sync Function (RPC)
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

  SELECT lower(trim(email)) INTO v_email
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

-- Automatic User Provisioning Trigger
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

GRANT EXECUTE ON FUNCTION public.sync_authorized_staff_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
