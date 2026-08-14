// @ts-check

export const PROVIDER_AREA_CAPS = Object.freeze({ individual: 100, company: 1000 });
export const MAX_PROVIDER_CATEGORIES = 5;
export const MAX_SAFE_ANCHORS = 5;
export const RATING_KEYS = Object.freeze(['quality', 'value', 'reliability', 'communication', 'recommend']);
export const APPROVED_ANCHOR_CLASSES = Object.freeze([
  'school',
  'police_station',
  'fire_station',
  'hospital_urgent_care',
  'place_of_worship',
]);

/** @param {unknown} value @param {string} message */
function invariant(value, message) {
  if (!value) throw new Error(message);
}

/** @param {string} alias */
export function validateAlias(alias) {
  const normalized = alias.trim().replace(/\s+/g, ' ');
  invariant(normalized.length >= 2 && normalized.length <= 40, 'Alias must contain 2 to 40 characters.');
  invariant(!/[\r\n\t]/u.test(normalized), 'Alias contains unsupported whitespace.');
  invariant(!/@|https?:\/\//iu.test(normalized), 'Alias cannot contain contact details.');
  return normalized;
}

/** @param {string} hfId */
export function isValidHfId(hfId) {
  return /^HF-[A-Z0-9]{8}$/u.test(hfId);
}

/** @param {string} source */
export function createHfId(source) {
  const compact = source.toUpperCase().replace(/[^A-Z0-9]/gu, '').padEnd(8, '0').slice(0, 8);
  return `HF-${compact}`;
}

/** @param {string[]} categoryIds */
export function validateProviderCategories(categoryIds) {
  const unique = [...new Set(categoryIds)];
  invariant(unique.length > 0, 'Select at least one service category.');
  invariant(unique.length <= MAX_PROVIDER_CATEGORIES, 'A provider can select at most five categories.');
  return unique;
}

/** @param {'individual'|'company'} kind @param {string[]} serviceAreaIds */
export function validateServiceAreas(kind, serviceAreaIds) {
  const unique = [...new Set(serviceAreaIds)];
  invariant(unique.length <= PROVIDER_AREA_CAPS[kind], `${kind} provider service-area cap exceeded.`);
  return unique;
}

/** @param {Array<{id:string,class:string,distanceMeters:number}>} anchors */
export function chooseSafeAnchors(anchors) {
  return anchors
    .filter((anchor) => APPROVED_ANCHOR_CLASSES.includes(anchor.class))
    .sort((a, b) => a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id))
    .slice(0, MAX_SAFE_ANCHORS);
}

/** @param {{class:string,name?:string,serviceAreaId?:string}} anchor */
export function validateSafeAnchor(anchor) {
  invariant(APPROVED_ANCHOR_CLASSES.includes(anchor.class), 'Only approved public anchor classes may be published.');
  invariant(Boolean(anchor.serviceAreaId), 'A safe anchor must resolve to a HouseFriends service area.');
  invariant(!/\b(home|house|residence|my address|住家|住宅)\b/iu.test(anchor.name ?? ''), 'Anchor copy cannot describe a residence.');
  return true;
}

/** @param {number} amount @param {string} currency */
export function normalizeMoney(amount, currency) {
  invariant(Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000, 'Cost is outside the supported range.');
  invariant(/^[A-Z]{3}$/u.test(currency), 'Currency must be an ISO 4217 code.');
  return { costMinor: Math.round(amount * 100), currency };
}

/** @param {Record<string,number>} rating */
export function validateRating(rating) {
  for (const key of RATING_KEYS) {
    const value = Number(rating[key]);
    invariant(Number.isInteger(value) && value >= 1 && value <= 5, `${key} must be an integer from 1 to 5.`);
  }
  return true;
}

/** @param {Record<string,number>} rating */
export function averageRating(rating) {
  validateRating(rating);
  return RATING_KEYS.reduce((sum, key) => sum + Number(rating[key]), 0) / RATING_KEYS.length;
}

/**
 * Latest contribution from each customer counts once.
 * @param {Array<{customerId:string,updatedAt:string,rating:Record<string,number>}>} rows
 */
export function aggregateUniqueCustomerRatings(rows) {
  const latest = new Map();
  for (const row of rows) {
    validateRating(row.rating);
    const previous = latest.get(row.customerId);
    if (!previous || Date.parse(row.updatedAt) > Date.parse(previous.updatedAt)) latest.set(row.customerId, row);
  }
  if (latest.size === 0) return { average: 0, customerCount: 0 };
  const total = [...latest.values()].reduce((sum, row) => sum + averageRating(row.rating), 0);
  return { average: Number((total / latest.size).toFixed(2)), customerCount: latest.size };
}

