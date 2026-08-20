# HouseFriends

**Trusted People. Better Homes.**

HouseFriends is a privacy-first community trust network for real completed home-service experiences. It is not a conventional contractor directory. Neighbors share who helped, what the work actually cost, and whether a recommendation led to another completed service—without publishing a private home address.

## Release architecture

- Expo 57, React Native, TypeScript, and Expo Router for one iOS/Android client.
- Neon Serverless Postgres, Neon Data API, Neon Auth, and Row Level Security.
- Google and Apple authentication; every human selects a public alias and receives a random HF-ID.
- MapLibre-compatible `MapProviderAdapter`; production requires a licensed map style/tiles provider.
- Safe Public Anchors and provider Service Areas are separate data concepts.
- English and Traditional Chinese-ready localization keys; Unicode/RTL-safe layout foundation.

## Product invariants

- No OAuth name, email, exact home address, or source GPS point is public.
- Only school, police station, fire station, hospital/urgent care, and place of worship anchors are publishable; the UI shows at most five.
- Providers have five service categories maximum; individuals have 100 area selections, company branches 1,000.
- Provider service ratings and recommender Trust relationships are separate.
- Helpful → Verified is one relationship upgrade, never two counts.
- Organic, provider self-listed, and Sponsored states are labeled; Sponsored never changes ratings or review visibility.
- Paid promotion and regulated-category verification remain controlled server-side gates.

## Local development

1. Install Node 24 and run `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Keep `EXPO_PUBLIC_APP_MODE=demo` for local role testing, or configure the dedicated Neon project endpoints and set production mode.
4. Run `npm run verify`; CI also verifies a production-style all-platform Metro export.
5. Run `npm start` with an Expo development client. MapLibre requires a development/native build rather than Expo Go.

Do not commit `.env`, Neon connection strings/passwords, signing keys, Apple keys, Google service-account JSON, object-storage credentials, or provider secrets.

## Demo role testing

Account → Role test console switches among:

- Experience Sharer
- Service Searcher
- Individual Service Friend
- Company Service Friend
- HouseFriends Admin

Demo mode is disabled in the production environment.

## Neon

The initial migration is in `neon/migrations`. It enables RLS on every exposed `public` table, uses Neon Auth UUIDs and Data API roles, keeps privileged helpers in a private schema, and exposes self-scoped RPC wrappers through a caller-identity handoff protected by RLS.

A dedicated HouseFriends Neon project is provisioned. Develop schema changes on a Neon branch, run real Auth/Data API tests there, and only then apply the reviewed migration to `main`. Never reuse another app's production branch.

Neon Auth and the Neon Data API are currently beta. Managed Neon Auth does not yet provide the production Expo/React Native + Apple path HouseFriends needs, so native production authentication remains an explicit release gate; use a self-hosted Better Auth server with the Expo plugin or a mobile-ready external OIDC provider before store submission.

## Release

See [Release Readiness](docs/RELEASE_READINESS.md), [QA Matrix](docs/QA_MATRIX.md), and [Data Safety Draft](docs/DATA_SAFETY.md). Store signing, app records, legal-entity information, production URLs/keys, and country approvals are intentionally external release gates.

## Brand

HouseFriends uses the approved Tool Circle, House Navy `#08254B`, Friend Green `#63A52D`, Map Blue `#1468C8`, Warm Orange `#F39A16`, Soft Cream `#FBFAF6`, and UI Gray `#697386`. Always spell the name `HouseFriends`.
