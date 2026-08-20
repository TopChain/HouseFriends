import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, type } from '@/constants/theme';
import { config } from '@/lib/config';
import { neon } from '@/lib/neon';
import { useApp } from '@/providers/AppProvider';
import type { AppRole } from '@/types/domain';

const roles: { id: AppRole; label: string }[] = [
  { id: 'searcher', label: 'Service Searcher' }, { id: 'sharer', label: 'Experience Sharer' },
  { id: 'individual_provider', label: 'Individual Service Friend' }, { id: 'company_provider', label: 'Company Service Friend' }, { id: 'admin', label: 'HouseFriends Admin' },
];

export default function AccountScreen() {
  const router = useRouter();
  const { profile, role, language, setLanguage, setDemoRole, signOut } = useApp();
  async function deleteAccount() {
    if (config.mode !== 'production') {
      Alert.alert('Demo deletion flow verified', 'Production sends this request to the authenticated deletion function. Demo data has been reset locally.');
      await signOut();
      return;
    }
    Alert.alert('Delete HouseFriends account?', 'This starts permanent deletion, recalculates reputation, and cannot be undone after the recovery window.', [
      { text: 'Cancel', style: 'cancel' }, { text: 'Delete account', style: 'destructive', onPress: async () => {
        const { error } = await neon.rpc('request_account_deletion');
        if (error) Alert.alert('Deletion could not start', error.message); else { await signOut(); router.replace('/sign-in'); }
      } },
    ]);
  }
  return (
    <Screen header={<BrandHeader compact title="Account" />}>
      <Card style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{profile?.alias.slice(0, 1).toUpperCase()}</Text></View><View style={styles.flex}><Text style={styles.alias}>{profile?.alias}</Text><Text style={styles.hf}>{profile?.hfId}</Text><Text style={styles.private}>Signed-in name and email remain private</Text></View></Card>
      {config.enableDemoMode ? <><Text style={styles.section}>Role test console</Text><Text style={styles.help}>Release QA can switch among every role without changing the public-identity rules.</Text><View style={styles.roles}>{roles.map((item) => <Pressable key={item.id} onPress={() => setDemoRole(item.id)} style={[styles.role, role === item.id && styles.roleSelected]}><Text style={[styles.roleText, role === item.id && styles.roleTextSelected]}>{item.label}</Text></Pressable>)}</View></> : null}
      {(role === 'individual_provider') ? <Menu label="Open Service Friend dashboard" detail="Coverage, categories, claims, experiences" onPress={() => router.push('/provider-dashboard')} /> : null}
      {(role === 'company_provider') ? <Menu label="Open company dashboard" detail="Branches, members, area coverage, audit trail" onPress={() => router.push('/company-dashboard')} /> : null}
      {role === 'admin' ? <Menu label="Open moderation console" detail="Reports, claims, appeals, taxonomy, country gates" onPress={() => router.push('/admin')} /> : null}
      <Text style={styles.section}>Preferences</Text>
      <View style={styles.setting}><View style={styles.flex}><Text style={styles.settingTitle}>Traditional Chinese</Text><Text style={styles.help}>Change the interface language</Text></View><Switch value={language === 'zh-Hant'} onValueChange={(value) => setLanguage(value ? 'zh-Hant' : 'en')} trackColor={{ true: colors.green }} /></View>
      <Menu label="Privacy Policy" detail="Privacy-first public identity and location rules" onPress={() => router.push('/legal/privacy')} />
      <Menu label="Terms and Community Rules" detail="UGC, moderation, appeals, and provider responsibilities" onPress={() => router.push('/legal/terms')} />
      <Menu label="Support" detail="Open the HouseFriends support page" onPress={() => { void Linking.openURL(config.supportUrl); }} />
      {config.accountDeletionUrl ? <Menu label="Account deletion help" detail="Deletion steps for users who cannot access the app" onPress={() => { void Linking.openURL(config.accountDeletionUrl); }} /> : null}
      <Text style={styles.section}>Account controls</Text>
      <Button label="Sign out" tone="secondary" onPress={() => void signOut()} />
      <Button label="Delete account" tone="danger" onPress={() => void deleteAccount()} style={styles.delete} />
      <Text style={styles.deleteNote}>Deleting an account removes account-associated data as required and recalculates ratings and referral aggregates. A provider entity may remain unclaimed when other people shared genuine experiences about it.</Text>
    </Screen>
  );
}

function Menu({ label, detail, onPress }: { label: string; detail: string; onPress(): void }) { return <Pressable onPress={onPress} style={styles.menu} accessibilityRole="button"><View style={styles.flex}><Text style={styles.settingTitle}>{label}</Text><Text style={styles.help}>{detail}</Text></View><Text style={styles.chevron}>›</Text></Pressable>; }

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }, avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.white, fontSize: 25, fontWeight: '900' }, flex: { flex: 1 }, alias: { ...type.sectionTitle }, hf: { color: colors.greenDark, fontWeight: '800', marginTop: 2 }, private: { ...type.caption, marginTop: 3 },
  section: { ...type.sectionTitle, marginTop: spacing.xl, marginBottom: spacing.sm }, help: type.caption, roles: { gap: 6, marginTop: spacing.sm }, role: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.grayLight, minHeight: 44, paddingHorizontal: spacing.md, justifyContent: 'center' }, roleSelected: { backgroundColor: colors.navy, borderColor: colors.navy }, roleText: { color: colors.ink, fontWeight: '700' }, roleTextSelected: { color: colors.white },
  setting: { flexDirection: 'row', alignItems: 'center', minHeight: 64, backgroundColor: colors.white, paddingHorizontal: spacing.md, borderRadius: radius.md, marginVertical: 4 }, settingTitle: { ...type.cardTitle, fontSize: 15 }, menu: { flexDirection: 'row', alignItems: 'center', minHeight: 66, backgroundColor: colors.white, paddingHorizontal: spacing.md, borderRadius: radius.md, marginVertical: 4 }, chevron: { color: colors.blue, fontSize: 28 }, delete: { marginTop: spacing.sm }, deleteNote: { ...type.caption, marginTop: spacing.sm },
});
