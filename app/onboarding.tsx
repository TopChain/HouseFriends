import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, type } from '@/constants/theme';
import { validateAlias } from '@/lib/domain/rules.mjs';
import { neon } from '@/lib/neon';
import { useApp } from '@/providers/AppProvider';
import type { AppRole } from '@/types/domain';

const options: { id: AppRole; title: string; description: string }[] = [
  { id: 'searcher', title: 'Find a Service Friend', description: 'Search real experiences and save trusted providers.' },
  { id: 'sharer', title: 'Share an Experience', description: 'Share a completed job and help neighbors.' },
  { id: 'individual_provider', title: 'Individual Service Friend', description: 'Publish an alias and optional trade name.' },
  { id: 'company_provider', title: 'Company Service Friend', description: 'Set up a company and branch team.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, setDemoRole, refreshProfile } = useApp();
  const [alias, setAlias] = useState('');
  const [role, setRole] = useState<AppRole>('searcher');
  const [businessName, setBusinessName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  async function continueOnboarding() {
    try {
      const cleanAlias = validateAlias(alias || (session ? '' : 'JamesRC'));
      if (!acceptedTerms) throw new Error('Accept the Terms and Community Rules before creating your profile.');
      setSaving(true);
      if (session) {
        const { error } = await neon.rpc('complete_onboarding', { p_alias: cleanAlias, p_role: role, p_terms_version: 'community-rules-v1' });
        if (error) throw error;
        if (role === 'individual_provider' || role === 'company_provider') {
          const publicName = role === 'company_provider' ? businessName.trim() : cleanAlias;
          if (publicName.length < 2) throw new Error('Enter the company or trade name.');
          const { error: providerError } = await neon.rpc('create_provider_profile', {
            p_kind: role === 'company_provider' ? 'company' : 'individual',
            p_public_name: publicName,
            p_trade_name: role === 'individual_provider' ? businessName.trim() || null : null,
          });
          if (providerError) throw providerError;
        }
        await refreshProfile();
      } else setDemoRole(role);
      router.replace('/(tabs)');
    } catch (error) { Alert.alert('Check your public profile', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  }
  return (
    <Screen header={<BrandHeader compact title="Create your public profile" />}>
      <PrivacyNotice text="Your public identity is an alias plus a random HF-ID. We never publish your OAuth name or email." />
      <Text style={styles.label}>Public alias</Text>
      <TextInput value={alias} onChangeText={setAlias} placeholder="Choose 2-40 characters" autoCapitalize="words" maxLength={40} style={styles.input} accessibilityLabel="Public alias" />
      <Text style={styles.section}>How will you start?</Text>
      {options.map((option) => <Pressable key={option.id} onPress={() => setRole(option.id)} style={[styles.option, role === option.id && styles.optionSelected]} accessibilityRole="radio" accessibilityState={{ checked: role === option.id }}>
        <View style={[styles.radio, role === option.id && styles.radioSelected]} />
        <View style={styles.flex}><Text style={styles.optionTitle}>{option.title}</Text><Text style={styles.description}>{option.description}</Text></View>
      </Pressable>)}
      {role === 'individual_provider' || role === 'company_provider' ? <><Text style={styles.label}>{role === 'company_provider' ? 'Public company name' : 'Optional public trade name'}</Text><TextInput value={businessName} onChangeText={setBusinessName} placeholder={role === 'company_provider' ? 'Required company or trade name' : 'Leave blank to use only your alias'} maxLength={100} style={styles.input} /></> : null}
      <Pressable onPress={() => setAcceptedTerms((current) => !current)} style={styles.consent} accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }}>
        <View style={[styles.checkbox, acceptedTerms && styles.checkboxSelected]}><Text style={styles.checkmark}>{acceptedTerms ? '✓' : ''}</Text></View>
        <Text style={styles.consentText}>I accept the Terms and Community Rules, including the prohibition on objectionable, abusive, fabricated, and privacy-invasive content. I understand that content may be reported, moderated, or removed.</Text>
      </Pressable>
      <View style={styles.links}><Pressable onPress={() => router.push('/legal/terms')}><Text style={styles.link}>Read Terms and Community Rules</Text></Pressable><Pressable onPress={() => router.push('/legal/privacy')}><Text style={styles.link}>Read Privacy Policy</Text></Pressable></View>
      <Button label="Create HouseFriends profile" onPress={() => void continueOnboarding()} loading={saving} disabled={!acceptedTerms} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...type.cardTitle, marginTop: spacing.lg }, input: { backgroundColor: colors.white, borderColor: colors.grayLight, borderWidth: 1, borderRadius: radius.md, minHeight: 52, paddingHorizontal: spacing.md, fontSize: 16, marginTop: spacing.sm },
  section: { ...type.sectionTitle, marginTop: spacing.xl, marginBottom: spacing.sm }, option: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.grayLight, marginVertical: 5 }, optionSelected: { borderColor: colors.green, backgroundColor: colors.successSoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.gray, marginTop: 2 }, radioSelected: { borderColor: colors.green, borderWidth: 6 }, flex: { flex: 1 }, optionTitle: { ...type.cardTitle }, description: { ...type.caption, marginTop: 3 }, button: { marginTop: spacing.xl },
  consent: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.grayLight }, checkbox: { width: 24, height: 24, borderRadius: 5, borderWidth: 2, borderColor: colors.gray, alignItems: 'center', justifyContent: 'center' }, checkboxSelected: { backgroundColor: colors.green, borderColor: colors.green }, checkmark: { color: colors.white, fontWeight: '900' }, consentText: { ...type.caption, flex: 1, lineHeight: 18 }, links: { gap: spacing.sm, marginTop: spacing.md }, link: { color: colors.blue, fontWeight: '800', minHeight: 30 },
});
