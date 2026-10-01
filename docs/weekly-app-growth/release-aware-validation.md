# Release-aware product analytics

The existing product events, formulas, clean-baseline threshold, privacy model and warehouse identities remain unchanged. Build eligibility is discovered rather than maintained as a per-release version list.

## Read-only release discovery

* iOS: App Store Connect app/version/build relationships, release distribution state and phased-release metadata. Public App Store version-history timestamps set the earliest eligible production event time; pre-publication events on that same binary are excluded. Version creation/upload times are recorded separately and never presented as public release time.
* Android: Google Play `applications.tracks.releases.list` on the production track, matching published `activeArtifacts.versionCode` to event build codes. No edit is created or committed. Release names are not used as identity evidence.
* Previously verified production identities remain in a private release registry after provider listings omit obsolete versions. New version names alone are never production evidence.
* Explicit TestFlight/internal/debug/sandbox tags are excluded. Untagged TestFlight on an identical store-released binary cannot be distinguished with existing telemetry; this limitation remains visible and statuses remain EARLY.
* EasySpell iOS stays outside unique-user product analytics; Mixpanel remains disabled.

References: [Google release listing](https://developers.google.com/android-publisher/api-ref/rest/v3/applications.tracks.releases/list), [Google published artifact semantics](https://developers.google.com/android-publisher/api-ref/rest/v3/applications.tracks.releases).

## Contract and health checks

`release-validation.mjs` fingerprints the canonical app contract. It checks required lifecycle/funnel properties and types, session IDs, feature discriminator regressions, chronological view/attempt links, event disappearance, duplicate explosions and identity reuse. Identifiers exist only in transient process memory; persisted audit artifacts contain aggregate counts.

A previously unseen production build needs at least 30 active identities. Required string fields allow at most 2% missing or a 2 percentage point regression against the known baseline. Duplicate rate permits at most 5% or 2 points above baseline. Chronological payment linkage regressions above 20 points with sufficient counts require review. Rare/unobserved feature types are not automatically treated as zero or failure. Canonical events with sufficient expected sample cannot disappear silently.

States: `KNOWN_GOOD`, `AUTO_ACCEPTED_COMPATIBLE_BUILD`, `NEW_BUILD_REVIEW_REQUIRED`, `NON_PRODUCTION / TEST`. An insufficient sample or inaccessible release identity automatically retries on the next run; it never causes silent old-version-only reporting. Builds predating the established clean instrumentation baseline require review rather than being silently reinstated.

## Coverage and comparisons

Coverage = accepted event activity / observed non-test event activity within the reporting week. Unknown channel/build metadata remains in the denominator unless explicitly proven test. Below 90% coverage, affected product values are withheld and marked PARTIAL/WAITING. Any incomplete coverage suppresses WoW/trend comparisons. This is an activity coverage diagnostic, not a unique-person or acquisition-coverage claim.

Every row retains the exact accepted version/build set, contract fingerprint and coverage receipt. Fully covered weeks may compare across different compatible releases under the same contract, with all existing metric/platform/calendar/cohort/coverage gates retained. A legacy week without equivalent validated population evidence cannot compare to the broadened population.

## OPEN and FINAL

OPEN weeks recompute using newly accepted builds. FINAL collectors retain their frozen population; the normal publisher refuses changes to FINAL rows. Existing historical correction classification compares exact population definitions: changing a build set is a review-required population change, not automatic late-data backfill. No W37 population is broadened by the W38 correction.

The bounded Query API field projection avoids retaining large content payloads. Its clock and identities are calibrated against matching raw Export insert IDs on every Ozard run. Ordered funnel and retention events always use raw millisecond timestamps, so projection precision cannot change chronology or exact-hour maturity. Sampling, identity mismatches, a clock consensus below 99.9%, or insufficient calibration fail visibly. Timestamp outliers on matched journey events are replaced by their authoritative raw events; they never inherit the projected timestamp. The original raw Export path remains available when Query API permissions are missing. An unverified project timezone blocks a claim of complete weekly coverage.

## Presentation

Top Markets ranks all observed eligible country values rather than silently excluding higher countries for incomplete classification. Country-quality caveats appear alongside the ranking. Current W38 obsolete Apple/GCS 403 notes are refreshed separately from values. Provider availability is not evidence that missing dates are zero or complete.
