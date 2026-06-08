# App Factory Automation Overview

This document is the handoff map for the ViberMode iOS app factory. It summarizes the intended stages, state boundaries, current automations, and the Stage 4 internal TestFlight submission path.

## Repositories

```text
ViberMode
```

Public source of truth for reusable workflow definitions, roles, scripts, and operational docs. Do not store secrets or private research data here.

```text
ViberBoyz/app-factory-state
```

Private state repository for research outputs, ranked ideas, and factory run manifests.

```text
ViberBoyz/ios-*
```

Generated private iOS app repositories created from the template.

```text
ViberBoyz/ios-factory-patterns
```

Private copy-and-adapt pattern catalog for generated SwiftUI apps. It currently contains onboarding, paywall shell, and app-routing patterns distilled from existing apps.

```text
KantAkademi2/ios-boilerplate
```

Template repository used by the repo factory.

## Local Paths

```text
/Users/mcan/ViberMode
/Users/mcan/ViberMode/.vibermode-state/app-factory-state
/Users/mcan/ViberMode/.vibermode-generated-ios-apps
```

GitHub token lookup:

```bash
security find-generic-password -s "viberboyz-gh-token" -w
```

The token may be loaded into `GH_TOKEN` for one process. Automation prompts first source `/Users/mcan/ViberMode/.vibermode-automation.env` when present, then fall back to Keychain. Secrets must not be written to prompts, files, remotes, or logs.

## Stage Map

### Stage 1 - App Opportunity Research

Purpose:
Find and rank app ideas before any app repo is created.

Public ViberMode surfaces:

- `packs/vibermode/roles/product/app-researcher.md`
- `packs/vibermode/workflows/app-opportunity-research.md`
- `packs/vibermode/workflows/idea-research-backlog.md`
- `scripts/analyze-app-store-csv.mjs`
- `scripts/research-app-store-gap.mjs`
- `scripts/idea-backlog.mjs`

Private state outputs:

```text
research-runs/YYYY-MM-DD/[category-or-theme]/
├── source-inventory.json
├── normalized-apps.jsonl
├── clusters.json
├── opportunities.json
├── gap-research-[cluster].json
├── gap-research-[cluster].md
├── rejected.json
├── decision.md
└── backlog-candidates.json

ideas/backlog.json
```

Current behavior:

- Static App Store CSV exports are ingested as directional metric evidence.
- Top clusters are scored by demand, revenue, growth, engagement, competition gap, buildability, novelty, and risk.
- Live App Store/iTunes search and public review RSS are used as a first-pass gap probe.
- `ready` candidates require category, cluster, sources, competitors, metric snapshot, specific gap, MVP wedge, why-now, and a product-to-code-ready prompt.
- Research output can be committed without changing `ideas/backlog.json`; backlog upsert is a separate reviewed step.

Recent test output:

```text
research-runs/2026-05-27/education-us/
```

Remote state commit:

```text
ViberBoyz/app-factory-state@6490428405fda7982377c4256ed20b37e6d7e425
```

The current candidate draft from that run is `local-plant-care-log` / `Plant Routine`.

### Stage 2 - Repo Factory Preparation

Purpose:
Reserve the next ready idea, create a private iOS repo from the template, clone it locally, and write a factory run manifest.

Public ViberMode surfaces:

- `packs/vibermode/workflows/daily-ios-app-pipeline.md`
- `scripts/ios-app-factory-prepare.mjs`
- `scripts/github-create-template-repo.mjs`
- `scripts/acquire-workspace.mjs`
- `scripts/idea-backlog.mjs`

Command shape:

```bash
set -a
[ -f /Users/mcan/ViberMode/.vibermode-automation.env ] && . /Users/mcan/ViberMode/.vibermode-automation.env
set +a
GH_TOKEN="${GH_TOKEN:-$(security find-generic-password -s "viberboyz-gh-token" -w 2>/dev/null || true)}" \
node scripts/ios-app-factory-prepare.mjs \
  --state-root /Users/mcan/ViberMode/.vibermode-state/app-factory-state \
  --workspace-parent /Users/mcan/ViberMode/.vibermode-generated-ios-apps \
  --template-owner KantAkademi2 \
  --template-repo ios-boilerplate \
  --destination-owner ViberBoyz \
  --commit-state
```

Private state outputs:

```text
factory/runs/run-YYYYMMDDHHMMSS-xxxxxx.json
ideas/backlog.json
```

The run manifest contains `product_to_code_input`, which is the handoff object for Stage 3.

For iOS ideas, `product_to_code_input` also includes `factory_context`:

