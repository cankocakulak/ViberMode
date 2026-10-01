> Schedule update — 2026-09-28: Monday initial collection is now **09:30 Europe/Istanbul**, for the 17:00–18:00 growth meeting. Wednesday and Friday reconciliation remain **21:30**. The Friday finalization cutoff is unchanged. Monday AppsFlyer first-launch installs and existing paid-CPI components are provisional; Apple completeness guards, store metrics and Business CPI definitions remain unchanged. Existing RevenueCat transaction/revenue and Mixpanel weekly activity/funnels are shown as early observations; retention/renewal maturity is never bypassed. This supersedes older Monday 21:30 references below.

# Weekly finalization and canonical comparisons

**2026-09-21 exception:** [Controlled late-provider-data corrections](late-data-backfill.md) now permits narrowly verified missing-date corrections for the last four FINAL weeks. All broad collection/replay and semantic/provider-revision guards below remain. Only the correction transaction can authorize rebuilding a verified archive.

Effective 2026-09-16. Supersedes the 2026-09-15 create-on-first-run snapshot policy. No metric definitions, provider collectors, formulas or warehouse schema are added by this lifecycle.

## Normal lifecycle — Europe/Istanbul

1. **OPEN:** first successfully collected, published and read-back-verified week. Monday 21:30 is the initial scheduled run for the preceding Monday–Sunday.
2. **RECONCILING:** subsequent runs, including Wednesday 21:30, continue to reconcile the same week. A failed/unfinished run cannot close it. No immutable archive is created in either state.
3. **Cutoff:** Friday 21:30 immediately following the reporting Sunday's end. For Sep 7–13, the cutoff is **Sep 18, 2026 at 21:30 +03:00**.
4. **FINAL:** requires at least two distinct successful full collection/publication receipts, including a successful collection that **started at or after that Friday cutoff**, completed, and passed canonical Notion read-back. A run started before the cutoff cannot qualify merely by finishing after it. Missing the Friday run does not close the week by elapsed time: the next successful post-cutoff full reconciliation can close it.
5. Only FINAL canonical values can create the immutable weekly page. The page is rendered, written in bounded batches, fully read back, then locked. Interrupted BUILDING archives remain unlocked and resume idempotently; verified archives cannot be automatically rewritten.

A successful full receipt covers Apple, Google Play, RevenueCat, Mixpanel, Creator Hub, Ad cost, AppsFlyer and First-party collector groups. A failed collector group or generic Provider Coverage fallback prevents closure. Known provider access limitations returned as documented metric-level WAITING/N/A/PARTIAL remain explicit exclusions. FINAL means the reporting period is closed **as of its reconciliation cutoff**, not that every metric became READY or every provider supplied complete data. Partial, immature, estimated, unknown-calendar and missing-definition observations never become comparison eligible merely because the week is FINAL.

Product transport failures returned inside WAITING rows also prevent closure: a fulfilled collector wrapper does not prove successful collection. Projection/export size or validation failures and raw timestamp/identity calibration errors in release-validation evidence are recorded as collectionErrors on the failed receipt. A real unvalidated-build coverage exclusion remains distinct from an interrupted collector. This guard does not change metric values, definitions or historical FINAL manifests.

Existing Mon/Wed/Fri 21:30 schedule is retained. `week-lifecycle.local.json` contains internal OPEN/RECONCILING/FINAL receipts, canonical row hashes, exclusion keys, and archive receipts; it contains no independent metric values. Notion remains the metric source of truth.

## Write protection and correction

Ordinary collectors/backfills skip FINAL weeks, including the rolling six-week and annual-cohort refresh selection. Mature renewals continue to appear in the current report week under their existing mature-start-cohort segments; renewal calculations are unchanged. Replay or cached-product reuse cannot finalize a week; unfinished historical weeks receive full fresh collection, and replay cannot overwrite FINAL canonical values. The publisher checks the live canonical manifest before displaying/archiving a FINAL week. A changed row, added/removed row or changed definition invalidates FINAL verification and suppresses comparisons; explicit manual correction is required. Presentation-only runs cannot advance an OPEN/RECONCILING week.

