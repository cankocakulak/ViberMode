---
name: "viber-mobile-monetization-operator"
description: "Use when the user asks to set up, audit, or connect mobile monetization across Apple/Google in-app products, RevenueCat entitlements, offerings, packages, subscriptions, paywalls, or app-side purchase wiring."
---

# Mobile Monetization Operator

Read these sources as needed:
- RevenueCat: `../viber-mode/docs/operations/revenuecat-access.md`
- RevenueCat + App Store launch workflow: `../viber-mode/docs/operations/mobile-monetization-revenuecat-launch.md`
- Store operations: `../viber-mode/docs/operations/codex-operational-capabilities.md`
- iOS store flow: `../viber-mode/docs/operations/ios-testflight-submission-guidance.md`
- Android store flow: `../viber-mode/docs/operations/android-play-submission-guidance.md`

Separate the work into three layers:
1. Store product catalog: Apple/Google product IDs, subscription groups, pricing, tax/legal owner confirmations.
2. RevenueCat configuration: project, app, entitlement, offering, package, product attachment, SDK/public keys.
3. App implementation: SDK wiring, paywall UI, restore purchase, entitlement gating, test/sandbox behavior.

Workflow:
1. Identify the target app, platform(s), bundle/package ID, existing product IDs, and desired packages.
2. Read current store/RevenueCat/app state before creating anything.
3. Prepare a mapping table of product ID -> store -> RevenueCat package -> entitlement -> app surface.
4. Apply bounded changes only where credentials and explicit user intent allow it.
5. Verify from all three layers before declaring monetization ready.

For iOS RevenueCat subscription launches, follow the launch workflow reference before implementation or release. The agent must be able to handle the full path when missing:
- App Store subscription group/products/prices/localizations/review screenshots/intro offers.
- RevenueCat project/app/entitlement/offering/package/product mapping and public SDK key retrieval.
- App-side SDK dependency, secret xcconfig binding, Info.plist exposure, paywall UI, purchase, restore, entitlement state, and access gating.
- Archive/export/TestFlight verification, including IPA Info.plist inspection before upload.

Rules:
- Do not fake live purchase readiness from UI-only paywalls.
- Do not invent pricing, tax, policy, or legal declarations.
- Keep store credentials, RevenueCat tokens, and subscriber data out of prompts, logs, and git.
- If app code must change, use the existing repo-change workflow in the target app repo.
- Do not upload or distribute a monetized iOS build until the exported IPA has been inspected for required RevenueCat/app configuration keys.

Output:
- product/package/entitlement map
- changes made or prepared per layer
- validation evidence
- missing owner actions or credentials
- exact blocker and next action when incomplete
