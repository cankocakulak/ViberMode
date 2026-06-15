# Research Intelligence Layer Plan

## Analysis

The app idea workflow already separates opportunity research from repo creation, and the backlog gate now expects stronger market, AI/backend, and differentiation theses. The weak spot is source handling: AppTweak, Sensor Tower, keyword ranking, and manual market notes do not yet have a first-class normalized ingest path, so they cannot reliably inform gap research.

## Strategy

Add a generic source ingestion layer that converts external CSV/TSV/JSON/JSONL evidence into `market-signals.jsonl`, records it in `source-inventory.json`, and makes `research-app-store-gap.mjs` consume those imported signals during gap research.

## Changes Required

- `scripts/ingest-market-source.mjs`: add a source-agnostic importer for keyword, app metric, and market note exports.
- `scripts/research-app-store-gap.mjs`: read relevant `market-signals.jsonl` rows and include them in gap reports and candidate evidence.
- `package.json`: expose the importer as `npm run research:ingest`.
- `packs/vibermode/roles/product/app-researcher.md`: document the agent-level usage path.
- `packs/vibermode/workflows/app-opportunity-research.md`: add the source ingestion stage and outputs.
- `packs/vibermode/workflows/idea-research-backlog.md`: include the new research pack files in the state contract.
- `docs/research-source-contract.md`: define the normalized source contract and accepted aliases.
- Operations/use-case docs: list the new script and private state outputs.

## Verification

- `node --check scripts/ingest-market-source.mjs`
- `node --check scripts/research-app-store-gap.mjs`
- `node --check scripts/idea-backlog.mjs`
- Smoke ingest keyword CSV and manual JSON into a temp research run.
- Run `research-app-store-gap.mjs` against the temp run and confirm imported signal count appears.
- `npm run validate`
- `node scripts/idea-backlog.mjs validate --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state`
