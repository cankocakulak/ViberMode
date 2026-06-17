# Ad Platform Operators Review

Verdict: approved with live-credential follow-up.

## Review Notes

- The new TikTok and Google Ads operators follow the Meta operator's repo shape: skill wrapper, report script, portable setup, workflow templates, write safety rules, and operation docs.
- Both CLIs default to read-only reporting and avoid printing secrets in check modes.
- Write workflows are documented as approval-gated and paused-by-default.
- Repo maps and env examples make both operators discoverable through Codex and generic `AGENTS.md` flows.

## Residual Risk

- TikTok metric availability varies by advertiser, report type, data level, and permission scope. The CLI exposes `--metrics`, `--dimensions`, `--report-type`, and `--data-level` so the report can be adjusted after the first live API response.
- Google Ads access can fail if the service account/OAuth user is not granted access, or if `GOOGLE_ADS_LOGIN_CUSTOMER_ID` is missing for manager-account access.
- Live API smoke tests remain pending until credentials are stored outside git.
