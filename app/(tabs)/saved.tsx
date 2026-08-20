import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BrandHeader } from '@/components/BrandHeader';
import { EmptyState } from '@/components/EmptyState';
import { ExperienceCard } from '@/components/ExperienceCard';
import { Screen } from '@/components/Screen';
import { colors, spacing, type } from '@/constants/theme';
import { repository } from '@/lib/repository';
import { useApp } from '@/providers/AppProvider';
import type { Experience } from '@/types/domain';

export default function SavedScreen() {
  const { profile } = useApp();
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    void repository.listSaved(profile?.id ?? '').then((rows) => { if (active) { setItems(rows); setLoading(false); } });
    return () => { active = false; };
  }, [profile?.id]));
  return (
    <Screen header={<BrandHeader compact title="Saved" />}>
      <Text style={styles.title}>Your trusted shortlist</Text><Text style={styles.subtitle}>Saved experiences stay connected to their original recommender and Service Friend.</Text>
      {loading ? <ActivityIndicator color={colors.green} style={styles.loading} /> : items.length ? items.map((item) => <ExperienceCard key={item.id} experience={item} />) : <EmptyState icon="♡" title="Nothing saved yet" message="Save a real experience so you can return to it before contacting a Service Friend." />}
    </Screen>
  );
}

const styles = StyleSheet.create({ title: { ...type.pageTitle, marginTop: spacing.lg }, subtitle: { ...type.body, color: colors.gray, marginVertical: spacing.sm }, loading: { marginTop: spacing.xl } });
