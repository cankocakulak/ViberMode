# ViberMode Service Map

This document explains how the roles, workflows, adapters, scripts, and operations docs combine into higher-level services.

## Mental Model

ViberMode has three layers:

1. **Canonical contracts** live in `packs/`.
2. **Tool projections** live in `adapters/`.
3. **Runbooks, maps, and historical evidence** live in `docs/`.

Roles are the workers. Workflows are the operating procedures. Services are the useful end-to-end outcomes created by combining workflows.

## Service Overview

| Service | Outcome | Main Entry Workflow | Supporting Workflows |
|---------|---------|---------------------|----------------------|
| Product to Code | Turn a raw idea or product slice into reviewed code in a repo | `product-to-code` | `product-to-spec`, `bootstrap`, `spec-to-code`, `experience-hardening`, `remediation-routing` |
| Existing Repo Change to Release | Turn feedback or requested changes into validated changes, optionally released | `change-to-release` | `change-triager`, `repo-change`, `experience-hardening`, `ios-submit-testflight` or `android-submit-play-internal` when applicable |
| iOS App Factory | Research app ideas, create an iOS repo, implement it, and prepare TestFlight delivery | `daily-ios-app-pipeline` | `app-opportunity-research`, `idea-research-backlog`, `product-to-code`, `ios-submit-testflight` |
| Mobile Store Submission | Upload completed generated mobile apps to internal tester distribution | platform release adapter | `ios-submit-testflight`, `android-submit-play-internal` |
| App Opportunity Research | Produce a market/opportunity research pack without creating a repo | `app-opportunity-research` | `idea-research-backlog` when candidates should enter the private backlog |
| Standalone Repo Toolkit | Investigate, plan, refactor, test, review, or harden a local surface | narrow iterate agents | `scout`, `planner`, `ux-tweaker`, `tester`, `reviewer`, and related iterate roles |

Operational guides are not service workflows, but they explain how Codex operates connected services from this workspace. Start with `docs/operations/codex-operational-capabilities.md` for RevenueCat, iOS, Android, store metadata, reporting, credential boundaries, and evidence capture.

Use-case manifests:

- `docs/use-cases/product-to-code.md`
- `docs/use-cases/existing-repo-change-to-release.md`
- `docs/use-cases/ios-app-factory.md`
- `docs/use-cases/mobile-internal-release.md`
- `docs/use-cases/app-opportunity-research.md`
- `docs/use-cases/generated-app-change-to-testflight.md`

## Product To Code Service

Use this when the input is a raw idea, underdefined feature, or product slice that needs specification before implementation.

```text
idea or product slice
  -> product-to-spec
  -> bootstrap
  -> spec-to-code
  -> experience-hardening when user-facing
  -> remediation-routing when validation or review fails
  -> reviewed code
```

Primary artifacts:

```text
docs/[project-name]/
├── brainstorm.md
├── prd.md
├── ux.md
├── stories.md
├── spec-review.md
├── bootstrap.md
├── tasks.json
├── run-state.json
├── validation-report.md
├── experience-review.md
└── review.md
```

Canonical docs:

- `packs/vibermode/workflows/product-to-code.md`
- `packs/vibermode/workflows/product-to-spec.md`
- `packs/vibermode/workflows/bootstrap.md`
- `packs/vibermode/workflows/spec-to-code.md`

## Existing Repo Change To Release Service

Use this when the repo already exists and the input is feedback, bugs, polish notes, or release-facing changes.

```text
change notes + target repo
  -> change-triager
  -> repo-change
  -> runtime-validator
  -> experience-hardening when user-facing
  -> reviewer
  -> optional release adapter
```

Primary artifacts:

```text
docs/[project-name]/
├── change-brief.md
├── plan.md
├── tasks.json
├── run-state.json
├── validation-report.md
├── experience-review.md
├── review.md
└── change-release-status.json
```

Canonical docs:

- `packs/vibermode/workflows/change-to-release.md`
- `packs/vibermode/workflows/repo-change.md`
- `packs/vibermode/workflows/experience-hardening.md`

## iOS App Factory Service

Use this when the goal is to repeatedly discover app opportunities, create generated iOS repos, run implementation, and prepare internal TestFlight delivery.

```text
market/category inputs
  -> app-opportunity-research
  -> idea-research-backlog
  -> daily-ios-app-pipeline
  -> product-to-code in generated repo
  -> ios-submit-testflight
```

Public ViberMode owns reusable contracts and scripts only. Private state belongs outside the public repo.

Public surface:

