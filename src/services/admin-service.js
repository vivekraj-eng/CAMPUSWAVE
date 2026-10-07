import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Admin Service
 * Orchestrates administrative queries, cross-module aggregation,
 * and privilege-restricted mutations for Station Administration.
 * Strictly uses real Supabase data; never invents fake statistics.
 */
export const adminService = {
  /**
   * Get all registered users from profiles table.
   */
  async getUsers({ search = '', role = 'all', department = 'all' } = {}) {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, role, department, year, bio, phone, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (role && role !== 'all') {
        query = query.eq('role', role);
      }

      if (department && department !== 'all') {
        query = query.eq('department', department);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (search) {
        const q = search.toLowerCase().trim();
        return (data || []).filter(u =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
        );
      }

      return data || [];
    } catch (err) {
      console.warn('Error fetching registered profiles:', err.message);
      return [];
    }
  },

  /**
   * Update a user's role (admin operation).
   * Enforced server-side by PostgreSQL RLS & trigger.
   */
  async updateUserRole(userId, newRole) {
    if (!['student', 'rj', 'admin'].includes(newRole)) {
      return { data: null, error: new Error('Invalid role specified.') };
    }

    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    return await supabase
      .from('profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
  },

  /**
   * Query accurate station overview counts from actual database records.
   */
  async getOverviewMetrics() {
    if (!isSupabaseConfigured) {
      return {
        totalStudents: 0,
        activeRJs: 0,
        publishedShows: 0,
        publishedPodcasts: 0,
        upcomingEvents: 0,
        pendingApplications: 0,
        pendingRequests: 0,
        pendingShoutouts: 0,
        newContactMessages: 0,
        hasData: false
      };
    }

    try {
      const [
        { count: studentsCount },
        { count: rjsCount },
        { count: showsCount },
        { count: podcastsCount },
        { count: eventsCount },
        { count: pendingAppsCount },
        { count: pendingReqsCount },
        { count: pendingShoutoutsCount },
        { count: newMessagesCount }
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'rj'),
        supabase.from('shows').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('podcasts').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('club_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('song_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('shoutouts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new')
      ]);

      return {
        totalStudents: studentsCount ?? 0,
        activeRJs: rjsCount ?? 0,
        publishedShows: showsCount ?? 0,
        publishedPodcasts: podcastsCount ?? 0,
        upcomingEvents: eventsCount ?? 0,
        pendingApplications: pendingAppsCount ?? 0,
        pendingRequests: pendingReqsCount ?? 0,
        pendingShoutouts: pendingShoutoutsCount ?? 0,
        newContactMessages: newMessagesCount ?? 0,
        hasData: true
      };
    } catch (err) {
      console.warn('Error querying overview metrics:', err.message);
      return null;
    }
  },

  /**
   * Fetch items requiring immediate moderation attention.
   */
  async getNeedsAttention() {
    if (!isSupabaseConfigured) {
      return {
        applications: [],
        requests: [],
        shoutouts: [],
        messages: [],
        total: 0
      };
    }

    try {
      const [appsRes, reqsRes, shoutRes, msgRes] = await Promise.all([
        supabase
          .from('club_applications')
          .select('id, full_name, preferred_team, department, year, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('song_requests')
          .select('id, student_name, song_name, artist_name, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('shoutouts')
          .select('id, student_name, recipient_name, message, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('contact_messages')
          .select('id, name, subject, created_at')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const applications = appsRes.data || [];
      const requests = reqsRes.data || [];
      const shoutouts = shoutRes.data || [];
      const messages = msgRes.data || [];
      const total = applications.length + requests.length + shoutouts.length + messages.length;

      return {
        applications,
        requests,
        shoutouts,
        messages,
        total
      };
    } catch (err) {
      console.warn('Error fetching needs-attention records:', err.message);
      return {
        applications: [],
        requests: [],
        shoutouts: [],
        messages: [],
        total: 0
      };
    }
  },

  /**
   * Delete contact message (Admin operation).
   */
  async deleteContactMessage(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('contact_messages').delete().eq('id', id);
  },

  /**
   * Update a schedule slot (Admin operation).
   */
  async updateScheduleEntry(id, updates) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
    return await supabase.from('radio_schedule').update(updates).eq('id', id).select().single();
  },

  /**
   * Delete application (Admin operation).
   */
  async deleteApplication(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('club_applications').delete().eq('id', id);
  },

  /**
   * Delete song request (Admin operation).
   */
  async deleteSongRequest(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('song_requests').delete().eq('id', id);
  },

  /**
   * Delete shoutout (Admin operation).
   */
  async deleteShoutout(id) {
    if (!isSupabaseConfigured) return { error: new Error('Supabase not configured') };
    return await supabase.from('shoutouts').delete().eq('id', id);
  },

  /**
   * Get list of authorized staff members (Admin only).
   */
  async getAuthorizedStaff() {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('authorized_staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Error fetching authorized staff:', err.message);
      return [];
    }
  },

  /**
   * Add a new authorized staff email (Admin only).
   */
  async addAuthorizedStaff({ email, role, is_active = true }) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    const normEmail = email ? email.trim().toLowerCase() : '';
    if (!normEmail || !normEmail.includes('@')) {
      return { data: null, error: new Error('A valid email address is required.') };
    }
    if (!['rj', 'admin'].includes(role)) {
      return { data: null, error: new Error("Role must be 'rj' or 'admin'. Students cannot be placed in staff authorization.") };
    }

    return await supabase
      .from('authorized_staff')
      .insert([
        {
          email: normEmail,
          role,
          is_active
        }
      ])
      .select()
      .single();
  },

  /**
   * Update an authorized staff record (Admin only).
   */
  async updateAuthorizedStaff(id, updates, targetEmail = '') {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    const normEmail = targetEmail ? targetEmail.trim().toLowerCase() : '';
    if (normEmail === 'jalagadugulavivekraj@gmail.com') {
      if (updates.is_active === false) {
        return { data: null, error: new Error('Prohibited: The primary station owner record cannot be deactivated.') };
      }
      if (updates.role && updates.role !== 'admin') {
        return { data: null, error: new Error('Prohibited: The primary station owner cannot be demoted.') };
      }
    }

    if (updates.role && !['rj', 'admin'].includes(updates.role)) {
      return { data: null, error: new Error("Role must be 'rj' or 'admin'.") };
    }

    return await supabase
      .from('authorized_staff')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
  },

  /**
   * Delete an authorized staff record (Admin only).
   */
  async deleteAuthorizedStaff(id, email = '') {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    const normEmail = email ? email.trim().toLowerCase() : '';
    if (normEmail === 'jalagadugulavivekraj@gmail.com') {
      return { error: new Error('Prohibited: The primary station owner record (jalagadugulavivekraj@gmail.com) cannot be deleted.') };
    }

    return await supabase
      .from('authorized_staff')
      .delete()
      .eq('id', id);
  }
};
