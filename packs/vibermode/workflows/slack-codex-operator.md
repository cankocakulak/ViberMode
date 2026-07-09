# Workflow: Slack Codex Operator

> Heartbeat workflow for turning explicit Slack handoffs into Codex work, Slack replies, and auditable local reports.

## Fast Path

- Use this when a Slack user explicitly hands work to Codex/Rox through a bot mention, DM, or an already-active Slack thread.
- Any Slack user may tag the operator; only configured owners/admins may change standing policy or broaden future autonomy.
- Treat a thread reply mention as activation for the whole Slack thread: read the root message, relevant replies, and new replies since the last heartbeat.
- Reply in the same Slack thread by default. Do not post a new channel message unless explicitly requested.
- For clear, low-risk, reversible work: investigate, apply the minimal fix or operation, validate it, reply in Slack, and report back to the Codex thread.
- For risky work involving DB, payments, discounts, contracts, HR, privacy, secrets, production writes, destructive writes, or irreversible external actions: gather evidence and draft the proposed response/action, but wait for owner approval before any external action or durable write.
- Keep `#customer-success` outside routine scanning. Include it only when a user explicitly mentions the operator there or an owner explicitly adds a scoped exception.
- At every heartbeat, write a short report in the Codex thread. If there is no new actionable work, write only `yeni aksiyon yok`.

## Pipeline

```text
heartbeat
  -> load policy + runtime state
  -> collect DMs, direct mentions, and active-thread replies since last heartbeat
  -> activate or update Slack task threads
  -> classify ownership, intent, risk, and needed context
  -> act autonomously, ask a clarifying question, or prepare approval package
  -> reply in Slack thread when appropriate
  -> update state, policy if explicitly authorized, and heartbeat report
```

## Entry Contract

Required runtime inputs:

- Slack connector access with permission to search mentions/DMs, read thread history, and reply to threads, or a Rox Slack bot token available through `SLACK_ROX_BOT_TOKEN`, `SLACK_BOT_TOKEN`, or macOS Keychain service `viberboyz-slack-rox-bot-token`.
- Current Codex thread, used for heartbeat reporting.
- Local runtime state path. Default: `.codex/slack-codex-operator/state.json`.
- Local policy path. Default: `.codex/slack-codex-operator/policy.yml`.

Optional inputs:

- `owner_user_ids`: Slack user IDs allowed to approve risky work and update standing policy.
- `bot_aliases`: mention names such as `Rox`, `Codex`, or the actual Slack app user.
- `default_repo_rules`: repo aliases, safe branch prefixes, PR targets, validation commands, and push policy.
- `watched_channels`: explicitly configured channels that may be searched for direct mentions. General messages in these channels are not actionable without a bot mention or active-thread state.

## Trigger Model

### Valid triggers

- Direct Slack DM to the operator.
- Direct bot mention in a channel message.
- Direct bot mention in a thread reply under someone else's message.
- New reply in a Slack thread already tracked as active by `channel_id + thread_ts`.
- Owner-created automation heartbeat that explicitly asks the workflow to process pending Slack tasks.

### Non-triggers

- General channel activity without a direct bot mention.
- Messages in `#customer-success` unless they include a direct bot mention or an owner has created a scoped exception.
- Old messages already marked processed in state.
- A user asking another human to do work without tagging the operator.

## Rox Bot Token Path

Prefer the first available Slack access path in this order:

1. Rox bot token via `npm run slack:rox:scan -- --channels [configured-channel-ids] --after [last-heartbeat-iso]`.
2. Codex Slack connector search/read tools.

Use the bot token path when the connector is missing scopes or when Slack replies must come from the `Rox` app identity instead of the authed human account. The bot token path uses `scripts/slack-rox-bot.mjs` and the Slack app manifest at `config/slack-rox-app-manifest.yaml`.

Setup requirements:

- Create a Slack app from `config/slack-rox-app-manifest.yaml`.
- Install it to the workspace and copy the Bot User OAuth Token.
- Store the token without printing it:

