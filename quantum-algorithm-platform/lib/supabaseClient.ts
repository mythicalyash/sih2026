import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lxqbfylrowqlxkzpupwz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4cWJmeWxyb3dxbHhrenB1cHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDcxNzEsImV4cCI6MjEwMzY4MzE3MX0.fg-BcYnx4lYiI8_biFD3oeIVQ6H7mTFHFehPDiWVZZA';

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    if (url && anonKey) {
      try {
        supabaseInstance = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        return null;
      }
    }
  }
  return supabaseInstance;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      user: { id: 'demo-user-1', email, user_metadata: { full_name: email.split('@')[0] } } as unknown as User,
      session: { access_token: 'demo-token', user: { id: 'demo-user-1', email } } as unknown as Session,
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { user: null, session: null, error: new Error(error.message) };
    }
    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err: any) {
    console.warn('Supabase sign-in network/connection error:', err);
    // If Supabase host cannot be reached (e.g. NXDOMAIN or network offline), provide clear message
    return {
      user: null,
      session: null,
      error: new Error(err.message?.includes('fetch') ? 'Could not reach Supabase server. Please verify your Project URL or continue in Demo Mode.' : err.message || 'Authentication failed.'),
    };
  }
}

export async function signUpWithEmail(email: string, password: string, fullName?: string): Promise<AuthResponse> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      user: { id: 'demo-user-1', email, user_metadata: { full_name: fullName || email.split('@')[0] } } as unknown as User,
      session: { access_token: 'demo-token', user: { id: 'demo-user-1', email } } as unknown as Session,
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (error) {
      return { user: null, session: null, error: new Error(error.message) };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err: any) {
    console.warn('Supabase sign-up network/connection error:', err);
    return {
      user: null,
      session: null,
      error: new Error(err.message?.includes('fetch') ? 'Could not reach Supabase server. Please verify your Project URL or continue in Demo Mode.' : err.message || 'Account creation failed.'),
    };
  }
}

export async function signInWithOAuth(provider: 'google' | 'github'): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });

    return { error: error ? new Error(error.message) : null };
  } catch (err: any) {
    return { error: new Error(err.message || 'OAuth initialization failed.') };
  }
}

export async function signOutUser(): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  } catch (err: any) {
    return { error: new Error(err.message || 'Sign out failed.') };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    return null;
  }
}
