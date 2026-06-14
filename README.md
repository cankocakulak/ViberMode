# ViberMode

ViberMode is a vendor-agnostic AI agent and workflow framework for moving from product intent to validated code, app-factory runs, and internal mobile release handoff.

It is not just a list of agents. The useful unit is a **service**:

- research app opportunities
- turn a product idea into reviewed code
- change an existing repo and validate the result
- generate an iOS app from a ready idea and push it toward TestFlight
- upload completed generated mobile apps to internal tester channels
- give Codex, Cursor, or another AI tool the same reusable role contracts

The canonical definitions live in `packs/`. Tool-specific wrappers live in `adapters/`. The practical maps, runbooks, visuals, and automation notes live in `docs/`.

## Start Here

| I want to... | Open first | Main path |
|--------------|------------|-----------|
| Understand the whole repo | `docs/architecture/service-map.md` | services -> workflows -> roles |
| Pick the right agent or workflow | `docs/reference/decision-tree.md` | situation -> capability |
| See every role/workflow surface | `docs/reference/capability-map.md` | capability -> Codex/Cursor/AGENTS surface |
| Research app ideas without creating repos | `docs/use-cases/app-opportunity-research.md` | app research -> ranked candidates |
| Run idea-to-TestFlight factory flow | `docs/use-cases/ios-app-factory.md` | ready idea -> repo -> code -> TestFlight |
| Operate on a known app by name | `docs/use-cases/app-autopilot.md` | app alias -> improve/change/growth/submit |
| Change an existing repo and maybe release | `docs/use-cases/existing-repo-change-to-release.md` | change notes -> validation -> release adapter |
| Change a generated app and send it back to TestFlight | `docs/use-cases/generated-app-change-to-testflight.md` | app feedback -> validated update -> TestFlight |
| Turn a product idea into code | `docs/use-cases/product-to-code.md` | specs -> bootstrap -> tasks -> implementation |
| Submit a completed mobile app internally | `docs/use-cases/mobile-internal-release.md` | preflight -> build/upload -> evidence |
| Understand Codex-operated services | `docs/operations/codex-operational-capabilities.md` | RevenueCat, App Store, Play, store metadata, reporting |
| Edit the idea-to-TestFlight visual | `docs/visuals/README.md` | source HTML/SVG -> exported assets |

## Mental Model

ViberMode has four layers.

```text
Service
  A practical outcome, such as "Product to Code" or "iOS App Factory".

Workflow
  The operating procedure that combines roles into stages.

Role
  A reusable agent contract, such as prd, reviewer, tester, or ios-submitter.

Adapter
  A thin projection for Codex Skills, Cursor commands, AGENTS.md, or scripts.
```

That gives this repo its shape:

```text
packs/vibermode/
  roles/        canonical agent contracts
  workflows/    canonical operating procedures
  templates/    reusable product/spec templates

adapters/
  codex/        Codex skill wrappers and installer
  cursor/       Cursor slash commands and rules

scripts/        CLI helpers for validation, app factory, release, and reporting

docs/
  use-cases/    outcome-specific operating paths
  architecture/ service map and boundary decisions
  operations/   private-run and connected-service runbooks
  reference/    decision tree, capability map, visual repo map
  visuals/      code-authored visual sources
  assets/       exported SVG/PNG assets
```

## Main Operating Paths

### 1. App Opportunity Research

Use this when you want better mobile app ideas before any repo exists.

```text
category or market question
  -> app-opportunity-research
  -> research pack
  -> optional idea-research-backlog update
  -> private ranked candidate list
```

Start:

- `docs/use-cases/app-opportunity-research.md`
- `packs/vibermode/workflows/app-opportunity-research.md`
- `packs/vibermode/workflows/idea-research-backlog.md`

Automation:

- `viber-idea-research` in `docs/operations/codex-automations.md`

### 2. iOS App Factory: Idea To TestFlight

Use this when a private backlog idea is already ready and the goal is to produce a generated iOS app repo, implement it, harden the experience, and upload an internal TestFlight build.

```text
ready private idea
  -> daily-ios-app-pipeline
  -> ios-app-factory-prepare
  -> product-to-code inside generated repo
  -> runtime validation
  -> experience-hardening
  -> final review
  -> ios-submit-testflight
  -> private run manifest + generated repo commit/push
```

