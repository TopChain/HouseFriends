# Release Readiness

## Code-complete gate

- [x] Expo/React Native cross-platform source
- [x] Approved CI tokens and Tool Circle assets
- [x] Neon Auth/Data API client migration and alias-only onboarding contract
- [x] Search/list/map adapter and safe-anchor flow
- [x] Five-question experience publishing and integer/currency model
- [x] Separate provider rating and recommender trust models
- [x] Helpful → Verified idempotent relationship
- [x] Individual/company provider model and RBAC contract
- [x] Reporting, blocking, moderation, appeal, and audit contract
- [x] In-app self-scoped account deletion request and privileged database flow
- [x] RLS on all exposed tables; private media/card data contract
- [x] Paid, regulated, and video release gates disabled by default
- [x] Unit, role, security-contract, and global-invariant tests
- [x] TypeScript, ESLint, Expo Doctor 20/20, rendered role smoke tests, and all-platform Metro export
- [x] Clean Android/iOS native prebuild probes with identifiers, permissions, and Apple sign-in entitlement

## External submission gate

These items require the owner’s accounts, legal decisions, or paid services and must be completed during the store-publishing procedure:

- [x] Create a dedicated **HouseFriends** Neon project and validate the migration on an isolated database branch with real Auth/Data API requests.
- [x] Apply the validated migration to the Neon `main` branch and verify its RLS contract with real authenticated and anonymous Data API requests.
- [ ] Deploy a production mobile auth path: self-hosted Better Auth with the Expo plugin or a mobile-ready external OIDC provider; configure Apple and Google credentials and redirect URLs. Managed Neon Auth alone is not currently the native Expo/Apple solution.
- [ ] Connect Apple token revocation to the deletion function and verify it with a production Apple test identity.
- [ ] Contract a production MapLibre-compatible tiles/geodata provider and set attribution/style URL.
- [ ] Deploy `EXPO_PUBLIC_MEDIA_API_URL`, private object storage, and server-side image re-encoding/moderation, or hide photo upload for version 1.0.
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
