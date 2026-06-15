# Capability Map

This document answers one practical question:

> Which ViberMode skill, agent, or workflow should I use for this job?

It is written for both humans and tool-assisted workers such as Codex, Claude Code, and Cursor.

For the service-level view of how workflows combine into end-to-end outcomes, start with `docs/architecture/service-map.md`.

## Reading Guide

### Callability

- `always-callable`
  - Can be used at any time in an existing repository
  - Should not require pipeline artifacts to exist first
- `artifact-aware`
  - Uses artifacts such as `analysis.md`, `tasks.json`, or `bootstrap.md` when present
  - Still expected to work best-effort without them unless explicitly noted
- `artifact-required`
  - Requires specific upstream artifacts and should not be used without them

### Kinds

- `product-agent`
  - Sequential, artifact-driven planning and specification agents
- `iterate-agent`
  - Standalone investigation, verification, UX, refactor, and review helpers
- `workflow`
  - Multi-step composed operating procedure

### Surface Tiers

- `primary`
  - Recommended public surface for normal use
- `support`
  - Important capability, but usually part of a larger flow or stage gate
- `legacy`
  - Compatibility-only surface; avoid for new usage

## Quick Picks

| Situation | Use |
|----------|-----|
| I need to understand unfamiliar code | `scout` |
| I need to plan a bug fix or feature approach | `planner` |
| I want to review code quality or regressions | `reviewer` |
| I want to design a website, app, dashboard, landing page, or product surface | `ux-designer` |
| I want to improve the feel of an existing UI | `ux-tweaker` |
| I want to diagnose UX friction before changing it | `ux-investigator` |
| I want craft-level motion, component polish, or animation review | `design-engineer` |
| I want to split a large or messy file safely | `modularizer` |
| I need proof that a feature really works | `tester` |
| I need to check whether a feature is actually wired end to end | `integration-auditor` |
| I want to harden empty/loading/error/accessibility states | `surface-hardener` |
| I want to judge whether a validated app feels specific and testable | `experience-reviewer` |
| I am starting from an idea and need specs | `product-to-spec` |
| I already have specs and want implementation execution | `spec-to-code` |
| I want the full idea-to-code path | `product-to-code` |
| I want to name an app and have Codex improve, prepare, or submit it | `app-autopilot` |
| I want to work inside an existing repo without the full greenfield flow | `repo-change` |
| I have mixed feedback, bug notes, or release-facing changes to organize | `change-triager` |
| I want existing-repo changes validated and optionally released | `change-to-release` |
| I need repo baseline and runnable setup clarified first | `bootstrap` |
| I want to run the iOS app factory | `daily-ios-app-pipeline` |
| I want to upload a generated iOS app to internal TestFlight | `ios-submit-testflight` |
| I want to upload a generated Android app to Google Play internal testing | `android-submit-play-internal` |
| I want to know what Codex can read/write across RevenueCat, iOS, Android, store metadata, or reporting APIs | `docs/operations/codex-operational-capabilities.md` |
| I want to analyze or safely manage Meta/Facebook/Instagram ads | `meta-ads-operator` |

## Product Agents

### Primary product agents

#### `analyzer`

- Kind: `product-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Discover project structure, patterns, and constraints in an existing codebase
- Use when:
  - starting work on an unfamiliar repository
  - entering the product pipeline for an existing product
- Avoid when:
  - the task is a one-file edit
  - no real project exists yet
- Typical outputs:
  - `docs/[project-name]/analysis.md`
- Surfaces:
  - Codex: `viber-analyzer`
  - Cursor: `/analyzer`
  - Any tool: `analyzer` via `AGENTS.md`

#### `brainstormer`

- Kind: `product-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Explore solution directions and recommend one
- Use when:
  - the product idea is still fuzzy
  - you want structured options before PRD work
- Avoid when:
  - implementation planning is already concrete
- Typical outputs:
  - `docs/[project-name]/brainstorm.md`
