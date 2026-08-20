import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Props = { label: string; tone?: 'green' | 'blue' | 'orange' | 'gray' };

export function Badge({ label, tone = 'gray' }: Props) {
  return <View style={[styles.badge, styles[tone]]}><Text style={[styles.text, tone === 'blue' && styles.blueText]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  green: { backgroundColor: colors.successSoft }, blue: { backgroundColor: colors.blueSoft }, orange: { backgroundColor: colors.orangeSoft }, gray: { backgroundColor: colors.grayLight },
  text: { color: colors.ink, fontWeight: '700', fontSize: 11 }, blueText: { color: colors.blue },
});
