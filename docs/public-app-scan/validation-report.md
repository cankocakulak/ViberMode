# Validation Report

## Commands

```bash
node --check scripts/research-public-app-scan.mjs
node --check scripts/ingest-market-source.mjs
node --check scripts/research-app-store-gap.mjs
node --check scripts/idea-backlog.mjs
npm run research:public-scan -- --output-dir /tmp/vibermode-public-scan.yqvezM/research-runs/2026-06-14/education-us --theme education --queries "ielts speaking,pronunciation coach" --market US --limit 3 --review-apps 0 --include-top-chart --chart-limit 3
node scripts/research-app-store-gap.mjs --research-dir /tmp/vibermode-public-scan.yqvezM/research-runs/2026-06-14/education-us --cluster "Language learning / vocabulary" --market US --queries "ielts speaking,pronunciation coach" --limit 3 --review-apps 0
npm run research:public-scan -- --output-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/2026-06-14/education-us-public-scan --theme education --market US --limit 10 --review-apps 5 --review-limit 20 --include-top-chart --chart-limit 25
node scripts/research-app-store-gap.mjs --research-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/2026-06-14/education-us-public-scan --cluster "Language learning / vocabulary" --market US --queries "ielts speaking,pronunciation coach,vocabulary builder,english speaking" --limit 10 --review-apps 5 --review-limit 20
npm run validate
node scripts/idea-backlog.mjs validate --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state
```

## Results

- Syntax checks passed for the changed scripts.
- Public scan completed with 6 queries, 7 public sources, 20 apps, and 20 market signals.
- Public scan wrote `public-scan-summary.md`, `market-signals.jsonl`, normalized app rows, and opportunities.
- Gap research consumed public scan signals and reported `market_signal_count: 14`.
- Real private-state public scan completed at `$VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/2026-06-14/education-us-public-scan` with 6 queries, 12 public sources, 79 apps, 135 market signals, and 100 public review entries.
- Real private-state gap research for `Language learning / vocabulary` consumed 30 imported public signals and produced a `researching` candidate draft.
- Reference map validation passed for 47 capabilities.
- Private backlog validation passed with 12 ideas and 6 ready ideas.

## Residual Risk

Apple public endpoints are enough for discovery, but they do not provide paid-grade revenue/download estimates. Ready backlog candidates still need gap review and stronger evidence before factory promotion.
