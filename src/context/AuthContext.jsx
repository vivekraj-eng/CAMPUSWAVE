import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth-service';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const { session: currentSession, user: currentUser, profile: currentProfile } = await authService.getSession();
      setSession(currentSession);
      setUser(currentUser);
      setProfile(currentProfile);
    } catch (err) {
      console.warn('Session load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);

          // Synchronize authorized role when sign-in or token refresh occurs
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            try {
              await supabase.rpc('sync_authorized_staff_role');
            } catch (err) {
              // Ignore if RPC unavailable
            }
          }

          const p = await authService.getProfile(newSession.user.id);
          setProfile(p);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [refreshSession]);

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
