import { supabase, isSupabaseConfigured } from './supabase';

export const teamService = {
  /**
   * Get all published team members for the public /team directory.
   * Strictly returns empty array if unconfigured or no real members exist.
   */
  async getPublishedTeamMembers() {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      // First attempt querying with is_published = true
      let { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      // Fallback if is_published column is not yet migrated in legacy table
      if (error && error.message && error.message.includes('column "is_published"')) {
        const fallbackRes = await supabase
          .from('team_members')
          .select('*')
          .order('order_index', { ascending: true });
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) {
        console.warn('Team fetch error:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Team fetch exception:', err.message);
      return [];
    }
  },

  /**
   * Alias for backward compatibility
   */
  async getTeamMembers() {
    return this.getPublishedTeamMembers();
  },

  /**
   * Fetch a single team member by ID
   */
  async getTeamMemberById(id) {
    if (!isSupabaseConfigured || !id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.warn('Team member fetch error:', error.message);
        return null;
      }
      return data || null;
    } catch {
      return null;
    }
  },

  /**
   * Admin: Add a team member
   */
  async addTeamMember(memberData) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured.') };
    }
    return await supabase
      .from('team_members')
      .insert([{ ...memberData, is_published: true }])
      .select()
      .single();
  },

  /**
   * Admin: Update team member
   */
  async updateTeamMember(id, updates) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured.') };
    }
    return await supabase
      .from('team_members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  },

  /**
   * Admin: Delete team member
   */
  async deleteTeamMember(id) {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured.') };
    }
    return await supabase.from('team_members').delete().eq('id', id);
  }
};
