import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';
import 'react-native-url-polyfill/auto';
import { config } from '@/lib/config';

export const isNeonConfigured = Boolean(
  config.neonAuthUrl
  && config.neonDataApiUrl
  && !config.neonAuthUrl.includes('YOUR_')
  && !config.neonDataApiUrl.includes('YOUR_'),
);

export const neon = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: config.neonAuthUrl || 'https://invalid.local/auth',
    allowAnonymous: true,
  },
  dataApi: { url: config.neonDataApiUrl || 'https://invalid.local/rest/v1' },
});

export type NeonSession = NonNullable<Awaited<ReturnType<typeof neon.auth.getSession>>['data']['session']>;
