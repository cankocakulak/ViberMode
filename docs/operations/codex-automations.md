# Codex Automations

This file records the local Codex automations that matter for ViberMode operations.

Codex automations live in a user's local `$CODEX_HOME/automations/` directory. They are not framework contracts, and they may include machine-specific paths. Treat this file as an operator snapshot plus guidance for what should become portable in public prompts.

## Current Automations

| ID | Name | Status | Kind | Use Case |
|----|------|--------|------|----------|
| `viber-idea-research` | Manual - Viber Idea Research | `PAUSED` | heartbeat | `docs/use-cases/app-opportunity-research.md` |
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
