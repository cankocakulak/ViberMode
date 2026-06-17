# Ad Platform Operators Plan

## Scope

Add TikTok Ads and Google Ads operator support matching the existing Meta Ads operator pattern:

- Codex skill wrappers
- read-only report CLIs
- portable setup/runbook docs
- Keychain-first credential guidance
- repo capability maps and env examples
- validation evidence

## Current Pattern

Meta Ads already uses:

- `adapters/codex/skills/meta-ads-operator/`
- `scripts/meta_ads_report.mjs`
- `docs/operations/meta-ads-codex-setup.md`
- `.vibermode-automation.env.example` non-secret defaults
- `AGENTS.md` and reference capability maps

## Implementation Approach

1. Add `tiktok-ads-operator` using TikTok API for Business.
   - Default report endpoint: `/open_api/v1.3/report/integrated/get/`.
   - Auth: `Access-Token` header plus advertiser id.
   - Secret storage: Keychain services under `viberboyz-tiktok-*`.

2. Add `google-ads-operator` using Google Ads API REST.
   - Default report endpoint: `/v24/customers/{CUSTOMER_ID}/googleAds:searchStream`.
   - Auth: developer token plus OAuth access token from service account JSON or refresh token credentials.
   - Secret storage: Keychain services under `viberboyz-google-ads-*`.

3. Keep write workflows paused-by-default.
   - Read/report workflows can run directly.
   - Writes require explicit current-turn approval and post-write readback.

4. Install the new skills through `npm run install:codex`.

## Acceptance Checks

- `node --check` passes for both new CLIs.
- `--check-keychain` works without printing secrets.
- `npm run validate` passes.
- `npm run install:codex` installs both new skills.
- Setup docs explain how to connect and validate without committing secrets.

## Live Integration Blocker

Live TikTok and Google Ads API calls require account credentials that are intentionally not in git:

- TikTok: `TIKTOK_ACCESS_TOKEN` and `TIKTOK_ADVERTISER_ID`.
- Google Ads: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, and either service account JSON/path/B64 or OAuth refresh-token credentials.
