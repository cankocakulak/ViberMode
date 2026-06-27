# Store Review Ops

Manual review triage and reply workflow for:

- Tercih Sihirbazı
- Kant Akademi
- Ozard
- Sınav Oyunları / Exam Games
- Studybud

The app list and store IDs live in `/Users/mcan/ViberMode/config/store-review-apps.json`.

## Commands

Dry-run is the default. It reads Google Play and App Store reviews, classifies unanswered reviews, drafts replies, and writes a JSON/Markdown report.
By default, reply candidates are limited to reviews from the last 14 days.

```bash
npm run reviews:stores
```

Send replies:

```bash
npm run reviews:stores:reply
```

First cleanup / backlog mode:

```bash
npm run reviews:stores:backlog
npm run reviews:stores:reply:backlog
```

Limit the run:

```bash
npm run reviews:stores -- --apps tercih-sihirbazi,ozard
npm run reviews:stores -- --platforms android
npm run reviews:stores -- --since-days 14
npm run reviews:stores -- --include-backlog
```

Reports are written under `/Users/mcan/ViberMode/reports/store-reviews/`:

- `*.json`: full machine-readable run output
- `*.md`: human review report
- `*.slack.md`: Slack-ready summary for `#co-founders`

## Safety

- The script never prints store credentials.
- `--reply` is required before any store response is published.
- Existing replies are not updated unless `--update-existing` is passed.
- Google Play replies are capped to the 350 character limit.
- App Store Connect responses may return `PENDING_PUBLISH`; that means Apple accepted the response and will publish it asynchronously.

## Slack

The local script can write a Slack-ready message, but it cannot use the Codex Slack connector directly. The Codex thread automation reads the generated `*.slack.md` file and posts it to `#co-founders` (`C0B89DMC41Y`) with the Slack connector.

If a Slack incoming webhook is configured locally, the script can post directly:

```bash
SLACK_REVIEW_WEBHOOK_URL="https://hooks.slack.com/services/..." \
npm run reviews:stores -- --slack-webhook-env SLACK_REVIEW_WEBHOOK_URL
```

## Codex Automation

Codex automation ID:

```text
store-review-reply-ops
```

It is a paused heartbeat automation attached to the Codex chat. When manually run from Codex, it runs:

```bash
npm run reviews:stores:reply:backlog
```

The automation reports the run summary back into the same Codex chat and posts the Slack-ready summary to `#co-founders`. Backlog mode includes older unanswered reviews but still does not update existing replies unless `--update-existing` is explicitly passed.

## Credentials

The workflow reuses the existing Keychain items:

- `viberboyz-google-play-service-account-json-b64`
- `viberboyz-asc-key-id`
- `viberboyz-asc-issuer-id`
- `viberboyz-asc-api-key-p8-b64`

Set `APP_FACTORY_KEYCHAIN_PREFIX` to override the `viberboyz` prefix.
