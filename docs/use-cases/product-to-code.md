# Use Case: Product To Code

## Outcome

Turn a raw product idea or product slice into implementation-ready specs, executable tasks, code changes, validation evidence, and review.

## When To Use

Use this when the input is not just a small local fix and needs product definition before implementation.

Use `repo-change` or `change-to-release` instead when the target repo already exists and the request is bounded feedback or a bug fix.

## Chain

```text
idea or product slice
  -> product-to-spec
  -> bootstrap
  -> spec-to-code
  -> app foundation
  -> core feature build
  -> polish-ready pass
  -> experience-hardening when user-facing
  -> remediation-routing when validation or review fails
  -> reviewed code
```

## Repo Surfaces

Workflows:

- `packs/vibermode/workflows/product-to-code.md`
- `packs/vibermode/workflows/product-to-spec.md`
- `packs/vibermode/workflows/bootstrap.md`
- `packs/vibermode/workflows/spec-to-code.md`
- `packs/vibermode/workflows/experience-hardening.md`
- `packs/vibermode/workflows/remediation-routing.md`

Core roles:

- `brainstormer`
- `prd`
- `ux-designer`
- `user-stories`
- `spec-reviewer`
- `task-planner`
- `implementation-runner`
- `runtime-validator`
- `experience-reviewer`
- `reviewer`

## Automation

No standalone Codex automation currently owns generic product-to-code.

It is used inside:

- `viber-ios-app-factory-manual-runner`

It can also be invoked directly through the Codex skill:

- `viber-product-to-code`

## State Boundaries

Reads:

- public ViberMode source
- optional existing repo
- optional factory run manifest when called by the iOS app factory

Writes:

- target repo code
- target repo `docs/[project-name]/*` artifacts
- optional generated app validation and experience evidence

Must not write:

- private app factory backlog unless the caller is the iOS app factory
- TestFlight/App Store Connect state

## Success

- specs are approved or complete enough for implementation
- bootstrap establishes the runnable target root
- tasks are generated
- implementation loop completes foundation, core, and polish-ready phases for user-facing apps
- `tasks.json` phase gates pass `npm run validate:task-phases` when the run uses phase-aware task planning
- `surface-map.json` exists when a user-facing generated app needs experience review
- runtime validation passes
- experience gate passes or is skipped as not applicable
- final review approves

## Blockers

Stop when:

- workspace root cannot be resolved
- bootstrap cannot establish a runnable baseline
- specs fail review and cannot be routed
- validation fails and remediation cannot resolve it
- required user-facing evidence cannot be captured
