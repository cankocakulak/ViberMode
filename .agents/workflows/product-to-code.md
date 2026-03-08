# Workflow: Product to Code

> Full pipeline from idea to working implementation.

## Pipeline

```
Analyzer → Brainstormer → PRD → UX Designer → User Stories → Ralph Converter → Ralph Runner ↺
```

## Steps

| # | Agent | Command | Produces | Artifact |
|---|-------|---------|----------|----------|
| 1 | Analyzer | `/analyzer` | Project snapshot | `docs/[name]/analysis.md` |
| 2 | Brainstormer | `/brainstormer` | Ideas + recommendation | `docs/[name]/brainstorm.md` |
| 3 | PRD | `/prd` | Requirements + tech stack | `docs/[name]/prd.md` |
| 4 | UX Designer | `/ux-designer` | Flows, visual direction | `docs/[name]/ux.md` |
| 5 | User Stories | `/user-stories` | Sprint-ready stories | `docs/[name]/stories.md` |
| 6 | Ralph Converter | `/ralph-converter` | Task list for loop | `docs/[name]/prd.json` |
| 7 | Ralph Runner | `/ralph-runner` | Working code per story | Code changes + commits |

Canonical product roles live in `.agents/roles/product/`. Legacy `.agents/product/` files remain as compatibility redirects. Each role produces an artifact that feeds the next.

## Handoff Mechanism

Each agent writes its output to `docs/[project-name]/` and leaves a short handoff section for the next step. The next agent reads prior artifacts automatically.

```
docs/
└── habit-tracker/
    ├── analysis.md    ← Step 1
    ├── brainstorm.md  ← Step 2
    ├── prd.md         ← Step 3
    ├── ux.md          ← Step 4
    ├── stories.md     ← Step 5
    └── prd.json       ← Step 6
```

No manual copy-paste needed. Artifacts plus the handoff section are the handoff. Multiple projects stay isolated.

## Handoff Format

Every product agent should end with:

```markdown
## Recommended Next Step
- **Agent**: ...
- **Why**: ...

## Context for Next Agent
- ...

## Suggested Prompt
Use the [next-agent] agent to ...
```

This makes it easier for humans to continue the pipeline and for the next agent to inherit the right context.

## Data Flow

```
Analyzer output ──→ Brainstormer (project context)
                ──→ PRD (existing tech stack)
                ──→ UX Designer (current UI patterns)

Brainstormer output ──→ PRD (selected direction, tech ideas)

PRD output ──→ UX Designer (requirements, tech stack)
           ──→ User Stories (requirements to break down)

UX output ──→ User Stories (screens, flows, copy for acceptance criteria)

Stories output ──→ Ralph Converter (stories to prd.json)

Ralph Converter output ──→ Ralph Runner (prd.json task list)

Ralph Runner reads ──→ prd.json (task list + status)
                   ──→ progress.txt (learnings from previous iterations)
                   ──→ docs/[name]/*.md (rich context from product agents)
```

## Ralph Loop

How the autonomous implementation loop works:

1. `/ralph-converter` turns `stories.md` into `prd.json` (one-time)
2. `/ralph-runner` implements the highest-priority `passes: false` story
3. Repeat step 2 (new chat each time) until all stories are `passes: true`

Each iteration is a **fresh context** — memory persists via:
- `prd.json` (which stories are done)
- `progress.txt` (learnings from previous iterations)
- Git history (committed code)

**Works with any tool:**
- **Codex App** — paste the ralph-runner prompt as a task (free with subscription)
- **Cursor** — run `/ralph-runner` in Agent Mode
- **Claude Code CLI** — for full automation via bash loop
- **Amp CLI** — for full automation via bash loop

## Skipping Steps

Not every project needs every step:

| Scenario | Start at | Skip |
|----------|----------|------|
| New project from scratch | Brainstormer | Analyzer |
| Feature on existing project | Analyzer | — |
| Requirements already clear | PRD | Analyzer, Brainstormer |
| Design-first | UX Designer | Analyzer, Brainstormer |

## Using Iterate Agents Instead

For quick tasks that don't need the full pipeline, use iterate agents directly:

| Scenario | Use |
|----------|-----|
| Understand code first | `/scout` |
| Bug fix | `/planner` → implement the fix |
| Small addition | `/planner` → implement the change |
| UI/UX improvement | `/ux-tweaker` → implement the change |
| Code review | `/reviewer` |

See `.agents/roles/iterate/` — four standalone tools, no pipeline required. Legacy `.agents/iterate/` files remain as compatibility redirects.

## Quick Start

```
/kickoff I want to build a habit tracking app with streaks and reminders
```

The kickoff command will:
1. Derive a project name (e.g., `habit-tracker`)
2. Tell you to use `docs/habit-tracker/` as the artifact folder
3. Tell you which command to run first
4. Summarize progress from any existing artifacts
