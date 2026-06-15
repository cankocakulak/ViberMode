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
| `note` | `Note`, `Summary`, `Observation`, `Insight`, `Pain`, `Complaint` |

## Research Gate Usage

Imported source signals are directional evidence, not backlog-ready ideas by themselves. A `ready` candidate still needs:

- structured source or imported market evidence
- live competitor/gap review where possible
- concrete user pain and narrow MVP wedge
- `market_thesis`
- `ai_backend_strategy`
- `differentiation_thesis`
- Education-specific `learning_thesis`

`scripts/research-app-store-gap.mjs` automatically reads `market-signals.jsonl` from the research directory and includes relevant rows in the gap report plus candidate evidence sources.
