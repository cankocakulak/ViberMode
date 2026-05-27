# Workflow: Daily iOS App Pipeline

> Top-level factory workflow that consumes a private idea backlog, creates an iOS repository, and runs the implementation pipeline.

## Pipeline

```text
private backlog selection -> template repo generation -> workspace acquisition -> product-to-code -> validation/push -> later TestFlight
```

Stage 1 research is intentionally separate. This workflow starts from the highest-priority `ready` idea already recorded in the private state repo.

## Source of Truth

Public definitions and scripts:

```text
ViberMode/
├── scripts/idea-backlog.mjs
├── scripts/ios-app-factory-prepare.mjs
├── scripts/github-create-template-repo.mjs
├── scripts/acquire-workspace.mjs
└── packs/vibermode/workflows/product-to-code.md
```

Private state:

```text
ViberBoyz/app-factory-state
├── ideas/backlog.json
└── factory/runs/
```

Secrets stay in the automation runtime, not in ViberMode or generated repos.

Reusable iOS implementation patterns:

```text
ViberBoyz/ios-factory-patterns
```

This private repo stores copy-and-adapt SwiftUI patterns for onboarding, app routing, and paywall shells. It is referenced from the factory preparation run manifest and consumed during product-to-code.

## Entry Contract

The orchestrator must resolve:

- `state_root` - private state repo checkout
- `workspace_parent` - local parent directory for generated app repos
- `template_owner` - usually `KantAkademi2`
- `template_repo` - usually `ios-boilerplate`
- `destination_owner` - usually `ViberBoyz`
- `GH_TOKEN` - GitHub token with access to create repos and push private state

Optional:

- `date` - override for deterministic repo names
- `statuses` - eligible idea statuses, default `ready`
- `commit_state` - commit and push backlog/run-manifest updates

## Stage 0 - Backlog Selection

Script:

```text
scripts/idea-backlog.mjs
```

Purpose:
Select and reserve the highest-priority eligible idea from `ideas/backlog.json`.

Output:

- `run_id`
- `idea_id`
- `project_name`
- `repo_name`
- `app_name`
- `bundle_id`
- `product_idea`

Success Criteria:

- backlog validates
- one eligible idea is selected
- selected idea is marked `reserved`

## Stage 1 - Factory Preparation

Script:

```text
scripts/ios-app-factory-prepare.mjs
```

Purpose:
Create the private iOS repo from the template, clone it locally, and write a run manifest for implementation.

The script composes:

```text
idea-backlog select -> github-create-template-repo -> acquire-workspace -> factory/runs/[run-id].json
```

Command shape:

```bash
GH_TOKEN="$GH_TOKEN" node scripts/ios-app-factory-prepare.mjs \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state \
  --workspace-parent /Users/mcan/Documents/Codex/generated-ios-apps \
  --template-owner KantAkademi2 \
  --template-repo ios-boilerplate \
  --destination-owner ViberBoyz \
  --commit-state
```

`--commit-state` syncs `ideas/backlog.json` and the run manifest to the private state repo through the GitHub Contents API by default. Use `--state-sync git` only in automation environments where the state checkout can push reliably.

Output:

- generated repo URL
- clone URL
- local workspace path
- run manifest path
- product-to-code input block

Success Criteria:

- private repo exists under destination owner
- name collisions are resolved by the template repo script
- repo is cloned locally
- private state repo records the factory run

## Stage 2 - Product to Code

Workflow:

```text
packs/vibermode/workflows/product-to-code.md
```

Purpose:
Use the run manifest's `product_to_code_input` to produce specs, bootstrap, tasks, implementation, validation, review, commit, and push inside the generated app repo.

Required input from run manifest:

```json
{
  "project_name": "ios-example-2026-05-27",
  "workspace_path": "/Users/mcan/Documents/Codex/generated-ios-apps/ios-example-2026-05-27",
  "repo_url": "https://github.com/ViberBoyz/ios-example-2026-05-27.git",
  "product_idea": "...",
  "repo_mode": "greenfield",
  "platform": "ios",
  "stack": "SwiftUI",
  "factory_context": {
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
}
```

For iOS factory runs, Stage 2 must treat `factory_context` as part of the product input. The generated app should include:

- app-specific first-launch onboarding
- a first-value/core loop the tester can reach without payment
- an upgrade/paywall shell with honest mock or placeholder purchase handling when real IAP is not wired
- reusable code copied and adapted from `ViberBoyz/ios-factory-patterns` when useful

Success Criteria:

- product-to-code reaches `COMPLETE`
- generated app repo passes its validation commands
- implementation commit is pushed to the generated repo
- run manifest is updated with validation and commit details
- onboarding, first-value, and paywall shell coverage is visible in PRD, UX, stories, and tasks for iOS factory runs

## Stage 3 - App Store/TestFlight

Status:
Future stage. It should not run until signing, App Store Connect API key handling, metadata policy, privacy answers, screenshots, and TestFlight upload are repeatable.

## Status Rules

- If backlog selection returns no idea, stop without creating a repo.
- If repo creation succeeds but clone fails, keep the idea reserved and mark the factory run `blocked`.
- If product-to-code fails, keep the generated repo and run manifest for remediation.
- Do not create another repo for the same idea until the blocked run is reviewed.
- Do not print or persist tokens.

## Recommended Codex Automation Split

Use two automations:

- `Viber Idea Research` - runs `idea-research-backlog`, updates private backlog.
- `Viber iOS App Factory` - runs this workflow, currently through Stage 2.

The factory automation should be one sequential run, not separate automations for repo creation and implementation, because Stage 2 depends directly on Stage 1 outputs.
