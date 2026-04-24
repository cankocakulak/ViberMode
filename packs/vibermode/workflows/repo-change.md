# Workflow: Repo Change

> Canonical workflow for adding a feature, fixing a bug, or refining behavior inside an existing repository.

## Pipeline

```text
existing repo → analyze/scout → plan → optional bootstrap → change-task-planner → implementation loop → runtime validation → review
```

This workflow is for existing codebases. It does not start with product ideation or full specification artifacts unless the change turns out to be large enough to justify escalation into `product-to-spec`.

## Workflow Scope

Use this workflow when:
- the repo already exists and code should be changed in place
- the user wants a bug fix, feature addition, refactor, or UX improvement
- implementation should be grounded in the current architecture, not a greenfield product spec

Do not use this workflow when:
- the request starts from a raw idea with no existing implementation surface
- the work is large enough that it needs PRD, UX, and user stories first
- the user only wants a codebase summary with no planned change

## Stage 1 — Repository Understanding

Primary roles:
- `packs/vibermode/roles/product/analyzer.md`
- `packs/vibermode/roles/iterate/scout.md`

Purpose:
Understand the existing repo and the specific module or flow the requested change will touch.

Inputs:
- target repo root
- change request or bug report
- optional existing `docs/[project-name]/analysis.md`

Outputs:
- optional updated `docs/[project-name]/analysis.md`
- inline or artifact-based scout summaries for the touched area

Success Criteria:
- current architecture and patterns relevant to the change are understood
- the likely files, modules, API calls, data flow, and DB surfaces are identified
- unknowns are reduced enough to plan the change safely

Execution rule:
- Skip full `analyzer` only if the repo is already understood well enough and a current analysis artifact exists.
- Use `scout` whenever the change touches a narrower area that still needs targeted reconnaissance.

## Stage 2 — Change Planning

Primary role:
- `packs/vibermode/roles/iterate/planner.md`

Purpose:
Translate the requested change plus repo context into one approved implementation approach.

Inputs:
- change request
- repo understanding from Stage 1
- optional current behavior, bug evidence, screenshots, logs, or constraints

Outputs:
- `docs/[project-name]/plan.md`

Success Criteria:
- current behavior or root cause is explicit
- recommended approach is singular and justified
- affected files or modules are named
- DB/API/UI impact is explicit when relevant
- verification and acceptance checks are explicit

Escalation rule:
- If the planner determines the change is really a new product slice needing broader specification, stop and route into `product-to-spec` instead of forcing this workflow.

## Stage 3 — Optional Bootstrap

Primary role:
- `packs/vibermode/roles/product/bootstrap.md`

Purpose:
Re-establish a trusted runnable baseline when the repo, branch, or runtime path is not yet reliable enough for implementation.

Inputs:
- target repo root
- optional `docs/[project-name]/analysis.md`
- optional `docs/[project-name]/plan.md`

Outputs:
- optional `docs/[project-name]/bootstrap.md`

Success Criteria:
- runnable baseline and branch assumptions are explicit when bootstrap is needed
- bootstrap is skipped only when the repo root and validation path are already trusted

## Stage 4 — Change Task Planning

Primary role:
- `packs/vibermode/roles/iterate/change-task-planner.md`

Purpose:
Convert the approved change plan into `tasks.json` for deterministic implementation.

Inputs:
- `docs/[project-name]/plan.md`
- optional: `docs/[project-name]/analysis.md`
- optional: `docs/[project-name]/bootstrap.md`

Outputs:
- `docs/[project-name]/tasks.json`

Success Criteria:
- tasks stay inside the approved change boundary
- ordering reflects dependencies and validation needs
- first implementation target is obvious

Execution rule:
- For a trivial one-shot fix, this stage may emit a single-task `tasks.json` rather than splitting unnecessarily.

## Stage 5 — Implementation Loop

Primary role:
- `packs/vibermode/roles/product/implementation-runner.md`

Purpose:
Implement one task at a time while preserving repo context and validation evidence.

Inputs:
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- `docs/[project-name]/plan.md`
- optional: `docs/[project-name]/analysis.md`
- optional: `docs/[project-name]/bootstrap.md`

Outputs:
- code changes
- updated `docs/[project-name]/tasks.json`
- updated `docs/[project-name]/run-state.json`

Success Criteria:
- exactly one task is implemented per run
- validation evidence is recorded at the task level
- implementation remains inside the planned change boundary

## Stage 6 — Runtime Validation

Primary role:
- `packs/vibermode/roles/iterate/runtime-validator.md`

Purpose:
Execute real build, launch, or smoke validation appropriate to the changed slice.

Inputs:
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- optional: `docs/[project-name]/bootstrap.md`
- `docs/[project-name]/plan.md`
- target repo root

Outputs:
- `docs/[project-name]/validation-report.md`

Success Criteria:
- real commands are executed and recorded
- validation is strong enough for the affected change surface
- blockers are explicit

## Stage 7 — Review

Primary role:
- `packs/vibermode/roles/iterate/reviewer.md`

Purpose:
Verify the implementation matches the planned change and does not introduce obvious regressions.

Inputs:
- `docs/[project-name]/plan.md`
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- optional: `docs/[project-name]/bootstrap.md`
- `docs/[project-name]/validation-report.md`
- implementation diff or code under review

Outputs:
- `docs/[project-name]/review.md`

Success Criteria:
- verdict is explicit
- issues cite files and lines
- review checks implementation against the approved plan plus validation evidence
- every failing issue is routed as `reopen-task` or `create-followup-task`

Next Step:
- done if approved
- `remediation-routing` if changes are required

## Failure Routing

When runtime validation or review fails:

- use `packs/vibermode/workflows/remediation-routing.md`
- reopen affected tasks or append follow-up tasks
- then resume the implementation loop

## Artifact Set

```text
docs/[project-name]/
├── analysis.md               # optional
├── plan.md
├── bootstrap.md             # optional
├── tasks.json
├── run-state.json
├── validation-report.md
├── remediation.md
└── review.md
```

## Execution Outcome

This workflow is successful only when:
- the repo and touched module are understood well enough for safe planning
- `plan.md` defines one approved approach
- implementation tasks are complete
- runtime validation produced explicit evidence
- review approved the changed slice
