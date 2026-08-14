import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Provider } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

function queryParams(url: string): Record<string, string> {
  const hash = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  return Object.fromEntries(new URLSearchParams(hash ?? '').entries());
}

export async function signInWithProvider(provider: Extract<Provider, 'apple' | 'google'>): Promise<void> {
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('The sign-in provider did not return an authorization URL.');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') throw new Error('Sign-in was cancelled.');
  const params = queryParams(result.url);
  if (params.error_description) throw new Error(params.error_description);
  if (!params.access_token || !params.refresh_token) throw new Error('Sign-in returned an incomplete session.');
  const { error: sessionError } = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
  if (sessionError) throw sessionError;
}
