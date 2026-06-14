# Documentation Map

This repository keeps its public documentation under `docs/`.

## Sections

- `docs/architecture/`
  - Framework-level analysis and service architecture notes
  - `service-map.md` is the best first read for understanding which workflows combine into higher-level services
  - `boundary-decisions.md` explains removed or externalized surfaces such as Simmer, OpenClaw, and the old iOS App Store factory workflow
- `docs/use-cases/`
  - Concrete operating manifests for service-level outcomes such as app opportunity research, iOS app factory, product-to-code, mobile internal release, and generated app changes to TestFlight
- `docs/visuals/`
  - Code-authored, deployable visual sources; `idea-to-testflight/` generates the iOS factory diagrams
- `docs/assets/`
  - Exported SVG/PNG assets referenced by docs; edit source under `docs/visuals/` when available
- `docs/operations/`
  - Operational runbooks for safely wiring local or private automation runtimes
  - `archive/` holds historical run, validation, and bootstrap artifacts that should not sit at the public docs root
  - `codex-operational-capabilities.md` is the best first read for understanding what Codex can read/write across RevenueCat, iOS, Android, store metadata, and reporting APIs
  - `app-factory-automation-overview.md` summarizes the app factory stages, automations, state handoffs, and Stage 4 submission path
  - `codex-automations.md` lists the currently configured manual Codex automations and their targets
  - `local-environment.md` explains portable path, env var, app registry, and secret boundaries for public docs and local operators
  - Stage 3 product-to-code now includes experience hardening before final review for user-facing apps
  - `app-factory-state.md` documents the private app idea backlog and factory state repo
  - App opportunity research outputs are stored in the private state repo under `research-runs/`
  - `ios-repo-factory-token.md` documents local GitHub token setup for repo generation
  - `mobile-store-submission-model.md` explains the shared iOS/Android Stage 4 release adapter model
  - `ios-testflight-submission-guidance.md` documents local Apple/Fastlane setup and the internal TestFlight Stage 4 runbook
  - `android-play-submission-guidance.md` documents local Google Play/Fastlane setup and the internal testing Stage 4 runbook
  - `revenuecat-access.md` documents local RevenueCat REST API access through the repo-owned CLI wrapper
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
4. `docs/use-cases/ios-app-factory.md` - idea-to-TestFlight path, visuals, and automation handoff
5. `docs/use-cases/app-autopilot.md` - known-app improve/change/growth/submit front door
6. `docs/use-cases/mobile-internal-release.md` - platform release adapter path for internal tester distribution
7. `docs/operations/local-environment.md` - portable local path and env setup rules
8. `docs/operations/codex-operational-capabilities.md` - how Codex operates connected services safely
9. `docs/reference/decision-tree.md` - which service or capability to use
10. `docs/reference/capability-map.md` - exact role and workflow descriptions
11. `docs/visuals/README.md` - only when editing exported diagrams
12. `docs/operations/` - only when running private automation or release operations
