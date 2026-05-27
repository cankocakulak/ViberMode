# Workflow: App Opportunity Research

> Standalone research workflow for finding mobile app opportunities before backlog or factory automation.

## Pipeline

```text
category brief -> source inventory -> data normalization -> cluster metrics -> gap research -> opportunity scoring -> research pack -> optional backlog candidates
```

This workflow is intentionally independent. It may be used to produce a readable market/opportunity report without creating repos or updating the app factory queue.

## Primary Role

```text
packs/vibermode/roles/product/app-researcher.md
```

## Entry Contract

The orchestrator must resolve:

- `category` - App Store category or vertical, such as `Education`
- `market` - storefront/geography, such as `US`
- `platform` - usually `iOS` / `App Store`
- `state_root` - private state root for outputs
- optional `source_files` - CSV/JSON exports to ingest
- optional `theme` - narrower research theme
- optional `constraints` - factory constraints such as SwiftUI/local-first/no backend

## State Layout

Public ViberMode contains workflow definitions and reusable scripts only. Private research output belongs under:

```text
research-runs/YYYY-MM-DD/[category-or-theme]/
├── source-inventory.json
├── normalized-apps.jsonl
├── clusters.json
├── opportunities.json
├── gap-research-[cluster].json
├── gap-research-[cluster].md
├── rejected.json
├── decision.md
└── backlog-candidates.json
```

Structured source files should be copied or referenced under:

```text
sources/[provider]/[report-type]/
```

Example:

```text
sources/app-store/revenue-pop-growth/2026-05-11_2026-05-20_US_Education.csv
```

## Stage 1 - Category Brief

Purpose:
Define what the run is trying to learn.

Output should answer:

- Which category/theme is being studied?
- Which market/platform?
- Which static files are available?
- Which live/current sources should be checked?
- Which prior factory outcomes should be considered?
- Which app types are out of scope?

## Stage 2 - Source Inventory

Purpose:
Record all evidence sources before interpretation.

Sources may include:

- static App Store CSV exports
- App Store/iTunes Search API results
- App Store pages and public review summaries
- Product Hunt or launch directories
- Reddit/community problem threads
- search/keyword trend pages
- prior factory run manifests

Rules:

- Use static files as directional signals, not as the sole decision maker.
- For any source that may change, record capture date and URL.
- Separate sourced observations from inference.

## Stage 3 - Structured Data Ingest

Use `scripts/analyze-app-store-csv.mjs` when an App Store metric CSV is available.

Command shape:

```bash
node scripts/analyze-app-store-csv.mjs \
  --input "/path/to/App Store Top Apps Revenue PoP Growth.csv" \
  --output-dir /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/research-runs/YYYY-MM-DD/education-us \
  --source-id app-store-education-revenue-growth-YYYY-MM-DD \
  --market US \
  --category Education
```

Expected outputs:

- `source-inventory.json`
- `normalized-apps.jsonl`
- `clusters.json`
- `opportunities.json`
- `decision.md`

## Stage 4 - Gap Research

Purpose:
Turn metric clusters into app opportunity hypotheses.

For each top cluster, inspect:

- competitor positioning
- user complaints or public review themes
- underserved audience or use case
- monetization pattern
- MVP feasibility
- risk/regulatory complexity

The result should include both promising and rejected directions.

Use `scripts/research-app-store-gap.mjs` after structured cluster scoring when an App Store/iTunes positioning pass is enough to qualify or reject a narrow candidate.

Command shape:

```bash
node scripts/research-app-store-gap.mjs \
  --research-dir /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/research-runs/YYYY-MM-DD/education-us \
  --cluster "Plant / nature ID" \
  --market US
```

Optional query override:

```bash
node scripts/research-app-store-gap.mjs \
  --research-dir /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/research-runs/YYYY-MM-DD/education-us \
  --cluster "Plant / nature ID" \
  --queries "plant identifier,plant care,pet safe plants,plant toxicity"
```

Expected outputs:

- `gap-research-[cluster].json`
- `gap-research-[cluster].md`
- updated `source-inventory.json`
- updated `backlog-candidates.json`

## Stage 5 - Candidate Gate

A candidate may enter `backlog-candidates.json` as `ready` only if it has:

- category
- cluster
- evidence sources
- competitors/comparables
- metric snapshot
- specific gap
- MVP wedge
- why-now explanation
- product-to-code-ready prompt

Generic category ideas must be rejected or left as `researching`.

## Stage 6 - Backlog Handoff

This workflow does not directly create repos. If a candidate is approved for factory use:

```bash
node scripts/idea-backlog.mjs upsert \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state \
  --idea-file /path/to/candidate.json
```

Then:

```bash
node scripts/idea-backlog.mjs validate \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state
```

## Success Criteria

- Research pack exists and is readable standalone.
- Static and live sources are clearly separated.
- Cluster scores are explained with source metrics.
- Recommended candidates are narrower than their category.
- Rejected generic directions are explicitly listed.
- Backlog candidates validate before factory consumption.

## Failure Routing

- Insufficient source data: write `decision.md` with `status: insufficient_evidence`; do not emit ready candidates.
- Weak differentiation: move candidates to `rejected.json` or `researching`.
- Data parser failure: preserve source inventory and report the exact file/encoding/delimiter issue.