An explicit correction needs a reviewed week, exact archive page ID, correction ID and reason, plus a fresh canonical read-back. The former archive is privately backed up; only the authorized page is rebuilt, verified and relocked. The one-time CLI authorization below is scoped to W37 and is consumed by its recorded correction ID. Rerunning the same correction is a no-op; changed data or another finalized week requires a new separately reviewed correction migration. There is no automatic force-rewrite fallback.

## W37 one-time manual exception

The user explicitly requested rebuilding **and relocking** W37 from the current Sep 7–13 canonical warehouse. This is recorded as `W37-2026-canonical-repair-v1`, `MANUAL_CORRECTION`, with a **pre-Friday cutoff exception**. It does not claim that the Friday Sep 18 run already occurred or that partial Android/store/spend data are complete. Existing row statuses, coverage and exclusions are retained. All 454 canonical rows are included in the archive appendix and verified by canonical fingerprint; the warehouse values themselves are not rewritten by the repair.

The original repair command was consumed; do not reuse it to authorize later changes.

On Sep 17 the user separately and explicitly approved `W37-2026-mature-funnel-v1`: add four audited mature-cohort derived rows, promote the same-cohort Ozard funnel, then rebuild/relock the same archive. The existing 454 rows remain unchanged; the corrected manifest contains 458 rows. The dedicated `scripts/weekly-w37-baseline-correction.mjs` migration retains the prior correction record and private before-state, permits only those four exact creations and the existing archive/report blocks, and verifies idempotency after readback/relock. This exception does not relax W38+ FINAL immutability, maturity exclusions or comparison eligibility. Ordinary collection cannot invoke it.

## Source and compatibility rules

Executive WoW and rolling four-calendar-week trends query canonical Weekly App Metrics rows. They never parse archive/snapshot text. Both weeks must be FINAL and their complete live row manifests must match the recorded finalization receipts. The rolling four-week axis includes gaps rather than skipping to a distant comparable week.

A pair must also have:

- Adjacent Monday-start weeks for WoW; missing weeks are never bridged.
- Same app, metric definition, platform scope, country, segment semantics, unit and currency.
- Same verified source calendar, source/provenance and clean population/version/build filter.
- Complete compatible coverage: no partial Android period against a seven-day period. Explicit date masks must match relative to each week's start; seven of seven days when day coverage is recorded.
- Mature cohorts with identical relative start-cohort age and plan. W1 Aug 31 can compare with the preceding report's W1 Aug 24 if both share the same lag and complete renewal opportunity.
- Numeric READY/EARLY values with complete/mature semantics; no model ESTIMATE, WAITING/N/A or unverified source calendar.

Rates show previous value and percentage-point delta. Counts/money show previous value and `(current − previous) / abs(previous)` as WoW %. Previous zero shows the previous value but no undefined percentage. Ratios are never averaged across platforms. Additive app totals compare only if **both platform pairs independently qualify** and current platform units/currency/calendar/provenance are compatible. Otherwise labelled platform values remain separate. Historical Previous Week/WoW property values are not trusted as comparison evidence.

Priority trend set: Downloads, native Store CVR, CPI, Paywall → Checkout, New Purchases, Revenue, Core Value Reach, D1, W1 Renewal. The executive summary exposes the same nine existing KPIs grouped under Acquisition, Monetization, Retention & Usage. OPEN/RECONCILING current values may still be displayed, with their week status, but have no WoW.

## OPEN comparison presentation (2026-09-21)

The current Meeting Scorecard can display the newly completed calendar week as OPEN / preliminary. A separate display-only comparison checks the same definition, source/account, calendar, population, currency, maturity and full-coverage gates against the immediately preceding manifest-verified FINAL week. It labels both columns and shows % for counts/money, pp for rates; missing, partial, immature or incompatible pairs are omitted. A zero prior denominator has no percentage delta. This does not set canonical Previous Week/WoW, mark the current week FINAL, or admit it into rolling FINAL-only trends or immutable archives. The ordinary Monday/Wednesday/Friday lifecycle is unchanged.

FINAL warehouse rows, including their Latest Week checkbox, are now left untouched by a later week's publisher. The current report selects its explicit week date; the legacy checkbox is not the authoritative selection mechanism for immutable historical rows.
