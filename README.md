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
│                              ┌───────────┐    ┌──────────────┐ │
│                              │ Converter │───→│ Ralph Runner │↺│
│                              └───────────┘    └──────────────┘ │
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
├── vibermode/
│   ├── roles/                  # Generic agent role contracts
│   ├── workflows/              # Generic workflow contracts
│   └── templates/              # Generic templates
└── simmer/
    └── paper-trading/          # Domain pack consumed by simmer-supervisor

adapters/                       # Platform-specific projections
├── codex/
│   ├── skills/                 # Codex skill wrappers
│   └── install/                # Codex install/publish scripts
├── cursor/
│   ├── commands/               # Cursor slash commands
│   └── rules/                  # Cursor always-on context
└── openclaw/                   # OpenClaw projection/publish surface

scripts/                        # Compatibility wrappers for moved scripts

AGENTS.md                       # Agent index for Codex App, Claude Code, etc.
src/                            # Future runtime code
```

Canonical content now lives under `packs/`. Platform integrations live under `adapters/`.

## Agents

### Product Agents

| Agent | Purpose | Input From | Produces |
|-------|---------|------------|----------|
| `analyzer` | Discover existing project structure and patterns | — | Project snapshot |
| `brainstormer` | Rapid ideation, tech direction | Analyzer | Ideas + recommendation |
| `prd` | Lean product requirements + tech stack | Brainstormer | PRD document |
| `ux-designer` | Flows, visual direction, branding, references | PRD | UX specification |
| `user-stories` | Sprint-ready, UX-aware stories | PRD + UX | Story backlog |
| `task-planner` | Convert stories into an implementation task list | User Stories | `tasks.json` |
| `implementation-runner` | Implement one task per session from `tasks.json` | Task Planner | Code changes + `run-state.json` |

Legacy aliases:
- `ralph-converter` → `task-planner`
- `ralph-runner` → `implementation-runner`

**Output contract:** `Analysis → Document → Next Step Handoff → Artifacts`

### Iterate Agents (Standalone Toolkit)

| Agent | Perspective | Produces |
|-------|-------------|----------|
| `scout` | "What is this code?" | Context summary |
| `planner` | "How should I fix/build this?" | Strategy + changes required |
| `reviewer` | "Is this code good?" | Quality verdict + improvements |
| `ux-tweaker` | "How should this look/feel?" | UX improvements + accessibility |

Four perspectives, use any independently.

## Workflow

Canonical composed pipeline:

```
product-to-spec → spec-to-code
```

Canonical workflow docs:
- `product-to-spec` — idea to completed specification artifacts
- `spec-to-code` — completed specs to tasks, implementation loop, and review
- `product-to-code` — composed workflow that runs both stages

**Common shortcuts:**
- New project: `Brainstormer → PRD → UX → Stories`
- Existing codebase feature: `Analyzer → product-to-spec → spec-to-code`
- Spec-only work: `product-to-spec`
- Implementation-only work: `spec-to-code`
- Bug fix: `Planner → implement`
- UX improvement: `UX Tweaker → implement`
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
/ralph-converter — Legacy alias for task-planner
/ralph-runner    — Legacy alias for implementation-runner
/scout           — Quick module context summary
/planner         — Investigate bugs or plan features
/reviewer        — Code review and quality check
/ux-tweaker      — UI/UX refinements
```

Integration files: `adapters/cursor/commands/` (slash commands) + `adapters/cursor/rules/viber-mode.mdc` (always-on context)

### Codex App — Skills

Install ViberMode agents as Codex Skills:

```bash
npm run install:codex
# or directly:
./adapters/codex/install/install-skills.sh
```

Then use agents naturally in Codex App:

```
"Analyze this project"           → viber-analyzer
"Write a PRD for..."             → viber-prd
"Design the UX for..."           → viber-ux-designer
"Create user stories"            → viber-user-stories
"Convert stories to tasks.json"  → viber-task-planner
"Implement the next task"        → viber-implementation-runner
"Convert stories to prd.json"    → viber-ralph-converter (legacy alias)
"Implement the next story"       → viber-ralph-runner (legacy alias)
"Understand this module"          → viber-scout
"Why is this broken?"            → viber-planner
"Review this code"               → viber-reviewer
"Improve the UX of..."           → viber-ux-tweaker
```

Skills are installed to `~/.codex/skills/` and auto-trigger based on intent.

### OpenClaw

OpenClaw-specific agent workspaces and runtime behavior are authored in the OpenClaw repo, not projected from ViberMode.

ViberMode's role for OpenClaw is to provide:
- canonical pack content under `packs/`
- shared contracts, templates, and reference material
- lightweight integration guidance under `adapters/openclaw/`

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
