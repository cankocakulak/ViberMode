# Workflow: Idea Research Backlog

> Independent research loop for discovering, scoring, and maintaining app ideas before any repository is created.

## Pipeline

```text
research inputs -> idea synthesis -> scoring -> backlog upsert -> ranking review -> publish private state
```

This workflow intentionally stops before app generation. It updates a private idea backlog that downstream factory workflows can consume.

## Storage Boundary

ViberMode is public and must contain only reusable workflow definitions and scripts. Research outputs, app ideas, competitive notes, and queue state belong in a private state repository.

Recommended private repository:

```text
ViberBoyz/app-factory-state
```

Recommended local checkout:

```text
/Users/mcan/Documents/Codex/vibermode-state/app-factory-state
```

## Private State Contract

```text
ideas/
├── backlog.json
└── research-runs/
    └── YYYY-MM-DD.json

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
  "summary": "A tiny daily habit tracker for low-friction completion.",
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

## Stage 1 - Research Inputs

Purpose:
Collect current market, platform, keyword, competitor, and product signals.

Inputs:

- public web research
- App Store category observations
- search/keyword trends where available
- internal product constraints
- prior run outcomes from `factory/runs/`

Rules:

- Prefer sourced summaries over unsourced claims.
- Keep raw research in `ideas/research-runs/`.
- Do not include credentials, private account identifiers, or paid-source exports unless the state repo access is explicitly approved for that material.

## Stage 2 - Idea Synthesis

Purpose:
Convert signals into concrete app candidates.

Each candidate must include:

- app name
- repo slug
- bundle ID slug or explicit bundle ID
- target user
- problem statement
- product idea prompt suitable for `product-to-code`
- constraints for MVP scope

## Stage 3 - Scoring and Ranking

Purpose:
Keep the top ideas at the front of the queue.

Scoring dimensions:

- demand
- buildability
- differentiation
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
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state \
  --idea-file /path/to/idea.json
```

Validate:

```bash
node scripts/idea-backlog.mjs validate \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state
```

Select the next ready idea without changing state:

```bash
node scripts/idea-backlog.mjs select \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state
```

Reserve the next ready idea for a factory run:

```bash
node scripts/idea-backlog.mjs select \
  --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state \
  --reserve
```

## Success Criteria

- `ideas/backlog.json` validates.
- At least one `ready` idea exists when the app factory is expected to run.
- Ideas are ranked in intended priority order.
- Every `ready` idea has a product idea prompt specific enough for `product-to-code`.
- Research and backlog commits are pushed to the private state repo.

## Failure Routing

- No usable research signals: keep existing backlog unchanged and record a research run with `status: "no_update"`.
- No ready ideas: app factory automation should stop with a clear "no eligible ideas" result.
- Backlog validation failure: do not run app factory; fix the state repo first.
