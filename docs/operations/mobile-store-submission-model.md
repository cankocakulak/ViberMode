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

## Source Ref Policy

Store-facing builds should have an auditable source ref. For Slack-driven release commands:

- Code changes happen on work branches and PRs, not directly on `main`.
- Direct push to `main`, `master`, or protected branches is forbidden.
- `main branchini build gonder`, `main'den build al`, or equivalent phrases mean internal tester release from a clean `main`/configured release source, not "merge whatever exists and upload it".
- Allowed build sources are clean `main`, `master`, configured `release/*` branches, tags, or explicit commit SHAs.
- The operator must record the exact commit SHA before uploading to TestFlight or Play internal.
- Dirty worktrees, unmerged local edits, ambiguous feature branches, and unresolved source refs block release.

## Operator Command Glossary

Use these meanings consistently in Slack and Codex automation:

| User phrase | Meaning | iOS action | Android action |
| --- | --- | --- | --- |
| `test'e gonder`, `teste gonder`, `internal test'e yolla` | Build and upload to internal testers | Internal TestFlight upload | Google Play internal testing upload |
| `ikisini de teste gonder` | Run both internal tester lanes when both platform contexts resolve | Internal TestFlight upload | Google Play internal testing upload |
| `submit'e gonder`, `submit et`, `store submit` | Submit already-uploaded builds to final store review/public review surface | Final App Store Review adapter if supported | Final Play review/rollout adapter if supported |
| `main'den build al`, `main branchini test'e gonder` | Build/upload internal tester artifact from clean main/release source | Internal TestFlight after gates | Google Play internal after gates |
| `gonderilen buildi submit'e gonder` | Submit the latest already uploaded build, without rebuilding | Final App Store Review adapter if supported | Final Play review/rollout adapter if supported |

Current Stage 4 scripts implement the internal tester lanes. They do not implement final App Store Review or Play production/review submission. If the user asks for final submit and no final-submit adapter exists, report `UNSUPPORTED_FINAL_SUBMIT_ADAPTER` instead of treating internal upload as final submission.

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
- non-secret app identity and routing metadata such as bundle IDs, package names, App Store Connect app IDs, Play package names, run manifest paths, and console URLs

Not allowed in ViberMode:

- App Store Connect `.p8` material
- Google service account JSON
- upload keystores or passwords
- Apple IDs, Google account credentials, GitHub tokens
- generated IPA/AAB artifacts

## Cached Release Context

For Slack-driven app channels, cache non-secret release context in either:

- `.codex/slack-codex-operator/policy.yml` `channel_contexts`
- `docs/operations/app-registry.local.json`
- a generated factory run manifest `app_autopilot.release_context`

This context should answer "where is the app?", "which platform?", "which run manifest?", and "which internal submit command?" without rediscovery. It must not bypass release gates or final-submit limitations.

When the owner says `test'e gonder`, the operator may use cached run manifests and commands after quality gates pass. When the owner says `submit'e gonder`, the operator must still verify that final-submit adapters exist and declarations are complete; cached console URLs are only navigation hints.

## Release Adapter Rule

Every mobile release adapter should have:

- preflight-by-default behavior
- explicit `--submit` or equivalent for live store mutation
- a manifest update on success or failure
- no duplicate repo creation on release failure
- exact blockers and next action in the output
- track/scope defaults that target internal testing, not public release
