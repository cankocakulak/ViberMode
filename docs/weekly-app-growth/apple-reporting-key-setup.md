# AŞ reporting key — local setup

**Verified activation — 2026-09-21:** Reporting key `LBPRGL653R` is installed in the separate Keychain services below and can sign locally. App inventory, Ozard/EasySpell app access, both Analytics request lists and report-type lists return HTTP 200. Active ONGOING and ONE_TIME_SNAPSHOT requests and Discovery & Engagement Standard reports are present for both apps. Sales SUMMARY for AŞ vendor `94737364`, date 2026-09-19, returns HTTP 200. No one-time Admin initialization is needed for the existing reports. The original App Manager key and LLC credentials were not modified. The setup/unknown-status discussion below records the pre-install state.

The deployment/App Manager key `4G4VNQZ45V` and Keychain item `kantlabs-asc-api-key-p8-b64` remain untouched. The second reporting profile is in `.growth-scorecard.local.json → appleAccounts[keychainPrefix=kantlabs].reportingAuth`.

## What is known before key creation

Current AŞ issuer: `1814f6cc-9f8d-446e-9d85-652ec8bfe09e`; team: `2H8TC56G64`; vendor: `94737364`. Current App Manager key reads both app resources but request-list endpoints return 403. There is no other active AŞ key in the audited Team Keys list. The old LLC report request IDs do not establish report initialization in the new AŞ organization. **Current-AŞ initialization status remains UNKNOWN, not absent.**

Apple requires Account Holder/Admin to create a team API key, and Admin to request a new Analytics Report type the first time. Sales and Reports or Finance can download generated reports after initialization. Therefore start with the ongoing Sales and Reports key, perform the read-only verification below, and request one-time Admin initialization only if the authorized response proves it is needed. Do not create a permanent Admin reporting key speculatively.

Sources: [Team API key creation](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/), [Analytics initialization vs downloading roles](https://developer.apple.com/help/app-store-connect-analytics/overview/analytics-reports-api/).

## Exact App Store Connect steps

1. Sign in as **Account Holder or Admin**, select **KANT LABS EGITIM TEKNOLOJILERI ANONIM SIRKETI**.
2. App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys → Generate API Key (or **+** next to active keys).
3. Name: **Kant Analytics Reporting**. Access: **Sales and Reports**. Click Generate. Keep the existing App Manager key.
4. Copy the new key's **Key ID** from its row. Copy **Issuer ID** from the top of the Team Keys page; it should equal the AŞ issuer above. If it differs, stop and verify the selected organization.
5. Click **Download API Key** for the new key and confirm Download. The `.p8` is downloadable only once; keep the downloaded file in your secure local storage. Do not paste its contents into chat or source files.

## Install directly into macOS Keychain

Replace the sample ID and local file path below with the actual new Key ID and downloaded file. The helper reads the `.p8` directly, stores its **base64 encoding** through macOS Security APIs, and never prints the key or passes its contents as a process argument. It refuses to overwrite an existing reporting credential. It does not generate an Apple key.

```sh
cd /Users/mcan/ViberMode
swift scripts/install-apple-reporting-key.swift \
  --key-id NEWKEY1234 \
  --p8 /Users/mcan/Downloads/AuthKey_NEWKEY1234.p8
node scripts/verify-apple-reporting.mjs --local
```

Exact Keychain services:

- `kantlabs-asc-reporting-api-key-p8-b64`: base64-encoded `.p8` bytes.
- `kantlabs-asc-reporting-key-id`: new Key ID, plain identifier.

Existing config holds the issuer; no secret environment assignment is required. Optional identifier overrides are `ASC_REPORTING_ISSUER_ID` and `ASC_REPORTING_KEY_ID`; an issuer different from the configured AŞ issuer is rejected. The private key is read only from the configured `privateKeyService`, never from chat or a committed `.p8`.

The local verifier confirms both items can be read and the private key can sign ES256. Output contains only Key ID, Issuer ID and `localReadable`, never private key material. With no installed reporting key it prints `REPORTING_KEY_NOT_INSTALLED` and exits 2.

## Read-only online verification after install

```sh
cd /Users/mcan/ViberMode
node scripts/verify-apple-reporting.mjs --date 2026-09-19
```

This performs, in order:

1. App inventory and exact Ozard `6753729850` / EasySpell `6762075035` app access.
2. GET each app's `analyticsReportRequests`; list available report types for active requests. HTTP 403 is an access blocker, never evidence that a request is absent.
3. DAILY Sales SUMMARY for AŞ vendor `94737364` and the specified completed report date.

The verifier does **not** POST report requests. If a relevant request/report type does not exist, an Admin-authorized one-time request is needed, normally `POST /v1/analyticsReportRequests` with `accessType: ONGOING` and the exact app relationship. For historical availability, consider ONE_TIME_SNAPSHOT separately under explicit authorization. Newly requested ongoing reports are not immediately ready; Apple documents about 24–48 hours for first output. If requests already exist, the Sales and Reports key can be sufficient; that conclusion must come from the authorized readback.

## Collection source matrix

| Metric | API path implemented | Dated UI fallback | Current primary while new key is absent |
|---|---|---|---|
| First Downloads | Sales SUMMARY, exact type/owner/vendor reconciliation | Yes, UTC first-download table | UI |
| Product Page Views | Analytics Discovery & Engagement Standard, compatible weekly event counts | Yes | UI |
| Unique Impressions | No verified equivalent adapter yet | Yes | UI / missing coverage |
| Total Downloads | No verified equivalent adapter yet | Yes | UI / missing coverage |
| Unique Product Page Views | No verified equivalent adapter yet | Yes | UI / missing coverage |
| Native CVR | No verified equivalent adapter yet; no synthesized daily-unique denominator | Yes | UI / missing coverage |
| Country breakdown | No verified equivalent adapter yet | Yes | UI / missing coverage |

Supported API paths already precede fallback. Inventory retains the App Manager token; reporting profile owns separate Sales/Analytics tokens after exact app ownership validation. Failure preserves existing dated UI fallback and PARTIAL/WAITING semantics. Historical UI→API substitutions still go through source-change review. Other API migrations await actual authorized report contents and equivalent counting/calendar/unique semantics; a new credential alone does not prove those.

After setup, report only: new Key ID, displayed Issuer ID, selected Access role, whether the local install succeeded, and the non-secret verification status. Never provide `.p8` contents.
