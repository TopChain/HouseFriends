import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

type Props = { compact?: boolean; title?: string; subtitle?: string };

export function BrandHeader({ compact = false, title, subtitle }: Props) {
  return (
    <View style={[styles.header, compact && styles.compact]} accessibilityRole="header">
      <Image source={require('@/assets/brand-symbol.png')} style={[styles.symbol, compact && styles.symbolCompact]} resizeMode="contain" accessibilityLabel="HouseFriends Tool Circle" />
      <View style={styles.textWrap}>
        <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}><Text style={styles.house}>House</Text>Friends</Text>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.grayLight },
  compact: { paddingVertical: spacing.sm },
  symbol: { width: 54, height: 54, marginRight: spacing.sm },
  symbolCompact: { width: 38, height: 38 },
  textWrap: { flex: 1 },
  wordmark: { fontSize: 24, lineHeight: 28, fontWeight: '800', color: colors.green, letterSpacing: -0.8 },
  wordmarkCompact: { fontSize: 20, lineHeight: 22 },
  house: { color: colors.navy },
  title: { color: colors.navy, fontWeight: '800', fontSize: 16, marginTop: 1 },
  subtitle: { color: colors.gray, fontSize: 12, marginTop: 2 },
});
