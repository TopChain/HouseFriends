import type { SafeAnchor } from '@/types/domain';

export interface MapProviderAdapter {
  id: string;
  ready: boolean;
  attribution: string;
  styleUrl?: string;
  toMarker(anchor: SafeAnchor): { id: string; coordinate: [number, number]; label: string };
}
