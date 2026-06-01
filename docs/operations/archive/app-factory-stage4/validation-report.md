# App Factory Stage 4 Validation Report

## Summary

Validated the new internal TestFlight Stage 4 command path without performing a live Apple-side submission.

## Commands

```bash
node --check scripts/ios-submit-testflight.mjs
```

Result: passed.

```bash
npm run validate
```

Result: passed. Reference map validation passed for 36 capabilities.

```bash
node scripts/ios-submit-testflight.mjs \
  --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-20260527120805-7bc409.json
```

Result: passed. The command returned `preflight_passed` for Mood Dots with:

- bundle ID: `com.viberboyz.mooddots`
- Xcode project: `/Users/mcan/Documents/Codex/generated-ios-apps/ios-mood-dots-2026-05-27/ios-boilerplate.xcodeproj`
- scheme: `TemplateApp`
- configuration: `Release`
- Fastlane/Xcode availability: confirmed
- required Keychain credentials: confirmed

## Residual Risk

Live submission is not yet proven. The next validation step is a controlled `--submit` run, which may still expose Apple account agreements, team selection, signing, or App Store Connect processing blockers.

## Guidance Update

Added `docs/operations/ios-testflight-submission-guidance.md` and linked it from the operations index, app factory overview, app factory state notes, TestFlight workflow, and iOS submitter role.

Validation:

```bash
npm run validate
```

Result: passed. Reference map validation passed for 36 capabilities.

## Readiness Hardening

Added Stage 4 hardening based on the live Mood Dots upload:

- App Store Connect app-name fallback support when the binary display name is unavailable.
- Submission metadata handoff for description, keywords, support/privacy URLs, storefronts, price posture, and TestFlight notes.
- App icon readiness checks for required iPhone/iPad sizes and opaque 1024 icon.
- Automatic fallback asset preparation during live `--submit`, including AppIcon PNGs, `CFBundleIconName`, iPad orientations, project regeneration, and `artifacts/` ignore handling.

Validation:

```bash
node --check scripts/ios-submit-testflight.mjs
npm run validate
node scripts/ios-submit-testflight.mjs --run-manifest /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/factory/runs/run-20260527120805-7bc409.json --app-name "Mood Dots by ViberBoyz" --signing-auth xcode-account --upload-auth api-key
```

Result: passed. The preflight reports `submission_assets.status=ready` and surfaces metadata fields.
