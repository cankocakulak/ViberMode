# Workflow: App Opportunity Research

> Standalone research workflow for finding mobile app opportunities before backlog or factory automation.

## Pipeline

```text
category brief -> existing-idea re-evaluation -> source inventory -> daily intelligence loop -> data normalization -> cluster metrics -> gap research -> selection rationale -> strategic thesis -> AI/backend leverage review -> opportunity scoring -> stable idea ledger -> co-founder discussion -> explicit brainstorm/PRD/backlog promotion
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
- optional `cadence` - `manual`, `daily`, or `deep-dive`
- optional `report_target` - Slack channel or co-founder audience label for an approved summary, not a secret
- optional `idea_id` - stable idea to deepen or re-evaluate
- optional `slack_thread` - existing root message binding for the idea

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
├── daily-brief.md
├── cofounder-slack-report.md
└── backlog-candidates.json
```

Structured source files should be copied or referenced under:

```text
sources/[provider]/[report-type]/
```

Stable cross-run idea state belongs under:

```text
ideas/research/[idea-id]/
├── candidate.json
├── evidence.jsonl
├── decisions.jsonl
├── evaluation.json
└── evaluations/
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
- web search result summaries and public problem statements
- audience-size proxies such as subreddit membership, keyword volume, forum activity, creator niche size, job/title counts, or public market reports
- prior factory run manifests

Rules:

- Use static files as directional signals, not as the sole decision maker.
- For any source that may change, record capture date and URL.
- Separate sourced observations from inference.
- Do not promote an idea from App Store evidence alone. App Store can identify competitor and monetization signal, but user-pain and audience evidence should come from at least one non-store source whenever possible.

## Stage 3 - Daily Intelligence Loop

Purpose:
Let recurring research runs maintain existing evidence without getting trapped on one idea, while still exploring a genuinely new theme every day.

Daily runs should:

- run `npm run research:ledger -- daily-plan --state-root "$APP_FACTORY_STATE_ROOT" --cooldown-days 7` and use its `due`, `cooldown`, and `blocked` groups as the deterministic maintenance baseline
- run a bounded maintenance check across open `researching`, `validated`, `parked`, and `ready` ideas, but select an existing idea only when it is due
- treat an idea as due only for an explicit Slack follow-up, an incomplete pack, evidence at least seven days old, a material market event, or an open check that today's sources can actually answer
- put a recently evaluated idea on a seven-day cooldown when its recommendation and missing checks are unchanged
- never repeat a public scan when the exact next check requires owner choice, direct interviews, timed usability testing, paid data, or another unavailable input
- after maintenance, choose an answerable market observation, opportunity hypothesis, disconfirmation or new theme; do not force a new niche every day
- keep maintenance and fresh discovery in separate research packs when both produce material output
- check at least two evidence classes when available: App Store, community/user pain, web/search trends, keyword demand, competitor positioning, paid/source exports, or prior factory results
- label every ledger observation with `direction: supports | contradicts | neutral`; do not let a contradictory competitor-gap record satisfy a positive readiness check
- write new observations to `source-inventory.json` and `market-signals.jsonl`
- update existing `researching` candidates or rejected directions when evidence changes
- write `daily-brief.md` and `cofounder-slack-report.md` with the outcome, rationale, risks, and next checks

Allowed daily outcomes:

- `fresh_discovery_checked` - a new theme was investigated and either opened or explicitly rejected
- `new_candidate_observed` - a new stable idea was created with a specific problem, audience, wedge, comparables, and unknowns
- `no_strong_candidate` - fresh themes were checked but none met the minimum hypothesis quality bar
- `evidence_added` - new signals were collected but no candidate status changed
- `watchlist_updated` - a cluster or hypothesis became more or less promising
- `candidate_researching` - a candidate remains open with explicit follow-up questions
- `candidate_ready` - a candidate passed the readiness gate
- `rejected` - a generic or weak direction was closed
- `insufficient_evidence` - the run found too little to change state

Use the daily brief command after a research pack exists:

```bash
npm run research:daily-brief -- \
  --research-dir $VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/YYYY-MM-DD/education-us
```

The command writes:

- `daily-brief.md`
- `cofounder-slack-report.md`

Slack reporting rule:
The research workflow may send to a dedicated `#product-ideas` channel only when its channel ID is explicitly configured. Maintain one root message per idea and use its thread as the complete research and discussion history. Before first sync, populate the candidate's Turkish `slack_pitch` with `one_liner`, `audience`, `problem`, and `core_experience`. The root must be a concise plain-language product explanation built from that pitch. Do not put research status, scores, evidence tables, Reddit analysis, competitor analysis, approval gates, or the current park/reject recommendation in the root.

Immediately after creating a new root, post the initial detailed research analysis in its thread. That analysis must cover why the idea was selected, market and audience logic, need signals, Reddit/community findings, competitors and the proposed gap, pricing or revenue signals, contradictory evidence, confidence, open checks, and the next recommendation. On later days, reuse the same root and append a dated thread update only when sources, recommendation, score, evidence count, or missing checks materially change. Never create a second root for an existing idea. The private ledger remains authoritative and Slack must contain no secrets, raw paid-source data, or private account identifiers.

Evidence gate rule:
Only `supports` observations satisfy app-supply, demand, audience, monetization, and competitor-gap checks. Strong active `competitor_gap` contradictions block validation and apply a score penalty until the contradiction is expired or answered by a genuinely differentiated, sourced wedge.

Useful commands:

