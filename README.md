# CampusWave — College Radio Platform (104.2 FM)

CampusWave is a full-featured, student-run college radio web platform and broadcasting workstation. It connects campus culture, independent music, studio podcasts, live radio shows, community announcements, and station governance.

---

## 🛠️ Technology Stack

- **Frontend Core:** React 19, JavaScript (ESModules)
- **Tooling & Build:** Vite 8
- **Navigation & Routing:** React Router 7 (SPA with client-side history)
- **Motion & Audio Visuals:** Framer Motion, HTML5 Canvas API, Web Audio Analyser API
- **Icons:** Lucide React
- **Backend & Database:** Supabase (PostgreSQL 15+, Row-Level Security, GoTrue Auth)
- **Deployment Targets:** Vercel, Netlify, Cloudflare Pages

---

## 🚀 Quick Start / Local Setup

### 1. Prerequisites
- **Node.js:** v18.x or later (v20+ recommended)
- **npm:** v9.x or later

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd CAMPUSWAVE

# Install project dependencies
npm install
```

### 3. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```

Open `.env` and fill in your values (or leave them empty to run in offline/preview mode):
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Live Radio Stream (Leave empty for authentic "RADIO OFFLINE" state)
VITE_RADIO_STREAM_URL=https://stream.campuswave.fm/live

# Optional Campus Metadata
VITE_COLLEGE_EMAIL_DOMAIN=@college.edu
VITE_STATION_EMAIL=contact@campuswave.fm
VITE_STATION_LOCATION=Campus Media Pavilion Room 104
VITE_STATION_FREQUENCY=104.2 FM
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173/`.

### 5. Production Build
```bash
npm run build
```
The optimized bundle is output to `dist/`. To preview the production bundle locally:
```bash
npm run preview
```

---

## 🗄️ Database & Supabase Setup

CampusWave requires a Supabase PostgreSQL instance with Row-Level Security (RLS) enabled.

### Database Tables
The platform uses the following schema tables:
1. `profiles`: User accounts, bio, department, academic year, and authorization roles.
2. `shows`: Station programming catalog, host assignments, categories, and cover images.
3. `radio_schedule`: Weekly broadcasting timetable (Monday–Sunday) with timeslot conflict detection.
4. `podcasts`: Recorded show episodes and audio features.
5. `announcements`: Official station dispatches, recruitment notices, and bulletins.
6. `events`: Station concerts, workshops, and open mics.
7. `event_registrations`: Student event signups with duplicate registration prevention (`unique_event_user`).
8. `song_requests`: Listener song requests with moderation workflows (`pending`, `approved`, `played`, `rejected`).
9. `shoutouts`: Student dedication shout-outs with live broadcast statuses (`pending`, `approved`, `aired`, `archived`, `rejected`).
10. `club_applications`: Recruitment submissions for station teams (`Radio Jockey`, `Audio Production`, `Content`, etc.).
11. `team_members`: Public station masthead directory and leadership roster.
12. `contact_messages`: Inbound general and media inquiries.
13. `radio_now_playing`: Live station transmission metadata, current show, and track markers.

### Applying Database Schema & Migrations
1. **Master Schema:** Run the complete baseline script [`supabase_schema.sql`](file:///c:/Users/ADMIN/Documents/CAMPUSWAVE/supabase_schema.sql) in your Supabase SQL Editor.
2. **Incremental Migrations:** Located in [`supabase/migrations/`](file:///c:/Users/ADMIN/Documents/CAMPUSWAVE/supabase/migrations/):
   - `20261001_phase5_requests_join.sql`: Requests, shout-outs, and club applications.
   - `phase6_contact_team.sql`: Contact messaging and team member catalog.
   - `phase9_admin_security.sql`: Administrative privileges, role escalation prevention trigger, and deletion policies.

---

## 🔐 Authorization & Access Control

CampusWave defines three user roles:
- **`student`**: Default authenticated listener role. Can manage profile, view personal requests/shout-outs/applications, and register for events via `/dashboard`.
- **`rj`**: Approved Radio Jockey. Can access `/dashboard` and the RJ Broadcast Booth (`/rj`) to manage assigned shows, monitor live request/shoutout queues, and publish podcasts.
- **`admin`**: Station Administrator. Full operational governance over all station registers via `/admin` (Students, Team, Shows, Timetable, Podcasts, Requests, Shout-outs, Applications, Announcements, Events, Inbound Messages).

### Security Boundaries
- **Role Escalation Protection:** The database enforces a PostgreSQL `BEFORE UPDATE OF role` trigger (`trg_prevent_role_escalation`) and strict RLS `WITH CHECK` clauses preventing users from altering their own role.
- **Zero Service-Role Exposure:** Only `VITE_SUPABASE_ANON_KEY` is exposed to the browser. Administrative operations are authorized solely via authenticated admin JWT claims.
- **Zero Data Fabrication:** When no records exist in the database, CampusWave displays clean empty states rather than fictitious operational metrics.

---

## 📻 Radio Stream & Storage Architecture

### Radio Stream (`VITE_RADIO_STREAM_URL`)
- Supports direct Icecast, Shoutcast, HLS, or MP3/AAC audio streams.
- If unconfigured or the stream is silent, CampusWave enters the authentic **"RADIO OFFLINE" / "STUDIO STANDBY"** state without fake audio oscillations.

### Podcast Audio Storage
- Episodes stream via direct audio URL endpoints configured in the show/podcast metadata.
- If direct Supabase Object Storage bucket uploads are not configured in your Supabase instance, the application displays a storage notice and safely accepts external/hosted media URLs.

---

## 🌐 Production Deployment

### Recommended Platforms
- **Vercel:** Standard deployment target. A [`vercel.json`](file:///c:/Users/ADMIN/Documents/CAMPUSWAVE/vercel.json) rewrite rule is pre-configured for client-side SPA routing.
- **Netlify / Cloudflare Pages:** Pre-configured with [`public/_redirects`](file:///c:/Users/ADMIN/Documents/CAMPUSWAVE/public/_redirects) for SPA routing.

### Manual Deployment Steps
1. Push this repository to your Git provider (GitHub, GitLab, Bitbucket).
2. Connect your repository to Vercel or Netlify.
3. Configure Environment Variables in the host dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RADIO_STREAM_URL` (optional)
4. Set Build Command: `npm run build`
5. Set Output Directory: `dist`
6. Trigger deployment.
