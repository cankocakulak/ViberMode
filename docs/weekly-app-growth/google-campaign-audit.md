# Google spending campaign audit — Sep 7–13, 2026

All 10 campaigns with cost in accessible customer 7826540166 were reviewed, regardless of channel/current status. Account currency TRY; calendar Europe/Istanbul. Exact micros are retained below. Campaign names do not assign app cost.

| Campaign ID | Channel | Classification | Spend TRY | Destination / configured identity |
|---|---|---|---:|---|
| 20806680713 | SEARCH | another Kant product: coaching | 1900.366053 | https://kantakademi.com/paketler |
| 21050989819 | SEARCH | shared/unmapped | 3606.863180 | https://kantakademi.com/ |
| 21092676128 | PERFORMANCE_MAX | shared/unmapped | 4342.394431 | https://kantakademi.com/ |
| 21225216846 | SEARCH | another Kant product: coaching | 761.358956 | https://kantakademi.com/ilk-5000 |
| 21232735581 | DEMAND_GEN | another Kant product: coaching | 1145.092124 | https://kantakademi.com/paketler |
| 22496030126 | PERFORMANCE_MAX | shared/unmapped | 1062.469163 | https://kantakademi.com/ |
| 22568642868 | DISPLAY | shared/unmapped | 9.166873 | https://kantakademi.com/ |
| 24085769673 | SEARCH | shared/unmapped | 1146.007789 | https://kantakademi.com/ |
| 24087224354 | MULTI_CHANNEL | easyspell | 887.473850 | Configured app store identity 6762075035 |
| 24087606152 | MULTI_CHANNEL | easyspell | 1072.537303 | Configured app store identity co.kantlabs.easyspell |

EasySpell deterministic app-campaign spend: **1,960.011153 TRY**. Additional attributable Search/website spend in this account: **0.000000 TRY**. No omitted EasySpell Search campaign could be demonstrated within accessible scope. This is not evidence of zero Search spending in inaccessible accounts.

Other coaching product: 3,806.817133 TRY. Shared/unmapped: 10,166.901436 TRY. No deterministic Ozard-only campaign cost identified; shared website acquisitions are not allocated by AppsFlyer install proportions.

Manager 4901176544 API returned HTTP 403; its signed-in UI is obstructed by the Google Ads ad-blocker prompt. To close portfolio scope: grant the existing reporting principal read access to this manager and relevant children, or provide the official full-week campaign/destination report. No access changes were made in this sprint.

Future runs use account-scoped campaign IDs plus current destination-set fingerprints in `google-campaign-map.json`. Explicit app-store ID/package linkage takes precedence. A changed/unreviewed website destination fails closed and remains unmapped; new deterministic Search mappings can be added without changing collector architecture.

Campaign/ad-group/ad tracking templates, final URL suffixes and custom parameters were also audited (10 campaigns, 35 ad groups, 14 spending ads). Nonempty UTM suffixes identified brand, coaching competitor focus and remarketing; none deterministically identified additional EasySpell/Ozard spend.
