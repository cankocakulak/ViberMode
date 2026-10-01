# Controlled late-provider-data corrections

Effective 2026-09-21. This implements the narrowly authorized exception to FINAL immutability. The ordinary collector, replay publisher and unrelated historical rows remain protected. No schema, metric, formula, instrumentation or reporting layout was added.

## Scheduled path

`npm run growth:weekly` recovers any interrupted correction journal, processes the latest completed OPEN week normally, then selects the newest four FINAL weeks from lifecycle records. It inspects canonical incomplete/WAITING/PARTIAL coverage and retries only applicable app/platform/store metric adapters. Existing older OPEN/cohort refreshes remain afterwards. A pending correction is recovered first only because its incomplete transaction would otherwise block the normal FINAL manifest check.

Current targeted adapters: Play device downloads/listing visitors/listing CVR, Apple first downloads/PPV. Other incomplete rows are recorded as `NO_DATE_PARTITION_ADAPTER`; no blind full historical collection. Country/unique-user/cohort metrics without a proven additive date-partition contract cannot automatically be corrected by this day-fill workflow.

`node scripts/weekly-late-data-backfill.mjs` performs read-only provider/warehouse evaluation and persists local review evidence. Add `--publish` to apply only eligible corrections; the scheduled runner already uses that flag. Both use the existing single-writer lock. Google credentials are unchanged.

## Gate and evidence

Automatic `LATE_PROVIDER_DATA` requires unchanged row identity, definition, provider/source, account, platform, country, population, source calendar, unit/currency, segment and aggregation kind. Previously observed dates and values must remain identical; at least one missing date must be added. Ratio partitions retain both numerator and denominator. Evidence totals must reconcile to the candidate value. Absent files/dates never mean zero.

Collectors now retain compact daily aggregates in existing Notes report-semantics metadata, including source references. No raw user data is stored. Older FINAL rows without daily evidence cannot retroactively be declared safe from aggregate similarity. Missing semantic metadata is a review condition.

Changed observed values, changed source/semantics or missing proof produce `PROVIDER_REVISION_REVIEW`, preserving canonical and candidate values, statuses, dates, sources and evidence. Exact changed dates are listed when old daily partitions exist. When only an old period total exists, the review records the overlap-total difference and does **not invent individual changed dates**. Explicit equivalent-source approvals may match an exact row/from/to source and approval ID in `lateData.equivalentSources`; they cannot override changed values or other semantic checks. No approvals are currently configured.

## Transaction, archive, replay

One stable correction ID is derived from the week and replacement partitions. Its private `correction-*.local.json` journal contains app/metric/platform/week, old/new row/status/coverage, source, reason, timestamp, run ID, previous manifest, previous source evidence and original archive blocks.

States: PREPARED → CANONICAL_VERIFIED → COMMITTED. Before or after an uncertain response, each target must match exactly its old or new property fingerprint; every unrelated row and row membership must match the previous manifest. Only existing page IDs are patched; rows are never created. Readback precedes manifest replacement and presentation repair. The affected archive alone is marked BUILDING, rebuilt from canonical values, labelled **Corrected after late provider data**, verified and locked. The current report is refreshed so compatible FINAL-only WoW/trends read the new canonical values. Other verified archives are not rewritten. A repeated committed correction does no writes; an interrupted one resumes from its persisted journal.

This operation does not recalculate unrelated canonical metrics or change existing formulas. Current scorecard comparison calculations read canonical values directly; stored legacy Previous Week/WoW fields remain untouched.

## W37 observed result

Live evaluation found no automatic corrections. EasySpell downloads remain 36 / Sep 10–13 / 4 days; the current install export is still absent. Four priority listing candidates require review:

| App / metric | Canonical | GCS candidate, Sep 7–13 |
|---|---|---|
| Ozard visitors | 5,366 / 5 days | 6,971 / 7 days |
| Ozard CVR | 3,018 / 5,366 | 4,071 / 6,971 |
| EasySpell visitors | 79 / 5 days | 170 / 7 days |
| EasySpell CVR | 15 / 66, 2 days | 35 / 170, 7 days |

All four change UI source to GCS and lack the old daily evidence needed for automatic replacement. Ozard also has a proven overlap-total revision: Sep 7–11 acquisitions 3,018 → 3,030. Exact changed individual dates cannot be established from the stored old aggregate. These reviews are persisted; W37 canonical rows and locked archive remain unchanged.

New native-GCS incomplete rows carrying daily evidence can automatically consume late files under these gates. Existing UI-origin W37 downloads cannot silently switch to GCS when a file eventually appears; that source migration still needs review. The same rule applies to Apple UI→API transitions.

## Verification receipt

2026-09-21: 96 weekly tests passed, including safe 4/7→7/7, provider/source/definition changes, replay and uncertain-write recovery, real snapshot renderer rebuild/relock, canonical trend refresh, OPEN isolation, separate Apple reporting credentials, API403→UI fallback and missing-GCS→PARTIAL. Swift Keychain installer typecheck passed without execution. Live publish-enabled backfill examined W37, committed zero corrections and persisted review candidates. Fresh warehouse readback: 871 rows, W37 FINAL manifest matching and archive fingerprint unchanged. New Apple reporting key is not installed; online verification with that key remains pending.