```bash
printf '%s' "$SLACK_ROX_BOT_TOKEN" | npm run slack:rox -- save-keychain
```

- Add the `Rox` app to channels where it should detect mentions. Bot tokens can read only conversations where the bot is a member.
- Run `npm run slack:rox:probe` after install. It should report `status=ok`, the bot user ID, and the resolved scan channels without printing the token.

Configured mention-scan channels should prefer Slack channel IDs over names, especially for private channels. Current local policy stores the resolved channels in `.codex/slack-codex-operator/policy.yml`. `customer-success` remains excluded from routine triage; it is scanned only for direct bot mentions.

### Thread activation

When the operator is mentioned in a thread reply:

1. Use the thread root timestamp as `thread_ts`.
2. Read the root message and relevant replies before deciding what the user is asking.
3. Store the active task under `team_id + channel_id + thread_ts`.
4. Continue reading new replies in that thread on future heartbeats until it is closed, even if the later replies do not mention the bot.

Close an active thread when:

- the owner or requester says the task is done, closed, cancelled, or no longer needed;
- the operator completed the work and there are no pending approvals or unanswered questions;
- the thread has timed out according to policy and no durable action is pending.

## State And Memory

Use state as audit-friendly operational memory, not as hidden preference memory.

Recommended state shape:

```json
{
  "last_heartbeat_at": "2026-07-08T12:00:00Z",
  "processed_message_ids": ["T:C:1751970000.000000"],
  "active_threads": {
    "T:C:1751970000.000000": {
      "channel_id": "C123",
      "thread_ts": "1751970000.000000",
      "root_message_ts": "1751970000.000000",
      "requester_user_id": "U123",
      "owner_user_id": "UOWNER",
      "status": "active",
      "risk": "low",
      "summary": "Investigate staging 500 in control-center login",
      "repo": "control-center",
      "branch": "codex/slack-control-center-login-500",
      "pending_approval": null,
      "last_slack_reply_ts": "1751970100.000000"
    }
  }
}
```

Recommended policy shape:

```yaml
owners:
  - slack_user_id: UOWNER
    name: mert

bot_aliases:
  - Rox
  - Codex

trigger_policy:
  allow_anyone_to_mention: true
  routine_channel_scan: false
  excluded_routine_channels:
    - customer-success

standing_rules:
  - id: control-center-prs
    source: slack://channel/thread
    created_by: UOWNER
    scope:
      repos: ["control-center"]
      actions: ["create_branch", "commit", "push_branch", "open_pr"]
    permission: allowed_without_reconfirming
    limits:
      - no direct push to default or protected branches
      - no production deploy
      - no secrets, DB, payment, discount, contract, HR, privacy, or destructive writes
```

Policy updates are durable writes. Apply a policy update only when:

- the message is from an owner/admin;
- the instruction is explicit enough to convert into a narrow standing rule;
- the rule does not weaken hard stops around secrets, production, privacy, HR, payment, or destructive writes;
- the update is reported in the Slack thread and heartbeat report with a source link.

If the requested policy update is broad or ambiguous, draft the proposed rule and ask for confirmation.

## Risk Policy

### Autonomous low-risk actions

Proceed without extra approval when the task is clear, scoped, reversible, and allowed by current policy.

Examples:

- read logs, code, docs, PRs, and Slack thread context;
- ask a clarifying Slack question;
- make a local code fix on a new branch;
- run tests, linters, builds, and local smoke checks;
- commit to a work branch;
- push a non-protected branch when repo policy allows it;
- open or update a PR when repo policy allows it;
- make a short Slack reply summarizing findings, blockers, or completed work.

For these tasks, do the work first when enough context exists, then write back:

```text
Yaptim: branch/PR link, validation result, remaining blocker if any.
```

### Approval-gated actions

Do not perform external action or durable write without owner approval when the task touches:

