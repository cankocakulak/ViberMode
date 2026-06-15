# Workflow: App Opportunity Research

> Standalone research workflow for finding mobile app opportunities before backlog or factory automation.

## Pipeline

```text
category brief -> source inventory -> data normalization -> cluster metrics -> gap research -> strategic thesis -> AI/backend leverage review -> opportunity scoring -> research pack -> optional backlog candidates
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

Default operator posture when not overridden:

- B2C iOS first
- Education and learning apps preferred
- AI is welcome when it improves practice, feedback, personalization, content generation, assessment, or retention
- Backend is acceptable when it protects secrets, controls AI spend/abuse, supports shared state, or unlocks a materially stronger product
- Thin backend proxy is acceptable even without a database

## State Layout

Public ViberMode contains workflow definitions and reusable scripts only. Private research output belongs under:

```text
research-runs/YYYY-MM-DD/[category-or-theme]/
├── source-inventory.json
├── normalized-apps.jsonl
├── market-signals.jsonl
├── market-source-summary-[source-id].json
├── market-source-summary-[source-id].md
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

## Stage 3 - Public Source Scan

Use `scripts/research-public-app-scan.mjs` when no paid AppTweak, Sensor Tower, data.ai, or App Store metric export is available. It uses public Apple endpoints only: iTunes Search API, public customer review RSS, and optional public Apple top chart RSS.

Command shape:

```bash
npm run research:public-scan -- \
  --output-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/YYYY-MM-DD/education-us \
  --theme education \
  --market US \
  --include-top-chart
```

Optional query override:

```bash
npm run research:public-scan -- \
  --output-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/YYYY-MM-DD/education-us \
  --queries "ielts speaking,pronunciation coach,vocabulary builder" \
  --market US
```

Expected outputs:

- updated `source-inventory.json`
- updated `market-signals.jsonl`
- updated `normalized-apps.jsonl`
- `public-scan-clusters.json`
- `public-scan-summary.json`
- `public-scan-summary.md`
- `opportunities.json` when it does not already exist, or public scan enrichment on matching opportunities

Public scan is a discovery pass. It must not promote candidates to `ready` by itself because it does not provide paid revenue/download estimates.

## Stage 4 - Structured Data Ingest

Use `scripts/ingest-market-source.mjs` for AppTweak, Sensor Tower, data.ai, App Store chart exports, keyword ranking CSVs, or manual JSON notes that are not already in the static App Store metric format.

Command shape:

```bash
npm run research:ingest -- \
  --input "/path/to/apptweak-keyword-export.csv" \
  --output-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/YYYY-MM-DD/education-us \
  --provider apptweak \
  --report-type keyword-ranking \
  --category Education \
  --market US
```

Expected outputs:

- updated `source-inventory.json`
- `market-signals.jsonl`
- `market-source-summary-[source-id].json`
- `market-source-summary-[source-id].md`

Supported first-class source shapes:

- `app-store-metrics-csv` - download, revenue, DAU, rating, and growth rows
- `keyword-ranking-csv` - keyword, rank, volume, difficulty, and app rows
- `market-note-json` - manual notes, public reports, trend observations, and source links

Use `scripts/analyze-app-store-csv.mjs` when an App Store metric CSV is available.

Command shape:

```bash
node scripts/analyze-app-store-csv.mjs \
  --input "/path/to/App Store Top Apps Revenue PoP Growth.csv" \
  --output-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/YYYY-MM-DD/education-us \
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

## Stage 5 - Gap Research

Purpose:
Turn metric clusters into app opportunity hypotheses.

For each top cluster, inspect:

- competitor positioning
- user complaints or public review themes
- underserved audience or use case
- monetization pattern
- MVP feasibility
- risk/regulatory complexity
- keyword/search/distribution angle
- whether the narrow wedge is stronger with AI, backend, both, or neither

The result should include both promising and rejected directions.

Use `scripts/research-app-store-gap.mjs` after structured cluster scoring when an App Store/iTunes positioning pass is enough to qualify or reject a narrow candidate.
If `market-signals.jsonl` exists in the research directory, the gap script reads matching imported signals and includes them in the gap report plus candidate evidence sources.

Command shape:

```bash
node scripts/research-app-store-gap.mjs \
  --research-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/YYYY-MM-DD/education-us \
  --cluster "Plant / nature ID" \
  --market US
```

Optional query override:

```bash
node scripts/research-app-store-gap.mjs \
  --research-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/YYYY-MM-DD/education-us \
  --cluster "Plant / nature ID" \
  --queries "plant identifier,plant care,pet safe plants,plant toxicity"
```

Expected outputs:

- `gap-research-[cluster].json`
- `gap-research-[cluster].md`
- updated `source-inventory.json`
- updated `backlog-candidates.json`

## Stage 6 - Strategic Thesis and AI/Backend Review

Purpose:
Prevent "safe but shallow" app ideas from entering the backlog. Every ready candidate must explain why it can win as a B2C product and whether AI/backend materially improves the product.

Required candidate fields:

```json
{
  "market_thesis": {
    "user_pain_intensity": "...",
    "distribution_angle": "...",
    "willingness_to_pay": "...",
    "incumbent_weakness": "...",
    "why_now": "..."
  },
  "ai_backend_strategy": {
    "mode": "none | deferred | ai-assisted | backend-backed | ai-plus-backend",
    "recommended_for_mvp": true,
    "direct_app_allowed": false,
    "backend_shape": "none | thin-proxy | stateful-service",
    "reason": "...",
    "backend_trigger": "...",
    "ai_service_trigger": "...",
    "fallback_without_ai": "...",
    "cost_or_risk": "..."
  },
	  "differentiation_thesis": {
	    "why_not_generic": "...",
	    "ten_x_narrower_or_better": "...",
	    "hard_to_copy_detail": "..."
	  },
	  "launch_appeal": {
	    "hook": "...",
	    "first_value_moment": "...",
	    "signature_interaction": "...",
	    "visual_direction": "...",
	    "storefront_angle": "...",
	    "testflight_demo_path": "...",
	    "anti_generic_rule": "..."
	  }
	}
	```

Education-specific rule:
AI is not enough by itself. A ready Education candidate must name the learning loop: learner input or practice, feedback, repetition, progress tracking, and content strategy. Prefer AI for critique, adaptive drilling, explanation, pronunciation or writing feedback, scenario generation, and review planning. Reject generic "AI tutor" ideas unless the wedge is narrower than the category.

Backend/direct-from-app rule:
Direct-from-app is acceptable for local-only, on-device, or platform-owned AI capabilities that do not expose provider secrets. Provider-hosted AI APIs should use a backend or `ai-services` proxy for production, even when no database is needed.

## Stage 7 - Candidate Gate

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
- market thesis
- AI/backend strategy
- differentiation thesis
- launch appeal with a hook, first-value moment, signature interaction, visual direction, storefront angle, TestFlight demo path, and anti-generic rule
- for Education: concrete learning loop and AI role when AI is recommended

Generic category ideas must be rejected or left as `researching`.

## Stage 8 - Backlog Handoff

This workflow does not directly create repos. If a candidate is approved for factory use:

```bash
node scripts/idea-backlog.mjs upsert \
  --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state \
  --idea-file /path/to/candidate.json
```

Then:

```bash
node scripts/idea-backlog.mjs validate \
  --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state
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
