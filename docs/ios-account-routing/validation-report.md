# Account-routing setup validation — 2026-09-14

## Validation Scope

TASK-001: **PASS for deployment setup and routing only** (declared level `quick`). This is not a successful app build, archive/export, TestFlight upload or production smoke result. No Swift/runtime behavior changed.

## Commands Attempted

From ViberMode:

- `node --test tests/ios-account-profile.test.mjs` — exit 0, 9/9 tests passed (run twice).
- `node --check scripts/ios-submit-testflight.mjs` — exit 0.
- `git diff --check` — exit 0.
- `node scripts/ios-submit-testflight.mjs --account-preflight --workspace /Users/mcan/kids/kids-ios` — exit 0, live `account_verified`.
- `node /Users/mcan/.codex/skills/viber-mode/scripts/ios-submit-testflight.mjs --account-preflight --workspace /Users/mcan/kids/kids-ios` — exit 0, same live result through installed runtime.
- `node scripts/ios-submit-testflight.mjs --run-manifest /Users/mcan/kids/docs/easyspell/release/ios-internal-manifest.json --workspace /Users/mcan/kids/kids-ios --scheme Easyspell --skip-produce` — exit 1, expected `preflight_blocked` for existing review/icon gaps. Without a prefix flag, the normal submission path automatically selected the bound account and reported `account_verified`; asset preparation was `not_requested`. This was read-only and did not authorize reusing the historical version.

From the authorized app workspace:

- `./Scripts/generate_project.sh` — exit 0. Regenerated project diff contains only the expected team substitutions.
- `xcodebuild -project Easyspell.xcodeproj -scheme Easyspell -configuration Release -showBuildSettings -json` — exit 0; filtered output confirms expected team/bundle. Destination warning led to the explicit-device repeat below.
- `xcodebuild -project Easyspell.xcodeproj -scheme Easyspell -configuration Release -destination 'generic/platform=iOS' -showBuildSettings -json` — exit 0, consumed via a Node JSON assertion with shell pipefail. Correct team, original bundle, automatic signing.
- `plutil -lint Configs/ExportOptions-AppStore.plist /Users/mcan/kids/docs/easyspell/release/ExportOptions-internal.plist /Users/mcan/kids/docs/easyspell/release/ExportOptions-internal-manual.plist` — exit 0, all three OK.
- `git diff --check` — exit 0.

Additional executed Node assertion checks: byte-for-byte equality of all five synchronized framework files; spawn legacy uploader with no arguments and assert exit 1 plus the retirement message (before credential access). Assertion process exit 0.

## Environment

macOS, Xcode 26.3, Node, Fastlane and XcodeGen installed. Source framework and installed Codex support bundle both tested. The selected app checkout is a development branch, not an asserted next-release source. Unrelated framework dirty files were preserved. No global credentials were overwritten.

## Scenario Results

- Valid complete binding selects one Keychain namespace: PASS.
- Wrong prefix, team, issuer, bundle, CLI/environment override or Apple-session authentication: rejected.
- Missing/malformed/secret-bearing config: rejected; absent config preserves unbound legacy behavior.
- HTTP denial, network failure, wrong returned app or invalid private key: rejected before submission.
- JWT signature and five-minute lifetime checked by tests; request is GET-only, fixed Apple host, redirects forbidden, bounded timeout.
- Explicit version/build required for bound live submission, even with allow-incomplete; existing app listing creation skipped.
- Live account access and effective device signing settings: PASS.
- Historical uploader: intentionally disabled; original implementation retained below the guard for audit. Old manual export helper now uses automatic recipient-team selection; no guessed profile name.

## Failures and Blockers

No failures in the setup task's declared checks. Full app archive/export/upload was deliberately not attempted. The older release manifest is not a valid next-release instruction. Existing factory Stage 3 review evidence gaps and `.icon`/legacy `.appiconset` checker incompatibility remain release-preflight blockers; no gates were bypassed and no replacement app icon generated. A real candidate archive/export, entitlement review and purchase/restore smoke test are still needed before claiming release readiness. Other worktrees/machines need the committed setup integrated; local changes are not pushed.

## Summary (for downstream agents)

Setup routing implemented and verified locally plus authenticated ASC read access. No upload happened. Preserve per-app ownership; never update a pending-transfer app just because another app moved. Use a current approved release source and explicit new version/build for any future submission.
