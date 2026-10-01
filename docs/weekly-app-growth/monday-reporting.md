# Monday preliminary reporting

Effective 2026-09-28, authorized for the Monday 17:00–18:00 meeting.

- Initial collection: Monday 09:30 Europe/Istanbul.
- Reconciliation: Wednesday and Friday 21:30. Friday FINAL gate unchanged.
- The existing heartbeat uses two recurrence rules for these three times.
- The report remains OPEN/preliminary until its existing finalization requirements pass.

## Source decisions

| Reading | Monday source | Reconciliation rule |
|---|---|---|
| Total acquisition installs | AppsFlyer classic UA aggregate, organic plus every attributed/custom source | Daily sums must match full-week partner total; first SDK launch, not store downloads; never add overlapping SKAN counts |
| Paid installs / network paid CPI | Existing AppsFlyer network rows plus direct ad-network cost | Same app/platform/network; native-calendar period diagnostics remain labelled; incomplete coverage never becomes a total |
| Revenue and initial paid transactions | Existing RevenueCat Charts v3 collector | Already an early financial source; keep transaction definition and refunds semantics |
| Weekly activity, usage and ordered operating funnel | Existing production-filtered Mixpanel data | Full observed report-week window, unchanged identities/ordering; version coverage remains explicit |
| EasySpell iOS activity | Existing identity-free aggregate source | Event counts only, never unique-user or matched first-open funnel |
| D1/D7 and 7-day acquisition cohorts | Existing product source | Only genuinely mature members; do not accelerate maturity with a source substitution |
| Renewal | Existing RevenueCat mature-start cohorts | Same renewal calculation and cohort labels |
| Store discovery / CVR / downloads | Existing Apple and Play official sources | Explicit observed dates; never fill missing days from AppsFlyer/Mixpanel |
| Creator cost | Existing deterministic Creator Hub attribution | Base estimates stay estimates; missing final earnings/bonuses cannot feed Business CPI |

`AppsFlyer Installs` is the explicitly requested early acquisition alternative. It is a separate canonical definition (`af_total_ua_installs_v1`), not a rename or overwrite of `Store Downloads`. Only priority apps receive this row. The AppsFlyer total is not unique cross-device people. Existing paid/organic ambiguity does not invalidate a reconciled all-source total, but still blocks describing a known-paid minimum as the complete paid population.

Both the Meeting Scorecard and Sheets read these rows from the warehouse. Historical FINAL weeks are not retrofitted. Current OPEN/RECONCILING weeks acquire the row through normal fresh collection. Earlier absent cells remain blank; no false historical WoW is introduced.

AppsFlyer total, paid installs and direct-network costs remain the same metrics throughout the week's reconciliation. Store data never replaces the denominator of an already-labelled AppsFlyer rate. Business CPI keeps its existing complete-cost/store-download definition.

## Product collection reliability

The previous projection fetched every event type from the prior cohort period through the observation date. Irrelevant off-week activity could exhaust the bounded transport before the weekly report was calculated. Outside the report-week date boundary padding, the projection now retains only existing canonical cohort/retention/release-contract event families. Every event type remains included within the padded report week so no-core activity classification and weekly release coverage are unchanged. Raw precise journey events still pass identity/clock calibration. No raw identities are persisted, no new events are introduced, and the per-platform safety cap remains in place. Reconciliation date partitions are split at both edges of the padded report-week scope. A three-day partition must not cause off-week days to inherit the full-activity request; the partitions remain disjoint and cover every requested date exactly once.

## External source documentation

[AppsFlyer freshness](https://support.appsflyer.com/hc/en-us/articles/360000310629-About-data-freshness-and-timezone-support) and [aggregate API scope](https://support.appsflyer.com/hc/en-us/articles/207034346-Pull-API-aggregate-data).

[RevenueCat Charts](https://www.revenuecat.com/docs/dashboard-and-metrics/charts) already supports real-time updates on most v3 charts, using purchase data independently of product events. No alternate purchase source is needed.
