import { getLocales } from 'expo-localization';

export type Language = 'en' | 'zh-Hant';

const copy = {
  en: {
    trustedPeople: 'Trusted People. Better Homes.',
    search: 'Search',
    saved: 'Saved',
    share: 'Share',
    trust: 'Trust',
    account: 'Account',
    nearAnchor: 'Search near a safe public place',
    noHome: 'Your home address is never shown or stored.',
    communityReported: 'Community-reported',
    selfListed: 'Provider self-listed',
    sponsored: 'Sponsored',
  },
  'zh-Hant': {
    trustedPeople: '值得信賴的人，打造更好的家。',
    search: '搜尋',
    saved: '收藏',
    share: '分享',
    trust: '信任',
    account: '帳戶',
    nearAnchor: '以安全公共地點搜尋附近服務',
    noHome: '您的住家地址永遠不會顯示或儲存。',
    communityReported: '社群實際分享',
    selfListed: '服務者自行登錄',
    sponsored: '贊助推廣',
  },
} as const;

export type CopyKey = keyof (typeof copy)['en'];

export function preferredLanguage(): Language {
  const languageTag = getLocales()[0]?.languageTag ?? 'en';
  return languageTag.toLowerCase().startsWith('zh') ? 'zh-Hant' : 'en';
}

export function t(key: CopyKey, language: Language = preferredLanguage()): string {
  return copy[language][key] ?? copy.en[key];
}
