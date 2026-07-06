# Apple Public Data

Use this reference when refreshing public Apple data for competitor apps.

## Allowed Public Sources

- iTunes Search API: `https://itunes.apple.com/search`
- iTunes Lookup API: `https://itunes.apple.com/lookup`
- Public App Store pages: `https://apps.apple.com/{country}/app/id{appId}`
- Apple Marketing Tools RSS: `https://rss.applemarketingtools.com/api/v2/{country}/apps/...`
- Public customer review RSS when available: `https://itunes.apple.com/{country}/rss/customerreviews/id={appId}/sortby=mostrecent/json`

## Field Guidance

Capture these fields when available:

- `trackId`
- `trackName`
- `artistName` / `sellerName`
- `bundleId`
- `primaryGenreName`
- `genres`
- `averageUserRating`
- `userRatingCount`
- `price`
- `formattedPrice`
- `offersIAP`
- `trackViewUrl`
- `screenshotUrls`
- `ipadScreenshotUrls`
- `description`
- `releaseNotes`
- `version`
- `currentVersionReleaseDate`
- `releaseDate`
- `trackContentRating`

## Boundaries

- Public Apple data does not expose competitor revenue, exact downloads, cohort behavior, paywall conversion, or A/B test allocation.
- App Store Connect is only for apps owned by the authenticated developer account. Do not use it for competitor inspection.
- Simulator cannot install arbitrary App Store apps. Live competitor flow capture requires a physical device or user-provided screenshots/recordings.
- Sign in with Apple, trials, purchases, and 2FA must remain user-controlled.

## Refresh Rules

- Add `captured_at` to every source record.
- Keep raw source URL in `source-inventory.json`.
- Treat rating, review count, charts, prices, and screenshots as time-sensitive.
- When refreshing, append new sources or update a run-specific snapshot; do not silently overwrite prior research evidence unless the task is explicitly a refresh.
