# Workflow: Product to Code

> Canonical production workflow for taking a raw product idea through definition, design, story slicing, implementation, and review using ViberMode roles.

## Pipeline Overview

This workflow is the default path for a new product idea:

```text
idea → brainstorm → PRD → UX → stories → task conversion → implementation → review
```

Canonical role order:

```text
Brainstormer → PRD → UX Designer → User Stories → Ralph Converter → Ralph Runner ↺ → Reviewer
```

This workflow is deterministic:
- each step reads explicit inputs
- each step writes a named artifact
- each step has success criteria before the next step can begin
- downstream agents rely on artifacts, not chat history

## Workflow Scope

Use this workflow when:
- starting from a raw idea
- defining a new feature or product slice
- preparing implementation-ready work with stable artifact handoffs

Do not use this workflow when:
- you only need codebase discovery first
- the task is a small bug fix or isolated iteration task

For existing-product work that requires codebase discovery, run `analyzer` first and then enter this workflow at Step 1 with `analysis_artifact`.

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
├── prd.json
├── progress.txt
└── review.md
```

Notes:
- `progress.txt` is produced during repeated `ralph-runner` execution.
- `architecture.md` is not part of the canonical first production workflow because there is no dedicated architect role in the current system.
- If an external architecture step is inserted later, it should consume `prd.md`, `ux.md`, and `stories.md` without changing IDs or boundaries.

## Orchestration Rules

1. Derive or confirm `project-name` before starting.
2. Use artifact paths as primary inputs whenever an upstream artifact exists.
3. Do not skip a step unless the workflow rules below explicitly allow it.
4. Do not advance if the current step fails its success criteria.
5. Prefer each artifact's `## Summary (for downstream agents)` section first, then read the full artifact where needed.
6. Preserve stable IDs and mappings:
   - PRD requirement IDs
   - UX flow names
   - story IDs
7. Review is required before calling the workflow production-ready.

## Step 1 — Brainstorm

Role:
`.agents/roles/product/brainstormer.md`

Purpose:
Explore solution directions for a raw idea and choose a clear product direction.

Inputs:
- user goal or raw product idea
- optional: `docs/[project-name]/analysis.md`
- optional constraints: audience, budget, timing, platform

Outputs:
- `docs/[project-name]/brainstorm.md`

Success Criteria:
- problem framing is clear
- one recommended direction is chosen
- constraints and technical bets are explicit
- artifact includes `## Summary (for downstream agents)`
- artifact includes `## Handoff Contract`

Next Step:
`prd`

## Step 2 — PRD

Role:
`.agents/roles/product/prd.md`

Purpose:
Turn the selected brainstorm direction into a scoped, testable product contract.

Inputs:
- `docs/[project-name]/brainstorm.md`
- optional: `docs/[project-name]/analysis.md`
- optional audience, business context, constraints

Outputs:
- `docs/[project-name]/prd.md`

Success Criteria:
- problem and solution are explicit
- P0 requirements are defined and testable
- requirement IDs are stable
- out-of-scope section is clear
- artifact includes `## Summary (for downstream agents)`
- artifact includes `## Handoff Contract`

Next Step:
`ux-designer`

## Step 3 — UX

Role:
`.agents/roles/product/ux-designer.md`

Purpose:
Translate the PRD into user flows, screens, interactions, copy, and accessibility requirements.

Inputs:
- `docs/[project-name]/prd.md`
- optional: `docs/[project-name]/brainstorm.md`
- optional: `docs/[project-name]/analysis.md`
- optional platform or branding context

Outputs:
- `docs/[project-name]/ux.md`

Success Criteria:
- primary flows are defined using the canonical flow structure
- screens and components are tied to flows
- PRD requirement references are preserved
- copy and interaction rules are explicit
- artifact includes `## Summary (for downstream agents)`
- artifact includes `## Handoff Contract`

Next Step:
`user-stories`

## Step 4 — Stories

Role:
`.agents/roles/product/user-stories.md`

Purpose:
Break the PRD and UX into independently implementable stories.

Inputs:
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- optional: `docs/[project-name]/analysis.md`
- optional personas or product context

Outputs:
- `docs/[project-name]/stories.md`

Success Criteria:
- every P0 PRD requirement maps to at least one story
- every primary UX flow maps to at least one story
- each story has:
  - stable story ID
  - Given/When/Then acceptance criteria
  - Dependencies
  - Implementation Boundary
