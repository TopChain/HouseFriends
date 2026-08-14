import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '@/constants/theme';

export function EmptyState({ title, message, icon = '🧭' }: { title: string; message: string; icon?: string }) {
  return <View style={styles.wrap}><Text style={styles.icon}>{icon}</Text><Text style={type.sectionTitle}>{title}</Text><Text style={styles.message}>{message}</Text></View>;
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm }, icon: { fontSize: 42 }, message: { ...type.body, textAlign: 'center', color: colors.gray } });
