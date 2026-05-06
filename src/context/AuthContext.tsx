'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithIdentifier: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error: string | null; confirmed: boolean }>;
  verifyEmailOtp: (email: string, token: string, username: string) => Promise<{ error: string | null }>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    return !data;
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    // Final server-side uniqueness check before creating the auth user
    const available = await checkUsernameAvailable(username);
    if (!available) return { error: 'That username was just taken — please choose another.', confirmed: false };

    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null, confirmed: !!data.session };
  };

  // username is passed here so the profile row is only written after the user
  // proves they own the email — no ghost records on failed/abandoned signups
  const verifyEmailOtp = async (email: string, token: string, username: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) return { error: error.message };

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, username: username.toLowerCase() });
      if (profileError) {
        if (profileError.code === '23505')
          return { error: 'That username was just taken — please sign in and pick a new one.' };
        return { error: profileError.message };
      }
    }
    return { error: null };
  };

  // Accepts email address OR username
  const signInWithIdentifier = async (identifier: string, password: string) => {
    let email = identifier.trim();

    if (!email.includes('@')) {
      // Username → look up email via a security-definer Postgres function
      const { data, error } = await supabase.rpc('get_email_by_username', {
        uname: email.toLowerCase(),
      });
      if (error || !data) return { error: 'No account found with that username.' };
      email = data as string;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('not confirmed')) {
        return { error: 'EMAIL_NOT_CONFIRMED' };
      }
      if (error.message.toLowerCase().includes('invalid login')) {
        return { error: 'Incorrect email / username or password.' };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signInWithIdentifier,
      signUpWithEmail,
      verifyEmailOtp,
      checkUsernameAvailable,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
