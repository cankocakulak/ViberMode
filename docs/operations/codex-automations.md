# Codex Automations

This file records the local Codex automations that matter for ViberMode operations.

Codex automations live in a user's local `$CODEX_HOME/automations/` directory. They are not framework contracts, and they may include machine-specific paths. Treat this file as an operator snapshot plus guidance for what should become portable in public prompts.

Reusable game automation prompts live in `docs/reference/game-automation-prompt-library.md`.

## Current Automations

| ID | Name | Status | Kind | Use Case |
|----|------|--------|------|----------|
| `viber-idea-research` | Manual - Viber Idea Research | `PAUSED` | heartbeat | `docs/use-cases/app-opportunity-research.md` |
| `manual-viber-game-full-production-pass` | Manual - Viber Game Full Production Pass | `PAUSED` | cron | `packs/vibermode/workflows/game/full-production-pass.md` |
| `manual-viber-game-quality-scorecard` | Manual - Viber Game Quality Scorecard | `PAUSED` | cron | `packs/vibermode/workflows/game/quality-scorecard.md` |
| `manual-viber-game-visual-novelty-audit` | Manual - Viber Game Visual Novelty Audit | `PAUSED` | cron | `packs/vibermode/workflows/game/visual-novelty-audit.md` |
| `manual-viber-game-grow-best` | Manual - Viber Game Grow Best | `PAUSED` | cron | `packs/vibermode/workflows/game/grow-best.md` |
| `manual-viber-game-review` | Manual - Viber Game Review | `PAUSED` | cron | `packs/vibermode/workflows/game/review-rank.md` |
| `manual-viber-game-level-pack` | Manual - Viber Game Level Pack | `PAUSED` | cron | `packs/vibermode/workflows/game/level-pack.md` |
| `manual-viber-game-design-character` | Manual - Viber Game Design Character | `PAUSED` | cron | `packs/vibermode/workflows/game/design-character.md` |
| `manual-viber-game-feature-experiment` | Manual - Viber Game Feature Experiment | `PAUSED` | cron | `packs/vibermode/workflows/game/feature-experiment.md` |
| `manual-viber-game-bugfix-polish` | Manual - Viber Game Bugfix Polish | `PAUSED` | cron | `packs/vibermode/workflows/game/bugfix-polish.md` |
| `viber-ios-app-factory-manual-runner` | Manual - Viber iOS App Factory | `PAUSED` | heartbeat | `docs/use-cases/ios-app-factory.md` |
| `manual-plant-routine-change-to-testflight` | Manual - Plant Routine Change To TestFlight | `PAUSED` | heartbeat | `docs/use-cases/generated-app-change-to-testflight.md` |
| `manual-studybud-change-to-release` | Deprecated - StudyBud Change To TestFlight | `PAUSED` | cron | Superseded by `docs/use-cases/app-autopilot.md` |
| `manual-store-downloads-to-notion` | Manual - Store Downloads to Notion | `PAUSED` | cron | `docs/operations/store-downloads-notion-automation.md` |
| `rox-gmail-hourly-triage` | Rox Gmail 2h Slack Triage | `ACTIVE` | heartbeat | Personal Gmail/Slack triage, not ViberMode core |
| `manual-rox-gmail-24h-triage` | Manual - Rox Gmail 24h Slack Triage | `PAUSED` | heartbeat | Personal Gmail/Slack triage, not ViberMode core |

Most ViberMode entries are manual runners. The saved prompt for each runner treats the heartbeat or manual firing as the user's explicit request to run the workflow, while `PAUSED` keeps them from running on a wall-clock schedule.

## Local Environment Boundary

Public automation docs should not require one user's paths. Use the portable setup in `docs/operations/local-environment.md`.

Preferred inputs:

- `VIBERMODE_WORKSPACE_ROOT` for the private workspace parent
- `APP_FACTORY_STATE_ROOT` for app-factory state
- `VIBERMODE_GENERATED_PRODUCTS_ROOT` for generated app bundles
- `VIBERMODE_APP_REGISTRY` or `docs/operations/app-registry.local.json` for known app aliases
- `npm run app:resolve -- --app [alias]` before asking the user for a repo path

## Workflow Coverage

