> Schedule update — 2026-09-28: Monday initial collection is now **09:30 Europe/Istanbul**, for the 17:00–18:00 growth meeting. Wednesday and Friday reconciliation remain **21:30**. The Friday finalization cutoff is unchanged. Monday AppsFlyer first-launch installs and existing paid-CPI components are provisional; Apple completeness guards, store metrics and Business CPI definitions remain unchanged. Existing RevenueCat transaction/revenue and Mixpanel weekly activity/funnels are shown as early observations; retention/renewal maturity is never bypassed. This supersedes older Monday 21:30 references below.

# Weekly App Growth Scorecard

**Apple reporting access restored (2026-09-21):** Separate AŞ reporting key `LBPRGL653R` is installed through the existing Keychain mechanism. Both priority apps, Analytics request lists/report types and AŞ Sales SUMMARY return 200. Existing report requests are active; no Admin initialization is required. Reporting uses this key while App Manager/LLC credentials stay unchanged. Publication still requires compatible date coverage.

**Controlled late-data backfill (2026-09-21):** [Implemented rule and recovery](late-data-backfill.md). The last four FINAL weeks can receive journaled missing-date-only corrections; changed provider values or source semantics require review. [Separate Apple reporting-key setup](apple-reporting-key-setup.md).

**Current store infrastructure audit (2026-09-21):** [FINAL backfill, Apple roles and current Play exports](store-infrastructure-audit-2026-09-21.md). Current Play GCS access succeeds; install exports remain stale/missing. Priority apps are now in AŞ and its App Manager key cannot read reporting APIs. This dated audit supersedes older account/access observations below. Its original proposal is now superseded by the implemented controlled-backfill rule above.

**Current presentation:** [Compact canonical funnels](funnels.md) — four visible sections; all technical detail is expandable.

**Current lifecycle:** [Finalization and canonical comparisons](finalization.md) supersedes the dated snapshot/backfill policy below. OPEN → RECONCILING → FINAL after successful Friday-cutoff reconciliation; only FINAL weeks are archived, locked and comparison eligible. FINAL canonical weeks remain protected except for the journaled missing-date-only correction rule above. W37 has an explicitly recorded one-time manual repair exception.

Separate read-only provider collectors and a canonical Notion sink. The historical downloads automation and database remain unchanged. Runtime configuration and aggregate evidence are private, ignored files; credentials are resolved at execution time.

## Run

- `npm run growth:collect` — collect the previous completed Monday–Sunday without publishing.
- `npm run growth:publish` — collect and upsert the canonical Notion database.
- `npm run growth:weekly` — refresh available snapshots from the preceding six report weeks plus saved cohorts aged 51–56 weeks, then collect/publish the latest completed week. This reconciles late store reports, Creator bonuses, and subscription renewals. Only OPEN/RECONCILING weeks are refreshed, with fresh product collection before closure; FINAL weeks are skipped. Measurable clean D1/D7 retains its existing coverage caveats.
- `node scripts/weekly-app-growth.mjs --week YYYY-MM-DD` — one completed Monday-start week.
- `node scripts/weekly-app-growth.mjs --replay docs/weekly-app-growth/YYYY-MM-DD.local.json --publish` — idempotent publication/read-back without provider queries.
- `npm run test:growth` — focused integrity checks.

Configuration: `.growth-scorecard.local.json` (mode 0600). It defines immutable store identities, provider project bindings, historic Apple accounts, per-account sales credentials, Google Play exports, clean version/build allowlists, privacy constraints, verified Creator category IDs and store-identity evidence, and the new Notion database/data source. `envFiles` points to existing local credential mechanisms; no secret belongs in the registry. Do not add secrets as command-line options.

## Modules and boundaries

| Module | Implemented scope |
|---|---|
| stores | Discover both Apple accounts, reuse authorized Sales credentials, daily provenance reconciliation, Play install/listing CSVs; preserve unknown/partial status |
| ads | Google Ads full SearchStream app-ID/store mapping, native currency/timezone; full network spend remains blocked until completeness is established |
| creator | Live approved/posted content, brief/category mapping, event ledger, dated applicable-term base estimates; final cost requires snapshotted payable earnings |
| mixpanel | Weekly unique paywall/value events for clean allowlisted versions; ordered same-identity/journey raw-export funnels and mature exact-hour retention; EasySpell iOS privacy exclusion |
| revenuecat | Verified revenue/new paid subscription transactions and plan-specific mature subscription retention from Charts |
| appsflyer | Existing Keychain reporting token; exact UTC UA partners-by-date reconciled to partners totals; unknown custom media sources leave a labelled measured known-paid minimum, not a complete total |
| first-party | Deterministic linkage/privacy capability gate; no new events or approximate identity joins |
| fx | Reject unverified or mixed-currency sums; no invented FX rates |
| notion | Paginated canonical upsert, stale value clearing, read-back validation and local writer lock |
| meeting | Five-section executive report from verified Notion warehouse rows; compatible app totals, canonical comparisons and raw Feature Value Reach rankings |
| apple-analytics | Authorized existing key; complete weekly standard page-view report, all segments and latest corrected Date partition |

