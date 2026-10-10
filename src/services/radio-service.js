import { supabase, isSupabaseConfigured } from './supabase';

export const radioService = {
  async getNowPlaying() {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('radio_now_playing')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch {
      // Ignore database read errors
    }

    // Default standby metadata when table row is not populated yet
    return {
      id: 1,
      is_live: false,
      current_show_title: 'Studio Standby',
      current_rj: 'Campus Wave RJ',
      listener_count: 0
    };
  },

  async updateNowPlaying(updates) {
    if (!isSupabaseConfigured) return { data: null, error: null };

    try {
      // 1. Try update on row id 1
      const { data: updateData, error: updateError } = await supabase
        .from('radio_now_playing')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .select();

      if (!updateError && updateData && updateData.length > 0) {
        return { data: updateData[0], error: null };
      }

      // 2. If row 1 did not exist yet, try upsert
      const { data: insertData, error: insertError } = await supabase
        .from('radio_now_playing')
        .upsert({ id: 1, ...updates, updated_at: new Date().toISOString() })
        .select();

      return { data: insertData, error: insertError };
    } catch (err) {
      return { data: null, error: err };
    }
  }
};

