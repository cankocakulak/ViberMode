# Mobile Attribution AppsFlyer Setup

Operational runbook for adding AppsFlyer attribution to a Kant Akademi mobile app and wiring the related ad-network and RevenueCat surfaces.

Use this when a new app needs the same acquisition measurement setup as Ozard or Sınav Oyunları.

## Scope

This runbook covers:

- app-side AppsFlyer SDK readiness
- AppsFlyer app creation for iOS and Android
- Meta, Google Ads, and TikTok partner activation in AppsFlyer
- RevenueCat purchase/revenue forwarding into AppsFlyer
- basic validation after TestFlight or internal Android testing

It does not replace the ad operator skills for campaign reporting or campaign mutations. Use `meta-ads-operator`, `google-ads-operator`, and `tiktok-ads-operator` after attribution is wired.

## Credential Boundary

Do not commit or print:

- AppsFlyer dev keys or S2S tokens
- RevenueCat secret API keys or OAuth tokens
- Meta access tokens, app secrets, or system-user tokens
- Google Ads developer tokens, refresh tokens, client secrets, or service-account JSON
- TikTok access tokens or app secrets

It is acceptable to document non-secret app identity values such as App Store IDs, bundle IDs, package names, RevenueCat project IDs, and AppsFlyer app IDs.

## Current Known Baseline

As of 2026-07-10:

| App | AppsFlyer iOS app | AppsFlyer Android app | RevenueCat | Ad partners |
| --- | --- | --- | --- | --- |
| Ozard | `id6753729850` | `com.kantakademi.sorucozucu` | AppsFlyer integration active; entitlement `Sınav Yardımcın - Kant Akademi Pro` | Meta, Google Ads, TikTok enabled in AppsFlyer |
| Sınav Oyunları | `id6753917874` | `com.kantakademi.yks.ant` | AppsFlyer integration active; entitlement `Sınav Oyunları - Pro`; Mixpanel and webhook active | Meta, Google Ads, TikTok enabled in AppsFlyer |

Both apps have app-side RevenueCat wiring that sets the AppsFlyer ID before forwarding attribution attributes to RevenueCat.

## Setup Checklist

### 1. Collect App Identity

For each new app, collect:

- public app name
- App Store ID, for example `id1234567890`
- iOS bundle ID
- Android package name
- RevenueCat project ID
- RevenueCat iOS and Android app IDs
- RevenueCat entitlement lookup key used in code
- existing analytics targets, such as Mixpanel or PostHog
- Meta Business and ad account ownership
- Google Ads customer or MCC ownership
- TikTok advertiser ownership

If the app is not yet on App Store Connect or Play Console, create those app records first or mark that platform blocked.

### 2. Audit App Code

Search the app repo before changing external dashboards:

```bash
rg -n "react-native-appsflyer|appsFlyer|AppsFlyer|revenueCatService|Purchases|setAppsflyerID|setAttributes|Mixpanel|PostHog|paywall|subscription|purchase" .
```

Confirm:

- `react-native-appsflyer` or the repo-standard AppsFlyer wrapper is installed and initialized.
- The AppsFlyer dev key is loaded from the existing secure/config pattern for the app.
- RevenueCat is configured with the correct public SDK keys for iOS and Android.
- `Purchases.setAppsflyerID(...)` or equivalent attribution ID forwarding exists before purchase events matter.
- RevenueCat attributes include the AppsFlyer ID and any existing user analytics identifiers that the repo already supports.
- Paywall, purchase, restore, and entitlement checks use the expected entitlement lookup key.
- Backend RevenueCat webhooks exist if the app mirrors subscription state server-side.

Minimum event expectation:

- AppsFlyer SDK handles install/session attribution.
- Login or app-user-id mapping should be stable before RevenueCat login.
- Purchase and renewal events should come from RevenueCat's AppsFlyer integration unless the app has a specific reason to send direct purchase events.

### 3. Create AppsFlyer Apps

In AppsFlyer:

1. Open `My Apps`.
2. Add the iOS app with its App Store ID.
3. Add the Android app with its package name.
4. Open app settings and copy the Android/iOS dev key for local configuration only.
5. Do not paste the dev key into docs or chat.

