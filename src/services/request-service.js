import { supabase, isSupabaseConfigured } from './supabase';

export const requestService = {
  /**
   * Submit a student track request to the live broadcast studio.
   * Strictly enforces status: 'pending' at database boundary.
   */
  async submitSongRequest({
    studentName,
    studentEmail,
    userId = null,
    songTitle,
    artistName = '',
    dedication = '',
    messageToRj = ''
  }) {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error(
          'Supabase database connection is not configured. Please supply valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
        )
      };
    }

    const payload = {
      student_name: studentName.trim(),
      student_email: studentEmail.trim().toLowerCase(),
      user_id: userId || null,
      request_type: 'Song Request',
      song_name: songTitle.trim(),
      song_title: songTitle.trim(),
      artist_name: artistName ? artistName.trim() : null,
      dedication: dedication ? dedication.trim() : null,
      message_to_rj: messageToRj ? messageToRj.trim() : null,
      status: 'pending'
    };

    // Attempt insert with all extended columns
    let res = await supabase
      .from('song_requests')
      .insert([payload])
      .select()
      .single();

    // Graceful fallback if columns song_title or message_to_rj do not exist in legacy schema
    if (res.error && res.error.message && (res.error.message.includes('column "song_title"') || res.error.message.includes('column "message_to_rj"'))) {
      const legacyPayload = {
        student_name: payload.student_name,
        student_email: payload.student_email,
        user_id: payload.user_id,
        request_type: payload.request_type,
        song_name: payload.song_name,
        artist_name: payload.artist_name,
        dedication: payload.dedication ? (payload.message_to_rj ? `${payload.dedication} | Note: ${payload.message_to_rj}` : payload.dedication) : payload.message_to_rj,
        status: 'pending'
      };
      res = await supabase
        .from('song_requests')
        .insert([legacyPayload])
        .select()
        .single();
    }

    return res;
  },

  /**
   * Submit a student shout-out to be read on air by the RJ.
   */
  async submitShoutout({
    studentName,
    studentEmail,
    userId = null,
    recipientName = '',
    message,
    dedication = ''
  }) {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error(
          'Supabase database connection is not configured. Please supply valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
        )
      };
    }

    const payload = {
      student_name: studentName.trim(),
      student_email: studentEmail.trim().toLowerCase(),
      user_id: userId || null,
      recipient_name: recipientName ? recipientName.trim() : null,
      message: message.trim(),
      dedication: dedication ? dedication.trim() : null,
      status: 'pending'
    };

    let res = await supabase
      .from('shoutouts')
      .insert([payload])
      .select()
      .single();

    // Fallback if recipient_name column is not yet migrated
    if (res.error && res.error.message && res.error.message.includes('column "recipient_name"')) {
      const legacyPayload = {
        student_name: payload.student_name,
        student_email: payload.student_email,
        user_id: payload.user_id,
        message: payload.recipient_name ? `[For: ${payload.recipient_name}] ${payload.message}` : payload.message,
        dedication: payload.dedication,
        status: 'pending'
      };
      res = await supabase
        .from('shoutouts')
        .insert([legacyPayload])
        .select()
        .single();
    }

    return res;
  },

  /**
   * Get an authenticated student's own requests.
   */
  async getUserRequests(userId) {
    if (!isSupabaseConfigured || !userId) {
      return [];
    }
    const { data, error } = await supabase
      .from('song_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user song requests:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Get an authenticated student's own shout-outs.
   */
  async getUserShoutouts(userId) {
    if (!isSupabaseConfigured || !userId) {
      return [];
    }
    const { data, error } = await supabase
      .from('shoutouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user shout-outs:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Query all requests for RJ/Admin console.
   */
  async getAllRequests() {
    if (!isSupabaseConfigured) {
      return [];
    }
    const { data, error } = await supabase
      .from('song_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all song requests:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Query all shoutouts for RJ/Admin console.
   */
  async getAllShoutouts() {
    if (!isSupabaseConfigured) {
      return [];
    }
    const { data, error } = await supabase
      .from('shoutouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all shoutouts:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Update request status (RJ / Admin only).
   */
  async updateRequestStatus(id, status) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured.') };
    }
    return await supabase
      .from('song_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  },

  /**
   * Update shoutout status (RJ / Admin only).
   */
  async updateShoutoutStatus(id, status) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured.') };
    }
    return await supabase
      .from('shoutouts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  }
};
