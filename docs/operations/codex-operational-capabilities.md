# Codex Operational Capabilities

This document explains how to understand and use Codex as an operator inside a ViberMode workspace.

It is written for someone who just cloned the repo and wants to know:

- what Codex can safely read
- what Codex can safely change
- which credentials are required
- where each store, subscription, analytics, or reporting workflow starts
- what still requires a human account owner in a browser

## Mental Model

Codex is most useful when three things are true:

```text
repo scripts and docs exist
+ local tools are installed
+ credentials are stored outside git
= Codex can operate the service with evidence
```

Codex is not only a code editor in this model. It can:

- inspect project files, build configs, manifests, and generated artifacts
- run local CLIs and repo-owned wrappers
- call official APIs through scripts
- prepare store metadata, screenshots, release notes, and preflight reports
- upload internal builds when credentials and store-side bootstrap are complete
- record exact commands, blockers, and resulting links in repo docs

Codex should not silently cross legal or irreversible boundaries. Store review submissions, policy declarations, paid app setup, data safety answers, and account-wide permissions are operational decisions. Codex can prepare and verify them, but the owner should approve truth-sensitive declarations.

## Operating Levels

| Level | Meaning | Examples |
| --- | --- | --- |
| Read | Inspect external state without changing it | RevenueCat project status, App Store Connect app lookup, Play listing readback |
| Prepare | Create local files or generated assets | store metadata, screenshots, preflight docs, changelogs |
| Mutate safely | Write bounded external state | upload internal TestFlight build, upload Play internal AAB, update Play listing metadata |
| Release or policy submit | Send app or policy state into review/public surfaces | production rollout, App Store review, Play App content declarations |

Default posture:

- run read/preflight first
- write local docs and assets before external mutation
- use internal testing tracks before production
- keep all secrets out of git
- report exact evidence links after every external operation

## Capability Index

| Capability | What Codex Can Do | Start Here | Main Script |
| --- | --- | --- | --- |
| RevenueCat access | Read projects, offerings, entitlements, apps, SDK keys, metrics, and customers; create projects when an OAuth/admin profile is configured | `docs/operations/revenuecat-access.md` | `scripts/revenuecat-api.mjs` |
| iOS internal TestFlight | Preflight app identity, signing, assets, build archive, export IPA, upload to TestFlight, update run manifest | `docs/operations/ios-testflight-submission-guidance.md` | `scripts/ios-submit-testflight.mjs` |
| Android internal testing | Preflight Play bootstrap, build signed AAB, upload to Google Play internal testing, update run manifest | `docs/operations/android-play-submission-guidance.md` | `scripts/android-submit-play-internal.mjs` |
| Mobile store model | Understand the shared iOS/Android release adapter boundary | `docs/operations/mobile-store-submission-model.md` | platform-specific scripts |
| Store downloads to Notion | Read App Store Connect and Google Play download/install reports and optionally upsert Notion weekly rows | `docs/operations/store-downloads-notion-automation.md` | `scripts/store-downloads-to-notion.mjs` |
| App factory state | Understand private backlog and run-state boundaries | `docs/operations/app-factory-state.md` | state-specific scripts |
| GitHub repo creation | Create generated app repos from factory selections when token setup is complete | `docs/operations/ios-repo-factory-token.md` | `scripts/github-create-template-repo.mjs` |

## Credential Boundary

ViberMode may document credential names and command shapes, but live secrets must not be committed.

Allowed in this repo:

- Keychain service names
- environment variable names
- run manifest fields
- non-secret project IDs when needed
- public support URLs and docs
- example commands

Not allowed in this repo:

- App Store Connect `.p8` material
- Apple ID passwords or Fastlane sessions
- Google Play service account JSON
- RevenueCat secret API keys or OAuth access tokens
- GitHub tokens
- Notion integration secrets
- generated IPA/AAB artifacts
- private subscriber/customer exports

Preferred storage:

| Secret Type | Preferred Storage |
| --- | --- |
| Apple team/API/Fastlane credentials | macOS Keychain |
| Google Play service account JSON | macOS Keychain as base64, or a local ignored file for one-off manual EAS setup |
| RevenueCat keys | macOS Keychain profile services or local env vars |
| Notion API key | `.vibermode-automation.env` or automation runtime |
| GitHub token | macOS Keychain or local env var, never committed |

