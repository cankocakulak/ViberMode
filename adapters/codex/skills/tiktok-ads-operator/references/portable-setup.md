# TikTok Ads Operator Portable Setup

Use this when bootstrapping the TikTok Ads operator on a new computer or in a fresh Codex environment.

## Goal

Install the `tiktok-ads-operator` Codex skill and configure a local environment so Codex can safely read TikTok Ads performance data and, after explicit approval, plan or perform paused draft ad operations through TikTok API for Business.

## What Must Exist

- Node.js 18 or newer.
- A TikTok For Business account with access to the advertiser.
- TikTok API for Business developer access and an approved app.
- An access token authorized for the advertiser.
- The target advertiser id.

Recommended access:

- Reporting/read scopes for performance reports.
- Campaign/ad group/ad management scopes only when write workflows are explicitly needed.
- Business Center scopes only when the workflow needs multi-advertiser discovery or user/asset management.

## Files To Copy Or Recreate

Copy or install this folder:

```text
~/.codex/skills/tiktok-ads-operator/
```

Required files:

```text
SKILL.md
agents/openai.yaml
scripts/tiktok_ads_report.mjs
references/workflows.md
references/write-safety.md
references/portable-setup.md
```

After copying, ensure the report script is executable:

```bash
chmod +x ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs
```

## Keychain And Environment Variables

Do not hard-code tokens in scripts or docs. Preferred local storage is macOS Keychain:

| Env var | Keychain service |
| --- | --- |
| `TIKTOK_ACCESS_TOKEN` | `viberboyz-tiktok-access-token` |
| `TIKTOK_ADVERTISER_ID` | `viberboyz-tiktok-advertiser-id` |
| `TIKTOK_APP_ID` | `viberboyz-tiktok-app-id` |
| `TIKTOK_APP_SECRET` | `viberboyz-tiktok-app-secret` |

Store values without printing tokens:

```bash
read -rsp "TIKTOK_ACCESS_TOKEN: " TIKTOK_ACCESS_TOKEN; echo
security add-generic-password -U -a "$USER" -s "viberboyz-tiktok-access-token" -w "$TIKTOK_ACCESS_TOKEN"
unset TIKTOK_ACCESS_TOKEN

read -rp "TIKTOK_ADVERTISER_ID: " TIKTOK_ADVERTISER_ID
security add-generic-password -U -a "$USER" -s "viberboyz-tiktok-advertiser-id" -w "$TIKTOK_ADVERTISER_ID"
unset TIKTOK_ADVERTISER_ID

read -rp "TIKTOK_APP_ID (optional): " TIKTOK_APP_ID
[ -n "$TIKTOK_APP_ID" ] && security add-generic-password -U -a "$USER" -s "viberboyz-tiktok-app-id" -w "$TIKTOK_APP_ID"
unset TIKTOK_APP_ID

read -rsp "TIKTOK_APP_SECRET (optional): " TIKTOK_APP_SECRET; echo
[ -n "$TIKTOK_APP_SECRET" ] && security add-generic-password -U -a "$USER" -s "viberboyz-tiktok-app-secret" -w "$TIKTOK_APP_SECRET"
unset TIKTOK_APP_SECRET
```

For one terminal session, load values from Keychain into env:

```bash
export TIKTOK_ACCESS_TOKEN="$(security find-generic-password -a "$USER" -s "viberboyz-tiktok-access-token" -w)"
export TIKTOK_ADVERTISER_ID="$(security find-generic-password -a "$USER" -s "viberboyz-tiktok-advertiser-id" -w)"
export TIKTOK_API_VERSION="v1.3"
```

For automation, `.vibermode-automation.env` only needs non-secret defaults:

```bash
TIKTOK_API_VERSION=v1.3
TIKTOK_KEYCHAIN_PREFIX=viberboyz-tiktok
TIKTOK_REPORT_TYPE=BASIC
TIKTOK_DATA_LEVEL=AUCTION_AD
TIKTOK_REPORT_DIMENSIONS=campaign_id,adgroup_id,ad_id,stat_time_day
TIKTOK_REPORT_METRICS=spend,impressions,clicks,ctr,cpc,cpm,conversion,cost_per_conversion
```

Direct env variables are also supported, but should remain local-only:

```bash
export TIKTOK_ACCESS_TOKEN="..."
export TIKTOK_ADVERTISER_ID="..."
```

## Validation Commands

Check Node and script syntax:

```bash
node --version
node --check ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs
```

Check Keychain fallback without printing secrets:

```bash
node ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs --check-keychain
```

Run a weekly Markdown report:

```bash
node ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs \
  --date-preset last_7d \
  --format markdown
```

## Codex Bootstrap Prompt

Use this prompt after the files and env vars are present:

```text
Use $tiktok-ads-operator. Validate the local TikTok Ads environment without printing secrets, then run a read-only last_7d report for TIKTOK_ADVERTISER_ID in Markdown format. Include totals, top campaign/ad rows, conversion signals, waste watchlist, and concrete next actions. Do not perform any write actions.
```

## Troubleshooting

`TIKTOK_ACCESS_TOKEN is required`

- The token is not set in the shell, `.vibermode-automation.env`, or Keychain.

`TIKTOK_ADVERTISER_ID or --advertiser is required`

- Set the advertiser id in env/Keychain or pass `--advertiser`.

API error mentioning metrics or dimensions

- TikTok metric availability varies by report type, data level, account type, and authorized scope. Rerun with explicit `--metrics` and `--dimensions`.
