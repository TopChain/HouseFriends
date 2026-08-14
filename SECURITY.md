# Security Policy

Do not report a vulnerability through a public issue if it includes personal data, authentication details, a private address, provider-claim evidence, or an exploit.

Before production launch, the operator must publish a private security-reporting email or intake form and a response policy. Until then, do not deploy this repository with real user data.

## Protected data

- Never commit Supabase secret/service-role keys, signing keys, OAuth secrets, service-account files, `.env`, or production map tokens.
- Public clients receive only a Supabase publishable key. Authorization is enforced by database RLS, not by key secrecy.
- Authorization does not use user-editable `user_metadata`.
- Exact residential coordinates are not persisted in the experience model.
- Pending media and customer-uploaded business cards are private.

## Supported branch

Security fixes apply to the latest release branch and `main` until a formal version-support policy is published.
