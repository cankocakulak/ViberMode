# Decision Tree

This guide helps a developer or tool choose the right ViberMode capability quickly.

If you do not yet understand how the workflows combine into higher-level services, read `docs/architecture/service-map.md` first.

## Surface Rule

- Prefer `primary` capabilities first.
- Use `support` capabilities when you are intentionally inside a stage-gated flow.
- Treat `legacy` capabilities as compatibility-only.

## Start Here

### 1. Are you starting from a raw idea?

- Yes:
  - Use `product-to-spec` if you want specs
  - Use `product-to-code` if you want the full path
- No:
  - Continue below

### 2. Are you working inside an existing repository?

- Yes:
  - Use a focused game workflow when the user wants playable game work inside an existing game/prototype repo. Use `game-full-production-pass` for new game production or one-button full game work, `game-quality-scorecard` for "is this actually good", `game-visual-novelty-audit` for samey/generic visuals, `game-grow-best` for existing-game improvement, `game-review-rank` for comparison, `game-level-pack` for progression, `game-design-character` for identity, `game-feature-experiment` for one mechanic test, `game-bugfix-polish` for blockers, and `game-night-loop` only for advanced portfolio batches. Use `game-new-prototype` or `game-signature-prototype` only as internal/explicit fast-generation building blocks.
  - Use `app-autopilot` when the user names a known app and wants "improve it", "self-improve", "release-only", TestFlight, or Google Play internal submission without spelling out repo paths
  - Use `change-to-release` when the requested changes should be validated and optionally released or deployed
  - Use `repo-change` for broad repo iteration work without release orchestration
  - Or pick a narrower iterate agent below
- No:
  - Use `bootstrap` or `product-to-spec` depending on whether you need repo prep or spec generation first

## Existing Repo Paths

### I need to build or grow a game prototype

- Use one focused game workflow:
  - `game-full-production-pass` for new game production or one-button full game work with core logic, character design, guided progression, 20 levels, iteration, and validation
  - `game-quality-scorecard` for objective scoring and anti-handwave quality gates
  - `game-visual-novelty-audit` for repeated visual language, generic layouts, or weak identity
  - `game-grow-best` for polishing or extending a selected existing prototype
  - `game-review-rank` for ranking, QA, or deciding the next pass
  - `game-level-pack` for levels, stars, goals, and difficulty curve work
  - `game-design-character` for visual identity, character, animation, and game feel
  - `game-feature-experiment` for one mechanic, power-up, hazard, combo, or retention test
  - `game-bugfix-polish` for clicking, transitions, modals, result screens, validation, or smoke blockers
  - `game-night-loop` only for advanced portfolio batches across several focused passes
- Note:
  - `game-new-prototype` and `game-signature-prototype` are internal/explicit fast-generation building blocks. Do not make them the default Play surface for new games.
  - `game-prototype-lab` is a legacy router only. Prefer the focused workflows above for new automations.
  - Game With Water is a prototype lab/app shell name, not a water-theme requirement.

### I have several feedback notes, bugs, or release-facing requests

- Use `change-triager`
- If the user wants the whole path through validation and release, use `change-to-release`

### I need to grow, market, or advertise a mobile app

- Use `mobile-growth-strategist` when positioning, audience posture, acquisition route, creative pillars, or growth tasks are unclear
- Use `ad-creative-lab` when the work is to create ad briefs, copy, scripts, storyboards, image/video prompts, or asset manifests
- Use `paid-acquisition-launcher` when approved creatives should become a paused, approval-gated paid acquisition launch plan
- Use `mobile-attribution-operator` when AppsFlyer, SKAN, partner integrations, or purchase forwarding must be configured before paid launch
- Use the platform operator, such as `meta-ads-operator`, `tiktok-ads-operator`, or `google-ads-operator`, for live account reads, reports, paused object creation, or approved writes

### I need to understand what this code does

- Use `scout`

### I need to plan before changing anything

- Use `planner`

### I need to review code quality or regressions

- Use `reviewer`

### I need to improve an existing UI

- If you need a new website, app, dashboard, landing page, onboarding, or product surface designed from requirements:
  - Use `ux-designer`
- If the UX direction is already clear:
  - Use `ux-tweaker`
- If the UX problem needs diagnosis first:
  - Use `ux-investigator`
- If the UI works but needs craft-level motion, component-state, gesture, or animation polish:
  - Use `design-engineer`

### I need to refactor or split a messy area

- Use `modularizer`

### I need to prove the feature works

- Use `tester`

### I think the feature exists but may not be connected properly

- Use `integration-auditor`

### The happy path works, but edge states are weak

- Use `surface-hardener`

### The app runs, but may feel generic or not ready to test

- Use `experience-reviewer` after `runtime-validator`
- Note:
  - this is a Stage 3 gate for user-facing slices, especially generated mobile apps

## Spec-Driven Paths

### I already have `stories.md` and need tasks

- Use `task-planner`
- Note:
  - this is a `support` capability inside the implementation pipeline, not a general-purpose starting point

### I already have `tasks.json` and need implementation

- Use `implementation-runner`
- Note:
  - this is a `support` capability inside the implementation pipeline, not a broad repo-iteration tool

