import type { AnchorClass } from '@/constants/anchors';

export type AppRole = 'sharer' | 'searcher' | 'individual_provider' | 'company_provider' | 'admin';
export type ProviderKind = 'individual' | 'company';
export type ListingSource = 'community_shared' | 'provider_self_listed';
export type Placement = 'organic' | 'sponsored';
export type ReferralStatus = 'helpful' | 'verified';

export type PublicProfile = {
  id: string;
  alias: string;
  hfId: string;
  trustRelationships: number;
  verifiedReferrals: number;
};

export type SafeAnchor = {
  id: string;
  name: string;
  class: AnchorClass;
  locality: string;
  serviceAreaId: string;
  latitude: number;
  longitude: number;
};

export type Rating = {
  quality: number;
  value: number;
  reliability: number;
  communication: number;
  recommend: number;
};

export type Provider = {
  id: string;
  kind: ProviderKind;
  publicName: string;
  alias?: string;
  hfId?: string;
  tradeName?: string;
  branchId?: string;
  branchName?: string;
  categoryIds: string[];
  serviceAreaIds: string[];
  listingSource: ListingSource;
  placement: Placement;
  rating: number;
  ratingCount: number;
  verified: boolean;
  licenseLabel?: string;
  phone?: string;
};

export type Experience = {
  id: string;
  sharer: PublicProfile;
  provider: Provider;
  categoryId: string;
  serviceItem: string;
  serviceMonth: string;
  costMinor: number;
  currency: string;
  includesMaterialsTax: boolean | null;
  rating: Rating;
  comment: string;
  anchor: SafeAnchor;
  mediaUrls: string[];
  helpfulCount: number;
  verifiedReferralCount: number;
  providerResponse?: string;
};

export type SearchFilters = {
  anchorId?: string;
  serviceAreaId?: string;
  categoryId?: string;
  query?: string;
};

export type DraftExperience = Omit<Experience, 'id' | 'sharer' | 'helpfulCount' | 'verifiedReferralCount'>;

export type TrustRelationship = {
  id: string;
  experienceId: string;
  searcherId: string;
  recommenderId: string;
  providerId: string;
  status: ReferralStatus;
  confirmedAt?: string;
};

export type ReportReason = 'privacy' | 'fraud' | 'abuse' | 'conflict' | 'other';