## Integrity

Row identity is `[week, app, metric, platform, segment]`; account is provenance only. Existing duplicates stop publication for reconciliation. A retry looks up all canonical keys before creating pages. Failed or absent current-week metrics clear previous values rather than leaving stale values marked ready. No customer/creator records are published. Rate-limit retries do not blindly retry uncertain page creation.

`READY` is definition-specific, not an endorsement of every app metric. `EARLY` means a measured or defensibly calculated value with a documented coverage/cohort/calendar limitation; it is displayed numerically. `ESTIMATE` means a documented model from real inputs. `WAITING` is reserved for no defensible value. Apple Pacific daily totals and RevenueCat UTC chart days cannot be exactly rebucketed into Istanbul; such values cannot silently enter CPI/WoW. Money arithmetic requires verified currency and explicit coverage. Business UGC requires defensible delivery attribution and reconciled final payable amount/currency. Mapped base estimates, unresolved contract terms and bonuses cannot feed business acquisition spend/CPI; unknown network spend cannot be replaced by zero. Native calendar limitations can produce EARLY period ratios without claiming an exact cohort. Complete observed zero and unavailable null are separate states.

CPI = (media + attributable UGC) / store downloads. Paid Media CPI = media / AppsFlyer paid installs. UGC is recognized once in the actual postedAt delivery week, with later bonus true-ups to that week; payment settlement and monthly earning totals are not added again. No arbitrary allocation to OS or monthly/4 calculation.

Mixpanel uses one 7-day unique bucket, never the sum of daily uniques. Its current API response may include six zero-filled daily labels after the aggregate; the collector accepts only that verified response shape. Notes counts the canonical value event with `note_status=completed`, not list clicks; Library requires content readiness. Queries are bounded to one request at a time per project. No iOS EasySpell unique product queries are made.

The weekly refresh revisits six prior non-FINAL report weeks for weekly/monthly maturity and non-FINAL weeks aged 51–56 weeks for annual maturity. FINAL weeks are protected; other unfinished historical cohorts can be refreshed explicitly by week. No annual cohort is assumed mature based only on its presence.

## Operations

Outputs: `docs/weekly-app-growth/YYYY-MM-DD.local.json`, corresponding publication evidence, and a local registry fingerprint. The sink's `Latest Week` field means the latest completed reporting week, not the current incomplete calendar week. Views are configured in Notion and do not change the original historical database.

If a run is terminated abruptly, inspect the PID in `.growth-scorecard.local.json.lock` and confirm no writer is running before removing that lock. Do not run collectors concurrently from different machines: the lock is local, and Notion has no unique constraint on Row Key.

The old `store-downloads-to-notion.mjs` keeps its CLI behavior; it only adds an import-safe entry point and exports existing auth/CSV functions. Do not enable or replace the old paused automation as part of this job.

Backlog: recipient Play GCS report access propagation/export availability + AŞ vendor, complete media account/app mapping, finalized UGC contracts/bonuses, Ozard custom AppsFlyer media-source classification, automatic official Console readback where GCS/Analytics API access is unavailable; tester/public coverage confidence. Campaign/source reporting, creatives, creator ROAS, D14/D30, ARPU/ARPPU, LTV, ROAS, CAC and cross-source attribution remain out of scope.

## Freshness and reconciliation (2026-09-14)

The active heartbeat runs Monday 21:30 Europe/Istanbul, with Wednesday and Friday 21:30 reconciliation. Monday 10:30 is too early for the Apple Pacific week: it is Monday 00:30 PDT or Sunday 23:30 PST. Apple daily Sales reports generally become available at 08:00 Pacific; the collector withholds weekly values until Monday 10:00 Pacific and all seven daily reports, including Sunday, are available. It never publishes a partial week as finalized. Native-calendar values remain EARLY until a compatible business calendar is explicitly established.

