import { supabase, isSupabaseConfigured } from './supabase';

export const contactService = {
  /**
   * Submit an inquiry to the CampusWave studio dispatch.
   * Enforces status: 'new' and never fakes success if Supabase is unconfigured.
   */
  async submitContactMessage({ name, email, subject, message, userId = null }) {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error(
          'Supabase database connection is not configured. Please supply valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
        )
      };
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      user_id: userId || null,
      status: 'new'
    };

    let res = await supabase
      .from('contact_messages')
      .insert([payload])
      .select()
      .single();

    // Fallback if user_id column is not yet migrated
    if (res.error && res.error.message && res.error.message.includes('column "user_id"')) {
      const legacyPayload = {
        name: payload.name,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
        status: 'new'
      };
      res = await supabase
        .from('contact_messages')
        .insert([legacyPayload])
        .select()
        .single();
    }

    if (res.error) {
      if (res.error.code === '23505' || res.error.message?.includes('idx_contact_message_dedup') || res.error.message?.toLowerCase().includes('duplicate key')) {
        return {
          data: null,
          error: new Error('A message with this content was already submitted recently. Our team will review it!')
        };
      }
    }

    return res;
  },

  /**
   * Retrieve all contact messages for Station Administration.
   */
  async getContactMessages() {
    if (!isSupabaseConfigured) {
      return [];
    }
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Contact messages fetch error:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Alias for backward compatibility
   */
  async getAllMessages() {
    return this.getContactMessages();
  },

  /**
   * Update message moderation status (Admin only).
   */
  async updateContactMessageStatus(id, status) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured.') };
    }
    return await supabase
      .from('contact_messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  }
};
