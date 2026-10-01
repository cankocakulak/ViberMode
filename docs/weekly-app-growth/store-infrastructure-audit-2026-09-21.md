# Store infrastructure audit — 2026-09-21

This is a read-only provider/warehouse audit plus bounded collector fixes. No canonical rows, Meeting Scorecard blocks, historical downloads, FINAL manifests, snapshots, production secrets, provider permissions or report requests were changed. The late-data policy below is a **proposal, not enabled behavior**.

## 1. Current FINAL behavior

`weekly-app-growth-refresh.mjs` attempts saved report weeks at offsets 1–6 and 51–56 before the latest completed week. This is not a scan of the last four FINAL weeks. `weekly-app-growth.mjs` exits before all collectors when the requested week is FINAL. The Notion publisher also checks the FINAL canonical manifest rather than upserting replacements. Existing verified snapshot pages are not rebuilt; canonical fingerprint drift is rejected.

Executed `node scripts/weekly-app-growth.mjs --week 2026-09-07`: `status=FINAL, skippedCollectors=true`. Therefore PARTIAL, WAITING, late days, corrected spend and other provider revisions are all frozen unless an explicit correction workflow is used. The previous manual W37 corrections have evidence, but there is no automatic late-data correction journal/workflow.

The existing Monday/Wednesday/Friday 21:30 Istanbul schedule remains. Normal finalization requires two distinct successful full-collector receipts and a successful reconciliation whose start is at/after the Friday cutoff. FINAL means the scheduled reconciliation is closed; it does not mean every provider row is complete.

## 2. W37 concrete result

The warehouse has 871 rows. Its W37 canonical fingerprint matches the FINAL manifest; the archive is VERIFIED (`3dc2cad5-82de-8155-8c2b-c4a0062006b0`). W38 is OPEN.

EasySpell Android downloads remain **36, Sep 10–13, 4/7**. They will not automatically become 6/7 or 7/7 under current code. No new complete download denominator was found in GCS. Current week-keyed UI evidence cannot be used for a different historical week.

After the CSV header fix, read-only W37 listing collection finds complete source data:

| App | Visitors | Listing acquisitions | CVR | Dates |
|---|---:|---:|---:|---|
| Ozard | 6,971 | 4,071 | 58.3991% | Sep 7–13, 7/7 |
| EasySpell | 170 | 35 | 20.5882% | Sep 7–13, 7/7 |

These are audit candidates, **not published warehouse replacements**. Existing rows use Console Statistics readback, while these candidates use GCS store-performance exports. Source/calendar/population equivalence must be established before historical substitution. Ozard's overlapping Sep 7–11 acquisitions also changed from 3,018 to 3,030 (+12), so this is not solely additional previously missing dates. EasySpell's GCS Sep 7–9 acquisitions are explicit zeros; the previous UI evidence omitted those dates. The reason for that UI omission is not proven.

## 3. Proposed minimal late-data correction policy

1. Collect the latest completed OPEN/RECONCILING week normally. Discover the most recent four FINAL reporting weeks from lifecycle records, not from fixed offset assumptions.
2. Retry only existing rows with PARTIAL notes, WAITING status or incomplete provider coverage. Do not run all unrelated collectors or overwrite complete rows.
3. Require unchanged canonical row identity, definition/version, provider/report, source account/app mapping, platform, population, calendar, unit/currency and attribution logic. A UI-to-API substitution is not automatically equivalent merely because the provider is the same.
4. Require strictly increased observed-date coverage and evidence that previously observed date partitions are unchanged. For ratios, numerator and denominator must use identical date sets. Missing dates are never zero-filled or extrapolated. For WAITING rows without old daily partitions, require a previously recorded compatible source contract; otherwise manual review.
5. If old partitions were revised, semantics are missing, source/population changes, attribution changes or inference is needed, record a review candidate and leave FINAL canonical data untouched. The Ozard +12 overlap revision follows this path.
6. Under the existing single-writer lock, create a durable correction journal containing correction ID, reason `late_provider_dates`, old/new values/status/coverage, source evidence paths and hashes, collection time, unchanged semantic signature, old manifest and snapshot fingerprint. Preserve old raw evidence and snapshot export before replacement.
7. Check the canonical before-fingerprint, patch only eligible rows, recompute only existing dependent metrics with unchanged formulas, read back and verify the new canonical fingerprint. Mark any intermediate correction as pending; a failed rebuild must never claim a verified FINAL archive.
8. Rebuild/relock the same presentation snapshot from canonical rows; record the new manifest and snapshot fingerprints, then mark the journal committed. Use an idempotency key derived from week, row key and source partition hash so reruns perform no duplicate writes. Recovery resumes a pending journal rather than starting another correction.
9. Weeks outside the last four FINAL weeks and all definition/population/attribution/source-contract changes retain the explicit manual correction path.

