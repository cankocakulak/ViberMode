# Workflow: Spec to Code

> Canonical implementation-stage workflow for turning completed stories into executable tasks, implementation runs, and production review.

## Pipeline

```text
stories → task planning → implementation loop → review
```

## Step 1 — Task Planning

Role:
`.agents/roles/product/task-planner.md`

Purpose:
Convert stories into machine-readable implementation tasks.

Inputs:
- `docs/[project-name]/stories.md`
- `docs/[project-name]/prd.md`
- optional: `docs/[project-name]/ux.md`
- optional: `docs/[project-name]/analysis.md`

Outputs:
- `docs/[project-name]/tasks.json`

Success Criteria:
- story IDs and dependencies are preserved
- task splits preserve lineage to parent stories
- task ordering respects dependency chain
- `run-state.json` must reference tasks by `taskId` rather than duplicating task definitions
- first implementation target is obvious

Next Step:
`implementation-runner`

## Step 2 — Implementation Loop

Role:
`.agents/roles/product/implementation-runner.md`

Purpose:
Implement one task at a time while preserving boundaries and updating structured run state.

Inputs:
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- optional: `docs/[project-name]/analysis.md`

Outputs:
- code changes
- updated `docs/[project-name]/tasks.json`
- updated `docs/[project-name]/run-state.json`

Success Criteria:
- exactly one task is implemented per run
- task status is updated to `done`
- run history is appended structurally
- lineage and dependencies remain intact
- available tests or validation checks are run and pass before the task is considered complete
- if no automated tests exist for the affected area, the run must record the validation approach used

Next Step:
- `implementation-runner` again if tasks remain
- `reviewer` when the target slice is ready for validation

## Step 3 — Review

Role:
`.agents/roles/iterate/reviewer.md`

Purpose:
Validate implementation against PRD, UX, Stories, and task contracts.

Inputs:
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- implementation artifact or code diff

Outputs:
- `docs/[project-name]/review.md`

Success Criteria:
- verdict is explicit
- issues cite files and lines
- validation checks product and implementation contracts

Next Step:
- done if approved
- back to implementation if changes are required

## Artifacts

```text
docs/[project-name]/
├── tasks.json
├── run-state.json
└── review.md
```

Relationship note:
- `tasks.json` is the source of truth for task definitions, dependencies, and lineage.
- `run-state.json` tracks execution state and run history, and should reference tasks by `taskId` instead of copying full task definitions.
