/* eslint-disable expo/no-dynamic-env-var */

const keys = [
  'EXPO_PUBLIC_NEON_AUTH_URL',
  'EXPO_PUBLIC_NEON_DATA_API_URL',
  'EXPO_PUBLIC_MEDIA_API_URL',
  'EXPO_PUBLIC_MAP_STYLE_URL',
  'EXPO_PUBLIC_PRIVACY_URL',
  'EXPO_PUBLIC_TERMS_URL',
  'EXPO_PUBLIC_SUPPORT_URL',
  'EXPO_PUBLIC_SUPPORT_EMAIL',
  'EXPO_PUBLIC_ACCOUNT_DELETION_URL',
];

if (process.env.EXPO_PUBLIC_APP_MODE === 'production') {
  const missing = keys.filter((key) => {
    const value = process.env[key];
    return !value || value.includes('REPLACE') || value.includes('YOUR_');
  });
  if (process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE !== 'false') missing.push('EXPO_PUBLIC_ENABLE_DEMO_MODE=false');
  if (missing.length) {
    console.error(`Production build blocked. Configure: ${missing.join(', ')}`);
    process.exit(1);
  }
}

console.warn('HouseFriends build environment validated.');