Start:

- `docs/use-cases/ios-app-factory.md`
- `docs/operations/app-factory-automation-overview.md`
- `docs/operations/app-factory-state.md`
- `docs/operations/ios-testflight-submission-guidance.md`

Automation:

- `viber-ios-app-factory-manual-runner` in `docs/operations/codex-automations.md`

Visual:

![Idea to TestFlight flow](docs/assets/idea-to-testflight-flow.svg)

Editable source:

- `docs/visuals/idea-to-testflight/`
- exported assets: `docs/assets/idea-to-testflight-flow.svg`, `docs/assets/idea-to-testflight-flow.png`

Regenerate:

```bash
npm run export:idea-to-testflight:all
```

### 3. Product To Code

Use this when the starting point is a raw idea or product slice, not a fully specified implementation task.

```text
idea or product slice
  -> product-to-spec
     -> brainstormer
     -> prd
     -> ux-designer
     -> user-stories
     -> spec-reviewer
  -> bootstrap
  -> spec-to-code
     -> task-planner
     -> implementation-runner
     -> runtime-validator
     -> reviewer
  -> reviewed code
```

Start:

- `docs/use-cases/product-to-code.md`
- `packs/vibermode/workflows/product-to-code.md`
- `packs/vibermode/workflows/product-to-spec.md`
- `packs/vibermode/workflows/spec-to-code.md`

Typical artifacts:

```text
docs/[project-name]/
  brainstorm.md
  prd.md
  ux.md
  stories.md
  spec-review.md
  bootstrap.md
  tasks.json
  run-state.json
  validation-report.md
  review.md
```

### 4. Existing Repo Change To Release

Use this when the repo already exists and the input is feedback, bug notes, polish requests, or release-facing changes.

```text
change notes + target repo
  -> change-triager
  -> repo-change
  -> change-task-planner when needed
  -> implementation-runner
  -> runtime-validator
  -> experience-hardening when user-facing
  -> reviewer
  -> optional ios-submit-testflight or android-submit-play-internal
```

Start:

- `docs/use-cases/existing-repo-change-to-release.md`
- `packs/vibermode/workflows/change-to-release.md`
- `packs/vibermode/workflows/repo-change.md`
- `packs/vibermode/workflows/experience-hardening.md`

Generated app variant:

- `docs/use-cases/generated-app-change-to-testflight.md`

Automation:

- `manual-plant-routine-change-to-testflight` in `docs/operations/codex-automations.md`

### 5. Mobile Internal Release

Use this after implementation, runtime validation, experience review, and final review have passed. It is not the place to fix product quality; it is the release adapter stage.

```text
completed generated app manifest
  -> platform preflight
  -> build/sign/export
  -> internal tester upload
  -> evidence recorded in the run manifest
```

Start:

- `docs/use-cases/mobile-internal-release.md`
- `docs/operations/mobile-store-submission-model.md`
- `docs/operations/ios-testflight-submission-guidance.md`
- `docs/operations/android-play-submission-guidance.md`

Surfaces:

- `packs/vibermode/workflows/ios-submit-testflight.md`
- `packs/vibermode/workflows/android-submit-play-internal.md`
- `packs/vibermode/roles/product/ios-submitter.md`
- `packs/vibermode/roles/product/android-submitter.md`

### 6. Standalone Repo Toolkit

Use these when a full product pipeline is too heavy.

| Situation | Use |
|----------|-----|
| I need to understand a module | `scout` |
| I need to plan a bug fix or feature | `planner` |
| I need to diagnose UX friction | `ux-investigator` |
| I need to polish UI/UX | `ux-tweaker` |
| I need craft-level motion/component polish | `design-engineer` |
| I need to split or refactor safely | `modularizer` |
| I need to check wiring | `integration-auditor` |
| I need proof that behavior works | `tester` |
| I need edge-state hardening | `surface-hardener` |
| I need product-experience review | `experience-reviewer` |
| I need code review | `reviewer` |

Start:

- `docs/reference/decision-tree.md`
- `docs/reference/capability-map.md`

