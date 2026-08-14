import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { mapLibreAdapter } from '@/lib/maps/maplibre';
import type { SafeAnchor } from '@/types/domain';

export function DiscoveryMap({ anchors, selectedId, onSelect }: { anchors: SafeAnchor[]; selectedId?: string; onSelect(id: string): void }) {
  if (!mapLibreAdapter.ready || !mapLibreAdapter.styleUrl) return <MapFallback />;
  const selected = anchors.find((anchor) => anchor.id === selectedId) ?? anchors[0];
  return (
    <View style={styles.frame}>
      <Map style={styles.map} mapStyle={mapLibreAdapter.styleUrl} logo attribution>
        <Camera zoom={11} center={selected ? [selected.longitude, selected.latitude] : [-117.56, 34.13]} duration={350} />
        {anchors.map((anchor) => (
          <Marker key={anchor.id} id={anchor.id} lngLat={[anchor.longitude, anchor.latitude]} onPress={() => onSelect(anchor.id)}>
            <View style={[styles.marker, selectedId === anchor.id && styles.markerSelected]}><Text style={styles.markerText}>●</Text></View>
          </Marker>
        ))}
      </Map>
    </View>
  );
}

function MapFallback() {
  return <View style={[styles.frame, styles.fallback]}><Text style={styles.fallbackTitle}>List mode is active</Text><Text style={styles.fallbackText}>A licensed production tile style has not been configured. Search still uses HouseFriends service areas and safe anchors.</Text></View>;
}

const styles = StyleSheet.create({
  frame: { height: 230, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.blueSoft, marginVertical: spacing.sm }, map: { flex: 1 },
  marker: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.green, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }, markerSelected: { backgroundColor: colors.orange, transform: [{ scale: 1.18 }] }, markerText: { color: colors.white, fontSize: 9 },
  fallback: { justifyContent: 'center', padding: spacing.lg }, fallbackTitle: { color: colors.navy, fontWeight: '900', fontSize: 18 }, fallbackText: { color: colors.gray, marginTop: spacing.sm, lineHeight: 20 },
});
