import { supabase, isSupabaseConfigured } from './supabase';
import { requestService } from './request-service';
import { podcastService } from './podcast-service';
import { showService } from './show-service';
import { scheduleService } from './schedule-service';

/**
 * RJ Service
 * Coordinates data queries and moderation actions for authorized Radio Jockeys.
 * Strictly enforces RJ access boundary; never invents fake operational data.
 */
export const rjService = {
  /**
   * Fetch complete workspace data for the authenticated RJ.
   *
   * @param {string} userId - Authenticated user UUID
   * @param {string} rjName - Authenticated RJ full name
   * @returns {Promise<{ data: Object|null, error: Error|null }>}
   */
  async getRjWorkspaceData(userId, rjName = '') {
    if (!userId) {
      return {
        data: null,
        error: new Error('User authentication is required to access RJ workspace.')
      };
    }

    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase database connection is not configured.')
      };
    }

    try {
      const trimmedName = rjName ? rjName.trim() : '';

      // Execute personal RJ queries in parallel
      const [showsRes, scheduleRes, requestsRes, shoutoutsRes, podcastsRes] = await Promise.allSettled([
        // 1. Shows assigned to current RJ (by host_id or host_name)
        supabase
          .from('shows')
          .select('*')
          .or(`host_id.eq.${userId}${trimmedName ? `,host_name.ilike.%${trimmedName}%` : ''}`)
          .order('created_at', { ascending: false }),

        // 2. Schedule assigned to current RJ
        supabase
          .from('radio_schedule')
          .select('*')
          .or(`rj_name.ilike.%${trimmedName || 'RJ'}%`)
          .order('start_time', { ascending: true }),

        // 3. Requests queue for broadcast moderation
        supabase
          .from('song_requests')
          .select('*')
          .order('created_at', { ascending: false }),

        // 4. Shout-outs queue for broadcast moderation
        supabase
          .from('shoutouts')
          .select('*')
          .order('created_at', { ascending: false }),

        // 5. Podcasts assigned to current RJ
        supabase
          .from('podcasts')
          .select('*, shows(*)')
          .or(`host_id.eq.${userId}${trimmedName ? `,rj_name.ilike.%${trimmedName}%` : ''}`)
          .order('created_at', { ascending: false })
      ]);

      const errors = [];
      let assignedShows = [];
      let assignedSchedule = [];
      let requests = [];
      let shoutouts = [];
      let podcasts = [];

      if (showsRes.status === 'fulfilled') {
        if (showsRes.value.error) errors.push(showsRes.value.error.message);
        else assignedShows = showsRes.value.data || [];
      } else {
        errors.push(showsRes.reason?.message || 'Failed to fetch assigned shows');
      }

      if (scheduleRes.status === 'fulfilled') {
        if (scheduleRes.value.error) errors.push(scheduleRes.value.error.message);
        else assignedSchedule = scheduleRes.value.data || [];
      } else {
        errors.push(scheduleRes.reason?.message || 'Failed to fetch schedule lineup');
      }

      if (requestsRes.status === 'fulfilled') {
        if (requestsRes.value.error) errors.push(requestsRes.value.error.message);
        else requests = requestsRes.value.data || [];
      } else {
        errors.push(requestsRes.reason?.message || 'Failed to fetch request queue');
      }

      if (shoutoutsRes.status === 'fulfilled') {
        if (shoutoutsRes.value.error) errors.push(shoutoutsRes.value.error.message);
        else shoutouts = shoutoutsRes.value.data || [];
      } else {
        errors.push(shoutoutsRes.reason?.message || 'Failed to fetch shout-out queue');
      }

      if (podcastsRes.status === 'fulfilled') {
        if (podcastsRes.value.error) errors.push(podcastsRes.value.error.message);
        else podcasts = podcastsRes.value.data || [];
      } else {
        errors.push(podcastsRes.reason?.message || 'Failed to fetch podcasts');
      }

      // If all queries failed critically
      if (errors.length >= 4) {
        return {
          data: null,
          error: new Error(errors[0] || 'Unable to load RJ studio workspace.')
        };
      }

      return {
        data: {
          assignedShows,
          assignedSchedule,
          requests,
          shoutouts,
          podcasts
        },
        error: null
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Unable to connect to RJ workspace.')
      };
    }
  },

  /**
   * Update song request status (approve, played, rejected).
   */
  async updateRequestStatus(requestId, status) {
    return await requestService.updateRequestStatus(requestId, status);
  },

  /**
   * Update shout-out status (approve, aired, rejected).
   */
  async updateShoutoutStatus(shoutoutId, status) {
    return await requestService.updateShoutoutStatus(shoutoutId, status);
  },

  /**
   * Create new podcast episode.
   */
  async createPodcast(podcastData) {
    return await podcastService.createPodcast(podcastData);
  },

  /**
   * Update an existing podcast episode.
   */
  async updatePodcast(id, updates) {
    return await podcastService.updatePodcast(id, updates);
  },

  /**
   * Delete an existing podcast episode.
   */
  async deletePodcast(id) {
    return await podcastService.deletePodcast(id);
  },

  /**
   * Update an assigned show's description or category.
   */
  async updateShow(id, updates) {
    return await showService.updateShow(id, updates);
  }
};
