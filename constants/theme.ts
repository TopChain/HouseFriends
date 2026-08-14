import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  navy: '#08254B',
  green: '#63A52D',
  greenDark: '#427A1C',
  blue: '#1468C8',
  orange: '#F39A16',
  cream: '#FBFAF6',
  gray: '#697386',
  grayLight: '#E8ECF1',
  ink: '#10243D',
  white: '#FFFFFF',
  danger: '#B42318',
  dangerSoft: '#FEE4E2',
  successSoft: '#EAF4E1',
  blueSoft: '#E8F2FC',
  orangeSoft: '#FFF2DE',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const shadow: ViewStyle = {
  shadowColor: colors.navy,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

export const type = {
  pageTitle: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.navy } satisfies TextStyle,
  sectionTitle: { fontSize: 21, lineHeight: 27, fontWeight: '800', color: colors.navy } satisfies TextStyle,
  cardTitle: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: colors.ink } satisfies TextStyle,
  body: { fontSize: 15, lineHeight: 22, color: colors.ink } satisfies TextStyle,
  caption: { fontSize: 12, lineHeight: 17, color: colors.gray } satisfies TextStyle,
} as const;

export const minimumTouchTarget = 44;
