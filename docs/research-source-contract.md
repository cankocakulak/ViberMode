# Research Source Contract

This contract defines how external market evidence enters app opportunity research before any app repository is created.

## Boundary

ViberMode stores reusable scripts and workflow definitions only. Raw paid exports, private research notes, and generated research packs belong in the private app factory state checkout.

Recommended private paths:

```text
$VIBERMODE_WORKSPACE_ROOT/app-factory-state/sources/[provider]/[report-type]/
$VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/YYYY-MM-DD/[category-or-theme]/
```

## Ingest Command

When no paid or manually exported source exists, start with public Apple sources:

```bash
npm run research:public-scan -- \
  --output-dir "$VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/2026-06-14/education-us" \
  --theme education \
  --market US \
  --include-top-chart
```

The public scan uses iTunes Search API, public customer review RSS, and optional Apple public top chart RSS. It writes `market-signals.jsonl`, `normalized-apps.jsonl`, `public-scan-summary.md`, and public-only opportunities. These signals are useful for discovery but do not include paid revenue or download estimates.

Use the generic ingest command for AppTweak, Sensor Tower, data.ai, App Store chart exports, keyword ranking CSVs, and manual JSON notes:

```bash
npm run research:ingest -- \
  --input "/path/to/source-export.csv" \
  --output-dir "$VIBERMODE_WORKSPACE_ROOT/app-factory-state/research-runs/2026-06-14/education-us" \
  --provider apptweak \
  --report-type keyword-ranking \
  --category Education \
  --market US
```

The script copies the input into `sources/[provider]/[report-type]/` when the output directory is under `research-runs/`, updates `source-inventory.json`, and writes:

```text
market-signals.jsonl
market-source-summary-[source-id].json
market-source-summary-[source-id].md
```

Use `--no-copy-source` when the source file is already stored in the private state repository or should only be referenced.

## Normalized Signal Shape

Each row in `market-signals.jsonl` is a standalone evidence row:

```json
{
  "schema_version": 1,
  "source_id": "apptweak-keyword-ranking-ielts-speaking",
  "provider": "apptweak",
  "report_type": "keyword-ranking",
  "signal_type": "keyword_rank",
  "captured_at": "2026-06-14T00:00:00.000Z",
  "row_number": 1,
  "category": "Education",
  "market": "US",
  "platform": "App Store",
  "app_name": "Example App",
  "keyword": "ielts speaking practice",
  "rank": 8,
  "search_volume": 72,
  "difficulty": 31,
  "directional_score": 74
}
```

Supported signal types:

- `app_metric` - app, revenue, download, rating, DAU, or growth evidence
- `keyword_rank` - keyword, rank, search volume, difficulty, and app visibility evidence
- `market_note` - manual source notes, public report observations, trend notes, or user pain evidence
- `app_positioning` - app metadata without enough metric fields
- `community_pain` - summarized public Reddit, forum, support, review, or social posts that describe a repeated user problem
- `audience_proxy` - public evidence for audience size, reachability, or demand intensity such as subreddit size, search volume, creator niche size, public survey notes, or market reports

## Column Aliases

The ingest script accepts common CSV/TSV/JSON field names.

| Normalized field | Accepted examples |
|---|---|
| `app_name` | `App Name`, `App`, `Unified Name`, `Title`, `Track Name` |
| `app_id` | `App ID`, `Apple ID`, `Unified ID`, `Track ID` |
| `publisher` | `Publisher`, `Developer`, `Seller Name`, `Artist Name` |
| `keyword` | `Keyword`, `Search Term`, `Term`, `Query` |
| `rank` | `Rank`, `Position`, `Ranking`, `App Rank`, `Keyword Rank` |
| `search_volume` | `Search Volume`, `Volume`, `Traffic`, `Popularity` |
| `difficulty` | `Difficulty`, `Competition`, `Keyword Difficulty` |
| `downloads` | `Downloads`, `Installs`, `Estimated Downloads` |
| `download_growth` | `Download Growth`, `Downloads PoP Growth`, `Download Delta` |
| `revenue` | `Revenue`, `Estimated Revenue`, `IAP Revenue`, `Consumer Spend` |
| `revenue_growth` | `Revenue Growth`, `Revenue PoP Growth`, `Revenue Delta` |
| `rating` | `Rating`, `Average Rating`, `Average User Rating` |
| `rating_count` | `Rating Count`, `Reviews`, `Review Count`, `User Rating Count` |
| `url` | `URL`, `App URL`, `Store URL`, `Source URL`, `Link` |
| `note` | `Note`, `Summary`, `Observation`, `Insight`, `Pain`, `Complaint` |
| `evidence` | `Evidence`, `Evidence Detail`, `Source Detail` |

## Problem And Audience Evidence

App Store evidence is not enough by itself for backlog readiness. When possible, add at least one non-store signal class before promoting a candidate:

- community pain: public Reddit/forum/support/review complaints summarized without copying long posts
- web trend: public article, search result, launch directory, or problem page
- keyword demand: search volume, ranking, difficulty, or long-tail intent
- audience proxy: public community size, niche reach, learner/test taker population, creator audience, job/title count, or comparable market report
- prior outcome: shipped/rejected factory app, retention note, TestFlight feedback, or review finding

Recommended manual JSON shape:

```json
{
  "observations": [
    {
      "signal_type": "community_pain",
      "cluster": "Language learning / vocabulary",
      "keyword": "ielts speaking",
      "note": "Learners repeatedly ask for realistic speaking practice and immediate correction.",
      "evidence": "Public community/search summary captured on YYYY-MM-DD.",
      "url": "https://example.com/source",
      "search_volume": 72
    },
    {
      "signal_type": "audience_proxy",
      "cluster": "Language learning / vocabulary",
      "note": "Audience appears reachable through exam-prep keywords and public learner communities.",
      "evidence": "Keyword volume plus community-size proxy.",
      "url": "https://example.com/source"
    }
  ]
}
```

## Research Gate Usage

Imported source signals are directional evidence, not backlog-ready ideas by themselves. A `ready` candidate still needs:

- structured source or imported market evidence
- live competitor/gap review where possible
- concrete user pain and narrow MVP wedge
- `market_thesis`
- `ai_backend_strategy`
- `differentiation_thesis`
- Education-specific `learning_thesis`
- for `strategic-research-v4`, `selection_rationale` explaining why this idea was chosen, why alternatives were not, the evidence summary, tradeoffs, confidence, and follow-up questions

`scripts/research-app-store-gap.mjs` automatically reads `market-signals.jsonl` from the research directory and includes relevant rows in the gap report plus candidate evidence sources.

Use `npm run research:daily-brief -- --research-dir <research-run>` after a run to write `daily-brief.md` and `cofounder-slack-report.md`. The latter is a Slack-ready body only; sending it requires an explicitly configured Slack connector or automation.
