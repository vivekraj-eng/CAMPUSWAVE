import { supabase, isSupabaseConfigured } from './supabase';
import { authService } from './auth-service';

/**
 * Dashboard Service
 * Composes personal queries for the authenticated student.
 * Never invents mock operational data or fake statistics.
 */
export const dashboardService = {
  /**
   * Fetch all personal activity and records for the authenticated student.
   *
   * @param {string} userId - Authenticated user UUID
   * @param {string} email - Authenticated user email address
   * @returns {Promise<{ data: Object|null, error: Error|null }>}
   */
  async getStudentDashboardData(userId, email) {
    if (!userId) {
      return {
        data: null,
        error: new Error('User authentication is required to access personal activity.')
      };
    }

    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase database connection is not configured.')
      };
    }

    try {
      const normalizedEmail = (email || '').trim().toLowerCase();

      // Execute personal queries strictly bound to the authenticated student's user_id
      const [requestsRes, shoutoutsRes, applicationsRes, eventsRes, profileRes] = await Promise.allSettled([
        supabase
          .from('song_requests')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),

        supabase
          .from('shoutouts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),

        supabase
          .from('club_applications')
          .select('*')
          .or(`user_id.eq.${userId}${normalizedEmail ? `,email.eq.${normalizedEmail}` : ''}`)
          .order('created_at', { ascending: false }),

        supabase
          .from('event_registrations')
          .select('id, created_at, event_id, user_name, user_email, phone, events(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),

        authService.getProfile(userId)
      ]);

      const errors = [];
      let requests = [];
      let shoutouts = [];
      let applications = [];
      let eventRegistrations = [];
      let profile = null;

      if (requestsRes.status === 'fulfilled') {
        if (requestsRes.value.error) errors.push(requestsRes.value.error.message);
        else requests = requestsRes.value.data || [];
      } else {
        errors.push(requestsRes.reason?.message || 'Failed to fetch song requests');
      }

      if (shoutoutsRes.status === 'fulfilled') {
        if (shoutoutsRes.value.error) errors.push(shoutoutsRes.value.error.message);
        else shoutouts = shoutoutsRes.value.data || [];
      } else {
        errors.push(shoutoutsRes.reason?.message || 'Failed to fetch shout-outs');
      }

      if (applicationsRes.status === 'fulfilled') {
        if (applicationsRes.value.error) errors.push(applicationsRes.value.error.message);
        else applications = applicationsRes.value.data || [];
      } else {
        errors.push(applicationsRes.reason?.message || 'Failed to fetch club applications');
      }

      if (eventsRes.status === 'fulfilled') {
        if (eventsRes.value.error) errors.push(eventsRes.value.error.message);
        else eventRegistrations = eventsRes.value.data || [];
      } else {
        errors.push(eventsRes.reason?.message || 'Failed to fetch event registrations');
      }

      if (profileRes.status === 'fulfilled') {
        profile = profileRes.value;
      }

      // If all queries failed, report database error to trigger error state
      if (errors.length >= 4) {
        return {
          data: null,
          error: new Error(errors[0] || 'Unable to load your CampusWave student activity.')
        };
      }

      return {
        data: {
          profile,
          requests,
          shoutouts,
          applications,
          eventRegistrations
        },
        error: null
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Unable to load your CampusWave activity.')
      };
    }
  }
};
