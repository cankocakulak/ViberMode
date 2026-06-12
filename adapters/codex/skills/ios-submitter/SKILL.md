---
name: "viber-ios-submitter"
description: "Use when the user asks to preflight, archive, upload, or submit an iOS app build to App Store Connect or internal TestFlight, including generated ViberMode iOS factory apps."
---

# iOS Submitter

Read and follow the full role instructions at `../viber-mode/packs/vibermode/roles/product/ios-submitter.md`.

Primary workflow:
- `../viber-mode/packs/vibermode/workflows/ios-submit-testflight.md`

Operational runbook:
- `../viber-mode/docs/operations/ios-testflight-submission-guidance.md`

Use this skill for:
- internal TestFlight preflight or upload
- App Store Connect app/bundle identity checks
- iOS archive/export/upload evidence
- generated iOS factory run submission from a `factory/runs/[run-id].json` manifest

Rules:
1. Run preflight before any live Apple-side mutation.
2. Default to internal TestFlight; do not configure external testing or App Store review unless explicitly requested.
3. Keep Apple credentials in Keychain or runtime env only.
4. Do not mark a generated app shipped just because TestFlight upload succeeded.
5. Return exact blockers for agreements, roles, signing, build, or processing issues.
