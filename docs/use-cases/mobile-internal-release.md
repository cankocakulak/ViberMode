# Use Case: Mobile Internal Release

## Outcome

Take one completed generated mobile app run manifest and upload the app to an internal tester channel: TestFlight for iOS or Google Play internal testing for Android.

## When To Use

Use this when product-to-code has already completed and the generated repo has passed runtime validation, experience review, and final review.

Do not use it to create a new app idea, new generated repo, or raw store listing plan.

## Chain

```text
completed generated app run manifest
  -> platform submitter agent
  -> platform release workflow
  -> internal tester distribution
  -> private state commit/push when requested
```

Platform choices:

```text
iOS
  -> ios-submitter
  -> ios-submit-testflight
  -> scripts/ios-submit-testflight.mjs

Android
  -> android-submitter
  -> android-submit-play-internal
  -> scripts/android-submit-play-internal.mjs
```

## Repo Surfaces

Agents:

- `packs/vibermode/roles/product/ios-submitter.md`
- `packs/vibermode/roles/product/android-submitter.md`

Workflows:

- `packs/vibermode/workflows/ios-submit-testflight.md`
- `packs/vibermode/workflows/android-submit-play-internal.md`

Scripts:

- `scripts/ios-submit-testflight.mjs`
- `scripts/android-submit-play-internal.mjs`

Docs:

- `docs/operations/mobile-store-submission-model.md`
- `docs/operations/ios-testflight-submission-guidance.md`
- `docs/operations/android-play-submission-guidance.md`

## State Boundaries

Reads:

- public ViberMode source
- private `factory/runs/[run-id].json`
- generated app repo
- platform credentials from secure runtime only

Writes:

- private `factory/runs/[run-id].json`
- internal TestFlight or Google Play internal testing release state
- optional private state git commit/push

Must not write:

- secrets into ViberMode
- generated IPA/AAB artifacts into ViberMode
- a second generated repo for the same blocked run

## Success

- preflight passes
- release artifact exists
- internal tester upload succeeds or is recorded as processing
- run manifest records submission evidence

## Blockers

Stop before live upload when:

- Stage 3 validation or experience evidence is missing
- iOS Apple credentials/signing/App Store Connect setup fails
- Android Play Console bootstrap is incomplete
- Android service account permissions, signing, target API, or version code fails

## Platform Note

iOS can create or ensure App Store Connect identity when Fastlane and Apple account state permit it. Android release upload can be automated after Play Console bootstrap, but the app record, declarations, Play App Signing setup, and service account grant are not treated as a fully automated API-created step.
