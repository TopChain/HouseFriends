import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/constants/theme';

export function PrivacyNotice({ text = 'Share the service experience - never the private home.' }: { text?: string }) {
  return <View style={styles.box} accessibilityRole="summary"><Text style={styles.icon}>🛡️</Text><Text style={styles.text}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successSoft, borderRadius: radius.md, padding: spacing.md, marginVertical: spacing.sm },
  icon: { fontSize: 20 }, text: { ...type.body, flex: 1, color: colors.greenDark, fontWeight: '700' },
});
