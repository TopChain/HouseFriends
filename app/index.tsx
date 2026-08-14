import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import { config } from '@/lib/config';
import { useApp } from '@/providers/AppProvider';

export default function Index() {
  const { loading, session, profile } = useApp();
  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.green} size="large" /></View>;
  if (config.mode === 'production' && !session) return <Redirect href="/sign-in" />;
  if (!profile?.alias) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream } });
