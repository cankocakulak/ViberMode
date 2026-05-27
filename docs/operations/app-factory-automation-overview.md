# App Factory Automation Overview

This document is the handoff map for the ViberMode iOS app factory. It summarizes the intended stages, state boundaries, current automations, and the open Stage 4 submission work.

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
/Users/mcan/Documents/Codex/vibermode-state/app-factory-state
/Users/mcan/Documents/Codex/generated-ios-apps
```

GitHub token lookup:

```bash
security find-generic-password -a "$USER" -s "viberboyz-gh-token" -w
```

The token may be loaded into `GH_TOKEN` for one process. It must not be written to prompts, files, remotes, or logs.

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
GH_TOKEN="$(security find-generic-password -a "$USER" -s "viberboyz-gh-token" -w)" \
node scripts/ios-app-factory-prepare.mjs \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state \
  --workspace-parent /Users/mcan/Documents/Codex/generated-ios-apps \
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
  ]
}
```

### Stage 3 - Product To Code

Purpose:
Use the generated repo and run manifest to run ViberMode product-to-code, validate the app, commit, push, and update factory state.

Public ViberMode surfaces:

- `packs/vibermode/workflows/product-to-code.md`
- `packs/vibermode/workflows/product-to-spec.md`
- `packs/vibermode/workflows/spec-to-code.md`
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
- `factory/runs/[run-id].json` updated with build, validation, and commit details
- `ideas/backlog.json` updated to reflect progress
- iOS factory apps include onboarding, a testable first-value/core loop, and a paywall shell using `ViberBoyz/ios-factory-patterns` when useful

Current status:
This stage has been tested manually through generated repos. The active factory automation is intended to run through this stage only.

### Stage 4 - App Store Connect / TestFlight

Purpose:
Archive the generated iOS app, handle signing, create or update the App Store Connect app record, upload a build, and produce a TestFlight-ready result.

Current status:
Not implemented. The factory automation explicitly stops before this stage.

Expected public ViberMode surfaces to add:

- a role or workflow for iOS submission, for example `ios-submitter`
- a workflow, for example `packs/vibermode/workflows/ios-submit-testflight.md`
- scripts only if repeatable CLI work is needed, for example around `xcodebuild`, `altool` or `notarytool` alternatives, App Store Connect API calls, screenshot generation, and metadata validation

Expected inputs:

- generated repo workspace path
- run manifest path
- bundle ID and app name
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

## Active Codex Automations

### `viber-idea-research`

Name:
`Viber Idea Research`

Schedule:
`FREQ=HOURLY;INTERVAL=24`

Status:
`ACTIVE`

Current purpose:
Run idea research and update private state.

Important note:
The current saved automation prompt predates the new Stage 1 research-pack structure. It should be refreshed after the local ViberMode Stage 1 diff is accepted, so it follows `app-opportunity-research.md`, writes `research-runs/YYYY-MM-DD/[category-or-theme]/`, then upserts only reviewed `ready` candidates into `ideas/backlog.json`.

### `viber-ios-app-factory`

Name:
`Viber iOS App Factory`

Schedule:
`FREQ=HOURLY;INTERVAL=24`

Status:
`ACTIVE`

Current purpose:
Run Stage 2 and Stage 3 sequentially. It creates the generated repo, clones it, runs product-to-code, pushes the generated app repo, and syncs private state.

Important note:
This automation explicitly does not run Stage 4 yet.

## Recommended Automation Split

Use two automations for now:

```text
viber-idea-research
  Stage 1 only
  research -> candidate review/upsert -> private backlog

viber-ios-app-factory
  Stage 2 + Stage 3, later optionally Stage 4
  backlog item -> repo -> implementation -> later TestFlight
```

Reasoning:
Stage 1 can run independently and continuously improve the idea list. Stage 2, Stage 3, and Stage 4 are tied to one selected idea and one generated repo, so they should share a run manifest and be coordinated sequentially.

When Stage 4 is added, the safer first version is a continuation of `viber-ios-app-factory` after Stage 3 succeeds, guarded by an explicit flag or status check. A later split into a third automation is reasonable only if submission needs separate review, retries, or manual approval.

## State Handoff Rules

- Stage 1 writes research packs and candidate drafts.
- Stage 1 may upsert reviewed candidates into `ideas/backlog.json`.
- Stage 2 reserves one `ready` idea and writes one run manifest.
- Stage 3 consumes that manifest and writes implementation evidence back to it.
- Stage 4 should consume the same manifest and append submission evidence.
- Failed stages should mark the run `blocked`, not create a duplicate repo.
- Secrets stay in Keychain or automation runtime only.

## Stage 4 Handoff Prompt

Use this context when starting Stage 4 in a separate chat:

```text
We are extending the ViberMode iOS app factory. Read /Users/mcan/ViberMode/docs/operations/app-factory-automation-overview.md first. Stage 1 research writes private state under ViberBoyz/app-factory-state research-runs and ideas/backlog.json. Stage 2 creates/clones a generated iOS repo and writes factory/runs/[run-id].json. Stage 3 runs product-to-code in that generated repo and updates the same run manifest. Add Stage 4 for App Store Connect/TestFlight submission. Do not store Apple or GitHub secrets in ViberMode or generated repos. Stage 4 must consume an existing generated repo plus factory run manifest, handle signing/App Store Connect metadata safely, upload to TestFlight, and update the run manifest with submission evidence.
```
