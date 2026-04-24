# Workflow: Product to Spec

> Canonical specification-stage workflow for turning a raw idea into implementation-ready stories that are reviewed before coding begins.

## Pipeline

```text
idea → brainstorm → PRD → UX → stories → spec-review
```

## Execution Model

- This workflow is intentionally loop-shaped around `spec-review`.
- When `spec-review.md` returns `CHANGES_REQUESTED`, rerun only the routed upstream stages instead of recreating the whole spec blindly.
- Reruns should consume the previous spec review findings while preserving stable requirement IDs, UX flow names, coverage mapping, and story IDs whenever possible.
- This workflow reaches a terminal state only when `spec-review.md` is `APPROVED` or `BLOCKED`.
- Do not enter bootstrap or task planning until the spec review gate is approved.

## Step 1 — Brainstorm

Role:
`packs/vibermode/roles/product/brainstormer.md`

Purpose:
Explore solution directions and choose a clear product direction.

Inputs:
- raw product idea
- optional: `docs/[project-name]/analysis.md`
- optional constraints or direction bias
- optional prior `docs/[project-name]/spec-review.md` when rerunning

Outputs:
- `docs/[project-name]/brainstorm.md`

Success Criteria:
- clear problem framing
- recommended direction chosen
- constraints and technical bets are explicit
- artifact includes summary and handoff contract

Next Step:
`prd`

## Step 2 — PRD

Role:
`packs/vibermode/roles/product/prd.md`

Purpose:
Turn the chosen direction into a scoped product contract.

Inputs:
- `docs/[project-name]/brainstorm.md`
- optional: `docs/[project-name]/analysis.md`
- optional audience, product context, constraints
- optional prior `docs/[project-name]/spec-review.md` when rerunning

Outputs:
- `docs/[project-name]/prd.md`

Success Criteria:
- P0 requirements are explicit and testable
- requirement IDs are stable
- out-of-scope is clear
- artifact includes summary and handoff contract

Next Step:
`ux-designer`

## Step 3 — UX

Role:
`packs/vibermode/roles/product/ux-designer.md`

Purpose:
Define flows, screens, interactions, copy, and accessibility from the PRD.

Inputs:
- `docs/[project-name]/prd.md`
- optional: `docs/[project-name]/analysis.md`
- optional: `docs/[project-name]/brainstorm.md`
- optional platform or branding context
- optional prior `docs/[project-name]/spec-review.md` when rerunning

Outputs:
- `docs/[project-name]/ux.md`

Success Criteria:
- primary flows use the canonical UX flow structure
- PRD requirement references are preserved
- copy and interaction rules are explicit
- artifact includes summary and handoff contract

Next Step:
`user-stories`

## Step 4 — Stories

Role:
`packs/vibermode/roles/product/user-stories.md`

Purpose:
Convert PRD and UX into independently implementable stories.

Inputs:
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- optional: `docs/[project-name]/analysis.md`
- optional personas or product context
- optional prior `docs/[project-name]/spec-review.md` when rerunning

Outputs:
- `docs/[project-name]/stories.md`

Success Criteria:
- every P0 requirement maps to at least one story
- every primary UX flow maps to at least one story
- every story has ID, dependencies, implementation boundary, and Given/When/Then criteria
- artifact includes coverage map, summary, and handoff contract

Next Step:
`spec-reviewer`

## Step 5 — Spec Review

Role:
`packs/vibermode/roles/iterate/spec-reviewer.md`

Purpose:
Validate that brainstorm, PRD, UX, and stories are aligned, testable, adaptable to the target stack, and ready for bootstrap or task planning.

Inputs:
- optional: `docs/[project-name]/brainstorm.md`
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- optional: `docs/[project-name]/analysis.md`
- optional platform or constraint context for adaptability review

Outputs:
- `docs/[project-name]/spec-review.md`

Success Criteria:
- verdict is explicit
- findings cite artifacts and concrete weaknesses
- rerun routing identifies which upstream stage must change when the verdict is not approved
- weak or contradictory specs do not silently pass into bootstrap or task planning

Next Step:
- stop here for specification-only workflows when `APPROVED`
- rerun the routed specification stages automatically when `CHANGES_REQUESTED`
- continue with `bootstrap` or `spec-to-code` only when `APPROVED`
- stop and report missing critical information when `BLOCKED`

## Artifacts

```text
docs/[project-name]/
├── brainstorm.md
├── prd.md
├── ux.md
├── stories.md
└── spec-review.md
```

## Stop Condition

This workflow is complete only when `stories.md` exists, its coverage map accounts for all P0 requirements and primary UX flows, and `spec-review.md` returns `APPROVED`.