- Surfaces:
  - Codex: `viber-brainstormer`
  - Cursor: `/brainstormer`
  - Any tool: `brainstormer`

#### `prd`

- Kind: `product-agent`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Turn ideation into a lean, implementation-aware PRD
- Use when:
  - the product direction is chosen
  - requirements need to become stable
- Avoid when:
  - the work is just a small repo iteration
- Typical outputs:
  - `docs/[project-name]/prd.md`
- Surfaces:
  - Codex: `viber-prd`
  - Cursor: `/prd`
  - Any tool: `prd`

#### `ux-designer`

- Kind: `product-agent`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Define product experience strategy, information architecture, first-screen hierarchy, visual direction, layout system, interaction language, and UX flows
- Use when:
  - a feature, website, app, dashboard, landing page, onboarding, or product surface needs design direction before implementation
  - first impression, page/screen hierarchy, layout system, visual style, or reference adaptation needs to be decided
- Avoid when:
  - you only need local polish on an existing screen
  - requirements are too unclear for PRD-level direction
- Distinction:
  - Use `ux-designer` for strategy, structure, visual direction, and implementation-ready UX artifacts.
  - Use `design-engineer` after direction exists when the main need is motion, tactile component feel, gestures, or craft polish.
- Typical outputs:
  - `docs/[project-name]/ux.md`
- Surfaces:
  - Codex: `viber-ux-designer`
  - Cursor: `/ux-designer`
  - Any tool: `ux-designer`

#### `user-stories`

- Kind: `product-agent`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Convert product and UX intent into backlog-style stories
- Use when:
  - PRD and UX context exist or can be inferred
- Avoid when:
  - the change is tiny and does not need backlog breakdown
- Typical outputs:
  - `docs/[project-name]/stories.md`
- Surfaces:
  - Codex: `viber-user-stories`
  - Cursor: `/user-stories`
  - Any tool: `user-stories`

### Support product agents

#### `bootstrap`

- Kind: `product-agent`
- Callability: `artifact-aware`
- Tier: `support`
- Purpose: Establish repo root, branch, setup baseline, and runnable validation context
- Use when:
  - implementation will depend on stable repo and validation commands
- Avoid when:
  - the repo is already known-good and ready
- Typical outputs:
  - `docs/[project-name]/bootstrap.md`
- Naming note:
  - This is the underlying bootstrap role.
  - In day-to-day capability selection, think of `bootstrap` mainly as a support stage rather than a first-choice entrypoint.
- Surfaces:
  - Codex: `viber-bootstrap`
  - Cursor: not currently projected
  - Any tool: `bootstrap`

#### `task-planner`

- Kind: `product-agent`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Convert stories into `tasks.json`
- Requires:
  - `docs/[project-name]/stories.md`
- Typical outputs:
  - `docs/[project-name]/tasks.json`
- Surfaces:
  - Codex: `viber-task-planner`
  - Cursor: `/task-planner`
  - Any tool: `task-planner`

#### `implementation-runner`

- Kind: `product-agent`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Implement exactly one eligible task from `tasks.json`, validate it, and update execution state
- Requires:
  - `docs/[project-name]/tasks.json`
- Typical outputs:
  - updated code
  - updated `docs/[project-name]/tasks.json`
  - updated `docs/[project-name]/run-state.json`
- Surfaces:
  - Codex: `viber-implementation-runner`
  - Cursor: `/implementation-runner`
  - Any tool: `implementation-runner`

#### `ios-submitter`

- Kind: `product-agent`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Operate the completed generated iOS app submission path to internal TestFlight
- Requires:
  - completed factory run manifest
  - approved Stage 3 evidence
  - Apple signing and App Store Connect credentials in secure runtime storage
- Surfaces:
  - Codex: `viber-ios-submitter`
  - Cursor: not currently projected
  - Any tool: `ios-submitter`

