import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { categoryById } from '@/constants/categories';
import { colors, spacing, type } from '@/constants/theme';
import type { Provider } from '@/types/domain';
import { Badge } from './Badge';
import { Card } from './Card';
import { RatingStars } from './RatingStars';

export function ProviderCard({ provider }: { provider: Provider }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/provider/${provider.id}`)} accessibilityRole="button" accessibilityLabel={`View ${provider.publicName}`}>
      <Card>
        <View style={styles.top}><View style={styles.avatar}><Text style={styles.avatarText}>{provider.publicName.slice(0, 1)}</Text></View><View style={styles.flex}>
          <Text style={type.cardTitle}>{provider.publicName}</Text>
          {provider.branchName ? <Text style={styles.meta}>{provider.branchName}</Text> : null}
          <RatingStars value={provider.rating} count={provider.ratingCount} />
        </View></View>
        <View style={styles.badges}>
          <Badge label={provider.listingSource === 'community_shared' ? 'Community-shared' : 'Provider self-listed'} tone={provider.listingSource === 'community_shared' ? 'green' : 'gray'} />
          {provider.placement === 'sponsored' ? <Badge label="Sponsored" tone="orange" /> : null}
          {provider.verified ? <Badge label="Claimed profile" tone="blue" /> : <Badge label="Unclaimed" />}
        </View>
        <Text style={styles.categories}>{provider.categoryIds.map((id) => categoryById[id]?.name ?? id).join(' · ')}</Text>
        {provider.kind === 'individual' ? <Text style={styles.meta}>Public identity: {provider.alias} · {provider.hfId}</Text> : <Text style={styles.meta}>Company identity · branch ratings shown separately</Text>}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' }, flex: { flex: 1 }, avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '900', fontSize: 23 }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: spacing.md },
  meta: type.caption, categories: { ...type.body, fontWeight: '700', marginBottom: 5 },
});
