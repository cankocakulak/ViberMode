# Workflow: iOS Submit TestFlight

> Stage 4 workflow for taking a completed generated iOS app repo and uploading an internal TestFlight build.

## Pipeline

```text
factory run manifest -> metadata/readiness preflight -> asset preparation -> App Store Connect app ensure -> archive -> IPA export -> internal TestFlight upload -> run manifest update
```

This workflow does not create a new app repo. It consumes the Stage 2/3 run manifest and appends submission evidence to that same file.

Operator setup guidance:

```text
docs/operations/ios-testflight-submission-guidance.md
```

## Entry Contract

Required:

- `run_manifest_path` - private state file under `factory/runs/[run-id].json`
- generated repo `workspace_path` from the run manifest
- `app_name` and `bundle_id` from the run manifest selection
- Apple Developer Team ID from secure runtime storage
- App Store Connect API key material from secure runtime storage
- Apple ID email for Fastlane `produce`

Recommended optional metadata:

- unique App Store Connect app name when the display name is already taken
- description, subtitle, keywords, support URL, and privacy policy URL
- primary locale
- desired storefronts and price posture
- TestFlight "what to test" notes

Default Keychain services:

```text
viberboyz-apple-team-id
viberboyz-asc-key-id
viberboyz-asc-issuer-id
viberboyz-asc-api-key-p8-b64
viberboyz-apple-id
viberboyz-fastlane-session (optional, used by Fastlane produce)
viberboyz-asc-team-id (optional)
```

## Stage 1 - Preflight

Script:

```text
scripts/ios-submit-testflight.mjs
```

Default command:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-id.json
```

Purpose:
Validate that the run is complete enough for submission and that local tooling and credentials exist. This mode does not mutate Apple, GitHub, generated app repos, or private state.

Success Criteria:

- run manifest exists
- generated workspace exists
- `product_to_code_result.status` is `complete`
- Xcode project/workspace and scheme are discoverable
- `xcodebuild` and `fastlane` are available
- required Keychain entries exist
- App Store submission assets are ready or can be prepared automatically
- metadata gaps are reported before live upload

## Stage 1.5 - Submission Asset Preparation

Purpose:
Avoid App Store Connect upload validation failures that only appear after a long archive/upload cycle.

The script checks for:

- `AppIcon.appiconset`
- required iPhone/iPad icon sizes including 120x120 and 152x152
- opaque 1024x1024 large icon with no alpha channel
- `CFBundleIconName`
- iPad supported interface orientations

During `--submit`, the script prepares fallback assets by default unless `--no-prepare-assets` is passed. For the current XcodeGen template, it can:

- generate an opaque AppIcon PNG set
- write the expected asset catalog `Contents.json`
- add `CFBundleIconName` and iPad orientation build settings to `project.yml`
- run `Scripts/generate_project.sh`
- add `artifacts/` to `.gitignore`

These generated app repo changes should be committed and pushed after a successful upload.

## Stage 2 - App Store Connect App Ensure

Command uses Fastlane `produce` when `--submit` is passed.

Purpose:
Create or ensure the App Store Connect app and Developer Portal app identifier for the run manifest's bundle ID.

Rules:

- Use `--skip-produce` only when the App Store Connect app record already exists.
- Treat already-existing app/bundle messages as success.
- If the desired display name is unavailable, use `--app-name` or metadata `app_store_name` for a unique App Store Connect name while leaving the in-app display name unchanged.
- If the first name is taken and a fallback name is available, retry `produce` with the fallback before blocking.
- If Apple agreements, roles, or team selection block creation, mark the same run manifest `blocked`.

## Stage 3 - Archive

Purpose:
Archive the generated iOS app for generic iOS distribution.

Implementation:

```text
xcodebuild archive
  -destination generic/platform=iOS
  -allowProvisioningUpdates
  -authenticationKeyPath AuthKey_*.p8
  -authenticationKeyID ...
  -authenticationKeyIssuerID ...
  DEVELOPMENT_TEAM=...
  CODE_SIGN_STYLE=Automatic
```

Build number defaults to a timestamp so repeated uploads do not collide with an existing TestFlight build.

## Stage 4 - IPA Export

Purpose:
Export an App Store Connect IPA from the archive.

Export options:

- `method`: `app-store-connect`
- `destination`: `export`
- `signingStyle`: `automatic`
- `testFlightInternalTestingOnly`: `true`
- `manageAppVersionAndBuildNumber`: `false`

## Stage 5 - Internal TestFlight Upload

Purpose:
Upload the IPA to TestFlight for internal testing.

Implementation:

```text
fastlane pilot upload
  --api_key_path <temporary-api-key-json>
  --ipa <exported-ipa>
  --app_identifier <bundle-id>
  --distribute_external false
  --skip_waiting_for_build_processing true
```

Processing may continue after upload. A successful upload with processing still pending should be recorded as `testflight_uploaded` with `processing_status: not_waited`.

## State Update

On success, update the same run manifest:

```json
{
  "status": "submitted",
  "submission": {
    "status": "testflight_uploaded",
    "distribution": "internal_testflight",
    "app_name": "...",
    "bundle_id": "...",
    "version": "1.0.0",
    "build_number": "...",
    "uploaded_at": "...",
    "processing_status": "not_waited"
  }
}
```

On failure, update the same run manifest:

```json
{
  "status": "blocked",
  "submission": {
    "status": "blocked",
    "error": "..."
  }
}
```

## Live Submit Command

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-id.json \
  --submit \
  --commit-state \
  --app-name "Mood Dots by ViberBoyz"
```

Use `--state-sync api` by default when syncing private state. The script can read `GH_TOKEN` from the environment or the `viberboyz-gh-token` Keychain service.

## Metadata Handoff

Stage 4 does not yet publish full App Store listing metadata, but it should carry a submission metadata object so the factory state is ready for the next submission stage.

Preferred run manifest shape:

```json
{
  "submission_metadata": {
    "app_store_name": "Mood Dots by ViberBoyz",
    "fallback_app_store_name": "Mood Dots - Mood Journal",
    "primary_locale": "en-US",
    "subtitle": "Tiny daily mood check-ins",
    "description": "Short App Store description draft.",
    "keywords": ["mood", "journal", "tracker"],
    "support_url": "https://example.com/support",
    "privacy_policy_url": "https://example.com/privacy",
    "storefronts": ["US", "TR"],
    "price": "free",
    "testflight": {
      "what_to_test": "Log a mood, add a note, and review the seven-day dot history."
    }
  }
}
```

The same object may be supplied with `--metadata-file`. For internal TestFlight, missing storefront/listing metadata is not blocking; for App Store review it must be completed before submission.

## Failure Routing

- Missing credentials: fix Keychain and rerun preflight.
- Fastlane `produce` authentication failure: refresh `viberboyz-fastlane-session` with `fastlane spaceauth`, or create the app manually, then rerun with `--skip-produce`.
- App name unavailable: rerun with a unique `--app-name`, such as `[Name] by [Owner]`, and preserve the original display name inside the app.
- Missing or invalid icons: rerun with asset preparation enabled, commit generated app asset fixes, then retry the same run manifest.
- Signing failure: verify Team ID, bundle ID, certificates, and Apple agreements.
- Duplicate build number: rerun with `--build-number <new-number>`.
- Upload accepted but processing pending: do not retry immediately; check App Store Connect processing first.
