# Workflow: Spec to Code

> Canonical implementation-stage workflow for turning completed stories into executable tasks, repeated implementation runs, and production review.

## Pipeline

```text
stories → task planning → task execution loop → review
```

Implementation boundary:
- `stories.md` is the final specification artifact.
- `tasks.json` is the first execution artifact.
- `run-state.json` is the execution-state artifact and must never replace `tasks.json` as the source of truth for task definitions.

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
- handoff clearly identifies the first implementation task and the stable artifacts required for execution

Next Step:
`implementation-runner`

Workflow note:
- `task-planner` belongs to `spec-to-code`, not `product-to-spec`
- this is the boundary where the workflow moves from specification artifacts into implementation-planning and execution artifacts

## Step 2 — Implementation Loop

Role:
`.agents/roles/product/implementation-runner.md`

Purpose:
Implement one task at a time while preserving boundaries and updating structured run state.

This step is intentionally loop-shaped:
- pick the highest-priority eligible task
- implement only that task
- run available validation checks
- update `tasks.json`
- update `run-state.json`
- either continue to the next task or stop on a hard blocker

The orchestration layer may trigger this step repeatedly, but the contract for each run remains exactly one task.

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
- the selected task is the highest-priority pending task whose dependencies are satisfied
- task status is updated to `done`
- run history is appended structurally
- lineage and dependencies remain intact
- available tests or validation checks are run and pass before the task is considered complete
- if no automated tests exist for the affected area, the run must record the validation approach used
- `run-state.json` remains execution state only and does not duplicate task definitions from `tasks.json`

Next Step:
- `implementation-runner` again if tasks remain
- `reviewer` when the target slice is ready for validation

Loop stop conditions:
- all eligible tasks are complete
- a hard blocker prevents safe continuation
- validation fails and cannot be resolved within the current task run

## Step 3 — Review

Role:
`.agents/roles/iterate/reviewer.md`

Purpose:
Validate implementation against PRD, UX, Stories, and task contracts.

This step is downstream of the execution loop. It validates a completed slice of work rather than replacing task-by-task quality checks during implementation.

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
- review outcome is clear enough to either approve the slice or send it back into implementation

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
- `tasks.json` is the source of truth for task definitions, dependencies, and lineage
- `run-state.json` tracks execution state and run history, and should reference tasks by `taskId` instead of copying full task definitions
- `review.md` validates an implementation slice after execution work has accumulated; it does not replace per-task execution state in `run-state.json`

## Execution Model

This workflow is designed to support repeated execution over the same artifact set.

Minimum execution sequence:

```text
stories.md
  ↓
task-planner
  ↓
tasks.json
  ↓
implementation-runner (one task)
  ↓
run-state.json updated
  ↓
implementation-runner again if tasks remain
  ↓
reviewer when the slice is ready
```

Design intent:
- keep specification artifacts stable once execution begins
- keep execution state separate from task definitions
- make repeated runs deterministic and resumable
