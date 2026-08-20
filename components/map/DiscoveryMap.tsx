import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import type { SafeAnchor } from '@/types/domain';

/**
 * Platform-neutral fallback used by TypeScript and unsupported targets. Metro
 * selects DiscoveryMap.native.tsx for iOS/Android and DiscoveryMap.web.tsx for web.
 */
export function DiscoveryMap({ anchors }: { anchors: SafeAnchor[]; selectedId?: string; onSelect(id: string): void }) {
  return (
    <View style={styles.frame}>
      <Text style={styles.title}>Safe-anchor list mode</Text>
      <Text style={styles.text}>{anchors.length} public anchors available. Native iOS and Android builds use the configured MapLibre-compatible provider.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 190, borderRadius: radius.lg, backgroundColor: colors.blueSoft, marginVertical: spacing.sm, padding: spacing.lg, justifyContent: 'center' },
  title: { color: colors.navy, fontWeight: '900', fontSize: 18 },
  text: { color: colors.gray, lineHeight: 20, marginTop: spacing.sm },
});
