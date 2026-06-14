# Workflow: Idea Research Backlog

> Independent research loop for discovering, scoring, and maintaining app ideas before any repository is created.

## Pipeline

```text
app-opportunity-research -> candidate review -> backlog upsert -> ranking review -> publish private state
```

This workflow intentionally stops before app generation. It consumes standalone research packs and updates a private idea backlog that downstream factory workflows can consume.

For standalone research that does not update the factory queue, use:

```text
packs/vibermode/workflows/app-opportunity-research.md
```

## Storage Boundary

ViberMode is public and must contain only reusable workflow definitions and scripts. Research outputs, app ideas, competitive notes, and queue state belong in a private state repository.

Recommended private repository:

```text
ViberBoyz/app-factory-state
```

Recommended local checkout:

```text
$VIBERMODE_WORKSPACE_ROOT/app-factory-state
```

## Private State Contract

```text
sources/
└── [provider]/
    └── [report-type]/

research-runs/
└── YYYY-MM-DD/
    └── [category-or-theme]/
        ├── source-inventory.json
        ├── normalized-apps.jsonl
        ├── clusters.json
        ├── opportunities.json
        ├── gap-research-[cluster].json
        ├── gap-research-[cluster].md
        ├── rejected.json
        ├── decision.md
        └── backlog-candidates.json

ideas/
├── backlog.json

factory/
└── runs/
    └── run-YYYYMMDDHHMMSS-xxxxxx.json
```

The machine-readable backlog is `ideas/backlog.json`. It must use schema version `1` and keep the highest-priority ideas at the top through `rank` plus score ordering.

Minimum idea shape:

```json
{
  "id": "pocket-habits",
  "rank": 1,
  "status": "ready",
  "title": "Pocket Habits",
  "app_name": "Pocket Habits",
  "repo_slug": "pocket-habits",
  "bundle_id_slug": "pockethabits",
  "platform": "ios",
  "stack": "SwiftUI",
  "category": "Education",
  "cluster": "Plant / nature ID",
  "summary": "A tiny daily habit tracker for low-friction completion.",
  "specific_gap": "Specific underserved angle supported by evidence.",
  "mvp_wedge": "Narrow MVP that is not a generic category clone.",
  "why_now": "Why current category signals make this worth testing.",
  "evidence_sources": ["app-store-education-revenue-growth-2026-05-11"],
  "competitors": ["Comparable App A", "Comparable App B"],
  "metric_snapshot": {
    "revenue": 100000,
    "revenue_growth": 10000,
    "downloads": 50000,
    "download_growth": 5000,
    "dau": 20000
  },
  "product_idea": "Build a SwiftUI iOS app that lets users add today's habits, toggle completion, see progress, reset the day, and persist the list locally.",
  "scores": {
    "total": 82,
    "demand": 7,
    "buildability": 10,
    "differentiation": 6,
    "monetization": 5,
    "risk": 3
  },
  "research": {
    "updated_at": "2026-05-27T00:00:00.000Z",
    "research_run": "research-runs/YYYY-MM-DD/category-or-theme",
    "signals": []
  },
  "factory": {
    "status": "queued"
  }
}
```

Allowed idea statuses:

```text
researching -> ready -> reserved -> in_progress -> shipped
paused
rejected
```

Allowed factory statuses:

```text
queued -> reserved -> prepared -> building -> submitted -> complete
blocked
skipped
```

## Stage 1 - Research Pack Selection

Purpose:
Choose a completed app opportunity research pack to convert into backlog candidates.

Inputs:

- `research-runs/YYYY-MM-DD/[category-or-theme]/decision.md`
- `research-runs/YYYY-MM-DD/[category-or-theme]/opportunities.json`
- `research-runs/YYYY-MM-DD/[category-or-theme]/backlog-candidates.json`
- internal product constraints
- prior run outcomes from `factory/runs/`

Rules:

- Do not promote candidates directly from a single static CSV.
- Prefer candidates backed by both structured metrics and competitor/gap research.
- Treat `gap-research-[cluster].md` as the human review artifact before backlog upsert.
- Keep raw and interpreted research in `research-runs/`, not in ViberMode.
- Do not include credentials, private account identifiers, or paid-source exports unless the state repo access is explicitly approved for that material.

## Stage 2 - Idea Synthesis

Purpose:
Convert signals into concrete app candidates.

Each candidate must include:

- app name
- repo slug
- bundle ID slug or explicit bundle ID
- category and cluster
- target user
- problem statement
- evidence source IDs
- competitor/comparable apps
- metric snapshot
- specific gap
- MVP wedge
- why-now statement
- product idea prompt suitable for `product-to-code`
- constraints for MVP scope

## Stage 3 - Scoring and Ranking

Purpose:
Keep the top ideas at the front of the queue.

Scoring dimensions:

- demand
- revenue signal
- growth signal
- engagement signal
- competition gap
- buildability
- novelty
- monetization
- risk

The backlog selector uses:

```text
rank ascending, then scores.total descending, then id ascending
```

## Stage 4 - Backlog Upsert

Use:

```bash
node scripts/idea-backlog.mjs upsert \
  --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state \
  --idea-file /path/to/idea.json
```

Validate:

```bash
node scripts/idea-backlog.mjs validate \
  --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state
```

Select the next ready idea without changing state:

```bash
node scripts/idea-backlog.mjs select \
  --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state
```

Reserve the next ready idea for a factory run:

```bash
node scripts/idea-backlog.mjs select \
  --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state \
  --reserve
```

## Success Criteria

- `ideas/backlog.json` validates.
- At least one `ready` idea exists when the app factory is expected to run.
- Ideas are ranked in intended priority order.
- Every `ready` idea has evidence sources, competitors, metric snapshot, specific gap, MVP wedge, why-now, and a product idea prompt specific enough for `product-to-code`.
- Research and backlog commits are pushed to the private state repo.

## Failure Routing

- No usable research signals: keep existing backlog unchanged and record a research run with `status: "no_update"`.
- No ready ideas: app factory automation should stop with a clear "no eligible ideas" result.
- Backlog validation failure: do not run app factory; fix the state repo first.
