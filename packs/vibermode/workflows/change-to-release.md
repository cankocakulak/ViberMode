# Workflow: Change to Release

> Controlled existing-repo workflow for turning user-requested changes into validated code and, optionally, a delivery step such as TestFlight.

## Fast Path

- Use this when the repo already exists and the user wants one or more requested changes handled end to end.
- This workflow is not for raw product ideation. Use `product-to-code` when no existing implementation exists.
- Start with `change-triager` when input is a list of notes, feedback, screenshots, or mixed requests.
- Use `repo-change` stages for analysis, planning, tasking, implementation, validation, and final review.
- Run `experience-hardening` for user-facing changes before release.
- Run a release adapter only when `release_target` is explicitly requested.
- Never release when validation, experience review, or final review is blocked.

## Pipeline

```text
change notes + target repo
  → change-triager
  → repo understanding
  → change plan
  → optional bootstrap
  → change-task-planner
  → implementation loop
  → runtime validation
  → experience hardening when user-facing
  → final review
  → optional release adapter
```

## Entry Contract

Required:

- `target_repo` - absolute repo root
- one of:
  - `change_request` - inline user notes, bullets, feedback, screenshots, bug report, or requested improvements
  - `change_request_path` - file containing the same notes

Optional:

- `project_name` - artifact folder slug under `docs/[project-name]/`; default to the target repo directory name
- `artifact_root` - artifact directory; default to `<target_repo>/docs/[project-name]/`
- `release_target` - `none`, `ios-testflight`, `web-deploy`, or custom
- `platform_policy` - `release-only`, `parity-when-shared-native`, or custom; default to `release-only`
- `release_manifest` - platform-specific release state file when needed
- `existing_artifacts` - analysis, plan, validation, review, screenshots, or release state
- `scope` - files, screens, features, or platform slice to constrain the pass

Default `release_target` is `none`.
Default `platform_policy` is `release-only`.

## Per-Repo Run Model

- One workflow invocation targets exactly one repository.
- Run implementation, validation, and release commands from `target_repo`, not from ViberMode, unless ViberMode itself is the target repo.
- If `change_request_path` is relative, resolve it from `target_repo`.
- Recommended notes file: `<target_repo>/docs/[project-name]/change-request.md`.
- Write all generated artifacts into `artifact_root`; do not store per-app run state in ViberMode.
- For multiple apps, create one automation per repo or invoke the same automation separately with a different `target_repo` and `change_request_path`.
- Do not batch multiple repositories into one `change-release-status.json`.
- Treat `release_target` as the delivery target and `platform_policy` as the implementation/validation policy. For example, `release_target=ios-testflight` may still use `platform_policy=parity-when-shared-native` so shared native behavior is checked on Android without requiring Android release.

## Platform Policy

- `release-only`: implement and validate only the platform needed for the release target unless another platform is directly affected.
- `parity-when-shared-native`: for native multi-platform apps, evaluate shared product behavior across native clients. Implement the sibling platform when the change is small, safe, and uses existing APIs. If sibling-platform work is large, risky, or requires separate product decisions, record a parity follow-up instead of blocking the release target.
- Custom policies must explicitly state which platforms can be changed, which must only be checked, and which release adapters are allowed.

Example invocation shape:

```text
target_repo=/absolute/path/to/PlantRoutine
project_name=plant-routine
change_request_path=docs/plant-routine/change-request.md
release_target=ios-testflight
```

## Stage 1 - Change Intake

Role:
`packs/vibermode/roles/iterate/change-triager.md`

Purpose:
Normalize raw notes into a scoped change brief before planning starts.

Inputs:

- target repo root
- change request text or `change_request_path`
- optional release target
- optional existing artifacts

Outputs:

- `docs/[project-name]/change-brief.md`

Success Criteria:

- each input note has an explicit decision: `implement_now`, `needs_user_decision`, `hold`, or `out_of_scope`
- each note has effort, risk, and confidence noted
- a small recommended implementation batch is selected before planning
- must-fix, should-improve, release blockers, and out-of-scope items are separated
- acceptance checks are concrete
- release target is explicit
- next step is clear

Skip rule:
For one small, obvious fix, the orchestrator may skip this stage and enter `repo-change` directly. Do not skip when the request contains multiple bullets or release delivery.

Batch rule:
Only the `Recommended Batch` from `change-brief.md` proceeds into planning. Items marked `needs_user_decision`, `hold`, or `out_of_scope` remain in the status artifact and must not be implemented in the same run.

## Stage 2 - Change Planning And Implementation

Workflow:
`packs/vibermode/workflows/repo-change.md`

Purpose:
Use the existing-repo implementation pipeline without forcing greenfield PRD/UX/story artifacts.

Expected stages:

- repo understanding with `analyzer` or `scout`
- `planner` writes `docs/[project-name]/plan.md`
- optional `bootstrap`
- `change-task-planner` writes `tasks.json`
- `implementation-runner` executes one task per run
- `runtime-validator` writes `validation-report.md`
- `reviewer` writes `review.md`
- `remediation-routing` reopens or appends tasks when validation or review fails

