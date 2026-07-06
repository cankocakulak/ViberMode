# Workflow: Mobile Competitor Teardown

> Build an evidence-backed competitor research pack for mobile app onboarding, paywalls, pricing, monetization, and review prompt timing.

## Fast Path

Use this workflow when the user wants to study competitor apps, especially iOS Education or subscription apps, and wants a table/dashboard-ready output rather than a product spec.

Typical prompts:

- "Analyze education app paywalls and onboarding."
- "Make a competitor teardown for these apps."
- "Refresh Apple data and compare monetization."
- "Build a private dashboard of app onboarding/paywall patterns."

## Boundary

Own:

- public App Store metadata refresh
- paywall/onboarding library research
- public web teardown evidence
- user-provided screenshot or screen recording analysis
- matrix CSVs, app markdown notes, dashboard JSON, and decision report

Do not own:

- installing App Store apps in iOS Simulator
- taking over Apple ID, Sign in with Apple, 2FA, purchase, trial, or payment steps
- claiming unobserved review prompts or live A/B variants
- publishing competitor screenshots publicly without a privacy/licensing check

## State Layout

Write research output under:

```text
.vibermode-state/app-factory-state/research-runs/YYYY-MM-DD/[theme]/
├── source-inventory.json
├── app-list.csv
├── normalized-apps.jsonl
├── dashboard-data.json
├── matrices/
│   ├── onboarding-matrix.csv
│   ├── paywall-matrix.csv
│   ├── monetization-matrix.csv
│   ├── review-prompt-matrix.csv
│   └── pricing-matrix.csv
├── apps/
│   └── [app-slug].md
├── screenshots/
├── decision.md
└── backlog-candidates.json
```

If the user wants a separate dashboard repository, copy or sync `dashboard-data.json`, matrix CSVs, and allowed screenshots into that repo's `data/latest/` and `public/screenshots/` paths.

## Inputs

| Input | Required | Description |
|---|---:|---|
| `category` | no | App Store category, default `Education` |
| `market` | no | Storefront/geography, default `US` |
| `platform` | no | Default `iOS / App Store` |
| `theme` | no | Run slug, for example `education-paywall-teardown` |
| `app_list` | no | App names, App Store URLs, IDs, CSV, JSON, or text file |
| `dashboard_repo` | no | Local dashboard repo to receive latest data |
| `source_access` | no | Available paid accounts or user-provided screenshots |

## Workflow

1. Resolve the run scope: category, market, platform, theme, app list, output root, and dashboard repo.
2. Check prior runs under `.vibermode-state/app-factory-state/research-runs/` and project docs before creating a new run.
3. Initialize or refresh Apple public data:

   ```bash
   npm run research:competitor-teardown -- \
     --output-dir .vibermode-state/app-factory-state/research-runs/YYYY-MM-DD/education-paywall-teardown \
     --theme education \
     --market US \
     --queries "language learning,math solver,homework helper,micro learning,vocabulary builder,test prep" \
     --include-top-chart
   ```

4. Record every source in `source-inventory.json` before interpretation.
5. Normalize app rows into `normalized-apps.jsonl` and `app-list.csv`.
6. Search enrichment sources by exact app name and publisher:
   - PaywallPro Open Paywall Gallery
   - PaywallScreens
   - Mobbin
   - Page Flows
   - ScreensDesign
   - public app-specific teardown posts or videos
   - user-provided screenshots/recordings
7. Fill matrices using observed values only. Use `unknown` where evidence is missing.
8. Write one `apps/[app-slug].md` teardown per app with evidence links, observations, inferences, and missing evidence.
9. Create or update `dashboard-data.json` for visualization.
10. Write `decision.md` with:
    - executive takeaway
    - source coverage
    - strongest patterns
    - risky patterns
    - app-by-app highlights
    - gaps requiring physical-device recordings
    - optional opportunity candidates

## Coverage Rules

Use `coverage_status` consistently:

- `full_flow`: onboarding and paywall flow observed.
- `paywall_only`: paywall observed, onboarding incomplete.
- `metadata_only`: App Store/public metadata only.
- `inaccessible`: source could not be reached.

Use `evidence_status` consistently:

- `observed`
- `source_claimed`
- `inferred`
- `unknown`

## Dashboard Contract

`dashboard-data.json` should include:

```json
{
  "schema_version": 1,
  "generated_at": "ISO-8601",
  "category": "Education",
  "market": "US",
  "platform": "iOS / App Store",
  "summary": {
    "total_apps": 0,
    "coverage": {}
  },
  "apps": [],
  "sources": [],
  "patterns": [],
  "recommendations": []
}
```

Keep the dashboard data derived from the research pack so the report remains auditable.

## Success Criteria

- Research pack exists and is readable standalone.
- Apple/public data has capture timestamps and source URLs.
- Matrices are populated or explicitly marked `unknown`.
- App-level notes distinguish observed facts from inference.
- Dashboard can render the latest data without manual copy-paste.
- Missing live-flow evidence is named clearly instead of guessed.
