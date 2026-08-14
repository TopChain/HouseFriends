import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { categoryById } from '@/constants/categories';
import { colors, radius, spacing, type } from '@/constants/theme';
import { repository } from '@/lib/repository';
import { useApp } from '@/providers/AppProvider';
import type { Experience } from '@/types/domain';

function first(value: string | string[] | undefined): string { return Array.isArray(value) ? value[0] ?? '' : value ?? ''; }
function money(value: number, currency: string) { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value / 100); }

export default function ExperienceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const experienceId = first(id);
  const router = useRouter();
  const { profile } = useApp();
  const [item, setItem] = useState<Experience | null>();
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { void repository.getExperience(experienceId).then(setItem); }, [experienceId]);
  if (item === undefined) return <Screen><ActivityIndicator color={colors.green} style={styles.loading} /></Screen>;
  if (item === null) return <Screen header={<BrandHeader compact title="Experience" />}><Text style={styles.missing}>This experience is unavailable or was removed after moderation.</Text></Screen>;
  const experience = item;
  const rating = Object.values(item.rating).reduce((sum, value) => sum + value, 0) / 5;
  async function action(name: 'save' | 'helpful' | 'verified') {
    try {
      setBusy(name);
      if (name === 'save') await repository.saveExperience(profile?.id ?? '', experience.id);
      if (name === 'helpful') await repository.markHelpful(profile?.id ?? '', experience.id);
      if (name === 'verified') await repository.confirmReferral(profile?.id ?? '', experience.id);
      Alert.alert(name === 'verified' ? 'Verified referral confirmed' : name === 'helpful' ? 'Helpful relationship recorded' : 'Saved', name === 'verified' ? 'The existing helpful relationship was upgraded; it was not counted twice.' : undefined);
    } catch (error) { Alert.alert('Could not complete action', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(null); }
  }
  return (
    <Screen header={<BrandHeader compact title="Real service experience" />}>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Back</Text></Pressable>
      <View style={styles.badges}><Badge label="Community-reported" tone="green" />{item.provider.placement === 'sponsored' ? <Badge label="Sponsored provider placement" tone="orange" /> : null}</View>
      <Text style={styles.title}>{item.serviceItem}</Text>
      <Text style={styles.category}>{categoryById[item.categoryId]?.icon} {categoryById[item.categoryId]?.name}</Text>
      <Card><Pressable onPress={() => router.push(`/provider/${item.provider.id}`)}><Text style={styles.provider}>{item.provider.publicName} ›</Text><RatingStars value={rating} /></Pressable><View style={styles.priceRow}><View><Text style={styles.label}>Actual service cost reported by {item.sharer.alias}</Text><Text style={styles.price}>{money(item.costMinor, item.currency)}</Text></View><Text style={styles.date}>{item.serviceMonth.slice(0, 7)}</Text></View><Text style={styles.inclusion}>{item.includesMaterialsTax == null ? 'Materials/tax inclusion not reported' : item.includesMaterialsTax ? 'Materials and tax reported as included' : 'Materials and tax reported as not included'}</Text></Card>
      <Card><Text style={styles.section}>Five-question feedback</Text>{Object.entries(item.rating).map(([key, value]) => <View key={key} style={styles.ratingLine}><Text style={styles.ratingName}>{key[0]?.toUpperCase()}{key.slice(1)}</Text><RatingStars value={value} /></View>)}</Card>
      <Card><Text style={styles.section}>Neighbor comment</Text><Text style={styles.comment}>{item.comment}</Text><Text style={styles.sharer}>Shared by {item.sharer.alias} · {item.sharer.hfId}</Text></Card>
      {item.mediaUrls.length ? <View style={styles.media}>{item.mediaUrls.map((url) => <Image key={url} source={{ uri: url }} style={styles.photo} />)}</View> : null}
      <PrivacyNotice text={`${item.anchor.name}, ${item.anchor.locality} is a safe public-area reference - not the service address.`} />
      {item.providerResponse ? <Card><Text style={styles.section}>Service Friend response</Text><Text style={styles.comment}>{item.providerResponse}</Text></Card> : null}
      <View style={styles.actions}><Button label="Save" tone="secondary" loading={busy === 'save'} onPress={() => void action('save')} /><Button label="This helped me" loading={busy === 'helpful'} onPress={() => void action('helpful')} /><Button label="Confirm completed referral" tone="quiet" loading={busy === 'verified'} onPress={() => void action('verified')} /></View>
      <Pressable onPress={() => router.push({ pathname: '/report', params: { targetType: 'experience', targetId: item.id } })} style={styles.report}><Text style={styles.reportText}>Report this content</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 100 }, missing: { ...type.body, marginTop: spacing.xl }, back: { minHeight: 44, justifyContent: 'center' }, backText: { color: colors.blue, fontWeight: '800' }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, title: { ...type.pageTitle, marginTop: spacing.md }, category: { color: colors.greenDark, fontWeight: '800', marginTop: spacing.sm }, provider: { ...type.sectionTitle, color: colors.blue, marginBottom: 5 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg }, label: type.caption, price: { color: colors.navy, fontSize: 28, fontWeight: '900', marginTop: 2 }, date: { color: colors.gray, fontWeight: '700' }, inclusion: { ...type.caption, marginTop: spacing.sm }, section: type.sectionTitle, ratingLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.grayLight }, ratingName: { ...type.body }, comment: { ...type.body, marginTop: spacing.sm }, sharer: { ...type.caption, color: colors.greenDark, fontWeight: '700', marginTop: spacing.md },
  media: { flexDirection: 'row', gap: spacing.sm }, photo: { width: 100, height: 100, borderRadius: radius.md }, actions: { gap: spacing.sm, marginTop: spacing.lg }, report: { minHeight: 48, justifyContent: 'center', alignItems: 'center' }, reportText: { color: colors.danger, fontWeight: '700' },
});