```json
{
  "type": "ios_app_factory",
  "distribution_target": "testflight",
  "pattern_repo": {
    "full_name": "ViberBoyz/ios-factory-patterns",
    "ref": "main",
    "catalog_path": "catalog.json"
  },
  "required_flows": [
    "onboarding",
    "first_value_moment",
    "upgrade_paywall_shell"
  ],
  "stage3_quality_gate": {
    "workflow": "packs/vibermode/workflows/experience-hardening.md",
    "required_artifact": "docs/[project-name]/experience-review.md",
    "min_onboarding_steps": 3,
    "required_visual_evidence": {
      "type": "screenshot_or_video_files",
      "flows": [
        "onboarding",
        "first_value_moment",
        "core_loop",
        "upgrade_paywall_shell"
      ]
    }
  }
}
```

### Stage 3 - Product To Code

Purpose:
Use the generated repo and run manifest to run ViberMode product-to-code, validate the app, commit, push, and update factory state.

Public ViberMode surfaces:

- `packs/vibermode/workflows/product-to-code.md`
- `packs/vibermode/workflows/product-to-spec.md`
- `packs/vibermode/workflows/spec-to-code.md`
- `packs/vibermode/workflows/experience-hardening.md`
- `packs/vibermode/workflows/bootstrap.md`

Inputs:

```text
factory/runs/[run-id].json
generated repo workspace_path
product_to_code_input
product_to_code_input.factory_context
```

Expected outputs:

- implementation commit pushed to the generated iOS repo
- validation evidence recorded in the generated repo
- experience review evidence recorded in the generated repo
- structured experience evidence recorded in `factory/runs/[run-id].json` under `product_to_code_result.experience_review`
- `factory/runs/[run-id].json` updated with build, validation, and commit details
- `ideas/backlog.json` updated to reflect progress
- iOS factory apps include onboarding, a testable first-value/core loop, and a paywall shell using `ViberBoyz/ios-factory-patterns` when useful

Internal Stage 3 shape:

```text
3A functional build -> 3B runtime validation -> 3C experience review -> 3D polish remediation loop -> 3E final review
```

The experience review is a Stage 3 quality gate. It should catch default-looking onboarding, shallow paywall shells, missing keyboard dismissal, weak first-value flow, small-screen layout problems, and missing screenshot/video evidence before the generated repo is considered complete. UI launch smoke is not enough visual evidence for iOS factory completion.

Current status:
This stage has been tested manually through generated repos. The manual factory automation is configured to continue to Stage 4 only after Stage 3 runtime validation, experience review, and final review gates pass.

### Stage 4 - App Store Connect / TestFlight

Purpose:
Archive the generated iOS app, handle signing, create or update the App Store Connect app record, upload a build, and produce a TestFlight-ready result.

Current status:
Internal TestFlight submission is implemented as the Stage 4 delivery target. The manual factory automation runs Stage 4 after Stage 3 succeeds, with preflight before live upload.

Public ViberMode surfaces:

- `packs/vibermode/roles/product/ios-submitter.md`
- `packs/vibermode/workflows/ios-submit-testflight.md`
- `scripts/ios-submit-testflight.mjs`
- `docs/operations/mobile-store-submission-model.md`
- `docs/operations/ios-testflight-submission-guidance.md`

Expected inputs:

- generated repo workspace path
- run manifest path
- bundle ID and app name
- unique App Store Connect app name when the in-app display name is unavailable
- Apple team ID
- signing configuration
- App Store Connect API key material from secure runtime storage
- app metadata, privacy answers, screenshots, icon, and TestFlight notes

Expected private state updates:

```json
{
  "submission": {
    "status": "submitted",
    "app_store_connect_app_id": "...",
    "bundle_id": "...",
    "build_number": "...",
    "testflight_url": "...",
    "uploaded_at": "..."
  }
}
```

Stage 4 should not create a new repo. It should consume the Stage 2/3 run manifest and update the same factory run.

The first version is preflight-by-default. A plain run validates credentials, Xcode/Fastlane availability, generated workspace, scheme, app name, and bundle ID. Live Apple-side work requires `--submit`:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/ViberMode/.vibermode-state/app-factory-state/factory/runs/[run-id].json \
  --submit \
  --commit-state
