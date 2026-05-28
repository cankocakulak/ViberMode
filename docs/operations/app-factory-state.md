# App Factory State Repository

Operational notes for the private state repository used by the ViberMode iOS app factory.

For the full stage and automation map, see `docs/operations/app-factory-automation-overview.md`.

## Purpose

Use a private ViberBoyz repo for research outputs, idea backlog, and factory run manifests.

Recommended repo:

```text
ViberBoyz/app-factory-state
```

Recommended local checkout:

```text
/Users/mcan/Documents/Codex/vibermode-state/app-factory-state
```

ViberMode remains public and stores only reusable scripts/workflow definitions. Do not commit secrets or private market research into ViberMode.

## Token

The local GitHub token is stored in macOS Keychain:

```bash
security find-generic-password -a "$USER" -s "viberboyz-gh-token" -w
```

Use it only as an environment variable for the process that needs it:

```bash
GH_TOKEN="$(security find-generic-password -a "$USER" -s "viberboyz-gh-token" -w)" \
node scripts/ios-app-factory-prepare.mjs ...
```

Do not write the token into prompts, repo files, git remotes, or logs.

## Research Data Flow

Standalone app research output should live outside `ideas/backlog.json` until it has been reviewed.

Recommended layout:

```text
sources/
└── app-store/
    └── revenue-pop-growth/
        └── 2026-05-11_2026-05-20_US_Education.csv

research-runs/
└── 2026-05-27/
    └── education-us/
        ├── source-inventory.json
        ├── normalized-apps.jsonl
        ├── clusters.json
        ├── opportunities.json
        ├── gap-research-plant-nature-id.json
        ├── gap-research-plant-nature-id.md
        ├── rejected.json
        ├── decision.md
        └── backlog-candidates.json
```

Analyze a static App Store metric CSV:

```bash
node scripts/analyze-app-store-csv.mjs \
  --input "/Users/mcan/app-factory-state/App Store Top Apps Revenue PoP Growth (May 11, 2026 - May 20, 2026, US), Detailed.csv" \
  --output-dir /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/research-runs/2026-05-27/education-us \
  --source-id app-store-education-revenue-growth-2026-05-11 \
  --market US \
  --category Education
```

This creates a standalone research pack. It does not automatically add ideas to the backlog because a static CSV is directional evidence, not a complete opportunity decision.

Add a live App Store/iTunes gap probe for one top cluster:

```bash
node scripts/research-app-store-gap.mjs \
  --research-dir /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/research-runs/2026-05-27/education-us \
  --cluster "Plant / nature ID" \
  --market US
```

This records live search and public review sources, writes `gap-research-[cluster].json/.md`, and updates `backlog-candidates.json` with reviewable candidate drafts. Review those drafts before upserting anything into `ideas/backlog.json`.

## Backlog Commands

Validate the private backlog:

```bash
node scripts/idea-backlog.mjs validate \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state
```

Preview the next idea:

```bash
node scripts/idea-backlog.mjs select \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state
```

Reserve the next idea:

```bash
node scripts/idea-backlog.mjs select \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state \
  --reserve
```

Upsert a researched idea:

```bash
node scripts/idea-backlog.mjs upsert \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state \
  --idea-file /path/to/idea.json
```

## Factory Preparation

Prepare the next generated iOS repo from the first ready backlog item:

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

`--commit-state` defaults to `--state-sync api`, so the private state repo is updated through the GitHub Contents API. Use `--state-sync git` only when the local checkout can push to the state repo reliably.

Dry run without creating a repo:

```bash
node scripts/ios-app-factory-prepare.mjs \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state \
  --workspace-parent /Users/mcan/Documents/Codex/generated-ios-apps \
  --dry-run
```

## Expected Output

The prepare script reports:

```json
{
  "status": "prepared",
  "run_id": "run-YYYYMMDDHHMMSS-xxxxxx",
  "idea_id": "example",
  "app_name": "Example",
  "repo_url": "https://github.com/ViberBoyz/ios-example-YYYY-MM-DD",
  "clone_url": "https://github.com/ViberBoyz/ios-example-YYYY-MM-DD.git",
  "workspace_path": "/Users/mcan/Documents/Codex/generated-ios-apps/ios-example-YYYY-MM-DD",
  "run_manifest_path": "/Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-YYYYMMDDHHMMSS-xxxxxx.json"
}
```

The run manifest contains a `product_to_code_input` object. The Codex factory automation should use that object to run `packs/vibermode/workflows/product-to-code.md`.

For iOS factory runs, `product_to_code_input.factory_context` references `ViberBoyz/ios-factory-patterns` and requires onboarding, first-value, and upgrade/paywall shell coverage during product-to-code. The generated app should copy and adapt relevant pattern files rather than depending on the pattern repo at runtime.

## TestFlight Submission

After product-to-code completes, Stage 4 may upload a generated app to internal TestFlight:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-YYYYMMDDHHMMSS-xxxxxx.json
```

The plain command runs preflight only. Live Apple-side submission requires:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-YYYYMMDDHHMMSS-xxxxxx.json \
  --submit \
  --commit-state
```

Setup guidance is documented in `docs/operations/ios-testflight-submission-guidance.md`.

## Failure Handling

- Missing `GH_TOKEN`: stop and fix Keychain or environment setup.
- No eligible ideas: Stage 1 research must add or mark an idea `ready`.
- Repo creation failure: verify token permissions for ViberBoyz.
- Clone failure: verify token has contents read access to the generated repo.
- Product-to-code failure: keep the generated repo and run manifest; remediate rather than creating a duplicate repo.
- TestFlight submission failure: keep the generated repo and same run manifest; resolve the `submission.status: blocked` reason and rerun Stage 4.
