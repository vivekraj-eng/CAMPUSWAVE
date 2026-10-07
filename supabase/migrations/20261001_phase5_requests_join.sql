-- ========================================================
-- CAMPUSWAVE MIGRATION: PHASE 5 — REQUESTS, SHOUTOUTS & CLUB APPLICATIONS
-- ========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SONG REQUESTS TABLE & COLUMNS
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
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.song_requests ADD COLUMN IF NOT EXISTS song_title TEXT;
ALTER TABLE public.song_requests ADD COLUMN IF NOT EXISTS message_to_rj TEXT;
ALTER TABLE public.song_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_song_request_status') THEN
    ALTER TABLE public.song_requests 
      ADD CONSTRAINT check_song_request_status 
      CHECK (status IN ('pending', 'approved', 'played', 'rejected'));
  END IF;
END $$;

-- 2. SHOUTOUTS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.shoutouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  dedication TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shoutouts ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.shoutouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_shoutout_status') THEN
    ALTER TABLE public.shoutouts 
      ADD CONSTRAINT check_shoutout_status 
      CHECK (status IN ('pending', 'approved', 'aired', 'archived', 'rejected'));
  END IF;
END $$;

-- 3. CLUB APPLICATIONS TABLE & COLUMNS
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
  preferred_team TEXT NOT NULL,
  skills TEXT,
  skills_interests TEXT,
  introduction TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.club_applications ADD COLUMN IF NOT EXISTS college_email TEXT;
ALTER TABLE public.club_applications ADD COLUMN IF NOT EXISTS academic_year TEXT;
ALTER TABLE public.club_applications ADD COLUMN IF NOT EXISTS skills_interests TEXT;
ALTER TABLE public.club_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_club_app_status') THEN
    ALTER TABLE public.club_applications 
      ADD CONSTRAINT check_club_app_status 
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 4. RLS POLICIES
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoutouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_applications ENABLE ROW LEVEL SECURITY;

-- Song Requests RLS
DROP POLICY IF EXISTS "Students create song requests" ON public.song_requests;
DROP POLICY IF EXISTS "Users read own requests or RJ/Admin" ON public.song_requests;
DROP POLICY IF EXISTS "RJ/Admin update request status" ON public.song_requests;

CREATE POLICY "Students create song requests" ON public.song_requests
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Users read own requests or RJ/Admin" ON public.song_requests
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.get_user_role() IN ('rj', 'admin')
  );

CREATE POLICY "RJ/Admin update request status" ON public.song_requests
  FOR UPDATE USING (public.get_user_role() IN ('rj', 'admin'));

-- Shoutouts RLS
DROP POLICY IF EXISTS "Students create shoutouts" ON public.shoutouts;
DROP POLICY IF EXISTS "Users read own shoutouts or RJ/Admin" ON public.shoutouts;
DROP POLICY IF EXISTS "RJ/Admin update shoutout status" ON public.shoutouts;

CREATE POLICY "Students create shoutouts" ON public.shoutouts
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Users read own shoutouts or RJ/Admin" ON public.shoutouts
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.get_user_role() IN ('rj', 'admin')
  );

CREATE POLICY "RJ/Admin update shoutout status" ON public.shoutouts
  FOR UPDATE USING (public.get_user_role() IN ('rj', 'admin'));

-- Club Applications RLS
DROP POLICY IF EXISTS "Submit club application" ON public.club_applications;
DROP POLICY IF EXISTS "Students read own application" ON public.club_applications;
DROP POLICY IF EXISTS "Admins manage applications" ON public.club_applications;

CREATE POLICY "Submit club application" ON public.club_applications
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Students read own application" ON public.club_applications
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Admins manage applications" ON public.club_applications
  FOR UPDATE USING (public.get_user_role() = 'admin');
