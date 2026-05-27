# Workflow: Product to Code

> Canonical composed workflow: `product-to-spec` followed by `bootstrap` followed by `spec-to-code`.

## Pipeline Overview

This workflow is the default path for a new product idea:

```text
idea → product-to-spec → bootstrap → spec-to-code
```

Canonical role order:

```text
Brainstormer → PRD → UX Designer → User Stories → Spec Reviewer ↺ → Bootstrap → Task Planner → Implementation Runner ↺ → Runtime Validator → Reviewer → Remediation Router (when needed)
```

This workflow is deterministic:
- each step reads explicit inputs
- each step writes a named artifact
- each step has success criteria before the next step can begin
- downstream agents rely on artifacts, not chat history

## Entry Contract

Before starting, the orchestrator must resolve these inputs:

- `project_name` — stable slug used under `docs/[project-name]/`
- `workspace_path` — one canonical local repo or project root for both artifacts and code
- `product_idea` — raw idea, feature concept, or requested product slice
- `repo_mode` — `existing-repo` or `greenfield`
- `platform` and `stack` — enough runtime context for spec adaptability, bootstrap, and validation
- optional `analysis_artifact` — only when existing-codebase discovery has already run

If `project_name`, `workspace_path`, `platform`, or `stack` cannot be derived safely, stop before Stage 1 and ask for the missing input. Do not let downstream stages infer different roots, stacks, or artifact folders independently.

## Composed Workflow

Stage 1:
- `packs/vibermode/workflows/product-to-spec.md`

Stage 2:
- `packs/vibermode/workflows/bootstrap.md`

Stage 3:
- `packs/vibermode/workflows/spec-to-code.md`

Use `product-to-code` when you want the full path from idea to reviewed implementation.
Use `product-to-spec` when you want to stop after specification artifacts are complete.
Use `spec-to-code` when specs already exist and you only want the implementation pipeline.

## Workflow Scope

Use this workflow when:
- starting from a raw idea
- defining a new feature or product slice
- preparing implementation-ready work with stable artifact handoffs

Do not use this workflow when:
- you only need codebase discovery first
- the task is a small bug fix or isolated iteration task

For existing-product work that requires codebase discovery, run `analyzer` first and then enter this workflow at Stage 1 with `analysis_artifact`.

## Stage Gate Rules

- Stage 1 must write `spec-review.md` and reach `APPROVED` before bootstrap can start.
- If Stage 1 reaches `CHANGES_REQUESTED`, rerun only the specification stages named in `spec-review.md`, preserving stable requirement IDs, UX flow names, and story IDs wherever possible. Stay in Stage 1 until `spec-review.md` reaches `APPROVED` or `BLOCKED`.
- If Stage 1 reaches `BLOCKED`, the composed workflow is blocked and later stages must not run.
- Stage 2 must write `bootstrap.md` and establish one canonical workspace path plus a reusable runnable baseline before implementation begins. In `product-to-code`, bootstrap is required even when it only records that an existing baseline is already trusted.
- If Stage 2 reaches `BLOCKED`, Stage 3 must not run.
- All stages must resolve artifacts relative to the same canonical target repo or workspace root.
- The composed workflow should pass forward only stable artifact paths and explicit stage results, not informal chat summaries.

## Workflow Status Artifact

The orchestrator should maintain a machine-readable status file:

```text
docs/[project-name]/workflow-status.json
```

Minimum shape:

```json
{
  "workflow": "product-to-code",
  "projectName": "[project-name]",
  "workspacePath": "/absolute/path/to/project-root",
  "status": "RUNNING",
  "currentStage": "product-to-spec",
  "stages": {
    "product-to-spec": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/spec-review.md",
      "verdict": null
    },
    "bootstrap": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/bootstrap.md",
      "verdict": null
    },
    "spec-to-code": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/review.md",
      "verdict": null
    }
  },
  "blockers": [],
  "nextAction": "Run product-to-spec"
}
```

Allowed top-level statuses:
- `RUNNING`
- `COMPLETE`
- `BLOCKED`
- `INCOMPLETE_SPEC_CHANGES_REQUESTED`
- `INCOMPLETE_TASKS_PENDING`
- `INCOMPLETE_VALIDATION_FAILED`
- `INCOMPLETE_REMEDIATION_PENDING`

Status rules:
- Update this file after every stage or retryable loop.
- Use stage artifacts as the source of truth; do not mark a stage complete from prose alone.
- If an artifact exists but lacks an explicit verdict, treat the stage as blocked until the artifact is corrected.
- `COMPLETE` is allowed only after review approves the implemented slice and runtime evidence exists.

## Artifact Folder Convention

All artifacts live under:

```text
docs/[project-name]/
```

Canonical artifact set for this workflow:

```text
docs/[project-name]/
├── workflow-status.json
├── brainstorm.md
├── prd.md
├── ux.md
├── stories.md
├── spec-review.md
├── bootstrap.md
├── tasks.json
├── run-state.json
├── validation-report.md
├── remediation.md
└── review.md
```

Notes:
- `run-state.json` is produced during repeated `implementation-runner` execution.
- `architecture.md` is not part of the canonical first production workflow because there is no dedicated architect role in the current system.
- If an external architecture step is inserted later, it should consume `prd.md`, `ux.md`, and `stories.md` without changing IDs or boundaries.
- In the future, analysis may split into typed artifacts such as `codebase-analysis.md` and `product-analysis.md`, but the current workflow keeps `analysis.md` unchanged for compatibility.

## Orchestration Rules

1. Derive or confirm `project-name` before starting.
2. Resolve one canonical `workspace_path` before creating or reading workflow artifacts.
3. Write or update `workflow-status.json` after each stage result.
4. Use artifact paths as primary inputs whenever an upstream artifact exists.
5. Do not skip a step unless the workflow rules explicitly allow it.
6. Do not advance if the current stage fails its success criteria.
7. Prefer each artifact's `## Summary (for downstream agents)` section first, then read the full artifact where needed.
8. Preserve stable IDs and mappings:
   - PRD requirement IDs
   - UX flow names
   - story IDs
9. Review is required before calling the workflow production-ready.

## Stage Result Mapping

Stage 1: `product-to-spec`
- `APPROVED` → continue to `bootstrap`
- `CHANGES_REQUESTED` → rerun routed spec stages, then rerun `spec-reviewer`
- `BLOCKED` → stop with top-level `BLOCKED`

Stage 2: `bootstrap`
- `COMPLETE` or `COMPLETE_NOOP` → continue to `spec-to-code`
- `BLOCKED` → stop with top-level `BLOCKED`

Stage 3: `spec-to-code`
- `COMPLETE` → top-level `COMPLETE`
- `INCOMPLETE_TASKS_PENDING` → continue `implementation-runner`
- `INCOMPLETE_VALIDATION_FAILED` → run `remediation-routing`, then re-enter implementation
- `INCOMPLETE_REMEDIATION_PENDING` → run `remediation-routing`, then re-enter implementation
- `BLOCKED` → stop with top-level `BLOCKED`

## Execution Outcome

The composed workflow is successful only when:
- specification review approved the spec set
- bootstrap produced `bootstrap.md` with `COMPLETE` or `COMPLETE_NOOP`
- `spec-to-code` reached a non-blocked implementation outcome with runtime evidence and review completion
- `workflow-status.json` is updated to `COMPLETE`

If validation or review fails downstream, route through `remediation-routing` and re-enter `spec-to-code` rather than skipping back to ad hoc coding.
