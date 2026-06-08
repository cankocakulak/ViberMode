# Android Play Submission Guidance

Operational guidance for wiring ViberMode Stage 4 into a local or private automation runtime for Google Play internal testing.

This guidance covers internal testing upload only. It does not cover closed/open testing promotion, production rollout, staged rollout, store listing approval, paid app setup, data safety completion strategy, or Google Play review submission.

For the shared iOS/Android release model, read:

```text
docs/operations/mobile-store-submission-model.md
```

## Scope

Stage 4 consumes a completed factory run:

```text
factory/runs/[run-id].json
generated repo workspace_path
selection.app_name
submission_metadata.google_play.package_name
product_to_code_result.status = complete
product_to_code_result.experience_review.status = approved
```

It then:

```text
preflight -> Play Console bootstrap confirmation -> release AAB build -> fastlane supply upload -> run manifest update
```

The runnable workflow is:

```text
packs/vibermode/workflows/android-submit-play-internal.md
```

The CLI wrapper is:

```text
scripts/android-submit-play-internal.mjs
```

## Storage Boundary

ViberMode is public and should contain only reusable workflow definitions, scripts, and documentation.

Allowed in ViberMode:

- command shapes
- Keychain service names
- non-secret workflow documentation
- run manifest field names

Not allowed in ViberMode:

- Google service account JSON
- upload keystores
- keystore aliases or passwords when they are sensitive in context
- GitHub tokens
- App-specific private market research
- generated AAB/APK files

Private state belongs in:

```text
/Users/mcan/ViberMode/.vibermode-state/app-factory-state
```

Generated Android app workspaces should belong in a private generated-apps folder, for example:

```text
/Users/mcan/ViberMode/.vibermode-generated-android-apps
```

## One-Time Local Setup

### 1. Confirm Tooling

```bash
java -version
command -v fastlane
```

If Fastlane is missing:

```bash
brew install fastlane
```

The generated Android repo should include a Gradle wrapper:

```bash
./gradlew --version
```

### 2. Confirm Google Play Account State

Before automation can upload internal builds, the Google Play account should have:

- active Google Play Developer account
- accepted account agreements and policy prompts
- permission to create and manage apps
- permission to manage releases on the target app
- access to Google Cloud and service account setup

### 3. Create A Google Cloud Project And Service Account

Follow Google's setup path:

```text
Google Cloud project -> enable Google Play Developer API -> create service account -> invite service account in Play Console
```

The service account is the preferred server-to-server credential model for this workflow.

Recommended Play Console permissions for this automation:

- view app information
- manage app information when metadata upload is needed
- create and edit releases
- release to testing tracks

Use the narrowest role that still supports the intended release operations.

### 4. Save Service Account JSON To Keychain

Do not commit the JSON file. Store it in Keychain as base64 and then remove the loose local copy if it is no longer needed.

```bash
GOOGLE_PLAY_JSON_PATH="/path/to/google-play-service-account.json"
GOOGLE_PLAY_JSON_B64="$(base64 -i "$GOOGLE_PLAY_JSON_PATH")"
security add-generic-password -U -a "$USER" -s "viberboyz-google-play-service-account-json-b64" -w "$GOOGLE_PLAY_JSON_B64"
unset GOOGLE_PLAY_JSON_PATH GOOGLE_PLAY_JSON_B64
```

Presence check without printing secrets:

```bash
security find-generic-password -a "$USER" -s "viberboyz-google-play-service-account-json-b64" >/dev/null && echo "ok google play service account"
```

Alternative one-process environment:

```bash
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64="$(base64 -i /path/to/service-account.json)" \
node scripts/android-submit-play-internal.mjs --run-manifest /path/to/run.json
```

### 5. Configure Play Console Bootstrap

Google Play app creation is not modeled as a fully automated API step in this workflow. Create and configure the app in Play Console:

```text
Play Console -> Create app
```

Complete the required setup for the package:

- default language
- app name
- app/game type
- free/paid posture
- contact email
- policy and export law declarations
- Play App Signing terms
- app access
- ads declaration
- content rating
- target audience
- data safety
- service account access
- first artifact/API readiness when the account requires it

Record this checkpoint in the run manifest:

```json
{
  "submission_metadata": {
    "google_play": {
      "package_name": "com.viberboyz.example",
      "track": "internal",
      "release_status": "completed",
      "console_bootstrap": {
        "status": "complete",
        "completed_at": "2026-06-08T12:00:00.000Z",
        "notes": "Play app created, declarations complete, Play App Signing accepted, service account invited."
      }
    }
  }
}
```

For a manual one-off run, pass:

```bash
--confirm-play-console-bootstrap
```

Persistent factory state should prefer the manifest checkpoint.

## Generated App Requirements

Before Stage 4:

- Stage 3 must have completed product-to-code.
- The generated repo must build locally.
- The run manifest must include app name and Android package name.
- The project must produce a release AAB.
- `versionCode` must be higher than any artifact already uploaded for the package.
- target API level must satisfy current Google Play policy.
- signing config must be available without exposing secrets in repo files.
- Play App Signing must be configured in Play Console.

## Submission Readiness Defaults

