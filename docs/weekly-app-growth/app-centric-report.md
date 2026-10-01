# App-centric report semantics — September 18, 2026

The existing warehouse, provider adapters, privacy model and Monday/Wednesday/Friday reconciliation lifecycle remain in place. The Meeting Scorecard is a projection of canonical values and explicit canonical count/coverage metadata. It has a small executive summary, followed by Ozard and EasySpell, each with Acquisition, Monetization, Usage and Retention. Countries, methodology, date coverage, four-week trends and cohort details are collapsed per app.

## Store acquisition

The signed-in current-owner Apple Metrics weekly table supplies exact unique-device impressions, total downloads and unique product-page views. Week-keyed evidence cannot carry forward into another week. Native CVR only connects these counts when their ratio agrees with the provider's rounded native percentage. W37 Ozard: 5,230 → 1,624, 31.05%; EasySpell: 4,170 → 206, 4.94%. Unique page views: 1,829 / 255. First downloads remain 1,494 / 195 and page-view events 2,611 / 322. First downloads / page views is a same-UTC-period proxy, not matched-user conversion. No counts are inferred from rounded percentages.

Google Play Listing preserves same-date legacy Statistics listing acquisition / visitor populations. Ozard 3,018 / 5,366 on Sep 7–11; EasySpell 15 / 66 on Sep 10–11. Separate device acquisitions are 3,821 on Sep 7–13 and 36 on Sep 10–13. Non-listing acquisitions are not calculated by subtraction. The current Store Analytics page redirects acquisition/source data to Growth Overview and legacy listing data to Statistics; a compatible exact W37 non-listing population has not been verified.

Known costs remain components. The media/store-download lower-bound rule allows incomplete network coverage only when attribution, platform, currency, calendar and the complete denominator are compatible. W37 has no such compatible pair: Meta app-level spend includes web, Apple downloads use UTC, media uses Istanbul and Play's day calendar is unverified; EasySpell Android is additionally partial. Google spend / AppsFlyer installs is visible in the main Acquisition section as “Network spend / attributed install · diagnostic”, with a short provider-calendar mismatch caveat. Business CPI remains blank until complete media plus final attributable UGC.

## Weekly activity versus acquisition cohorts

Weekly Operating Users uses existing in-week event timestamps and the existing clean release/build filter, without a seven-day maturity gate. Each stage counts independent distinct identities and retains its event-occurrence count. Returning users may enter later stages. Sunday activity belongs to that week; Monday activity belongs to the next week.

The primary Weekly Operating Funnel projects the existing cumulative ordered subsets for the same in-week first-open population. Each stage is a subset of the previous stage. Step conversion = cumulative stage count / preceding cumulative stage count; cumulative conversion = stage count / first-open count. All qualifying events must occur within the reporting week.

Independent counts and adjacent pairwise conversions are shown only under `Weekly Activity / Pairwise Diagnostics`. Diagnostic adjacent conversion = users with both stages in chronological order / all users at the preceding independent stage. Payment transitions additionally require matching view and attempt identifiers. These pairwise rates are not multiplied. Cumulative first-open conversion requires every ordered stage; its numerator differs legitimately from all weekly client acknowledgements. Missing identifiers suppress the affected ratios. Identities are kept transiently in memory only.

The secondary seven-day acquisition cohort uses fully elapsed first-open observation windows. A partial mature subset explicitly shows total/mature/pending at its own observation cutoff. Once the entire acquisition week is mature, the existing collector publishes its final result in the next OPEN reporting week under a mature-cohort segment. It does not back-write the earlier FINAL week. The export lookback includes the prior acquisition week; retention calculations are unchanged.

## Aggregate analytics and feature reach

EasySpell's existing iOS production aggregate counters already contain onboarding, paywall, purchase start, purchase acknowledgement and subscription start. Seven UTC ingestion dates are queried with the same numeric release/app_store channel filter. These remain partial channel/version event occurrences, not unique-user or matched-session conversion. No instrumentation, identity fields, Mixpanel or privacy policy change is introduced. Verified RevenueCat purchases/revenue remain separate financial truth.

Future feature rows preserve only aggregate proof from the same in-memory sets: feature count, active/core intersection, WAU and core totals, and subset verification. The renderer checks every count against canonical WAU/core before showing %Core. Raw identities are never persisted. W37 %Core remains blank because later source arrivals do not reconcile to its locked usage baseline.

