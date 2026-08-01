# App Registry

The app registry maps friendly app names to the repo, artifact, platform, and release state needed by `app-autopilot`.

This file is a public schema and lightweight example. Private or machine-specific registries may live outside the repo and be passed as `registry_path`, `--registry`, or `VIBERMODE_APP_REGISTRY`.

For the general local setup rules, read `docs/operations/local-environment.md`.

## Schema

```json
{
  "version": 1,
  "apps": [
    {
      "name": "StudyBud",
      "aliases": ["studybud", "study-bud"],
      "platform": "ios",
      "target_repo": "/absolute/path/to/generated-products/studybud/ios-app",
      "project_name": "studybud",
      "artifact_root": "/absolute/path/to/generated-products/studybud/ios-app/docs/studybud",
      "change_request_path": "/absolute/path/to/generated-products/studybud/ios-app/docs/studybud/change-request.md",
      "run_manifest_path": "/absolute/path/to/app-factory-state/factory/runs/run-id.json",
      "bundle_id": "com.example.studybud",
      "default_release_target": "ios-testflight",
      "release_context": {
        "app_store_connect": {
          "app_id": "1234567890",
          "bundle_id": "com.example.studybud",
          "provider_short_name": "TEAMSHORT",
          "internal_test_command": "node scripts/ios-submit-testflight.mjs --run-manifest RUN_MANIFEST --submit --commit-state",
          "final_submit_supported": false,
          "manual_console_url": "https://appstoreconnect.apple.com/apps/1234567890/appstore"
        }
      },
      "submit_when_ready_default": false,
      "forbid_dirty": []
    }
  ]
}
```

## Resolver

Use the resolver before asking the user for paths:

```bash
npm run app:resolve -- --app StudyBud
```

Optional inputs:

```bash
npm run app:resolve -- \
  --app StudyBud \
  --registry /absolute/path/to/app-registry.json \
  --workspace-root /absolute/path/to/ViberModeWorkspaces \
  --state-root /absolute/path/to/app-factory-state \
  --generated-products-root /absolute/path/to/generated-products
```

The resolver checks, in order:

- `--registry` or `VIBERMODE_APP_REGISTRY`
- `docs/operations/app-registry.local.json`
- `docs/operations/app-registry.json`
- app factory run manifests under `--state-root`, `APP_FACTORY_STATE_ROOT`, or `VIBERMODE_WORKSPACE_ROOT/app-factory-state`
- generated product workspaces under `--generated-products-root`, `VIBERMODE_GENERATED_PRODUCTS_ROOT`, or `VIBERMODE_WORKSPACE_ROOT/generated-products`

`docs/operations/app-registry.local.json` is gitignored for machine-specific app paths.

New factory-prepared iOS apps should not need manual registry entries. `scripts/ios-app-factory-prepare.mjs` writes an `app_autopilot` block into the run manifest, and `npm run app:resolve` can resolve the app from that manifest.

## Fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | Human display name used in prompts and reports |
| `aliases` | yes | Lowercase aliases the user may type |
| `platform` | yes | `ios`, `android`, `web`, or `custom` |
| `target_repo` | yes | Absolute repo path |
| `project_name` | yes | Artifact folder slug under `docs/` |
| `artifact_root` | recommended | Absolute artifact directory |
| `change_request_path` | recommended | Default inbox for user notes and self-improve generated notes |
| `run_manifest_path` | required for generated mobile submitters | Factory run manifest for TestFlight or Google Play internal submission |
| `bundle_id` | recommended for iOS | Non-secret Apple bundle identifier |
| `package_name` | recommended for Android | Non-secret Google Play package name/application ID |
| `default_release_target` | recommended | `none`, `ios-testflight`, `android-play-internal`, or `all-internal-test` |
| `release_context` | recommended for Slack/app automation | Non-secret store routing hints, console IDs, known commands, and support status |
| `submit_when_ready_default` | optional | Keep false unless an app-specific automation is intentionally release-bound |
| `forbid_dirty` | optional | Repos that must remain unchanged for scope guard checks |

### Release Context

Use `release_context` to keep Rox from rediscovering the same store details every time. It may include only non-secret routing information:

```json
{
  "release_context": {
    "app_store_connect": {
      "app_id": "1234567890",
      "bundle_id": "com.example.ios",
      "provider_short_name": "TEAMSHORT",
      "run_manifest_path": "/absolute/path/to/ios-run.json",
      "internal_test_command": "node scripts/ios-submit-testflight.mjs --run-manifest RUN_MANIFEST --submit --commit-state",
      "final_submit_supported": false,
      "manual_console_url": "https://appstoreconnect.apple.com/apps/1234567890/appstore"
    },
    "google_play": {
      "package_name": "com.example.android",
      "run_manifest_path": "/absolute/path/to/android-run.json",
      "internal_track": "internal",
      "internal_test_command": "node scripts/android-submit-play-internal.mjs --run-manifest RUN_MANIFEST --build --submit --confirm-play-console-bootstrap --commit-state",
      "play_console_bootstrap": "required_before_first_upload",
      "final_submit_supported": false,
      "manual_console_url": "https://play.google.com/console/u/0/developers"
    }
  }
}
```

Resolver behavior:

- `npm run app:resolve` preserves `release_context` from registry entries and app factory manifests.
- Platform submitters still use `run_manifest_path` as the executable source of truth.
- `manual_console_url` is an operator navigation hint, not approval to perform a final submit.

## Rules

- Do not store credentials, API keys, signing material, or Apple/Google secrets.
- Do not store App Store Connect API keys, issuer IDs if considered sensitive in your setup, Google service account emails/JSON, keystore aliases/passwords, Play signing keys, or session cookies.
- Prefer absolute paths in private registries because automations may run from different working directories.
- Do not commit `docs/operations/app-registry.local.json`; it is for one operator's local machine.
- Public docs must not assume one user's home directory. Use variables, CLI flags, or placeholder absolute paths.
- Use one entry per app repo. Multi-platform apps should either use separate entries per platform with shared aliases, or an explicit `platforms` extension in a private registry.
- When the owner says `ikisini de teste gonder` or `all-internal-test`, resolve all matching platform entries for the app and run the iOS and Android internal tester submitters sequentially.
- Keep `submit_when_ready_default` false for general use. Set it true only for a dedicated manual automation whose purpose is internal tester release.
- If `run_manifest_path` is missing, `submit-only` may run preflight only when the platform submitter can infer enough state from the repo; otherwise it must block with an exact missing-manifest error.
