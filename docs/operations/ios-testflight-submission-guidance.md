# iOS TestFlight Submission Guidance

Operational guidance for wiring ViberMode Stage 4 into a local or private automation runtime.

This guidance covers internal TestFlight upload only. It does not cover external TestFlight review, App Store review submission, price tiers, privacy nutrition labels, screenshots for store listing, or phased release.

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
selection.bundle_id
product_to_code_result.status = complete
```

It then:

```text
preflight -> asset preparation -> Fastlane produce -> xcodebuild archive -> IPA export -> Fastlane pilot upload -> run manifest update
```

The iOS path can create or ensure more store-side identity than Android because Fastlane `produce` can create or ensure the App Store Connect app and Developer Portal app identifier when Apple account state allows it. It still depends on accepted agreements, correct team selection, signing permission, and a valid Apple/Fastlane session.

The runnable workflow is:

```text
packs/vibermode/workflows/ios-submit-testflight.md
```

The CLI wrapper is:

```text
scripts/ios-submit-testflight.mjs
```

## Storage Boundary

ViberMode is public and should contain only reusable workflow definitions, scripts, and documentation.

Allowed in ViberMode:

- command shapes
- Keychain service names
- non-secret workflow documentation
- run manifest field names

Not allowed in ViberMode:

- Apple ID passwords
- App Store Connect `.p8` key material
- GitHub tokens
- App-specific private market research
- generated IPA files or archives

Private state belongs in:

```text
/Users/mcan/Documents/Codex/vibermode-state/app-factory-state
```

Generated app workspaces belong in:

```text
/Users/mcan/Documents/Codex/generated-ios-apps
```

## One-Time Local Setup

### 1. Confirm Tooling

```bash
xcodebuild -version
command -v fastlane
```

If Fastlane is missing:

```bash
brew install fastlane
```

### 2. Confirm Apple Account State

Before automation can create or upload builds, the Apple account should have:

- active Apple Developer Program membership
- App Store Connect access for the account
- accepted Apple Developer and App Store Connect agreements
- permission to create apps, bundle IDs, certificates, profiles, and TestFlight builds

For most ViberMode factory use, App Store Connect API key role should be `Admin` or `App Manager`.

### 3. Create App Store Connect API Key

In App Store Connect:

```text
Users and Access -> Integrations -> App Store Connect API
```

Record:

- Key ID
- Issuer ID
- downloaded `AuthKey_[KEY_ID].p8`

Do not commit the `.p8` file. Store it in Keychain as base64 and then remove the loose local copy if it is no longer needed.

### 4. Save Credentials To Keychain

Use these service names by default:

```bash
security add-generic-password -U -a "$USER" -s "viberboyz-apple-team-id" -w "ABCDE12345"
security add-generic-password -U -a "$USER" -s "viberboyz-asc-key-id" -w "KEYID12345"
security add-generic-password -U -a "$USER" -s "viberboyz-asc-issuer-id" -w "ISSUER-UUID-HERE"
security add-generic-password -U -a "$USER" -s "viberboyz-apple-id" -w "you@example.com"
```

Store the `.p8` material:

```bash
ASC_P8_PATH="/path/to/AuthKey_KEYID12345.p8"
ASC_P8_B64="$(base64 -i "$ASC_P8_PATH")"
security add-generic-password -U -a "$USER" -s "viberboyz-asc-api-key-p8-b64" -w "$ASC_P8_B64"
unset ASC_P8_PATH ASC_P8_B64
```

If the Apple account has multiple App Store Connect teams, also save:

```bash
security add-generic-password -U -a "$USER" -s "viberboyz-asc-team-id" -w "123456789"
```

### 5. Save A Fastlane Apple ID Session When Needed

Fastlane `produce` may still require an Apple ID web session because creating App Store Connect app records is not fully covered by the App Store Connect API key path.

Generate a session interactively:

```bash
APPLE_ID="$(security find-generic-password -a "$USER" -s "viberboyz-apple-id" -w)"
fastlane spaceauth -u "$APPLE_ID" --copy_to_clipboard
unset APPLE_ID
```

Complete the Apple 2FA prompt. When Fastlane copies the session to the clipboard, store it in Keychain:

```bash
FASTLANE_SESSION_VALUE="$(pbpaste)"
security add-generic-password -U -a "$USER" -s "viberboyz-fastlane-session" -w "$FASTLANE_SESSION_VALUE"
unset FASTLANE_SESSION_VALUE
```

Check whether the stored session exists:

```bash
security find-generic-password -a "$USER" -s "viberboyz-fastlane-session" >/dev/null && echo "ok fastlane session"
```

Check presence without printing secrets:

```bash
for s in \
  viberboyz-apple-team-id \
  viberboyz-asc-key-id \
  viberboyz-asc-issuer-id \
  viberboyz-asc-api-key-p8-b64 \
  viberboyz-apple-id \
  viberboyz-fastlane-session
