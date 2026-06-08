# Store Downloads Notion Automation

This runbook covers the local updater for a Notion app downloads table.

## Command

```sh
npm run store-downloads:notion -- --date 2026-06-08
```

When `--date` is omitted, the script targets the last completed Monday-Sunday range before the run date. Running on Monday 2026-06-08 targets 2026-06-01 through 2026-06-07.

## Behavior

- Reads `.vibermode-automation.env` automatically when present.
- Pulls iOS first-download counts from App Store Connect daily Sales reports.
- Pulls Android daily user installs from Google Play monthly `stats/installs` CSVs.
- Upserts one Notion row per configured app.
- If a row for the same app and week already exists, it does nothing unless a value is missing.
- If Android was missing and later becomes available, it fills `Android` and updates `Sayı` when `Sayı` was only the iOS-only total.

## Required Credentials

The public repo must not contain live app identifiers, bucket IDs, vendor numbers, database IDs, or secrets. Copy `.vibermode-automation.env.example` to `.vibermode-automation.env` and fill values locally.

The script requires app matching config through one of:

```sh
STORE_DOWNLOADS_TRACKED_APPS_JSON='[{"key":"example","notionName":"Example App İndirme","iosSku":"com.example.ios","iosAppleId":"1234567890","androidPackage":"com.example.android"}]'
STORE_DOWNLOADS_TRACKED_APPS_FILE=/absolute/path/to/private-app-config.json
```

The script can run without Notion credentials to produce a JSON report, but direct Notion writes require:

```sh
NOTION_API_KEY=secret_...
NOTION_APP_DOWNLOADS_DATABASE_ID=...
```

Store credentials in `.vibermode-automation.env` or the automation runtime. Do not commit live secrets.

## Useful Checks

```sh
npm run store-downloads:notion -- --date 2026-06-08 --dry-run
npm run store-downloads:notion -- --date 2026-06-08 --skip-notion --output tmp/store-downloads-week.json
npm run store-downloads:notion -- --date 2026-06-08 --dry-run --include-identifiers --verbose-errors
```

Default JSON output omits app identifiers and trims external API error details. Use `--include-identifiers` and `--verbose-errors` only for local debugging.
