# Meta Ads Workflow Templates

## Weekly Performance Table

Use when the user asks for a recurring or one-off weekly Meta Ads report.

Goal:

- Analyze the last 7 days.
- Compare campaign and creative performance against the chosen metrics.
- Produce a Markdown table plus short recommendations.
- Do not perform writes.

Default metrics:

- spend
- impressions
- clicks
- CTR
- CPC
- CPM
- landing page views
- leads
- purchases
- purchase ROAS
- cost per lead
- cost per purchase

Default command:

```bash
META_AD_ACCOUNT_ID=act_123 node ~/.codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs --date-preset last_7d --min-spend 100 --format markdown
```

If the user specifies custom metrics, keep the report focused on those metrics and mention omitted metrics only when they affect interpretation.

Recommended sections:

1. Scope and data quality.
2. Account totals.
3. Campaign table.
4. Creative winners.
5. Lead/sales signals.
6. Waste/risk watchlist.
7. Recommended next actions.

## Automation Prompt Template

Use this as the prompt body for a Codex cron automation after the user provides schedule and destination expectations:

```text
Use the meta-ads-operator workflow to analyze the Meta Ads account in this workspace for the last 7 days. Pull campaign, ad, creative, and placement insights through the Marketing API using environment variables, then produce a concise Markdown report with: account totals, campaign performance table, creative winners, lead/sales signals, waste/risk watchlist, and recommended next actions. Do not make any write changes to Meta Ads. Do not print tokens or secrets.
```

Cron setup notes:

- Use a weekly schedule in the user's timezone.
- Use a local execution environment only if the workspace/env already contains the required secrets.
- Prefer read-only reporting automations first.
- Create a separate write-action workflow only after the user approves exact actions.

## Creative Testing Workflow

Use after a weekly report identifies winners and losers.

1. Select winners by objective, not only by CTR.
2. Create 3-5 creative hypotheses from winner patterns.
3. Propose paused draft ads/ad sets.
4. Include budget, audience, placement, and success metric.
5. Wait for approval before any API write.

## Budget Reallocation Workflow

Use when the user asks what budget should move.

1. Identify campaigns with meaningful spend and poor target metric.
2. Identify campaigns with meaningful spend and strong target metric.
3. Avoid moving budget based only on low-volume results.
4. Present a before/after budget table.
5. Require explicit approval before changing live budgets.
