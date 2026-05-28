# App Factory Stage 4 Plan

## Analysis

The app factory already creates a generated iOS repo, runs product-to-code, and records the result in `factory/runs/[run-id].json`. Stage 4 should consume that same manifest, ensure the App Store Connect app exists, archive the generated SwiftUI app, upload it to internal TestFlight, and append submission evidence without creating another repo.

## Strategy

### 1. Approach

Add a TestFlight-first submission stage with a safe default preflight mode. The command should only perform Apple-side mutations when explicitly run with `--submit`; otherwise it validates local inputs, Keychain credentials, Xcode/Fastlane availability, and the generated project shape.

### 2. Changes Required

- `scripts/ios-submit-testflight.mjs`: Add the Stage 4 CLI wrapper.
- `packs/vibermode/workflows/ios-submit-testflight.md`: Document the operational workflow and status rules.
- `packs/vibermode/roles/product/ios-submitter.md`: Add an agent role that follows the workflow.
- `docs/operations/app-factory-automation-overview.md`: Update Stage 4 from future concept to TestFlight-first path.
- `AGENTS.md` and `docs/reference/agent-surface-map.yaml`: Expose the new role/workflow.

### 3. Implementation Hints

- Read Apple credentials from Keychain service names under the `viberboyz-*` prefix.
- Write App Store Connect API key material only to temporary files and remove it after execution.
- Use Fastlane `produce` to create or ensure the app record, then `xcodebuild archive`, `xcodebuild -exportArchive`, and `fastlane pilot upload`.
- Treat internal TestFlight processing delay as `processing`, not as a failure.
- Update the existing run manifest with `submission`; do not create a new run or app repo.

### 4. Verification

Verify with syntax checks, repo validation, and a preflight run against the latest complete factory manifest. Success means the CLI reports all local credentials and Xcode/Fastlane inputs are available without performing a live upload.
