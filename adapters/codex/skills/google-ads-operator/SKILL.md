---
name: google-ads-operator
description: Analyze, diagnose, and safely manage Google Ads accounts through the Google Ads API. Use when the user asks about Google Ads reporting, campaigns, ad groups, ads, keywords, spend, CTR, CPC, conversions, ROAS, budgets, pausing, duplication, or API/CLI integration.
---

# Google Ads Operator

## Operating Rule

Treat Google Ads as a live spending surface. Default to read-only analysis. For any write that can create, publish, spend, increase budget, change targeting, or alter delivery, produce an explicit action plan first and wait for clear user approval unless the user has already given an exact, current-turn instruction for that specific action.

Never print developer tokens, service account JSON, refresh tokens, client secrets, or signed media URLs. Prefer env vars and Keychain-backed local setup:

```bash
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_CUSTOMER_ID
GOOGLE_ADS_LOGIN_CUSTOMER_ID
GOOGLE_ADS_API_VERSION
GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64
GOOGLE_ADS_JSON_KEY_FILE_PATH
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_REFRESH_TOKEN
```

## Quick Workflow

1. Verify context without exposing secrets: developer token presence, customer id, login customer id, API version, and auth mode.
2. Pull read-only data first using `scripts/google_ads_report.mjs`.
3. Separate analysis by goal:
   - Traffic: CTR, CPC, CPM, clicks, search terms when requested.
   - Lead/sales: conversions, cost per conversion, conversion value or ROAS when configured.
   - App: app campaign metrics and install/in-app event metrics when available.
4. Apply minimum-volume filters before naming a campaign/ad/keyword a winner.
5. Return a concise recommendation: scale, iterate, pause, fix measurement, or investigate.
6. For write requests, create paused drafts by default and ask before activation.

## Reporting Script

Use `scripts/google_ads_report.mjs` for repeatable account reporting. It reads env vars, loads `.vibermode-automation.env` when present, falls back to Keychain, and outputs JSON or Markdown.

Examples:

```bash
node scripts/google_ads_report.mjs --check-keychain
GOOGLE_ADS_CUSTOMER_ID=1234567890 node scripts/google_ads_report.mjs --date-preset LAST_7_DAYS --format markdown
GOOGLE_ADS_CUSTOMER_ID=1234567890 node scripts/google_ads_report.mjs --since 2026-06-01 --until 2026-06-15
```

The default report calls `GoogleAdsService.SearchStream` at `/v24/customers/{CUSTOMER_ID}/googleAds:searchStream` with a campaign-level GAQL query.

## Workflow Templates

Read `references/workflows.md` when the user asks for recurring analysis, weekly/monthly reports, report tables, or an automation prompt.

Default reusable workflow:

1. Run the weekly report for `LAST_7_DAYS`.
2. Output a Markdown table summary.
3. Add a short diagnosis by objective.
4. End with concrete actions: scale, pause, iterate, or investigate.

## Portable Setup

Read `references/portable-setup.md` when the user asks how to install, migrate, or bootstrap this Google Ads operator on another computer or Codex environment.

## Write Workflow

Read `references/write-safety.md` before any write operation. Follow its approval and paused-by-default rules.

Safe default write posture:

- Create new campaigns, ad groups, ads, and assets paused unless activation is approved.
- Use small test budgets unless the user gives exact budget values.
- Do not activate anything live without a direct approval that names the object or approved plan.
- Before pausing existing delivery, list affected object names, ids, current spend context, and expected impact.
- After a write, read changed objects back and summarize ids/statuses.

## Useful API Shapes

Read endpoints:

```text
GET /v24/customers:listAccessibleCustomers
POST /v24/customers/{CUSTOMER_ID}/googleAds:searchStream
```

Common headers:

```text
Authorization: Bearer ACCESS_TOKEN
developer-token: GOOGLE_ADS_DEVELOPER_TOKEN
login-customer-id: GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

Common GAQL fields:

```text
campaign.id, campaign.name, campaign.status
ad_group.id, ad_group.name
ad_group_ad.ad.id, ad_group_ad.ad.name
metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr
metrics.average_cpc, metrics.conversions, metrics.cost_per_conversion
segments.date
```

## Interpretation Rules

- Customer IDs and login customer IDs must be supplied without hyphens.
- Do not compare Search, Performance Max, Display, YouTube, and App campaigns as if they optimize for the same outcome.
- If conversion value is not configured or sparse, call out measurement limits before making ROAS claims.
- If manager-account access is used, set `GOOGLE_ADS_LOGIN_CUSTOMER_ID` to the manager account id.
- Treat campaign/ad/keyword winners as directional unless spend, impressions, and conversion volume are meaningful.

## Output Shape

For analysis, prefer:

1. Scope and data quality.
2. Account/campaign/ad group/ad summary.
3. Winners by objective.
4. Waste or risk list.
5. Concrete next actions.

For write plans, prefer:

1. Objects to create/update.
2. Exact status (`PAUSED` unless approved otherwise).
3. Budget and targeting assumptions.
4. Rollback/verification plan.