```bash
npm run research:ledger -- init --state-root "$APP_FACTORY_STATE_ROOT" --candidate-file candidate.json
npm run research:ledger -- evidence --state-root "$APP_FACTORY_STATE_ROOT" --idea-id idea-id --file evidence.json
npm run research:ledger -- evaluate --state-root "$APP_FACTORY_STATE_ROOT" --idea-id idea-id
npm run research:ledger -- daily-plan --state-root "$APP_FACTORY_STATE_ROOT" --cooldown-days 7
npm run research:slack-sync -- sync --state-root "$APP_FACTORY_STATE_ROOT" --idea-id idea-id --channel-id "$PRODUCT_IDEAS_SLACK_CHANNEL_ID" --post-delta
```

`research:slack-sync -- sync` creates the concise root and its initial analysis thread together. On recurring runs, `--post-delta` appends material research changes to the bound thread and skips identical retries. `cofounder-slack-report.md` remains a private run artifact; `research:slack-sync -- report` is reserved for an explicitly requested cross-idea digest rather than routine daily posting.

## Stage 4 - Public Source Scan

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

## Stage 5 - Structured Data Ingest

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
- `community-pain-json` - Reddit, forum, review, support, or social problem notes summarized as evidence rows
- `audience-proxy-json` - public audience-size or reachability estimates such as community size, keyword volume, creator niche, or public report notes

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

## Stage 6 - Gap Research

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

Use `scripts/research-app-store-gap.mjs` after structured cluster scoring when an App Store/iTunes positioning pass is useful for competitor positioning. Treat that pass as one evidence class, not as the whole qualification process.
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

## Stage 7 - Selection Rationale

Purpose:
Make the recommendation explainable to a co-founder before it enters the factory.

Every `ready` candidate should include:

```json
{
  "selection_rationale": {
    "chosen_because": "...",
    "evidence_summary": "...",
    "audience_logic": "...",
    "competitor_gap": "...",
    "why_this_wedge": "...",
    "why_not_alternatives": "...",
    "tradeoffs": "...",
    "confidence": "low | low-medium | medium | high",
    "follow_up_questions": ["..."]
  }
}
```

Rules:

- Explain why this candidate was chosen, not only what it is.
- Explain why broader category clones or adjacent ideas were not chosen.
- Distinguish evidence from inference.
- Include at least one follow-up question even for `ready` ideas, because factory generation is still a product bet.
- Use `strategic-research-v4` for new factory-bound ready candidates so `selection_rationale` is validated by `scripts/idea-backlog.mjs`.

## Stage 8 - Strategic Thesis and AI/Backend Review

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

## Stage 9 - Candidate Gate

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
- selection rationale with chosen-because, evidence summary, audience logic, competitor gap, why-this-wedge, why-not-alternatives, tradeoffs, confidence, and follow-up questions
- for Education: concrete learning loop and AI role when AI is recommended

Generic category ideas must be rejected or left as `researching`.

## Stage 10 - Decision and Backlog Handoff

This workflow does not directly create repos. A validated candidate must receive explicit owner decisions for brainstorm, PRD, and factory readiness. Research automation may recommend those transitions but must not grant them.

Before backlog upsert:

```bash
npm run research:ledger -- decide --state-root "$APP_FACTORY_STATE_ROOT" --idea-id idea-id --type approve_brainstorm --reason "..." --actor OWNER --source-url slack://CHANNEL/THREAD
npm run research:ledger -- evaluate --state-root "$APP_FACTORY_STATE_ROOT" --idea-id idea-id
npm run research:ledger -- decide --state-root "$APP_FACTORY_STATE_ROOT" --idea-id idea-id --type approve_prd --reason "..." --actor OWNER --source-url slack://CHANNEL/THREAD
npm run research:ledger -- decide --state-root "$APP_FACTORY_STATE_ROOT" --idea-id idea-id --type mark_ready --reason "..." --actor OWNER --source-url slack://CHANNEL/THREAD
```

Then:

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
- Selection rationale explains why the recommendation was chosen and why weaker alternatives were not.
- Rejected generic directions are explicitly listed.
- Backlog candidates validate before factory consumption.
- Daily or recurring runs can produce useful evidence and co-founder summaries even when no candidate becomes `ready`.
- Existing ideas retain append-only evidence, decision history, dated evaluations, and a stable Slack thread across recurring runs.

## Failure Routing

- Insufficient source data: write `decision.md` with `status: insufficient_evidence`; do not emit ready candidates.
- Weak differentiation: move candidates to `rejected.json` or `researching`.
- Weak rationale: keep the candidate `researching`, write the missing evidence or follow-up question, and do not upsert it as `ready`.
- Data parser failure: preserve source inventory and report the exact file/encoding/delimiter issue.

## Commercial decision standard · 21 September 2026

Before evaluating or publishing, read `docs/research-commercial-quality/evidence-contract.md` in the canonical ViberMode repository (/Users/mcan/ViberMode on this host). Use schema-v3 ledger assessments: research coverage and source confidence are not commercial attractiveness or success probabilities. Show all six commercial dimensions and the cheapest decisive missing check; never fill unknowns with assumptions. Passing the preliminary gate does not validate product-market fit or authorize production. Legacy scores require re-evaluation before promotion.

Current user-authorized bulletins supersede older no-digest language only for the configured streams/channels. No forced new idea or US-only theme rotation. Keep stable idea cards, material thread updates, per-date bulletin deduplication and explicit owner promotion boundaries. Existing-product research uses the trigger/value/return/payment/distribution card and three close competitor comparisons defined in that contract.
