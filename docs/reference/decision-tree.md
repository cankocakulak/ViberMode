# Decision Tree

This guide helps a developer or tool choose the right ViberMode capability quickly.

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
  - Use `repo-change` for broad repo iteration work
  - Or pick a narrower iterate agent below
- No:
  - Use `bootstrap` or `product-to-spec` depending on whether you need repo prep or spec generation first

## Existing Repo Paths

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

### Validation or review failed and I need to route fixes back into tasks

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

### Existing product feature with proper artifact trail

- `analyzer -> product-to-spec -> bootstrap -> spec-to-code`

## Support Capabilities

These are usually not the first capability you reach for, but they matter inside larger flows:

- `bootstrap`
- `task-planner`
- `implementation-runner`
- `runtime-validator`
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
- move up to `product-to-spec` or `repo-change`

If a product workflow is too heavy for the task:

- drop down to `planner`, `ux-investigator`, `modularizer`, `tester`, or another narrow iterate capability
