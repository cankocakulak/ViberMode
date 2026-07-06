---
name: mobile-competitor-teardown
description: Benchmark mobile app competitors with public App Store data, paywall/onboarding libraries, web evidence, and optional user-provided screen recordings. Use when the user asks to analyze competitor apps, education app monetization, onboarding flows, paywall patterns, review prompt timing, subscription pricing, App Store metadata, or to create a dashboard-ready research pack for private review.
---

# Mobile Competitor Teardown

This skill produces evidence-backed competitor teardown packs for mobile apps. It is optimized for iOS Education and subscription apps, but the same structure works for other B2C categories.

Read and follow the canonical ViberMode workflow first:

- `../viber-mode/packs/vibermode/workflows/mobile-competitor-teardown.md`

## Boundary

Own:

- App Store public metadata collection and refresh planning.
- Paywall, onboarding, pricing, monetization, permission, and review-prompt teardown.
- Evidence inventory, normalized app rows, matrix CSVs, app-level markdown reports, and dashboard-ready JSON.
- Honest coverage labeling when a source is inaccessible or a live app flow cannot be observed.
- Optional opportunity handoff into ViberMode app research/backlog artifacts.

Do not own:

- Installing or running third-party App Store apps inside iOS Simulator.
- Using the user's Apple ID, credentials, Sign in with Apple session, purchase flow, or paid trial without explicit user action.
- Claiming review-prompt placement, A/B variants, or pricing as observed unless there is evidence.
- Publishing competitor screenshots publicly without checking whether the output is private/internal.

## References

Load only the reference needed for the active task:

- `references/source-map.md` for which public sources to use and what each can prove.
- `references/apple-public-data.md` for Apple public API/page boundaries and refresh rules.
- `references/paywall-analysis-rubric.md` for the teardown fields, matrix values, and scoring rubric.

## Workflow

1. Resolve the category/theme, market, platform, output root, and whether the user provided an app list.
2. Check prior artifacts under `docs/[project-name]/` and `.vibermode-state/app-factory-state/research-runs/` before starting a fresh run.
3. Create or refresh the research pack. Prefer the reusable script for Apple public data:

   ```bash
   npm run research:competitor-teardown -- \
     --output-dir /path/to/research-runs/YYYY-MM-DD/education-paywall-teardown \
     --theme education \
     --market US \
     --queries "language learning,math solver,homework helper,micro learning,vocabulary builder,test prep" \
     --include-top-chart
   ```

4. Build a source inventory before interpretation. Record the URL, capture timestamp, source type, and limitation for every source.
5. Populate structured outputs:
   - `normalized-apps.jsonl` for App Store/public app metadata.
   - `matrices/*.csv` for onboarding, paywall, monetization, review-prompt, and pricing comparisons.
   - `apps/[app-slug].md` for app-level teardown notes.
   - `dashboard-data.json` for dashboard consumption.
6. Use web/public research to enrich each app. Prefer primary pages and structured sources; use Mobbin, Page Flows, PaywallPro, PaywallScreens, ScreensDesign, and public teardown articles as evidence links.
7. Label every app with `coverage_status`:
   - `full_flow`: onboarding and paywall flow observed from a source or user recording.
   - `paywall_only`: paywall evidence exists but full onboarding is missing.
   - `metadata_only`: App Store/public metadata only.
   - `inaccessible`: the app/source could not be reached.
8. For live or user-recorded flows, treat Apple Sign In, purchase, trial, and 2FA steps as user-controlled. Analyze screenshots/recordings the user provides; do not take account or payment actions on their behalf.
9. Produce a readable `decision.md` with findings, reusable patterns, risks, and candidate app opportunities. Keep opportunity claims separate from observed competitor facts.
10. If a dashboard repo is provided, copy or reference `dashboard-data.json` and screenshot assets into the repo's `data/latest/` and `public/screenshots/` folders.

## Evidence Rules

- Use `captured_at` for any source that can change.
- Mark unavailable details as `unknown`; do not infer close-button behavior, review prompt timing, trial eligibility, or Sign in with Apple gating without evidence.
- Separate `observed`, `source_claimed`, and `inferred` values in app notes when useful.
- Public App Store data can prove listing metadata, public screenshots, ratings, review count, IAP presence, price, genre, version, and update date. It does not prove exact paywall timing or live A/B variants.
- App Store Connect is only for owned apps. It cannot inspect competitors.

## Output Contract

Write a research pack shaped like:

```text
research-runs/YYYY-MM-DD/[theme]/
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

Return:

- Research path and dashboard path, if any.
- Coverage summary by status.
- Top competitor patterns and monetization archetypes.
- Gaps that require user-provided device recordings.
- Verification commands run.
