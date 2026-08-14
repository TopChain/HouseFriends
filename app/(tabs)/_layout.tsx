import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/constants/theme';

const icons: Record<string, string> = { index: '⌕', saved: '♡', share: '+', trust: '★', account: '●' };

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.green,
      tabBarInactiveTintColor: colors.gray,
      tabBarStyle: { minHeight: 66, paddingTop: 7, paddingBottom: 7, borderTopColor: '#E8ECF1', backgroundColor: colors.white },
      tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      tabBarIcon: ({ color }) => <Text style={{ color, fontSize: route.name === 'share' ? 27 : 22, fontWeight: '900' }}>{icons[route.name] ?? '•'}</Text>,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Search' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="share" options={{ title: 'Share' }} />
      <Tabs.Screen name="trust" options={{ title: 'Trust' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