Expected AppsFlyer app IDs:

- iOS appears as `id...`.
- Android appears as the package name.

### 4. Enable AppsFlyer Partner Integrations

For each platform app, open Partner Integrations and configure:

- Meta Ads: `facebook_int`
- Google Ads: `googleadwords_int`
- TikTok For Business: `tiktokglobal_int`

Baseline partner setup:

- activate the partner
- save the page
- keep in-app event postback rows empty unless a campaign plan explicitly needs app-owned event postbacks
- rely on RevenueCat for purchase/revenue postbacks when subscriptions are sold through RevenueCat

Cost connections are usually account-level:

- Google Ads cost connection is authorized under AppsFlyer Cost Settings for the Google account/customer scope.
- TikTok cost connection is authorized under AppsFlyer Cost Settings for the advertiser scope.
- Meta requires the Meta Business assets and ad accounts to be available to the user/system user that manages campaigns and integrations.

### 5. Understand Ad Account Reuse

Do not create a new ad account just because a new app is added.

- Meta: one Business Manager can own multiple apps and ad accounts. Use a separate ad account only when finance, access control, pixel/app-event separation, or campaign ownership needs it.
- Google Ads: the same Google Ads customer or MCC can run app campaigns for multiple apps. Campaign setup references the specific App Store or Play app.
- TikTok: the same advertiser can usually promote multiple apps if the app/event source is connected and the advertiser has permission.

The app-specific work happens in:

- AppsFlyer app and partner pages
- ad-network app/event-source configuration
- campaign promoted object/app selection
- RevenueCat integration for subscription revenue

### 6. Configure RevenueCat To AppsFlyer

In the RevenueCat project:

1. Confirm iOS and Android apps exist and SDK public keys match the app repo.
2. Confirm offerings, packages, and entitlement lookup keys match code.
3. Open `Integrations -> AppsFlyer`.
4. Enter the AppsFlyer Android/iOS dev key from AppsFlyer app settings.
5. Enter the iOS App Store numeric app ID without the `id` prefix.
6. Enter the Android package name.
7. Leave web/PBA fields blank for native-only apps.
8. Use RevenueCat default event names unless a campaign plan requires custom names.
9. Keep revenue mode aligned with the business decision, normally gross revenue for acquisition reporting.
10. Save and verify the integration list shows `AppsFlyer Active`.

If Mixpanel or PostHog is already the app's product analytics destination, keep that integration active too. AppsFlyer is acquisition attribution, not a replacement for product analytics.

### 7. Validate

Use a fresh TestFlight or internal-test install when possible.

Validation steps:

1. Launch the app and complete login.
2. Trigger paywall view and restore/purchase flow where safe.
3. Check AppsFlyer live events or dashboard for install/session/login-level events.
4. Check RevenueCat customer state for the app user.
5. Check RevenueCat integrations list for `AppsFlyer Active`.
6. For sandbox purchase validation, confirm RevenueCat receives the transaction before expecting AppsFlyer revenue events.
7. After real campaigns start, expect partner and cost data to lag; do not treat a quiet same-minute dashboard as failure.

Record evidence:

```text
App:
iOS AppsFlyer app:
Android AppsFlyer app:
RevenueCat project:
RevenueCat entitlement:
RevenueCat AppsFlyer integration:
Meta partner status:
Google Ads partner status:
TikTok partner status:
Validation install:
Purchase/revenue test:
Known blockers:
```

## What Codex Can Do

Codex can:

- inspect app code for SDK, event, and RevenueCat wiring
- navigate AppsFlyer, RevenueCat, Meta, Google Ads, and TikTok dashboards after the user completes login/2FA
- fill bounded integration forms when the destination and data are clear
- use local API wrappers and ad-operator skills when credentials exist outside git
- prepare PRs for app-side SDK or event fixes
- verify dashboard status and repo cleanliness

Codex should stop for the user when:

- account creation, 2FA, CAPTCHA, or passkey approval is required
- a platform asks for legal, privacy, age-rating, data-safety, or tax/payment declarations
- the next action can spend money, publish a campaign, or change live delivery
- a needed secret is only available by pasting it into chat
