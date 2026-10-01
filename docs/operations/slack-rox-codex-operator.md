# Slack Rox Codex Operator Setup

This runbook configures a real Slack app identity named `Rox` for the Slack Codex Operator workflow.

## Current Model

- Canonical workflow: `packs/vibermode/workflows/slack-codex-operator.md`
- Slack app manifest: `config/slack-rox-app-manifest.yaml`
- Local helper: `scripts/slack-rox-bot.mjs`
- Event bridge: `scripts/slack-rox-event-bridge.mjs`
- Natural-language resolver: `scripts/slack-rox-context.mjs`
- Intent catalog: `config/slack-rox-intents.json`
- Runtime policy/state: `.codex/slack-codex-operator/`
- Bot token Keychain service: `viberboyz-slack-rox-bot-token`
- App-level token Keychain service: `viberboyz-slack-rox-app-token`
- LaunchAgent label: `com.vibermode.slack-rox-event-bridge`
- Installed Slack app: `Rox` in the Kant Labs workspace
- Delivery model: Slack Socket Mode event bridge for immediate app mentions, DMs, and active-thread replies. The Codex heartbeat can remain active as a slow fallback for missed events.

## Create The Slack App

1. Open `https://api.slack.com/apps?new_app=1`.
2. Choose `From a manifest`.
3. Sign in to the target Slack workspace.
4. Paste `config/slack-rox-app-manifest.yaml`.
5. Create the app.
6. Install the app to the workspace.
7. Copy the `Bot User OAuth Token`. It should start with `xoxb-`.
8. In Slack app settings, create an app-level token with `connections:write`. It should start with `xapp-`.

Do not paste token values into docs, git, Slack, or Codex chat.

The manifest includes `files:write` so Rox can upload screenshots, generated images, and sanitized evidence files. Reinstall the Slack app after any scope change so the bot token receives the new permission.

Store it locally:

```bash
printf '%s' "$SLACK_ROX_BOT_TOKEN" | npm run slack:rox -- save-keychain
printf '%s' "$SLACK_ROX_APP_TOKEN" | npm run slack:rox:events -- save-keychain
```

Check that both tokens are stored:

```bash
npm run slack:rox -- check-keychain
npm run slack:rox:events -- check-keychain
```

Probe the app:

```bash
npm run slack:rox:probe
npm run slack:rox:events:probe
```

Install the local event bridge as a macOS login service after both probes pass:

```bash
npm run slack:rox:events:install-agent
npm run slack:rox:events:status
```

If the app-level token is not available yet, write the LaunchAgent file without starting it:

```bash
npm run slack:rox:events -- install-agent --write-only
```

After the token is stored, rerun `npm run slack:rox:events:install-agent` to load and start it. Remove it with:

```bash
npm run slack:rox:events:uninstall-agent
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
npm run slack:rox:events:probe
```

Start the event bridge in a local terminal:

```bash
npm run slack:rox:events -- listen
```

For normal live use, prefer the LaunchAgent:

```bash
npm run slack:rox:events:install-agent
npm run slack:rox:events:status
```

For a no-action dry run that only records matched events and the generated Codex prompt:

```bash
npm run slack:rox:events -- listen --dry-run
```

Then post a test mention in a permitted channel:

```text
@Rox test: bunu goruyorsan threade cevap ver
```

The Socket Mode bridge should trigger a Codex run immediately. That run still uses the canonical `slack-codex-operator` workflow, replies as Rox in-thread or DM, updates `.codex/slack-codex-operator/state.json`, and writes event logs under `.codex/slack-codex-operator/events/`.

Keep the existing `rox-slack-codex-operator` heartbeat enabled as a slower fallback if desired. The heartbeat should not be tightened to one minute when the event bridge is running; it exists to catch missed events and active-thread edge cases.

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

If Slack immediately posts an `Agent failed before reply` message, re-check that no stale external Slack worker is subscribed as Rox. The intended local bridge is `npm run slack:rox:events -- listen`.

## Failure Modes

- `missing_scope`: Reinstall the app after adding scopes in the manifest.
- `not_in_channel` or `channel_not_found`: Invite `Rox` to the channel or verify the configured channel name.
- `invalid_auth`: The token is wrong, revoked, or from another workspace.
- `missing token`: Store the `xoxb-` bot token and `xapp-` app-level token in Keychain using the commands above.
- `apps.connections.open failed: not_allowed_token_type`: The event bridge received a bot token instead of an app-level `xapp-` token.
- `apps.connections.open failed: missing_scope`: Create or rotate the app-level token with `connections:write`.
- `socket_url_present=false` or repeated connect errors: Confirm Socket Mode is enabled in the Slack app and reinstall/apply the manifest changes.
