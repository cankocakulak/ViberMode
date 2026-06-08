# Use Case: Existing Repo Change To Release

## Outcome

Turn user feedback, bug notes, or release-facing change requests into scoped repo changes with validation, experience hardening, review, and optional release.

## When To Use

Use this for existing repositories where the request is already tied to a concrete app or codebase.

Use `generated-app-change-to-testflight.md` when the existing repo is one of the generated iOS apps with a dedicated TestFlight runner.

## Chain

```text
change notes + target repo
  -> change-triager
  -> repo-change
  -> change-task-planner
  -> implementation-runner
  -> runtime-validator
  -> experience-hardening when user-facing
  -> reviewer
  -> optional release adapter
```

## Repo Surfaces

Workflows:

- `packs/vibermode/workflows/change-to-release.md`
- `packs/vibermode/workflows/repo-change.md`
- `packs/vibermode/workflows/experience-hardening.md`
- `packs/vibermode/workflows/remediation-routing.md`

Roles:

- `packs/vibermode/roles/iterate/change-triager.md`
- `packs/vibermode/roles/iterate/planner.md`
- `packs/vibermode/roles/iterate/change-task-planner.md`
- `packs/vibermode/roles/product/implementation-runner.md`
- `packs/vibermode/roles/iterate/runtime-validator.md`
- `packs/vibermode/roles/iterate/reviewer.md`

Release workflow when iOS/TestFlight applies:

- `packs/vibermode/workflows/ios-submit-testflight.md`

Release workflow when Android/Google Play internal testing applies:

- `packs/vibermode/workflows/android-submit-play-internal.md`

## Automation

Generic callable surface:

- Codex skill: `viber-change-to-release`

Current dedicated automation:

- `manual-plant-routine-change-to-testflight`

## State Boundaries

Reads:

- public ViberMode source
- target repo
- change request text or change request file
- optional release policy/manifest

Writes:

- target repo code
- target repo workflow artifacts under that repo's docs folder
- optional release manifest
- optional release target state

Must not write:

- unrelated repositories
- app factory backlog unless the target workflow explicitly says so
- secrets into docs or commits

## Success

- change brief separates must-fix, should-improve, blockers, and out-of-scope items
- plan and tasks stay inside the accepted scope
- implementation and validation complete
- user-facing experience is approved or not applicable
- final review approves
- release adapter runs only after gates pass

## Blockers

Stop when:

- requested notes are too vague to scope safely
- validation fails
- experience review cannot be routed to concrete tasks
- final review finds blocking regressions
- release credentials or platform requirements are missing
