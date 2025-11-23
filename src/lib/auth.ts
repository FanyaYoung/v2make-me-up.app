import { supabase } from '@/integrations/supabase/client';

// Call this on click
export async function signInWithGoogle(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
      // Optional: scopes, query params, etc.
    }
  });
  if (error) console.error('OAuth error', error);
  return data;
}

export async function signInWithApple(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: redirectTo ?? `${window.location.origin}/auth/callback` }
  });
  if (error) console.error('OAuth error', error);
  return data;
}
