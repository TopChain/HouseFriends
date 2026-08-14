import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { neon } from '@/lib/neon';

WebBrowser.maybeCompleteAuthSession();

function queryParams(url: string): Record<string, string> {
  const hash = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  return Object.fromEntries(new URLSearchParams(hash ?? '').entries());
}

export async function signInWithProvider(provider: 'apple' | 'google'): Promise<void> {
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await neon.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('The sign-in provider did not return an authorization URL.');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') throw new Error('Sign-in was cancelled.');
  const params = queryParams(result.url);
  if (params.error_description) throw new Error(params.error_description);
  const { error: sessionError } = await neon.auth.exchangeCodeForSession(params.code ?? 'oauth-callback');
  if (sessionError) throw sessionError;
}
