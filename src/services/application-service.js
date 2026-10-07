import { supabase, isSupabaseConfigured } from './supabase';

export const applicationService = {
  /**
   * Check if the student already has an active pending application on file.
   */
  async checkPendingApplication(userId, email) {
    if (!isSupabaseConfigured) {
      return { hasPending: false, application: null };
    }

    try {
      let query = supabase
        .from('club_applications')
        .select('*')
        .eq('status', 'pending');

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (email) {
        query = query.eq('email', email.trim().toLowerCase());
      } else {
        return { hasPending: false, application: null };
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        return { hasPending: false, application: null };
      }

      return {
        hasPending: Boolean(data),
        application: data || null
      };
    } catch {
      return { hasPending: false, application: null };
    }
  },

  /**
   * Submit an application to join the CampusWave Radio Club.
   * Strictly enforces status: 'pending' and checks for duplicate pending applications.
   */
  async submitApplication(applicationData) {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error(
          'Supabase database connection is not configured. Please supply valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
        )
      };
    }

    const userId = applicationData.userId || applicationData.user_id || null;
    const email = (applicationData.collegeEmail || applicationData.email || '').trim().toLowerCase();

    // Check for existing pending application to prevent duplicates
    if (userId || email) {
      const existing = await this.checkPendingApplication(userId, email);
      if (existing.hasPending) {
        const err = new Error(
          'An active pending application is already on file for your account. Our station directors review applications weekly.'
        );
        err.code = 'DUPLICATE_APPLICATION';
        err.existingApplication = existing.application;
        return { data: null, error: err };
      }
    }

    const payload = {
      user_id: userId,
      full_name: (applicationData.fullName || applicationData.full_name || '').trim(),
      email: email,
      college_email: email,
      phone: (applicationData.phone || '').trim(),
      department: (applicationData.department || '').trim(),
      year: applicationData.academicYear || applicationData.year || '1st Year',
      academic_year: applicationData.academicYear || applicationData.year || '1st Year',
      preferred_team: applicationData.preferredTeam || applicationData.preferred_team,
      skills: (applicationData.skillsInterests || applicationData.skills || '').trim(),
      skills_interests: (applicationData.skillsInterests || applicationData.skills || '').trim(),
      introduction: (applicationData.introduction || '').trim(),
      status: 'pending'
    };

    let res = await supabase
      .from('club_applications')
      .insert([payload])
      .select()
      .single();

    // Graceful fallback if extended columns do not exist in legacy schema
    if (
      res.error &&
      res.error.message &&
      (res.error.message.includes('column "college_email"') ||
        res.error.message.includes('column "academic_year"') ||
        res.error.message.includes('column "skills_interests"'))
    ) {
      const legacyPayload = {
        user_id: payload.user_id,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        department: payload.department,
        year: payload.year,
        preferred_team: payload.preferred_team,
        skills: payload.skills,
        introduction: payload.introduction,
        status: 'pending'
      };
      res = await supabase
        .from('club_applications')
        .insert([legacyPayload])
        .select()
        .single();
    }

    return res;
  },

  /**
   * Get an authenticated student's applications.
   */
  async getUserApplications(userId, email) {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabase.from('club_applications').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.eq('email', email.trim().toLowerCase());
    } else {
      return [];
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching student applications:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Get all applications for Station Director / Admin console.
   */
  async getAllApplications() {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('club_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all club applications:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Update application status (Admin only).
   */
  async updateApplicationStatus(id, status, notes = '') {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured.') };
    }

    return await supabase
      .from('club_applications')
      .update({
        status,
        review_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
  }
};
