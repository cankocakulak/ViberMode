# ViberMode

A vendor-agnostic AI agent development framework.

## Philosophy

**Agents are the source of truth.**

ViberMode treats AI agents as portable, tool-agnostic definitions. Write once, run anywhere—whether that's Cursor, Codex, or any future AI development environment.

**Fast over ceremonial.** No 12-step processes. Each agent does one thing, does it well, and gets out of the way. Use what you need, skip what you don't.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Product Pipeline                              │
│              (Sequential: idea → implementation)                 │
│                                                                 │
│  ┌──────────┐ ┌────────────┐ ┌─────┐ ┌────────┐ ┌──────────┐ │
│  │ Analyzer │→│Brainstormer│→│ PRD │→│UX Design│→│ Stories  │ │
│  └──────────┘ └────────────┘ └─────┘ └────────┘ └────┬─────┘ │
│                                                       ↓        │
│                           ┌───────────┐ ┌──────────────┐      │
│                           │ Bootstrap │→│ Task Planner │      │
│                           └───────────┘ └──────┬───────┘      │
│                                                ↓              │
│                                      ┌──────────────────────┐ │
│                                      │Implementation Runner│↺│
│                                      └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Iterate Toolkit                               │
│              (Standalone: use anytime, any order)                │
│                                                                 │
│  ┌───────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Scout │  │ Planner │  │ Reviewer │  │UX Tweaker│          │
│  │       │  │         │  │          │  │          │          │
│  │"What  │  │"How to  │  │"Is this  │  │"How it   │          │
│  │is it?"│  │fix/add?"│  │good?"    │  │should    │          │
│  │       │  │         │  │          │  │look?"    │          │
│  └───────┘  └─────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

1. **Tool-Agnostic** — Agents contain no assumptions about the execution environment
2. **Contract-Driven** — Two clear output contracts: code and product
3. **Composable** — Agents chain naturally, each feeding the next
4. **Fast** — No ceremony. Each agent does one thing well
5. **Exportable** — Agents can be converted to platform-specific formats (Codex Skills, etc.)

## Directory Structure

```
packs/                          # Canonical authoring roots
└── vibermode/
    ├── roles/                  # Generic agent role contracts
    ├── workflows/              # Generic workflow contracts
    └── templates/              # Generic templates

adapters/                       # Platform-specific projections
├── codex/
│   ├── skills/                 # Codex skill wrappers
│   └── install/                # Codex install/publish scripts
└── cursor/
    ├── commands/               # Cursor slash commands
    └── rules/                  # Cursor always-on context

scripts/                        # Compatibility wrappers for moved scripts

AGENTS.md                       # Agent index for Codex App, Claude Code, etc.
docs/                           # Public architecture and integration notes
```

Canonical content lives under `packs/`. Platform integrations live under `adapters/`. Public architecture and integration notes live under `docs/`.

Visual reference:
- `docs/reference/repo-visual-map.md` — Mermaid diagrams for repo topology, pack structure, projections, and workflow shape
- `docs/use-cases/ios-app-factory.md` — top-down idea-to-TestFlight operating path and generated visuals
- `docs/visuals/idea-to-testflight/` — deployable source for the iOS factory diagrams
- `docs/assets/idea-to-testflight-flow.svg` and `.png` — exported primary figure
- `docs/operations/mobile-store-submission-model.md` — shared iOS/Android Stage 4 release adapter model
- `docs/operations/codex-operational-capabilities.md` — practical Codex operator guide for RevenueCat, iOS, Android, store metadata, and reporting workflows

## What ViberMode Provides

ViberMode is easier to read as a set of services, not as a flat list of agents.

