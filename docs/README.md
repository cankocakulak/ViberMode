# Documentation Map

This repository keeps its public documentation under `docs/`.

## Sections

- `docs/architecture/`
  - Framework-level analysis and service architecture notes
  - `service-map.md` is the best first read for understanding which workflows combine into higher-level services
  - `boundary-decisions.md` explains removed or externalized surfaces such as Simmer, OpenClaw, and the old iOS App Store factory workflow
- `docs/use-cases/`
  - Concrete operating manifests for service-level outcomes such as app opportunity research, iOS app factory, product-to-code, and generated app changes to TestFlight
- `docs/operations/`
  - Operational runbooks for safely wiring local or private automation runtimes
  - `archive/` holds historical run, validation, and bootstrap artifacts that should not sit at the public docs root
  - `app-factory-automation-overview.md` summarizes the app factory stages, automations, state handoffs, and Stage 4 submission path
  - `codex-automations.md` lists the currently configured manual Codex automations and their targets
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

## Read Order

If you are new to the repo:

1. `docs/architecture/service-map.md` - what ViberMode provides as services
2. `docs/architecture/boundary-decisions.md` - what is intentionally outside this repo
3. `docs/use-cases/README.md` - concrete operating paths and automation mappings
4. `docs/reference/decision-tree.md` - which service or capability to use
5. `docs/reference/capability-map.md` - exact role and workflow descriptions
6. `docs/operations/` - only when running private automation or release operations
