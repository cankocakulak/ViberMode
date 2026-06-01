# Codex Automations

This file records the currently configured Codex automations that matter for ViberMode operations.

## Current Automations

| ID | Name | Status | Kind | Use Case |
|----|------|--------|------|----------|
| `viber-idea-research` | Manual - Viber Idea Research | `PAUSED` | heartbeat | `docs/use-cases/app-opportunity-research.md` |
| `viber-ios-app-factory-manual-runner` | Manual - Viber iOS App Factory | `PAUSED` | heartbeat | `docs/use-cases/ios-app-factory.md` |
| `manual-plant-routine-change-to-testflight` | Manual - Plant Routine Change To TestFlight | `PAUSED` | heartbeat | `docs/use-cases/generated-app-change-to-testflight.md` |

These are manual runners. The saved prompt for each runner treats the heartbeat firing as the user's explicit request to run the workflow, while `PAUSED` keeps them from running on a wall-clock schedule.

## Canonical Paths

```text
ViberMode source:
/Users/mcan/ViberMode

Private app factory state:
/Users/mcan/ViberMode/.vibermode-state/app-factory-state

Generated iOS workspaces:
/Users/mcan/ViberMode/.vibermode-generated-ios-apps

Plant Routine repo:
/Users/mcan/ViberMode/.vibermode-generated-ios-apps/ios-plant-routine-2026-05-29
```

## Workflow Coverage

- `viber-idea-research` runs Stage 1 only: opportunity research, research-pack output, backlog validation, private state commit/push.
- `viber-ios-app-factory-manual-runner` runs Stage 2, Stage 3, and Stage 4 as one continuous factory run against one manifest.
- `manual-plant-routine-change-to-testflight` reads `Docs/vibermode/change-request.md` inside the Plant Routine repo, applies actionable notes, validates, reviews, bumps build number, and uploads internal TestFlight when release gates pass.

## Notes

- No legacy external-orchestrator automation is currently configured.
- Do not use the historical `/Users/mcan/Documents/Codex/vibermode-state/app-factory-state` path for new runs.
- Secrets are loaded from `/Users/mcan/ViberMode/.vibermode-automation.env` or Keychain at runtime and must not be written to docs, prompts, git remotes, or logs.
