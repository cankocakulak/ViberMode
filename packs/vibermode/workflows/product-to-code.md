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
- If Stage 1 reaches `BLOCKED`, the composed workflow is blocked and later stages must not run.
- Stage 2 must establish one canonical workspace path plus a reusable runnable baseline before implementation begins.
- If Stage 2 reaches `BLOCKED`, Stage 3 must not run.
- All stages must resolve artifacts relative to the same canonical target repo or workspace root.
- The composed workflow should pass forward only stable artifact paths and explicit stage results, not informal chat summaries.

## Artifact Folder Convention

All artifacts live under:

```text
docs/[project-name]/
```

Canonical artifact set for this workflow:

```text
docs/[project-name]/
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
2. Use artifact paths as primary inputs whenever an upstream artifact exists.
3. Do not skip a step unless the workflow rules below explicitly allow it.
4. Do not advance if the current stage fails its success criteria.
5. Prefer each artifact's `## Summary (for downstream agents)` section first, then read the full artifact where needed.
6. Preserve stable IDs and mappings:
   - PRD requirement IDs
   - UX flow names
   - story IDs
7. Review is required before calling the workflow production-ready.

## Execution Outcome

The composed workflow is successful only when:
- specification review approved the spec set
- bootstrap produced a trusted runnable baseline or an explicit no-blocker handoff
- `spec-to-code` reached a non-blocked implementation outcome with runtime evidence and review completion

If validation or review fails downstream, route through `remediation-routing` and re-enter `spec-to-code` rather than skipping back to ad hoc coding.
