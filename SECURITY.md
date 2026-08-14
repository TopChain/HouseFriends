# Security Policy

Do not report a vulnerability through a public issue if it includes personal data, authentication details, a private address, provider-claim evidence, or an exploit.

Before production launch, the operator must publish a private security-reporting email or intake form and a response policy. Until then, do not deploy this repository with real user data.

## Protected data

- Never commit Neon connection strings/passwords, signing keys, OAuth secrets, object-storage credentials, service-account files, `.env`, or production map tokens.
- Public clients receive only Neon Auth and Data API endpoint URLs. Authorization is enforced by JWT validation and database RLS, not by endpoint secrecy.
- Authorization does not use user-editable `user_metadata`.
- Exact residential coordinates are not persisted in the experience model.
- Pending media and customer-uploaded business cards are private.

## Supported branch

Security fixes apply to the latest release branch and `main` until a formal version-support policy is published.
