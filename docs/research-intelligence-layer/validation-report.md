# Validation Report

## Commands

```bash
node --check scripts/ingest-market-source.mjs
node --check scripts/research-app-store-gap.mjs
node --check scripts/idea-backlog.mjs
npm run research:ingest -- --input /tmp/vibermode-research-ingest.jfK85D/keyword.csv --output-dir /tmp/vibermode-research-ingest.jfK85D/research-runs/2026-06-14/education-us --provider apptweak --report-type keyword-ranking --category Education --market US
node scripts/ingest-market-source.mjs --input /tmp/vibermode-research-ingest.jfK85D/notes.json --output-dir /tmp/vibermode-research-ingest.jfK85D/research-runs/2026-06-14/education-us --provider manual --report-type market-note --category Education --market US
node scripts/research-app-store-gap.mjs --research-dir /tmp/vibermode-research-ingest.jfK85D/research-runs/2026-06-14/education-us --cluster "Language learning / vocabulary" --market US --queries "ielts speaking,pronunciation coach" --limit 3 --review-apps 0
npm run validate
node scripts/idea-backlog.mjs validate --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state
```

## Results

- Syntax checks passed for the changed scripts.
- Keyword CSV ingest completed with 3 `keyword_rank` signals.
- Manual JSON ingest completed with 1 `market_note` signal.
- Gap research completed and reported `market_signal_count: 4`.
- Reference map validation passed for 47 capabilities.
- Private backlog validation passed with 12 ideas and 6 ready ideas.

## Residual Risk

The importer supports flexible column aliases, but real AppTweak/Sensor Tower exports may still need alias additions after seeing actual headers.
