# Store Privacy and Data Safety Draft

This is an engineering inventory, not the final App Store Connect privacy label or Google Play Data safety declaration. The operator must reconcile it with every production SDK, analytics provider, support system, and legal policy before submission.

| Data category | Collected | Public | Purpose | User deletion |
|---|---:|---:|---|---|
| Email/auth identifier | Yes | No | Authentication, security | Deleted/retained as legally required |
| OAuth human name | Provider may return it | No; not copied to public profile | Authentication only | Provider/account process |
| Alias + HF-ID | Yes | Yes | Community identity and trust | Alias removed/tombstoned as required |
| Exact source location | Ephemeral only | No | Suggest safe anchors | Not persisted |
| Safe public anchor/locality | Yes | Yes | Discovery and privacy-safe context | Post handling follows content rules |
| Service month/year | Yes | Yes | Experience context | Content/deletion process |
| Actual reported cost/currency | Yes | Yes | Price context | Content/deletion process |
| Five ratings/comment | Yes | Yes | Service trust | Content/deletion process |
| Photos | No in v1 production | No | Reserved for a future moderated media release | Not applicable in v1 |
| Provider public contact | Optional | Yes after provider approval | Contact provider | Provider control/versioning |
| Unapproved business card | Optional | No | Provider claim | Deleted/archived per claim process |
| Reports/blocks/appeals | Yes | No | Safety, moderation, fraud prevention | Retained as legally/security required |
| Device/session data | Yes | No | Authentication and security | Session revocation/account process |

Version 1.0 production does not enable user photo or video uploads. Photo code remains gated until private storage, server-side processing, and moderation are deployed and the store disclosures are reviewed again.

No cross-app advertising tracking is implemented. Future HouseFriends Sponsored placement is first-party local promotion, remains disabled, and still requires an updated privacy/data-safety review before activation.