Apple Analytics is separate from Sales: the existing LLC environment key can read/manage Analytics, while the older viberboyz key returns 403 for Analytics. Both see the same LLC app inventory; AŞ is a different owner for Otto, not the cause of the priority-app error. Authorized ONGOING and ONE_TIME_SNAPSHOT requests were created for Ozard and EasySpell. Analytics daily discovery data can take three days to become complete; complete weekly reports arrive Friday. The adapter prefers a single complete weekly standard report, replaces corrected date partitions, and never sums duplicated requests. Product-page CVR stays WAITING until its acquisition numerator and population are verified.

Google Play priority packages are verified in current KantLabs developer account 5692533430791809099 and the console-copied bucket pubsite_prod_5692533430791809099. The existing service account was granted only account-level read-only app/bulk-report permission (plus the UI-required read-only quality permission). No release/admin/financial permission was added. GCS still denied access in the immediate read-back; the runtime retries on scheduled runs. Legacy zero/stale files cannot substitute for current-account complete exports. Exact package identity is required. As of the 2026-09-15 completion revision, official current Console measurements can be published EARLY for explicitly listed observed days; seven days are still required for a complete CPI denominator.

Creator attribution now requires an audited immutable category ID, preserved explicit material/site link, and canonical Apple/package identities. Name aliases, priority text, title inference, and the former Ozard title override were removed. Two EasySpell approved-posted submissions were audited through their exact brief/category links and official store links; submitted video frames also show spelling practice/story screens. Missing final earning snapshots block business UGC and CPI; mapped base values remain diagnostic only. Base accrued estimates use terms demonstrably created and last updated before delivery; unobserved view bonuses remain excluded, not verified zero.

The Meeting Scorecard is updated in place only for the latest completed week, from Notion read-back rows. Actual cost estimates and network-specific spend/paid-CPI components are shown compactly; provider diagnostics stay in warehouse Notes. Feature summary Notes contain only the derivation rule; the ranking lives as a generated presentation of raw Feature Value Reach. Its table and the warehouse both have read-back checks.

