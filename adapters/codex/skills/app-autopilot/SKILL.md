---
name: "viber-app-autopilot"
description: "Use when the user names an existing app and wants Codex to improve it, apply changes, prepare it for release, or submit it to TestFlight/Google Play internal testing with app lookup and quality gates handled automatically."
---

# App Autopilot

Read and follow the full workflow instructions at `../viber-mode/packs/vibermode/workflows/app-autopilot.md`.

This is the front-door skill for known apps. Use it when the user gives an app name or alias instead of a full repo path, manifest, artifact directory, and release command.

The user can speak naturally. Do not require exact syntax such as `mode=self-improve`.

Natural examples:

- "quiet envelope'e bak, kendin iyilestir"
- "quiet envelope'i toparla, hazirsa testflight'a al"
- "quiet envelope release-only"
- "quiet envelope icin sadece submit dene"
- "quiet envelope'de su notlari uygula, gate gecerse testflight'a al"
- "quiet envelope'in intentini anla, daha cok indirme/user icin kreatif bir experiment sec ve uygula"
- "quiet envelope'i fantazyagormatik modda buyut, hazirsa testflight'a al"

Modes:

1. `change-to-release` - use explicit user notes or bug reports, then delegate to `change-to-release`.
2. `self-improve` - inspect the app, capture runtime/screenshot evidence, create a bounded change request, then delegate to `change-to-release`.
3. `growth-experiment` - understand the app intent, run a creative growth session, choose one experiment, then delegate implementation through `change-to-release`.
4. `submit-only` - perform release-only/TestFlight/Google Play internal submission using existing artifacts and platform submitters; do not change product code.

Routing rules:

- Resolve app identity through the app registry or local generated-product workspace discovery before asking for paths.
- Prefer `npm run app:resolve` for app lookup when the ViberMode repo is available.
- Honor `VIBERMODE_APP_REGISTRY`, `VIBERMODE_WORKSPACE_ROOT`, `APP_FACTORY_STATE_ROOT`, and `VIBERMODE_GENERATED_PRODUCTS_ROOT`; do not assume one operator's home directory or generated-products path.
- Treat `docs/operations/app-registry.local.json` as local, gitignored, machine-specific state.
- Use `viber-change-to-release` behavior for implementation work.
- Use `viber-ios-submitter` behavior for iOS internal TestFlight.
- Use `viber-android-submitter` behavior for Google Play internal testing.
- Use `submit-only` when the user says "release-only", "TestFlight'a al", "Google Play internal'a al", or asks only for submission.
- Use `self-improve` when the user asks the agent to find improvements itself.
- Use `growth-experiment` when the user asks for more downloads, more users, activation, retention, growth, a creative session, deciding what feature/onboarding/home change to build, or "fantazyagormatik" product iteration.
- Infer `submit_when_ready=true` when the user says "hazirsa TestFlight'a al", "gate gecerse internal'a yolla", "sorun yoksa submit et", or equivalent.
- Keep `submit_when_ready=false` when release wording is absent or the user says not to upload.

Release safety:

1. Do not submit until validation, changed-surface screenshot/video evidence, experience review, final review, and platform preflight pass.
2. Launch-only evidence is not enough for changed visual surfaces.
3. In `self-improve`, internal release is allowed only when the user explicitly asked to submit when ready.
4. In `growth-experiment`, implement one selected experiment per pass and log rejected ideas for later.
5. Return exact blockers instead of uploading with known gaps.
