# App Review Notes

## Demo access

Provide App Review with a dedicated, non-production review account before submission. Do not enable the internal role-switch console in a production build.

## User-generated content

- Filtering: address/coordinate detection, private pending media, risk-based moderation queue.
- Reporting: every experience and provider profile has a report entry.
- Blocking: provider/profile block action is available to signed-in users.
- Moderation: admin queue, action audit, appeals, and provider dispute path.
- Support: final public support URL/email must be supplied in store metadata.

## Sign in

Google sign-in is paired with Sign in with Apple on iOS. Neither provider’s human name or email becomes the HouseFriends public identity. The user chooses an alias.

## Account deletion

Account → Account controls → Delete account starts permanent deletion. The server validates the current token, performs data/reputation cleanup, removes private pending media, and deletes the Auth user.

Before submission, Apple sign-in deletion must also revoke the Apple token, and the public account-deletion URL must contain the final private operator support channel.

## Location

Only coarse location permission is requested. The source point is used ephemerally to suggest safe public anchors and is not stored on an experience. Reviewers can use list mode without granting location.

## Maps

MapLibre is an implementation layer, not a data license. Production builds use a contracted style/tiles provider with on-map attribution. Search remains functional in list mode during map outage.

## Disabled features

Paid Sponsored placement, regulated-license verification claims, and video upload are disabled by server gates for version 1.0 unless separately approved before submission.