This proposal deliberately leaves current FINAL guards intact until that transaction/evidence path exists. It does not turn FINAL into unrestricted recollection.

## 4. Apple current and old identities

| Profile | Organization / team | Issuer | Key ID | Existing secret reference |
|---|---|---|---|---|
| `kantlabs` | KANT LABS EGITIM TEKNOLOJILERI ANONIM SIRKETI / `2H8TC56G64` | `1814f6cc-9f8d-446e-9d85-652ec8bfe09e` | `4G4VNQZ45V` | Keychain `kantlabs-asc-api-key-p8-b64`; identifier items `kantlabs-asc-key-id`, `kantlabs-asc-issuer-id` |
| `env` | Kant LLC / `QVDHG3AF29` | `5daff8c5-0bc7-4d3a-8ae2-70e01f465bb7` | `T5AUCVFNYD` | `.vibermode-automation.env`: `ASC_API_KEY_P8_B64`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_VENDOR_NUMBERS` |
| `viberboyz` | Kant LLC / `QVDHG3AF29` | same LLC issuer | `GW2A29XV4G` | Keychain `viberboyz-asc-api-key-p8-b64` |

Runtime account mapping is in `.growth-scorecard.local.json`; account routing uses the live app inventory. The secondary configured environment file has no overriding Apple/Play credential entries. No private-key material is included in audit artifacts.

Both priority apps currently belong to AŞ: Ozard Apple ID `6753729850`, bundle `com.kantakademi.sorucozucu`; EasySpell `6762075035`, bundle `co.kantlabs.easyspell`. The AŞ key returns HTTP 200 for both app resources. Both LLC keys return 404 for those app resources. Earlier successful LLC report provisioning plus current inventories support the ownership change; the exact transfer timestamp was not independently verified.

LLC references remain in the registry, historical Sales profiles, the existing environment file and legacy downloads collector for historical reporting/remaining LLC apps. They must not be globally replaced. An older temporary `apple-env-audit.mjs` labels the owner AŞ while resolving the LLC environment key; that label is not proof of key ownership.

## 5. Apple 403 cause

Authenticated AŞ Users and Access → Integrations → Team Keys shows one active key, **Kant Labs Codex / 4G4VNQZ45V / App Manager**. It is the correct organization and has app access, but its role does not authorize reporting.

| Probe | AŞ `4G4VNQZ45V` | LLC reporting `T5AUCVFNYD` |
|---|---|---|
| `/v1/apps` | 200; Ozard/EasySpell present | 200; priority apps absent |
| `/v1/apps/{Ozard or EasySpell}` | 200 | 404 |
| `/v1/apps/{id}/analyticsReportRequests?limit=200` | 403 for both priority apps | 403 for transferred priority apps; 200 for still-owned Studybud |
| `/v1/salesReports`, own vendor | 403 with verified AŞ vendor `94737364` | 200 with LLC vendor `93359493` |

The AŞ reporting response is `FORBIDDEN_ERROR: The API key in use does not allow this request`. Correct-vendor tests on Sep 13 and Sep 19 both return 403. An initial wrong-vendor AŞ probe returned 500; that is not the root-cause evidence. The older `viberboyz` key also returns Analytics 403 for a still-owned LLC app, whereas the separate LLC reporting key succeeds.

**Conclusion: current AŞ failure is insufficient key role, not current-app ownership mismatch or missing app access.** A report request cannot fix an authorization failure occurring before the request list is readable. Whether a current-AŞ request exists remains unverified until an authorized key can list it. Old LLC ONGOING/SNAPSHOT request IDs are not proof of current-account provisioning.

Apple documents Analytics access for Admin, Sales and Reports, or Finance roles: [Analytics Reports](https://developer.apple.com/documentation/analytics-reports). A dedicated AŞ **Sales and Reports** team key is the narrow reporting role to provision. Keep the existing App Manager/deployment key intact. Reuse the AŞ issuer; a new reporting Key ID and `.p8` are required unless an already-authorized reporting key is supplied. Store it in the existing secure mechanism and configure the reporting profile. Then list requests and provision ONGOING/appropriate historical request only if absent. No key or request was created by this audit.

## 6. Apple source hierarchy

| Existing metric | First attempt | Current priority-app source / remaining gap |
|---|---|---|
| Store Downloads / first downloads | Sales API across required historical/current owners | Dated authenticated UI daily readback; current AŞ reporting 403 |
| Product Page Views | Current-owner Analytics Reports API | Dated UI daily readback; API 403 |
| Native CVR | UI adapter only | UI readback; no native-CVR API adapter implemented |
| Unique Impressions, Total Downloads, Unique PPV | UI adapter only | UI discovery readback; no API adapter implemented |
| Store country breakdown | UI adapter only | Dated UI country evidence |

API → UI → PARTIAL/WAITING is implemented for first downloads and PPV, not universally for discovery/native-CVR/country rows. The fallback is **saved, dated authenticated UI evidence**, not an unattended browser login/read on each scheduled run. Wrong-week files are rejected. Files overwritten by W38 cannot recover W37 evidence; a late-data workflow needs dated retained partitions.

Current W38 priority-app first downloads/PPV are UI 6/7; native CVR/discovery lack compatible complete coverage. No priority-app Apple acquisition metric is currently supplied by a successful AŞ reporting API. The old LLC Sales API still works for its own account. Do not merge Pacific Sales dates with UTC Analytics readbacks to manufacture coverage.

## 7. Google account/export audit

| | Current KantLabs | Legacy account |
|---|---|---|
| Developer ID | `5692533430791809099` | `9210604055058434471` |
| Bucket | `pubsite_prod_5692533430791809099` | `pubsite_prod_9210604055058434471` |
| Service account | `play-publisher@kant-labs-play-publisher.iam.gserviceaccount.com` | `eas-submit-tercih-sihirbazi@kant-akademi-play-publisher.iam.gserviceaccount.com` |
| Cloud project | `kant-labs-play-publisher` | `kant-akademi-play-publisher` |
| Secret reference | Keychain `viberboyz-google-play-service-account-json-b64-kant-labs` | `GOOGLE_PLAY_SERVICE_ACCOUNT_PATH` → `/Users/mcan/ViberMode/kant-akademi-play-publisher-29292eb7594a.json` |

Priority packages match current canonical registry and Console identities. Current service account is active with account-wide **View app information and download bulk reports (read-only)**, plus inherited read-only quality access. Its explicit app list does not need to repeat every app when global read access is granted. No admin/release/financial access is needed for these statistics exports.

Current-account token, `devstorage.read_only` scope: bucket listing 200, Ozard install object 200, both listing objects 200. Legacy token also reads its own bucket. Cross-account combinations return 403, as expected. **The current collector's earlier blanket GCS403 diagnosis is stale. No additional SA or permission grant is presently justified.**

Full paginated inventories: current 128 objects; legacy 1,214. Current Ozard September install export was last updated Sep 13 and contains dates only through Sep 8. Current EasySpell September install export is absent (404 and absent from the complete listing). Both current listing exports were updated Sep 21 and contain dates through Sep 14. Legacy EasySpell installs also stop Sep 8; legacy Ozard September installs are absent. Legacy listing dates stop Sep 10 for EasySpell and Sep 6 for Ozard. Old exports do not close current gaps.

Google documents daily bulk reports commonly appearing after 3–7 days, with no fixed update guarantee: [Download reports](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en). Current listing lag is compatible with that delay. The much older installs cutoff and missing EasySpell object need export investigation; bucket permissions already succeed. [Account-wide read access](https://support.google.com/googleplay/android-developer/answer/9844686?hl=en-GB) applies to new apps as well.

## 8. Every current PARTIAL priority-app global store row

This table covers all 15 current PARTIAL global store rows (five W37, ten W38). These labels are audit diagnoses, not new warehouse statuses. Where the direct cause of a UI omission is unproven, UNKNOWN is intentional; an export defect is recorded separately rather than pretending it explains the UI.

| Week / app / metric | Canonical observed dates and value | Classification / evidence |
|---|---|---|
| W37 EasySpell Android Downloads | Sep 10–13, 4/7, 36 | **UNKNOWN** for omitted UI dates; **EXPORT CONFIGURATION ISSUE** blocks automated recovery: current install object missing. Underlying export-generation reason not proven. |
| W37 EasySpell Android visitors | Sep 7–11, 5/7, 79 | **PROVIDER_DELAY** consistent with missing tail now present in GCS; FINAL prevents reconciliation. UI→GCS equivalence still needs review. |
| W37 EasySpell Android CVR | Sep 10–11, 2/7, 15/66 | **UNKNOWN** for UI omission of earlier days; GCS now has explicit zeros Sep 7–9 and complete tail. No evidence of suppression. |
| W37 Ozard Android visitors | Sep 7–11, 5/7, 5,366 | **PROVIDER_DELAY** consistent with missing tail now available. |
| W37 Ozard Android CVR | Sep 7–11, 5/7, 3,018/5,366 | **PROVIDER_DELAY** for missing tail; **UNKNOWN** cause of +12 acquisition revision on previously observed days. Manual review required. |
| W38 Ozard iOS Downloads | Sep 14–19, 6/7, 1,241 | **PROVIDER_DELAY** is consistent with Sunday not yet in dated UI readback; API separately blocked by role. |
| W38 Ozard iOS PPV | Sep 14–19, 6/7, 2,873 | Same **PROVIDER_DELAY** diagnosis; not proof Sunday will appear on a particular run. |
| W38 EasySpell iOS Downloads | Sep 14–19, 6/7, 170 | Same **PROVIDER_DELAY** diagnosis; API role remains a separate blocker. |
| W38 EasySpell iOS PPV | Sep 14–19, 6/7, 390 | Same **PROVIDER_DELAY** diagnosis. |
| W38 Ozard Android Downloads | Sep 14, 1/7, 556 | **UNKNOWN** for UI readback cutoff; **EXPORT CONFIGURATION ISSUE** for stalled current GCS installs (last source date Sep 8). |
| W38 EasySpell Android Downloads | Sep 14, 1/7, 8 | **UNKNOWN** for UI readback cutoff; **EXPORT CONFIGURATION ISSUE** for absent current GCS install object. |
| W38 Ozard Android visitors | Sep 14–16, 3/7, 1,907 | **PROVIDER_DELAY**, consistent with documented lag; GCS currently only through Sep 14. |
| W38 Ozard Android CVR | Sep 14–16, 3/7, 1,409/1,907 | **PROVIDER_DELAY**, aligned observed numerator/denominator dates. |
| W38 EasySpell Android visitors | Sep 14–16, 3/7, 117 | **PROVIDER_DELAY**, consistent with documented lag. |
| W38 EasySpell Android CVR | Sep 14–16, 3/7, 20/117 | **PROVIDER_DELAY**, aligned observed numerator/denominator dates. |

Separately, both Apple Analytics403 failures are **ACCESS / CREDENTIAL ISSUE**, proven role mismatch. Native Apple CVR W38 is unavailable rather than PARTIAL; its compatible UI coverage is not yet established. No missing-day case was proven to be SOURCE SUPPRESSION. Provider-delay classifications describe the supported diagnosis, not a guaranteed automatic healing mechanism: FINAL guards and saved UI evidence still prevent that.

## 9. Exact remaining manual actions

1. AŞ account administrator: supply/create a dedicated Sales and Reports team key under issuer `1814f6cc-9f8d-446e-9d85-652ec8bfe09e`; retain the existing App Manager key. Securely store new Key ID/private key, route reporting auth to it, verify Sales with vendor `94737364` and both Analytics request lists. Initialize reports only if an authorized list confirms they are absent.
2. Play account owner/support: investigate current bucket `pubsite_prod_5692533430791809099` generation for `stats/installs/installs_com.kantakademi.sorucozucu_202609_country.csv` (stopped Sep 8) and `stats/installs/installs_co.kantlabs.easyspell_202609_country.csv` (absent). Verify post-transfer install-report generation and request repair/backfill. Existing GCS read access already works; do not regrant permissions as a speculative fix. We cannot name a proven Console toggle that will regenerate these files.
3. Historical correction review: establish UI/GCS definition/calendar equivalence and resolve Ozard's +12 overlapping-day revision before applying W37 candidates. EasySpell's device-download row still has no complete candidate. Implement the journaled late-data proposal before enabling scheduled FINAL corrections.

## 10. Safe changes and verification

- `.growth-scorecard.local.json`: populated AŞ vendor `94737364` from authenticated Payments UI. No auth/secret/role changed. Correct vendor still returns 403 with App Manager key.
- `stores.mjs`: accept official CSV `Package name` and `Country / region` headers alongside existing aliases; reject conflicting identity, duplicate partitions and incomplete coverage. Previously the wrong header casing blocked valid rows and missing country identity caused false duplicate detection. Preserve missing days and zeros as distinct. Include observed-date coverage metadata.
- Console fallback diagnostics now report the actual current GCS attempt instead of a hardcoded historical 403.
- `apple-analytics.mjs`: WAITING notes distinguish active, inactive and absent requests; no longer claim the read-only collector generated a request.
- Five focused regression tests cover real header aliases, multi-country partitions, identity conflicts, duplicates and partial/stale dates. Full weekly suite: **84 passed, 0 failed**. Live read-only collector verification confirms W37 listing candidates and preserves W38 partial fallback values. Existing FINAL skip was executed; canonical FINAL manifest remains matching.

Private local evidence: `tmp/store-infra-audit/{provider-probe,google-exports,details,collector-check,canonical}.local.json`, test output and before-edit backups. Evidence contains identifiers and aggregate values, not tokens/private keys. These ignored operational files are not production secrets. No publication or immutable-history repair was run during this audit.
