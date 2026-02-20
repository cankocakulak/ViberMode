# ViberMode

A vendor-agnostic AI agent development framework.

## Philosophy

**Agents are the source of truth.**

ViberMode treats AI agents as portable, tool-agnostic definitions. Write once, run anywhere—whether that's Cursor, Codex, or any future AI development environment.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Agents                        │
│         (Markdown-based definitions)            │
│                                                 │
│  ┌─────────┐  ┌─────────────┐  ┌──────────┐   │
│  │  Spec   │  │ Implementer │  │ Reviewer │   │
│  └─────────┘  └─────────────┘  └──────────┘   │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Adapter Layer                      │
│         (Future: skill generators)              │
│                                                 │
│  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Cursor    │  │   Codex Skills          │  │
│  │   Rules     │  │   (.agents/skills/)     │  │
│  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Core Principles

1. **Tool-Agnostic** — Agents contain no assumptions about the execution environment
2. **Contract-Driven** — Every agent has explicit input/output contracts
3. **Composable** — Agents can be chained into workflows
4. **Exportable** — Agents can be converted to platform-specific formats (Codex Skills, etc.)

## Directory Structure

```
.agents/
├── core/           # Core agent definitions
├── skills/         # Generated Codex Skills (export target)
└── workflows/      # Multi-agent workflow templates

.cursor/
└── rules/          # Cursor-specific rules

src/                # Future runtime code
```

## Core Agents

| Agent | Purpose |
|-------|---------|
| `spec` | Analyzes requirements and produces implementation specifications |
| `implementer` | Executes specifications and produces code changes |
| `reviewer` | Validates implementations against specifications |

## Agent Contract

Every agent follows a standard output contract:

```markdown
## Plan
What will be done and why

## Changes
List of files and modifications

## Patch
Actual code changes

## Tests
Verification steps or test code
```

## Usage

### In Cursor

Agents are automatically available via `.cursor/rules/`. Reference them in your prompts:

```
Use the @spec agent to analyze this feature request...
```

### Export to Codex Skills

```bash
npm run build:skills
```

This generates Codex-compatible SKILL.md files in `.agents/skills/`.

## Roadmap

- [ ] Core agent definitions
- [ ] Cursor rules integration
- [ ] Codex Skills export adapter
- [ ] Agent validation tooling
- [ ] Workflow orchestration
- [ ] npm package distribution

## License

MIT
