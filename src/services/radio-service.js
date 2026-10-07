import { supabase, isSupabaseConfigured } from './supabase';

export const radioService = {
  async getNowPlaying() {
    if (!isSupabaseConfigured) {
      // Real database content rule: return null if not connected to avoid fake data
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('radio_now_playing')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching now playing:', error.message);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  async updateNowPlaying(updates) {
    if (!isSupabaseConfigured) return { data: null, error: null };

    const { data, error } = await supabase
      .from('radio_now_playing')
      .upsert({ id: 1, ...updates, updated_at: new Date().toISOString() });

    return { data, error };
  }
};
