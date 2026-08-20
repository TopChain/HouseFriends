import { config } from '@/lib/config';
import type { SafeAnchor } from '@/types/domain';
import type { MapProviderAdapter } from './types';

export const mapLibreAdapter: MapProviderAdapter = {
  id: 'maplibre',
  ready: Boolean(config.mapStyleUrl),
  attribution: 'OpenFreeMap © OpenMapTiles · Data © OpenStreetMap contributors',
  styleUrl: config.mapStyleUrl || undefined,
  toMarker(anchor: SafeAnchor) {
    return { id: anchor.id, coordinate: [anchor.longitude, anchor.latitude], label: anchor.name };
  },
};
