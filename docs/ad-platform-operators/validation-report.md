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

Updated on 2026-07-07:

- Google Ads is verified with live read-only API access. `--list-customers` returns `customers/7826540166`, and the default `LAST_7_DAYS` campaign report succeeds.
- Meta Ads read-only `last_7d` report succeeds from the local `.vibermode-automation.env`/Keychain setup.
- TikTok Ads remains blocked until developer profile/app approval completes and `TIKTOK_ACCESS_TOKEN` plus app credentials are available.

No live TikTok API report has been run yet because the access token/app credentials are not available.

Additional commands run:

```bash
node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs --list-customers
node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs
node adapters/codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs --date-preset last_7d --format markdown
node adapters/codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs --date-preset last_7d --format markdown
npm run validate
```

The TikTok command returned the expected local setup error: `TIKTOK_ACCESS_TOKEN is required`.