| Service | What it does | Start here |
|---------|--------------|------------|
| Product to Code | Turns a raw idea or product slice into specs, tasks, implementation, validation, and review | `docs/use-cases/product-to-code.md` |
| Existing Repo Change to Release | Turns feedback or requested changes into validated repo changes, optionally released | `docs/use-cases/existing-repo-change-to-release.md` |
| iOS App Factory | Researches app ideas, creates iOS repos, runs implementation, and prepares TestFlight delivery | `docs/use-cases/ios-app-factory.md` |
| Mobile Store Submission | Uploads completed generated mobile apps to internal tester channels | `docs/use-cases/mobile-internal-release.md` |
| Codex Operational Capabilities | Explains how Codex reads and mutates connected services such as RevenueCat, App Store Connect, Google Play, and reporting APIs | `docs/operations/codex-operational-capabilities.md` |
| App Opportunity Research | Produces research packs and optional backlog candidates without creating repos | `docs/use-cases/app-opportunity-research.md` |
| Standalone Repo Toolkit | Gives focused help for investigation, planning, UX, testing, refactor, and review work | iterate agents |

Read `docs/architecture/service-map.md` for the full service-level map.
Read `docs/use-cases/` for concrete operating paths and automation mappings.
For the idea-to-TestFlight flow, start at `docs/use-cases/ios-app-factory.md`; editable visual source lives under `docs/visuals/idea-to-testflight/` and exports to `docs/assets/`.
Regenerate its SVG/PNG assets with `npm run export:idea-to-testflight:all`.

Repository boundary decisions, including why OpenClaw projection docs, the Simmer domain pack, and the old monolithic `ios-app-store-factory` workflow are not part of ViberMode core, are recorded in `docs/architecture/boundary-decisions.md`.

## Agents

### Product Agents

| Agent | Purpose | Input From | Produces |
|-------|---------|------------|----------|
| `analyzer` | Discover existing project structure and patterns | — | Project snapshot |
| `app-researcher` | Research mobile app/category opportunities before backlog handoff | Category + sources | Research pack + candidate ideas |
| `brainstormer` | Rapid ideation, tech direction | Analyzer | Ideas + recommendation |
| `prd` | Lean product requirements + tech stack | Brainstormer | PRD document |
| `ux-designer` | Flows, visual direction, branding, references | PRD | UX specification |
| `user-stories` | Sprint-ready, UX-aware stories | PRD + UX | Story backlog |
| `bootstrap` | Prepare repo, branch, scaffold, and runnable baseline | User Stories / Analyzer | `bootstrap.md` |
| `task-planner` | Convert stories into an implementation task list | User Stories + Bootstrap | `tasks.json` |
| `implementation-runner` | Implement one task per session from `tasks.json` | Task Planner | Code changes + `run-state.json` |
| `ios-submitter` | Upload completed generated iOS apps to internal TestFlight | Completed run manifest | Submission evidence |
| `android-submitter` | Upload completed generated Android apps to Google Play internal testing | Completed run manifest | Submission evidence |

Legacy aliases:
- `ralph-converter` → `task-planner`
- `ralph-runner` → `implementation-runner`

Compatibility note:
- treat the `ralph-*` names as legacy only; prefer the canonical names above for new usage

**Output contract:** `Analysis → Document → Next Step Handoff → Artifacts`

### Iterate Agents (Standalone Toolkit)

| Family | Agent | Produces |
|-------|-------|----------|
| Understand | `scout` | Context summary |
| Understand | `planner` | Strategy + changes required |
| Improve | `ux-tweaker` | UX improvements + accessibility |
| Improve | `ux-investigator` | UX findings, recommended direction, focused improvements |
| Improve | `modularizer` | Structural findings, cut lines, safe refactor plan |
| Improve | `surface-hardener` | Edge-state, resilience, and accessibility improvements |
| Translate | `change-triager` | Scoped change brief from feedback, bug notes, and release requests |
| Verify | `integration-auditor` | End-to-end connection audit across routes, state, events, and services |
| Verify | `tester` | Ad-hoc verification evidence from CLI plus runtime checks |
| Verify | `experience-reviewer` | Product-experience verdict after runtime validation |
| Verify | `reviewer` | Quality verdict + improvements |

