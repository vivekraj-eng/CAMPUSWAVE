-- ========================================================
-- CAMPUSWAVE MIGRATION: PHASE 6 — TEAM, ABOUT & CONTACT
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEAM MEMBERS TABLE UPDATES
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

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'ON AIR';
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS social_link TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. CONTACT MESSAGES TABLE UPDATES
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_contact_status') THEN
    ALTER TABLE public.contact_messages 
      ADD CONSTRAINT check_contact_status 
      CHECK (status IN ('new', 'read', 'replied', 'archived'));
  END IF;
END $$;

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Team Members RLS
DROP POLICY IF EXISTS "Team members are readable" ON public.team_members;
DROP POLICY IF EXISTS "Published team members are readable" ON public.team_members;
DROP POLICY IF EXISTS "Admins manage team members" ON public.team_members;

CREATE POLICY "Published team members are readable" ON public.team_members
  FOR SELECT USING (is_published = true OR public.get_user_role() = 'admin');

CREATE POLICY "Admins manage team members" ON public.team_members
  FOR ALL USING (public.get_user_role() = 'admin');

-- Contact Messages RLS
DROP POLICY IF EXISTS "Submit contact message" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins manage contact messages" ON public.contact_messages;

-- Students / users can insert their inquiry; status must strictly default to 'new'
CREATE POLICY "Submit contact message" ON public.contact_messages
  FOR INSERT WITH CHECK (status = 'new');

CREATE POLICY "Admins view contact messages" ON public.contact_messages
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins manage contact messages" ON public.contact_messages
  FOR UPDATE USING (public.get_user_role() = 'admin');