#### `android-submitter`

- Kind: `product-agent`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Operate the completed generated Android app submission path to Google Play internal testing
- Requires:
  - completed factory run manifest
  - approved Stage 3 evidence
  - confirmed Play Console bootstrap
  - Google Play service account credential in secure runtime storage
- Surfaces:
  - Codex: `viber-android-submitter`
  - Cursor: not currently projected
  - Any tool: `android-submitter`

### Legacy aliases

| Canonical | Alias | Use note |
|----------|-------|----------|
| `task-planner` | `ralph-converter` | Compatibility only |
| `implementation-runner` | `ralph-runner` | Compatibility only |

## Iterate Agents

### Understand

#### `scout`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Build fast local context on a file, module, or folder
- Use when:
  - you need to understand code before touching it
- Avoid when:
  - you need a fix strategy or a review verdict
- Surfaces:
  - Codex: `viber-scout`
  - Cursor: `/scout`
  - Any tool: `scout`

#### `planner`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Trace a bug or plan a feature/refactor before implementation
- Use when:
  - thinking first will save time
- Avoid when:
  - the desired change is already fully obvious and tiny
- Surfaces:
  - Codex: `viber-planner`
  - Cursor: `/planner`
  - Any tool: `planner`

### Translate

#### `change-triager`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `support`
- Purpose: Normalize mixed user feedback, bug bullets, screenshots, and release-facing notes into a scoped change brief
- Use when:
  - the user gives several requested changes for an existing repo
  - release blockers, must-fix items, and nice-to-have improvements need separation before planning
- Avoid when:
  - the request is one obvious small fix that can go directly to `repo-change`
  - the request is raw product ideation with no existing implementation surface
- Typical outputs:
  - `docs/[project-name]/change-brief.md`
- Surfaces:
  - Codex: `viber-change-triager`
  - Cursor: not currently projected
  - Any tool: `change-triager`

### Improve

#### `ux-tweaker`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Improve the feel, clarity, accessibility, or responsiveness of an existing UI surface
- Use when:
  - the desired UX direction is already mostly clear
- Avoid when:
  - you first need to diagnose why the UX feels wrong
- Surfaces:
  - Codex: `viber-ux-tweaker`
  - Cursor: `/ux-tweaker`
  - Any tool: `ux-tweaker`

#### `ux-investigator`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Investigate UX friction, clarify direction, and then improve the current surface
- Use when:
  - you want a UX diagnosis before implementation
  - the right change is not obvious yet
- Avoid when:
  - you need a top-down product UX spec
- Surfaces:
  - Codex: `viber-ux-investigator`
  - Cursor: `/ux-investigator`
  - Any tool: `ux-investigator`

#### `design-engineer`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Apply craft-level UI polish for motion, component states, gestures, animation timing, and interaction feel
- Use when:
  - the UI works but feels abrupt, generic, sluggish, or under-polished
  - animation, transition, gesture, popover, modal, tooltip, tab, toast, hover, focus, or active-state behavior needs design-engineering attention
  - UI code needs a Before/After/Why review of craft details
- Avoid when:
  - product flows or requirements are undefined
  - the UX problem needs broad diagnosis before polish
- Distinction:
  - Use `ux-tweaker` for general UI improvement.
  - Use `design-engineer` when motion, tactile feedback, gesture behavior, or component craft is the main quality bar.
- Surfaces:
  - Codex: `viber-design-engineer`
  - Cursor: `/design-engineer`
  - Any tool: `design-engineer`

#### `modularizer`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Find safe seams for modularization and incremental refactor
- Use when:
  - a file or feature is too large, mixed, or coupled
- Avoid when:
  - the main problem is product behavior rather than structure
- Surfaces:
  - Codex: `viber-modularizer`
  - Cursor: `/modularizer`
  - Any tool: `modularizer`

#### `surface-hardener`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Harden unhappy-path states such as loading, empty, error, disabled, retry, and accessibility
- Use when:
  - a feature works on the happy path but feels brittle