Android internal testing can proceed with a narrower metadata surface than production, but these items should be known before upload:

- `package_name`
- internal track name, usually `internal`
- release status, usually `completed`
- AAB path
- release notes when useful for testers
- privacy policy URL before wider testing or production
- data safety and content declarations before public release

## Running Stage 4 Manually

### 1. Pick A Completed Run Manifest

Example:

```text
/Users/mcan/ViberMode/.vibermode-state/app-factory-state/factory/runs/run-20260608120000-android.json
```

The manifest should have:

```json
{
  "status": "complete",
  "product_to_code_result": {
    "status": "complete",
    "experience_review": {
      "status": "approved"
    }
  }
}
```

### 2. Run Preflight

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /Users/mcan/ViberMode/.vibermode-state/app-factory-state/factory/runs/run-id.json
```

Expected result:

```json
{
  "status": "preflight_passed",
  "mode": "preflight"
}
```

Preflight has no Google Play, GitHub, generated repo, or private state side effects.

### 3. Build During Preflight

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /Users/mcan/ViberMode/.vibermode-state/app-factory-state/factory/runs/run-id.json \
  --build
```

Default Gradle task:

```text
:app:bundleRelease
```

Override it when needed:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /path/to/run.json \
  --build \
  --gradle-task bundleRelease
```

### 4. Submit To Google Play Internal Testing

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /Users/mcan/ViberMode/.vibermode-state/app-factory-state/factory/runs/run-id.json \
  --build \
  --submit \
  --confirm-play-console-bootstrap \
  --commit-state
```

This performs live Google-side work:

- builds or finds a release AAB
- writes service account JSON to a temporary file
- runs Fastlane `supply`
- uploads the AAB to the internal track
- updates the same run manifest with `submission`
- commits and pushes the updated manifest when `--commit-state` is passed

Use an existing AAB:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /path/to/run.json \
  --aab /path/to/app-release.aab \
  --submit \
  --confirm-play-console-bootstrap
```

Validate with Google Play without publishing when supported by the current Fastlane/API path:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /path/to/run.json \
  --aab /path/to/app-release.aab \
  --submit \
  --validate-only \
  --confirm-play-console-bootstrap
```

A successful validation-only run records validation only. Rerun without `--validate-only` to create the internal testing upload.

## Expected Manifest Result

On success:

```json
{
  "status": "submitted",
  "submission": {
    "status": "play_internal_uploaded",
    "distribution": "google_play_internal",
    "app_name": "Mood Dots",
    "package_name": "com.viberboyz.mooddots",
    "track": "internal",
    "release_status": "completed",
    "aab_path": "/path/to/app-release.aab",
    "uploaded_at": "2026-06-08T12:00:00.000Z"
  }
}
```

On failure:

```json
{
  "status": "blocked",
  "submission": {
    "status": "blocked",
    "distribution": "google_play_internal",
    "package_name": "com.viberboyz.mooddots",
    "track": "internal",
    "error": "..."
  }
}
```

Do not create another generated repo for the same idea just because Stage 4 blocks.

## Automation Integration

Keep Android Stage 4 opt-in until the generated Android template, signing, and Play Console bootstrap path are proven.

When enabling Stage 4 in a factory automation, append a guarded step after product-to-code succeeds:

```text
If product_to_code_result.status is complete, experience_review.status is approved,
submission_metadata.google_play.console_bootstrap.status is complete,
and the run manifest has no successful submission,
run scripts/android-submit-play-internal.mjs with --run-manifest [path] --build --submit --commit-state.
If it blocks, keep the generated repo and mark the same run manifest blocked.
Do not create another repo for the same idea.
```

Recommended guard fields:

- `status === "complete"` before submission
- `product_to_code_result.status === "complete"`
- `product_to_code_result.experience_review.status === "approved"`
- `submission_metadata.google_play.console_bootstrap.status === "complete"`
- no existing `submission.status === "play_internal_uploaded"`
- explicit automation flag or prompt text enabling Android Stage 4

## Troubleshooting

### Missing Service Account JSON

Run the Keychain presence check. Re-add only the missing service.

### Play Console Bootstrap Missing

Open Play Console, create/configure the app, complete declarations, accept Play App Signing, grant service account access, then rerun preflight.

### Service Account Permission Failure

Verify the service account is invited in Play Console and has release-management permissions for the target app.

### Package Name Not Found

Pass `--package-name` or add `submission_metadata.google_play.package_name` to the run manifest.

### Missing AAB

Run with `--build`, pass `--aab`, or fix the generated Android project so `bundleRelease` produces a release AAB.

### Signing Failure

Check upload keystore availability, Gradle signing config, package ownership, and Play App Signing state.

### Duplicate Version Code

Bump `versionCode`, rebuild, and rerun the same manifest.

### Target API Or Policy Failure

Update the generated Android project or complete the relevant Play Console declaration before retrying.

## Related References

- `docs/operations/mobile-store-submission-model.md`
- `docs/operations/app-factory-automation-overview.md`
- `docs/operations/app-factory-state.md`
- `packs/vibermode/workflows/android-submit-play-internal.md`
- `packs/vibermode/roles/product/android-submitter.md`
- `scripts/android-submit-play-internal.mjs`
