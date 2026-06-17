---
name: tiktok-ads-operator
description: Analyze, diagnose, and safely manage TikTok Ads accounts through TikTok API for Business. Use when the user asks about TikTok ads reporting, campaigns, ad groups, ads, creatives, spend, CTR, CPC, CPM, conversions, ROAS, budgets, pausing, duplication, or API/CLI integration.
---

# TikTok Ads Operator

## Operating Rule

Treat TikTok Ads as a live spending surface. Default to read-only analysis. For any write that can create, publish, spend, increase budget, change targeting, or alter delivery, produce an explicit action plan first and wait for clear user approval unless the user has already given an exact, current-turn instruction for that specific action.

Never print access tokens, app secrets, refresh secrets, or signed media URLs. Prefer env vars and Keychain-backed local setup:

```bash
TIKTOK_ACCESS_TOKEN
TIKTOK_ADVERTISER_ID
TIKTOK_API_VERSION
TIKTOK_APP_ID
TIKTOK_APP_SECRET
```

## Quick Workflow

1. Verify context without exposing secrets: token presence, advertiser id, API version, and Keychain state when needed.
2. Pull read-only data first using `scripts/tiktok_ads_report.mjs`.
3. Separate analysis by goal:
   - Traffic: CTR, CPC, CPM, clicks.
   - Lead/sales: conversions, CPA, ROAS or purchase-specific metrics when configured.
   - App: install or app-event metrics when the advertiser has those events available.
4. Apply minimum-volume filters before naming a creative or campaign a winner.
5. Return a concise recommendation: scale, iterate, pause, fix measurement, or investigate.
6. For write requests, create paused drafts by default and ask before activation.

## Reporting Script

Use `scripts/tiktok_ads_report.mjs` for repeatable account reporting. It reads env vars, loads `.vibermode-automation.env` when present, falls back to Keychain, and outputs JSON or Markdown.

Examples:

```bash
node scripts/tiktok_ads_report.mjs --check-keychain
TIKTOK_ADVERTISER_ID=123 node scripts/tiktok_ads_report.mjs --date-preset last_7d --format markdown
TIKTOK_ADVERTISER_ID=123 node scripts/tiktok_ads_report.mjs --since 2026-06-01 --until 2026-06-15 --min-spend 100
```

The default report calls TikTok API for Business reporting at `/open_api/v1.3/report/integrated/get/` with `report_type=BASIC`, `data_level=AUCTION_AD`, and configurable dimensions/metrics.

## Workflow Templates

Read `references/workflows.md` when the user asks for recurring analysis, weekly/monthly reports, report tables, or an automation prompt.

Default reusable workflow:

1. Run the weekly report for `last_7d`.
2. Output a Markdown table summary.
3. Add a short diagnosis by objective.
4. End with concrete actions: scale, pause, iterate, or investigate.

## Portable Setup

Read `references/portable-setup.md` when the user asks how to install, migrate, or bootstrap this TikTok Ads operator on another computer or Codex environment.

## Write Workflow

Read `references/write-safety.md` before any write operation. Follow its approval and paused-by-default rules.

Safe default write posture:

- Create new campaigns, ad groups, ads, and creatives in paused/non-delivering status where the API supports it.
- Use small test budgets unless the user gives exact budget values.
- Do not activate anything live without a direct approval that names the object or approved plan.
- Before pausing existing delivery, list affected object names, ids, current spend context, and expected impact.
- After a write, read changed objects back and summarize ids/statuses.

## Useful API Shapes

Read endpoints:

```text
GET /open_api/v1.3/advertiser/info/
GET /open_api/v1.3/report/integrated/get/
GET /open_api/v1.3/campaign/get/
GET /open_api/v1.3/adgroup/get/
GET /open_api/v1.3/ad/get/
```

Common report inputs:

```text
report_type=BASIC
data_level=AUCTION_CAMPAIGN|AUCTION_ADGROUP|AUCTION_AD
dimensions=["campaign_id","adgroup_id","ad_id","stat_time_day"]
metrics=["spend","impressions","clicks","ctr","cpc","cpm","conversion","cost_per_conversion"]
```

## Interpretation Rules

- Do not compare traffic-optimized campaigns and conversion-optimized campaigns as if they optimize for the same outcome.
- TikTok attribution and event names depend on the advertiser's pixel/app event setup.
- If conversions are sparse, call out measurement limits before making ROI claims.
- If ROAS or purchase metrics are not returned, ask for the advertiser's available purchase metric names or rerun with explicit `--metrics`.
- Treat creative/campaign winners as directional unless spend, impressions, and conversion volume are meaningful.

## Output Shape

For analysis, prefer:

1. Scope and data quality.
2. Account/campaign/ad summary.
3. Creative or campaign winners by objective.
4. Waste or risk list.
5. Concrete next actions.

For write plans, prefer:

1. Objects to create/update.
2. Exact status (`PAUSED` or equivalent unless approved otherwise).
3. Budget and targeting assumptions.
4. Rollback/verification plan.
