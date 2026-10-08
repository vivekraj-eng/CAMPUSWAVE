import { supabase, isSupabaseConfigured } from './supabase';

export const OWNER_EMAIL = 'jalagadugulavivekraj@gmail.com';

/**
 * Normalizes email address for consistent comparison and storage.
 * @param {string} email
 * @returns {string} Trimmed, lowercase email
 */
export function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : '';
}

/**
 * Derives the optimal redirect destination for authentication emails.
 * Handles desktop localhost, mobile LAN access, and optional environment overrides.
 * @param {string} [path='/login']
 * @returns {string|undefined}
 */
export function getAuthRedirectUrl(path = '/login') {
  if (typeof window === 'undefined') return undefined;

  // Optional environment override (e.g. LAN IP for mobile testing when signup originates on desktop)
  const envAppUrl = import.meta.env.VITE_APP_URL ? import.meta.env.VITE_APP_URL.trim().replace(/\/$/, '') : '';

  // Current browser origin (e.g. http://192.168.1.10:5173 when opened on phone or http://localhost:5173 on PC)
  const currentOrigin = window.location.origin.replace(/\/$/, '');

  // If currently accessing on localhost and an explicit LAN/app URL is configured, use the LAN URL
  // so verification emails opened on a phone redirect to the LAN interface instead of unreachable phone localhost.
  // Otherwise, use current browser origin.
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseOrigin = isLocalhost && envAppUrl ? envAppUrl : currentOrigin;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseOrigin}${cleanPath}`;
}

/**
 * Authentication Service
 * Strictly interfaces with Supabase Auth and database authorization.
 * Zero demo users, zero mock sessions, zero stored passwords.
 */
export const authService = {
  /**
   * Retrieves the current Supabase session and associated user profile.
   * @returns {Promise<{ session: Object|null, user: Object|null, profile: Object|null }>}
   */
  async getSession() {
    if (!isSupabaseConfigured) {
      return { session: null, user: null, profile: null };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        return { session: null, user: null, profile: null };
      }

      // Synchronize authorized staff role via database RPC
      try {
        await supabase.rpc('sync_authorized_staff_role');
      } catch (rpcErr) {
        // RPC may not exist if migration hasn't been executed yet
      }

      const profile = await this.getProfile(session.user.id);
      return { session, user: session.user, profile };
    } catch (err) {
      console.warn('Session verification exception:', err.message);
      return { session: null, user: null, profile: null };
    }
  },

  /**
   * Fetches the user's authoritative profile record from public.profiles.
   * @param {string} userId - UUID of user
   * @returns {Promise<Object|null>}
   */
  async getProfile(userId) {
    if (!isSupabaseConfigured || !userId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Profile query exception:', err.message);
      return null;
    }
  },

  /**
   * Real Supabase email/password authentication.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user: Object|null, profile: Object|null, session: Object|null, error: Error|null }>}
   */
  async signIn(email, password) {
    const normEmail = normalizeEmail(email);

    if (!isSupabaseConfigured) {
      return {
        user: null,
        profile: null,
        session: null,
        error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      };
    }

    if (!normEmail || !password) {
      return {
        user: null,
        profile: null,
        session: null,
        error: new Error('Please enter both email and password.')
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normEmail,
      password
    });

    if (error) {
      return { user: null, profile: null, session: null, error };
    }

    // Synchronize authorized role from authorized_staff table via SECURITY DEFINER RPC
    try {
      await supabase.rpc('sync_authorized_staff_role');
    } catch (rpcErr) {
      console.warn('Role synchronization note:', rpcErr.message);
    }

    const profile = await this.getProfile(data.user.id);
    return { user: data.user, profile, session: data.session, error: null };
  },

  /**
   * Real Supabase account creation.
   * Role is NEVER submitted by frontend; database trigger defaults to student or checks authorized_staff.
   * @param {string} email
   * @param {string} password
   * @param {string} fullName
   * @returns {Promise<{ user: Object|null, profile: Object|null, session: Object|null, requiresVerification: boolean, error: Error|null }>}
   */
  async signUp(email, password, fullName) {
    const normEmail = normalizeEmail(email);
    const cleanName = fullName ? fullName.trim() : '';

    if (!isSupabaseConfigured) {
      return {
        user: null,
        profile: null,
        session: null,
        requiresVerification: false,
        error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      };
    }

    if (!normEmail || !password || !cleanName) {
      return {
        user: null,
        profile: null,
        session: null,
        requiresVerification: false,
        error: new Error('Full name, email, and password are required for registration.')
      };
    }

    const emailRedirectTo = getAuthRedirectUrl('/login');

    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
      password,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo
      }
    });

    if (error) {
      return { user: null, profile: null, session: null, requiresVerification: false, error };
    }

    // If email confirmation is enabled in Supabase, session is null
    const requiresVerification = !data.session && Boolean(data.user);

    if (data.session && data.user) {
      try {
        await supabase.rpc('sync_authorized_staff_role');
      } catch (rpcErr) {
        // Trigger on_auth_user_created handles creation
      }
      const profile = await this.getProfile(data.user.id);
      return { user: data.user, profile, session: data.session, requiresVerification: false, error: null };
    }

    return {
      user: data.user,
      profile: null,
      session: null,
      requiresVerification,
      error: null
    };
  },

  /**
   * Signs out the authenticated user from Supabase.
   * @returns {Promise<{ error: Error|null }>}
   */
  async signOut() {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    return await supabase.auth.signOut();
  },

  /**
   * Sends a real Supabase password recovery email.
   * @param {string} email
   * @returns {Promise<{ data: Object|null, error: Error|null }>}
   */
  async resetPassword(email) {
    const normEmail = normalizeEmail(email);

    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    if (!normEmail) {
      return { data: null, error: new Error('Please enter your email address.') };
    }

    const redirectTo = getAuthRedirectUrl('/login?type=recovery');
    return await supabase.auth.resetPasswordForEmail(normEmail, {
      redirectTo
    });
  },

  /**
   * Updates user password during password recovery or profile update.
   * @param {string} newPassword
   * @returns {Promise<{ data: Object|null, error: Error|null }>}
   */
  async updatePassword(newPassword) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    if (!newPassword || newPassword.length < 6) {
      return { data: null, error: new Error('Password must be at least 6 characters long.') };
    }

    return await supabase.auth.updateUser({
      password: newPassword
    });
  },

  /**
   * Resends signup email confirmation for unverified accounts.
   * @param {string} email
   * @returns {Promise<{ data: Object|null, error: Error|null }>}
   */
  async resendVerification(email) {
    const normEmail = normalizeEmail(email);

    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    if (!normEmail) {
      return { data: null, error: new Error('Please enter your email address.') };
    }

    const emailRedirectTo = getAuthRedirectUrl('/login');

    return await supabase.auth.resend({
      type: 'signup',
      email: normEmail,
      options: {
        emailRedirectTo
      }
    });
  }
};
