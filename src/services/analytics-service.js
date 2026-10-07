import { supabase, isSupabaseConfigured } from './supabase';

export const analyticsService = {
  async logEvent(eventType, metadata = {}) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('analytics_events').insert([{ event_type: eventType, metadata }]);
    } catch {
      // analytics silent failure
    }
  },

  async getPlatformMetrics() {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const [
        { count: studentsCount },
        { count: rjsCount },
        { count: podcastsCount },
        { count: eventsCount },
        { count: pendingAppsCount },
        { count: pendingReqsCount },
        { count: shoutoutsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'rj'),
        supabase.from('podcasts').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('club_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('song_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('shoutouts').select('id', { count: 'exact', head: true })
      ]);

      const totalActivity = (studentsCount || 0) + (rjsCount || 0) + (podcastsCount || 0) + (eventsCount || 0) + (pendingAppsCount || 0) + (pendingReqsCount || 0);
      if (totalActivity === 0) {
        return null;
      }

      return {
        totalStudents: studentsCount || 0,
        activeRJs: rjsCount || 0,
        publishedPodcasts: podcastsCount || 0,
        upcomingEvents: eventsCount || 0,
        pendingApplications: pendingAppsCount || 0,
        pendingRequests: pendingReqsCount || 0,
        totalShoutouts: shoutoutsCount || 0,
        hasData: true
      };
    } catch (err) {
      console.warn('Analytics fetch error:', err.message);
      return null;
    }
  }
};
