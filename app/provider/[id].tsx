import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { categoryById } from '@/constants/categories';
import { colors, spacing, type } from '@/constants/theme';
import { repository } from '@/lib/repository';
import { useApp } from '@/providers/AppProvider';
import type { Provider } from '@/types/domain';

function first(value: string | string[] | undefined): string { return Array.isArray(value) ? value[0] ?? '' : value ?? ''; }

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const providerId = first(id);
  const router = useRouter();
  const { profile } = useApp();
  const [provider, setProvider] = useState<Provider | null>();
  useEffect(() => { void repository.getProvider(providerId).then(setProvider); }, [providerId]);
  if (provider === undefined) return <Screen><ActivityIndicator color={colors.green} style={styles.loading} /></Screen>;
  if (provider === null) return <Screen header={<BrandHeader compact title="Service Friend" />}><Text style={styles.missing}>This provider profile is unavailable.</Text></Screen>;
  const currentProvider = provider;
  async function contact() {
    if (!currentProvider.phone) return Alert.alert('No public contact', 'This provider has not approved a public phone number.');
    const supported = await Linking.canOpenURL(`tel:${currentProvider.phone}`);
    if (supported) await Linking.openURL(`tel:${currentProvider.phone}`);
  }
  return (
    <Screen header={<BrandHeader compact title="Service Friend profile" />}>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Back</Text></Pressable>
      <View style={styles.hero}><View style={styles.avatar}><Text style={styles.avatarText}>{provider.publicName.slice(0, 1)}</Text></View><Text style={styles.title}>{provider.publicName}</Text>{provider.branchName ? <Text style={styles.branch}>{provider.branchName}</Text> : null}<RatingStars value={provider.rating} count={provider.ratingCount} size={19} /></View>
      <View style={styles.badges}><Badge label={provider.listingSource === 'community_shared' ? 'Community-shared' : 'Provider self-listed'} tone={provider.listingSource === 'community_shared' ? 'green' : 'gray'} />{provider.placement === 'sponsored' ? <Badge label="Sponsored" tone="orange" /> : null}{provider.verified ? <Badge label="Claimed profile" tone="blue" /> : <Badge label="Unclaimed profile" />}</View>
      <Card><Text style={styles.section}>Public identity</Text>{provider.kind === 'individual' ? <Text style={styles.body}>Alias: {provider.alias} · {provider.hfId}{provider.tradeName ? `\nOptional trade name: ${provider.tradeName}` : ''}</Text> : <Text style={styles.body}>Public company: {provider.publicName}{provider.branchName ? `\nServicing branch: ${provider.branchName}` : ''}\nHuman administrators use private aliases and are not displayed here.</Text>}</Card>
      <Card><Text style={styles.section}>Service categories</Text>{provider.categoryIds.map((id) => <Text key={id} style={styles.list}>• {categoryById[id]?.name ?? id}</Text>)}<Text style={styles.coverage}>Covers {provider.serviceAreaIds.length} HouseFriends service area{provider.serviceAreaIds.length === 1 ? '' : 's'}. Coverage affects eligibility, not ratings.</Text></Card>
      {provider.licenseLabel ? <Card><Text style={styles.section}>Regulated-service information</Text><Text style={styles.body}>{provider.licenseLabel}</Text><Text style={styles.warning}>HouseFriends does not claim license verification unless an authoritative verification source is enabled for this jurisdiction.</Text></Card> : null}
      <Button label="Contact Service Friend" onPress={() => void contact()} />
      <Text style={styles.contactNote}>Only provider-approved public contact information is used. Customer-uploaded business cards remain private until claimed or approved.</Text>
      <Pressable onPress={() => router.push({ pathname: '/report', params: { targetType: 'provider', targetId: provider.id } })} style={styles.report}><Text style={styles.reportText}>Report or dispute this profile</Text></Pressable>
      <Button label="Block this provider" tone="secondary" onPress={() => void repository.blockUser(profile?.id ?? '', provider.id).then(() => Alert.alert('Blocked', 'This provider will no longer appear for your account.'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 100 }, missing: { ...type.body, marginTop: spacing.xl }, back: { minHeight: 44, justifyContent: 'center' }, backText: { color: colors.blue, fontWeight: '800' }, hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }, avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center' }, avatarText: { color: colors.white, fontSize: 32, fontWeight: '900' }, title: { ...type.pageTitle, textAlign: 'center' }, branch: { color: colors.gray, fontWeight: '700' }, badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }, section: type.sectionTitle, body: { ...type.body, marginTop: spacing.sm }, list: { ...type.body, marginTop: 6 }, coverage: { ...type.caption, marginTop: spacing.md }, warning: { ...type.caption, color: colors.danger, marginTop: spacing.sm }, contactNote: { ...type.caption, marginVertical: spacing.sm, textAlign: 'center' }, report: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, reportText: { color: colors.danger, fontWeight: '700' },
});