Use any independently, or compose them inside a larger workflow.

Verification distinctions:
- `integration-auditor` asks "is the path connected?"
- `tester` asks "does this behavior actually work?"
- `runtime-validator` is the formal pipeline gate used by implementation workflows
- `experience-reviewer` asks "does the validated surface feel specific and worth testing?"

## Workflow

Workflows are the operating procedures that combine roles into services. For a service-level view, start with `docs/architecture/service-map.md`.

Canonical composed pipeline:

```
product-to-spec → bootstrap → spec-to-code
```

Primary workflow docs:
- `app-opportunity-research` — standalone category/source analysis for mobile app opportunities
- `idea-research-backlog` — independent research loop that maintains a private ranked app idea backlog
- `daily-ios-app-pipeline` — consumes the private backlog, creates an iOS repo, and runs implementation
- `product-to-spec` — idea to completed specification artifacts
- `spec-to-code` — completed specs to tasks, implementation loop, and review
- `product-to-code` — composed workflow that runs all three stages
- `repo-change` — change planning and execution inside an existing repository
- `change-to-release` — existing-repo changes with validation, experience hardening, and optional release

Support workflow docs:
- `bootstrap` — repo/runtime preparation before implementation
- `experience-hardening` — user-facing quality gate after runtime validation and before final review
- `remediation-routing` — route failed validation, experience, or review findings back into execution

**Common shortcuts:**
- New project: `product-to-spec → bootstrap → spec-to-code`
- Existing codebase feature: `Analyzer → product-to-spec → bootstrap → spec-to-code`
- Spec-only work: `product-to-spec`
- Repo/runtime prep only: `bootstrap`
- Implementation-only work: `spec-to-code`
- Bug fix: `Planner → implement`
- UX improvement: `UX Tweaker → implement`
- UI diagnosis plus refinement: `UX Investigator → UX Tweaker → Tester`
- Safe refactor: `Modularizer → implement → Tester`
- Wiring check: `Integration Auditor → Tester`
- Release-surface hardening: `Surface Hardener → Tester`
- Generated app polish gate: `Runtime Validator → Experience Reviewer → Remediation Router → Reviewer`
- Existing repo change to release: `Change Triager → Repo Change → Experience Hardening → Release adapter`
- Small addition: `Planner → implement`
- Exploration: `Brainstormer → PRD`
- Design-first: `UX Designer → User Stories`

## Platform Integration

### Cursor — Slash Commands

Type `/` in chat to invoke any agent:

```
/analyzer        — Discover project structure
/brainstormer    — Rapid ideation
/prd             — Product requirements + tech stack
/ux-designer     — UX flows, visual direction, references
/user-stories    — UX-aware, sprint-ready stories
/task-planner    — Convert stories to tasks.json
/implementation-runner — Implement next task from tasks.json
/scout           — Quick module context summary
/planner         — Investigate bugs or plan features
/reviewer        — Code review and quality check
/ux-tweaker      — UI/UX refinements
/ux-investigator — Investigate UX friction, clarify direction, refine the surface
/modularizer     — Find safe refactor seams and modularization cuts
/tester          — Verify a surface with evidence from CLI and runtime behavior
/integration-auditor — Audit whether a feature is actually wired end to end
/surface-hardener — Harden empty/loading/error/a11y/edge states
```

Compatibility aliases still supported:

```text
/ralph-converter — Legacy alias for task-planner
/ralph-runner    — Legacy alias for implementation-runner
```

Integration files: `adapters/cursor/commands/` (slash commands) + `adapters/cursor/rules/viber-mode.mdc` (always-on context)

### Codex App — Skills

Install ViberMode agents as Codex Skills:

```bash
npm run install:codex
# or directly:
./adapters/codex/install/install-skills.sh
```

