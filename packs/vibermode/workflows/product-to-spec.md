# Workflow: Product to Spec

> Canonical specification-stage workflow for turning a raw idea into implementation-ready stories that are reviewed before coding begins.

## Pipeline

```text
idea → brainstorm → PRD → UX → stories → spec-review
```

## Step 1 — Brainstorm

Role:
`packs/vibermode/roles/product/brainstormer.md`

Purpose:
Explore solution directions and choose a clear product direction.

Inputs:
- raw product idea
- optional: `docs/[project-name]/analysis.md`
- optional constraints

Outputs:
- `docs/[project-name]/brainstorm.md`

Success Criteria:
- clear problem framing
- recommended direction chosen
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

Outputs:
- `docs/[project-name]/prd.md`

Success Criteria:
- P0 requirements are explicit and testable
- requirement IDs are stable
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

Outputs:
- `docs/[project-name]/ux.md`

Success Criteria:
- primary flows use the canonical UX flow structure
- PRD requirement references are preserved
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
Validate that brainstorm, PRD, UX, and stories are aligned, testable, adaptable to the target stack, and ready for task planning.

Inputs:
- optional: `docs/[project-name]/brainstorm.md`
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- optional: `docs/[project-name]/analysis.md`

Outputs:
- `docs/[project-name]/spec-review.md`

Success Criteria:
- verdict is explicit
- findings cite artifacts and concrete weaknesses
- rerun routing identifies which upstream stage must change when the verdict is not approved
- weak or contradictory specs do not silently pass into task planning

Next Step:
- stop here for specification-only workflows when `APPROVED`
- rerun the routed specification stages automatically when `CHANGES_REQUESTED`
- continue with `bootstrap` or `spec-to-code` only when `APPROVED`

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
