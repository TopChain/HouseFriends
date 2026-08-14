import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors, spacing, type } from '@/constants/theme';
import { signInWithProvider } from '@/lib/auth';

export default function SignInScreen() {
  const router = useRouter();
  const [provider, setProvider] = useState<'apple' | 'google' | null>(null);
  async function signIn(next: 'apple' | 'google') {
    try {
      setProvider(next);
      await signInWithProvider(next);
      router.replace('/');
    } catch (error) {
      Alert.alert('Unable to sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally { setProvider(null); }
  }
  return (
    <Screen contentStyle={styles.content}>
      <Image source={require('@/assets/brand-lockup.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="HouseFriends" />
      <Text style={styles.promise}>Trusted People. Better Homes.</Text>
      <Text style={styles.intro}>Real completed home-service experiences, real reported prices, and privacy-first local trust.</Text>
      <View style={styles.buttons}>
        <Button label="Continue with Apple" onPress={() => void signIn('apple')} loading={provider === 'apple'} disabled={provider !== null} />
        <Button label="Continue with Google" tone="secondary" onPress={() => void signIn('google')} loading={provider === 'google'} disabled={provider !== null} />
      </View>
      <Text style={styles.privacy}>Your Google or Apple name is never used as your public identity. You will choose a HouseFriends alias next.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }, logo: { width: '100%', height: 120 }, promise: { ...type.pageTitle, textAlign: 'center', marginTop: spacing.lg },
  intro: { ...type.body, textAlign: 'center', color: colors.gray, marginTop: spacing.md }, buttons: { gap: spacing.md, marginTop: spacing.xl }, privacy: { ...type.caption, textAlign: 'center', marginTop: spacing.lg },
});