The installer also provisions a shared `viber-mode` support bundle under `~/.codex/skills/` so each skill can resolve the canonical pack files it references.

Then use agents naturally in Codex App:

```
"Analyze this project"           → viber-analyzer
"Write a PRD for..."             → viber-prd
"Design the UX for..."           → viber-ux-designer
"Create user stories"            → viber-user-stories
"Convert stories to tasks.json"  → viber-task-planner
"Implement the next task"        → viber-implementation-runner
"Understand this module"          → viber-scout
"Why is this broken?"            → viber-planner
"Review this code"               → viber-reviewer
"Improve the UX of..."           → viber-ux-tweaker
"Investigate why this UI feels off" → viber-ux-investigator
"Modularize this area safely"    → viber-modularizer
"Test whether this feature is really working" → viber-tester
"Audit whether this is actually wired up" → viber-integration-auditor
"Harden this flow for edge cases" → viber-surface-hardener
"Triage these change notes"       → viber-change-triager
"Apply these changes and prepare release" → viber-change-to-release
"Review whether this app feels ready to test" → viber-experience-reviewer
"Run the Stage 3 polish gate"    → viber-experience-hardening
```

Legacy compatibility:

```text
"Convert stories to tasks.json"  → viber-ralph-converter
"Implement the next task"        → viber-ralph-runner
```

Skills are installed to `~/.codex/skills/` and auto-trigger based on intent.

### Any Other Tool — AGENTS.md

`AGENTS.md` at the repo root tells any AI tool (Claude Code, Amp, etc.) about available agents:

```
"Use the implementation-runner agent to implement the next task"
```

### How It Connects

```
packs/vibermode/roles/iterate/planner.md        ← Source of truth (portable)
         ↕ referenced by
adapters/cursor/commands/planner.md             ← Cursor: slash command
adapters/codex/skills/planner/SKILL.md         ← Codex: auto-trigger skill
AGENTS.md                                ← Others: agent index
```

No duplication. All integrations are thin wrappers pointing to `packs/vibermode/`.

## Using in Your Own Projects

Add as a git submodule:

```bash
git submodule add <repo-url> viber-mode
```

Then copy the Cursor integration files:

```bash
cp -r viber-mode/adapters/cursor/ .cursor/
```

All agents referenced via `viber-mode/packs/vibermode/roles/` paths — works out of the box.

## Documentation

- `docs/README.md` - documentation map
- `docs/architecture/service-map.md` - service-level map showing which workflows combine into larger outcomes
- `docs/architecture/boundary-decisions.md` - what is intentionally outside ViberMode core
- `docs/use-cases/` - concrete operating paths and automation mappings
- `docs/use-cases/ios-app-factory.md` - top-down idea-to-TestFlight flow and factory visuals
- `docs/use-cases/mobile-internal-release.md` - TestFlight and Google Play internal testing release path
- `docs/operations/mobile-store-submission-model.md` - shared iOS/Android Stage 4 release adapter model
- `docs/operations/android-play-submission-guidance.md` - Google Play internal testing setup and runbook
- `docs/visuals/` - code-authored visual sources
- `docs/assets/` - exported SVG/PNG visual assets
- `docs/architecture/` - framework analysis and service-level architecture notes
- `docs/reference/capability-map.md` - what each agent, skill, and workflow is for
- `docs/reference/decision-tree.md` - how to choose the right capability quickly
- `docs/reference/agent-surface-map.yaml` - machine-readable capability and surface index

## Roadmap

- [x] Iterate agent definitions (scout, planner, reviewer, ux-tweaker)
- [x] Product agent definitions (analyzer, brainstormer, prd, ux-designer, user-stories, task-planner, implementation-runner)
- [x] Cursor slash commands + rules integration
- [x] Full product-to-code pipeline with agent chaining
- [x] Codex Skills export + install script
- [ ] Agent validation tooling
- [ ] Workflow orchestration
- [ ] npm package distribution

## License

MIT
