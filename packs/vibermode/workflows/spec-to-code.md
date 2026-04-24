# Workflow: Spec to Code

> Canonical implementation-stage workflow for turning completed stories into executable tasks, repeated implementation runs, and production review.

## Pipeline

```text
stories + bootstrap → task planning → task execution loop → runtime validation → review
```

Implementation boundary:
- `stories.md` is the final specification artifact.
- `tasks.json` is the first execution artifact.
- `run-state.json` is the execution-state artifact and must never replace `tasks.json` as the source of truth for task definitions.

## Step 1 — Task Planning

Role:
`packs/vibermode/roles/product/task-planner.md`

Purpose:
Convert stories into machine-readable implementation tasks.

Inputs:
- `docs/[project-name]/stories.md`
- `docs/[project-name]/prd.md`
- optional: `docs/[project-name]/bootstrap.md`
- optional: `docs/[project-name]/ux.md`
- optional: `docs/[project-name]/analysis.md`

Outputs:
- `docs/[project-name]/tasks.json`

Success Criteria:
- story IDs and dependencies are preserved
- task splits preserve lineage to parent stories
- task ordering respects dependency chain
- bootstrap handoff is reflected in branch or runtime execution context when available
- `run-state.json` must reference tasks by `taskId` rather than duplicating task definitions
- every task carries explicit validation requirements when the slice needs them
- the first implementation target is obvious
- handoff clearly identifies the first implementation task and the stable artifacts required for execution

Next Step:
`implementation-runner`

Workflow note:
- `task-planner` belongs to `spec-to-code`, not `product-to-spec`
- this is the boundary where the workflow moves from specification artifacts into implementation-planning and execution artifacts

## Step 2 — Implementation Loop

Role:
`packs/vibermode/roles/product/implementation-runner.md`

Purpose:
Implement one task at a time while preserving boundaries and updating structured run state.

This step is intentionally loop-shaped:
- pick the highest-priority eligible task
- implement only that task
- run the task's declared validation checks
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
- optional: `docs/[project-name]/bootstrap.md`
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
- bootstrap branch/setup context is respected when the artifact exists
- available tests or validation checks are run and pass before the task is considered complete
- if the task is marked runtime-critical, a narrow smoke check is attempted before allowing the task to close
- if no automated tests exist for the affected area, the run must record the validation approach used
- `run-state.json` remains execution state only and does not duplicate task definitions from `tasks.json`

Next Step:
- `implementation-runner` again if tasks remain
- `runtime-validator` when the target slice is ready for runnable validation

Loop stop conditions:
- all eligible tasks are complete
- a hard blocker prevents safe continuation
- validation fails and cannot be resolved within the current task run

## Step 3 — Runtime Validation

Role:
`packs/vibermode/roles/iterate/runtime-validator.md`

Purpose:
Execute real post-implementation build, launch, and smoke validation before review decides whether the slice is production-ready.

This step exists because implementation-task checks are not enough to prove the full slice actually runs.

Inputs:
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- optional: `docs/[project-name]/bootstrap.md`
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- target repo root

Outputs:
- `docs/[project-name]/validation-report.md`

Success Criteria:
- real validation commands are executed and recorded
- repo-owned test/build scripts are attempted when they are part of the bootstrap baseline or project contract
- stack-appropriate runnable evidence exists for the slice under review
- failures and blockers are explicit rather than hidden inside implementation notes
- mobile app validation does not treat package-only compile checks as sufficient

Stage result rules:
- return `SKIPPED_NOT_READY` when tasks are still pending
- return `SKIPPED_BLOCKED` when implementation is already blocked and runnable validation would be misleading
- return `PASS`, `FAIL`, or `BLOCKED` only when the validation gate actually ran

Next Step:
- `reviewer` only when runtime validation produced reusable evidence

## Step 4 — Review

Role:
`packs/vibermode/roles/iterate/reviewer.md`

Purpose:
Validate implementation against PRD, UX, Stories, and task contracts.

This step is downstream of the execution loop. It validates a completed slice of work rather than replacing task-by-task quality checks during implementation.

Inputs:
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/bootstrap.md`
- optional: `docs/[project-name]/run-state.json`
- `docs/[project-name]/validation-report.md`
- implementation artifact or code diff

Outputs:
- `docs/[project-name]/review.md`

Success Criteria:
- verdict is explicit
- issues cite files and lines
- validation checks product and implementation contracts
- review consumes runtime validator evidence instead of trusting prose claims
- review does not approve when `validation-report.md` is missing or lacks explicit command outcomes
- every failing issue is routed as `reopen-task` or `create-followup-task`
- review outcome is clear enough to either approve the slice or send it back into implementation

Stage result rules:
- return `SKIPPED_NOT_READY` when tasks remain pending
- return `SKIPPED_BLOCKED` when implementation or validation is already blocked
- return `BLOCKED` when runtime evidence is missing or incomplete
- return `APPROVED` or `CHANGES_REQUESTED` only when the slice is actually reviewable

Next Step:
- done if approved
- `remediation-routing` if changes are required, then return to implementation

## Workflow Status Semantics

After validation and review, the orchestration layer should synthesize one explicit workflow status:
- `COMPLETE` when review is approved
- `INCOMPLETE_TASKS_PENDING` when the execution loop still has remaining work
- `INCOMPLETE_VALIDATION_FAILED` when runtime validation ran and failed
- `INCOMPLETE_REMEDIATION_PENDING` when review or validation findings must be routed back into tasks
- `BLOCKED` when the scaffold, environment, or execution gate prevents safe continuation

## Artifacts

```text
docs/[project-name]/
├── bootstrap.md
├── tasks.json
├── run-state.json
├── validation-report.md
└── review.md
```

Relationship note:
- `bootstrap.md` records repo root, branch state, scaffold/setup commands, and runnable baseline evidence
- `tasks.json` is the source of truth for task definitions, dependencies, and lineage
- `run-state.json` tracks execution state and run history, and should reference tasks by `taskId` instead of copying full task definitions
- `validation-report.md` records executed build/launch/smoke evidence for the current slice
- `review.md` validates an implementation slice after execution work has accumulated; it does not replace per-task execution state in `run-state.json`

## Failure Routing

When runtime validation or review fails, do not jump straight back into coding inside this workflow.

- `runtime-validator` and `reviewer` produce findings and routing guidance
- `remediation-routing` applies those decisions to `tasks.json` and `run-state.json`
- only after that should `implementation-runner` resume

## Execution Model

This workflow is designed to support repeated execution over the same artifact set.

Minimum execution sequence:

```text
stories.md + bootstrap.md
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
runtime-validator when the slice is ready
  ↓
reviewer when the slice is ready
  ↓
remediation-routing if validation/review fails
  ↓
implementation-runner again
```

Design intent:
- keep specification artifacts stable once execution begins
- allow repo/runtime setup context to feed execution without duplicating repo state into every task by default
- keep execution state separate from task definitions
- make repeated runs deterministic and resumable
- keep release gating fail-closed: missing validation or review evidence must block completion rather than silently passing