References: [Sales report availability](https://developer.apple.com/help/app-store-connect/reference/reporting/sales-and-trends-reports-availability), [Discovery report availability](https://developer.apple.com/documentation/analytics-reports/app-store-discovery-and-engagement), [Correction replacement rules](https://developer.apple.com/documentation/analytics-reports/data-completeness-corrections), [AppsFlyer partners daily](https://dev.appsflyer.com/hc/reference/get_app-id-partners-by-date-report-v5-1).

## Executive presentation (2026-09-15)

`node scripts/weekly-app-meeting.mjs --publish` refreshes Meeting Scorecard and creates missing FINAL weekly projection pages from the warehouse; presentation-only runs cannot finalize weeks. It never invokes provider collectors or the canonical warehouse publisher. Its write boundary permits presentation blocks and the weekly projection page creation/lock only; warehouse rows are not write targets. Before/after fingerprints verify all warehouse rows and historical download rows are unchanged; a second render must perform zero writes.

The page has four visible sections: Executive Summary, Acquisition, Monetization, and Retention & Usage. Data quality, four-week trends, country breakdown and technical explanations are expandable. Executive Summary contains nine existing KPIs grouped into the three pillars. Missing values render as an em dash; statuses and limitations remain in the warehouse and are summarized at the bottom. Paid Media CPI and native platform Store CVR are visible Acquisition KPIs. Media components, mapped UGC base diagnostics and Other Apps — Acquisition remain expandable details.

Only complete available platform pairs with matching week, counting unit, currency, calendar and source provenance can produce a displayed app sum for existing additive download, verified transaction or revenue measures. Partial values retain their platform label. Ratios and feature populations are not averaged or merged. Comparisons are derived from adjacent canonical week rows only after definition, completeness, maturity, population, cohort age, currency and source-calendar checks. Existing Notes carry a compact reporting-semantics record; no warehouse columns or independent values are added. A zero previous value cannot produce a percentage. Feature ranking uses the raw ratios separately by platform, never summary Notes. Generated reconciliation evidence lists the canonical source page IDs behind each displayed KPI.

This presentation revision does not change collection, canonical formulas, statuses, event instrumentation, privacy settings, or database structure.


## Data completion revision (2026-09-15)

This revision keeps the database, scheduled cadence, event definitions and five-section report. It supersedes earlier strict null gates described in the dated V1 audit above.

- Ozard raw export uses an existing project API secret securely held in Keychain; the service account lacked export permission. Raw identities/events stay transient in memory. Only aggregates persist. Funnels require same distinct identity, exact paywall_view_id and chronological order; purchase attempts must agree where both exist. Client ack is never a verified purchase. D1/D7 use fully observed [24,48)/[168,192) hours from clean first open, with a one-hour ingestion buffer. Missing or immature denominators remain null.
- WAU, core-value reach and sessions per active identity use existing canonical events. Six raw Feature Value Reach rows supply each Ozard ranking. EasySpell Android uses verified activity_v1 completion on allowlisted releases, with a small-sample and unverified-project-calendar caveat. EasySpell iOS Mixpanel remains disabled.
- Mature subscription cohorts are separate canonical segments in the latest report: W1 starts one week earlier, W2 two weeks earlier, M1 five weeks earlier and M2 ten weeks earlier. Provider incomplete flags still veto immature observations; zero eligible subscriptions is N/A.
- Current Apple account ownership changed during September 15. Both priority apps are now visible in the AŞ Console. Official UTC daily Analytics fallback reconciles all seven days (Ozard first downloads 1494, EasySpell 195; page views 2610 / 322). Former Ozard 1523 was a Pacific Sales-window value and is not silently equated with 1494. Existing source credentials and historical sales history remain intact. Apple API access/report readiness remains a separate automation blocker.
- Current Play owner/package and current September export objects are confirmed. Both current service-account and legacy credential GCS paths were tried; current object reads still return 403. Official Console Statistics provides observed current days: Ozard new devices 3017 (Sep 7–12), EasySpell 28 (Sep 10–12). Listing metrics have different availability: Ozard 4099 visitors / 2250 acquisitions (Sep 7–10); EasySpell 29 visitors (Sep 7–10), with only Sep 10 containing both measures (3/16 CVR). Missing days are unknown, not zero. UI evidence is keyed to exact week and app identity and never reused for another week; later successful exports take precedence.
- UGC accrued bases: Ozard 2×(100 TRY/12)+167 TRY/20 = 25.0166667 TRY; EasySpell 2×(300 TRY/10)=60 TRY. Terms predate deliveries. Bonuses and finalized payout remain unresolved. No FX/OS allocation is invented.
- Google Ads direct-app costs are measured; other possible media coverage is explicitly unknown. Shared Kant website campaigns cannot be assigned by name/domain similarity. Meta OAuth business mismatch, TikTok unbound paid creatives + advertiser-info scope, AppLovin reporting credential, and Apple Ads campaign readback remain unresolved. Component paid CPI is a labelled native-calendar period ratio; incomplete media never feeds canonical total CPI.
- Same-snapshot warehouse replay and report rerender must be no-ops. The original historical downloads database is never a write target.

## 2026-09-15 acquisition reconciliation sprint

The accepted architecture, schedules, formulas, metric definitions and renewal calculations remain unchanged. The latest week remains September 7–13. This update supersedes the earlier acquisition blocker notes above.

- Ozard Meta Ads Manager custom-week readback: TRY 7,882.86 (iOS 4,725.64; Android 994.03; explicitly attributed Ozard website 2,163.19). Exact application configuration, Google Play destination and website/paid UTM identity were checked. Other Meta account coverage is unclosed; this is a component, not full spend.
- Google: direct Ozard app-campaign spend is absent, but AppsFlyer attributes 1 iOS / 15 Android installs to coaching website campaigns (Brand, PMAX, Demand Gen, YKS Core). Their mixed-product cost share cannot be allocated deterministically; Ozard Google component remains UNKNOWN, not zero and not all coaching spend. EasySpell app campaigns remain TRY 1,960.011153.
- TikTok: all 471 ad-day rows (43 positive ads) reconcile to the provider account spend. Legacy Smart+ campaign readback resolves blank per-ad destinations to coaching. Ozard and EasySpell zero is verified for the audited advertiser/provider dates. Currency/timezone info scope is still unavailable; no currency conversion is inferred from zero.
- Existing Meta system user received only performance-view permission for the Ozard account. Correct-business existing Ozard app supports ads_read, but token issuance requires account-owner SMS verification. No new token, ad mutation, or message was sent.
- AppLovin advertiser login/reporting key is unavailable. Apple Ads account 20275390 campaign reporting requires account@kantlabs.co reauthentication. AppsFlyer custom website has Campaign=None; raw report access is blocked by subscription entitlement. Existing paid web UTM proves website must not automatically be classified as owned.
- Current Play bucket and packages are verified. The current service account already has global view-app/bulk-report permission; both list and exact-object reads still return storage permission 403. Request repair/resynchronization of Play-managed report bucket access. Existing partial day values remain partial.
- Latest posted week: Ozard 24 deliveries / TRY 161.70 accrued base estimate; EasySpell 2 / TRY 60; Studybud 2 / TRY 10; Otto 1 / TRY 5; zero unmapped. View bonuses and final earnings remain unsettled. A reused social URL between distinct approved Studybud/Ozard videos remains a source-link correction; production is counted once per distinct delivery.
- Full archive audit: 1,143 approved+posted records; Ozard 741, EasySpell 10, other apps 297, coaching service 67, unresolved 28 (24 shared-app cost allocations, 4 insufficient/missing source). Historical costs and databases were not rewritten. Dated private audits preserve delivery-level evidence. Legacy category mappings are pinned by reviewed brief content fingerprint and canonical store identity; generic or changed briefs fail closed.
- Meeting renewal row labels now include actual mature start cohorts: W1 Aug 31, W2 Aug 24, M1 Aug 3, M2 Jun 29. Values/calculations unchanged.

Full media, acquisition total and CPI remain WAITING; no partial spend or missing Android days were promoted to full-week totals.


## Reporting semantics and weekly history (2026-09-15)

This revision supersedes earlier statements permitting base-only UGC inside business CPI.

- Old Ozard 25.0166667 was a model over only three mapped deliveries, never the weekly total. The current 29-delivery posting week is deterministically mapped (Ozard 24, EasySpell 2, Studybud 2, Otto 1). Model-only bases remain 161.70 / 60 / 10 / 5 in the source TRY field. API payout writes hardcode TRY while earnings history renders USD; the admin labels payout per content while the user-data calculator divides payout by monthly quota. Dated terms alone do not resolve this contract/currency conflict. No finalized earnings exist for these deliveries and view bonuses remain unobserved. Business UGC is null/WAITING; mapped model amounts remain explicitly incomplete diagnostics. No FX or alternative contract formula is guessed.
- Apple Store CVR reads the official Analytics **Weeks** row for exactly the app and completed UTC week, not the daily-average total. September 7–13: Ozard 31.05%, EasySpell 4.94%. Apple defines (Total Downloads + pre-orders) / unique-device impressions; total downloads includes redownloads. This is not Product Page Views or first downloads / page views. Current week-keyed provider readbacks expire for a different week. Android retains listing acquisitions / listing visitors from matching dates/population; incomplete days are visible as partial and excluded from trends. No cross-platform CVR is formed.
- Ozard Checkout → Client Ack uses existing ordered canonical journey counts, matching identity, view ID, source, week, viewer denominator and observation cutoff: iOS 28/90 and Android 11/372. No instrumentation is added; acknowledgements remain distinct from verified RevenueCat purchases. Purchase/download remains a same-calendar, complete-period transaction/download proxy, never a same-user funnel.
- Historical Weekly Reports is a set of locked Notion page projections, not another database. Each completed warehouse week gets one deterministic ISO-week title, rendered from the warehouse plus all canonical values, statuses and caveats in collapsed source appendices. Creation is atomic and read back before locking. Existing projections are never rewritten, including after later warehouse corrections. The main page remains the current corrected latest completed week; Past Weeks links the preserved as-of reports. A same-name page without the projection marker fails closed. Only actual warehouse weeks are created; no history is fabricated from the legacy downloads database.
- Rolling four calendar weeks cover Downloads, Store CVR, CPI, Paid Media CPI; Paywall Reach, Paywall → Checkout, Paywall → Client Ack, New Purchases, Revenue; D1, D7, Core Value Reach and W1 Renewal. Comparisons require the same definition, platform, unit, currency, calendar, source, population and relative mature cohort age/plan. Partial or immature observations and missing-definition legacy rows are withheld. Rates use pp; quantities/money use percentage change. Missing weeks are not bridged for WoW. September 7 is the only warehouse week currently present, so no trend is claimed yet.
- Validation: focused journey, UGC gating, provider-window, comparison, long-caveat round-trip and immutable-history tests; live warehouse/page reconciliation plus a no-op rerun. The original historical downloads database remains unchanged.

Definitions: [Apple metrics](https://developer.apple.com/help/app-store-connect-analytics/reference/metrics-definitions), [Play export schema](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en).
