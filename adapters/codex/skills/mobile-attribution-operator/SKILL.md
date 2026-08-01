---
name: "viber-mobile-attribution-operator"
description: "Use when the user asks to add, audit, configure, or troubleshoot AppsFlyer mobile attribution for a Kant Akademi app, including AppsFlyer app creation, Meta/Facebook Ads, Google Ads, TikTok partner setup, RevenueCat purchase/revenue forwarding, attribution event validation, or whether a new app matches the Ozard/Sınav Oyunları attribution baseline."
---

# Mobile Attribution Operator

Read the runbook first:
- `../viber-mode/docs/operations/mobile-attribution-appsflyer-setup.md`

Related runbooks:
- RevenueCat: `../viber-mode/docs/operations/revenuecat-access.md`
- Operational capability map: `../viber-mode/docs/operations/codex-operational-capabilities.md`
- Meta Ads setup: `../viber-mode/docs/operations/meta-ads-codex-setup.md`
- Google Ads setup: `../viber-mode/docs/operations/google-ads-codex-setup.md`
- TikTok Ads setup: `../viber-mode/docs/operations/tiktok-ads-codex-setup.md`

Default workflow:
1. Identify the target app, platforms, App Store ID, iOS bundle ID, Android package name, RevenueCat project, and existing analytics target.
2. Audit app code for AppsFlyer SDK initialization, RevenueCat public SDK keys, entitlement lookup key, and `Purchases.setAppsflyerID(...)` or equivalent attribution forwarding.
3. Read existing AppsFlyer apps and partner pages before creating or changing anything.
4. Configure AppsFlyer app records, Meta/Google/TikTok partner pages, and account-level cost connections only when login and permissions are present.
5. Configure RevenueCat -> AppsFlyer with the mobile dev key, numeric iOS app ID, Android package ID, default RevenueCat event names, and the chosen revenue mode.
6. Validate with dashboard readback and, when available, TestFlight/internal-test install, login, paywall, and sandbox purchase evidence.
7. Summarize exact status per layer: app code, AppsFlyer app, partner pages, RevenueCat, ad accounts, and remaining owner actions.

Rules:
- Keep AppsFlyer dev keys, S2S tokens, RevenueCat secrets, and ad-network tokens out of git and chat.
- Treat ad accounts and campaign creation as live spending surfaces; do not create, activate, pause, or budget-change campaigns without explicit current-turn approval.
- Do not claim production attribution is proven until at least one real or sandbox validation event has been observed in the relevant dashboard.
- Do not create a new Meta, Google Ads, or TikTok ad account merely because a new app is added; decide account separation from ownership, billing, permission, and reporting requirements.
- Use product analytics such as Mixpanel or PostHog alongside AppsFlyer when already present; AppsFlyer is acquisition attribution, not a product analytics replacement.

Output:
- current baseline vs Ozard/Sınav Oyunları
- dashboard changes made or prepared
- app-code changes needed, if any
- validation evidence and expected dashboard lag
- missing credentials, permissions, or owner-only actions
