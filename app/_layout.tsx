import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/providers/AppProvider';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="experience/[id]" />
        <Stack.Screen name="provider/[id]" />
        <Stack.Screen name="provider-dashboard" />
        <Stack.Screen name="company-dashboard" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="report" options={{ presentation: 'modal' }} />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/terms" />
      </Stack>
    </AppProvider>
  );
}
