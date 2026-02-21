# ViberMode

A vendor-agnostic AI agent development framework.

## Philosophy

**Agents are the source of truth.**

ViberMode treats AI agents as portable, tool-agnostic definitions. Write once, run anywhere—whether that's Cursor, Codex, or any future AI development environment.

**Fast over ceremonial.** No 12-step processes. Each agent does one thing, does it well, and gets out of the way. Use what you need, skip what you don't.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Product Agents                       │
│             (Analysis → Document → Artifacts)           │
│                                                         │
│  ┌────────────┐ ┌─────┐ ┌────────────┐ ┌────────────┐ │
│  │Brainstormer│ │ PRD │ │UX Designer │ │User Stories│ │
│  └────────────┘ └─────┘ └────────────┘ └────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Code Agents                         │
│             (Plan → Changes → Patch → Tests)            │
│                                                         │
│       ┌──────┐    ┌─────────────┐    ┌──────────┐      │
│       │ Spec │    │ Implementer │    │ Reviewer │      │
│       └──────┘    └─────────────┘    └──────────┘      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Adapter Layer                        │
│              (Future: skill generators)                 │
│                                                         │
│       ┌──────────┐         ┌──────────────────┐        │
│       │  Cursor  │         │   Codex Skills   │        │
│       │  Rules   │         │ (.agents/skills/) │        │
│       └──────────┘         └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

## Core Principles

1. **Tool-Agnostic** — Agents contain no assumptions about the execution environment
2. **Contract-Driven** — Two clear output contracts: code and product
3. **Composable** — Agents can be chained: brainstorm → PRD → stories → spec → implement → review
4. **Fast** — No ceremony. Each agent does one thing well
5. **Exportable** — Agents can be converted to platform-specific formats (Codex Skills, etc.)

## Directory Structure

```
.agents/
├── core/           # Code agents: spec, implementer, reviewer
├── product/        # Product agents: brainstormer, prd, ux-designer, user-stories
├── skills/         # Generated Codex Skills (export target)
└── workflows/      # Multi-agent workflow templates

.cursor/
└── rules/          # Cursor-specific integration

src/                # Future runtime code
```

## Agents

### Product Agents

| Agent | Purpose | Produces |
|-------|---------|----------|
| `brainstormer` | Rapid ideation and creative exploration | Ideas list + recommendation |
| `prd` | Lean product requirements | PRD document |
| `ux-designer` | UX flows and interaction design | UX specification |
| `user-stories` | Sprint-ready user stories | Prioritized story backlog |

**Output contract:** `Analysis → Document → Artifacts`

### Code Agents

| Agent | Purpose | Produces |
|-------|---------|----------|
| `spec` | Technical specification from requirements | Implementation spec |
| `implementer` | Code from specification | Working code + tests |
| `reviewer` | Validation against spec | Review verdict + fixes |

**Output contract:** `Plan → Changes → Patch → Tests`

## Workflow

Use the full chain or any subset:

```
Brainstormer → PRD → UX Designer → User Stories → Spec → Implementer → Reviewer
     ↑                                                                     │
     └──────────────────── (if rejected) ──────────────────────────────────┘
```

**Common shortcuts:**
- Quick feature: `PRD → Spec → Implementer`
- Bug fix: `Spec → Implementer → Reviewer`
- Exploration: `Brainstormer → PRD`
- Design-first: `UX Designer → User Stories → Implementer`

## Usage

### In Cursor

Agents are automatically available via `.cursor/rules/`. Reference them:

```
Use the brainstormer agent to explore ideas for user onboarding
Use the prd agent to write requirements for the notification system
Use the spec agent to analyze the API changes needed
Use the implementer agent to build the auth module
```

### In Your Own Projects

Copy `.agents/` and `.cursor/rules/` into your project root. Done.

### Export to Codex Skills

```bash
npm run build:skills
```

## Roadmap

- [x] Core agent definitions (spec, implementer, reviewer)
- [x] Product agent definitions (brainstormer, prd, ux-designer, user-stories)
- [x] Cursor rules integration
- [ ] Codex Skills export adapter
- [ ] Agent validation tooling
- [ ] Workflow orchestration
- [ ] npm package distribution

## License

MIT
