import { demoAnchors, demoExperiences, demoProfiles, demoProviders } from '@/data/demo';
import { dedupeDiscoveryResults, normalizeReportReason, transitionReferral, validateExperienceDraft } from '@/lib/domain/rules.mjs';
import type { Experience, Provider, TrustRelationship } from '@/types/domain';
import type { HouseFriendsRepository } from './types';

const experiences = [...demoExperiences];
const saved = new Map<string, Set<string>>();
const relationships = new Map<string, TrustRelationship>();

function includesQuery(value: string, query?: string): boolean {
  return !query || value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

export const demoRepository: HouseFriendsRepository = {
  async listAnchors() { return demoAnchors; },
  async searchExperiences(filters) {
    return experiences.filter((item) =>
      (!filters.anchorId || item.anchor.id === filters.anchorId) &&
      (!filters.serviceAreaId || item.anchor.serviceAreaId === filters.serviceAreaId) &&
      (!filters.categoryId || item.categoryId === filters.categoryId) &&
      (includesQuery(item.serviceItem, filters.query) || includesQuery(item.provider.publicName, filters.query))
    );
  },
  async listProviders(filters) {
    const filtered = demoProviders.filter((item) =>
      (!filters.serviceAreaId || item.serviceAreaIds.includes(filters.serviceAreaId)) &&
      (!filters.categoryId || item.categoryIds.includes(filters.categoryId)) &&
      (includesQuery(item.publicName, filters.query) || item.categoryIds.some((category) => includesQuery(category, filters.query)))
    );
    return dedupeDiscoveryResults(filtered.map((provider) => ({ ...provider, providerId: provider.id }))) as Provider[];
  },
  async getExperience(id) { return experiences.find((item) => item.id === id) ?? null; },
  async getProvider(id) { return demoProviders.find((item) => item.id === id) ?? null; },
  async publishExperience(draft) {
    validateExperienceDraft({ ...draft, anchor: draft.anchor });
    const item: Experience = {
      ...draft, id: `experience-${experiences.length + 1}`, sharer: demoProfiles.sharer!, helpfulCount: 0, verifiedReferralCount: 0,
    };
    experiences.unshift(item);
    return item;
  },
  async saveExperience(userId, experienceId) {
    const list = saved.get(userId) ?? new Set<string>();
    list.add(experienceId);
    saved.set(userId, list);
  },
  async listSaved(userId) {
    const ids = saved.get(userId) ?? new Set(['experience-1']);
    return experiences.filter((item) => ids.has(item.id));
  },
  async markHelpful(userId, experienceId) {
    const experience = experiences.find((item) => item.id === experienceId);
    if (!experience) throw new Error('Experience not found.');
    if (experience.sharer.id === userId) throw new Error('A recommender cannot mark their own experience helpful.');
    const key = `${userId}:${experienceId}`;
    const previous = relationships.get(key);
    const relationship: TrustRelationship = previous ?? {
      id: `trust-${relationships.size + 1}`, experienceId, searcherId: userId, recommenderId: experience.sharer.id,
      providerId: experience.provider.id, status: 'helpful',
    };
    relationship.status = transitionReferral(previous?.status ?? 'none', 'helpful');
    relationships.set(key, relationship);
    return relationship;
  },
  async confirmReferral(userId, experienceId) {
    const relationship = await this.markHelpful(userId, experienceId);
    relationship.status = transitionReferral(relationship.status, 'verified');
    relationship.confirmedAt = new Date().toISOString();
    relationships.set(`${userId}:${experienceId}`, relationship);
    return relationship;
  },
  async reportContent(_userId, _targetType, _targetId, reason, details) {
    normalizeReportReason(reason);
    if (details.trim().length < 5) throw new Error('Please add a short explanation.');
  },
  async blockUser(userId, blockedUserId) {
    if (userId === blockedUserId) throw new Error('You cannot block your own account.');
  },
};
