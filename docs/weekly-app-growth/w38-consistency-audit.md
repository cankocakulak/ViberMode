# W38 consistency pass — 2026-09-21

This pass changes presentation and explanatory metadata only. Collection, metric definitions, values, statuses, compatibility gates and FINAL lifecycle rules are unchanged.

## Completed W37 cohort provenance

The old `1,508 → 694 → 63 → 20` chain was **not the frozen W37 mature funnel**. It was the initial W38 canonical completed-cohort row, with acquisition dates September 7–13, a September 21 06:54:05.180 UTC observation cutoff and a 3.1.10 / iOS build ≥24 population. The frozen W37 mature subset remains `430 → 212 → 21 → 12`, with a September 15 12:53:37.899 UTC cutoff and 1,078 immature identities excluded.

The current W38 completed-cohort row uses the validated production set 3.1.10/24, 3.1.11/25 and 3.1.13/27, each only after its public-release timestamp. Its observation cutoff is September 21 09:53:04.765 UTC. It retains the same earliest-observed First Open acquisition dates, seven-day elapsed follow-up, raw identity, chronological view/attempt linkage and product acknowledgement definition. It is a separate matured result published in W38, not a correction to W37 operating metrics.

A read-only controlled replay on September 21 reproduced both canonical chains exactly. No user identifiers or event payloads were retained.

| Population / effect | First Open | Paywall | Checkout | Client Ack |
|---|---:|---:|---:|---:|
| Old 3.1.10 scope, either event-time cutoff | 1,508 | 694 | 63 | 20 |
| Added identities, first opened on 3.1.11/25 | +212 | +108 | +17 | +3 |
| Additional eligible follow-up among original identities | 0 | +18 | +5 | 0 |
| Current validated scope | 1,720 | 820 | 85 | 23 |

No original identities were removed. The 212 added First Opens all belong to production 3.1.11/25, released September 12 at 14:11:34 UTC. Removing 3.1.13/27 from the replay leaves all four counts unchanged. The later cutoff itself does not change the legacy chain; both chains were already fully mature. A live replay cannot reconstruct historical ingestion state, but it exactly reproduces the saved pre-repair and post-repair results and isolates the build-scope difference.

Aggregate replay evidence: `w38-cohort-population-audit.local.json`. The current canonical W38 row records the prior readback, expanded population, decomposition and audit evidence under its cohort population-revision metadata. The report reads the concise explanation from that metadata; it does not calculate metrics from archived page text.

## Stale explanations

Both Ozard usage captions now describe separate production identity-cluster populations. They no longer claim iOS unique-user data is missing. Cross-platform deduplication is unavailable and the existing coverage/population compatibility gate still withholds the platform sum. EasySpell retains a separate, accurate aggregate-events-versus-unique-users explanation.

The ambiguous W37 baseline paragraph is removed from the current W38 report. The completed cohort has an explicit population-revision explanation. Current priority-app Apple/GCS notes already reflected verified access and incomplete period/export availability, so no new access claim was needed. An unrelated W38 Otto Apple 403 note now explicitly describes a prior collection failure with app-specific revalidation outstanding, rather than implying a current account-wide role failure.

## Validation

The W38 canonical and rendered report reconcile to the requested iOS funnel `1,756 → 1,057 → 746 → 78 → 22`, WAU 2,717, core 1,113, repeat core 447, no-core 1,604, core reach 1,113/2,717 and D1 114/1,258. Top Markets are MX 85, UK 33 and TR 4. Reporting-week product coverage is 309,312/316,826 = 97.628351%; the report visibly labels it PARTIAL. Incompatible product WoW remains suppressed.

All 116 weekly tests pass. Remote write/readback, original W37 canonical manifest, locked archive fingerprint and zero-write rerun verification are recorded in `w38-consistency-verification.local.json`. No historical download database is accessed or written by this pass.
