import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, minimumTouchTarget, radius, spacing } from '@/constants/theme';

type Props = PressableProps & { label: string; tone?: 'primary' | 'secondary' | 'danger' | 'quiet'; loading?: boolean };

export function Button({ label, tone = 'primary', loading, disabled, style, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      style={(state) => [styles.base, styles[tone], state.pressed && styles.pressed, (disabled || loading) && styles.disabled, typeof style === 'function' ? style(state) : style]}
      {...props}
    >
      {loading ? <ActivityIndicator color={tone === 'secondary' || tone === 'quiet' ? colors.navy : colors.white} /> : <Text style={[styles.label, (tone === 'secondary' || tone === 'quiet') && styles.darkLabel]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: minimumTouchTarget, paddingHorizontal: spacing.md, paddingVertical: 11, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primary: { backgroundColor: colors.green },
  secondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.navy },
  danger: { backgroundColor: colors.danger },
  quiet: { backgroundColor: colors.blueSoft },
  label: { color: colors.white, fontSize: 15, fontWeight: '800' },
  darkLabel: { color: colors.navy },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.48 },
});