/** @param {{serviceMonth:string,comment:string,serviceItem:string,rating:Record<string,number>,anchor:object,costMinor:number,currency:string}} draft */
export function validateExperienceDraft(draft) {
  invariant(/^\d{4}-(0[1-9]|1[0-2])-01$/u.test(draft.serviceMonth), 'Only service month and year may be stored.');
  invariant(draft.serviceItem.trim().length >= 3 && draft.serviceItem.trim().length <= 120, 'Service item must contain 3 to 120 characters.');
  invariant(draft.comment.trim().length >= 10 && draft.comment.trim().length <= 2000, 'Comment must contain 10 to 2,000 characters.');
  invariant(Number.isSafeInteger(draft.costMinor) && draft.costMinor >= 0, 'Cost must use non-negative integer minor units.');
  invariant(/^[A-Z]{3}$/u.test(draft.currency), 'Currency must be an ISO 4217 code.');
  validateRating(draft.rating);
  validateSafeAnchor(/** @type {any} */ (draft.anchor));
  return true;
}

/** @param {'none'|'helpful'|'verified'} current @param {'helpful'|'verified'} requested */
export function transitionReferral(current, requested) {
  if (current === 'verified') return 'verified';
  if (requested === 'verified') return 'verified';
  return 'helpful';
}

/** @param {number} verifiedCount */
export function referralBadge(verifiedCount) {
  invariant(Number.isInteger(verifiedCount) && verifiedCount >= 0, 'Verified referral count must be non-negative.');
  if (verifiedCount >= 50) return 'HouseFriends Champion';
  if (verifiedCount >= 25) return 'Community Connector';
  if (verifiedCount >= 10) return 'Trusted Connector';
  if (verifiedCount >= 5) return 'Connector';
  return null;
}

/**
 * Organic and sponsored discovery states merge into a single provider/branch card.
 * @param {Array<{providerId:string,branchId?:string,placement:'organic'|'sponsored',rating?:number,[key:string]:any}>} results
 */
export function dedupeDiscoveryResults(results) {
  const cards = new Map();
  for (const result of results) {
    const key = `${result.providerId}:${result.branchId ?? 'main'}`;
    const existing = cards.get(key);
    if (!existing) cards.set(key, { ...result });
    else cards.set(key, { ...existing, ...result, placement: existing.placement === 'sponsored' || result.placement === 'sponsored' ? 'sponsored' : 'organic' });
  }
  return [...cards.values()].sort((a, b) => {
    const sponsored = Number(b.placement === 'sponsored') - Number(a.placement === 'sponsored');
    return sponsored || (b.rating ?? 0) - (a.rating ?? 0);
  });
}

/** @param {{enabled:boolean,legalApproved:boolean,billingApproved:boolean}} gate */
export function mayActivateSponsoredPlacement(gate) {
  return gate.enabled && gate.legalApproved && gate.billingApproved;
}

/** @param {{enabled:boolean,legalApproved:boolean,verificationAvailable:boolean}} gate */
export function regulatedCategoryState(gate) {
  if (!gate.enabled || !gate.legalApproved) return 'unavailable';
  return gate.verificationAvailable ? 'verification_available' : 'license_unverified';
}

/** @param {{sourceAreaId:string,adjacentAreaIds?:string[]}} resolution */
export function eligibleSearchAreas(resolution) {
  return [...new Set([resolution.sourceAreaId, ...(resolution.adjacentAreaIds ?? [])])];
}

/** @param {string} input */
export function containsLikelyPrivateAddress(input) {
  const street = /\b\d{1,6}\s+[\p{L}.'-]+(?:\s+[\p{L}.'-]+){0,4}\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|boulevard|blvd|way)\b/iu;
  const coordinates = /-?\d{1,3}\.\d{4,}\s*[,/]\s*-?\d{1,3}\.\d{4,}/u;
  return street.test(input) || coordinates.test(input);
}

/** @param {{comment:string,serviceItem:string}} content */
export function assertNoPrivateAddress(content) {
  invariant(!containsLikelyPrivateAddress(content.comment), 'Remove the private street address from the comment.');
  invariant(!containsLikelyPrivateAddress(content.serviceItem), 'Remove the private street address from the service description.');
  return true;
}

/** @param {{sentimentRequired?:boolean,ratingMinimum?:number,reviewRemovalRequired?:boolean,verifiedReferralRequired?:boolean}} reward */
export function validateThankYouReward(reward) {
  invariant(!reward.sentimentRequired, 'Rewards cannot require positive sentiment.');
  invariant(reward.ratingMinimum == null, 'Rewards cannot require a minimum rating.');
  invariant(!reward.reviewRemovalRequired, 'Rewards cannot require review removal.');
  invariant(reward.verifiedReferralRequired === true, 'Thank-you rewards must be tied only to a verified referral contribution.');
  return true;
}

/** @param {string} reason */
export function normalizeReportReason(reason) {
  const allowed = new Set(['privacy', 'fraud', 'abuse', 'conflict', 'other']);
  return allowed.has(reason) ? reason : 'other';
}