## Authorized W37 exception and verification

`W37-2026-app-report-v1` is the explicit one-time correction requested by the user. It adds 21 evidence-backed rows (6 Apple counts, 10 weekly operating stages, 5 existing aggregate monetization counters), preserves all 458 existing warehouse rows, rebuilds the same W37 archive and relocks it. A durable journal records the old canonical, archive and lifecycle state. Only the explicitly enumerated added rows and report blocks are writable; the original historical downloads DB is outside the write boundary. A second run must produce zero writes. W38 onward follows the existing normal FINAL immutability rules.

WoW and four-week calculations continue to use canonical FINAL values with compatible definition, platform, source, calendar, currency, population, coverage and cohort age. Snapshot text is never a calculation source. Partial or incompatible values are not compared.

## Final readability correction

The latest Meeting Scorecard promotes existing canonical ordered chains (W37 iOS 1,509 → 895 → 622 → 49 → 16; Android 4,730 → 3,332 → 2,834 → 281 → 8). No collector or warehouse value changes. Apple uses “First Downloads / Product Page Views · period proxy”, with unique page views separate. EasySpell separates “Aggregate Product Telemetry · Partial” from “RevenueCat · Financial Truth” and explicitly explains their different populations. Ozard has no attributed-install denominator matching its app-level Meta spend (including web); the observed 21 iOS / 0 Android UTC installs remain in technical detail. Existing 7-day cohort analysis and locked historical snapshots remain unchanged.

## Visual dashboard projection

The main page uses native Notion columns, colored callouts, prominent KPI values and proportional text bars. iOS and Android acquisition cards remain separate; Play device downloads sit outside the matched listing flow. Known network amounts, verified zero, UGC estimates and install diagnostics are visible in one economics card. No incomplete component becomes Business CPI.

The strict weekly funnel and feature-reach tables are rendered as two platform bar panels. Funnel width uses the cumulative share of First Open; every stage retains exact count, step rate and cumulative rate. Feature width uses the share of WAU, not a rescaled share of the largest feature. Bars round to eighth-character cells (a positive sub-cell value has a minimum visible mark); numerical labels remain authoritative. Core/No-Core is a two-color 100% split. Repeat Core / Core is a display ratio of the existing compatible counts, not a new warehouse metric.

D1, D7, W1 and M1 are separate tiles. Renewal titles retain their canonical mature start cohort even when the value is unavailable. Existing finalized-compatible pp comparisons flow through the same app KPI formatter, including from W38; no additional comparison rule is introduced. EasySpell partial event telemetry, verified RevenueCat transactions and aggregate usage have distinct colored cards.

Detailed methods, independent activity and pairwise diagnostics, No-Core groups, countries, trends and seven-day cohort analysis remain in toggles. Presentation publishing leaves existing FINAL archives unchanged, verifies the rendered block tree including callout styling, and requires a zero-write rerun plus unchanged warehouse/history fingerprints. The main page is full-width for side-by-side scanning; Notion controls typography and column reflow.

### Balanced comparison view

The latest founder preference is a compact table-first layout, with core comparisons visible by default. A small app comparison table is followed by each app's iOS/Android matrix: store populations, native conversion, downloads, core users/WAU, D1/D7 and mature renewal cohorts. Ozard's strict weekly funnel is always open as a horizontal stage table with one row per platform, exact counts, scaled bars, step conversion and conversion from First Open. Known economics remain in an open table. EasySpell's partial telemetry and verified transactions are separate labelled populations in an open comparison table.

Small text and modest headings remain; large cards are removed. Only supporting store/usage detail, payment/cohort diagnostics, source coverage, countries and trends are collapsed. All original details stay accessible. `compact-dashboard.mjs` is exclusively a presentation projection; it reuses canonical models and the existing compatibility formatter. FINAL snapshots, warehouse values, metric definitions and collector logic are unchanged.

### Per-app disclosure

Ozard and EasySpell now each have one top-level app toggle containing the accepted comparison tables, funnel/activity view, economics and nested supporting-detail toggles. The global weekly comparison remains visible. The publisher stages deeper toggle content in separate bounded Notion appends so table rows and nested details retain their original structure.

EasySpell additionally shows its existing five iOS aggregate event counts horizontally: onboarding, paywall, purchase start, client acknowledgement and subscription start. It is explicitly labelled partial aggregate activity, not a same-user ordered funnel. The canonical baseline has no EasySpell weekly operating stage rows or first-open-linked stage populations; Android's six WAU do not establish those transitions. Only the already-verified same-period event ratios are shown. RevenueCat verified transactions remain a distinct population. No instrumentation, identities, metric definitions or source values are added.

