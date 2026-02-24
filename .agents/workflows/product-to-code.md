# Workflow: Product to Code

> Full pipeline from idea to working implementation.

## Pipeline

```
Analyzer → Brainstormer → PRD → UX Designer → User Stories
                                                    ↓
                                        ┌───────────┴───────────┐
                                        ↓                       ↓
                                Ralph Converter          Spec → Implementer ⇄ Reviewer
                                        ↓                  (manual path)
                                    prd.json
                                        ↓
                                 Ralph Runner ↺
                                  (loop path)
```

## Steps

| # | Agent | Command | Produces | Artifact |
|---|-------|---------|----------|----------|
| 1 | Analyzer | `/analyzer` | Project snapshot | `docs/[name]/analysis.md` |
| 2 | Brainstormer | `/brainstormer` | Ideas + recommendation | `docs/[name]/brainstorm.md` |
| 3 | PRD | `/prd` | Requirements + tech stack | `docs/[name]/prd.md` |
| 4 | UX Designer | `/ux-designer` | Flows, visual direction | `docs/[name]/ux.md` |
| 5 | User Stories | `/user-stories` | Sprint-ready stories | `docs/[name]/stories.md` |
| 6a | Ralph Converter | `/ralph-converter` | Task list for loop | `docs/[name]/prd.json` |
| 6b | Spec | `/spec` | Technical spec | — (inline) |
| 7 | Ralph Runner / Implementer | `/ralph-runner` or `/implementer` | Working code | Code changes |
| 8 | Reviewer | `/reviewer` | Verdict + fixes | — (inline) |

## Handoff Mechanism

Each agent writes its output to `docs/[project-name]/`. The next agent's command includes a "Prior context" section that tells it to check that folder for artifacts from previous steps.

```
docs/
└── habit-tracker/           ← One folder per project/feature
    ├── analysis.md          ← Step 1 output
    ├── brainstorm.md        ← Step 2 output
    ├── prd.md               ← Step 3 output
    ├── ux.md                ← Step 4 output
    └── stories.md           ← Step 5 output
```

No manual copy-paste needed. Artifacts are the handoff. Multiple projects stay isolated.

## Data Flow

```
Analyzer output ──→ Brainstormer (project context)
                ──→ PRD (existing tech stack)
                ──→ UX Designer (current UI patterns)

Brainstormer output ──→ PRD (selected direction, tech ideas)

PRD output ──→ UX Designer (requirements, tech stack)
           ──→ User Stories (requirements to break down)
           ──→ Spec (requirements reference)

UX output ──→ User Stories (screens, flows, copy for acceptance criteria)
          ──→ Implementer (visual direction, component specs)

Stories output ──→ Ralph Converter (stories to prd.json for loop)
               ──→ Spec (story to implement — manual path)
               ──→ Implementer (acceptance criteria)
               ──→ Reviewer (criteria to verify)

Ralph Converter output ──→ Ralph Runner (prd.json task list)

Ralph Runner reads ──→ prd.json (task list + status)
                   ──→ progress.txt (learnings from previous iterations)
                   ──→ docs/[name]/*.md (rich context from product agents)
```

## Skipping Steps

Not every project needs every step:

| Scenario | Start at | Skip |
|----------|----------|------|
| New project from scratch | Brainstormer | Analyzer |
| Feature on existing project | Analyzer | — |
| Requirements already clear | PRD | Analyzer, Brainstormer |
| Quick bug fix | Spec | All product agents |
| Design-first | UX Designer | Analyzer, Brainstormer |

## Implementation Paths

After User Stories, you have two paths to implementation:

### Path A: Manual (Spec → Implementer ⇄ Reviewer)

Steps 6-8 form a loop. Best for complex stories that need architectural thinking:

```
Spec → Implementer → Reviewer → APPROVED? → Done
                         ↓
                   CHANGES_REQUESTED
                         ↓
                   Implementer → Reviewer → ...
```

Run `/spec` for the story, then `/implementer`, then `/reviewer`. Repeat until APPROVED.

### Path B: Ralph Loop (Autonomous Implementation)

Best for well-defined stories with clear acceptance criteria. Uses the Ralph pattern:

```
User Stories → Ralph Converter → prd.json → Ralph Runner (repeat) → Done
```

| # | Agent | Command | Produces | Artifact |
|---|-------|---------|----------|----------|
| 6 | Ralph Converter | `/ralph-converter` | Task list JSON | `docs/[name]/prd.json` |
| 7 | Ralph Runner | `/ralph-runner` | Working code per story | Code changes + commits |

**How the Ralph loop works:**

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
- **Claude Code CLI** — `ralph.sh --tool claude` for full automation
- **Amp CLI** — `ralph.sh --tool amp` for full automation

### Which path to choose?

| Scenario | Path |
|----------|------|
| 3+ well-defined stories, clear acceptance criteria | **Ralph Loop** |
| Complex story needing architectural decisions | **Manual (Spec → Impl → Review)** |
| Mix of simple and complex stories | **Ralph** for simple, **Manual** for complex |
| Want zero API cost | **Ralph Loop** via Codex App or Cursor |
| Want full autonomy (walk away) | **Ralph Loop** via CLI (requires API key) |

## Quick Start

```
/kickoff I want to build a habit tracking app with streaks and reminders
```

The kickoff command will:
1. Derive a project name (e.g., `habit-tracker`)
2. Create `docs/habit-tracker/` as the artifact folder
3. Tell you which command to run first
4. Track pipeline progress across sessions
