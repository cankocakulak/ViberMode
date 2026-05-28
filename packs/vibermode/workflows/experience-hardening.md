# Workflow: Experience Hardening

> Stage-3 subflow for turning a runnable implementation into a more thoughtful, testable product surface before final review.

## Fast Path

- Use this after `runtime-validator` has produced `validation-report.md`.
- This workflow belongs inside `spec-to-code`; it is not the top-level App Factory Stage 4.
- Start with `experience-reviewer`.
- If the experience review requests changes, route findings through `remediation-routing`, resume `implementation-runner`, then rerun `runtime-validator` and `experience-reviewer`.
- Only continue to final `reviewer` after experience review returns `APPROVED` or `SKIPPED_NOT_APPLICABLE`.
- For iOS factory runs, onboarding, first-value, upgrade/paywall shell, keyboard behavior, and screenshot evidence are part of the gate.

## Pipeline

```text
runtime evidence + implemented slice
  → experience-reviewer
  → remediation-routing when needed
  → implementation-runner for reopened/follow-up tasks
  → runtime-validator
  → experience-reviewer again
  → final reviewer
```

## Entry Contract

Required:

- `docs/[project-name]/tasks.json`
- `docs/[project-name]/validation-report.md`
- target repo root
- implementation slice or current code diff

Strongly preferred:

- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`
- `docs/[project-name]/stories.md`
- `docs/[project-name]/bootstrap.md`
- `docs/[project-name]/run-state.json`
- screenshot or simulator evidence when the slice has UI
- `factory_context` when the run comes from an app factory manifest

## Step 1 - Experience Review

Role:
`packs/vibermode/roles/iterate/experience-reviewer.md`

Purpose:
Evaluate whether the implemented surface feels specific, usable, and ready for real product testing.

Outputs:

- `docs/[project-name]/experience-review.md`

Success Criteria:

- verdict is explicit
- evidence reviewed is named
- first-value path is assessed
- interaction, visual, copy, edge-state, and accessibility issues are checked
- iOS factory required flows are evaluated when `factory_context.type = ios_app_factory`
- every issue has a task resolution mode

Stage result rules:

- `APPROVED` → continue to final `reviewer`
- `SKIPPED_NOT_APPLICABLE` → continue to final `reviewer`
- `CHANGES_REQUESTED` → run `remediation-routing`
- `BLOCKED` → stop unless the blocker can be routed into tasks safely

## Step 2 - Remediation Routing

Workflow:
`packs/vibermode/workflows/remediation-routing.md`

Purpose:
Convert experience findings into reopened tasks or follow-up implementation tasks.

Inputs:

- `docs/[project-name]/tasks.json`
- optional: `docs/[project-name]/run-state.json`
- `docs/[project-name]/experience-review.md`

Output:

- updated `tasks.json`
- updated `run-state.json` when needed
- `docs/[project-name]/remediation.md`

Routing rules:

- Reopen tasks when the original implemented slice failed its UX contract.
- Create follow-up tasks for separable polish, screenshots, keyboard handling, or paywall/onboarding adaptation.
- Do not mutate PRD, UX, or story intent unless the experience review explicitly found a specification contradiction; route that back to planning/spec review instead.

## Step 3 - Polish Implementation Loop

Role:
`packs/vibermode/roles/product/implementation-runner.md`

Purpose:
Implement the routed experience fixes using the same one-task-per-run execution model as the main implementation loop.

Success Criteria:

- reopened or follow-up tasks are completed one at a time
- task-level validation evidence is recorded
- implementation remains within the routed issue boundaries
- the app still satisfies the original product, UX, and story contracts

Next Step:
After all routed tasks are complete, rerun `runtime-validator`.

## Step 4 - Revalidation and Re-review

Role:
`packs/vibermode/roles/iterate/runtime-validator.md`

Purpose:
Confirm that polish changes did not break the runnable slice and capture refreshed evidence.

Then rerun:
`packs/vibermode/roles/iterate/experience-reviewer.md`

The experience hardening loop is complete only when the new review returns `APPROVED` or `SKIPPED_NOT_APPLICABLE`.

## iOS Factory Gate

For `factory_context.type = ios_app_factory`, do not treat the app as factory-complete until the experience review verifies:

- onboarding is adapted to the app's actual user and use case
- first-value/core loop is reachable before purchase
- paywall or upgrade shell is app-specific and honest about mock purchase handling
- keyboard dismissal and focus behavior are acceptable for text-entry surfaces
- small-screen layouts do not clip or overlap important text/actions
- screenshots or simulator notes cover onboarding, first value, core loop, and upgrade shell when capture is available
- copied pattern code has been adapted rather than left as sample copy or default colors

## Outputs

```text
docs/[project-name]/
├── experience-review.md
├── remediation.md
├── validation-report.md
├── tasks.json
└── run-state.json
```

## Workflow Status Semantics

- `COMPLETE` — experience review approved or skipped as not applicable
- `INCOMPLETE_EXPERIENCE_CHANGES_REQUESTED` — findings were routed and implementation must resume
- `INCOMPLETE_VALIDATION_FAILED` — revalidation failed after polish changes
- `BLOCKED` — the surface cannot be inspected or required app evidence is unavailable

## Design Intent

This workflow makes Stage 3 iterative without turning every product-to-code run into ad hoc prompting. The first implementation pass can build the skeleton, then this gate asks whether the resulting app is worth testing and sends concrete polish work back through structured tasks.
