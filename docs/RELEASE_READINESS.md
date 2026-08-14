# Release Readiness

## Code-complete gate

- [x] Expo/React Native cross-platform source
- [x] Approved CI tokens and Tool Circle assets
- [x] Google/Apple authentication flow and alias-only onboarding
- [x] Search/list/map adapter and safe-anchor flow
- [x] Five-question experience publishing and integer/currency model
- [x] Separate provider rating and recommender trust models
- [x] Helpful → Verified idempotent relationship
- [x] Individual/company provider model and RBAC contract
- [x] Reporting, blocking, moderation, appeal, and audit contract
- [x] In-app account deletion entry and privileged server flow
- [x] RLS on all exposed tables; private media/card buckets
- [x] Paid, regulated, and video release gates disabled by default
- [x] Unit, role, security-contract, and global-invariant tests
- [x] TypeScript, ESLint, Expo Doctor 20/20, rendered role smoke tests, and all-platform Metro export
- [x] Clean Android/iOS native prebuild probes with identifiers, permissions, and Apple sign-in entitlement

## External submission gate

These items require the owner’s accounts, legal decisions, or paid services and must be completed during the store-publishing procedure:

- [ ] Create a dedicated **HouseFriends** Supabase project; apply migration/functions; run security and performance advisors.
- [ ] Configure Apple and Google OAuth credentials and redirect URLs.
- [ ] Connect Apple token revocation to the deletion function and verify it with a production Apple test identity.
- [ ] Contract a production MapLibre-compatible tiles/geodata provider and set attribution/style URL.
- [ ] Connect server-side image re-encoding/moderation, or hide photo upload for version 1.0.
- [ ] Decide legal operating entity, privacy contact, support contact, mailing address, governing law, retention schedule, and minimum age.
- [ ] Publish final privacy policy, terms, and support pages at stable HTTPS URLs.
- [ ] Add a private web deletion-request channel to `docs/delete-account.html` for users who cannot access the app.
- [ ] Create App Store Connect and Google Play app records; reserve final bundle/package identifiers.
- [ ] Create/link the EAS project and add the App Store Connect app ID in the secure submission environment.
- [ ] Add Apple/Google signing credentials through secure account workflows—never Git.
- [ ] Complete App Privacy/Data Safety, content rating, export compliance, UGC moderation, and account-deletion questionnaires.
- [ ] Run the manual physical-device matrix and TestFlight/Play internal testing.
- [ ] Capture final screenshots for required device sizes and complete localized store listings.
- [ ] Obtain country-specific legal approval before activating regulated categories or paid promotion.

The app must not process real user data or be submitted as production-ready until every external gate relevant to the launch country is checked.
