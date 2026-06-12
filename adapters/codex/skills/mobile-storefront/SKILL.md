---
name: "viber-mobile-storefront"
description: "Use when the user asks to update, prepare, audit, or publish Apple App Store or Google Play storefront listing metadata, descriptions, screenshots, release notes, privacy/support URLs, feature graphics, or store presence."
---

# Mobile Storefront

Start with the operational capability map:
- `../viber-mode/docs/operations/codex-operational-capabilities.md`

Then choose the platform runbook:
- iOS/App Store Connect/TestFlight: `../viber-mode/docs/operations/ios-testflight-submission-guidance.md`
- Android/Google Play: `../viber-mode/docs/operations/android-play-submission-guidance.md`
- Shared store model: `../viber-mode/docs/operations/mobile-store-submission-model.md`

Workflow:
1. Identify the target repo root, platform, bundle ID or package name, locale, and intended track/surface.
2. Inspect existing app metadata, config, screenshots/assets, and docs before proposing changes.
3. Prepare local metadata files or evidence docs in the target repo when possible.
4. Mutate external store metadata only when credentials are available and the user's intent is clearly write-oriented.
5. If the store requires owner-only policy, privacy, age-rating, data-safety, pricing, or legal answers, prepare the exact checklist and stop before inventing answers.

Rules:
- Prefer official APIs, Fastlane, EAS, Gradle, or repo-owned scripts over browser-only work.
- Run read/preflight before write operations.
- Do not paste or persist Apple, Google, or upload-signing secrets.
- For Google Play, do not promise zero-touch first app creation; initial app record and required declarations may require Play Console owner action.
- For App Store review or production release, require explicit user approval after metadata and policy evidence are ready.

Output:
- target app and platform
- fields/assets prepared or updated
- command/API evidence when mutation runs
- remaining owner confirmations
- exact blocker and next action when incomplete