## How To Use It In Tools

### Codex App

Install the Codex skill projection:

```bash
npm run install:codex
```

Then ask naturally:

```text
"Use product-to-code for this idea..."
"Use ux-designer to design this website/app surface..."
"Use repo-change for these feedback notes..."
"Use app-autopilot for Quiet Envelope..."
"Use design-engineer to polish this component motion..."
"Use tester to verify this flow..."
"Use ios-submitter to preflight this completed generated app..."
```

Codex skill wrappers live in:

- `adapters/codex/skills/`
- `adapters/codex/README.md`

### Cursor

Cursor slash commands live in:

- `adapters/cursor/commands/`
- `adapters/cursor/rules/viber-mode.mdc`

Examples:

```text
/planner
/prd
/ux-designer
/task-planner
/implementation-runner
/design-engineer
/tester
/reviewer
```

### Any AI Tool

Use `AGENTS.md` at the repo root. It maps agent names to canonical role files.

Example:

```text
Use the planner agent.
Use the implementation-runner agent.
Use the ios-submitter agent.
```

## Useful Commands

```bash
# Validate reference metadata and capability mapping.
npm run validate

# Install Codex skills into ~/.codex/skills.
npm run install:codex

# Regenerate idea-to-TestFlight SVG and PNG visuals.
npm run export:idea-to-testflight:all

# Run the change-to-release evidence gate checker.
npm run change-release:gate

# Resolve a known app alias before an app-autopilot run.
npm run app:resolve -- --app "Quiet Envelope"

# Inspect configured RevenueCat access if credentials exist.
npm run revenuecat:status
```

## Path And Environment Portability

This is a public repo. Do not treat any personal path, username, private checkout, app registry, or credential location as a framework default.

Use:

- repo-relative paths for public ViberMode files
- `VIBERMODE_WORKSPACE_ROOT` for a local private workspace root
- `APP_FACTORY_STATE_ROOT` for the private app-factory state checkout
- `VIBERMODE_GENERATED_PRODUCTS_ROOT` for generated app bundles
- `VIBERMODE_APP_REGISTRY` or `docs/operations/app-registry.local.json` for machine-specific app aliases

Read `docs/operations/local-environment.md` before editing automation prompts, release runbooks, or anything that references private app paths.

## What Is Canonical

Use these rules when editing the repo:

- Change agent behavior in `packs/vibermode/roles/`.
- Change multi-step operating procedures in `packs/vibermode/workflows/`.
- Change Codex or Cursor wording only in `adapters/`.
- Put concrete service explanations in `docs/use-cases/`.
- Put private automation, credentials, release, and connected-service guidance in `docs/operations/`.
- Put generated visual outputs in `docs/assets/` and editable visual source in `docs/visuals/`.

## Boundary Notes

ViberMode core intentionally avoids domain-specific private state and old monolithic factory flow names.

Important decisions:

- The old monolithic `ios-app-store-factory` workflow was replaced by smaller owners: `daily-ios-app-pipeline`, `product-to-code`, `experience-hardening`, and `ios-submit-testflight`.
- OpenClaw projection docs are not part of the current core surface.
- Simmer-specific domain material is not part of the active public framework surface.
- App-factory state, credentials, run manifests, and generated private repos stay outside public docs unless a public-safe summary is intentional.

Read:

- `docs/architecture/boundary-decisions.md`
- `docs/operations/app-factory-state.md`

## Documentation Map

| Area | Purpose |
|------|---------|
| `docs/README.md` | Documentation index and recommended reading order |
| `docs/architecture/service-map.md` | High-level service model |
| `docs/architecture/boundary-decisions.md` | What is in/out of ViberMode core |
| `docs/use-cases/` | Concrete operating paths and automation mappings |
| `docs/operations/` | App factory, release, credentials, connected-service runbooks |
| `docs/reference/decision-tree.md` | Fast capability selection |
| `docs/reference/capability-map.md` | Full role/workflow/surface map |
| `docs/reference/repo-visual-map.md` | Mermaid repo topology diagrams |
| `docs/visuals/` | Code-authored visual source |
| `docs/assets/` | Exported SVG/PNG assets |

## License

MIT
