# Source Map

Use this reference when choosing evidence sources for a competitor teardown.

## Preferred Sources

| Source | Use For | Can Prove | Cannot Prove |
|---|---|---|---|
| Apple iTunes Search API | App metadata refresh | App name, publisher, app id, rating count, rating, price, IAP flag, screenshots, release date, version, genre | Live onboarding, paywall timing, review prompt timing |
| Public App Store pages | Listing verification | Copy, public screenshots, IAP disclosure, privacy labels, reviews shown on page | A/B variants, personalized flows |
| Apple Marketing Tools RSS | Top charts | Current public chart placement | Revenue, downloads, exact category rank history |
| PaywallPro Open Paywall Gallery | Paywall/onboarding examples | Curated paywall/onboarding screenshots, pricing/pattern notes when included | Current live variant for every user |
| PaywallScreens | Paywall visual patterns | Real-world paywall designs and category examples | Full onboarding or account flow |
| Mobbin | Screens and flows | Onboarding/paywall UI and step sequences when available | Subscription revenue, exact current A/B test |
| Page Flows | Recorded UX flows | Step-by-step videos/screens for flows | Exhaustive category coverage |
| ScreensDesign | Screen inspiration and patterns | Real iOS screen examples, paywall/onboarding references | App Store metrics |
| Sensor Tower, data.ai, Appfigures | Market intelligence | Estimates for downloads, revenue, rank, SDKs, keyword performance when accessible | Exact Apple internal data |
| User-provided screenshots/recordings | Live flow teardown | Actual observed flow for that account/device/date | Universal behavior for every cohort |

## Evidence Status

- `observed`: directly visible in a screenshot, recording, page, API response, or structured dataset.
- `source_claimed`: stated by a third-party article/database but not independently observed.
- `inferred`: reasoned from multiple signals; must be labeled as inference.
- `unknown`: not available from current sources.

## Coverage Status

- `full_flow`: onboarding and paywall flow observed.
- `paywall_only`: paywall observed, onboarding incomplete or missing.
- `metadata_only`: App Store/public metadata only.
- `inaccessible`: source or app could not be reached.

## Research Order

1. Resolve app identity with App Store app id and publisher.
2. Capture Apple public metadata first.
3. Search paywall/onboarding libraries by exact app name and publisher.
4. Search web for app-specific teardown or public screenshots.
5. Fill matrices with observed values only.
6. Mark remaining fields `unknown` and list what device recording would answer.