## Common Operator Prompts

Use prompts like these when asking Codex to operate a connected service:

```text
Check RevenueCat status for profile mood-dots and list offerings.
```

```text
Preflight this generated iOS app for internal TestFlight upload, but do not submit yet.
```

```text
Build this Expo app for Android and upload it to Google Play internal testing.
```

```text
Prepare Google Play store listing metadata and screenshots, push what can be pushed through the API, and list the Play Console forms I still need to confirm.
```

```text
Run the weekly store downloads report for last week and write the Notion rows only if values are missing.
```

```text
Read App Store Connect/Google Play state and tell me what blocks production submission.
```

## What Codex Needs From The User

Codex can usually discover repo facts by itself. It still needs the user for:

- account creation and subscription purchase steps
- accepting Apple or Google agreements
- creating the first Play Console app record
- granting service account or API key permissions
- confirming legal, privacy, age-rating, data-safety, and tax/payment declarations
- providing local paths to loose secret files when Keychain setup has not happened yet

When a secret file is needed, provide the local path only. Do not paste the secret into chat.

## Platform Notes

### RevenueCat

Use RevenueCat as a read-first API surface.

Typical flow:

```text
check credential -> read projects -> read project config -> read offering/entitlement/app/customer state -> write only when explicitly requested
```

Useful commands:

```bash
npm run revenuecat:status
npm run revenuecat:projects
npm run revenuecat -- offerings --profile profile-name
npm run revenuecat -- entitlements --profile profile-name
npm run revenuecat -- customer --profile profile-name --customer-id app-user-id
```

Runbook:

```text
docs/operations/revenuecat-access.md
```

### iOS / App Store Connect / TestFlight

iOS can be more automated than Android because App Store Connect and Fastlane expose more app identity and TestFlight upload surfaces.

Codex can usually help with:

- bundle ID and app record checks
- signing/certificate/profile preflight
- app icon and Info.plist blockers
- archive/export/upload
- internal TestFlight group handoff

Codex should still stop for:

- unresolved Apple agreements
- missing account roles
- external TestFlight review
- App Store review submission
- privacy nutrition labels
- price/tax/payment setup

Runbook:

```text
docs/operations/ios-testflight-submission-guidance.md
```

### Android / Google Play

Android is upload-oriented after Play Console bootstrap exists.

Codex can usually help with:

- package name and EAS/Gradle build checks
- service account credential setup validation
- AAB build and Google Play internal upload
- Play listing metadata and images through the Publishing API
- release notes and fastlane-compatible metadata files
- manifest permission hardening before submit

Codex cannot fully automate:

- initial Play app creation
- some App content forms
- account agreements and Play App Signing terms
- truth-sensitive data safety, age, ads, and policy declarations without owner confirmation

Runbooks:

```text
docs/operations/android-play-submission-guidance.md
docs/operations/mobile-store-submission-model.md
```

### Store Downloads And Reporting

Store downloads reporting is a read/aggregate/write workflow.

Codex can:

- read App Store Connect daily Sales reports
- read Google Play monthly stats CSVs
- normalize weekly totals
- produce JSON output
- upsert Notion rows when a Notion token is available

Runbook:

```text
docs/operations/store-downloads-notion-automation.md
```

## Evidence Expectations

Every operational run should leave enough evidence for another operator to understand what happened.

Minimum evidence:

- command executed
- credential source without secret value
- target app/project/package
- read/write mode
- external result URL when available
- produced artifact path
- blocker and next action when incomplete

Good evidence files live under the target project's docs, for example:

```text
docs/[project-name]/validation-report.md
docs/[project-name]/play-store-preflight.md
docs/[project-name]/deploy.md
```

## Quick Start For A New Operator

1. Read this file.
2. Read `docs/architecture/service-map.md` for the service-level map.
3. Use `docs/reference/decision-tree.md` to choose the right workflow.
4. Open the specific operational runbook for the service you need.
5. Run read/preflight commands before write/submit commands.
6. Store missing credentials outside git.
7. Record evidence in the target repo before declaring the run complete.
