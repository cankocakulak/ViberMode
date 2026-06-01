# Decision Tree

This guide helps a developer or tool choose the right ViberMode capability quickly.

If you do not yet understand how the workflows combine into higher-level services, read `docs/architecture/service-map.md` first.

## Surface Rule

- Prefer `primary` capabilities first.
- Use `support` capabilities when you are intentionally inside a stage-gated flow.
- Treat `legacy` capabilities as compatibility-only.

## Start Here

### 1. Are you starting from a raw idea?

- Yes:
  - Use `product-to-spec` if you want specs
  - Use `product-to-code` if you want the full path
- No:
  - Continue below

### 2. Are you working inside an existing repository?

- Yes:
  - Use `change-to-release` when the requested changes should be validated and optionally released or deployed
  - Use `repo-change` for broad repo iteration work without release orchestration
  - Or pick a narrower iterate agent below
- No:
  - Use `bootstrap` or `product-to-spec` depending on whether you need repo prep or spec generation first

## Existing Repo Paths

### I have several feedback notes, bugs, or release-facing requests

- Use `change-triager`
- If the user wants the whole path through validation and release, use `change-to-release`

### I need to understand what this code does

- Use `scout`

### I need to plan before changing anything

- Use `planner`

### I need to review code quality or regressions

- Use `reviewer`

### I need to improve an existing UI

- If the UX direction is already clear:
  - Use `ux-tweaker`
- If the UX problem needs diagnosis first:
  - Use `ux-investigator`

### I need to refactor or split a messy area

- Use `modularizer`

### I need to prove the feature works

- Use `tester`

### I think the feature exists but may not be connected properly

- Use `integration-auditor`

### The happy path works, but edge states are weak

- Use `surface-hardener`

### The app runs, but may feel generic or not ready to test

- Use `experience-reviewer` after `runtime-validator`
- Note:
  - this is a Stage 3 gate for user-facing slices, especially generated iOS apps

## Spec-Driven Paths

### I already have `stories.md` and need tasks

- Use `task-planner`
- Note:
  - this is a `support` capability inside the implementation pipeline, not a general-purpose starting point

### I already have `tasks.json` and need implementation

- Use `implementation-runner`
- Note:
  - this is a `support` capability inside the implementation pipeline, not a broad repo-iteration tool

### I need runtime/build validation after implementation

- Use `runtime-validator`
- Note:
  - use this when you need formal pipeline-grade validation evidence
  - use `tester` instead for narrower ad-hoc verification

### I need a formal review against spec and implementation evidence

- Use `reviewer`

### I need a product-experience gate before final review

- Use `experience-hardening`
- Note:
  - this runs `experience-reviewer`, routes polish findings, and returns to validation before final review

### Validation, experience review, or final review failed and I need to route fixes back into tasks

- Use `remediation-routing`
- Note:
  - this is a `support` workflow used after failed validation or review

## Recommended Combinations

### Bug fix

- `scout -> planner -> implement`

### UX diagnosis and improvement

- `ux-investigator -> ux-tweaker -> tester`

### Safe refactor

- `scout -> modularizer -> implement -> tester`

### Wiring audit

- `integration-auditor -> tester`

### Release-surface hardening

- `surface-hardener -> tester -> reviewer`

### Generated app Stage 3 polish loop

- `runtime-validator -> experience-reviewer -> remediation-routing -> implementation-runner -> runtime-validator -> reviewer`

### Existing product feature with proper artifact trail

- `analyzer -> product-to-spec -> bootstrap -> spec-to-code`

### Existing repo feedback to release

- `change-triager -> repo-change -> experience-hardening -> release adapter`

## Support Capabilities

These are usually not the first capability you reach for, but they matter inside larger flows:

- `bootstrap`
- `change-triager`
- `task-planner`
- `implementation-runner`
- `runtime-validator`
- `experience-reviewer`
- `experience-hardening`
- `spec-reviewer`
- `remediation-router`
- `remediation-routing`
- `change-task-planner`

## Legacy Capabilities

Avoid these for new usage:

- `ralph-converter`
- `ralph-runner`

## Escalation Rule

If a narrow iterate agent starts uncovering a much larger product-definition problem:

- stop treating it as a local tweak
- move up to `product-to-spec`, `repo-change`, or `change-to-release` when release is part of the ask

If a product workflow is too heavy for the task:

- drop down to `planner`, `ux-investigator`, `modularizer`, `tester`, or another narrow iterate capability
