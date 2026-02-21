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
.agents/                        # Source of truth (tool-agnostic)
├── core/                       # Code agents
│   ├── spec.md
│   ├── implementer.md
│   └── reviewer.md
├── product/                    # Product agents
│   ├── brainstormer.md
│   ├── prd.md
│   ├── ux-designer.md
│   └── user-stories.md
├── skills/                     # Generated Codex Skills (export target)
└── workflows/                  # Multi-agent workflow templates

.cursor/
├── commands/                   # Slash commands (/brainstormer, /prd, etc.)
│   ├── brainstormer.md
│   ├── prd.md
│   ├── ux-designer.md
│   ├── user-stories.md
│   ├── spec.md
│   ├── implementer.md
│   └── reviewer.md
└── rules/
    └── viber-mode.mdc          # Always-on context (agent index + contracts)

src/                            # Future runtime code
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

## How It Works in Cursor

### Slash Commands — `/agent-name`

Type `/` in chat to invoke any agent:

```
/brainstormer    — Rapid ideation
/prd             — Product requirements
/ux-designer     — UX flows and patterns
/user-stories    — Sprint-ready stories
/spec            — Technical specification
/implementer     — Code implementation
/reviewer        — Code review
```

Each command references its agent file as the operating procedure and passes your message via `{{input}}`. Priority order: agent file rules > command constraints > default behavior.

### Always-On Context — `viber-mode.mdc`

A single rule file (`alwaysApply: true`) stays in context at all times. It tells Cursor what agents exist, what categories they belong to, and what output contracts to follow.

### Architecture

```
.agents/product/brainstormer.md       ← Source of truth (portable, tool-agnostic)
         ↕ referenced by
.cursor/commands/brainstormer.md      ← Slash command (/brainstormer)
.cursor/rules/viber-mode.mdc         ← Always-on context (agent index)
```

No duplication. Commands are thin wrappers that point to `.agents/`.

## Using in Your Own Projects

Copy two directories into your project root:

```bash
cp -r .agents/ /path/to/your-project/.agents/
cp -r .cursor/ /path/to/your-project/.cursor/
```

That's it. All agents and Cursor rules are immediately available.

## Export to Codex Skills

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
