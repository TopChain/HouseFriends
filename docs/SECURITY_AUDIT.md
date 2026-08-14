# Dependency Security Review

Review date: 2026-08-13

## Result

- The app has no directly reachable advisory in its shipped JavaScript bundles.
- The remaining npm advisory is in `image-size`, reached through Metro/Expo build tooling. It can loop while parsing a malicious ICNS, JXL, or HEIF asset. HouseFriends builds use reviewed, repository-owned PNG assets; user uploads are never processed by Metro.
- `uuid` was overridden to 11.1.1 to remove its prior buffer-bounds advisory in the Xcode project generator dependency.
- Automated all-platform bundles, Expo Doctor, native prebuild probes, and secret-pattern checks remain required in CI.

## Residual build-time control

Until Expo/Metro adopts an `image-size` version outside the advisory range, builds must run only from reviewed commits and must not accept untrusted build assets. Do not use `npm audit fix --force`: its current suggestion downgrades the Expo/React Native toolchain and breaks SDK compatibility.