- Avoid when:
  - the user needs broad redesign rather than resilience work
- Surfaces:
  - Codex: `viber-surface-hardener`
  - Cursor: `/surface-hardener`
  - Any tool: `surface-hardener`

#### `experience-reviewer`

- Kind: `iterate-agent`
- Callability: `artifact-aware`
- Tier: `support`
- Purpose: Review product feel, interaction quality, and user-facing experience readiness after runtime validation
- Use when:
  - a runnable user-facing slice needs a product-quality gate before final review
  - a generated iOS app might be too generic, thin, or rough for TestFlight testing
- Avoid when:
  - implementation has not happened yet
  - the request is pure code quality review
- Distinction:
  - Choose this after `runtime-validator` and before final `reviewer` for user-facing slices.
- Typical outputs:
  - `docs/[project-name]/experience-review.md`
- Surfaces:
  - Codex: `viber-experience-reviewer`
  - Cursor: not currently projected
  - Any tool: `experience-reviewer`

### Verify

#### `integration-auditor`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Audit whether a feature is actually wired across routes, state, events, services, and persistence
- Use when:
  - code exists but you suspect the connection path is incomplete
  - you want a path trace from entry point to outcome
- Avoid when:
  - the main question is broad product ideation
  - you primarily need release-gate build/runtime evidence
- Distinction:
  - Choose this before `tester` when the core question is "is the connection path complete?"
- Surfaces:
  - Codex: `viber-integration-auditor`
  - Cursor: `/integration-auditor`
  - Any tool: `integration-auditor`

#### `tester`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Verify a surface with CLI checks plus runtime evidence
- Use when:
  - you need proof, not just code inspection
  - you want narrow feature verification or smoke testing
- Avoid when:
  - no runnable or observable verification path exists and pure planning is sufficient
  - you need formal pipeline-grade validation artifact output
- Distinction:
  - Choose this before `runtime-validator` for ad-hoc, developer-driven verification.
  - Choose this after `integration-auditor` when the wiring path looks complete and now needs behavioral proof.
- Surfaces:
  - Codex: `viber-tester`
  - Cursor: `/tester`
  - Any tool: `tester`

#### `reviewer`

- Kind: `iterate-agent`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Review implementation quality, regressions, and requirement alignment
- Use when:
  - you need findings and risk assessment
- Avoid when:
  - you only need contextual understanding
- Surfaces:
  - Codex: `viber-reviewer`
  - Cursor: `/reviewer`
  - Any tool: `reviewer`

### Other iterate-stage capabilities

| Capability | Status | Notes |
|-----------|--------|-------|
| `runtime-validator` | Codex-only support | Formal pipeline-grade build/runtime gate with `validation-report.md` output |
| `experience-reviewer` | Codex-only support | Product-experience gate with `experience-review.md` output |
| `spec-reviewer` | Codex-only support | Spec approval gate before implementation begins |
| `remediation-router` | Codex-only support | Routes failed validation, experience, or review findings back into execution state |
| `change-task-planner` | Codex-only support | Existing-repo sibling of `task-planner`; converts `plan.md` rather than `stories.md` |

## Workflows

### Primary workflows

#### `product-to-spec`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Run the full idea-to-specification path
- Stages:
  - `brainstormer -> prd -> ux-designer -> user-stories -> spec-reviewer`
- Use when:
  - starting from an idea
  - you want implementation-ready specification artifacts
- Surfaces:
  - Codex: `viber-product-to-spec`
  - Cursor: not currently projected

#### `spec-to-code`

- Kind: `workflow`
- Callability: `artifact-required`
- Tier: `primary`
- Purpose: Convert completed specs into tasks, implementation runs, validation, experience hardening, and review
- Requires:
  - completed specification artifacts
- Surfaces:
  - Codex: `viber-spec-to-code`
  - Cursor: not currently projected

