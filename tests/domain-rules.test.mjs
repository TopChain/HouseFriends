import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVED_ANCHOR_CLASSES, aggregateUniqueCustomerRatings, assertNoPrivateAddress, averageRating, chooseSafeAnchors,
  containsLikelyPrivateAddress, createHfId, dedupeDiscoveryResults, eligibleSearchAreas, isValidHfId, mayActivateSponsoredPlacement,
  normalizeMoney, normalizeReportReason, referralBadge, regulatedCategoryState, transitionReferral, validateAlias,
  validateExperienceDraft, validateProviderCategories, validateServiceAreas, validateThankYouReward,
} from '../lib/domain/rules.mjs';

const rating = { quality: 5, value: 4, reliability: 5, communication: 4, recommend: 5 };
const anchor = { class: 'school', name: 'Community High School', serviceAreaId: 'area-1' };
const draft = { serviceMonth: '2026-07-01', comment: 'Careful work and clear communication.', serviceItem: 'Repaired a stair railing', rating, anchor, costMinor: 28500, currency: 'USD' };

test('alias is normalized without exposing contact information', () => {
  assert.equal(validateAlias('  Garden   Neighbor '), 'Garden Neighbor');
  assert.throws(() => validateAlias('me@example.com'));
  assert.throws(() => validateAlias('A'));
});
test('HF-ID is random-looking and non-identifying format', () => { const id = createHfId('a1b2-c3d4'); assert.equal(id, 'HF-A1B2C3D4'); assert.equal(isValidHfId(id), true); });
test('provider category selection is unique and capped at five', () => { assert.deepEqual(validateProviderCategories(['a','a','b']), ['a','b']); assert.throws(() => validateProviderCategories(['1','2','3','4','5','6'])); });
test('individual coverage is capped at 100', () => { assert.equal(validateServiceAreas('individual', Array.from({ length: 100 }, (_, i) => `${i}`)).length, 100); assert.throws(() => validateServiceAreas('individual', Array.from({ length: 101 }, (_, i) => `${i}`))); });
test('company coverage is capped at 1000', () => { assert.equal(validateServiceAreas('company', Array.from({ length: 1000 }, (_, i) => `${i}`)).length, 1000); assert.throws(() => validateServiceAreas('company', Array.from({ length: 1001 }, (_, i) => `${i}`))); });
test('safe anchors keep only approved classes and at most five', () => { const rows = [...APPROVED_ANCHOR_CLASSES, 'library'].map((className, i) => ({ id: `${i}`, class: className, distanceMeters: 100-i })); const chosen = chooseSafeAnchors(rows); assert.equal(chosen.length, 5); assert.ok(chosen.every((item) => APPROVED_ANCHOR_CLASSES.includes(item.class))); });
test('money uses integer minor units and ISO currency', () => { assert.deepEqual(normalizeMoney(12.345, 'USD'), { costMinor: 1235, currency: 'USD' }); assert.throws(() => normalizeMoney(-1, 'USD')); assert.throws(() => normalizeMoney(1, 'usd')); });
test('five-question average is correct', () => assert.equal(averageRating(rating), 4.6));
test('latest rating from each customer counts once', () => { const result = aggregateUniqueCustomerRatings([{ customerId:'a',updatedAt:'2026-01-01',rating:{...rating,quality:1}},{customerId:'a',updatedAt:'2026-02-01',rating},{customerId:'b',updatedAt:'2026-01-01',rating:{quality:5,value:5,reliability:5,communication:5,recommend:5}}]); assert.deepEqual(result,{average:4.8,customerCount:2}); });
test('experience stores month only and validates all fields', () => { assert.equal(validateExperienceDraft(draft), true); assert.throws(() => validateExperienceDraft({ ...draft, serviceMonth: '2026-07-18' })); });
test('private street addresses are rejected', () => { assert.equal(containsLikelyPrivateAddress('Meet near the community school'), false); assert.equal(containsLikelyPrivateAddress('Work was at 123 Main Street'), true); assert.throws(() => assertNoPrivateAddress({ comment: 'Work was at 123 Main Street', serviceItem: 'Repair' })); });
test('coordinates are rejected as likely private location', () => assert.equal(containsLikelyPrivateAddress('34.12345, -117.54321'), true));
test('helpful upgrades to verified without double status', () => { assert.equal(transitionReferral('none','helpful'),'helpful'); assert.equal(transitionReferral('helpful','verified'),'verified'); assert.equal(transitionReferral('verified','helpful'),'verified'); });
test('referral badge thresholds are exact', () => { assert.equal(referralBadge(4),null); assert.equal(referralBadge(5),'Connector'); assert.equal(referralBadge(10),'Trusted Connector'); assert.equal(referralBadge(25),'Community Connector'); assert.equal(referralBadge(50),'HouseFriends Champion'); });
test('organic and sponsored provider results deduplicate', () => { const rows=dedupeDiscoveryResults([{providerId:'p',placement:'organic',rating:4},{providerId:'p',placement:'sponsored',rating:4}]); assert.equal(rows.length,1); assert.equal(rows[0].placement,'sponsored'); });
test('sponsored placement requires every controlled gate', () => { assert.equal(mayActivateSponsoredPlacement({enabled:true,legalApproved:true,billingApproved:true}),true); assert.equal(mayActivateSponsoredPlacement({enabled:true,legalApproved:false,billingApproved:true}),false); });
test('regulated categories distinguish unavailable and unverified', () => { assert.equal(regulatedCategoryState({enabled:false,legalApproved:false,verificationAvailable:false}),'unavailable'); assert.equal(regulatedCategoryState({enabled:true,legalApproved:true,verificationAvailable:false}),'license_unverified'); assert.equal(regulatedCategoryState({enabled:true,legalApproved:true,verificationAvailable:true}),'verification_available'); });
test('border searches include unique adjacent areas', () => assert.deepEqual(eligibleSearchAreas({sourceAreaId:'a',adjacentAreaIds:['b','a','c']}),['a','b','c']));
test('provider thank-you cannot influence review sentiment', () => { assert.equal(validateThankYouReward({verifiedReferralRequired:true}),true); assert.throws(() => validateThankYouReward({verifiedReferralRequired:true,ratingMinimum:5})); assert.throws(() => validateThankYouReward({verifiedReferralRequired:true,reviewRemovalRequired:true})); });
test('unknown report reason normalizes safely', () => assert.equal(normalizeReportReason('invented'),'other'));
