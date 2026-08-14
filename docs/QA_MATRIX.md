# QA Matrix

## Automated coverage

| Area | Automated check |
|---|---|
| Alias/HF-ID privacy | format, length, contact-data rejection |
| Provider limits | 5 categories, 100 individual areas, 1,000 company areas |
| Safe anchors | approved classes only, maximum five, no residence class |
| Experience | month-only date, integer minor-unit cost, ISO currency, five ratings |
| Location privacy | street-address and coordinate detection; no address/coordinates in experience SQL table |
| Ratings | latest contribution per unique customer |
| Referral trust | idempotent Helpful and Helpful → Verified upgrade |
| Sponsored | provider/branch deduplication and three-part server gate |
| Rewards | no sentiment, rating, removal, or concealment condition |
| Roles | sharer/searcher/provider/company/admin boundaries |
| Rendered role screens | five React Native smoke screens for searcher, sharer, individual provider, company, and admin |
| UGC safety | reporting, blocking, admin-only moderation |
| Database | RLS on every exposed table, safe views, explicit privileged grants |
| Storage | owner-folder insert/select/update/delete rules |
| Deletion | service-role-only deletion RPC |
| Global model | 64,000 country/area configurations × 58 invariant checks |
| Bundling | production-style Metro exports for iOS, Android, and web |
| Native configuration | clean Android and iOS prebuild probes, including coarse location and Sign in with Apple entitlement |

## Manual device matrix before store submission

| Platform | Minimum run |
|---|---|
| iPhone | current iOS, one previous major iOS, small and large screens |
| iPad | portrait and landscape, current iPadOS |
| Android | current API target, one older supported API, phone and tablet/foldable layout |
| Network | normal, slow, offline/degraded map, API timeout |
| Accessibility | VoiceOver, TalkBack, dynamic type, contrast, 44pt touch targets |
| Locale | English, Traditional Chinese, long text, Unicode, RTL smoke test |

## Role acceptance flows

1. Sharer: sign in → alias → select/add Service Friend → 35-category taxonomy → actual cost → five ratings → comment → safe anchor → optional pending media → publish/report state.
2. Searcher: anchor → service area/adjacent area → discover → save → helpful → contact → confirm completed referral → block/report.
3. Individual provider: alias/HF-ID → optional trade name → ≤5 categories → ≤100 areas → claim/contact approval → respond/report.
4. Company provider: company/branch → claim authority → ≤1,000 areas → owner/admin/branch-manager/analyst permissions → audit trail.
5. Admin: privacy-first queue → claim/dispute → moderation → appeal → taxonomy → country/regulated/sponsored gates.
