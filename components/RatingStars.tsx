import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

export function RatingStars({ value, count, size = 16 }: { value: number; count?: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <View style={styles.row} accessibilityLabel={`${value.toFixed(1)} out of 5 stars${count == null ? '' : ` from ${count} customers`}`}>
      <Text style={{ color: colors.orange, fontSize: size }}>{'★'.repeat(rounded)}<Text style={styles.empty}>{'★'.repeat(5 - rounded)}</Text></Text>
      <Text style={styles.value}>{value.toFixed(1)}{count == null ? '' : ` (${count})`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 6, alignItems: 'center' }, empty: { color: colors.grayLight }, value: { color: colors.gray, fontSize: 12, fontWeight: '700' } });