Success Criteria:

- implementation stays within `change-brief.md` and `plan.md`
- tasks are complete
- runtime validation has real command evidence
- final review approves

## Stage 3 - Experience Hardening

Workflow:
`packs/vibermode/workflows/experience-hardening.md`

Purpose:
For UI or user-facing changes, force the same self-critique loop used by app factory runs before release.

Run when:

- the change affects UI, onboarding, paywall, checkout, core app flow, navigation, forms, empty/error states, or any user-visible release surface
- `release_target` is not `none` and the app has a user-facing surface

Skip only when:

- the change is backend-only, CLI-only, infra-only, or otherwise not user-facing

Success Criteria:

- `experience-review.md` is `APPROVED` or explicitly `SKIPPED_NOT_APPLICABLE`
- screenshot/video evidence exists when the change affects a visual surface and the environment can capture it
- experience findings are routed through `remediation-routing`, then implementation and validation repeat

Loop rule:

- Do not stop after the first `CHANGES_REQUESTED`.
- Route findings back into tasks and retry up to 3 experience passes.
- Stop with `BLOCKED` only after 3 failed passes or a non-routable blocker.

## Stage 4 - Release Adapter

Purpose:
Deliver the validated change only after implementation quality gates pass.

Supported release targets:

- `none` - stop after final review
- `ios-testflight` - bump version/build as needed, run TestFlight preflight, archive/export/upload
- `web-deploy` - reserved for Vercel or another web deployment adapter
- `custom` - caller must provide the release command and acceptance criteria

### iOS TestFlight Adapter

Use:
`packs/vibermode/workflows/ios-submit-testflight.md`

Rules:

- require validation, experience review when user-facing, and final review before upload
- bump build number for every upload; bump marketing version only when requested or release policy requires it
- run preflight before live Apple-side work
- never pass `--allow-incomplete` for quality failures
- update the same release/run manifest when one exists

### Web Deploy Adapter

Status:
Reserved skeleton.

Expected future behavior:

- run build/test/lint
- run visual/runtime smoke when applicable
- deploy through a configured provider
- record deployment URL and rollback note

## Workflow Status Artifact

The orchestrator should maintain:

```text
docs/[project-name]/change-release-status.json
```

Minimum shape:

```json
{
  "workflow": "change-to-release",
  "projectName": "[project-name]",
  "targetRepo": "/absolute/path/to/repo",
  "artifactRoot": "/absolute/path/to/repo/docs/[project-name]",
  "changeRequestPath": "/absolute/path/to/repo/docs/[project-name]/change-request.md",
  "releaseTarget": "none",
  "platformPolicy": "release-only",
  "status": "RUNNING",
  "currentStage": "change-intake",
  "stages": {
    "change-intake": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/change-brief.md",
      "verdict": null
    },
    "repo-change": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/review.md",
      "verdict": null
    },
    "experience-hardening": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/experience-review.md",
      "verdict": null
    },
    "release": {
      "status": "PENDING",
      "artifact": null,
      "verdict": null
    }
  },
  "taskLedger": {
    "implementNow": [],
    "needsUserDecision": [],
    "hold": [],
    "outOfScope": [],
    "parityFollowup": [],
    "done": []
  },
  "blockers": [],
  "nextAction": "Run change intake"
}
```

Allowed top-level statuses:

- `RUNNING`
- `COMPLETE`
- `COMPLETE_NO_RELEASE`
- `INCOMPLETE_TASKS_PENDING`
- `INCOMPLETE_VALIDATION_FAILED`
- `INCOMPLETE_EXPERIENCE_CHANGES_REQUESTED`
- `INCOMPLETE_REMEDIATION_PENDING`
- `INCOMPLETE_RELEASE_BLOCKED`
- `BLOCKED`

## Artifact Set

```text
docs/[project-name]/
├── change-request.md
├── change-brief.md
├── analysis.md
├── plan.md
├── bootstrap.md
├── tasks.json
├── run-state.json
├── validation-report.md
├── experience-review.md
├── remediation.md
├── review.md
└── change-release-status.json
```

## Completion Rules

- `COMPLETE_NO_RELEASE` when final review approves and `release_target=none`
- `COMPLETE` when final review approves and the requested release adapter succeeds
- `INCOMPLETE_RELEASE_BLOCKED` when code is ready but release credentials, signing, provider state, or deployment infrastructure blocks delivery
- `BLOCKED` when planning, validation, experience review, or implementation cannot progress safely

## Design Intent

`change-to-release` is the existing-product sibling of `product-to-code`.

- `product-to-code` starts from an idea and creates product/spec artifacts before implementation.
- `repo-change` changes an existing repo without release orchestration.
- `change-to-release` starts from user change requests, uses the existing-repo path, adds experience self-iteration, and optionally delivers the result.