#### `product-to-code`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Run the full path from idea through implementation
- Stages:
  - `product-to-spec -> bootstrap -> spec-to-code`
  - user-facing implementation inside `spec-to-code`: `foundation -> core -> polish -> validation -> experience -> review`
- Surfaces:
  - Codex: `viber-product-to-code`
  - Cursor: not currently projected

#### `repo-change`

- Kind: `workflow`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Handle change planning and execution inside an existing repository without forcing the full greenfield flow
- Use when:
  - the task is a real repo change but not a full new-product flow
- Distinction:
  - Use this instead of `product-to-spec` when the repo already exists and the task is a bounded repo change.
- Surfaces:
  - Codex: `viber-repo-change`
  - Cursor: not currently projected

#### `change-to-release`

- Kind: `workflow`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Apply requested changes inside an existing repository, validate them, harden the user-facing experience, and optionally release
- Stages:
  - `change-triager -> repo-change -> experience-hardening -> optional release adapter`
- Use when:
  - the user gives feedback or bug notes for an existing repo and wants the result handled end to end
  - the request may culminate in TestFlight, deployment, or another release step
- Distinction:
  - Use `repo-change` when code changes are enough.
  - Use `change-to-release` when validation, polish gates, release state, or delivery is part of the ask.
- Run model:
  - One invocation targets one repo and writes artifacts under that repo's `docs/[project-name]/` folder.
- Surfaces:
  - Codex: `viber-change-to-release`
  - Cursor: not currently projected

#### `app-autopilot`

- Kind: `workflow`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Resolve a known app by alias, choose change, self-improve, growth-experiment, or submit-only mode, and delegate to existing ViberMode gates
- Modes:
  - `change-to-release` for explicit user notes
  - `self-improve` for agent-selected improvements from runtime and screenshot evidence
  - `growth-experiment` for one agent-selected product or activation bet grounded in the app intent
  - `submit-only` for TestFlight or Google Play internal release without product code changes
- Use when:
  - the user names an app instead of supplying repo paths and manifests
  - the user asks for "self-improve", "growth", "more users", "release-only", TestFlight, or Google Play internal submission
- Distinction:
  - Use `change-to-release` directly when the target repo and change request are already explicit.
  - Use platform submitters directly when a completed run manifest is already explicit and no app lookup is needed.
- Surfaces:
  - Codex: `viber-app-autopilot`
  - Cursor: not currently projected

### Support workflows

#### `bootstrap`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `support`
- Purpose: Prepare repo and runtime baseline before implementation
- Use when:
  - branch, setup, and validation baseline are not yet trusted
- Naming note:
  - This is the public support workflow name.
  - The underlying executor is the bootstrap role described above.
- Surfaces:
  - Canonical workflow only

#### `experience-hardening`

- Kind: `workflow`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Run the Stage 3 product-experience review and routed polish loop before final review
- Use when:
  - runtime validation passed but a user-facing slice needs product feel, onboarding, paywall, keyboard, screenshot, or small-screen quality checks
- Surfaces:
  - Codex: `viber-experience-hardening`
  - Cursor: not currently projected

#### `remediation-routing`

- Kind: `workflow`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Route failed validation or review findings back into implementation state
- Surfaces:
  - Codex: `viber-remediation-routing`
  - Cursor: not currently projected

#### `app-opportunity-research`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Produce a focused app opportunity research pack from source evidence without creating a repo
- Use when:
  - the goal is market/category research or candidate discovery
  - the output may feed the private idea backlog later
- Surfaces:
  - Canonical workflow only

#### `idea-research-backlog`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `support`
- Purpose: Maintain the private ranked backlog of researched app ideas
- Use when:
  - a research candidate should be validated and upserted before factory consumption
- Surfaces:
  - Canonical workflow only