### I need runtime/build validation after implementation

- Use `runtime-validator`
- Note:
  - use this when you need formal pipeline-grade validation evidence
  - use `tester` instead for narrower ad-hoc verification

### I need a formal review against spec and implementation evidence

- Use `reviewer`

### I need a product-experience gate before final review

- Use `experience-hardening`
- Note:
  - this runs `experience-reviewer`, routes polish findings, and returns to validation before final review

### Validation, experience review, or final review failed and I need to route fixes back into tasks

- Use `remediation-routing`
- Note:
  - this is a `support` workflow used after failed validation or review

## Recommended Combinations

### Bug fix

- `scout -> planner -> implement`

### UX diagnosis and improvement

- `ux-investigator -> ux-tweaker -> tester`

### Craft UI polish

- `ux-investigator when direction is unclear -> design-engineer -> tester`

### Safe refactor

- `scout -> modularizer -> implement -> tester`

### Wiring audit

- `integration-auditor -> tester`

### Release-surface hardening

- `surface-hardener -> tester -> reviewer`

### Generated app Stage 3 polish loop

- `runtime-validator -> experience-reviewer -> remediation-routing -> implementation-runner -> runtime-validator -> reviewer`

### Existing product feature with proper artifact trail

- `analyzer -> product-to-spec -> bootstrap -> spec-to-code`

### Existing game prototype lab

- `game-full-production-pass -> game-review-rank -> game-signature-prototype -> game-design-character -> game-level-pack(level_count=20) -> game-quality-scorecard -> game-visual-novelty-audit -> game-bugfix-polish -> final validation`
- Internal fast path only: `game-signature-prototype -> game-new-prototype -> game-visual-novelty-audit -> game-review-rank -> game-design-character -> game-level-pack -> game-quality-scorecard -> game-bugfix-polish`
- `game-grow-best -> game-design-level-hardener -> game-prototype-review-grower`
- `game-review-rank -> recommended next focused game workflow`
- Advanced batch only: `game-night-loop -> game-review-rank -> game-grow-best -> game-level-pack/design-character -> game-quality-scorecard -> final validation`
- Future greenfield only: `game-from-zero -> game-lab-bootstrap -> game-signature-prototype -> game-quality-scorecard`

### Existing repo feedback to release

- `change-triager -> repo-change -> experience-hardening -> release adapter`

### Known app autopilot

- Use `app-autopilot`.
- Pick one mode:
  - `change-to-release` when user notes drive the batch
  - `self-improve` when Codex should inspect the app, capture evidence, and choose a bounded batch
  - `growth-experiment` when Codex should understand the app intent, choose one product/growth bet, implement it, and leave an experiment log
  - `submit-only` when no product code should change and the job is TestFlight or Google Play internal submission
- Note:
  - `self-improve` and `growth-experiment` can submit only after real changed-surface evidence, experience review, final review, and platform preflight pass

### Completed generated mobile app to internal testers

- Use `ios-submit-testflight` for iOS internal TestFlight
- Use `android-submit-play-internal` for Android Google Play internal testing
- Note:
  - Android requires Play Console bootstrap before API-controlled upload

### I need Codex to read or operate a connected service

- Start with `docs/operations/codex-operational-capabilities.md`
- Then choose the specific runbook:
  - RevenueCat: `docs/operations/revenuecat-access.md`
  - AppsFlyer/mobile attribution: `docs/operations/mobile-attribution-appsflyer-setup.md`
  - iOS/TestFlight: `docs/operations/ios-testflight-submission-guidance.md`
  - Android/Google Play: `docs/operations/android-play-submission-guidance.md`
  - Store downloads/Notion: `docs/operations/store-downloads-notion-automation.md`
- Note:
  - prefer read/preflight first
  - keep credentials outside git
  - require owner confirmation for legal, privacy, rating, data-safety, and production rollout declarations

## Support Capabilities

These are usually not the first capability you reach for, but they matter inside larger flows:

- `bootstrap`
- `change-triager`
- `task-planner`
- `implementation-runner`
- `runtime-validator`
- `experience-reviewer`
- `experience-hardening`
- `spec-reviewer`
- `remediation-router`
- `remediation-routing`
- `change-task-planner`
- `ios-submit-testflight`
- `android-submit-play-internal`
- `docs/operations/codex-operational-capabilities.md`

## Legacy Capabilities

Avoid these for new usage:

- `ralph-converter`
- `ralph-runner`

## Escalation Rule

If a narrow iterate agent starts uncovering a much larger product-definition problem:

- stop treating it as a local tweak
- move up to `product-to-spec`, `repo-change`, or `change-to-release` when release is part of the ask

If a product workflow is too heavy for the task:

- drop down to `planner`, `ux-investigator`, `modularizer`, `tester`, or another narrow iterate capability

### I need to prevent database or cloud cost regressions

Use `cost-reviewer` for cost incidents or cost-sensitive diffs. Planner, implementation-runner and reviewer load the shared cost reference only for relevant workloads. For a small, understood local change, `repo-change` supports direct implementation and targeted checks; use its structured path for risky or resumable work. Live releases still require the `change-to-release` evidence gate.
