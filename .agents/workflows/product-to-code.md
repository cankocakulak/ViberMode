# Workflow: Product to Code

> Full pipeline from idea to working implementation.

## Pipeline

```
Analyzer → Brainstormer → PRD → UX Designer → User Stories → Spec → Implementer ⇄ Reviewer
```

## Steps

| # | Agent | Command | Produces | Artifact |
|---|-------|---------|----------|----------|
| 1 | Analyzer | `/analyzer` | Project snapshot | `docs/analysis-[name].md` |
| 2 | Brainstormer | `/brainstormer` | Ideas + recommendation | `docs/brainstorm-[topic].md` |
| 3 | PRD | `/prd` | Requirements + tech stack | `docs/prd-[feature].md` |
| 4 | UX Designer | `/ux-designer` | Flows, visual direction | `docs/ux-[feature].md` |
| 5 | User Stories | `/user-stories` | Sprint-ready stories | `docs/stories-[feature].md` |
| 6 | Spec | `/spec` | Technical spec | — (inline) |
| 7 | Implementer | `/implementer` | Working code | Code changes |
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

Stories output ──→ Spec (story to implement)
               ──→ Implementer (acceptance criteria)
               ──→ Reviewer (criteria to verify)
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

## Implementation Loop (Ralph Wiggum)

Steps 7-8 form a loop:

```
Implementer → Reviewer → APPROVED? → Done
                  ↓
            CHANGES_REQUESTED
                  ↓
            Implementer → Reviewer → ...
```

Run `/implementer` for each story, then `/reviewer` to validate. If changes requested, run `/implementer` again with the review feedback. Repeat until APPROVED.

## Quick Start

```
/kickoff I want to build a habit tracking app with streaks and reminders
```

The kickoff command will:
1. Derive a project name (e.g., `habit-tracker`)
2. Create `docs/habit-tracker/` as the artifact folder
3. Tell you which command to run first
4. Track pipeline progress across sessions
