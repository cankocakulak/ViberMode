# Slack Rox Codex Operator Setup

This runbook configures a real Slack app identity named `Rox` for the Slack Codex Operator workflow.

## Current Model

- Canonical workflow: `packs/vibermode/workflows/slack-codex-operator.md`
- Slack app manifest: `config/slack-rox-app-manifest.yaml`
- Local helper: `scripts/slack-rox-bot.mjs`
- Runtime policy/state: `.codex/slack-codex-operator/`
- Keychain service: `viberboyz-slack-rox-bot-token`
- Installed Slack app: `Rox` in the Kant Labs workspace
- Delivery model: polling via Codex heartbeat. Slack Socket Mode, Event Subscriptions, and Interactivity are intentionally disabled so stale OpenClaw socket workers cannot answer as Rox.

## Create The Slack App

1. Open `https://api.slack.com/apps?new_app=1`.
2. Choose `From a manifest`.
3. Sign in to the target Slack workspace.
4. Paste `config/slack-rox-app-manifest.yaml`.
5. Create the app.
6. Install the app to the workspace.
7. Copy the `Bot User OAuth Token`. It should start with `xoxb-`.

Do not paste the token into docs, git, Slack, or Codex chat.

Store it locally:

```bash
printf '%s' "$SLACK_ROX_BOT_TOKEN" | npm run slack:rox -- save-keychain
```

Check that it is stored:

```bash
npm run slack:rox -- check-keychain
```

Probe the app:

```bash
npm run slack:rox:probe
```

## Channel Membership

Add `Rox` to every channel where mention detection should work.

Configured mention-scan channels:

- `#team-operation` (`C06H20BA42W`)
- `#team-hr` (`C06H205GQ6N`)
- `#customer-success` (`C090F1TGQG5`)

`#customer-success` is included only so explicit `@Rox` mentions can be detected. It remains excluded from routine triage.

Slack bot tokens can read only conversations where the bot is a member, so private channels require inviting `Rox` first.

`#team-cs` was requested but was not found under that name during setup. Add it later by resolving the channel ID and appending it to the scan command/policy.

## Smoke Test

After token storage and channel invites:

```bash
npm run slack:rox:probe -- --channels C06H20BA42W,C06H205GQ6N,C090F1TGQG5
npm run slack:rox:scan -- --channels C06H20BA42W,C06H205GQ6N,C090F1TGQG5
```

Then post a test mention in a permitted channel:

```text
@Rox test: bunu goruyorsan threade cevap ver
```

The next heartbeat should detect it and reply in-thread.

If Slack immediately posts an `Agent failed before reply` message, re-check the Slack app manifest and confirm `socket_mode_enabled` is `false`, Event Subscriptions are off, and Interactivity is off.

## Failure Modes

- `missing_scope`: Reinstall the app after adding scopes in the manifest.
- `not_in_channel` or `channel_not_found`: Invite `Rox` to the channel or verify the configured channel name.
- `invalid_auth`: The token is wrong, revoked, or from another workspace.
- `missing token`: Store the `xoxb-` token in Keychain using the command above.
