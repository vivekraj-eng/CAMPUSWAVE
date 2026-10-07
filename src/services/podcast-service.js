import { supabase, isSupabaseConfigured } from './supabase';

export const podcastService = {
  async getShows(category = null, search = '') {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('shows')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (search) {
        const s = search.toLowerCase();
        return (data || []).filter(item => 
          item.title?.toLowerCase().includes(s) ||
          item.description?.toLowerCase().includes(s) ||
          item.host_name?.toLowerCase().includes(s)
        );
      }

      return data || [];
    } catch (err) {
      console.warn('Shows query error:', err.message);
      return [];
    }
  },

  async getPodcasts(category = null, search = '', limit = null) {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('podcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (search) {
        const s = search.toLowerCase();
        return (data || []).filter(item =>
          item.title?.toLowerCase().includes(s) ||
          item.description?.toLowerCase().includes(s) ||
          item.rj_name?.toLowerCase().includes(s)
        );
      }

      return data || [];
    } catch (err) {
      console.warn('Podcasts query error:', err.message);
      return [];
    }
  },

  async getPodcastById(id) {
    if (!isSupabaseConfigured || !id) return null;

    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*, shows(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn(`Error fetching podcast ${id}:`, err.message);
      return null;
    }
  },

  async createPodcast(podcastData) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('podcasts').insert([podcastData]).select().single();
  },

  async updatePodcast(id, updates) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('podcasts').update(updates).eq('id', id).select().single();
  },

  async deletePodcast(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('podcasts').delete().eq('id', id);
  },

  async createShow(showData) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('shows').insert([showData]).select().single();
  },

  async updateShow(id, updates) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('shows').update(updates).eq('id', id).select().single();
  },

  async deleteShow(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('shows').delete().eq('id', id);
  }
};
