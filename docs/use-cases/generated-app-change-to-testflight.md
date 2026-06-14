# Use Case: Generated App Change To TestFlight

## Outcome

Apply actionable change notes to one existing generated iOS app, validate the result, and upload a new internal TestFlight build when release gates pass.

For a known app where the user names the app instead of the repo and manifest paths, prefer `docs/use-cases/app-autopilot.md` as the front door.

## When To Use

Use this when an app already exists and the work starts from change notes, bug reports, polish requests, or release-facing fixes.

Do not use it to create a new app repo or consume the app factory backlog.

## Chain

```text
change-request inbox in generated app repo
  -> change-to-release
  -> change-triager
  -> repo-change
  -> experience-hardening when user-facing
  -> ios-submit-testflight
  -> generated app commit/push
```

## Repo Surfaces

Workflows:

- `packs/vibermode/workflows/change-to-release.md`
- `packs/vibermode/workflows/repo-change.md`
- `packs/vibermode/workflows/experience-hardening.md`
- `packs/vibermode/workflows/ios-submit-testflight.md`

Roles:

- `packs/vibermode/roles/iterate/change-triager.md`
- `packs/vibermode/roles/iterate/change-task-planner.md`
- `packs/vibermode/roles/product/implementation-runner.md`
- `packs/vibermode/roles/iterate/runtime-validator.md`
- `packs/vibermode/roles/iterate/reviewer.md`

Scripts:

- `scripts/ios-submit-testflight.mjs`

Docs:

- `docs/operations/codex-automations.md`
- `docs/operations/ios-testflight-submission-guidance.md`

## Automation

Legacy app-specific Codex automation example:

```text
id: manual-plant-routine-change-to-testflight
name: Manual - Plant Routine Change To TestFlight
status: PAUSED
kind: heartbeat
```

This runner is specific to one local operator's app path and should not be treated as a public framework default. New app-specific runners should call `app-autopilot` and resolve the app by alias.

```text
Use app-autopilot for [app alias]. mode=change-to-release. submit_when_ready=true. release_target=ios-testflight.
```

## State Boundaries

Reads:

- public ViberMode source
- target generated app repo
- `Docs/vibermode/change-request.md` inside the target app
- runtime credentials from environment or Keychain

Writes:

- target app implementation files
- target app `Docs/vibermode/*` workflow artifacts
- target app release manifest
- internal TestFlight upload state

Must not write:

- app factory backlog
- new generated repos
- secrets into the generated app or ViberMode

## Success

- actionable notes are triaged
- scoped changes are implemented
- validation and review pass
- user-facing changes have approved experience evidence
- build number is bumped according to release policy
- TestFlight preflight and upload succeed
- processed notes include commit/build evidence

## Blockers

Stop without mutating when:

- change-request inbox has no actionable notes

Stop before release when:

- validation fails
- experience review is blocked or changes requested
- final review fails
- release manifest cannot satisfy `ios-submit-testflight.mjs` preflight
- signing, Apple, or upload credentials are missing