#### `daily-ios-app-pipeline`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `support`
- Purpose: Consume the private idea backlog, create one generated iOS repo, and run product-to-code
- Use when:
  - the factory should turn one ready backlog item into a generated app repo
  - Stage 2 and Stage 3 must share one run manifest
- Surfaces:
  - Canonical workflow only

#### `ios-submit-testflight`

- Kind: `workflow`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Consume a completed generated-app run manifest and upload an internal TestFlight build
- Use when:
  - Stage 3 has completed with validation, review, and release metadata
  - an existing generated app needs internal TestFlight delivery
- Surfaces:
  - Codex: `viber-ios-submitter`
  - Cursor: not currently projected

#### `android-submit-play-internal`

- Kind: `workflow`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Consume a completed Android generated-app run manifest and upload a Google Play internal testing build
- Use when:
  - Stage 3 has completed with validation, review, and release metadata
  - Play Console bootstrap is confirmed for the package
  - an existing generated Android app needs internal testing delivery
- Surfaces:
  - Codex: `viber-android-submitter`
  - Cursor: not currently projected

#### `mobile-storefront`

- Kind: `workflow`
- Callability: `always-callable`
- Tier: `support`
- Purpose: Prepare, audit, or update App Store and Google Play storefront listing metadata and assets
- Use when:
  - the request mentions App Store or Google Play listing copy, screenshots, release notes, privacy/support URLs, feature graphics, or storefront presence
- Surfaces:
  - Codex: `viber-mobile-storefront`
  - Cursor: not currently projected

#### `revenuecat-operator`

- Kind: `workflow`
- Callability: `always-callable`
- Tier: `support`
- Purpose: Inspect or configure RevenueCat projects, apps, offerings, entitlements, customers, metrics, and credentials
- Use when:
  - the request mentions RevenueCat state, API access, offerings, packages, entitlements, subscriber/customer reads, SDK keys, or metrics
- Surfaces:
  - Codex: `viber-revenuecat-operator`
  - Cursor: not currently projected

#### `mobile-monetization-operator`

- Kind: `workflow`
- Callability: `always-callable`
- Tier: `support`
- Purpose: Coordinate store products, RevenueCat configuration, and app paywall or purchase wiring
- Use when:
  - the request spans in-app products, subscription packages, RevenueCat offerings, and app-side paywall/purchase behavior
- Surfaces:
  - Codex: `viber-mobile-monetization-operator`
  - Cursor: not currently projected

#### `meta-ads-operator`

- Kind: `workflow`
- Callability: `always-callable`
- Tier: `support`
- Purpose: Analyze Meta/Facebook/Instagram Ads performance and safely plan or perform Marketing API actions
- Use when:
  - the request mentions Meta Ads, Facebook Ads, Instagram Ads, campaigns, ad sets, ads, creatives, CTR, CPC, CPM, leads, purchases, ROAS, placements, budgets, pausing, duplication, or creative testing
  - the user wants weekly ad performance tables or recurring Meta Ads reporting
  - the user wants campaign/ad/creative write plans with paused-by-default draft creation
- Avoid when:
  - the user wants generic marketing advice with no account/API context
  - the requested write lacks approval and can affect live spend
- Surfaces:
  - Codex: `meta-ads-operator`
  - Cursor: not currently projected
  - Any tool: `meta-ads-operator` via `AGENTS.md`

## Surface Notes

### Codex

- Broadest surface coverage today
- Supports product agents, iterate agents, and multiple workflows through skill wrappers

### Cursor

- Best coverage for high-frequency command-style interactions
- Does not yet expose every workflow or every product capability

### Claude Code and other generic tools

- Use `AGENTS.md`
- Canonical role names remain the stable surface

## Simplification Notes

- Prefer `primary` surfaces unless you are intentionally operating inside a stage-gated pipeline.
- Treat `support` surfaces as internal workflow stages, validation gates, or translation helpers.
- Treat `legacy` surfaces as compatibility-only; do not recommend them for new usage.
