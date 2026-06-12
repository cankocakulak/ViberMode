# Workflow: Experience Hardening

> Stage-3 subflow for turning a runnable implementation into a more thoughtful, testable product surface before final review.

## Fast Path

- Use this after `runtime-validator` has produced `validation-report.md`.
- This workflow belongs inside `spec-to-code`; it is not the top-level App Factory Stage 4.
- Start with `experience-reviewer`.
- If the experience review requests changes, route findings through `remediation-routing`, resume `implementation-runner`, then rerun `runtime-validator` and `experience-reviewer`.
- Only continue to final `reviewer` after experience review returns `APPROVED` or `SKIPPED_NOT_APPLICABLE`.
- Orchestrators should treat this as a bounded self-iteration loop, not a single report. Re-enter remediation automatically for up to 3 experience passes before stopping for human review.
- For iOS factory runs, onboarding, first-value, upgrade/paywall shell, keyboard behavior, and screenshot evidence are part of the gate.
- For existing-app release runs, launch-only evidence is never enough when the changed surface is behind auth, onboarding, a tab, modal, or another in-app route.

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
- iOS factory runs include actual screenshot or video file paths for onboarding, first value, core loop, and upgrade/paywall shell
- iOS factory runs fail if onboarding is one screen or a raw `List`/form-style explanation
- existing-app release runs fail if changed visual surfaces are not reached in screenshot, video, simulator, or manual evidence

Stage result rules:

- `APPROVED` → continue to final `reviewer`
- `SKIPPED_NOT_APPLICABLE` → continue to final `reviewer`
- `CHANGES_REQUESTED` → run `remediation-routing`
- `INCOMPLETE_AUTHENTICATED_SURFACES` or `INCOMPLETE_UNREACHED_SURFACE` → stop before final review/release unless the blocker can be routed into tasks or setup
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

Helper role:
Use `packs/vibermode/roles/iterate/design-engineer.md` before or during implementation when routed findings are primarily about animation timing, component state feel, gesture behavior, motion performance, or craft-level visual polish.

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

Automation rule:
- Do not stop after the first `CHANGES_REQUESTED` result.
- Convert the findings into tasks, implement them, refresh screenshots/runtime evidence, and rerun this workflow.
- Stop with `BLOCKED` only after 3 failed experience passes, a non-routable environment blocker, or a missing dependency that cannot be fixed inside the generated repo.
- If the changed surfaces could not be reached, write an explicit incomplete verdict and do not downgrade it to a non-blocking note.

## iOS Factory Gate

For `factory_context.type = ios_app_factory`, do not treat the app as factory-complete until the experience review verifies:

- onboarding is adapted to the app's actual user and use case
- onboarding has at least 3 meaningful steps/screens and is not a plain `List` or form
- first-value/core loop is reachable before purchase
- paywall or upgrade shell is app-specific, visually credible, and honest about mock purchase handling
- keyboard dismissal and focus behavior are acceptable for text-entry surfaces
- small-screen layouts do not clip or overlap important text/actions
- screenshot or video files cover onboarding, first value, core loop, and upgrade shell when capture is available
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
