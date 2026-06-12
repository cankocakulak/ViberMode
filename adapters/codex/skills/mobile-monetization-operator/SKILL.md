---
name: "viber-mobile-monetization-operator"
description: "Use when the user asks to set up, audit, or connect mobile monetization across Apple/Google in-app products, RevenueCat entitlements, offerings, packages, subscriptions, paywalls, or app-side purchase wiring."
---

# Mobile Monetization Operator

Read these sources as needed:
- RevenueCat: `../viber-mode/docs/operations/revenuecat-access.md`
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

Rules:
- Do not fake live purchase readiness from UI-only paywalls.
- Do not invent pricing, tax, policy, or legal declarations.
- Keep store credentials, RevenueCat tokens, and subscriber data out of prompts, logs, and git.
- If app code must change, use the existing repo-change workflow in the target app repo.

Output:
- product/package/entitlement map
- changes made or prepared per layer
- validation evidence
- missing owner actions or credentials
- exact blocker and next action when incomplete
