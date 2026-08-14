import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BrandHeader } from '@/components/BrandHeader';
import { CategoryPills } from '@/components/CategoryPills';
import { EmptyState } from '@/components/EmptyState';
import { ExperienceCard } from '@/components/ExperienceCard';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { ProviderCard } from '@/components/ProviderCard';
import { Screen } from '@/components/Screen';
import { DiscoveryMap } from '@/components/map/DiscoveryMap';
import { colors, radius, spacing, type } from '@/constants/theme';
import { repository } from '@/lib/repository';
import type { Experience, Provider, SafeAnchor } from '@/types/domain';

export default function DiscoveryScreen() {
  const [anchors, setAnchors] = useState<SafeAnchor[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState<string>();
  const [categoryId, setCategoryId] = useState<string>();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'experiences' | 'providers'>('experiences');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void repository.listAnchors().then((items) => { setAnchors(items); setSelectedAnchor(items[0]?.id); });
  }, []);

  useEffect(() => {
    let active = true;
    const anchor = anchors.find((item) => item.id === selectedAnchor);
    const filters = { anchorId: selectedAnchor, serviceAreaId: anchor?.serviceAreaId, categoryId, query: query.trim() || undefined };
    void Promise.all([repository.searchExperiences(filters), repository.listProviders(filters)]).then(([experienceRows, providerRows]) => {
      if (!active) return;
      setExperiences(experienceRows);
      setProviders(providerRows);
      setLoading(false);
    });
    return () => { active = false; };
  }, [anchors, categoryId, query, selectedAnchor]);

  return (
    <Screen header={<BrandHeader compact subtitle="Trusted People. Better Homes." />}>
      <Text style={styles.title}>Find trusted home service</Text>
      <PrivacyNotice text="Search around a safe public place. HouseFriends never shows or stores a private home address." />
      <View style={styles.searchRow}><Text style={styles.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Service, provider, or task" returnKeyType="search" style={styles.searchInput} accessibilityLabel="Search service experiences" /></View>
      <CategoryPills selected={categoryId} onSelect={setCategoryId} />
      <Text style={styles.label}>Safe public anchor</Text>
      <View style={styles.anchors}>{anchors.map((anchor) => <Pressable key={anchor.id} onPress={() => setSelectedAnchor(anchor.id)} style={[styles.anchor, selectedAnchor === anchor.id && styles.anchorSelected]} accessibilityRole="radio" accessibilityState={{ checked: selectedAnchor === anchor.id }}><Text style={styles.anchorIcon}>{anchor.class === 'school' ? '🏫' : anchor.class === 'police_station' ? '🛡️' : anchor.class === 'fire_station' ? '🚒' : anchor.class === 'hospital_urgent_care' ? '🏥' : '🤝'}</Text><Text numberOfLines={1} style={[styles.anchorText, selectedAnchor === anchor.id && styles.anchorTextSelected]}>{anchor.name}</Text></Pressable>)}</View>
      <DiscoveryMap anchors={anchors} selectedId={selectedAnchor} onSelect={setSelectedAnchor} />
      <View style={styles.segment}>
        <Pressable onPress={() => setMode('experiences')} style={[styles.segmentButton, mode === 'experiences' && styles.segmentSelected]}><Text style={[styles.segmentText, mode === 'experiences' && styles.segmentTextSelected]}>Real experiences ({experiences.length})</Text></Pressable>
        <Pressable onPress={() => setMode('providers')} style={[styles.segmentButton, mode === 'providers' && styles.segmentSelected]}><Text style={[styles.segmentText, mode === 'providers' && styles.segmentTextSelected]}>Service Friends ({providers.length})</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator color={colors.green} style={styles.loading} /> : mode === 'experiences' ? (
        experiences.length ? experiences.map((item) => <ExperienceCard key={item.id} experience={item} />) : <EmptyState title="No shared experience yet" message="Try an adjacent safe anchor or another category. HouseFriends never invents providers or reviews." />
      ) : providers.length ? providers.map((item) => <ProviderCard key={item.id} provider={item} />) : <EmptyState title="No eligible provider yet" message="Try a nearby service area. Free organic presence remains separate from future paid placement." />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.pageTitle, marginTop: spacing.lg }, searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grayLight, borderRadius: radius.md, minHeight: 52, paddingHorizontal: spacing.md, marginTop: spacing.md }, searchIcon: { color: colors.blue, fontWeight: '900', fontSize: 24, marginRight: spacing.sm }, searchInput: { flex: 1, fontSize: 16, color: colors.ink },
  label: { ...type.cardTitle, marginTop: spacing.md }, anchors: { gap: 6, marginVertical: spacing.sm }, anchor: { minHeight: 46, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.grayLight }, anchorSelected: { backgroundColor: colors.navy, borderColor: colors.navy }, anchorIcon: { fontSize: 18, marginRight: spacing.sm }, anchorText: { flex: 1, color: colors.ink, fontWeight: '700' }, anchorTextSelected: { color: colors.white },
  segment: { flexDirection: 'row', backgroundColor: colors.grayLight, borderRadius: radius.md, padding: 4, marginVertical: spacing.md }, segmentButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm }, segmentSelected: { backgroundColor: colors.white }, segmentText: { color: colors.gray, fontSize: 12, fontWeight: '800' }, segmentTextSelected: { color: colors.navy }, loading: { marginTop: spacing.xl },
});
