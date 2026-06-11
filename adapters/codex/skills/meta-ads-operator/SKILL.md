---
name: meta-ads-operator
description: Analyze, diagnose, and safely manage Meta Ads accounts through the Meta Graph Marketing API. Use when the user asks about Meta/Facebook/Instagram ads reporting, campaigns, ad sets, ads, creatives, ROAS, leads, purchases, budgets, pausing, duplication, creative testing, or creating/updating campaigns through API/CLI workflows.
---

# Meta Ads Operator

## Operating Rule

Treat Meta Ads as a live spending surface. Default to read-only analysis. For any write that can create, publish, spend, increase budget, change targeting, or alter delivery, produce an explicit action plan first and wait for a clear user approval unless the user has already given an exact, current-turn instruction for that specific action.

Never print access tokens, app secrets, full signed media URLs containing credentials, or copied command lines that expose secrets. Prefer env vars:

```bash
META_ACCESS_TOKEN
META_AD_ACCOUNT_ID
META_API_VERSION
META_APP_ID
META_APP_SECRET
```

## Quick Workflow

1. Verify context without exposing secrets: token length, account id, API version, scopes when needed.
2. Pull read-only data first: account, campaigns, ad sets, ads, creatives, and insights for the requested timeframe.
3. Separate analysis by objective:
   - Traffic: CTR, CPC, CPM, link clicks, landing page views.
   - Lead gen: leads, cost per lead, lead quality caveats.
   - Sales: purchases, conversion value, purchase ROAS, cost per purchase.
   - App: installs or app events if available.
4. Apply minimum-volume filters before ranking creatives. Avoid calling a creative "winner" from tiny spend or tiny impression counts.
5. Return a concise recommendation: scale, iterate, pause, fix measurement, or investigate.
6. For write requests, create paused drafts by default and ask before activation.

## Reporting Script

Use `scripts/meta_ads_report.mjs` for repeatable account reporting. It reads env vars and outputs JSON.

Examples:

```bash
META_AD_ACCOUNT_ID=act_123 node scripts/meta_ads_report.mjs --date-preset last_30d
META_AD_ACCOUNT_ID=act_123 node scripts/meta_ads_report.mjs --since 2026-05-01 --until 2026-05-31 --min-spend 100
META_AD_ACCOUNT_ID=act_123 node scripts/meta_ads_report.mjs --date-preset last_7d --format markdown
```

The script gathers account info, campaign rollups, ad-level creative rankings, placement breakdowns, and active campaigns with no insight rows.

## Workflow Templates

Read `references/workflows.md` when the user asks for recurring analysis, weekly/monthly reports, report tables, or an automation prompt.

Default reusable workflow:

1. Run the weekly report for `last_7d`.
2. Output a Markdown table summary.
3. Add a short diagnosis by objective.
4. End with concrete actions: scale, pause, iterate, or investigate.

## Portable Setup

Read `references/portable-setup.md` when the user asks how to install, migrate, or bootstrap this Meta Ads operator on another computer or Codex environment.

## Write Workflow

Read `references/write-safety.md` before any write operation. Follow its approval and paused-by-default rules.

Safe default write posture:

- Create new campaigns, ad sets, ads, and creatives in `PAUSED` status.
- Use small test budgets unless the user gives exact budget values.
- Do not activate anything live without a direct approval that names the object or approved plan.
- Before pausing existing delivery, list affected object names, ids, current spend context, and expected impact.
- After a write, read the changed objects back and summarize the resulting ids/statuses.

## Useful API Shapes

Use Graph calls with URL encoding (`curl -G --data-urlencode`) or script helpers. Avoid hand-built URLs with raw access tokens because newline or special characters commonly break calls.

Read endpoints:

```text
GET /act_{ad_account_id}
GET /act_{ad_account_id}/campaigns
GET /act_{ad_account_id}/adsets
GET /act_{ad_account_id}/ads
GET /act_{ad_account_id}/insights
GET /{ad_id}?fields=creative{...}
```

Common insight dimensions:

```text
level=campaign|adset|ad
date_preset=today|yesterday|last_7d|last_14d|last_30d|maximum
time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}
breakdowns=publisher_platform,platform_position
```

Common fields:

```text
impressions,reach,frequency,spend,clicks,inline_link_clicks,ctr,cpc,cpm,
actions,action_values,cost_per_action_type,purchase_roas,website_purchase_roas
```

## Interpretation Rules

- Do not compare traffic campaigns and conversion campaigns as if they optimize for the same outcome.
- High CTR with weak landing page views may mean low-intent traffic, bad landing load, placement mismatch, or tracking mismatch.
- Low CTR with good ROAS can still be a strong conversion creative.
- If conversion events appear on only a few ads, call out measurement limitations before making ROI claims.
- When lead counts exist but lead details are requested, check whether `leads_retrieval` and form access are available before promising raw lead data.
- Treat placements as directional unless broken down per campaign objective.

## Output Shape

For analysis, prefer:

1. Scope and data quality.
2. Account/campaign summary.
3. Creative winners by objective.
4. Waste or risk list.
5. Concrete next actions.

For write plans, prefer:

1. Objects to create/update.
2. Exact status (`PAUSED` unless approved otherwise).
3. Budget and targeting assumptions.
4. Rollback/verification plan.
