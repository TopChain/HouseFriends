// @ts-check
import {
  assertNoPrivateAddress,
  dedupeDiscoveryResults,
  transitionReferral,
  validateExperienceDraft,
  validateProviderCategories,
  validateServiceAreas,
} from './rules.mjs';

/** @typedef {'sharer'|'searcher'|'individual_provider'|'company_provider'|'admin'} Role */

export function createFlowState() {
  return { users: new Map(), experiences: new Map(), referrals: new Map(), reports: [], blocks: new Set(), audit: [], providers: new Map() };
}

/** @param {ReturnType<typeof createFlowState>} state @param {{id:string,role:Role,alias:string}} user */
export function addUser(state, user) {
  if (user.role === 'admin' && !user.id.startsWith('admin-')) throw new Error('Admin role requires controlled provisioning.');
  state.users.set(user.id, { ...user });
  return user;
}

/** @param {ReturnType<typeof createFlowState>} state @param {{id:string,ownerId:string,kind:'individual'|'company',categoryIds:string[],serviceAreaIds:string[]}} provider */
export function addProvider(state, provider) {
  const owner = state.users.get(provider.ownerId);
  if (!owner || !['individual_provider', 'company_provider'].includes(owner.role)) throw new Error('Provider owner role required.');
  if (provider.kind === 'individual' && owner.role !== 'individual_provider') throw new Error('Individual role mismatch.');
  if (provider.kind === 'company' && owner.role !== 'company_provider') throw new Error('Company role mismatch.');
  validateProviderCategories(provider.categoryIds);
  validateServiceAreas(provider.kind, provider.serviceAreaIds);
  const saved = { ...provider, members: new Map([[provider.ownerId, 'owner']]), responses: new Map() };
  state.providers.set(provider.id, saved);
  return saved;
}

/** @param {ReturnType<typeof createFlowState>} state @param {string} actorId @param {any} draft */
export function publishExperience(state, actorId, draft) {
  const actor = state.users.get(actorId);
  if (!actor || !['sharer', 'searcher'].includes(actor.role)) throw new Error('A community account is required to share an experience.');
  validateExperienceDraft(draft);
  assertNoPrivateAddress(draft);
  const id = `exp-${state.experiences.size + 1}`;
  const experience = { ...draft, id, sharerId: actorId, aliasSnapshot: actor.alias, status: 'published' };
  state.experiences.set(id, experience);
  return experience;
}

/** @param {ReturnType<typeof createFlowState>} state @param {string} searcherId @param {string} experienceId @param {'helpful'|'verified'} requested */
export function relateReferral(state, searcherId, experienceId, requested) {
  const user = state.users.get(searcherId);
  const experience = state.experiences.get(experienceId);
  if (!user || !experience) throw new Error('User and experience required.');
  if (experience.sharerId === searcherId) throw new Error('Self-attribution is not allowed.');
  const key = `${searcherId}:${experienceId}`;
  const previous = state.referrals.get(key);
  const status = transitionReferral(previous?.status ?? 'none', requested);
  const relationship = { key, searcherId, experienceId, recommenderId: experience.sharerId, providerId: experience.provider.id, status };
  state.referrals.set(key, relationship);
  return relationship;
}

/** @param {ReturnType<typeof createFlowState>} state @param {string} actorId @param {string} experienceId @param {string} response */
export function providerRespond(state, actorId, experienceId, response) {
  const experience = state.experiences.get(experienceId);
  const provider = experience && state.providers.get(experience.provider.id);
  if (!provider || !provider.members.has(actorId)) throw new Error('Provider membership required.');
  if (response.trim().length < 2 || response.length > 1000) throw new Error('Invalid provider response.');
  provider.responses.set(experienceId, response.trim());
  state.audit.push({ actorId, action: 'provider_response', experienceId });
  return response.trim();
}

/** @param {ReturnType<typeof createFlowState>} state @param {string} actorId @param {string} targetId @param {string} details */
export function reportContent(state, actorId, targetId, details) {
  if (!state.users.has(actorId)) throw new Error('Authentication required.');
  if (details.trim().length < 5) throw new Error('Report details required.');
  const report = { id: `report-${state.reports.length + 1}`, actorId, targetId, details, status: 'open' };
  state.reports.push(report);
  return report;
}

/** @param {ReturnType<typeof createFlowState>} state @param {string} blockerId @param {string} blockedId */
export function blockUser(state, blockerId, blockedId) {
  if (blockerId === blockedId) throw new Error('Cannot block yourself.');
  state.blocks.add(`${blockerId}:${blockedId}`);
}

/** @param {ReturnType<typeof createFlowState>} state @param {string} adminId @param {string} reportId @param {'actioned'|'dismissed'} decision */
export function moderateReport(state, adminId, reportId, decision) {
  const admin = state.users.get(adminId);
  if (admin?.role !== 'admin') throw new Error('Admin authorization required.');
  const report = state.reports.find((item) => item.id === reportId);
  if (!report) throw new Error('Report not found.');
  report.status = decision;
  state.audit.push({ actorId: adminId, action: `report_${decision}`, reportId });
  return report;
}

/** @param {Array<any>} cards */
export function discover(cards) {
  return dedupeDiscoveryResults(cards).filter((card) => card.publicationStatus !== 'removed');
}
