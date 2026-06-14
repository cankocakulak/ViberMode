# Workflow: Android Submit Play Internal

> Stage 4 workflow for taking a completed generated Android app repo and uploading an internal Google Play testing release.

## Pipeline

```text
factory run manifest -> metadata/readiness preflight -> Play Console bootstrap confirmation -> release AAB build -> Google Play internal track upload -> run manifest update
```

This workflow does not create a new app repo. It consumes the Stage 2/3 run manifest and appends submission evidence to that same file.

Unlike the iOS TestFlight path, Google Play app record creation and required legal/declaration setup are Play Console bootstrap work. The Google Play Developer Publishing API operates on an existing Play app/package through edits. Do not promise fully API-created Play apps.

When called from `change-to-release`, it also consumes `docs/[project-name]/change-release-status.json` and must pass the change-release hard gate before build/upload.

Operator setup guidance:

```text
docs/operations/android-play-submission-guidance.md
```

Shared platform model:

```text
docs/operations/mobile-store-submission-model.md
```

## Entry Contract

Required:

- `run_manifest_path` - private state file under `factory/runs/[run-id].json`
- generated Android repo `workspace_path` from the run manifest
- `app_name` and Android `package_name` from the run manifest or metadata
- completed Stage 3 `product_to_code_result.status`
- approved Stage 3 experience review evidence
- Play Console bootstrap confirmation for the package
- Google Play service account JSON from secure runtime storage
- release `.aab` path or enough Gradle project structure to build one

Recommended optional metadata:

- default language
- title, short description, full description
- contact email
- privacy policy URL
- tester notes / release notes
- internal track release status
- metadata folder for Fastlane supply when store listing updates are intentionally included

Default Keychain services:

```text
viberboyz-google-play-service-account-json-b64
viberboyz-android-upload-keystore-b64 (optional)
viberboyz-android-upload-key-alias (optional)
viberboyz-android-upload-store-password (optional)
viberboyz-android-upload-key-password (optional)
viberboyz-gh-token (optional, state sync)
```

## Stage 0 - Play Console Bootstrap

Purpose:
Create the Google Play app record and satisfy setup tasks that the public Publishing API should not be expected to perform.

Required operator work:

- create the app in Google Play Console
- choose app/game and free/paid posture
- set default language and app name
- add contact email
- accept developer policy, export law, and Play App Signing requirements
- configure app access, ads, content rating, target audience, data safety, and related declarations as required by the current Play Console
- upload or otherwise establish the first artifact/API readiness when the account requires it before Publishing API edits
- invite the service account with permissions for release and app information management

Record the checkpoint in the run manifest:

```json
{
  "submission_metadata": {
    "google_play": {
      "package_name": "com.viberboyz.example",
      "track": "internal",
      "console_bootstrap": {
        "status": "complete",
        "completed_at": "2026-06-08T12:00:00.000Z",
        "notes": "Play app created, declarations completed, Play App Signing accepted, service account invited."
      }
    }
  }
}
```

The CLI can also accept `--confirm-play-console-bootstrap` for a manual one-off run, but persistent factory state should prefer the manifest field.

## Stage 1 - Preflight

Script:

```text
scripts/android-submit-play-internal.mjs
```

Default command:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest $VIBERMODE_WORKSPACE_ROOT/app-factory-state/factory/runs/run-id.json
```

Purpose:
Validate that the run is complete enough for submission and that local tooling and credentials exist. This mode does not mutate Google Play, GitHub, generated app repos, or private state.

Success Criteria:

- run manifest exists
- generated workspace exists
- `product_to_code_result.status` is `complete`
- Stage 3 experience evidence is approved
- Android package name is present
- Play Console bootstrap is confirmed
- Gradle wrapper or `gradle` is available
- `java` is available or explicitly accepted as a warning
- `fastlane` is available
- Google Play service account JSON exists in Keychain or runtime environment
- a release `.aab` exists or can be built with `--build`

For `change-to-release` runs, run this additional gate before any live Google-side work:

```bash
npm run change-release:gate -- \
  --status /absolute/path/to/docs/[project-name]/change-release-status.json \
  --artifact-root /absolute/path/to/docs/[project-name] \
  --release-target android-play-internal
```

Pass `--forbid-dirty /absolute/path/to/forbidden/worktree` for any platform or service that the selected batch was not allowed to mutate. A failed gate blocks build and upload.

## Stage 2 - Release AAB Build

Purpose:
Build the Android App Bundle that Google Play will process.

Default command path when requested:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /path/to/run.json \
  --build
```

