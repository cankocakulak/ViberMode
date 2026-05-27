# Workflow: iOS App Store Factory

> Experimental factory workflow for turning an iOS template repository into a generated GitHub repo and, later, an App Store Connect/TestFlight submission.

## Pipeline

```text
template repo generation -> app identity setup -> asset generation -> signing setup -> App Store Connect registration -> archive/build -> TestFlight upload -> metadata/review handoff
```

The first executable slice is repository generation from a GitHub template. ViberMode carries reusable implementation material only:

```text
scripts/github-create-template-repo.mjs
docs/examples/github-actions/daily-ios-repo-factory.yml
```

Do not run the live schedule from the public ViberMode repository. Copy the example workflow into a private automation host, or run the script from a Codex automation environment that injects `GH_TOKEN` securely at runtime.

Token creation and local Keychain setup are documented in:

```text
docs/operations/ios-repo-factory-token.md
```

## Entry Contract

Before running the complete workflow, the orchestrator must resolve these inputs:

- `template_owner` and `template_repo` - GitHub template source, commonly `KantAkademi2/ios-boilerplate`
- `destination_owner` - GitHub user or organization that will own the generated app repo
- `new_repo_name` - generated repository name, defaulting to `ios-app-YYYY-MM-DD` using the Europe/Istanbul date
- `app_name` - App Store display name
- `bundle_id` - iOS bundle identifier
- `team_id` - Apple Developer Team ID
- `app_store_connect_api_key` - CI-safe App Store Connect API key reference
- `GH_TOKEN` - GitHub token with destination repo creation permission

Secrets must be passed through the automation environment. They must not be written into workflow artifacts, logs, generated source files, or chat handoffs.

## Stage 1 - Template Repo Generation

Role:
GitHub Actions workflow plus `scripts/github-create-template-repo.mjs`.

Purpose:
Create a new GitHub repository from the selected iOS template and prove that the automation token can read the template and create repositories in the destination owner.

Inputs:

- `template_owner`: `KantAkademi2`
- `template_repo`: `ios-boilerplate`
- `destination_owner`
- `new_repo_name`
- `visibility`: private
- `include_all_branches`: false
- `dry_run`

Required permission:

- `GH_TOKEN` secret or environment variable in the private automation host
- The token should be a fine-grained GitHub PAT whose resource owner is the target organization
- Repository permissions: Administration read/write and Contents read/write

Outputs:

- generated repository full name
- generated repository URL
- status: `created` or `dry_run`

Success Criteria:

- template repo is reachable
- template repo is marked as a GitHub template
- destination repo is created under the target organization
- name collisions are resolved by appending numeric suffixes such as `-2`, `-3`
- workflow summary includes the generated repo URL

Stage Result:

- `COMPLETE` - repo exists and can be cloned by downstream stages
- `BLOCKED_TOKEN` - `GH_TOKEN` is missing or cannot create repos in the target organization
- `BLOCKED_TEMPLATE` - selected source is missing or is not marked as a GitHub template
- `BLOCKED_DESTINATION` - destination owner rejected repo creation

## Stage 2 - App Identity Setup

Purpose:
Clone the generated repo and align product identity before any store upload.

Expected changes:

- app display name
- bundle identifier
- Xcode project or workspace signing team
- version and build number policy
- scheme and target naming only when the template requires it

Success Criteria:

- identity values are deterministic
- no placeholder app name or bundle ID remains
- the generated repo can build locally or in CI against a concrete iOS app target

## Stage 3 - Asset Generation

Purpose:
Generate or install App Store-ready visual assets.

Expected outputs:

- app icon asset set
- launch or brand assets required by the template
- screenshot set for required device classes

Success Criteria:

- assets are committed to the generated repo
- screenshots match the actual generated app surface
- no placeholder template branding remains

## Stage 4 - Signing Setup

Purpose:
Make CI able to sign the app without interactive Xcode login.

Preferred path:

- Fastlane `match` or equivalent encrypted signing storage
- App Store Connect API key for CI auth
- explicit Team ID and bundle ID

Fallback path:

- Xcode automatic signing with `-allowProvisioningUpdates` only for local smoke runs

Success Criteria:

- archive signing is reproducible
- CI does not require browser login or 2FA
- provisioning profile matches the generated bundle ID

## Stage 5 - App Store Connect and TestFlight

Purpose:
Create or connect the App Store Connect app record, upload the signed build, and prepare metadata.

Expected tools:

- Fastlane `produce` for app record creation when supported by the account
- Fastlane `pilot` or `upload_to_testflight` for build upload
- Fastlane metadata/screenshots structure for repeatable submissions

Success Criteria:

- TestFlight build upload completes
- metadata and privacy fields are recorded explicitly
- any manual App Store Connect blockers are reported with exact fields and URLs

## Workflow Status Artifact

Generated app repos should record status under:

```text
docs/ios-app-store-factory/workflow-status.json
```

Minimum shape:

```json
{
  "workflow": "ios-app-store-factory",
  "status": "RUNNING",
  "currentStage": "template-repo-generation",
  "generatedRepo": null,
  "blockers": [],
  "nextAction": "Run repo creation smoke workflow"
}
```

## Execution Notes

- Start with Stage 1 only when validating GitHub permissions.
- The example scheduled workflow runs daily at `06:00 UTC`, which is `09:00 Europe/Istanbul`.
- The public ViberMode repository must not store the live `GH_TOKEN` secret and should not host the active scheduled workflow.
- Do not begin Apple signing or App Store Connect stages until repo generation succeeds.
- Prefer `dry_run=true` for permission checks before creating real repos.
- Delete smoke repos manually after validation if they are no longer needed.
