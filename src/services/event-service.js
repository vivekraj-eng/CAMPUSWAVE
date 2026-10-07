import { supabase, isSupabaseConfigured } from './supabase';

export const eventService = {
  async getEvents() {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Events fetch error:', err.message);
      return [];
    }
  },

  async getEventById(id) {
    if (!isSupabaseConfigured || !id) return null;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn(`Error fetching event ${id}:`, err.message);
      return null;
    }
  },

  async checkUserRegistration(eventId, userId) {
    if (!userId || !eventId || !isSupabaseConfigured) return false;

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) return false;
      return Boolean(data);
    } catch {
      return false;
    }
  },

  async getUserRegistrations(userId) {
    if (!isSupabaseConfigured || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, events(*)')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async registerForEvent({ eventId, userId, userName, userEmail, phone }) {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error(
          'Supabase database connection is not configured. Please supply valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
        )
      };
    }

    // Check duplicate first
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { data: null, error: new Error('You have already registered for this event.') };
    }

    const { data, error } = await supabase
      .from('event_registrations')
      .insert([
        {
          event_id: eventId,
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          phone
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('unique_event_user') || error.message?.includes('idx_event_reg_email') || error.message?.toLowerCase().includes('duplicate key')) {
        return { data: null, error: new Error('You have already registered for this event.') };
      }
      return { data: null, error };
    }

    // Increment event registration count safely
    const { data: ev } = await supabase.from('events').select('registration_count').eq('id', eventId).single();
    if (ev) {
      await supabase.from('events').update({ registration_count: (ev.registration_count || 0) + 1 }).eq('id', eventId);
    }

    return { data, error: null };
  },

  async createEvent(eventData) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('events').insert([eventData]).select().single();
  },

  async updateEvent(id, updates) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('events').update(updates).eq('id', id).select().single();
  },

  async deleteEvent(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('events').delete().eq('id', id);
  }
};