The script runs:

```text
./gradlew :app:bundleRelease
```

Override the task when the generated Android template uses a different module:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /path/to/run.json \
  --build \
  --gradle-task bundleRelease
```

Signing material must stay in Gradle runtime configuration, Keychain, or CI secrets. Do not write upload keystore secrets into ViberMode public files.

## Stage 3 - Internal Track Upload

Purpose:
Upload the AAB to Google Play internal testing.

Implementation:

```text
fastlane supply
  --aab <release-aab>
  --track internal
  --package_name <package-name>
  --json_key <temporary-service-account-json>
  --release_status completed
```

The CLI writes the service account JSON to a temporary file and removes it after the command exits. If no metadata folder is supplied, the default path skips metadata, changelog, image, and screenshot upload.

Validate without publishing when needed:

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest /path/to/run.json \
  --submit \
  --validate-only \
  --confirm-play-console-bootstrap
```

A successful `--validate-only` run must not be recorded as an internal testing upload. It may record `submission.status = play_internal_validated`, then the operator should rerun without `--validate-only` for the real upload.

## State Update

On success, update the same run manifest:

```json
{
  "status": "submitted",
  "submission": {
    "status": "play_internal_uploaded",
    "distribution": "google_play_internal",
    "app_name": "...",
    "package_name": "com.viberboyz.example",
    "track": "internal",
    "release_status": "completed",
    "aab_path": "...",
    "uploaded_at": "..."
  }
}
```

On failure, update the same run manifest:

```json
{
  "status": "blocked",
  "submission": {
    "status": "blocked",
    "distribution": "google_play_internal",
    "package_name": "com.viberboyz.example",
    "track": "internal",
    "error": "..."
  }
}
```

## Live Submit Command

```bash
node scripts/android-submit-play-internal.mjs \
  --run-manifest $VIBERMODE_WORKSPACE_ROOT/app-factory-state/factory/runs/run-id.json \
  --build \
  --submit \
  --confirm-play-console-bootstrap \
  --commit-state
```

Use `--aab /path/to/app-release.aab` when the AAB already exists.

## Quality Gate Failures

- If `experience-review.md` is incomplete, launch-only, or missing changed-surface screenshots, stop before build/upload.
- If `review.md` is not approved, stop before build/upload.
- If Play Console bootstrap is not confirmed, stop before upload.
- If forbidden worktrees are dirty, stop before build/upload and route the scope violation back through remediation.
- Do not use a user request, a manual automation trigger, or a previous successful build as an override for incomplete quality gates.
- Record the blocked status in the same run artifact instead of producing a successful release artifact with known gaps.

## Metadata Handoff

Internal testing can proceed with minimal release metadata after Play Console bootstrap, but the factory should carry listing metadata before later closed/open/production release.

Preferred run manifest shape:

```json
{
  "submission_metadata": {
    "google_play": {
      "package_name": "com.viberboyz.mooddots",
      "track": "internal",
      "release_status": "completed",
      "default_language": "en-US",
      "title": "Mood Dots",
      "short_description": "Tiny daily mood check-ins",
      "full_description": "Track today's mood in seconds and review a simple seven-day dot history.",
      "contact_email": "support@example.com",
      "privacy_policy_url": "https://example.com/privacy",
      "release_notes": {
        "en-US": "Internal test build for mood logging, notes, and seven-day history."
      },
      "console_bootstrap": {
        "status": "complete"
      }
    }
  }
}
```

For internal testing, missing storefront/listing metadata is not blocking once Play Console bootstrap is complete. For production review, store listing, declarations, screenshots, data safety, content rating, and policy answers must be complete.

## Failure Routing

- Stage 3 quality blocker: rerun product-to-code remediation for the same generated repo; do not upload a new Play build.
- Missing credentials: fix Keychain or runtime environment and rerun preflight.
- Play Console bootstrap missing: create/configure the app in Play Console, complete declarations, grant service account access, then rerun.
- Signing failure: verify upload keystore, Gradle signing config, package name, and Play App Signing state.
- Duplicate version code: bump `versionCode` and rebuild the AAB.
- Target API or policy failure: update the generated Android project or Play Console declarations before retrying.
- Upload accepted but not visible to testers yet: check Play Console processing and tester group access before retrying.
