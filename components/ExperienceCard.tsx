import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { categoryById } from '@/constants/categories';
import { colors, spacing, type } from '@/constants/theme';
import type { Experience } from '@/types/domain';
import { Badge } from './Badge';
import { Card } from './Card';
import { RatingStars } from './RatingStars';

function money(costMinor: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(costMinor / 100);
}

export function ExperienceCard({ experience }: { experience: Experience }) {
  const router = useRouter();
  const category = categoryById[experience.categoryId];
  const rating = Object.values(experience.rating).reduce((sum, value) => sum + value, 0) / 5;
  return (
    <Pressable onPress={() => router.push(`/experience/${experience.id}`)} accessibilityRole="button" accessibilityLabel={`View ${experience.provider.publicName} experience`}>
      <Card>
        <View style={styles.top}>
          <View style={styles.flex}><Text style={styles.category}>{category?.icon} {category?.name}</Text><Text style={type.cardTitle}>{experience.serviceItem}</Text></View>
          <Text style={styles.cost}>{money(experience.costMinor, experience.currency)}</Text>
        </View>
        <View style={styles.badges}><Badge label="Community-reported" tone="green" />{experience.provider.placement === 'sponsored' ? <Badge label="Sponsored" tone="orange" /> : null}</View>
        <Text style={styles.provider}>{experience.provider.publicName}</Text>
        <RatingStars value={rating} />
        <Text style={styles.comment} numberOfLines={3}>{experience.comment}</Text>
        <View style={styles.footer}>
          <Text style={styles.meta}>Shared by {experience.sharer.alias} · {experience.sharer.hfId}</Text>
          <Text style={styles.meta}>{experience.anchor.name} area · {experience.serviceMonth.slice(0, 7)}</Text>
          <Text style={styles.trust}>★ {experience.helpfulCount} helpful · ✓ {experience.verifiedReferralCount} verified referrals</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: spacing.sm }, flex: { flex: 1 }, category: { ...type.caption, color: colors.greenDark, fontWeight: '800', marginBottom: 3 }, cost: { color: colors.navy, fontWeight: '900', fontSize: 18 },
  badges: { flexDirection: 'row', gap: 6, marginVertical: spacing.sm }, provider: { color: colors.blue, fontWeight: '800', marginBottom: 5 },
  comment: { ...type.body, marginTop: spacing.sm }, footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.grayLight, paddingTop: spacing.sm, marginTop: spacing.md, gap: 3 },
  meta: type.caption, trust: { ...type.caption, color: colors.greenDark, fontWeight: '800' },
});
