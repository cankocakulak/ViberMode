# Meta Ads Operator Portable Setup

Use this when bootstrapping the Meta Ads operator on a new computer or in a fresh Codex environment.

## Goal

Install the `meta-ads-operator` Codex skill and configure a local environment so Codex can safely read Meta Ads performance data and, after explicit approval, create paused draft ad objects through the Meta Marketing API.

## What Must Exist

- Node.js 18 or newer.
- A Meta Business account with access to the ad account.
- A Meta app connected to the business.
- A system user token or long-lived access token with the required scopes.
- The target ad account id in `act_<id>` format.

Recommended scopes:

- `ads_read` for reporting.
- `ads_management` for campaign/ad set/ad/creative writes.
- `business_management` for business/system-user related reads and management.
- `pages_show_list` if page context is needed.
- `leads_retrieval` only if raw instant form lead data is required.

## Files To Copy Or Recreate

Copy this folder to the new machine:

```text
~/.codex/skills/meta-ads-operator/
```

Required files:

```text
SKILL.md
agents/openai.yaml
scripts/meta_ads_report.mjs
references/workflows.md
references/write-safety.md
references/portable-setup.md
```

After copying, ensure the report script is executable:

```bash
chmod +x ~/.codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs
```

## Keychain And Environment Variables

Do not hard-code tokens in scripts or docs. Preferred local storage is macOS Keychain:

| Env var | Keychain service |
| --- | --- |
| `META_ACCESS_TOKEN` | `viberboyz-meta-access-token` |
| `META_AD_ACCOUNT_ID` | `viberboyz-meta-ad-account-id` |
| `META_APP_ID` | `viberboyz-meta-app-id` |
| `META_APP_SECRET` | `viberboyz-meta-app-secret` |

If the values already exist in Keychain under different service names, either re-save them with the standard names above or point the automation at the existing entries:

```bash
META_KEYCHAIN_ACCOUNT=mcan
META_ACCESS_TOKEN_KEYCHAIN_SERVICE=existing-access-token-service
META_AD_ACCOUNT_ID_KEYCHAIN_SERVICE=existing-ad-account-service
META_APP_ID_KEYCHAIN_SERVICE=existing-app-id-service
META_APP_SECRET_KEYCHAIN_SERVICE=existing-app-secret-service
```

Store values without printing them:

```bash
read -rsp "META_ACCESS_TOKEN: " META_ACCESS_TOKEN; echo
security add-generic-password -U -a "$USER" -s "viberboyz-meta-access-token" -w "$META_ACCESS_TOKEN"
unset META_ACCESS_TOKEN

read -rp "META_AD_ACCOUNT_ID (act_...): " META_AD_ACCOUNT_ID
security add-generic-password -U -a "$USER" -s "viberboyz-meta-ad-account-id" -w "$META_AD_ACCOUNT_ID"
unset META_AD_ACCOUNT_ID

read -rp "META_APP_ID (optional): " META_APP_ID
[ -n "$META_APP_ID" ] && security add-generic-password -U -a "$USER" -s "viberboyz-meta-app-id" -w "$META_APP_ID"
unset META_APP_ID

read -rsp "META_APP_SECRET (optional): " META_APP_SECRET; echo
[ -n "$META_APP_SECRET" ] && security add-generic-password -U -a "$USER" -s "viberboyz-meta-app-secret" -w "$META_APP_SECRET"
unset META_APP_SECRET
```

For one terminal session, load values from Keychain into env:

```bash
export META_ACCESS_TOKEN="$(security find-generic-password -a "$USER" -s "viberboyz-meta-access-token" -w)"
export META_AD_ACCOUNT_ID="$(security find-generic-password -a "$USER" -s "viberboyz-meta-ad-account-id" -w)"
export META_API_VERSION="v21.0"
export META_APP_ID="$(security find-generic-password -a "$USER" -s "viberboyz-meta-app-id" -w 2>/dev/null || true)"
export META_APP_SECRET="$(security find-generic-password -a "$USER" -s "viberboyz-meta-app-secret" -w 2>/dev/null || true)"
```

The report script automatically falls back to Keychain when direct env vars are not present. For automation, `.vibermode-automation.env` only needs non-secret defaults:

```bash
META_API_VERSION=v21.0
META_KEYCHAIN_PREFIX=viberboyz-meta
```

For non-standard existing Keychain entries, put the `META_*_KEYCHAIN_SERVICE` overrides in `.vibermode-automation.env` instead of the live token values.

Direct env variables are also supported:

```bash
export META_ACCESS_TOKEN="..."
export META_AD_ACCOUNT_ID="act_..."
export META_API_VERSION="v21.0"
export META_APP_ID="..."
export META_APP_SECRET="..."
```

Only `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` are required for normal reporting. `META_APP_ID` and `META_APP_SECRET` are only needed for token debugging.

## Validation Commands

Check Node and script syntax:

```bash
node --version
node --check ~/.codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs
```

Check that environment variables are present without printing secrets:

```bash
printf 'TOKEN_LEN=%s\nACCOUNT=%s\nAPI=%s\n' "${#META_ACCESS_TOKEN}" "$META_AD_ACCOUNT_ID" "${META_API_VERSION:-v21.0}"
```

Check Keychain fallback without printing secrets:

```bash
node ~/.codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs --check-keychain
```

Read ad accounts:

```bash
curl -sS -G "https://graph.facebook.com/${META_API_VERSION:-v21.0}/me/adaccounts" \
  --data-urlencode "fields=name,account_id,id" \
  --data-urlencode "access_token=$META_ACCESS_TOKEN"
```

Run a weekly Markdown report:

```bash
META_AD_ACCOUNT_ID="$META_AD_ACCOUNT_ID" \
node ~/.codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs \
  --date-preset last_7d \
  --min-spend 100 \
  --format markdown
```

Optional token debug, only when `META_APP_ID` and `META_APP_SECRET` are configured:

```bash
curl -sS -G "https://graph.facebook.com/${META_API_VERSION:-v21.0}/debug_token" \
  --data-urlencode "input_token=$META_ACCESS_TOKEN" \
  --data-urlencode "access_token=${META_APP_ID}|${META_APP_SECRET}"
```

## Codex Bootstrap Prompt

Use this prompt in the new Codex chat after the files and env vars are present:

```text
Use $meta-ads-operator. Validate the local Meta Ads environment without printing secrets, then run a read-only last_7d report for META_AD_ACCOUNT_ID in Markdown format. Include account totals, campaign table, creative winners, lead/sales signals, waste watchlist, placement table, and concrete next actions. Do not perform any write actions.
```

## Safety Defaults

- Reporting is read-only.
- Never print full tokens, app secrets, or full signed media URLs.
- Create new campaigns, ad sets, ads, and creatives in `PAUSED` status unless the user explicitly approves activation.
- Require explicit approval before activation, budget increase, live targeting change, pausing active delivery, or deletion.
- After any write, read the changed objects back and report ids and statuses.

## Troubleshooting

`META_ACCESS_TOKEN is required`

- The token is not set in the shell or Codex environment.

`Provide valid app ID`

- The token may belong to a different app than the app credentials used for debug, or the app/use-case/permissions are misconfigured.

`Malformed input to a URL function`

- Use `curl -G --data-urlencode` instead of hand-built URLs. Tokens can contain newline or special characters.

`roas is not valid for fields`

- Use `purchase_roas` or `website_purchase_roas` in insights fields.

Empty campaign or insights response

- Check token scopes, ad account access, account id format, date range, and whether the objects had delivery in that period.
