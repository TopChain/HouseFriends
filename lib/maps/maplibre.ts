import { config } from '@/lib/config';
import type { SafeAnchor } from '@/types/domain';
import type { MapProviderAdapter } from './types';

export const mapLibreAdapter: MapProviderAdapter = {
  id: 'maplibre',
  ready: Boolean(config.mapStyleUrl),
  attribution: 'Map data and tiles: licensed provider attribution appears on the map.',
  styleUrl: config.mapStyleUrl || undefined,
  toMarker(anchor: SafeAnchor) {
    return { id: anchor.id, coordinate: [anchor.longitude, anchor.latitude], label: anchor.name };
  },
};