- `viber-idea-research` runs Stage 1 only: opportunity research, research-pack output, backlog validation, private state commit/push.
- `manual-viber-game-full-production-pass` runs `$viber-game-full-production-pass` against Game With Water. It creates one new playable game candidate with core logic, characterful design, guided progression, 20 meaningful levels, self-iteration, quality/novelty evidence, bugfix remediation, screenshots when practical, and final validation. It must not upgrade an existing prototype.
- `manual-viber-game-quality-scorecard` runs `$viber-game-quality-scorecard` against Game With Water. It scores one named or inferred playable prototype, or the current prototype portfolio, with a concrete hyper-casual quality rubric and routes exact next workflow prompts.
- `manual-viber-game-visual-novelty-audit` runs `$viber-game-visual-novelty-audit` against Game With Water. It compares a named or newest prototype against recent prototypes/screenshots and routes repeated/generic visual language to `game-design-character`.
- `manual-viber-game-grow-best` runs `$viber-game-grow-best` against Game With Water. It chooses the highest-ROI existing playable prototype and improves one coherent gameplay/design/level/result/feedback layer.
- `manual-viber-game-review` runs `$viber-game-review-rank` against Game With Water. It compares playable prototypes, collects evidence when practical, applies only low-risk blocker fixes, and recommends the next focused game workflow prompt.
- `manual-viber-game-level-pack` runs `$viber-game-level-pack` against Game With Water. It chooses a named or highest-ROI prototype, adds/tunes levels, verifies difficulty progression, and keeps levels directly playable while tuning.
- `manual-viber-game-design-character` runs `$viber-game-design-character` against Game With Water. It strengthens visual identity, character/world language, motion, effects, and readability for a selected prototype.
- `manual-viber-game-feature-experiment` runs `$viber-game-feature-experiment` against Game With Water. It adds one bounded mechanic, special object, hazard, combo, power-up, or retention experiment with tests and rollback notes.
- `manual-viber-game-bugfix-polish` runs `$viber-game-bugfix-polish` against Game With Water. It fixes blocking flow, click, transition, result, dashboard, persistence, validation, or smoke issues before broader growth continues.
- `game-new-prototype`, `game-signature-prototype`, and `game-night-loop` remain as internal/advanced workflow docs, but they are not first-phase Play runners or public Codex skill wrappers by default. Use `manual-viber-game-full-production-pass` for new game production.
- `game-lab-bootstrap`, `game-from-zero`, `game-template-kit`, `game-retention-meta`, and `game-store-readiness` are installed as skills but do not have first-phase Play runners by default. Add runners only when those paths become active.
- `viber-ios-app-factory-manual-runner` runs Stage 2, Stage 3, and Stage 4 as one continuous factory run against one manifest. It uses the generated product bundle layout, preserves Runtime Topology through spec review, runs `npm run workspace:topology` before bootstrap, and provisions a backend sibling only after approved specs name a P0 backend trigger.
- `manual-plant-routine-change-to-testflight` reads `Docs/vibermode/change-request.md` inside the Plant Routine repo, applies actionable notes, validates, reviews, bumps build number, and uploads internal TestFlight when release gates pass.
- `manual-studybud-change-to-release` is an older app-specific runner. Keep it paused unless it is rewritten to call `app-autopilot` through app resolution instead of hardcoded StudyBud paths.

## App-Specific Automation Policy

Prefer one reusable `app-autopilot` prompt over one bespoke automation per app.

Use app-specific automations only when:

- the app alias is stable in the local registry
- the automation has a narrow operating mode such as `self-improve` or `submit-only`
- `submit_when_ready=true` is intentional
- release still depends on validation, changed-surface evidence, experience review, final review, and platform preflight

## Notes

- No legacy external-orchestrator automation is currently configured.
- Do not use historical generated workspace paths such as `.vibermode-generated-ios-apps` or old `Documents/Codex` generated-app folders for new runs.
- New generated products should use the configured generated-products root with the app repo at `[repo-name]/ios-app/`.
- Shared `ai-services` may be attached by setting `VIBERMODE_AI_SERVICES_PATH` or `AI_SERVICES_PATH`; it should be a bundle-level symlink/reference, not copied into the generated app repo.
- Secrets may be loaded from a local env file or OS credential store at runtime and must not be written to docs, prompts, git remotes, or logs.
