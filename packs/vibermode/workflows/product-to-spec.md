# Workflow: Product to Spec

> Canonical specification-stage workflow for turning a raw idea into implementation-ready stories.

## Pipeline

```text
idea → brainstorm → PRD → UX → stories
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
- stop here for specification-only workflows
- or continue with `spec-to-code`

## Artifacts

```text
docs/[project-name]/
├── brainstorm.md
├── prd.md
├── ux.md
└── stories.md
```

## Stop Condition

This workflow is complete when `stories.md` exists and its coverage map accounts for all P0 requirements and primary UX flows.
