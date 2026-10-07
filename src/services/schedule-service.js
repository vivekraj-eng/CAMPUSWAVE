import { supabase, isSupabaseConfigured } from './supabase';

export const scheduleService = {
  async getWeeklySchedule() {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('radio_schedule')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Schedule fetch error:', err.message);
      return [];
    }
  },

  async getScheduleByDay(day) {
    if (!isSupabaseConfigured || !day) return [];

    try {
      const { data, error } = await supabase
        .from('radio_schedule')
        .select('*')
        .eq('day_of_week', day)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn(`Error fetching schedule for ${day}:`, err.message);
      return [];
    }
  },

  async addScheduleEntry(entry) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('radio_schedule').insert([entry]).select().single();
  },

  async deleteScheduleEntry(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('radio_schedule').delete().eq('id', id);
  }
};
