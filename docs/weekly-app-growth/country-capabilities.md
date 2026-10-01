# Country capability and interpretation audit — 2026-09-07–13

Country is a separate canonical warehouse select: two-letter territory codes (including provider Kosovo XK), GLOBAL or UNKNOWN. Segment keeps its existing feature/network/cohort meaning. Global row keys are unchanged; country rows add Country to identity. Unknown countries are retained, never redistributed. Native provider countries are not a joined acquisition cohort.

| Provider | Reliable dimensions available | Implemented / current limitation |
|---|---|---|
| Apple App Store Analytics | Store territory for impressions, views, first/total downloads and native conversion | Full-week first-download country totals and native weekly conversion read from signed-in Console. Top 5 + Rest reconciles to global downloads. Analytics API 403; dated readback expires outside this week. Country page views also collected and reconciled. No ratio averaging. |
| Google Play | Country in Statistics and export reports for device acquisitions and legacy listing visitors/acquisitions; newer listing-performance clicks have different semantics | Global dated Console fallback refreshed. GCS read 403 blocks complete automatic country exports. Android geography withheld; missing days never zero. |
| AppsFlyer | Country in geo-by-date UA installs | Country/source daily totals reconcile to partners report. Ozard custom `website`/SEO classification remains incomplete, so known-paid minimum is labelled partial. UTC install location. |
| Google Ads | Actual user country (`user_location_view`) and cost | Exact micros reconcile to every deterministic app campaign. TRY Google component only; not complete media spend. Country is actual user location, not targeting. |
| Meta | Insights country breakdown for delivery/spend | Supported provider dimension; current business/token/report-coverage blocker prevents a verified country cost publication. |
| TikTok | Country reporting is report/campaign dependent; official MMM exports support country selection. iOS SKAN geo breakdown is unavailable. | Integrated-report country compatibility and exact app/destination/timezone coverage are not verified for this collector, so no country spend published. No geography inferred from targets or SKAN totals. |
| AppLovin | Advertiser reporting country dimension | Reporting credential unavailable; no verified country spend published. |
| Apple Ads | Country/region reporting dimension | Signed-in report/API credential missing; no country cost inferred from attributed installs. |
| RevenueCat | Chart country segment, filtered app/store; production new paid transactions and revenue | Complete country response reconciles to same-response global total (USD cents). Transaction/storefront geography; cannot be assumed the same as acquisition location. |
| Ozard Mixpanel | Existing session mp_country_code; usage, ordered paywall and mature retention can be computed only with consistent geo/cohort | Usage countries partition WAU, but 2,223/2,227 iOS and all 5,604 Android identities are UNKNOWN. Only 4 iOS TR users have stable country. No country percentages published: threshold ≥100 active, ≥10 core and ≥10 non-core. Country paywall/retention suppressed until mature fixed-country cohorts and sample are verified. |
| EasySpell Android Mixpanel | Existing Android activity events | Only 6 active users. Country ratios and feature ranking suppressed. Server-side active/core identity partition verifies 1 core and 5 no-core users. |
| EasySpell iOS first-party aggregates | Identity-free daily activity/session event counts | Production App Store-channel aggregate counts surfaced separately. No reliable country or unique identities; no user reach, retention, or unique conversion fabricated. Mixpanel remains off. |

## Native conversion

- **App Store Impression → Download Conversion:** Apple native (Total Downloads + pre-orders) / unique-device impressions. Provider weekly percentage, UTC Sep 7–13. First downloads and product-page views are not substituted as numerator/denominator. Country weekly percentages are rounded by Apple; absolute unique impression denominators are not exposed in this readback.
- **Play Listing Visitor → Install Conversion:** Console Statistics → **Legacy store listing performance**, All users, daily. Listing acquisitions (new + returning users with no installed copy on any device) / listing visitors from the same population and same observed dates. This is not the new Store Listing Performance install/open/preregister button-click CTR. Daily visitor sums are not deduplicated weekly people.
- Ozard: device acquisitions 3,821 Sep 7–13; listing visitors 5,366 Sep 7–11; compatible CVR 3,018/5,366 = 56.243%, Sep 7–11.
- EasySpell: device acquisitions 36 Sep 10–13; listing visitors 79 Sep 7–11; compatible CVR 15/66 = 22.727%, Sep 10–11. Earlier missing acquisitions are unknown, not zero.

## Sources

- [Apple metric definitions](https://developer.apple.com/help/app-store-connect-analytics/reference/metrics-definitions)
- [Play conversion and reporting definitions](https://support.google.com/googleplay/android-developer/answer/9859173?hl=en)
- [Play report exports](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en)
- [Google Ads user location](https://developers.google.com/google-ads/api/fields/v25/user_location_view)
- [AppsFlyer geo-by-date](https://dev.appsflyer.com/hc/hc/reference/get_app-id-geo-by-date-report-v5-1)
- [RevenueCat charts API](https://www.revenuecat.com/docs/api-v2/charts-and-metrics)
- [Apple Ads reports](https://developer.apple.com/documentation/apple_ads/ReportingRequest)
- [AppLovin reporting API](https://support.applovin.com/en/growth/promoting-your-apps/api/reporting-api)

- [Meta official country breakdown enum](https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adsinsights.py)
- [TikTok country report exports](https://ads.tiktok.com/resources/help/article/how-to-pull-media-mix-modeling-mmm-data-in-tiktok-ads-manager?lang=en)
- [TikTok SKAN reporting limitations](https://ads.tiktok.com/resources/help/article/performance-reporting-considerations-ios14-dedicated-campaigns?lang=en)
