import type { Experience, Provider, PublicProfile, SafeAnchor } from '@/types/domain';

export const demoProfiles: Record<string, PublicProfile> = {
  sharer: { id: 'user-sharer', alias: 'GardenNeighbor', hfId: 'HF-A1B2C3D4', trustRelationships: 18, verifiedReferrals: 11 },
  searcher: { id: 'user-searcher', alias: 'JamesRC', hfId: 'HF-JA9M2E5S', trustRelationships: 3, verifiedReferrals: 1 },
  provider: { id: 'user-provider', alias: 'AlexFixes', hfId: 'HF-PR0V1D3R', trustRelationships: 7, verifiedReferrals: 4 },
  company: { id: 'user-company', alias: 'MiaManager', hfId: 'HF-C0MP4NY1', trustRelationships: 2, verifiedReferrals: 0 },
  admin: { id: 'user-admin', alias: 'HFModerator', hfId: 'HF-4DM1N000', trustRelationships: 0, verifiedReferrals: 0 },
};

export const demoAnchors: SafeAnchor[] = [
  { id: 'anchor-school', name: 'Community High School', class: 'school', locality: 'Rancho Cucamonga, CA', serviceAreaId: 'area-91739', latitude: 34.1377, longitude: -117.5587 },
  { id: 'anchor-police', name: 'Rancho Cucamonga Police Station', class: 'police_station', locality: 'Rancho Cucamonga, CA', serviceAreaId: 'area-91730', latitude: 34.1064, longitude: -117.5931 },
  { id: 'anchor-fire', name: 'Community Fire Station', class: 'fire_station', locality: 'Rancho Cucamonga, CA', serviceAreaId: 'area-91739', latitude: 34.1232, longitude: -117.5438 },
  { id: 'anchor-hospital', name: 'Regional Hospital', class: 'hospital_urgent_care', locality: 'Upland, CA', serviceAreaId: 'area-upland', latitude: 34.1024, longitude: -117.6362 },
  { id: 'anchor-worship', name: 'Community Worship Center', class: 'place_of_worship', locality: 'Rancho Cucamonga, CA', serviceAreaId: 'area-91739', latitude: 34.131, longitude: -117.577 },
];

export const demoProviders: Provider[] = [
  {
    id: 'provider-alex', kind: 'individual', publicName: 'AlexFixes', alias: 'AlexFixes', hfId: 'HF-PR0V1D3R', branchId: 'branch-alex',
    tradeName: 'Alex Home Repair', categoryIds: ['handyman', 'carpenter', 'drywall'], serviceAreaIds: ['area-91739', 'area-91730'],
    listingSource: 'community_shared', placement: 'organic', rating: 4.8, ratingCount: 24, verified: true, phone: '(909) 555-0142',
  },
  {
    id: 'provider-bluewater', kind: 'company', publicName: 'BlueWater Plumbing', branchId: 'branch-bluewater-ie', branchName: 'Inland Empire Branch',
    categoryIds: ['plumber', 'drain-sewer'], serviceAreaIds: ['area-91739', 'area-91730', 'area-upland'],
    listingSource: 'provider_self_listed', placement: 'sponsored', rating: 4.6, ratingCount: 41, verified: true,
    licenseLabel: 'License information submitted; verify with the local authority', phone: '(909) 555-0199',
  },
  {
    id: 'provider-greenleaf', kind: 'individual', publicName: 'GreenLeaf Sam', alias: 'GreenLeaf Sam', hfId: 'HF-GR33NL34', branchId: 'branch-greenleaf',
    categoryIds: ['landscaping', 'irrigation', 'tree-service'], serviceAreaIds: ['area-91739'],
    listingSource: 'provider_self_listed', placement: 'organic', rating: 4.9, ratingCount: 13, verified: false, phone: '(909) 555-0127',
  },
];

const five = { quality: 5, value: 5, reliability: 5, communication: 5, recommend: 5 };

export const demoExperiences: Experience[] = [
  {
    id: 'experience-1', sharer: demoProfiles.sharer!, provider: demoProviders[0]!, categoryId: 'handyman',
    serviceItem: 'Repaired a loose stair railing and patched drywall', serviceMonth: '2026-07-01', costMinor: 28500, currency: 'USD',
    includesMaterialsTax: true, rating: five, comment: 'Clear estimate, careful work, and everything was cleaned before the job was finished.',
    anchor: demoAnchors[0]!, mediaUrls: [], helpfulCount: 14, verifiedReferralCount: 8,
    providerResponse: 'Thank you for sharing the completed work. I appreciate the recommendation.',
  },
  {
    id: 'experience-2', sharer: { ...demoProfiles.searcher!, alias: 'PoolSideNeighbor' }, provider: demoProviders[1]!, categoryId: 'plumber',
    serviceItem: 'Replaced a leaking outdoor shutoff valve', serviceMonth: '2026-06-01', costMinor: 42000, currency: 'USD',
    includesMaterialsTax: true, rating: { quality: 5, value: 4, reliability: 5, communication: 4, recommend: 5 },
    comment: 'The branch confirmed the arrival window and explained the replacement before starting.', anchor: demoAnchors[2]!, mediaUrls: [],
    helpfulCount: 9, verifiedReferralCount: 3,
  },
  {
    id: 'experience-3', sharer: { ...demoProfiles.sharer!, alias: 'CitrusGarden' }, provider: demoProviders[2]!, categoryId: 'irrigation',
    serviceItem: 'Diagnosed two broken sprinkler zones', serviceMonth: '2026-05-01', costMinor: 19500, currency: 'USD', includesMaterialsTax: false,
    rating: { quality: 5, value: 5, reliability: 4, communication: 5, recommend: 5 },
    comment: 'Found the wiring fault quickly and showed me how to adjust the watering schedule.', anchor: demoAnchors[4]!, mediaUrls: [],
    helpfulCount: 5, verifiedReferralCount: 2,
  },
];
