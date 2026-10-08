import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = rawUrl ? rawUrl.trim() : '';
const supabaseAnonKey = rawAnonKey ? rawAnonKey.trim() : '';

function formatSupabaseUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0
);

// Fallback mock builder when credentials are not configured yet
function createFallbackClient() {
  const handler = {
    get(target, prop) {
      if (prop === 'auth') {
        return {
          getUser: async () => ({ data: { user: null }, error: null }),
          getSession: async () => ({ data: { session: null }, error: null }),
          signInWithPassword: async () => ({ data: null, error: new Error('Supabase URL/Key not configured in .env') }),
          signUp: async () => ({ data: null, error: new Error('Supabase URL/Key not configured in .env') }),
          signOut: async () => ({ error: null }),
          resetPasswordForEmail: async () => ({ data: null, error: new Error('Supabase URL/Key not configured in .env') }),
          updateUser: async () => ({ data: null, error: new Error('Supabase URL/Key not configured in .env') }),
          resend: async () => ({ data: null, error: new Error('Supabase URL/Key not configured in .env') }),
          onAuthStateChange: (cb) => {
            cb('INITIAL_SESSION', null);
            return { data: { subscription: { unsubscribe: () => {} } } };
          }
        };
      }
      if (prop === 'from') {
        return () => {
          const chain = {
            select: () => chain,
            insert: async () => ({ data: null, error: null }),
            update: () => chain,
            delete: () => chain,
            eq: () => chain,
            neq: () => chain,
            in: () => chain,
            order: () => chain,
            limit: () => chain,
            range: () => chain,
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
            then: (resolve) => resolve({ data: [], error: null, count: 0 })
          };
          return chain;
        };
      }
      if (prop === 'rpc') {
        return async () => ({ data: null, error: null });
      }
      if (prop === 'channel') {
        return () => ({
          on: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), subscribe: () => ({ unsubscribe: () => {} }) }),
          subscribe: () => ({ unsubscribe: () => {} })
        });
      }
      return target[prop] || (() => ({ data: null, error: null }));
    }
  };
  return new Proxy({}, handler);
}

function initSupabase() {
  if (!isSupabaseConfigured) {
    return createFallbackClient();
  }
  try {
    return createClient(formatSupabaseUrl(supabaseUrl), supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client, falling back to mock:', err);
    return createFallbackClient();
  }
}

export const supabase = initSupabase();

