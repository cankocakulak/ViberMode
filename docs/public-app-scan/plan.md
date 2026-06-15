# Public App Scan Plan

## Analysis

Paid market exports are not available right now, but the app research workflow can still use public Apple sources for directional discovery. Existing scripts can ingest exports and run gap research, but there is no one-shot runner that starts a research pack from public search, review, and chart data.

## Strategy

Add a public-only research runner that writes the same research pack files as the source ingestion layer: source inventory, market signals, normalized app rows, summary docs, and opportunities. The runner must not emit ready backlog candidates by itself.

## Changes Required

- `scripts/research-public-app-scan.mjs`: create the public scan runner.
- `package.json`: expose `npm run research:public-scan`.
- `packs/vibermode/roles/product/app-researcher.md`: instruct the agent to use public scan when no paid export exists.
- `packs/vibermode/workflows/app-opportunity-research.md`: add the public source scan stage.
- `packs/vibermode/workflows/idea-research-backlog.md`: clarify that public scan alone cannot mark candidates ready.
- Operations and use-case docs: list the new script and output files.

## Verification

- `node --check scripts/research-public-app-scan.mjs`
- Run a temp public scan with public Apple endpoints.
- Run `research-app-store-gap.mjs` on the generated public scan opportunity.
- `npm run validate`
- Validate the private idea backlog.
