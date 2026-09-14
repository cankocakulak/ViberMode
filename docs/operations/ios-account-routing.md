# Per-app iOS deployment accounts

For an existing/transferred app, commit `ios-deployment.json` at the actual iOS workspace root (next to its Xcode project). This is deployment-tool configuration, not an app runtime `.env` file. Do not put company-specific defaults or secret keys in the shared framework.

```json
{
  "schemaVersion": 1,
  "keychainPrefix": "recipient",
  "appleTeamId": "ABCDEFGHIJ",
  "ascIssuerId": "12345678-abcd-1234-abcd-123456789012",
  "bundleId": "com.example.app",
  "appStoreAppId": "1234567890"
}
```

Replace all example identifiers with verified values. The six fields are required. This mode binds an **existing** ASC app; do not use invented app IDs for new app creation.

On each developer's Mac provision these separate Keychain services through a secure handoff, using the local macOS username as the account:

- `<prefix>-apple-team-id`
- `<prefix>-asc-key-id`
- `<prefix>-asc-issuer-id`
- `<prefix>-asc-api-key-p8-b64` (secret; private .p8 encoded as base64)
- `<prefix>-apple-id`

Do not share private keys in Git, ordinary chat, app `.env`, or Swift configuration. ASC user invitations alone do not install signing certificates/private keys on another Mac. API access alone does not prove signing readiness.

## Safe account check

```sh
node scripts/ios-submit-testflight.mjs --account-preflight --workspace /path/to/ios
```

This reads Keychain and performs a single GET for the exact ASC app, checking the bundle ID. No manifest, Xcode generation, archive, assets, upload or Apple mutation. It proves authenticated app access, **not** complete release readiness or upload permission.

## Submission behavior

The normal submitter auto-loads the binding from its resolved workspace. Bound profiles reject conflicting prefixes, global credential overrides and Apple-session authentication. Credentials are one atomic Keychain namespace; CI environment injection is not yet supported in bound mode. Team/issuer/app checks cannot be bypassed by `--allow-incomplete`. Bound apps always skip listing creation and require explicit `--version` and `--build-number` for `--submit` so historical manifest versions are not silently reused.

Apps without this file keep the existing CLI/environment/default credential selection for compatibility. This is not an account lock for arbitrary third-party upload scripts or old worktrees: update the deployment config and project team in the branch/worktree actually used for release. Keep `project.yml`, generated project and export team consistent. Never switch every app just because one transfer finished.

All existing quality, archive, export and upload gates still apply. For Icon Composer apps, the legacy submission-asset checker may require a separate compatibility update; do not auto-generate a replacement icon or bypass quality checks to compensate.
