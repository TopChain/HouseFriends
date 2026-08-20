import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, type } from '@/constants/theme';
import { repository } from '@/lib/repository';
import { useApp } from '@/providers/AppProvider';
import type { ReportReason } from '@/types/domain';

const reasons: { id: ReportReason; label: string }[] = [{ id: 'privacy', label: 'Private information' }, { id: 'fraud', label: 'Fraud or false experience' }, { id: 'abuse', label: 'Harassment or abusive content' }, { id: 'conflict', label: 'Provider dispute or identity conflict' }, { id: 'other', label: 'Other' }];

export default function ReportScreen() {
  const params = useLocalSearchParams<{ targetType?: string; targetId?: string }>();
  const router = useRouter(); const { profile } = useApp();
  const [reason, setReason] = useState<ReportReason>('privacy'); const [details, setDetails] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() {
    try { setBusy(true); await repository.reportContent(profile?.id ?? '', params.targetType ?? 'unknown', params.targetId ?? '', reason, details); Alert.alert('Report received', 'HouseFriends will prioritize privacy and safety concerns. You may appeal a moderation result.', [{ text: 'Done', onPress: () => router.back() }]); }
    catch (error) { Alert.alert('Could not submit report', error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); }
  }
  return <Screen header={<BrandHeader compact title="Report content" />}><Text style={styles.title}>Help keep HouseFriends trustworthy</Text><Text style={styles.body}>Reports enter a risk-prioritized moderation queue. The person you report will not see your private account information.</Text><View style={styles.reasons}>{reasons.map((item) => <Pressable key={item.id} onPress={() => setReason(item.id)} style={[styles.reason, reason === item.id && styles.selected]}><View style={[styles.radio, reason === item.id && styles.radioSelected]} /><Text style={styles.reasonText}>{item.label}</Text></Pressable>)}</View><TextInput value={details} onChangeText={setDetails} placeholder="Briefly explain the issue" multiline maxLength={1000} style={styles.input} /><Button label="Submit report" onPress={() => void submit()} loading={busy} /><Button label="Cancel" tone="quiet" onPress={() => router.back()} style={styles.cancel} /></Screen>;
}

const styles = StyleSheet.create({ title: { ...type.pageTitle, marginTop: spacing.lg }, body: { ...type.body, color: colors.gray, marginTop: spacing.sm }, reasons: { marginVertical: spacing.lg, gap: 5 }, reason: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48, paddingHorizontal: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.grayLight }, selected: { borderColor: colors.green, backgroundColor: colors.successSoft }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.gray }, radioSelected: { borderWidth: 6, borderColor: colors.green }, reasonText: { color: colors.ink, fontWeight: '700' }, input: { minHeight: 130, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.grayLight, padding: spacing.md, textAlignVertical: 'top', marginBottom: spacing.md }, cancel: { marginTop: spacing.sm } });
