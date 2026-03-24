/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const ensureSupabaseSession = async () => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Failed to fetch Supabase session: ${sessionError.message}`);
  }

  if (session) {
    return session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(
      `Supabase anonymous sign-in failed: ${error.message}. Enable Anonymous Sign-Ins in Supabase Auth or connect with Supabase Auth before saving posts.`
    );
  }

  return data.session;
};

export default supabase;
