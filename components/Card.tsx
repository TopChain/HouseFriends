import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, shadow, spacing } from '@/constants/theme';

export function Card({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return <View style={[styles.card, style]} {...props}>{children}</View>;
}

const styles = StyleSheet.create({ card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginVertical: spacing.sm, ...shadow } });
