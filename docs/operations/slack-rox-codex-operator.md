# Slack Rox Codex Operator Setup

This runbook configures a real Slack app identity named `Rox` for the Slack Codex Operator workflow.

## Current Model

- Canonical workflow: `packs/vibermode/workflows/slack-codex-operator.md`
- Slack app manifest: `config/slack-rox-app-manifest.yaml`
- Local helper: `scripts/slack-rox-bot.mjs`
- Natural-language resolver: `scripts/slack-rox-context.mjs`
- Intent catalog: `config/slack-rox-intents.json`
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

The manifest includes `files:write` so Rox can upload screenshots, generated images, and sanitized evidence files. Reinstall the Slack app after any scope change so the bot token receives the new permission.

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

For product research, create or resolve the dedicated private channel after the bot has `channels:manage` and `groups:write`:

```bash
npm run slack:rox -- ensure-channel \
  --name product-ideas \
  --private \
  --purpose "Evidence-led app idea research and co-founder decisions" \
  --topic "One root post per idea; discuss validation and promotion in threads"
```

Scope changes require reinstalling the Slack app before the existing bot token can create a channel. After setup, add the resolved channel ID to local Rox policy and `PRODUCT_IDEAS_SLACK_CHANNEL_ID` for the daily research automation.

Add `Rox` to every channel where mention detection should work.

Configured mention-scan channels:

- `#team-operation` (`C06H20BA42W`)
- `#team-hr` (`C06H205GQ6N`)
- `#customer-success` (`C090F1TGQG5`)
- `#growth` (`C08FC35G74J`)
- `#project-ozard` (`C0BHF02L5UP`)
- `#project-otto` (`C0BHY8G3VRP`)
- `#project-studybud` (`C0BHF07TWJ3`)
- `#project-easyspell` (`C0BHQ3LN8H1`)
- `#project-kant-web` (`C0BJ6KWNLJG`)
- `#project-kant-mobile` (`C0BJ0UGTEES`)

`#customer-success` is included only so explicit `@Rox` mentions can be detected. It remains excluded from routine triage.

Slack bot tokens can read only conversations where the bot is a member, so private channels require inviting `Rox` first.

`#team-cs` was requested but was not found under that name during setup. Add it later by resolving the channel ID and appending it to the scan command/policy.

## Smoke Test

After token storage and channel invites:

```bash
npm run slack:rox:probe -- --channels C06H20BA42W,C06H205GQ6N,C090F1TGQG5,C08FC35G74J
npm run slack:rox:scan -- --channels C06H20BA42W,C06H205GQ6N,C090F1TGQG5,C08FC35G74J
```

Then post a test mention in a permitted channel:

```text
@Rox test: bunu goruyorsan threade cevap ver
```

The next heartbeat should detect it and reply in-thread.

Scan candidates include a typo-tolerant `routing` object with resolved app, platform, intent, playbook, channel context, sourced project facts, and clarification reasons. Inspect the same resolver directly without Slack access:

```bash
npm run slack:rox:context -- resolve \
  --channel-name project-studybud \
  --text "moruk iki buildi teste yollasana"
```

Read `docs/operations/slack-rox-context-model.md` before adding reusable context and `docs/operations/slack-rox-playbooks.md` when extending Growth or Customer Success behavior.

To upload an image or sanitized file into a task thread:

```bash
npm run slack:rox -- upload --channel C123 --thread-ts 1750000000.000000 --file /abs/path/image.png --message "Kisa not"
```

If Slack immediately posts an `Agent failed before reply` message, re-check the Slack app manifest and confirm `socket_mode_enabled` is `false`, Event Subscriptions are off, and Interactivity is off.

## Failure Modes

- `missing_scope`: Reinstall the app after adding scopes in the manifest.
- `not_in_channel` or `channel_not_found`: Invite `Rox` to the channel or verify the configured channel name.
- `invalid_auth`: The token is wrong, revoked, or from another workspace.
- `missing token`: Store the `xoxb-` token in Keychain using the command above.