### Horizontal platform comparison

Acquisition now runs across columns, with iOS, Android and a bottom `Genel` row. The latter reuses the existing canonical aggregation gate: incompatible cross-store downloads and conversion rates remain blank. The financial table uses the same three rows and shows compatible purchase/revenue totals. Usage and retention also use platform rows; unique users and rates are not summed across platforms. Known media components, UGC estimates and network spend/install diagnostics share one horizontal economics table. Its app-wide row contains only app-level components, not a complete spend total; the adjacent explanation names missing media coverage, final UGC and store-window compatibility.

EasySpell's existing 54 iOS app-open and 86 session-start occurrences are now visible as entry activity beside the onboarding-stage table. They include repeat activity and have no ordered user link to onboarding. No First Open denominator or onboarding conversion is inferred from these counters. The accepted 18.5% purchase-start/paywall and 60% acknowledgement/start period event ratios remain unchanged. FINAL W37 values and archive remain untouched.

### Compact detail contents

The two detail toggles now render canonical model tables directly instead of flattening the earlier dashboard into long paragraph sequences. Ozard Store & usage detail has six direct blocks: date coverage toggle, two-platform usage table, feature heading/table/caption and No-Core breakdown toggle. Cohorts & payment diagnostics has five direct blocks: mature cohort heading/table, maturity coverage table, short scope note and the independent weekly activity toggle. EasySpell uses six and three direct blocks respectively. Countries and Technical / Data Quality retain their own nested toggles instead of expanding automatically inside Coverage.

EasySpell explicitly states that its ordered user funnel is unavailable. The observed event table does not use arrows, cumulative bars or user-conversion labels; the existing 18.5% and 60% period event ratios appear inside their respective event cells. Entry events remain separately labelled repeat-inclusive counts. Read-only inspection of the existing backend aggregate schema confirms it stores day/platform/version/event/dimension counts, with no user/session event trail or First Open event. Android has no canonical ordered stage population for the frozen week. No user funnel was manufactured and no collection or tracking changed.

### Explicit platform totals

At the user's request, the presentation now adds `Genel · platform total` for compatible Ozard usage, strict weekly funnel, mature acquisition cohort, independent activity, feature reach and retention/renewal rates. Counts sum the two platform populations, not deduplicated cross-platform people. Rates divide summed canonical numerators by summed denominators; platform percentages are never averaged. Metric/segment/week/calendar/source/definition/population/coverage and observation cutoff must agree; both platform rows must exist and be complete. These projections do not alter canonical All rows, historical snapshots or WoW rules.

W37 Ozard: WAU 7,831; core 3,351 (42.8%); repeat 885 (26.4% of core); no core 4,480 (57.2%). Strict weekly platform chain: 6,239 → 4,227 → 3,456 → 330 → 24. Mature chain: 1,394 → 903 → 100 → 16. EasySpell has no compatible iOS user counts, so app-wide unique-user totals remain unavailable.

EasySpell Google known spend now also displays its compatible platform sum, TRY 1,960.011153, with 35 network-attributed installs: TRY 56.000318657142856 per install. It retains the existing spend/install calendar-proxy caveat and is not Business CPI. Partial network coverage and unmatched store denominators still cannot become Business CPI or a store-download cost floor.

Read-only source verification: both EasySpell product event enums define App Open, not a distinct First Open; launch code emits App Open on cold launch without a first-install gate. iOS release disables Mixpanel and sends identity-free aggregate counters. The absent First Open is a collection distinction, not a hidden scorecard value. No app or tracking code was changed.

### Marketing / downloads entry summary

The report now starts with a two-app table showing the known marketing subtotal and the exact platform store counts. W37 Ozard: TRY 7,882.86 verified media components + TRY 161.70 estimated UGC = TRY 8,044.56 known partial subtotal. EasySpell: TRY 1,960.011153 + TRY 60 = TRY 2,020.011153. These are expressly partial/estimated and do not replace canonical Total Acquisition Spend or Business CPI. Unknown Apple Ads and other network coverage are not zero. Currency groups are never combined, and an overlapping app-level/network platform total is excluded from subtotal arithmetic.

