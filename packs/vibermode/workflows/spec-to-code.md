# Workflow: Spec to Code

> Canonical implementation-stage workflow for turning completed stories into executable tasks, repeated implementation runs, and production review.

## Fast Path

- Use this only when specification artifacts already exist.
- Minimum required entry artifact is `docs/[project-name]/stories.md`.
- When called from `product-to-code`, `docs/[project-name]/bootstrap.md` is required because bootstrap is the handoff for repo root, branch, scripts, and runnable baseline.
- When called standalone, `bootstrap.md` is optional only if the caller already provides a trusted target repo root and validation path.
- Treat `tasks.json` as the first execution artifact and `run-state.json` as execution state only.
- Start by generating `docs/[project-name]/tasks.json` with `task-planner`.
- Use `implementation-runner` in a loop, but one task per run only.
- Do not skip task-level validation while implementing.
- When the target slice is ready, run `runtime-validator` for real build or smoke evidence.
- Run `experience-reviewer` for user-facing slices before final review.
- Finish with `reviewer` for plan-to-code and evidence-to-code alignment.
- If validation, experience review, or final review fails, use `remediation-routing`.
- If the required spec artifacts do not exist yet, stop and move up to `product-to-spec`.

## Pipeline

```text
stories + bootstrap → task planning → task execution loop → runtime validation → experience hardening → review
```

Implementation boundary:
- `stories.md` is the final specification artifact.
- `tasks.json` is the first execution artifact.
- `run-state.json` is the execution-state artifact and must never replace `tasks.json` as the source of truth for task definitions.

Entry modes:
- `from-product-to-code` — requires `prd.md`, `ux.md`, `stories.md`, `spec-review.md`, and `bootstrap.md`
- `standalone` — requires `stories.md` and a caller-provided target repo root; strongly prefer `prd.md`, `ux.md`, and `bootstrap.md` when available

If entry mode cannot be determined, prefer the stricter `from-product-to-code` requirements.

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

Target slice readiness:
- For a full `product-to-code` run, the target slice is ready only when every task in `tasks.json` is `done`.
- For a scoped `spec-to-code` run, the target slice is ready when every task in the declared `scope` is `done` and no dependency outside the scope remains pending.
- If any task is `pending`, `blocked`, or missing required validation evidence, runtime validation must return `SKIPPED_NOT_READY` or `SKIPPED_BLOCKED` rather than reviewing the slice.

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
- `experience-reviewer` only when runtime validation produced reusable evidence and the slice has a user-facing surface
- `reviewer` only when the slice has no user-facing surface and experience review is explicitly not applicable
- `remediation-routing` when validation returns `FAIL` with routable findings
- stop with `BLOCKED` when validation returns `BLOCKED` for an environment, scaffold, or missing-target issue that cannot be converted into task state safely

## Step 4 — Experience Hardening

Workflow:
`packs/vibermode/workflows/experience-hardening.md`

Primary role:
`packs/vibermode/roles/iterate/experience-reviewer.md`

Purpose:
Review the implemented product experience after runtime validation and route polish work back into tasks before final code review.

This step exists because a slice can build, launch, and satisfy basic task checks while still feeling generic, unfinished, or unfit for real product testing.

Inputs:
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- optional: `docs/[project-name]/bootstrap.md`
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- `docs/[project-name]/validation-report.md`
- optional: screenshots, simulator notes, or other runtime evidence
- optional: `factory_context`
- target repo root

Outputs:
- `docs/[project-name]/experience-review.md`
- updated `docs/[project-name]/tasks.json` when findings are routed
- updated `docs/[project-name]/run-state.json` when findings are routed
- optional: updated `docs/[project-name]/remediation.md`

Success Criteria:
- verdict is explicit
- runtime evidence is used rather than ignored
- first-value path, interaction quality, visual/copy quality, edge states, and accessibility are assessed for user-facing slices
- every failing issue is routed as `reopen-task` or `create-followup-task`
- for `factory_context.type = ios_app_factory`, onboarding, first-value/core loop, upgrade/paywall shell, keyboard dismissal, small-screen fit, and screenshot evidence are checked
- if the slice is not user-facing, `SKIPPED_NOT_APPLICABLE` is recorded explicitly

