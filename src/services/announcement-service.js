import { supabase, isSupabaseConfigured } from './supabase';

export const announcementService = {
  async getAnnouncements(category = null, search = '') {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('status', 'published')
        .order('date', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (search) {
        const s = search.toLowerCase();
        return (data || []).filter(item =>
          item.title?.toLowerCase().includes(s) ||
          item.content?.toLowerCase().includes(s)
        );
      }

      return data || [];
    } catch (err) {
      console.warn('Announcements fetch error:', err.message);
      return [];
    }
  },

  async getAnnouncementById(id) {
    if (!isSupabaseConfigured || !id) return null;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn(`Error fetching announcement ${id}:`, err.message);
      return null;
    }
  },

  async getAllAdminAnnouncements() {
    if (!isSupabaseConfigured) return [];
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  },

  async createAnnouncement(announcementData) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('announcements').insert([announcementData]).select().single();
  },

  async updateAnnouncement(id, updates) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('announcements').update(updates).eq('id', id).select().single();
  },

  async deleteAnnouncement(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('announcements').delete().eq('id', id);
  }
};
