# Monday acquisition reporting — source assessment

Assessment only. No collector, canonical metric, schedule, FINAL week, or report was changed.

## Recommendation

Use AppsFlyer acquisition installs for the early Monday acquisition reading, direct network reports for spend, and the existing network paid-CPI diagnostics wherever their app/platform/network scope matches. Keep store downloads and native store conversion as separate measures. Mixpanel remains the product/funnel source; do not fill a missing store day with its first-open events.

Show a provisional observation timestamp and refresh the same definition during Wednesday/Friday reconciliation. Do not replace the Monday AppsFlyer denominator with store downloads later in the week. Existing Business CPI remains `(complete media + finalized attributable UGC) / store downloads`.

The currently documented Monday run is 21:30 Istanbul. A Monday daytime meeting requires a collection before that meeting; the evening run does not fulfill that requirement. No schedule was changed in this assessment.

## Observed revision evidence

Compared saved provider collections for W38 (September 14–20): September 21 at 18:39 UTC (Monday 21:39 Istanbul) and September 26 at 10:27 UTC. This is one evening-to-later observation, not evidence of Monday-morning completeness or long-term stability.

| Metric | Monday evening | Later collection |
|---|---:|---:|
| EasySpell iOS AppsFlyer paid installs | 89 | 89 |
| EasySpell Android AppsFlyer paid installs | 37 | 37 |
| Ozard iOS known-paid minimum | 124 | 124 |
| Ozard Android known-paid minimum | 17 | 17 |
| EasySpell Google iOS spend (TRY) | 2,979.036624 | 2,979.036624 |
| EasySpell Google Android spend (TRY) | 2,136.100145 | 2,122.245911 |
| EasySpell Google Android period paid CPI (TRY) | 57.732436 | 57.357998 |

The Android Google amount changed by -13.854234 TRY, approximately -0.65%. The matching install count remained 37. The period ratio carries the existing Google-account-calendar versus AppsFlyer UTC caveat. It is not a complete all-network CPI.

Evidence: `tmp/install-source-audit/monday-later-comparison.local.json`, derived from `tmp/weekly-2026-09-23/before.local.json` and `docs/weekly-app-growth/2026-09-14.local.json`. Fresh canonical readback is in `tmp/install-source-audit/warehouse.local.json`.

## Availability and limitations

- Official AppsFlyer aggregate Pull reporting includes organic and non-organic UA installs and continuous updates. Ordinary attribution freshness is listed as 15–30 minutes, with exceptions and later revisions; this is not a promise of final iOS attribution on Monday.
- The current collector uses classic UA partner reports in UTC, reconciles daily reports to the weekly partner total, and does not collect a deduplicated classic+SKAN total.
- Ozard iOS SKAN Conversion Studio was read live during this audit: SKAN 4.0 is active, configuration last updated July 9, 2026, and a conversion-value distribution is present. This proves an existing SKAN surface, not completeness for either audited week. SSOT availability and weekly classic/SKAN reconciliation remain unverified. Do not sum overlapping attribution frameworks or ad-network self-reported installs.
- Cost & Ad Revenue Status was read live: it presents the ROI360 information/contact screen, not a readable integration status table. No purchase or configuration change was made. Cost coverage through AppsFlyer is therefore not established.
- Existing aggregate Pull cost excludes retargeting and campaigns without installs. It must not become the sole source for total money spent. Prefer the current direct network collectors plus exact-week official readbacks.
- The preceding read-only API audit obtained W37 all-source totals (Ozard iOS 1,630; Android 4,384; EasySpell iOS 185; Android 33), reconciled daily to weekly. W38 retries returned `Limit reached for partners-report`. This is an API quota response, not proof of missing provider data. Aggregate UI export is a documented alternative; avoid blind repeated API retries.
- EasySpell W38 classic paid breakdown is iOS Google 27 + Apple Ads 62, Android Google 37. Apple Ads spend is still unknown in the canonical report; Google-only spend cannot be divided by all 126 paid installs.
- Ozard W38 classic paid values are minima. Unclassified sources include iOS website 6 / applovin_int 3 and Android website 9 / google_organic_seo 2. Current shared-web acquisition costs also need deterministic attribution. Stability of these minima does not establish complete paid coverage.

## Bounded adoption criteria

1. Collect once before the meeting; keep timestamped aggregate observations for reconciliation.
2. Persist and display AppsFlyer total installs only under its own definition, never as store downloads. Such publication is a follow-up change, not implemented here.
3. Use matching network/platform spend and install components for provisional paid CPI. Sum only covered, compatible components with an explicit scope; never call incomplete coverage total spend.
4. Verify iOS classic/SKAN overlap and the availability of an existing deduplicated view before describing paid totals as all paid acquisition.
5. Compare Monday and later observations over multiple weeks before claiming a typical revision percentage. The present one-week example supports feasibility, not a stability guarantee.

## Official references

- [Freshness and timezone support](https://support.appsflyer.com/hc/en-us/articles/360000310629-About-data-freshness-and-timezone-support)
- [Aggregate Pull API, including cost exclusions](https://support.appsflyer.com/hc/en-us/articles/207034346-Pull-API-aggregate-data)
- [Report quotas and aggregate UI export](https://support.appsflyer.com/hc/en-us/articles/207034366-Report-generation-quotas-rate-limitations)
- [iOS classic/SKAN comparison](https://support.appsflyer.com/hc/en-us/articles/4404976682257-iOS-metrics-in-the-Overview-dashboard-SKAN-and-AppsFlyer-metrics-side-by-side)
- [SSOT deduplication](https://support.appsflyer.com/hc/en-us/articles/4410634145425-Single-Source-of-Truth-SSOT-guide-for-iOS-attribution)
