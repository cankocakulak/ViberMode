# Mobile Monetization RevenueCat Launch

Operational workflow for launching iOS subscriptions with App Store Connect, RevenueCat, app-side paywall code, and TestFlight validation.

Use this when a mobile app needs subscriptions, RevenueCat setup, a paywall, purchase/restore wiring, SDK keys, or a monetized TestFlight build.

## Layer Model

Treat monetization as four separate layers. Do not mark the setup ready until all required layers pass.

1. Store catalog: App Store Connect subscription group, products, duration, pricing, availability, localization, review screenshot, review notes, introductory offers, and submission state.
2. RevenueCat: project, app, store connection, entitlement, offering, packages, product attachments, public SDK key, and optional RevenueCat Paywall.
3. App implementation: SDK dependency, secret config, Info.plist exposure, subscription client, paywall UI, plan loading, purchase, restore, entitlement state, access gating, legal links, and tests.
4. Release validation: simulator smoke where useful, archive/export, IPA config inspection, TestFlight upload, internal distribution, and purchase/restore smoke on the exact build.

## Default Product Flow

1. Identify app name, bundle ID, App Store Connect app ID, platform, primary locale, desired products, prices, trial, entitlement, and offering.
2. Read App Store Connect and RevenueCat state before creating anything.
3. Create or verify App Store subscription group and products.
4. Add price, availability, localization, review screenshot, review notes, and introductory offer where requested.
5. Create or verify RevenueCat app/store binding.
6. Create or verify entitlement and offering.
7. Import/attach App Store products to RevenueCat products, attach products to entitlement, then attach packages to offering.
8. Fetch public iOS SDK key; store it only in local ignored config, Keychain, CI secrets, or another non-git secret channel.
9. Wire the app-side SDK and paywall.
10. Verify the exported IPA before uploading to TestFlight.
11. Upload and distribute only the verified build.
12. Test purchase and restore on the exact TestFlight build.

## App Store Connect Checklist

Required before review submission:

- Subscription group exists.
- Product IDs are stable and match app/RevenueCat code.
- Product durations match package names.
- Price schedule is present in target territories.
- Availability is present.
- Localization name/description is present.
- Review screenshot is accepted.
- Review notes are present where required.
- Introductory offer is present if promised in paywall copy.
- First subscriptions are attached to a new app version and submitted with that version when Apple blocks direct subscription submission.

Apple may return `409` for direct first-subscription submission. Treat that as a review-submission routing issue, not as proof that TestFlight purchases cannot work.

## RevenueCat Checklist

Required before app purchase testing:

- RevenueCat project exists.
- RevenueCat app is bound to the correct store app and bundle ID.
- Public iOS SDK key exists.
- Entitlement identifier is final, for example `pro_access`.
- Offering is active/current or intentionally fetched by identifier.
- Packages map to the correct store products.
- Each store product is attached to the entitlement.
- Dashboard product status is not confused with app-side readiness.

Use:

```bash
npm run revenuecat -- status --profile <profile> --project-id <project-id>
npm run revenuecat -- offerings --profile <profile> --project-id <project-id>
npm run revenuecat -- entitlements --profile <profile> --project-id <project-id>
npm run revenuecat -- public-keys --profile <profile> --project-id <project-id> --app-id <app-id>
```

Keep secret API keys and customer data out of chat, source, screenshots, and committed artifacts.

## App Implementation Checklist

Required before TestFlight purchase validation:

- RevenueCat iOS SDK dependency is present.
- App reads the public SDK key from a secret-aware config source.
- App exposes required runtime config through Info.plist or equivalent bundle config.
- Release bundle ID matches the App Store app.
- Debug bundle suffixes do not accidentally point at production products unless intentionally configured.
- Subscription client configures RevenueCat only when the SDK key is non-empty.
- Paywall loads offerings/packages from RevenueCat.
- Paywall has purchase, restore purchases, close, terms, and privacy controls.
- Paywall copy matches product prices, trial eligibility, and renewal behavior.
- Purchase success updates entitlement state.
- Restore updates entitlement state.
- Premium gating uses entitlement state, not only UI state.
- Free quota or usage gating is implemented separately from purchase UI.

For XcodeGen/iOS apps, do not rely only on `INFOPLIST_KEY_*` build settings for custom runtime keys. Verify the archived app or exported IPA contains the actual keys. If generated Info.plist strips custom keys, add an explicit `Info.plist` and set `INFOPLIST_FILE` for the app target.

## Required IPA Gate

Before TestFlight upload or App Store submit, inspect the exported IPA. Do this even when Xcode build settings show the key.

Use:

```bash
npm run ios:inspect-ipa-config -- \
  --ipa /path/to/App.ipa \
  --expect-bundle-id com.example.app \
  --expect-key AppEnvironmentName=Release \
  --require-key AppRevenueCatAPIKey \
  --require-key AppPrivacyPolicyURL \
  --require-key AppTermsOfUseURL
```

When the app has a remote backend or paywall depends on server state, also require:

```bash
  --expect-key AppAichologistRemoteEnabled=YES \
  --require-key AppAPIBaseURL \
  --require-key AppWebSocketURL
```

The script must report secrets as present/missing only. Do not print SDK keys.

Block upload if the IPA gate fails. Common failure modes:

- Info.plist key exists in `xcodebuild -showBuildSettings` but not in the archived app.
- The uploaded build number is older than the fixed source state.
- Debug bundle ID or suffix was archived by mistake.
- The public SDK key exists locally but is not included in Release config.
- The paywall UI exists but RevenueCat packages cannot load.

## Simulator And TestFlight Validation

Simulator can verify:

- Paywall layout and controls.
- SDK key selection.
- Basic offering/package load when StoreKit/Test Store setup supports it.

Simulator cannot replace TestFlight purchase validation unless StoreKit configuration or RevenueCat Test Store is intentionally wired.

TestFlight validation must use the exact build number reported by App Store Connect. TestFlight purchases run against Apple's sandbox payment environment.

Minimum TestFlight smoke:

- Install the latest distributed build number.
- Open paywall.
- Confirm no "purchases not configured" message appears.
- Confirm plans load with expected products/prices/trial.
- Start purchase and verify Apple purchase sheet appears.
- Complete sandbox purchase where possible.
- Confirm entitlement becomes active in app and RevenueCat customer view.
- Delete/reinstall or use a fresh account and verify restore purchases.

## Review Submission Boundary

Internal TestFlight upload/distribution is not App Review submission.

Before final review:

- Attach the first subscriptions to the app version if Apple requires app-version submission.
- Ensure the selected app version build is the monetized build that passed IPA inspection.
- Ensure app metadata, screenshots, privacy, age rating, support URL, terms/privacy URLs, export compliance, content rights, and review notes are current.
- Do not submit subscriptions with a binary that cannot fetch offerings, purchase, restore, and enforce access.