- production DB or data mutations;
- payments, refunds, discounts, billing, subscriptions, or invoices;
- contracts, legal commitments, vendor terms, or official policy statements;
- HR, compensation, hiring, termination, performance, or sensitive personnel matters;
- privacy, personal data export/deletion, student records, coach records, or credential handoff;
- secrets, tokens, environment values, private keys, or auth handoff;
- destructive writes, deletes, migrations, force-pushes, deploys, or irreversible external API changes.

For approval-gated tasks:

1. Gather evidence.
2. Prepare the exact proposed action or Slack reply.
3. State the risk and required approval.
4. Wait for owner approval before acting.

### Clarification-needed actions

Ask in the Slack thread when:

- the repo, environment, target branch, or desired outcome is unclear;
- multiple plausible owners or systems are involved;
- the operator can investigate but not safely infer the intended write;
- the user asks for "push it" or "ship it" without a known destination and no standing rule covers the repo.

## Code And Repo Work

When a Slack task requires repo work:

1. Resolve the repo from the Slack context, known policy aliases, local workspace discovery, or explicit user reply.
2. If no repo can be resolved safely, ask in Slack.
3. Inspect the worktree before editing. Do not revert unrelated user changes.
4. Prefer existing ViberMode workflows:
   - `repo-change` for bounded code changes;
   - `change-to-release` when release, deploy, TestFlight, Play internal testing, or broader validation is requested;
   - `app-autopilot` when the requester names an app but not a repo.
5. Use a branch name that reflects the Slack task, such as `codex/slack-[short-slug]`.
6. Do not push to default or protected branches unless the current request explicitly approves that exact action and repo policy allows it.
7. Run focused validation before reporting completion.

## Calendar And Meeting Handling

If Slack clearly directs the operator/user to handle a calendar invite or meeting:

- Find the existing event and RSVP only when the event is unambiguous and policy allows it.
- If the event is missing, ambiguous, or requires creating a new meeting, propose the calendar action and wait.
- Do not create meetings from vague Slack mentions.

## Slack Reply Policy

Default reply location:

- same Slack thread as the trigger;
- DM thread for DM triggers;
- never a new public channel message unless explicitly requested.

Reply when:

- starting non-trivial work that may take time;
- asking a clarifying question;
- completing an autonomous action;
- preparing an approval request;
- updating a durable standing rule.

Keep Slack replies short and operational:

```text
Bakiyorum. Thread root + son cevaplari okudum; control-center staging login 500 olarak ele aliyorum.
```

```text
PR hazir: [link]. Test: npm test pass. Deploy/merge icin onay bekliyorum.
```

```text
Bu payment/discount etkiliyor. Kanitlari topladim, onerilen cevap: "...". Onay vermeden aksiyon almiyorum.
```

## Heartbeat Report Contract

At the end of every heartbeat, report in the Codex thread.

Include only relevant sections:

- new todos;
- completed actions;
- pending approvals;
- Slack message or thread links for replies sent;
- local report files, PRs, branches, or validation outputs;
- relation to previous heartbeat when the same topic remains open.

No-op report:

```text
yeni aksiyon yok
```

For non-empty reports, use this concise shape:

```text
Slack heartbeat:
- Yeni todo: ...
- Tamamlanan: ...
- Onay bekleyen: ...
- Slack yanitlari: ...
- Lokal rapor: ...
```

## Local Reports

When the heartbeat does meaningful work, write a local report before the final Codex summary:

```text
.codex/slack-codex-operator/reports/YYYY-MM-DDTHH-mm-ssZ.md
```

The report should include:

- heartbeat time window;
- processed Slack threads;
- task classification and risk;
- actions taken;
- approvals requested;
- links to Slack messages, branches, PRs, commits, and validation evidence.

Do not store secrets, full private message dumps, credentials, or unnecessary personal data in reports.

## Output Contract

Every run ends with one of:

- `yeni aksiyon yok`
- a concise heartbeat report in the Codex thread
- a blocker report that names the missing connector, missing permission, ambiguous repo, or approval required

If the operator sent Slack messages, include their links when available.
