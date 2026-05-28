# Workflow: Remediation Routing

> Canonical failure-routing workflow for turning validation, experience review, and final review findings into updated task state.

## Pipeline

```text
validation-report.md and/or experience-review.md and/or review.md → remediation-router → updated tasks/run-state
```

Use this workflow after `spec-to-code` reports validation failure, experience review failure, final review failure, or a runnable blocker that should be reflected in task state.

## Step 1 — Route Failures

Role:
`packs/vibermode/roles/iterate/remediation-router.md`

Purpose:
Apply validator, experience reviewer, or final reviewer routing decisions to `tasks.json` and `run-state.json` so the next implementation run starts from a clean state.

Inputs:
- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- optional: `docs/[project-name]/validation-report.md`
- optional: `docs/[project-name]/experience-review.md`
- optional: `docs/[project-name]/review.md`

Outputs:
- updated `docs/[project-name]/tasks.json`
- updated `docs/[project-name]/run-state.json`
- `docs/[project-name]/remediation.md`

Success Criteria:
- reopened tasks return to `pending`
- follow-up tasks are appended structurally
- `run-state.json` no longer claims reopened tasks are completed
- blocked findings that cannot be routed are explicit

Next Step:
- `implementation-runner`

## Execution Note

- This workflow is intentionally separate from `spec-to-code` so failure routing stays modular.
- `spec-to-code` should produce validator, experience reviewer, or final reviewer findings; `remediation-routing` should mutate task state.
