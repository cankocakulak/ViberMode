# Mobile Store Submission Model

This is the shared mental model for ViberMode mobile Stage 4 release adapters.

## Purpose

Stage 4 turns a completed generated mobile app repo into an internal distribution artifact without losing the continuity of the original factory run.

The invariant is:

```text
same factory run manifest -> platform preflight -> platform build/export -> internal distribution -> same manifest updated
```

Stage 4 must not create a second generated repo for the same idea. A release blocker should be recorded against the same `factory/runs/[run-id].json`.

## Shared Stages

| Stage | Responsibility | iOS | Android |
|-------|----------------|-----|---------|
| Identity | App/package ID and display name are known | bundle ID + App Store Connect name | package name + Play app name |
| Quality gate | Stage 3 implementation is truly testable | runtime validation, experience review, final review | runtime validation, experience review, final review |
| Store bootstrap | Store-side app setup is ready | mostly automatable via App Store Connect/Fastlane when account state permits | Play Console app creation and declarations are manual/bootstrap |
| Build artifact | Release artifact exists | archive + App Store Connect IPA export | signed release AAB |
| Internal distribution | Upload to internal testers | TestFlight internal testing | Google Play internal testing |
| Evidence | Manifest records the result | `submission.status = testflight_uploaded` | `submission.status = play_internal_uploaded` |

## Platform Delta

iOS can get close to a zero-touch Stage 4 because Fastlane `produce` can create or ensure the App Store Connect app and Developer Portal app identifier when account agreements, permissions, team selection, and sessions are healthy.

Android is different. The Google Play Developer Publishing API is edit-based and operates on an existing Play app/package. Google's docs state that the Publishing API can modify an existing app and that Play Console is required for first app setup, first artifact/API readiness, and legal consents. Treat Android "from scratch" as:

```text
repo/template creation can be automated
Play Console bootstrap is a required checkpoint
release upload after bootstrap can be automated
```

References:

- Google Play Developer API overview: https://developers.google.com/android-publisher
- Google Play edits workflow and existing-app limitation: https://developers.google.com/android-publisher/edits
- Play Console app creation guide: https://support.google.com/googleplay/android-developer/answer/9859152
- Fastlane Google Play upload action: https://docs.fastlane.tools/actions/upload_to_play_store/

## Credential Boundary

Allowed in ViberMode:

- command shapes
- Keychain service names
- manifest field names
- non-secret workflow documentation

Not allowed in ViberMode:

- App Store Connect `.p8` material
- Google service account JSON
- upload keystores or passwords
- Apple IDs, Google account credentials, GitHub tokens
- generated IPA/AAB artifacts

## Release Adapter Rule

Every mobile release adapter should have:

- preflight-by-default behavior
- explicit `--submit` or equivalent for live store mutation
- a manifest update on success or failure
- no duplicate repo creation on release failure
- exact blockers and next action in the output
- track/scope defaults that target internal testing, not public release
