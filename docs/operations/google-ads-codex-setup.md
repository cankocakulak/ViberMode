# Google Ads Codex Setup

This document is for a developer or Codex agent setting up the Google Ads operator after cloning this repository on a new computer.

Research snapshot: checked on 2026-06-16 against the official Google Ads API quickstart, client library configuration, and service-account workflow docs.

## Clone-Time Flow

1. Install the bundled Codex skills.
2. Configure Google Ads API environment variables locally.
3. Validate read-only API access.
4. Start or open a Codex chat and ask it to use `$google-ads-operator`.
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

The Google Ads skill source is:

```text
adapters/codex/skills/google-ads-operator/
```

## 2. Configure Local Secrets

Do not commit secrets. Preferred local storage is macOS Keychain with this service-name convention:

| Env var | Keychain service |
| --- | --- |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `viberboyz-google-ads-developer-token` |
| `GOOGLE_ADS_CUSTOMER_ID` | `viberboyz-google-ads-customer-id` |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | `viberboyz-google-ads-login-customer-id` |
| `GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64` | `viberboyz-google-ads-service-account-json-b64` |
| `GOOGLE_ADS_CLIENT_ID` | `viberboyz-google-ads-client-id` |
| `GOOGLE_ADS_CLIENT_SECRET` | `viberboyz-google-ads-client-secret` |
| `GOOGLE_ADS_REFRESH_TOKEN` | `viberboyz-google-ads-refresh-token` |

Store required identifiers and tokens:

```bash
read -rsp "GOOGLE_ADS_DEVELOPER_TOKEN: " GOOGLE_ADS_DEVELOPER_TOKEN; echo
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-developer-token" -w "$GOOGLE_ADS_DEVELOPER_TOKEN"
unset GOOGLE_ADS_DEVELOPER_TOKEN

read -rp "GOOGLE_ADS_CUSTOMER_ID (no hyphens): " GOOGLE_ADS_CUSTOMER_ID
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-customer-id" -w "$GOOGLE_ADS_CUSTOMER_ID"
unset GOOGLE_ADS_CUSTOMER_ID

read -rp "GOOGLE_ADS_LOGIN_CUSTOMER_ID (optional manager id, no hyphens): " GOOGLE_ADS_LOGIN_CUSTOMER_ID
[ -n "$GOOGLE_ADS_LOGIN_CUSTOMER_ID" ] && security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-login-customer-id" -w "$GOOGLE_ADS_LOGIN_CUSTOMER_ID"
unset GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

### Service Account Auth

Use this when the service account email has been added to the target Google Ads account or manager account.

```bash
GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64="$(base64 -i /path/to/google-ads-service-account.json)"
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-service-account-json-b64" -w "$GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64"
unset GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64
```

Direct file env is also supported:

```bash
export GOOGLE_ADS_JSON_KEY_FILE_PATH="/absolute/path/to/google-ads-service-account.json"
```

### OAuth Refresh Token Auth

Use this when you prefer the standard installed/web app OAuth flow.

```bash
read -rp "GOOGLE_ADS_CLIENT_ID: " GOOGLE_ADS_CLIENT_ID
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-client-id" -w "$GOOGLE_ADS_CLIENT_ID"
unset GOOGLE_ADS_CLIENT_ID

read -rsp "GOOGLE_ADS_CLIENT_SECRET: " GOOGLE_ADS_CLIENT_SECRET; echo
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-client-secret" -w "$GOOGLE_ADS_CLIENT_SECRET"
unset GOOGLE_ADS_CLIENT_SECRET

