# Ad Platform Operators Validation Report

Date: 2026-06-16

## Commands Run

```bash
node --check adapters/codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs
node --check adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs
node adapters/codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs --check-keychain
node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs --check-keychain
npm run validate
npm run install:codex
node --check ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs
node --check ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs
node ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs --check-keychain
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs --check-keychain
```

## Result

Passed:

- Source script syntax validation.
- Installed script syntax validation.
- Repo reference and task phase validation.
- Codex skill installation.
- Secrets-safe Keychain status checks for both new operators.

Known warning:

- `docs/operations/archive/app-factory-stage4/tasks.json` is a pre-existing legacy task file without `phasePlan`.

## Live API Status

Blocked until credentials are configured locally:

- TikTok credentials were not present in env or Keychain.
- Google Ads credentials were not present in env or Keychain.

No live TikTok or Google Ads API report was run.