Apple Search Ads is named visibly in both the entry table and app economics whenever its canonical amount is absent. The September 18 browser recheck found a signed-in Apple Ads session, not an authentication failure: the profile lists an Account Link role, and the Kant Labs campaign report link returns to Link App Store Connect Account. Campaign spend remains unreadable. Updated read-only access evidence is kept outside FINAL warehouse rows; the current display still truthfully states the amount is missing. The user was asked to open the campaign-reporting account/page.

Apple's current [role documentation](https://ads.apple.com/app-store/help/get-started/0012-link-app-store-connect-accounts) confirms Link Accounts cannot view campaign reports. The concrete access fix is Account Read Only for the campaign-owning account, or Read Only for the relevant campaign group; API reporting requires its separate API read-only role. No permissions were changed.

Downloads remain 1,494 first iOS downloads / 3,821 Android new-device acquisitions for Ozard and 195 / 36 for EasySpell, the latter Android figure covering only four of seven days. Existing source-unit/calendar rules continue to suppress a misleading combined store-download total.

## W38 OPEN and final wording/navigation corrections (2026-09-21)

Supersedes the combined marketing subtotal above: verified media components and UGC base estimates have separate columns, with complete acquisition cost Pending until canonical coverage is complete. The estimate is explicitly base-model-only with earnings/bonus/currency unresolved. RevenueCat display labels are Verified Initial Purchases (New transactions) and Verified Period Revenue. Play listing visitors are never labelled Apple Product Page Views. Store Conversion cells distinguish Apple Native CVR from Play Listing CVR. Apple redownloads are derived only from compatible canonical total minus first-time downloads (W37 130 Ozard / 11 EasySpell).

Apps are visible headings; their core store, cost, funnel/aggregate telemetry, financial, usage and retention tables remain open. Five single-level detail toggles per app contain store/markets/acquisition sources, usage, funnel/cohort or monetization diagnostics, data quality, and FINAL trends/history. No toggle nesting. Platform user-count sums say Platform-summed · not deduped. Technical caveats stay in details; visible coverage labels stay short. Top Markets uses complete iOS store-country rows when available; otherwise explicitly labelled reconciled AppsFlyer iOS paid-install geography, never pretending this is store-download geography.

W37 canonical values and its locked historical presentation remain unchanged. Corrections apply to the current report renderer; W37 baseline definitions and the First Open audit are explained in the current diagnostic section. The W37 renderer was separately checked against canonical rows without publishing to the locked archive.

Source audit clarified that the First Open difference is not solely late delivery. Weekly operating counts use any in-week First Open per identity; seven-day cohorts use earliest observed First Open in their lookback and a separate cutoff. Sep 21 read-only re-audit reproduces W37 1,509/4,730 in-week identities; 1 iOS and 3 Android identities also have earlier-period First Opens, yielding current birth counts 1,508/4,727. The remaining Android difference of 7 versus the Sep 15 frozen cohort is source-snapshot drift; historical ingestion timing is not recoverable from the retained aggregate evidence. Do not assert all 10 are late arrivals. W38 has 16 Android identities with repeated earlier-period First Open. Accepted calculations and W37 counts are not changed.

W38 usage remains clean-build scoped. Read-only version audit finds iOS session activity predominantly on 3.1.11 while accepted clean filter remains 3.1.10. This is disclosed; no release eligibility, instrumentation or population definition was expanded. Detailed private aggregate evidence is in tmp/w38/first-open-audit.local.json; no raw user identities persisted.

## W38 provider readback reconciliation — 2026-09-21

Apple daily fallback exposes Sep 14–19 (6/7), while weekly grouping returns a different first-download total despite a date control ending Sep 19. Weekly discovery/CVR and derived redownload composition remain withheld until exact coverage reconciles; no Sunday zero is inferred. Play new-device downloads cover Sep 14 only, and legacy listing visitors/acquisitions cover Sep 14–16; the matched listing ratio has 3/7 coverage and is not the device-download funnel.

Ozard Meta official custom Sep 14–20, Europe/Istanbul readback reconciles four account campaigns to TRY 16,350.97. The new MX campaign explicitly targets canonical Meta app 4367367790249020; accepted older iOS/package/web mappings remain attached as evidence. Other Meta account coverage remains unresolved. Apple Ads authentication now works, but the current Account Link role redirects away from reporting. Reporting access on the owning account is still required. These are dated source observations, not permanent zero/coverage assumptions.
