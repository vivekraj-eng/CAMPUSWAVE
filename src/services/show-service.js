import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Show Service
 * Handles data fetching and operations for broadcast shows on CampusWave.
 * Strictly avoids inventing fake production data.
 */
export const showService = {
  async getShows(category = null, search = '') {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('shows')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'All' && category !== 'ALL') {
        query = query.ilike('category', `%${category}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (search) {
        const s = search.toLowerCase().trim();
        return (data || []).filter(item =>
          item.title?.toLowerCase().includes(s) ||
          item.description?.toLowerCase().includes(s) ||
          item.host_name?.toLowerCase().includes(s) ||
          item.category?.toLowerCase().includes(s)
        );
      }

      return data || [];
    } catch (err) {
      console.warn('Shows query error:', err.message);
      return [];
    }
  },

  async getShowById(id) {
    if (!isSupabaseConfigured || !id) return null;

    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn(`Error fetching show ${id}:`, err.message);
      return null;
    }
  },

  async getShowEpisodes(showId) {
    if (!isSupabaseConfigured || !showId) return [];

    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('show_id', showId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn(`Error fetching episodes for show ${showId}:`, err.message);
      return [];
    }
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
