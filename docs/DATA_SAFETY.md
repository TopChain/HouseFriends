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
| Photos | Optional | Only after approval | Experience evidence | Deleted/retained per moderation/legal need |
| Provider public contact | Optional | Yes after provider approval | Contact provider | Provider control/versioning |
| Unapproved business card | Optional | No | Provider claim | Deleted/archived per claim process |
| Reports/blocks/appeals | Yes | No | Safety, moderation, fraud prevention | Retained as legally/security required |
| Device/session data | Yes | No | Authentication and security | Session revocation/account process |

No cross-app advertising tracking is implemented. Future HouseFriends Sponsored placement is first-party local promotion, remains disabled, and still requires an updated privacy/data-safety review before activation.
