const requiredProductionKeys = [
  'EXPO_PUBLIC_NEON_AUTH_URL',
  'EXPO_PUBLIC_NEON_DATA_API_URL',
  'EXPO_PUBLIC_PRIVACY_URL',
  'EXPO_PUBLIC_TERMS_URL',
  'EXPO_PUBLIC_SUPPORT_URL',
  'EXPO_PUBLIC_SUPPORT_EMAIL',
  'EXPO_PUBLIC_ACCOUNT_DELETION_URL',
] as const;

const defaultMapStyleUrl = 'https://tiles.openfreemap.org/styles/liberty';

export const config = {
  mode: process.env.EXPO_PUBLIC_APP_MODE ?? 'demo',
  enableDemoMode: process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE !== 'false',
  neonAuthUrl: process.env.EXPO_PUBLIC_NEON_AUTH_URL ?? '',
  neonDataApiUrl: process.env.EXPO_PUBLIC_NEON_DATA_API_URL ?? '',
  mediaApiUrl: process.env.EXPO_PUBLIC_MEDIA_API_URL ?? '',
  mapStyleUrl: process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? defaultMapStyleUrl,
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? '',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? '',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '',
  supportUrl: process.env.EXPO_PUBLIC_SUPPORT_URL ?? 'https://github.com/TopChain/HouseFriends/issues',
  accountDeletionUrl: process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL ?? '',
} as const;

export function missingProductionConfiguration(env: NodeJS.ProcessEnv = process.env): string[] {
  if ((env.EXPO_PUBLIC_APP_MODE ?? 'demo') !== 'production') return [];
  return requiredProductionKeys.filter((key) => {
    const value = env[key];
    return !value || value.includes('REPLACE') || value.includes('YOUR_');
  });
}

export function assertProductionConfiguration(): void {
  const missing = missingProductionConfiguration();
  if (missing.length > 0) throw new Error(`Missing production configuration: ${missing.join(', ')}`);
}