```text
packs/vibermode/workflows/app-opportunity-research.md
packs/vibermode/workflows/idea-research-backlog.md
packs/vibermode/workflows/daily-ios-app-pipeline.md
packs/vibermode/workflows/ios-submit-testflight.md
scripts/analyze-app-store-csv.mjs
scripts/research-app-store-gap.mjs
scripts/idea-backlog.mjs
scripts/ios-app-factory-prepare.mjs
scripts/ios-submit-testflight.mjs
```

Private state shape:

```text
app-factory-state/
├── ideas/backlog.json
├── research-runs/
└── factory/runs/
```

Operational docs:

- `docs/operations/app-factory-automation-overview.md`
- `docs/operations/codex-automations.md`
- `docs/operations/app-factory-state.md`
- `docs/operations/mobile-store-submission-model.md`
- `docs/operations/ios-repo-factory-token.md`
- `docs/operations/ios-testflight-submission-guidance.md`
- `docs/operations/android-play-submission-guidance.md`

Note:
The old monolithic `ios-app-store-factory` workflow has been removed. Its responsibilities are now split across `daily-ios-app-pipeline`, `product-to-code`, `experience-hardening`, and `ios-submit-testflight`.

Boundary decisions:

- `docs/architecture/boundary-decisions.md`

## Mobile Store Submission Service

Use this when a generated mobile app already passed implementation, validation, experience review, and final review, and the remaining job is internal tester distribution.

```text
completed generated app run manifest
  -> platform preflight
  -> platform build/export
  -> internal tester upload
  -> same run manifest updated
```

Public surface:

```text
packs/vibermode/roles/product/ios-submitter.md
packs/vibermode/roles/product/android-submitter.md
packs/vibermode/workflows/ios-submit-testflight.md
packs/vibermode/workflows/android-submit-play-internal.md
scripts/ios-submit-testflight.mjs
scripts/android-submit-play-internal.mjs
```

Operational docs:

- `docs/operations/mobile-store-submission-model.md`
- `docs/operations/ios-testflight-submission-guidance.md`
- `docs/operations/android-play-submission-guidance.md`

Platform rule:
iOS can create or ensure more App Store Connect identity through Fastlane when account state allows it. Android requires Play Console bootstrap for app creation, declarations, Play App Signing, and service account access before the API-controlled internal testing upload.

## Operational Capability Guide

Use this when the question is less "which agent should plan this feature?" and more "what can Codex operate for me from this workspace?"

```text
connected service question
  -> read operational capability guide
  -> choose specific runbook
  -> run read/preflight command
  -> prepare local artifacts
  -> mutate external state only when requested and credentialed
  -> record evidence
```

Public surface:

```text
docs/operations/codex-operational-capabilities.md
docs/operations/revenuecat-access.md
docs/operations/ios-testflight-submission-guidance.md
docs/operations/android-play-submission-guidance.md
docs/operations/store-downloads-notion-automation.md
scripts/revenuecat-api.mjs
scripts/ios-submit-testflight.mjs
scripts/android-submit-play-internal.mjs
scripts/store-downloads-to-notion.mjs
```

Boundary rule:
Codex can inspect, prepare, and operate API-backed workflows when credentials exist outside git. It should not silently submit truth-sensitive legal, privacy, age-rating, data-safety, tax, or production rollout declarations.

## Standalone Toolkit

Use these when a full service would be too heavy.

These agents are not subordinate to the app factory. They can be used directly in any repo, and composed workflows reuse them only when a stage needs that specialty.

| Situation | Use |
|----------|-----|
| Understand a module | `scout` |
| Plan a bounded change | `planner` |
| Diagnose UX friction | `ux-investigator` |
| Polish a UI | `ux-tweaker` |
| Split or refactor safely | `modularizer` |
| Check wiring | `integration-auditor` |
| Prove behavior works | `tester` |
| Harden edge states | `surface-hardener` |
| Review code quality | `reviewer` |

## Which Doc To Open First

- Start with this file when you need the big picture.
- Use `docs/use-cases/` when you want the operating path for a concrete outcome.
- Use `docs/reference/decision-tree.md` when you know the situation but not the capability.
- Use `docs/reference/capability-map.md` when you need exact role/workflow descriptions.
- Use `docs/operations/codex-operational-capabilities.md` when you need to understand what Codex can do with connected services and credentials.
- Use `docs/operations/` only when running private automation, app factory, GitHub repo creation, or internal mobile release delivery.
- Use `docs/operations/archive/` only for historical run evidence.
