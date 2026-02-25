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
├── product/                    # Pipeline agents (idea → implementation)
│   ├── analyzer.md
│   ├── brainstormer.md
│   ├── prd.md
│   ├── ux-designer.md
│   ├── user-stories.md
│   ├── ralph-converter.md
│   └── ralph-runner.md
├── iterate/                    # Standalone tools (use anytime, any order)
│   ├── scout.md
│   ├── planner.md
│   ├── reviewer.md
│   └── ux-tweaker.md
├── skills/                     # Codex Skills (SKILL.md per agent)
└── workflows/                  # Multi-agent workflow templates

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

**Output contract:** `Analysis → Document → Artifacts`

### Iterate Agents (Standalone Toolkit)

| Agent | Perspective | Produces |
|-------|-------------|----------|
| `scout` | "What is this code?" | Context summary |
| `planner` | "How should I fix/build this?" | Strategy + changes required |
| `reviewer` | "Is this code good?" | Quality verdict + improvements |
| `ux-tweaker` | "How should this look/feel?" | UX improvements + accessibility |

Four perspectives, use any independently.

## Workflow

Full pipeline:

```
Analyzer → Brainstormer → PRD → UX Designer → User Stories → Spec → Implementer ⇄ Reviewer
```

**Common shortcuts:**
- New project: `Brainstormer → PRD → UX → Stories → Ralph Loop`
- Feature on existing: `Analyzer → PRD → UX → Stories → Ralph Loop`
- Quick feature: `PRD → Spec → Implementer`
- Bug fix: `Planner → implement`
- UX improvement: `UX Tweaker → implement`
- Small addition: `Planner → implement`
- Exploration: `Brainstormer → PRD`
- Design-first: `UX Designer → User Stories → Implementer`

## Platform Integration

### Cursor — Slash Commands

Type `/` in chat to invoke any agent:

```
/analyzer        — Discover project structure
/brainstormer    — Rapid ideation
/prd             — Product requirements + tech stack
/ux-designer     — UX flows, visual direction, references
/user-stories    — UX-aware, sprint-ready stories
/ralph-converter — Convert stories to prd.json
/ralph-runner    — Implement next story from prd.json
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
"Convert stories to prd.json"    → viber-ralph-converter
"Implement the next story"       → viber-ralph-runner
"Understand this module"          → viber-scout
"Why is this broken?"            → viber-planner
"Review this code"               → viber-reviewer
"Improve the UX of..."           → viber-ux-tweaker
```

Skills are installed to `~/.codex/skills/` and auto-trigger based on intent.

### Any Other Tool — AGENTS.md

`AGENTS.md` at the repo root tells any AI tool (Claude Code, Amp, etc.) about available agents:

```
"Use the ralph-runner agent to implement the next story"
```

### How It Connects

```
.agents/iterate/planner.md              ← Source of truth (portable)
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

All agents referenced via `viber-mode/.agents/` paths — works out of the box.

## Roadmap

- [x] Core agent definitions (spec, implementer, reviewer)
- [x] Product agent definitions (analyzer, brainstormer, prd, ux-designer, user-stories)
- [x] Cursor slash commands + rules integration
- [x] Full product-to-code pipeline with agent chaining
- [x] Codex Skills export + install script
- [ ] Agent validation tooling
- [ ] Workflow orchestration
- [ ] npm package distribution

## License

MIT
