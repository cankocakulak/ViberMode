# TikTok Ads Workflow Templates

## Weekly Read-Only Report

Use when the user asks for a recurring or one-off TikTok Ads report.

Command:

```bash
node ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs \
  --date-preset last_7d \
  --min-spend 100 \
  --format markdown
```

Output should include:

- scope and data quality
- account/ad rows by spend
- CTR/CPC/CPM diagnosis
- conversion and CPA caveats
- waste/risk watchlist
- concrete next actions

Prompt:

```text
Use the tiktok-ads-operator workflow to analyze the TikTok Ads advertiser in this workspace for the last 7 days. Pull read-only reporting through TikTok API for Business using environment variables, then produce a concise Markdown report with totals, top campaign/ad rows, conversion signals, waste/risk watchlist, and recommended next actions. Do not make any write changes. Do not print tokens or secrets.
```

## Custom Metric Report

Use when the default metric set is not enough.

```bash
node ~/.codex/skills/tiktok-ads-operator/scripts/tiktok_ads_report.mjs \
  --since 2026-06-01 \
  --until 2026-06-15 \
  --data-level AUCTION_CAMPAIGN \
  --dimensions campaign_id,stat_time_day \
  --metrics spend,impressions,clicks,ctr,cpc,cpm,conversion,cost_per_conversion \
  --format markdown
```

## Draft Write Plan

Use when the user asks to create or change TikTok Ads objects.

Steps:

1. Run a read-only report first.
2. Identify exact campaigns/ad groups/ads and current spend context.
3. Propose paused/non-delivering draft objects or exact edits.
4. Ask for explicit approval before any live write.
5. After approved writes, read changed objects back and report ids/statuses.