- stories are independently implementable or explicitly flagged for splitting
- artifact includes `## Coverage Map`
- artifact includes `## Summary (for downstream agents)`
- artifact includes `## Handoff Contract`

Next Step:
`ralph-converter`

## Step 5 — Task Conversion

Role:
`.agents/roles/product/ralph-converter.md`

Purpose:
Convert the story artifact into a machine-readable task list for deterministic implementation.

Inputs:
- `docs/[project-name]/stories.md`
- `docs/[project-name]/prd.md`
- optional: `docs/[project-name]/ux.md`
- optional: `docs/[project-name]/analysis.md`

Outputs:
- `docs/[project-name]/prd.json`

Success Criteria:
- all stories are represented in `prd.json`
- oversized stories are split without losing references
- story ordering respects dependency chain
- `notes` preserve dependencies, implementation boundaries, PRD refs, and UX refs
- first implementation target is obvious
- artifact handoff points to `ralph-runner`

Next Step:
`ralph-runner`

## Step 6 — Implementation Loop

Role:
`.agents/roles/product/ralph-runner.md`

Purpose:
Implement one story at a time while preserving story boundaries and updating implementation state.

Inputs:
- `docs/[project-name]/prd.json`
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- optional: `docs/[project-name]/analysis.md`
- optional: `progress.txt`

Outputs:
- code changes
- updated `docs/[project-name]/prd.json`
- updated `progress.txt`

Success Criteria:
- exactly one story is implemented per run
- acceptance criteria for that story are satisfied
- story boundaries are respected
- quality checks pass before commit
- completed story is marked `passes: true`
- progress is appended for the next run

Next Step:
- `ralph-runner` again if incomplete stories remain
- `reviewer` when the target implementation slice is complete or ready for validation

## Step 7 — Review

Role:
`.agents/roles/iterate/reviewer.md`

Purpose:
Validate the implementation against product, UX, and story contracts before sign-off.

Inputs:
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- implementation artifact or code diff under review
- optional contextual notes or standards

Outputs:
- `docs/[project-name]/review.md`

Success Criteria:
- review evaluates spec compliance against PRD, UX, and Stories
- verdict is explicit: APPROVED, CHANGES_REQUESTED, or BLOCKED
- issues cite files and lines
- fixes or verification steps are actionable

Next Step:
- done if `APPROVED`
- return to `ralph-runner` or implementation work if `CHANGES_REQUESTED`

## Artifact Flow

Primary artifact chain:

```text
raw idea
  ↓
brainstorm.md
  ↓
prd.md
  ↓
ux.md
  ↓
stories.md
  ↓
prd.json
  ↓
implementation + progress.txt
  ↓
review.md
```

Contract flow:

```text
brainstorm.md
  carries selected direction, constraints, and open questions

prd.md
  carries stable requirement IDs, P0 scope, and primary flows expected

ux.md
  carries flow definitions, screen references, copy, and accessibility rules

stories.md
  carries story IDs, requirement/flow coverage, dependencies, and implementation boundaries

prd.json
  carries implementation ordering and one-story-at-a-time execution state

review.md
  carries the production validation result
```

## Deterministic Execution Notes

For orchestrators:

- Start with Step 1 unless `brainstorm.md` already exists and is accepted.
- Before each step, verify required input artifacts exist.
- After each step, verify success criteria before continuing.
- Never infer missing upstream context from memory when the artifact should exist.
- Use the artifact summaries for routing and quick checks.
- Use full artifacts for decisions that affect scope, IDs, or implementation boundaries.

## Minimal Skip Rules

Allowed skips:

- Skip Step 1 only if a valid `brainstorm.md` already exists.
- Skip Step 3 only if the feature is explicitly backend-only and the PRD handoff allows going straight to stories.
- Skip directly to Step 7 only for re-review of already implemented work.

Not allowed:

- Skipping PRD for a raw idea
- Writing stories without PRD
- Writing user-facing stories without UX
- Implementing directly from brainstorm or PRD when `stories.md` should exist

## Future Workflow Candidates

Likely next workflows:

- `existing-codebase-feature`
  - `analyzer → brainstormer or prd → ux-designer → user-stories → implementation → review`
- `product-spec-only`
  - `brainstormer → prd → ux-designer → user-stories`
- `implementation-review-only`
  - `reviewer` against existing PRD, UX, Stories, and code changes
- `architecture-augmented-product-to-code`
  - same workflow plus a future architect role between stories and conversion

The current `product-to-code` workflow should remain the canonical default until an architect role exists and proves necessary.
