---
name: "viber-mobile-rating-review-integrator"
description: "Use when the user asks to design, implement, retrofit, audit, or validate a mobile app rating/review system for Kant Akademi apps, including iOS SKStoreReviewController, Google Play In-App Review API, ethical review collection, trigger selection, cooldowns, analytics, remote config, internal feedback, and app-specific value-moment discovery."
---

# Mobile Rating Review Integrator

Read and follow the full agent instructions at `../viber-mode/packs/vibermode/roles/product/mobile-rating-review-integrator.md`.

Before starting:
1. Confirm the target repo root and platform(s).
2. Read existing `docs/[project-name]/analysis.md`, `bootstrap.md`, and related artifacts when they exist.
3. Inspect existing app packages before adding dependencies; prefer `expo-store-review` when already installed.
4. Use the existing `repo-change` workflow if app code must be modified.

Primary artifact:
- `docs/[project-name]/rating-review-integration.md`

Rules:
1. Use native platform review APIs and installed dependencies before new packages.
2. Keep store review prompts separate from internal feedback.
3. Do not ask for 5 stars, incentivize reviews, or create review gating.
4. Do not claim native launch validation until an iOS simulator, Android emulator, or physical device has been used.