do
  security find-generic-password -a "$USER" -s "$s" >/dev/null && echo "ok $s" || echo "missing $s"
done
```

## Generated App Requirements

Before Stage 4:

- Stage 3 must have completed product-to-code.
- The generated repo must build locally.
- The run manifest must include `selection.app_name` and `selection.bundle_id`.
- The generated project must expose a shared Xcode scheme.
- Release config should resolve `APP_DISPLAY_NAME` and `APP_BUNDLE_ID`.
- `DEVELOPMENT_TEAM` may stay blank in repo files; Stage 4 injects it at build time.

The current factory template uses:

```text
Configs/Base.xcconfig
project.yml
ios-boilerplate.xcodeproj
```

Stage 4 should not edit signing secrets into these files.

## Submission Readiness Defaults

The live Mood Dots upload exposed several validation blockers that should be handled before upload:

- App Store Connect app names are globally constrained. The binary display name may be `Mood Dots`, while the App Store Connect record may need a unique name such as `Mood Dots by ViberBoyz`.
- App icons must exist in the asset catalog, include iPhone/iPad required sizes, include a 1024x1024 large icon, and the large icon must be opaque with no alpha channel.
- Generated Info.plist settings must include `CFBundleIconName`.
- iPad orientation keys must be present when the app supports iPad or the project emits iPad-capable metadata.

The Stage 4 script now checks those conditions during preflight. During `--submit`, it prepares fallback assets by default unless `--no-prepare-assets` is passed.

Fallback asset preparation can:

- generate an opaque AppIcon PNG set
- write `AppIcon.appiconset/Contents.json`
- add `CFBundleIconName` and iPad orientations to `project.yml`
- run `Scripts/generate_project.sh`
- add `artifacts/` to `.gitignore`

Commit and push generated app repo changes after a successful upload so the uploaded build is reproducible from source.

## Metadata Handoff

Internal TestFlight does not require complete App Store listing metadata, but the factory should start carrying it before Stage 4 so later App Store review submission is not a separate discovery project.

Recommended run manifest field:

```json
{
  "submission_metadata": {
    "app_store_name": "Mood Dots by ViberBoyz",
    "fallback_app_store_name": "Mood Dots - Mood Journal",
    "primary_locale": "en-US",
    "subtitle": "Tiny daily mood check-ins",
    "description": "Track today's mood in seconds and review a simple seven-day dot history.",
    "keywords": ["mood", "journal", "tracker"],
    "support_url": "https://example.com/support",
    "privacy_policy_url": "https://example.com/privacy",
    "storefronts": ["US", "TR"],
    "price": "free",
    "testflight": {
      "what_to_test": "Log a mood, add a note, and confirm the seven-day dot history updates."
    }
  }
}
```

The same shape can be supplied as a file:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /path/to/run.json \
  --metadata-file /path/to/submission-metadata.json
```

Current Stage 4 records this metadata in `submission.metadata`; it does not yet publish storefront availability, price, screenshots, privacy answers, or App Store review submission.

## Running Stage 4 Manually

### 1. Pick A Completed Run Manifest

Example:

```text
/Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-20260527120805-7bc409.json
```

The manifest should have:

```json
{
  "status": "complete",
  "product_to_code_result": {
    "status": "complete"
  }
}
```

