# Ads Env Handoff

This runbook is for handing Meta, Google Ads, and TikTok Ads reporting access to another ViberMode operator with a single local env file.

## Current Status

Checked on 2026-07-05.

| Platform | Status | What Is Still Needed |
| --- | --- | --- |
| Meta Ads | Existing operator pattern is ready when `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` are present. | Fill the live Meta env values. |
| Google Ads | Customer listing works for `7826540166`; reporting is blocked by `403` until Basic Access is approved. Ticket: `[4-5207000041605]`. | After Google approval, use the approved developer token plus service-account or OAuth auth values. |
| TikTok Ads | Advertiser id `7332897087052627970` is known. Developer profile is under review with `https://kantakademi.com/` and `Reporting`. | After TikTok approval, fill access token, app id, and app secret. |

## Handoff File

Use the focused template:

```bash
cp .ads.env.example .ads.env
```

Fill `.ads.env` with the live values. The repository ignores `.ads.env`, so it is intended to remain local.

The scripts also load `.vibermode-automation.env` by default. For a clean teammate handoff, prefer `.ads.env` and pass it explicitly with `--env-file .ads.env`.

Blank secret values in `.ads.env.example` are intentional. Do not replace them with literal placeholders such as `REPLACE_ME`; the scripts treat any non-empty value as real input.

## Variables

```bash
# Meta Ads
META_API_VERSION=v21.0
META_AD_ACCOUNT_ID=
META_ACCESS_TOKEN=
META_APP_ID=
META_APP_SECRET=

# Google Ads
GOOGLE_ADS_API_VERSION=v24
GOOGLE_ADS_CUSTOMER_ID=7826540166
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64=
GOOGLE_ADS_JSON_KEY_FILE_PATH=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=

# TikTok Ads
TIKTOK_API_VERSION=v1.3
TIKTOK_ADVERTISER_ID=7332897087052627970
TIKTOK_ACCESS_TOKEN=
TIKTOK_APP_ID=
TIKTOK_APP_SECRET=
TIKTOK_REPORT_TYPE=BASIC
TIKTOK_DATA_LEVEL=AUCTION_AD
TIKTOK_REPORT_DIMENSIONS=campaign_id,adgroup_id,ad_id,stat_time_day
TIKTOK_REPORT_METRICS=spend,impressions,clicks,ctr,cpc,cpm,conversion,cost_per_conversion
```

## Teammate Setup

From the repository root:

```bash
npm run install:codex
cp .ads.env.example .ads.env
```

Fill `.ads.env`, then validate without printing secret values:

```bash
node adapters/codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs \
  --env-file .ads.env \
  --check-keychain

node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --env-file .ads.env \
  --check-keychain

node adapters/codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs \
  --env-file .ads.env \
  --check-keychain
```

`--check-keychain` also reports whether direct env variables were loaded from `.ads.env`.

Presence checks do not prove the token is approved or scoped correctly; the read-only smoke reports below are the real verification.

## Read-Only Smoke Checks

Meta:

```bash
node adapters/codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs \
  --env-file .ads.env \
  --date-preset last_7d \
  --format markdown
```

Google Ads:

```bash
node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --env-file .ads.env \
  --list-customers

node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --env-file .ads.env \
  --date-preset LAST_7_DAYS \
  --format markdown
```

TikTok Ads:

```bash
node adapters/codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs \
  --env-file .ads.env \
  --date-preset last_7d \
  --format markdown
```

## Expected Temporary Failures

- Google Ads weekly report can return `403 Forbidden` until Basic Access is approved.
- TikTok Ads weekly report will fail with missing token/app credentials until TikTok approves the developer profile/app.
- Meta should run as soon as the live Meta access token and ad account id are filled.

## Codex Prompt For The Teammate

```text
Use the ad platform operator docs in docs/operations/ads-env-handoff.md. Load credentials from .ads.env with --env-file .ads.env. Validate Meta, Google Ads, and TikTok Ads without printing secrets. Run read-only weekly reports only. Do not create, activate, pause, delete, or change budgets without explicit approval.
```

Platform-specific setup details live in:

- `docs/operations/meta-ads-codex-setup.md`
- `docs/operations/google-ads-codex-setup.md`
- `docs/operations/tiktok-ads-codex-setup.md`
