# Google Ads Workflow Templates

## Weekly Read-Only Report

Use when the user asks for a recurring or one-off Google Ads report.

Command:

```bash
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --date-preset LAST_7_DAYS \
  --format markdown
```

Output should include:

- scope and data quality
- campaign table by cost
- CTR/CPC diagnosis
- conversion and CPA caveats
- waste/risk watchlist
- concrete next actions

Prompt:

```text
Use the google-ads-operator workflow to analyze the Google Ads customer in this workspace for LAST_7_DAYS. Pull read-only reporting through GoogleAdsService SearchStream using environment variables, then produce a concise Markdown report with totals, campaign table, conversion signals, waste/risk watchlist, and recommended next actions. Do not make any write changes. Do not print tokens or secrets.
```

## Custom GAQL Report

Use when the default campaign query is not enough.

```bash
node ~/.codex/skills/google-ads-operator/scripts/google_ads_report.mjs \
  --query "SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks FROM campaign WHERE segments.date DURING LAST_30_DAYS ORDER BY metrics.cost_micros DESC LIMIT 50" \
  --format markdown
```

## Draft Write Plan

Use when the user asks to create or change Google Ads objects.

Steps:

1. Run a read-only report first.
2. Identify exact campaigns/ad groups/ads/keywords and current spend context.
3. Propose paused draft objects or exact edits.
4. Ask for explicit approval before any live write.
5. After approved writes, read changed objects back and report ids/statuses.