### 2. Run Preflight

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-id.json
```

Expected result:

```json
{
  "status": "preflight_passed",
  "mode": "preflight"
}
```

Preflight has no Apple, GitHub, generated repo, or private state side effects.

### 3. Submit To Internal TestFlight

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-id.json \
  --submit \
  --commit-state \
  --app-name "Mood Dots by ViberBoyz"
```

This performs live Apple-side work:

- Fastlane `produce` creates or ensures the App Store Connect app and bundle ID. Use a unique `--app-name` if the display name is already taken.
- submission asset preparation fills missing icon/Info.plist readiness gaps unless `--no-prepare-assets` is used
- `xcodebuild archive` creates an iOS archive.
- `xcodebuild -exportArchive` creates an IPA.
- Fastlane `pilot upload` uploads to TestFlight with `distribute_external=false`.
- The same run manifest is updated with `submission`.
- `--commit-state` syncs the updated manifest to `ViberBoyz/app-factory-state`.

If the App Store Connect app already exists and `produce` blocks unnecessarily:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-id.json \
  --submit \
  --skip-produce \
  --commit-state
```

## Expected Manifest Result

On success:

```json
{
  "status": "submitted",
  "submission": {
    "status": "testflight_uploaded",
    "distribution": "internal_testflight",
    "app_name": "Mood Dots",
    "bundle_id": "com.viberboyz.mooddots",
    "version": "1.0.0",
    "build_number": "202605271648",
    "uploaded_at": "2026-05-27T16:48:00.000Z",
    "processing_status": "not_waited"
  }
}
```

On failure:

```json
{
  "status": "blocked",
  "submission": {
    "status": "blocked",
    "distribution": "internal_testflight",
    "error": "..."
  }
}
```

Do not create another generated repo for the same idea just because Stage 4 blocks.

## Automation Integration

Keep `viber-ios-app-factory` stopped after Stage 3 until live submission is intentionally enabled.

When enabling Stage 4 in that automation, append a guarded step after product-to-code succeeds:

```text
If product_to_code_result.status is complete and the run manifest has no successful submission,
run scripts/ios-submit-testflight.mjs with --run-manifest [path] --submit --commit-state.
If it blocks, keep the generated repo and mark the same run manifest blocked.
Do not create another repo for the same idea.
```

Recommended guard fields:

- `status === "complete"` before submission
- `product_to_code_result.status === "complete"`
- no existing `submission.status === "testflight_uploaded"`
- explicit automation flag or prompt text enabling Stage 4

## Troubleshooting

### Missing Keychain Item

Run the presence check. Re-add only the missing service.

### Apple Agreements Block Submission

Open Apple Developer and App Store Connect account pages, accept pending agreements, then rerun the same manifest.

### Multiple Team Ambiguity

Add `viberboyz-asc-team-id` or pass `--asc-team-id`.

### `produce` Fails But App Already Exists

Rerun with `--skip-produce`.

### App Name Is Already Used

Use a unique App Store Connect name while keeping the generated app display name unchanged:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /path/to/run.json \
  --submit \
  --app-name "Mood Dots by ViberBoyz"
```

### `produce` Requires Apple ID Sign-In

Refresh the stored `viberboyz-fastlane-session` with `fastlane spaceauth`, or create the app manually in App Store Connect and rerun with `--skip-produce`.

### Missing Or Invalid App Icons

Rerun with the default asset preparation path, or explicitly:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /path/to/run.json \
  --prepare-assets
```

Then commit and push the generated app repo asset changes.

### Signing Failure

Check:

- Apple Developer Team ID
- bundle ID ownership
- automatic signing permissions
- certificates/profiles availability
- Xcode first-launch setup

### Duplicate Build Number

Rerun with:

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /path/to/run.json \
  --submit \
  --build-number 202605271700
```

### Upload Succeeds But Processing Is Not Done

This is expected. The script uses `--skip_waiting_for_build_processing true`. Check App Store Connect/TestFlight later before retrying.

## Related References

- `docs/operations/app-factory-automation-overview.md`
- `docs/operations/app-factory-state.md`
- `packs/vibermode/workflows/ios-submit-testflight.md`
- `packs/vibermode/roles/product/ios-submitter.md`
- `scripts/ios-submit-testflight.mjs`
