# HouseFriends Architecture

```mermaid
flowchart TD
  A[Google or Apple sign-in] --> B[Private auth account]
  B --> C[Alias + random HF-ID]
  C --> D[Expo iOS / Android client]
  D --> E[Supabase RLS Data API]
  D --> F[MapProviderAdapter]
  F --> G[Licensed MapLibre-compatible provider]
  E --> H[Safe anchors + service areas]
  E --> I[Experiences + five ratings]
  E --> J[Referral trust graph]
  E --> K[Claims + moderation + audit]
```

## Geography

`Safe Public Anchor → normalized HouseFriends Service Area → eligible experiences and providers`

Safe anchors are user-facing public references. Service Areas are country-normalized administrative/local coverage units used by providers and, when legally activated, advertising. A provider does not select schools or fire stations to define coverage.

Provider selections store a chosen area plus `include_descendants`; they do not pre-expand every descendant into separate global rows. Border resolution can add adjacent eligible areas.

## Trust

- Provider ratings: latest current contribution from each unique customer, overall and per branch/category when sample size is sufficient.
- Recommender trust: one unique searcher/experience relationship.
- `helpful` upgrades to `verified`; the unique database key prevents double counting.
- Badge snapshots update after referral changes and can be recalculated after deletion or fraud reversal.

## Identity and authorization

- `auth.users` and private account data are not public.
- `public_profiles` contains alias + HF-ID only.
- Individual providers publish alias + HF-ID and optional voluntary trade name.
- Companies publish company/branch names; all human members remain aliases.
- Company RBAC: owner, admin, branch manager, analyst. Policies resolve membership server-side.
- Admin role cannot be self-assigned through onboarding.

## Media

The client re-encodes selected images to JPEG. Production uploads land in a private pending bucket under the authenticated user folder. No client can publish an approved path or set the server-side `metadata_stripped` state. The included moderation function fails closed and keeps files private until a production re-encoding/moderation worker is connected.

## Controlled release gates

- Sponsored campaigns require `enabled`, `legal_approved`, and `billing_approved` in the country gate.
- Regulated categories require country/region legal approval and never imply license verification without a configured authority source.
- Video media is disabled.
