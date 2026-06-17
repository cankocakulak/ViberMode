# TikTok Ads Codex Setup

This document is for a developer or Codex agent setting up the TikTok Ads operator after cloning this repository on a new computer.

Research snapshot: checked on 2026-06-16 against TikTok API for Business portal pages and the official `tiktok/tiktok-business-api-sdk` repository.

## Clone-Time Flow

1. Install the bundled Codex skills.
2. Configure TikTok API environment variables locally.
3. Validate read-only API access.
4. Start or open a Codex chat and ask it to use `$tiktok-ads-operator`.
5. Run read-only reporting first. Do not perform write actions until explicitly approved.

## 1. Install The Skills

From the repository root:

```bash
npm run install:codex
```

This copies all Codex skills under:

```text
adapters/codex/skills/
```

to:

```text
${CODEX_HOME:-$HOME/.codex}/skills/
```

The TikTok Ads skill source is:

```text
adapters/codex/skills/tiktok-ads-operator/
```

## 2. Configure Local Secrets

Do not commit secrets. Preferred local storage is macOS Keychain with this service-name convention:

| Env var | Keychain service |
| --- | --- |
| `TIKTOK_ACCESS_TOKEN` | `viberboyz-tiktok-access-token` |
| `TIKTOK_ADVERTISER_ID` | `viberboyz-tiktok-advertiser-id` |
| `TIKTOK_APP_ID` | `viberboyz-tiktok-app-id` |
| `TIKTOK_APP_SECRET` | `viberboyz-tiktok-app-secret` |

Store values without printing them:

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

For one terminal session, values can also be loaded from Keychain into env:

```bash
export TIKTOK_ACCESS_TOKEN="$(security find-generic-password -a "$USER" -s "viberboyz-tiktok-access-token" -w)"
export TIKTOK_ADVERTISER_ID="$(security find-generic-password -a "$USER" -s "viberboyz-tiktok-advertiser-id" -w)"
export TIKTOK_API_VERSION="v1.3"
```

The report script automatically falls back to these Keychain services when env vars are not set. To configure automation without storing TikTok secrets in `.vibermode-automation.env`, add only non-secret defaults:

```bash
TIKTOK_API_VERSION=v1.3
TIKTOK_KEYCHAIN_PREFIX=viberboyz-tiktok
TIKTOK_REPORT_TYPE=BASIC
TIKTOK_DATA_LEVEL=AUCTION_AD
TIKTOK_REPORT_DIMENSIONS=campaign_id,adgroup_id,ad_id,stat_time_day
TIKTOK_REPORT_METRICS=spend,impressions,clicks,ctr,cpc,cpm,conversion,cost_per_conversion
```

Direct env variables are still supported:

```bash
export TIKTOK_ACCESS_TOKEN="..."
export TIKTOK_ADVERTISER_ID="..."
export TIKTOK_API_VERSION="v1.3"
```

Required for normal reports:

```text
TIKTOK_ACCESS_TOKEN
TIKTOK_ADVERTISER_ID
```

## 3. Validate Without Printing Secrets

```bash
printf 'TOKEN_LEN=%s\nADVERTISER=%s\nAPI=%s\n' "${#TIKTOK_ACCESS_TOKEN}" "$TIKTOK_ADVERTISER_ID" "${TIKTOK_API_VERSION:-v1.3}"
node --check ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs
node ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs --check-keychain
```

Run the default weekly report:

```bash
node ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs \
  --date-preset last_7d \
  --min-spend 100 \
  --format markdown
```

This works with either direct env vars or the standard Keychain services above.

## 4. Codex Bootstrap Prompt

Paste this into a new Codex chat after installing the skill and configuring env vars:

```text
Use $tiktok-ads-operator. Validate the local TikTok Ads environment without printing secrets, then run a read-only last_7d report for TIKTOK_ADVERTISER_ID in Markdown format. Include totals, top campaign/ad rows, conversion signals, waste watchlist, and concrete next actions. Do not perform any write actions.
```

For a dedicated ongoing chat, use this:

```text
This thread is the TikTok Ads Weekly Operator surface. Use $tiktok-ads-operator for TikTok Ads requests. Default to read-only weekly reporting for last_7d, Markdown table output, campaign/ad group/ad analysis, conversion signals, waste watchlist, and concrete next actions. Never print access tokens or app secrets. Do not create, activate, pause, or change budgets without explicit current-turn approval. For write plans, default to paused or non-delivering drafts and read created objects back before summarizing.
```

## Safety Rules

- Reporting is read-only.
- Never print full tokens, app secrets, or signed media URLs.
- Create campaigns, ad groups, ads, and creatives in paused/non-delivering status unless activation is explicitly approved.
- Require explicit approval before activation, budget increase, active targeting change, pausing active delivery, or deletion.
- After any write, read changed objects back and report ids/statuses.

## Expected Repo Contents

```text
adapters/codex/skills/tiktok-ads-operator/SKILL.md
adapters/codex/skills/tiktok-ads-operator/agents/openai.yaml
adapters/codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs
adapters/codex/skills/tiktok-ads-operator/references/workflows.md
adapters/codex/skills/tiktok-ads-operator/references/write-safety.md
adapters/codex/skills/tiktok-ads-operator/references/portable-setup.md
docs/operations/tiktok-ads-codex-setup.md
```

## Source Notes

- TikTok API for Business portal: `https://business-api.tiktok.com/portal/docs`
- Official SDK: `https://github.com/tiktok/tiktok-business-api-sdk`
- Reporting endpoint shape from official SDK: `/open_api/v1.3/report/integrated/get/`
