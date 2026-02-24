# ViberMode

A vendor-agnostic AI agent development framework.

## Philosophy

**Agents are the source of truth.**

ViberMode treats AI agents as portable, tool-agnostic definitions. Write once, run anywhere—whether that's Cursor, Codex, or any future AI development environment.

**Fast over ceremonial.** No 12-step processes. Each agent does one thing, does it well, and gets out of the way. Use what you need, skip what you don't.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Product Agents                            │
│              (Analysis → Document → Artifacts)                  │
│                                                                 │
│  ┌──────────┐ ┌────────────┐ ┌─────┐ ┌──────────┐ ┌────────┐ │
│  │ Analyzer │→│Brainstormer│→│ PRD │→│UX Design │→│Stories │ │
│  └──────────┘ └────────────┘ └─────┘ └──────────┘ └────────┘ │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Code Agents                              │
│               (Plan → Changes → Patch → Tests)                  │
│                                                                 │
│           ┌──────┐    ┌─────────────┐    ┌──────────┐          │
│           │ Spec │───→│ Implementer │⇄───│ Reviewer │          │
│           └──────┘    └─────────────┘    └──────────┘          │
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
├── core/                       # Code agents
│   ├── spec.md
│   ├── implementer.md
│   └── reviewer.md
├── product/                    # Product agents
│   ├── analyzer.md
│   ├── brainstormer.md
│   ├── prd.md
│   ├── ux-designer.md
│   └── user-stories.md
├── skills/                     # Generated Codex Skills (export target)
└── workflows/                  # Multi-agent workflow templates

.cursor/
├── commands/                   # Slash commands (/analyzer, /prd, etc.)
│   ├── analyzer.md
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

| Agent | Purpose | Input From | Produces |
|-------|---------|------------|----------|
| `analyzer` | Discover existing project structure and patterns | — | Project snapshot |
| `brainstormer` | Rapid ideation, tech direction | Analyzer | Ideas + recommendation |
| `prd` | Lean product requirements + tech stack | Brainstormer | PRD document |
| `ux-designer` | Flows, visual direction, branding, references | PRD | UX specification |
| `user-stories` | Sprint-ready, UX-aware stories | PRD + UX | Story backlog |

**Output contract:** `Analysis → Document → Artifacts`

### Code Agents

| Agent | Purpose | Produces |
|-------|---------|----------|
| `spec` | Technical specification from requirements | Implementation spec |
| `implementer` | Code from specification | Working code + tests |
| `reviewer` | Validation against spec | Review verdict + fixes |

**Output contract:** `Plan → Changes → Patch → Tests`

## Workflow

Full pipeline:

```
Analyzer → Brainstormer → PRD → UX Designer → User Stories → Spec → Implementer ⇄ Reviewer
```

**Common shortcuts:**
- New project: `Brainstormer → PRD → UX → Stories → Implement`
- Feature on existing: `Analyzer → PRD → UX → Stories → Implement`
- Quick feature: `PRD → Spec → Implementer`
- Bug fix: `Spec → Implementer → Reviewer`
- Exploration: `Brainstormer → PRD`
- Design-first: `UX Designer → User Stories → Implementer`

## How It Works in Cursor

### Slash Commands — `/agent-name`

Type `/` in chat to invoke any agent:

```
/analyzer        — Discover project structure
/brainstormer    — Rapid ideation
/prd             — Product requirements + tech stack
/ux-designer     — UX flows, visual direction, references
/user-stories    — UX-aware, sprint-ready stories
/spec            — Technical specification
/implementer     — Code implementation
/reviewer        — Code review
```

Each command references its agent file as the operating procedure and passes your message via `{{input}}`. Priority order: agent file rules > command constraints > default behavior.

### Always-On Context — `viber-mode.mdc`

A single rule file (`alwaysApply: true`) stays in context at all times. It tells Cursor what agents exist, what categories they belong to, and what output contracts to follow.

### How It Connects

```
viber-mode/.agents/product/brainstormer.md    ← Source of truth (portable)
         ↕ referenced by
.cursor/commands/brainstormer.md              ← Slash command (/brainstormer)
.cursor/rules/viber-mode.mdc                 ← Always-on context (agent index)
```

No duplication. Commands are thin wrappers that point to `viber-mode/.agents/`.

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
- [ ] Codex Skills export adapter
- [ ] Agent validation tooling
- [ ] Workflow orchestration
- [ ] npm package distribution

## License

MIT
