import { StyleSheet, Text, View } from 'react-native';
import { BrandHeader } from '@/components/BrandHeader';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing, type } from '@/constants/theme';
import { referralBadge } from '@/lib/domain/rules.mjs';
import { useApp } from '@/providers/AppProvider';

const milestones = [5, 10, 25, 50];

export default function TrustScreen() {
  const { profile } = useApp();
  const verified = profile?.verifiedReferrals ?? 0;
  const badge = referralBadge(verified);
  const next = milestones.find((item) => item > verified);
  return (
    <Screen header={<BrandHeader compact title="Recommendation trust" />}>
      <Text style={styles.title}>Trust from useful help</Text>
      <Text style={styles.subtitle}>Provider quality ratings and recommender trust are separate. Payment can never buy either one.</Text>
      <Card style={styles.hero}><Text style={styles.alias}>{profile?.alias}</Text><Text style={styles.hf}>{profile?.hfId}</Text><View style={styles.metrics}><Metric value={profile?.trustRelationships ?? 0} label="unique helpful relationships" /><Metric value={verified} label="verified referrals" /></View>{badge ? <Text style={styles.badge}>★ {badge}</Text> : null}</Card>
      <Text style={styles.section}>How one relationship grows</Text>
      <Flow number="1" title="Helpful" text="A unique searcher says your experience helped. Repeated taps from the same person do not add stars." />
      <Flow number="2" title="Verified referral" text="After a real service is completed, the same relationship upgrades. It never counts twice." />
      <Flow number="3" title="Community reputation" text="Verified referrals unlock connector badges without changing any provider service rating." />
      {next ? <Card><Text style={styles.cardTitle}>Next milestone</Text><Text style={styles.progress}>{verified} of {next} verified referrals</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, (verified / next) * 100)}%` }]} /></View><Text style={styles.note}>{referralBadge(next)} at {next}</Text></Card> : null}
      <Card><Text style={styles.cardTitle}>Thank-you rule</Text><Text style={styles.body}>A Service Friend may voluntarily thank a proven referrer, but never in exchange for positive sentiment, a higher rating, or removing a review.</Text></Card>
    </Screen>
  );
}

function Metric({ value, label }: { value: number; label: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Flow({ number, title, text }: { number: string; title: string; text: string }) { return <View style={styles.flow}><View style={styles.number}><Text style={styles.numberText}>{number}</Text></View><View style={styles.flowText}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.body}>{text}</Text></View></View>; }

const styles = StyleSheet.create({
  title: { ...type.pageTitle, marginTop: spacing.lg }, subtitle: { ...type.body, color: colors.gray, marginTop: spacing.sm }, hero: { backgroundColor: colors.navy, alignItems: 'center', paddingVertical: spacing.xl }, alias: { color: colors.white, fontWeight: '900', fontSize: 25 }, hf: { color: '#C9E7AA', marginTop: 3, fontWeight: '700' }, metrics: { flexDirection: 'row', marginTop: spacing.lg }, metric: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.md }, metricValue: { color: colors.white, fontSize: 32, fontWeight: '900' }, metricLabel: { color: '#DDE7F4', textAlign: 'center', fontSize: 11, lineHeight: 16 }, badge: { color: '#FFE0A3', backgroundColor: '#173B68', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 99, fontWeight: '800', marginTop: spacing.lg },
  section: { ...type.sectionTitle, marginTop: spacing.xl, marginBottom: spacing.sm }, flow: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.md }, number: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green }, numberText: { color: colors.white, fontWeight: '900' }, flowText: { flex: 1 }, cardTitle: type.cardTitle, body: { ...type.body, color: colors.gray, marginTop: 3 }, progress: { ...type.body, fontWeight: '800', marginTop: spacing.sm }, track: { height: 9, borderRadius: 5, backgroundColor: colors.grayLight, marginTop: spacing.sm, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.green }, note: { ...type.caption, marginTop: spacing.sm },
});
