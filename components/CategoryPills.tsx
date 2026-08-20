import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { serviceCategories } from '@/constants/categories';
import { colors, minimumTouchTarget, radius, spacing } from '@/constants/theme';

type Props = { selected?: string; onSelect(id?: string): void };

export function CategoryPills({ selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Pressable onPress={() => onSelect(undefined)} style={[styles.pill, !selected && styles.selected]} accessibilityRole="button"><Text style={[styles.text, !selected && styles.selectedText]}>All</Text></Pressable>
      {serviceCategories.map((category) => (
        <Pressable key={category.id} onPress={() => onSelect(category.id)} style={[styles.pill, selected === category.id && styles.selected]} accessibilityRole="button">
          <Text style={[styles.text, selected === category.id && styles.selectedText]}>{category.icon} {category.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.md },
  pill: { minHeight: minimumTouchTarget, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grayLight },
  selected: { backgroundColor: colors.navy, borderColor: colors.navy },
  text: { color: colors.ink, fontWeight: '700', fontSize: 13 }, selectedText: { color: colors.white },
});