Stage result rules:
- return `SKIPPED_NOT_READY` when tasks remain pending
- return `SKIPPED_NOT_APPLICABLE` only for non-user-facing slices
- return `BLOCKED` when evidence is too thin to inspect a user-facing slice
- return `APPROVED` when the experience gate passes
- return `CHANGES_REQUESTED` when findings must be routed back into implementation

Next Step:
- `reviewer` when approved or skipped as not applicable
- `remediation-routing` when changes are required, then return to implementation
- after remediation and resumed implementation, run `runtime-validator` and `experience-reviewer` again before final review

## Step 5 — Review

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
- `docs/[project-name]/experience-review.md` when the slice is user-facing
- implementation artifact or code diff

Outputs:
- `docs/[project-name]/review.md`

Success Criteria:
- verdict is explicit
- issues cite files and lines
- validation checks product and implementation contracts
- review consumes runtime validator evidence instead of trusting prose claims
- review does not approve when `validation-report.md` is missing or lacks explicit command outcomes
- review does not approve a user-facing slice when `experience-review.md` is missing, blocked, or requests changes
- every failing issue is routed as `reopen-task` or `create-followup-task`
- review outcome is clear enough to either approve the slice or send it back into implementation

Stage result rules:
- return `SKIPPED_NOT_READY` when tasks remain pending
- return `SKIPPED_BLOCKED` when implementation or validation is already blocked
- return `BLOCKED` when runtime evidence is missing or incomplete
- return `BLOCKED` when required experience evidence is missing for a user-facing slice
- return `APPROVED` or `CHANGES_REQUESTED` only when the slice is actually reviewable

Next Step:
- done if approved
- `remediation-routing` if changes are required, then return to implementation
- after remediation and resumed implementation, run `runtime-validator` and `experience-reviewer` again before any later approval

## Workflow Status Semantics

After validation and review, the orchestration layer should synthesize one explicit workflow status:
- `COMPLETE` when experience review is approved or not applicable and final review is approved
- `INCOMPLETE_TASKS_PENDING` when the execution loop still has remaining work
- `INCOMPLETE_VALIDATION_FAILED` when runtime validation ran and failed
- `INCOMPLETE_EXPERIENCE_CHANGES_REQUESTED` when experience review findings must be routed back into tasks
- `INCOMPLETE_REMEDIATION_PENDING` when final review or validation findings must be routed back into tasks
- `BLOCKED` when the scaffold, environment, or execution gate prevents safe continuation

## Artifacts

```text
docs/[project-name]/
├── bootstrap.md
├── tasks.json
├── run-state.json
├── validation-report.md
├── experience-review.md
├── remediation.md
└── review.md
```

Relationship note:
- `bootstrap.md` records repo root, branch state, scaffold/setup commands, and runnable baseline evidence
- `tasks.json` is the source of truth for task definitions, dependencies, and lineage
- `run-state.json` tracks execution state and run history, and should reference tasks by `taskId` instead of copying full task definitions
- `validation-report.md` records executed build/launch/smoke evidence for the current slice
- `experience-review.md` checks user-facing product quality after runtime validation and before final review
- `remediation.md` records routed validation, experience, or review findings when the loop must resume
- `review.md` validates an implementation slice after execution work has accumulated; it does not replace per-task execution state in `run-state.json`

## Failure Routing

When runtime validation, experience review, or final review fails, do not jump straight back into coding inside this workflow.

- `runtime-validator`, `experience-reviewer`, and `reviewer` produce findings and routing guidance
- `remediation-routing` applies those decisions to `tasks.json` and `run-state.json`
- only after that should `implementation-runner` resume
- after resumed implementation completes the reopened or follow-up tasks, runtime validation, experience review, and final review must run again before the workflow can return `COMPLETE`

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
experience-reviewer when the slice is user-facing
  ↓
reviewer when the slice is ready
  ↓
remediation-routing if validation/experience review/final review fails
  ↓
implementation-runner again
```

Design intent:
- keep specification artifacts stable once execution begins
- allow repo/runtime setup context to feed execution without duplicating repo state into every task by default
- keep execution state separate from task definitions
- make repeated runs deterministic and resumable
- keep release gating fail-closed: missing validation or review evidence must block completion rather than silently passing
- make user-facing quality iterative: skeleton first, then evidence-backed polish before final approval