```

Default Keychain services:

```text
viberboyz-apple-team-id
viberboyz-asc-key-id
viberboyz-asc-issuer-id
viberboyz-asc-api-key-p8-b64
viberboyz-apple-id
viberboyz-asc-team-id (optional)
```

The live path uses Fastlane `produce` to create or ensure the App Store Connect app when possible, `xcodebuild archive`, `xcodebuild -exportArchive`, and Fastlane `pilot upload` with `distribute_external=false`.

Operator setup and run guidance lives in `docs/operations/ios-testflight-submission-guidance.md`.

Stage 4 should also carry `submission_metadata` in the run manifest. Internal TestFlight can proceed with only app name, bundle ID, icon readiness, signing, and "what to test" notes, but App Store review later needs description, subtitle, keywords, support URL, privacy policy URL, storefronts, price posture, screenshots, privacy answers, and compliance answers.

### Android Stage 4 Extension - Google Play Internal Testing

Purpose:
Upload a completed generated Android app to Google Play internal testing after Play Console bootstrap is complete.

Current status:
The Android release adapter exists as a preflight-first and `--submit`-guarded path. It is ready for controlled use after a generated Android template, signing configuration, and Play Console bootstrap are available.

Public ViberMode surfaces:

- `packs/vibermode/roles/product/android-submitter.md`
- `packs/vibermode/workflows/android-submit-play-internal.md`
- `scripts/android-submit-play-internal.mjs`
- `docs/operations/android-play-submission-guidance.md`
- `docs/operations/mobile-store-submission-model.md`

Expected inputs:

- generated Android repo workspace path
- run manifest path
- app name and Android package name
- approved Stage 3 validation, experience review, and final review evidence
- confirmed Play Console app record, declarations, Play App Signing, and service account access
- Google Play service account JSON from secure runtime storage
- signed release AAB or enough Gradle project structure to build one

Expected private state updates:

```json
{
  "submission": {
    "status": "play_internal_uploaded",
    "distribution": "google_play_internal",
    "package_name": "...",
    "track": "internal",
    "aab_path": "...",
    "uploaded_at": "..."
  }
}
```

Important boundary:
Google Play app creation is not treated as a fully automated Publishing API step. The repo/template side can be automated, but Play Console app creation, required declarations, Play App Signing, and API readiness must be completed and recorded before live upload.

Preflight:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /Users/mcan/ViberMode/.vibermode-state/app-factory-state/factory/runs/[run-id].json
```

Live internal testing upload:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /Users/mcan/ViberMode/.vibermode-state/app-factory-state/factory/runs/[run-id].json \
  --build \
  --submit \
  --confirm-play-console-bootstrap \
  --commit-state
```

## Active Codex Automations

Current automation inventory is also recorded in `docs/operations/codex-automations.md`.

### `viber-idea-research`

Name:
`Manual - Viber Idea Research`

Schedule:
`FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=10;BYMINUTE=0;BYSECOND=0`

Status:
`PAUSED`

Current purpose:
Manual Stage 1 runner. It runs one focused opportunity research pack, validates the backlog, and commits/pushes private state when candidates are upserted.

Important note:
The prompt uses `/Users/mcan/ViberMode/.vibermode-state/app-factory-state` as canonical private state and explicitly ignores the historical `/Users/mcan/Documents/Codex/vibermode-state/app-factory-state` path.

### `viber-ios-app-factory-manual-runner`

Name:
`Manual - Viber iOS App Factory`

Schedule:
`FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=10;BYMINUTE=30;BYSECOND=0`

Status:
`PAUSED`

Current purpose:
Manual Stage 2, Stage 3, and Stage 4 runner. It reserves one ready idea, creates the generated repo, runs product-to-code with Stage 3 quality gates, then runs internal TestFlight submission after Stage 4 preflight passes.

Important note:
Stage 4 is part of this runner. It should not create a second repo or a second manifest.

### `manual-plant-routine-change-to-testflight`

Name:
`Manual - Plant Routine Change To TestFlight`

Schedule:
`FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=10;BYMINUTE=45;BYSECOND=0`

Status:
`PAUSED`

Current purpose:
Manual existing-repo change-to-release runner for the generated Plant Routine app. It reads `Docs/vibermode/change-request.md`, triages actionable notes, implements scoped changes, validates, reviews, bumps build number, and uploads internal TestFlight when release gates pass.

## Recommended Automation Split

Use three manual automations for now:

```text
viber-idea-research
  Stage 1 only
  research -> candidate review/upsert -> private backlog

viber-ios-app-factory-manual-runner
  Stage 2 + Stage 3 + Stage 4
  backlog item -> repo -> implementation -> internal TestFlight

manual-plant-routine-change-to-testflight
  existing generated repo only
  change notes -> implementation -> validation -> internal TestFlight
```

Reasoning:
Stage 1 can run independently and improve the idea list. Stage 2, Stage 3, and Stage 4 are tied to one selected idea and one generated repo, so they share one run manifest. Repo-specific change-to-release runs are separate because they target an already-created app and should not touch the factory backlog.

## State Handoff Rules

- Stage 1 writes research packs and candidate drafts.
- Stage 1 may upsert reviewed candidates into `ideas/backlog.json`.
- Stage 2 reserves one `ready` idea and writes one run manifest.
- Stage 3 consumes that manifest and writes implementation evidence back to it.
- Stage 4 should consume the same manifest and append submission evidence.
- Failed stages should mark the run `blocked`, not create a duplicate repo.
- Secrets stay in Keychain or automation runtime only.

## Manual Triggering Notes

- The automations are intentionally paused so they do not run on wall-clock schedule.
- When manually fired from Codex, the heartbeat prompt treats that firing as the explicit user request to run.
- If GitHub DNS fails but credentials exist, the prompts instruct the run to use the local fallback IP settings supported by the app-factory scripts.
- If credentials or network access are unavailable, the runner should stop before the next mutation boundary and report exactly what did and did not run.
