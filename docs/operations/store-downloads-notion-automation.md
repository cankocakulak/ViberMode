# Store Downloads Notion Automation

This runbook covers the local updater for a Notion app downloads table.

## Command

```sh
npm run store-downloads:notion -- --date 2026-06-08
```

When `--date` is omitted, the script targets the last completed week before the run date. The default automation setup uses Monday-Sunday weeks.

## Behavior

- Reads `.vibermode-automation.env` automatically when present.
- Pulls iOS first-download counts from App Store Connect daily Sales reports.
- Pulls Android counts from the configured Google Play monthly report metric.
- Upserts one Notion row per configured app.
- If a row for the same app and week already exists, it does nothing unless a value is missing.
- If Android was missing and later becomes available, it fills `Android` and updates `Sayı` when `Sayı` was only the iOS-only total.
- `--backfill-weeks N` re-checks the latest N completed weeks, which is useful because Android GCS exports can lag the Play Console UI.

## Required Credentials

The public repo must not contain live app identifiers, bucket IDs, vendor numbers, database IDs, or secrets. Copy `.vibermode-automation.env.example` to `.vibermode-automation.env` and fill values locally.

## Fresh Clone Setup

For someone who just cloned ViberMode, the shortest working path is:

1. Copy `.vibermode-automation.env.example` to `.vibermode-automation.env`.
2. Fill App Store Connect values:
   - `ASC_KEY_ID`
   - `ASC_ISSUER_ID`
   - `ASC_API_KEY_P8_B64`
   - `ASC_VENDOR_NUMBERS`
3. Fill Google Play values:
   - `GOOGLE_PLAY_BUCKET`
   - one of `GOOGLE_PLAY_SERVICE_ACCOUNT_PATH`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, or `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64`
4. Fill tracked app mapping through:
   - `STORE_DOWNLOADS_TRACKED_APPS_JSON`, or
   - `STORE_DOWNLOADS_TRACKED_APPS_FILE`
5. Fill Notion values:
   - `NOTION_API_KEY`
   - `NOTION_APP_DOWNLOADS_DATABASE_ID`
6. Run a read-only smoke check first:

```sh
npm run store-downloads:notion -- --skip-notion --dry-run
```

7. If the output looks right, run the normal writer:

```sh
npm run store-downloads:notion:manual
```

The script requires app matching config through one of:

```sh
STORE_DOWNLOADS_TRACKED_APPS_JSON='[{"key":"example","notionName":"Example App İndirme","iosSku":"com.example.ios","iosAppleId":"1234567890","androidPackage":"com.example.android"}]'
STORE_DOWNLOADS_TRACKED_APPS_FILE=/absolute/path/to/private-app-config.json
```

The script can run without Notion credentials to produce a JSON report, but direct Notion writes require:

```sh
NOTION_API_KEY=ntn_...
NOTION_APP_DOWNLOADS_DATABASE_ID=...
```

Store credentials in `.vibermode-automation.env` or the automation runtime. Do not commit live secrets.

## Notion Access Mode

Prefer a Notion Personal Access Token for this workflow.

- A PAT uses the permissions of the human user who created it.
- An internal integration behaves like a separate bot and often requires manually sharing the target database/page with that integration.
- If the script says it cannot find the database even though the ID is correct, the token usually belongs to an integration that does not have access to that database.

Recommended setup:

1. Create a PAT in Notion.
2. Put it in `NOTION_API_KEY`.
3. Open the target database in Notion and confirm the same human account can already access it.
4. Copy the database ID from the page URL or keep using the existing known ID in `NOTION_APP_DOWNLOADS_DATABASE_ID`.

The script also supports a Keychain fallback for Notion tokens. If `NOTION_API_KEY` and `NOTION_TOKEN` are unset, it will check:

- `NOTION_KEYCHAIN_SERVICE`
- `NOTION_API_KEY_KEYCHAIN_SERVICE`
- `viberboyz-notion-api-key`
- `vibermode-notion-api-key`
- `notion-api-key`
- `NOTION_TOKEN_KEYCHAIN_SERVICE`
- `viberboyz-notion-token`
- `vibermode-notion-token`
- `notion-token`

If you want a local Keychain-backed setup instead of an env file, store the token under one of those service names or set a custom `NOTION_KEYCHAIN_SERVICE`.

For Android, set `STORE_DOWNLOADS_ANDROID_METRIC` to the Play Console metric you want to mirror. Use `daily_device_installs` for the Statistics saved view metric usually shown as New device acquisitions.

- `store_listing_acquisitions` for the Store Performance acquisition view.
- `total_store_acquisitions` for all store acquisitions.
- `daily_device_installs`, `daily_user_installs`, or `install_events` for the installs statistics report.

Set `STORE_DOWNLOADS_WEEK_START_DAY=monday` for the production Notion workflow. Use `sunday` only for one-off comparisons against Play Console weekly saved views that start on Sunday.

Keep `STORE_DOWNLOADS_REQUIRE_ANDROID_WEEK_COMPLETE=false` for the production workflow. Google Play Console UI can show fresher recent-day data than the Google Cloud Storage monthly CSV export; with this setting the script writes the latest available Android data and emits `sources.android.warnings` when the export does not yet include the week end date. Set it to `true` only if you want incomplete Android weeks blocked entirely.

Use `STORE_DOWNLOADS_BACKFILL_WEEKS=4` for the production automation so late Android exports can fill recent rows after the first iOS-only write. For historical correction where iOS should stay as-is, run with `--skip-ios --allow-android-overwrite`.

## Useful Checks

```sh
npm run store-downloads:notion -- --date 2026-06-08 --dry-run
npm run store-downloads:notion -- --date 2026-06-08 --skip-notion --output tmp/store-downloads-week.json
npm run store-downloads:notion -- --date 2026-06-08 --dry-run --include-identifiers --verbose-errors
npm run store-downloads:notion -- --date 2026-06-09 --backfill-weeks 4 --skip-ios --allow-android-overwrite --dry-run
```

Default JSON output omits app identifiers and trims external API error details. Use `--include-identifiers` and `--verbose-errors` only for local debugging.

## Manual Runs

```sh
# Normal: create missing rows and fill missing values only.
npm run store-downloads:notion:manual

# Android correction: keep existing iOS values, update Android and Sayı.
npm run store-downloads:notion:android-backfill

# Full correction: update iOS, Android, and Sayı from source reports.
npm run store-downloads:notion:overwrite
```

Use `--dry-run` after `--` when checking output before writing, for example:

```sh
npm run store-downloads:notion:android-backfill -- --dry-run
```
