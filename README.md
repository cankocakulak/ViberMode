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
.agents/                        # Source of truth (tool-agnostic)
├── roles/                      # Reusable agent roles
│   ├── product/                # Pipeline roles (idea → implementation)
│   │   ├── analyzer.md
│   │   ├── brainstormer.md
│   │   ├── prd.md
│   │   ├── ux-designer.md
│   │   ├── user-stories.md
│   │   ├── task-planner.md
│   │   ├── implementation-runner.md
│   │   ├── ralph-converter.md
│   │   └── ralph-runner.md
│   └── iterate/                # Standalone roles (use anytime, any order)
│       ├── scout.md
│       ├── planner.md
│       ├── reviewer.md
│       └── ux-tweaker.md
├── product/                    # Legacy compatibility redirects
├── iterate/                    # Legacy compatibility redirects
├── skills/                     # Codex Skills (SKILL.md per agent)
└── workflows/                  # Multi-agent workflow definitions

.cursor/
├── commands/                   # Slash commands (/analyzer, /prd, etc.)
└── rules/
    └── viber-mode.mdc          # Always-on context (agent index + contracts)

AGENTS.md                       # Agent index for Codex App, Claude Code, etc.

src/                            # Future runtime code
```

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

Integration files: `.cursor/commands/` (slash commands) + `.cursor/rules/viber-mode.mdc` (always-on context)

### Codex App — Skills

Install ViberMode agents as Codex Skills:

```bash
npm run install:codex
# or directly:
./scripts/install-codex-skills.sh
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

### Any Other Tool — AGENTS.md

`AGENTS.md` at the repo root tells any AI tool (Claude Code, Amp, etc.) about available agents:

```
"Use the implementation-runner agent to implement the next task"
```

### How It Connects

```
.agents/roles/iterate/planner.md        ← Source of truth (portable)
         ↕ referenced by
.cursor/commands/planner.md             ← Cursor: slash command
.agents/skills/planner/SKILL.md         ← Codex: auto-trigger skill
AGENTS.md                               ← Others: agent index
```

No duplication. All integrations are thin wrappers pointing to `.agents/`.

## Using in Your Own Projects

Add as a git submodule:

```bash
git submodule add <repo-url> viber-mode
```

Then copy the Cursor integration files:

```bash
cp -r viber-mode/.cursor/ .cursor/
```

All agents referenced via `viber-mode/.agents/roles/` paths — works out of the box.

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
