# Documentation Map

This repository keeps its public documentation under `docs/`.

## Sections

- `docs/architecture/`
  - Framework-level analysis, architecture notes, and roadmap documents
- `docs/openclaw/`
  - OpenClaw integration notes, workflow mapping, boundary analysis, and rollout plans
- `docs/operations/`
  - Operational runbooks for safely wiring local or private automation runtimes
  - `app-factory-automation-overview.md` summarizes the app factory stages, automations, state handoffs, and Stage 4 submission gap
  - Stage 3 product-to-code now includes experience hardening before final review for user-facing apps
  - `app-factory-state.md` documents the private app idea backlog and factory state repo
  - App opportunity research outputs are stored in the private state repo under `research-runs/`
  - `ios-repo-factory-token.md` documents local GitHub token setup for repo generation
  - `ios-testflight-submission-guidance.md` documents local Apple/Fastlane setup and the internal TestFlight Stage 4 runbook
- `docs/reference/`
  - Capability map, decision tree, visual map, and machine-readable surface inventory

## Authoring Rule

- Canonical reusable framework behavior belongs in `packs/`
- Platform projections belong in `adapters/`
- Explanatory and architectural material belongs in `docs/`

Do not add new public-facing notes under `info/` or other side folders.
