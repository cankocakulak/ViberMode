# W38 Ozard iOS release coverage repair

Reporting week: 2026-09-14 through 2026-09-20, Europe/Istanbul. Only OPEN W38 Ozard iOS product-derived rows were recomputed. Six stale W38 Apple/GCS Notes were refreshed separately. Store, RevenueCat and ad-spend values, and the W37 FINAL manifest/archive were preserved.

Meeting: https://www.notion.so/3db2cad582de8140a9bfe144923e7d48

## Cause and release evidence

The previous collector accepted 3.1.10/build 24 and silently dropped traffic that moved to newer releases. App Store Connect relationships confirm 3.1.11/build 25 and 3.1.13/build 27 as distributed releases. Public App Store version history gives exact publication timestamps:

* 3.1.10: September 6, 2026 10:28:44 UTC.
* 3.1.11: September 12, 2026 14:11:34 UTC (17:11:34 Istanbul).
* 3.1.13: September 20, 2026 07:10:31 UTC (10:10:31 Istanbul).

No phased-release resource is attached. Creation/upload time was not substituted for publication time. Source: [App Store version history](https://apps.apple.com/us/app/id6753729850), ASC version/build relationships and the current iTunes lookup.

| Production version/build | First-open identities | Active identities | Paywall identities | Checkout identities | Ack identities | Core users |
|---|---:|---:|---:|---:|---:|---:|
| 3.1.10 / 24 | 73 | 244 | 84 | 9 | 3 | 92 |
| 3.1.11 / 25 | 1,530 | 2,354 | 1,071 | 112 | 28 | 955 |
| 3.1.13 / 27, after publication | 153 | 156 | 92 | 10 | 3 | 78 |

Version populations overlap; totals are computed from the union of raw identities, not sums of these rows. The 34 pre-publication build-27 events (two active identities) and nine unpublished build-26 events (one active identity) are excluded. Untagged TestFlight activity on an already-public identical binary cannot be separated; EARLY remains appropriate.

## Contract validation

Required event names and lifecycle/funnel string properties have zero missing/type violations on the accepted builds. All canonical core-value events retain session IDs. For 3.1.11, 150/150 checkout events link chronologically to a paywall view and 28/28 acknowledgements link to checkout. One view identifier appears across two raw identities; identities remain separate and are never stitched by that identifier. Duplicate rates remain below the configured health threshold and the existing raw deduplication rule is unchanged.

A safe-field Query projection avoids retaining large content payloads. Exact funnel/retention timestamps come from Raw Export. The final run matched 50,315 event insert IDs with identical raw identities, a zero-second clock offset and no remaining timestamp outliers after matching repeated insert IDs to their correct occurrences. Sampling factor is one. No event identity is persisted in these audit artifacts.

## Canonical repair

| Metric | Previous restricted population | Corrected accepted population |
|---|---:|---:|
| Weekly First Open | 73 | 1,756 |
| Ordered Onboarding | 19 | 1,057 |
| Ordered Paywall | 12 | 746 |
| Ordered Checkout | 1 | 78 |
| Ordered Client Ack | 0 | 22 |
| WAU | 244 | 2,717 |
| Core users | 92 | 1,113 |
| Core reach | 37.70% | 40.96% |
| Repeat core users | 30 | 447 |
| No-core users | 152 | 1,604 |
| D1, mature members only | 3 / 67 | 114 / 1,258 |
| D7 | unavailable | still immature |

Strict weekly step conversions: 60.19%, 70.58%, 10.46%, 28.21%. Cumulative First Open conversion: 100%, 60.19%, 42.48%, 4.44%, 1.25%.

Feature users / WAU: Chat 675 / 24.84%; Notes 336 / 12.37%; Library 303 / 11.15%; Quiz 180 / 6.62%; Solver 170 / 6.26%; Podcast 17 / 0.63%. These overlap and are not a partition.

No-core partition: onboarding + navigation 440; onboarding + gate 254; other known non-core 238; browse/navigation 220; opened only 195; onboarding only 177; gate + navigation 79; unclassified tracked actions 1. Sum = 1,604.

The completed 7-day acquisition cohort for September 7–13 is recomputed only in its W38 follow-up row: 1,720 → 820 → 85 → 23. This does not rewrite its earlier FINAL page.

## Coverage, comparison and historical protection

Accepted population: 309,312 / 316,826 observed non-test event occurrences = 97.628%. The remaining 2.372% is older/unverified metadata coverage and is visibly PARTIAL. Unknown is not treated as zero or test. W38 product comparisons to legacy W37 are withheld; the frozen W37 population has not undergone the same validation. Fully covered future weeks may compare across compatible build changes under the same contract and existing scope/maturity gates.

A historical population-review artifact is queued in the existing late-data review directory. No FINAL canonical row or snapshot is changed automatically.

Top Markets now shows MX 85 · UK 33 · TR 4, labelled observed AppsFlyer attribution with incomplete-classification caveats. Lower NL/CA rows no longer displace larger countries because of the former completeness filter.

## Evidence and checks

* `w38-release-repair-first.local.json`: canonical read-back, before/after rows, six metadata corrections, protected-value and W37-manifest checks.
* `w38-release-repair.local.json`: same-input rerun receipt.
* `release-validation/2026-09-14-ozard.local.json`: version/build schema and coverage aggregates.
* `release-aware-validation.md`: future release discovery, acceptance, review, coverage and FINAL rules.
* 112 focused weekly tests pass, including unseen compatible/incompatible releases, test/pre-publication exclusion, coverage/WoW suppression, OPEN inclusion, FINAL review-only routing, country ordering, stale Notes, and raw timestamp/identity preservation.
