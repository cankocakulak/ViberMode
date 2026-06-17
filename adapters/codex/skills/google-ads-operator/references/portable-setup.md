# Google Ads Operator Portable Setup

Use this when bootstrapping the Google Ads operator on a new computer or in a fresh Codex environment.

## Goal

Install the `google-ads-operator` Codex skill and configure a local environment so Codex can safely read Google Ads performance data and, after explicit approval, plan or perform paused draft ad operations through the Google Ads API.

## What Must Exist

- Node.js 18 or newer.
- A Google Ads manager account for obtaining a developer token.
- A Google Ads client account to query.
- A developer token from the Google Ads API Center.
- A customer id for the target client account, without hyphens.
- Optional but common: a login customer id for the manager account, without hyphens.
- One auth mode:
  - Service account JSON/key that has been granted access in Google Ads, or
  - OAuth client id, client secret, and refresh token.

Google's current quickstart documents `v24`, developer tokens, client customer IDs, and service account setup. Google's service-account workflow also requires adding the service account email as a user in the Google Ads account.

## Files To Copy Or Recreate

Copy or install this folder:

```text
~/.codex/skills/google-ads-operator/
```

Required files:

```text
SKILL.md
agents/openai.yaml
scripts/google_ads_report.mjs
references/workflows.md
references/write-safety.md
references/portable-setup.md
```

After copying, ensure the report script is executable:

```bash
chmod +x ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs
```

## Keychain And Environment Variables

Do not hard-code tokens in scripts or docs. Preferred local storage is macOS Keychain:

| Env var | Keychain service |
| --- | --- |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `viberboyz-google-ads-developer-token` |
| `GOOGLE_ADS_CUSTOMER_ID` | `viberboyz-google-ads-customer-id` |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | `viberboyz-google-ads-login-customer-id` |
| `GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64` | `viberboyz-google-ads-service-account-json-b64` |
| `GOOGLE_ADS_CLIENT_ID` | `viberboyz-google-ads-client-id` |
| `GOOGLE_ADS_CLIENT_SECRET` | `viberboyz-google-ads-client-secret` |
| `GOOGLE_ADS_REFRESH_TOKEN` | `viberboyz-google-ads-refresh-token` |

Store non-printable values safely:

```bash
read -rsp "GOOGLE_ADS_DEVELOPER_TOKEN: " GOOGLE_ADS_DEVELOPER_TOKEN; echo
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-developer-token" -w "$GOOGLE_ADS_DEVELOPER_TOKEN"
unset GOOGLE_ADS_DEVELOPER_TOKEN

read -rp "GOOGLE_ADS_CUSTOMER_ID (no hyphens): " GOOGLE_ADS_CUSTOMER_ID
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-customer-id" -w "$GOOGLE_ADS_CUSTOMER_ID"
unset GOOGLE_ADS_CUSTOMER_ID

read -rp "GOOGLE_ADS_LOGIN_CUSTOMER_ID (optional, no hyphens): " GOOGLE_ADS_LOGIN_CUSTOMER_ID
[ -n "$GOOGLE_ADS_LOGIN_CUSTOMER_ID" ] && security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-login-customer-id" -w "$GOOGLE_ADS_LOGIN_CUSTOMER_ID"
unset GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

For service account auth:

```bash
GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64="$(base64 -i /path/to/google-ads-service-account.json)"
security add-generic-password -U -a "$USER" -s "viberboyz-google-ads-service-account-json-b64" -w "$GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64"
unset GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64
```

For OAuth refresh-token auth:

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

For automation, `.vibermode-automation.env` only needs non-secret defaults:

```bash
GOOGLE_ADS_API_VERSION=v24
GOOGLE_ADS_KEYCHAIN_PREFIX=viberboyz-google-ads
```

Direct env variables are also supported, but should remain local-only:

```bash
export GOOGLE_ADS_DEVELOPER_TOKEN="..."
export GOOGLE_ADS_CUSTOMER_ID="1234567890"
export GOOGLE_ADS_LOGIN_CUSTOMER_ID="0987654321"
export GOOGLE_ADS_JSON_KEY_FILE_PATH="/absolute/path/to/service-account.json"
```

## Validation Commands

Check Node and script syntax:

```bash
node --version
node --check ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs
```

Check Keychain fallback without printing secrets:

```bash
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs --check-keychain
```

List accessible customers:

```bash
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs --list-customers
```

Run a weekly Markdown report:

```bash
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --date-preset LAST_7_DAYS \
  --format markdown
```

## Codex Bootstrap Prompt

Use this prompt after the files and env vars are present:

```text
Use $google-ads-operator. Validate the local Google Ads environment without printing secrets, then run a read-only LAST_7_DAYS report for GOOGLE_ADS_CUSTOMER_ID in Markdown format. Include totals, campaign table, conversion signals, waste watchlist, and concrete next actions. Do not perform any write actions.
```

## Troubleshooting

`GOOGLE_ADS_DEVELOPER_TOKEN is required`

- Set the developer token in env, `.vibermode-automation.env`, or Keychain.

`GOOGLE_ADS_CUSTOMER_ID or --customer is required`

- Set the target customer id without hyphens.

`INVALID_CUSTOMER_ID`

- Remove hyphens from `GOOGLE_ADS_CUSTOMER_ID` and `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.

Permission or login customer errors

- Confirm the service account or OAuth user has access to the target account.
- If the target account is under a manager account, set `GOOGLE_ADS_LOGIN_CUSTOMER_ID` to that manager id without hyphens.
