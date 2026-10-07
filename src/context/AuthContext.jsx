import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth-service';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);

  const loadUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      return await authService.getProfile(userId);
    } catch (err) {
      console.warn('Profile fetch exception:', err);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { session: currentSession, user: currentUser, profile: currentProfile } = await authService.getSession();
      if (isMountedRef.current) {
        setSession(currentSession);
        setUser(currentUser);
        setProfile(currentProfile);
      }
    } catch (err) {
      console.warn('Session load error:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Set up centralized Supabase Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMountedRef.current) return;

      switch (event) {
        case 'INITIAL_SESSION':
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            const p = await loadUserProfile(newSession.user.id);
            if (isMountedRef.current) setProfile(p);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          if (isMountedRef.current) setLoading(false);
          break;

        case 'SIGNED_IN':
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            try {
              await supabase.rpc('sync_authorized_staff_role');
            } catch (err) {
              // RPC may not exist if migration not yet applied
            }
            const p = await loadUserProfile(newSession.user.id);
            if (isMountedRef.current) setProfile(p);
          }
          if (isMountedRef.current) setLoading(false);
          break;

        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          setProfile(null);
          if (isMountedRef.current) setLoading(false);
          break;

        case 'TOKEN_REFRESHED':
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
          }
          if (isMountedRef.current) setLoading(false);
          break;

        case 'USER_UPDATED':
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            const p = await loadUserProfile(newSession.user.id);
            if (isMountedRef.current) setProfile(p);
          }
          if (isMountedRef.current) setLoading(false);
          break;

        default:
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
          }
          if (isMountedRef.current) setLoading(false);
          break;
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = async (email, password) => {
    setLoading(true);
    const res = await authService.signIn(email, password);
    if (!res.error && res.session) {
      setSession(res.session);
      setUser(res.user);
      setProfile(res.profile);
    }
    setLoading(false);
    return res;
  };

  const signUp = async (email, password, fullName) => {
    setLoading(true);
    const res = await authService.signUp(email, password, fullName);
    if (!res.error && res.session) {
      setSession(res.session);
      setUser(res.user);
      setProfile(res.profile);
    }
    setLoading(false);
    return res;
  };

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  const updatePassword = async (newPassword) => {
    return await authService.updatePassword(newPassword);
  };

  const resendVerification = async (email) => {
    return await authService.resendVerification(email);
  };

  // Authoritative role resolved exclusively from database profile
  const role = profile?.role || 'student';

  const value = {
    user,
    session,
    profile,
    role,
    loading,
    isAuthenticated: Boolean(user && session),
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
