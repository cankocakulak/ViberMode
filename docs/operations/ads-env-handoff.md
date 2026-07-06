# Ads Env Handoff

This runbook is for handing Meta, Google Ads, and TikTok Ads reporting access to another ViberMode operator with the standard local ViberMode env file.

## Current Status

Checked on 2026-07-07.

| Platform | Status | What Is Still Needed |
| --- | --- | --- |
| Meta Ads | Existing operator pattern is ready when `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` are present. | Fill the live Meta env values. |
| Google Ads | Approved for Standard Access. `customers/7826540166` lists correctly and the read-only `LAST_7_DAYS` report succeeds. MCC: `4901176544`. | Teammate needs the same developer token and service-account or OAuth auth values in local env/Keychain. |
| TikTok Ads | Advertiser id `7332897087052627970` is known. Developer profile is under review with `https://kantakademi.com/` and `Reporting`; app credentials are not available yet. | After TikTok approval, fill access token, app id, and app secret. |

## Handoff File

Use the standard local automation env:

```bash
cp .vibermode-automation.env.example .vibermode-automation.env
chmod 600 .vibermode-automation.env
```

Fill `.vibermode-automation.env` with live values only on the local machine. The repository ignores this file, so it is intended to remain local.

The report scripts load `.vibermode-automation.env` automatically. They also fall back to the standard macOS Keychain service names documented in the platform setup files.

Blank secret values are intentional. Do not replace them with literal placeholders such as `REPLACE_ME`; the scripts treat any non-empty value as real input.

## Variables

```bash
# Meta Ads
META_API_VERSION=v21.0
META_KEYCHAIN_PREFIX=viberboyz-meta
META_AD_ACCOUNT_ID=
META_ACCESS_TOKEN=
META_APP_ID=
META_APP_SECRET=

# Google Ads
GOOGLE_ADS_API_VERSION=v24
GOOGLE_ADS_KEYCHAIN_PREFIX=viberboyz-google-ads
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
TIKTOK_KEYCHAIN_PREFIX=viberboyz-tiktok
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
cp .vibermode-automation.env.example .vibermode-automation.env
chmod 600 .vibermode-automation.env
```

Fill `.vibermode-automation.env` or the documented Keychain services, then validate without printing secret values:

```bash
node adapters/codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs \
  --check-keychain

node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --check-keychain

node adapters/codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs \
  --check-keychain
```

`--check-keychain` reports whether direct env variables and Keychain-backed values are present without printing secret values.

Presence checks do not prove the token is approved or scoped correctly; the read-only smoke reports below are the real verification.

## Read-Only Smoke Checks

Meta:

```bash
node adapters/codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs \
  --date-preset last_7d \
  --format markdown
```

Google Ads:

```bash
node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --list-customers

node adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --date-preset LAST_7_DAYS \
  --format markdown
```

TikTok Ads:

```bash
node adapters/codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs \
  --date-preset last_7d \
  --format markdown
```

## Expected Temporary Failures

- TikTok Ads weekly report will fail with missing token/app credentials until TikTok approves the developer profile/app.
- Google Ads is no longer approval-blocked. If it returns `403 Forbidden`, check the local developer token, customer id, service-account/OAuth auth mode, and manager access rather than waiting for Basic Access.
- Meta should run as soon as the live Meta access token and ad account id are filled.

## Codex Prompt For The Teammate

```text
Use the ad platform operator docs in docs/operations/ads-env-handoff.md. Load local credentials from .vibermode-automation.env and the documented Keychain services. Validate Meta, Google Ads, and TikTok Ads without printing secrets. Google Ads Standard Access is approved, so run the read-only LAST_7_DAYS Google Ads report for customer 7826540166. Run Meta read-only last_7d if Meta credentials are present. TikTok is still expected to be pending until developer profile/app approval; if TIKTOK_ACCESS_TOKEN or app credentials are missing, report that clearly instead of trying write actions. Do not create, activate, pause, delete, upload audiences, or change budgets without explicit approval.
```

Platform-specific setup details live in:

- `docs/operations/meta-ads-codex-setup.md`
- `docs/operations/google-ads-codex-setup.md`
- `docs/operations/tiktok-ads-codex-setup.md`