read -rsp "GOOGLE_ADS_REFRESH_TOKEN: " GOOGLE_ADS_REFRESH_TOKEN; echo
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-refresh-token" -w "$GOOGLE_ADS_REFRESH_TOKEN"
unset GOOGLE_ADS_REFRESH_TOKEN
```

For one terminal session, values can also be loaded from Keychain into env:

```bash
export GOOGLE_ADS_DEVELOPER_TOKEN="$(security find-generic-password -a "$USER" -s "viberboyz-google-ads-developer-token" -w)"
export GOOGLE_ADS_CUSTOMER_ID="$(security find-generic-password -a "$USER" -s "viberboyz-google-ads-customer-id" -w)"
export GOOGLE_ADS_LOGIN_CUSTOMER_ID="$(security find-generic-password -a "$USER" -s "viberboyz-google-ads-login-customer-id" -w 2>/dev/null || true)"
export GOOGLE_ADS_API_VERSION="v24"
```

The report script automatically falls back to these Keychain services when env vars are not set. To configure automation without storing Google Ads secrets in `.vibermode-automation.env`, add only non-secret defaults:

```bash
GOOGLE_ADS_API_VERSION=v24
GOOGLE_ADS_KEYCHAIN_PREFIX=viberboyz-google-ads
```

Required for normal reports:

```text
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_CUSTOMER_ID
one auth mode: service account JSON/path/B64 or OAuth refresh token credentials
```

Optional when accessing a client account through a manager:

```text
GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

## 3. Validate Without Printing Secrets

```bash
printf 'DEV_TOKEN_LEN=%s\nCUSTOMER=%s\nLOGIN_CUSTOMER=%s\nAPI=%s\n' "${#GOOGLE_ADS_DEVELOPER_TOKEN}" "$GOOGLE_ADS_CUSTOMER_ID" "$GOOGLE_ADS_LOGIN_CUSTOMER_ID" "${GOOGLE_ADS_API_VERSION:-v24}"
node --check ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs --check-keychain
```

List accessible customers:

```bash
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs --list-customers
```

Run the default weekly report:

```bash
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --date-preset LAST_7_DAYS \
  --format markdown
```

This works with either direct env vars or the standard Keychain services above.

## 4. Codex Bootstrap Prompt

Paste this into a new Codex chat after installing the skill and configuring env vars:

```text
Use $google-ads-operator. Validate the local Google Ads environment without printing secrets, then run a read-only LAST_7_DAYS report for GOOGLE_ADS_CUSTOMER_ID in Markdown format. Include account totals, campaign table, conversion signals, waste watchlist, and concrete next actions. Do not perform any write actions.
```

For a dedicated ongoing chat, use this:

```text
This thread is the Google Ads Weekly Operator surface. Use $google-ads-operator for Google Ads requests. Default to read-only weekly reporting for LAST_7_DAYS, Markdown table output, campaign/ad group/ad/keyword analysis when requested, conversion signals, waste watchlist, and concrete next actions. Never print developer tokens, service account JSON, refresh tokens, or client secrets. Do not create, activate, pause, or change budgets without explicit current-turn approval. For write plans, default to PAUSED drafts and read created resources back before summarizing.
```

## Safety Rules

- Reporting is read-only.
- Never print developer tokens, service account JSON, refresh tokens, client secrets, or signed media URLs.
- Create campaigns, ad groups, ads, assets, and keywords in `PAUSED` status unless activation is explicitly approved.
- Require explicit approval before activation, budget increase, active targeting change, pausing active delivery, customer match upload, conversion upload, or deletion/removal.
- After any write, read changed resources back and report resource names/statuses.

## Expected Repo Contents

```text
adapters/codex/skills/google-ads-operator/SKILL.md
adapters/codex/skills/google-ads-operator/agents/openai.yaml
adapters/codex/skills/google-ads-operator/scripts/google_ads_report.mjs
adapters/codex/skills/google-ads-operator/references/workflows.md
adapters/codex/skills/google-ads-operator/references/write-safety.md
adapters/codex/skills/google-ads-operator/references/portable-setup.md
docs/operations/google-ads-codex-setup.md
```

## Source Notes

- Google Ads API quickstart: `https://developers.google.com/google-ads/api/docs/get-started/make-first-call`
- Google Ads API client libraries/configuration: `https://developers.google.com/google-ads/api/docs/client-libs`
- Google Ads API service account workflow: `https://developers.google.com/google-ads/api/docs/oauth/service-accounts`
