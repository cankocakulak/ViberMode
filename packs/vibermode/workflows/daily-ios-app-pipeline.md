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
- `workspace_root` - local ViberMode workspace root, usually `$VIBERMODE_WORKSPACE_ROOT`
- optional `workspace_parent` - legacy flat parent directory for generated app repos
- `template_owner` - usually `KantAkademi2`
- `template_repo` - usually `ios-boilerplate`
- `destination_owner` - usually `ViberBoyz`
- `GH_TOKEN` - GitHub token with access to create repos and push private state

Optional:

- `date` - override for deterministic repo names
- `statuses` - eligible idea statuses, default `ready`
- `commit_state` - commit and push backlog/run-manifest updates

## Stage 2A - Backlog Selection

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

## Stage 2B - Repo Factory Preparation

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
  --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state \
  --workspace-root $VIBERMODE_WORKSPACE_ROOT \
  --template-owner KantAkademi2 \
  --template-repo ios-boilerplate \
  --destination-owner ViberBoyz \
  --commit-state \
  --state-sync git
```

The manual factory automation should use `--state-sync git` when the local private state checkout can push reliably. API state sync remains available as a fallback, but it may leave the local checkout behind until it is pulled.

Output:

- generated repo URL
- clone URL
- local workspace path
- workspace bundle root
- run manifest path
- product-to-code input block

Success Criteria:

- private repo exists under destination owner
- name collisions are resolved by the template repo script
- repo is cloned locally
- private state repo records the factory run

## Stage 3 - Product To Code

Workflow:

```text
packs/vibermode/workflows/product-to-code.md
```

Purpose:
Use the run manifest's `product_to_code_input` to produce specs, bootstrap, tasks, implementation, validation, experience hardening, review, commit, and push inside the generated app repo.

Required input from run manifest:

```json
{
  "project_name": "ios-example-2026-05-27",
  "workspace_path": "$VIBERMODE_WORKSPACE_ROOT/generated-products/ios-example-2026-05-27/ios-app",
  "repo_url": "https://github.com/ViberBoyz/ios-example-2026-05-27.git",
  "product_idea": "...",
  "repo_mode": "greenfield",
  "platform": "ios",
  "stack": "SwiftUI",
  "workspace_bundle": {
    "root": "$VIBERMODE_WORKSPACE_ROOT/generated-products/ios-example-2026-05-27",
    "layout": "bundle",
    "primary_repo_role": "ios-app",
    "repos": [
      {
        "role": "ios-app",
        "workspace_path": "$VIBERMODE_WORKSPACE_ROOT/generated-products/ios-example-2026-05-27/ios-app",
        "required": true
      }
    ]
  },
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
}
```

After `spec-review.md` approves, apply the runtime topology before bootstrap:

```bash
npm run workspace:topology -- \
  --run-manifest $VIBERMODE_WORKSPACE_ROOT/app-factory-state/factory/runs/run-YYYYMMDDHHMMSS-xxxxxx.json \
  --backend-template-owner "$BACKEND_TEMPLATE_OWNER" \
  --backend-template-repo "$BACKEND_TEMPLATE_REPO" \
  --destination-owner ViberBoyz
```

This command reads the approved runtime topology from the generated repo artifacts, verifies or attaches `ai-services` when configured, records an explicit no-op checkpoint when backend is not required, and provisions `[bundle-root]/backend` only when the topology names a P0 backend trigger.

For iOS factory runs, Stage 3 must treat `factory_context` as part of the product input. The generated app should include:

- app-specific first-launch onboarding
- a first-value/core loop the tester can reach without payment
- an upgrade/paywall shell with honest mock or placeholder purchase handling when real IAP is not wired
- reusable code copied and adapted from `ViberBoyz/ios-factory-patterns` when useful
- optional sibling repos under the same bundle root only when the spec requires them, for example `backend/` or a symlinked `ai-services/`

Stage 3 uses `product-to-code`, whose implementation stage includes a subloop:

```text
functional build -> runtime validation -> experience review -> polish remediation -> revalidation -> repeated experience review -> final review
```

The experience review is still part of product-to-code. It is not the App Store/TestFlight stage.

Automation rule:
- If Stage 3 quality checks fail, the factory automation should re-enter Stage 3 remediation in the same run instead of moving to Stage 4.
- Retry the experience-hardening loop up to 3 times.
- Only stop for human review when the same quality gate still fails after 3 passes or the blocker is not implementable inside the generated repo.

Success Criteria:

- product-to-code reaches `COMPLETE`
- generated app repo passes its validation commands
- `experience-review.md` approves the user-facing app experience or explicitly explains why it is not applicable
- implementation commit is pushed to the generated repo
- run manifest is updated with validation and commit details
- run manifest records structured experience evidence under `product_to_code_result.experience_review`
- onboarding, first-value, and paywall shell coverage is visible in PRD, UX, stories, and tasks for iOS factory runs
- backend sibling repo is provisioned before bootstrap when approved runtime topology names a P0 backend trigger
- onboarding, first-value/core loop, upgrade/paywall shell, keyboard behavior, and small-screen fit are checked before completion for iOS factory runs
- actual screenshot or video files cover onboarding, first value, core loop, and upgrade/paywall shell; UI launch smoke alone is not enough
- onboarding is at least three meaningful steps/screens and not a single plain `List` or form-style explanation

## Stage 4 - App Store/TestFlight

Status:
Internal TestFlight stage is defined in:

```text
packs/vibermode/workflows/ios-submit-testflight.md
```

The daily factory automation should continue to stop after product-to-code unless Stage 4 is explicitly enabled for a completed run manifest.

## Status Rules

- If backlog selection returns no idea, stop without creating a repo.
- If repo creation succeeds but clone fails, keep the idea reserved and mark the factory run `blocked`.
- If product-to-code fails, keep the generated repo and run manifest for remediation.
- Do not create another repo for the same idea until the blocked run is reviewed.
- Do not print or persist tokens.

## Recommended Codex Automation Split

Use two automations:

- `Viber Idea Research` - runs `idea-research-backlog`, updates private backlog.
- `Viber iOS App Factory` - runs this workflow, currently through Stage 3.

The factory automation should be one sequential run, not separate automations for repo creation and implementation, because Stage 3 depends directly on the Stage 2 run manifest.
