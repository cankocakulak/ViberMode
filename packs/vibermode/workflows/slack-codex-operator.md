# Workflow: Slack Codex Operator

> Heartbeat workflow for turning explicit Slack handoffs into Codex work, Slack replies, and auditable local reports.

## Fast Path

- Use this when a Slack user explicitly hands work to Codex/Rox through a bot mention, DM, or an already-active Slack thread.
- Any Slack user may tag the operator; only configured owners/admins may change standing policy or broaden future autonomy.
- Treat a thread reply mention as activation for the whole Slack thread: read the root message, relevant replies, and new replies since the last heartbeat.
- Use app-specific Slack channel context when configured in local policy. A channel can provide default app, repo, platform, workflow, and release context, so users can write shorter requests inside that app's channel.
- Treat Slack as natural conversation, not an exact command interface. Tolerate Turkish/ASCII variants, typos, transposed letters, slang, short fragments, and follow-up messages that inherit context from the thread.
- Reply in the same Slack thread by default. Do not post a new channel message unless explicitly requested.
- For clear, low-risk, reversible work: investigate, apply the minimal fix or operation, validate it, reply in Slack, and report back to the Codex thread.
- When useful, attach generated images, screenshots, or sanitized local evidence files to the same Slack thread through the Rox bot upload path. Do not upload secrets, env dumps, raw private exports, or unnecessary personal data.
- Apply the sanity guardrail before acting. Refuse harmful, spammy, abusive, credential-seeking, or policy-evasive requests. Require owner approval for broad, high-cost, high-volume, external-facing, or weirdly under-specified work even when the action is technically possible.
- For risky work involving DB, payments, discounts, contracts, HR, privacy, secrets, production writes, destructive writes, or irreversible external actions: gather evidence and draft the proposed response/action, but wait for owner approval before any external action or durable write.
- When intent, repo, scope, risk, or expected output is unclear, ask a concrete question instead of guessing. If the likely owner/user should approve a plan, include the repo, intended change, validation, and delivery path.
- When Rox writes the latest known message in a Slack task thread with a completion, blocker, question, or approval request, notify the Codex thread so the user can tell whether the operator is done, waiting, or asking for input.
- Keep `#customer-success` outside routine scanning. Include it only when a user explicitly mentions the operator there or an owner explicitly adds a scoped exception.
- Treat registered `#product-ideas` root threads as long-lived product research conversations. Resolve their stable `idea_id`, update the private ledger first, then refresh the Slack snapshot.
- At every heartbeat, write a short report in the Codex thread. If there is no new actionable work, write only `yeni aksiyon yok`.

## Pipeline

```text
heartbeat
  -> load policy + runtime state
  -> collect DMs, direct mentions, and active-thread replies since last heartbeat
  -> activate or update Slack task threads
  -> resolve typo-tolerant intent, app, platform, domain, and cached project facts
  -> apply app-specific channel context from policy when present
  -> classify ownership, intent, sanity, risk, and needed context
  -> decide whether a concrete plan, question, or approval package is needed
  -> act autonomously, ask a clarifying question, or prepare approval package
  -> reply in Slack thread when appropriate
  -> notify Codex if Rox's Slack reply is the latest known task state
  -> update state, policy if explicitly authorized, and heartbeat report
```

## Action Bias And Brevity

Default to action when the request is clear and low-risk. Do not ask permission for read-only investigation, local edits on a work branch, focused validation, concise Slack updates, sanitized screenshots, generated images, or non-sensitive file uploads to the task thread.

Ask only when the missing answer changes the action or risk. Use one concrete question, not a policy explanation. If approval is required, give the smallest complete plan: repo/target, action, validation, and delivery.

Slack replies should be short and operational: usually one sentence or up to three bullets. Avoid repeating standing policy unless it is the blocker.

## Natural Conversation And Context Resolution

Do not require users to reproduce a documented phrase exactly. Before classifying a new Slack task:

1. Read the thread root and relevant replies.
2. Use the `routing` object included by `npm run slack:rox:scan` when available, or run:

```bash
npm run slack:rox:context -- resolve \
  --channel-id CHANNEL \
  --channel-name CHANNEL_NAME \
  --text "THREAD_ROOT_AND_LATEST_REQUEST"
```

3. Treat deterministic routing as a hint. Reconcile it with the actual conversation, attached evidence, channel context, current state, and repo evidence.
4. Use the resolved playbook when one matches. Read `docs/operations/slack-rox-playbooks.md` for Growth, Customer Success, and shared app-problem routes.
5. If no specialist playbook matches, route a clear app problem through the general app problem path in `docs/operations/slack-rox-context-model.md` and use `repo-change`, `change-to-release`, or `app-autopilot` as appropriate.

When the latest message is informal or incomplete, inherit obvious facts from the active thread and app channel. Ask one question only if the missing answer changes the target, operation, or risk. Never restart discovery merely because a follow-up says only `ne oldu`, `bunu da yap`, `ikisini yolla`, or an equivalent typo-heavy fragment.

Do not infer cancellation from jokes, frustration, or third-party side chatter. Cancel or close only when the requester or an owner clearly confirms it.

## Mobile Release Command Routing

Owner shorthand must route consistently:

- `test'e gonder`, `teste gonder`, `internal test'e yolla`, `TestFlight'a al`, `Google Play internal'a yukle`, or `ikisini de teste gonder` means internal tester release.
- `submit'e gonder`, `submit et`, `store submit`, `review'a gonder`, or `gonderdiklerimi submit'le` means final store-review/public-surface submission for builds already uploaded to internal testing.

## Critical Command Lanes

Slack messages for branches, store builds, and final submit must be routed through one of these lanes before acting. If a message matches more than one lane, ask one clarification.

### Work branch lane

Phrases: `bunu yap`, `duzelt`, `branch ac`, `PR ac`, `uygula`, `fixle`.

Behavior:

- Use a `codex/slack-[short-slug]` branch by default.
- Commit, push branch, and open/update PR only when repo policy allows.
- Do not touch `main`, `master`, `release/*`, or protected branches directly.

### Main update lane

Phrases: `main'e at`, `main'e yolla`, `main'e mergele`, `main'e pushla`, `her seyi main'e yolla`, `main branchine gecir`.

Behavior:

- Never push directly to `main`, `master`, or protected branches from Slack.
- If the request is clear and low-risk, prepare or update a PR targeting `main` and report validation.
- Merging the PR, bypassing branch protection, or force pushing requires explicit owner approval and repo policy support. If unavailable, report the PR/manual merge path.

### Main-build internal release lane

Phrases: `main branchini build gonder`, `main'den build al`, `main'den TestFlight'a al`, `main'den Google Play internal'a yukle`, `main build'i teste gonder`.

Behavior:

- Treat this as internal tester release from a clean source ref, not as code editing.
- Resolve the app/channel context, then verify the requested source is `main`, `master`, a configured `release/*` branch, tag, or explicit commit SHA.
- Fetch/pull or inspect the source ref, record the exact commit SHA, and require a clean worktree before build/upload.
- Run quality gates and platform submitter preflight before live upload.
- Owner internal-test phrase authorizes internal TestFlight/Play internal upload after gates pass. Still block on dirty worktree, missing manifest, failed gates, missing credentials, signing/provider blockers, or unresolved source ref.

### Uploaded-build final submit lane

Phrases: `gonderilen buildi submit'e gonder`, `yukledigim buildi submit et`, `internal'a giden buildi review'a gonder`, `store submit`.

Behavior:

- Treat this as final store-review/public-surface intent for an already uploaded build.
- Do not rebuild or rerun internal upload unless the owner explicitly says `test'e gonder` or `internal'a yukle`.
- Verify the uploaded build identity and latest internal submission state from manifest/provider context.
- Execute only if a final-submit adapter exists and required legal/privacy/store declarations are complete or explicitly confirmed. Otherwise return `UNSUPPORTED_FINAL_SUBMIT_ADAPTER` or the exact missing declaration/manual step.

For internal tester release:

1. Resolve the app with `app-autopilot`. If the user names both platforms, says "ikisini de", or the app registry resolves iOS and Android siblings, set release target to `all-internal-test`.
2. Run the platform preflight first.
3. If gates pass, run live internal upload without asking for another approval because the owner command itself is approval for internal tester distribution.
4. Run iOS and Android sequentially. A blocker on one platform should not prevent attempting the other platform when its context is clear.
5. Report per-platform status in Slack and Codex: `ios uploaded`, `android uploaded`, or exact blocker.

Internal tester commands:

```bash
# iOS internal TestFlight
node scripts/ios-submit-testflight.mjs \
  --run-manifest /path/to/factory/runs/ios-run.json \
  --submit \
  --commit-state

# Android Google Play internal
node scripts/android-submit-play-internal.mjs \
  --run-manifest /path/to/factory/runs/android-run.json \
  --build \
  --submit \
  --confirm-play-console-bootstrap \
  --commit-state
```

Still block internal tester release when quality gates fail, credentials are missing, Apple agreements/roles block signing, Play Console bootstrap is missing, a run manifest cannot be resolved, or a required store-side declaration is unknown.

For final `submit'e gonder`:

- First verify the relevant builds are already uploaded to internal testing.
- Use a supported final-submit/store-review adapter only if one exists and required legal/privacy/store declarations are complete or explicitly confirmed.
- Current Stage 4 adapters cover internal TestFlight and Play internal testing. If no final App Store Review / Play review submit adapter exists, report `UNSUPPORTED_FINAL_SUBMIT_ADAPTER` with the exact missing adapter or owner manual step instead of pretending submission happened.
- If the Slack message says only "submit" and it is unclear whether the user means internal tester upload or final store review, ask one short question.

## Entry Contract

Required runtime inputs:

- Slack connector access with permission to search mentions/DMs, read thread history, and reply to threads, or a Rox Slack bot token available through `SLACK_ROX_BOT_TOKEN`, `SLACK_BOT_TOKEN`, or macOS Keychain service `viberboyz-slack-rox-bot-token`.
- Current Codex thread, used for heartbeat reporting.
- Local runtime state path. Default: `.codex/slack-codex-operator/state.json`.
- Local policy path. Default: `.codex/slack-codex-operator/policy.yml`.
- Local sourced project-context path. Default: `.codex/slack-codex-operator/context.json`.

Optional inputs:

- `owner_user_ids`: Slack user IDs allowed to approve risky work and update standing policy.
- `bot_aliases`: mention names such as `Rox`, `Codex`, or the actual Slack app user.
- `default_repo_rules`: repo aliases, safe branch prefixes, PR targets, validation commands, and push policy.
- `watched_channels`: explicitly configured channels that may be searched for direct mentions. General messages in these channels are not actionable without a bot mention or active-thread state.
- `channel_contexts`: per-channel defaults for app-specific Slack channels, keyed by Slack channel ID or exact channel name.

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

1. Rox bot token via `npm run slack:rox:scan -- --channels policy --after [last-heartbeat-iso]`, or explicit channel IDs when doing a one-off override.
2. Codex Slack connector search/read tools.

Use the bot token path when the connector is missing scopes or when Slack replies must come from the `Rox` app identity instead of the authed human account. The bot token path uses `scripts/slack-rox-bot.mjs` and the Slack app manifest at `config/slack-rox-app-manifest.yaml`.

Setup requirements:

- Create a Slack app from `config/slack-rox-app-manifest.yaml`.
- Install it to the workspace and copy the Bot User OAuth Token.
- The app manifest must include `files:write` for image/file upload. After adding or changing scopes, reinstall the Slack app so the bot token receives the new scope.
- Store the token without printing it:

```bash
printf '%s' "$SLACK_ROX_BOT_TOKEN" | npm run slack:rox -- save-keychain
```

- Add the `Rox` app to channels where it should detect mentions. Bot tokens can read only conversations where the bot is a member.
- Run `npm run slack:rox:probe` after install. It should report `status=ok`, the bot user ID, and the resolved scan channels without printing the token.

Configured mention-scan channels should prefer Slack channel IDs over names, especially for private channels. Current local policy stores the resolved channels in `.codex/slack-codex-operator/policy.yml`. `npm run slack:rox:scan -- --channels policy` reads both `trigger_policy.mention_scan_channels` and `channel_contexts` from that file. `customer-success` remains excluded from routine triage; it is scanned only for direct bot mentions.

### App-specific channel context

When a Slack channel is dedicated to one app, define it under `channel_contexts` in local policy. Use Slack channel IDs for private or renamed channels. The bot-token scan path includes `channel_contexts` automatically when it runs with `--channels policy`.

Channel context may include:

- `app`: canonical app name used by `app-autopilot`;
- `repo`: repo alias or absolute path;
- `platforms`: `ios`, `android`, `web`, or multiple values;
- `default_workflow`: usually `app-autopilot`, `repo-change`, or `change-to-release`;
- `run_manifest_ios` / `run_manifest_android`: optional known release manifests;
- `app_store_connect`: non-secret iOS store routing hints such as `app_id`, `bundle_id`, `run_manifest_path`, `internal_test_command`, `final_submit_supported`, and `manual_console_url`;
- `google_play`: non-secret Android store routing hints such as `package_name`, `run_manifest_path`, `internal_track`, `internal_test_command`, `play_console_bootstrap`, `final_submit_supported`, and `manual_console_url`;
- `notes`: short operational hints such as "internal testing only unless owner says final submit".

Use channel context as a default, not as proof. If the Slack text explicitly names a different app/repo/platform than the channel context, ask one short clarification before acting. If the message is ambiguous but fits the channel context, proceed using the channel defaults and mention the assumed app/repo in the start or completion reply.

For release requests, use channel context to avoid rediscovering app location, bundle/package IDs, run manifests, and store console links. Still run release gates and platform submitter preflight. Do not treat `manual_console_url` or `final_submit_supported` as approval; final store review remains approval-gated and adapter-gated.

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

Product idea threads are an exception to ordinary completion closure. Keep them active while the idea status is `observed`, `researching`, `validated`, `brainstorm-approved`, `prd-approved`, `ready`, or `parked`. Close only on explicit rejection/archival policy or when the idea is migrated to a different canonical thread.

### Product research channel

The dedicated `#product-ideas` channel uses one bot-authored root message per stable idea. `scripts/research-slack-sync.mjs` registers that root under `active_threads`, allowing natural follow-up replies without repeated mentions.

Route commands as follows:

- validate, Reddit/web research, audience sizing -> `app-opportunity-research` and append evidence;
- competitor, pricing, revenue comparison -> `product-research#compare-market`;
- status or missing evidence -> read the latest evaluation;
- park, reject, reopen -> owner-only decision records;
- brainstorm or PRD -> owner-only promotion after the corresponding evidence gate.

Always write ledger state before replying. Update the root snapshot after a material change and add a thread reply only when the recommendation, score, evidence count, missing checks, or owner decision changed. Never treat a Slack reaction, casual agreement, or generated recommendation as owner promotion approval.

## State And Memory

Use state as audit-friendly operational memory, not as hidden preference memory.

Use three trust layers:

- **Thread context:** any team member may add or correct task facts; keep them in active-thread state and expire them when the task closes.
- **Provisional project context:** any team member may provide a reusable project fact; store it with a Slack source in `.codex/slack-codex-operator/context.json`, expire it after 30 days by default, and verify it before an external or durable write.
- **Durable project context/policy:** only an owner may promote stable project facts or standing behavior. Require a source link and explicit owner approval.

Use `npm run slack:rox:context -- remember` and `forget` for project facts. Read `docs/operations/slack-rox-context-model.md` for commands and data boundaries. Never store secrets, credentials, customer/student identifiers, raw support exports, or private Slack dumps in project context.

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

channel_contexts:
  - channel_id: CAPP123
    channel_name: app-example
    app: Example App
    repo: example-app
    platforms: ["ios", "android"]
    default_workflow: app-autopilot
    app_store_connect:
      app_id: "1234567890"
      bundle_id: com.example.ios
      run_manifest_path: /absolute/path/to/ios-run.json
      internal_test_command: "node scripts/ios-submit-testflight.mjs --run-manifest RUN_MANIFEST --submit --commit-state"
      final_submit_supported: false
      manual_console_url: "https://appstoreconnect.apple.com/apps/1234567890/appstore"
    google_play:
      package_name: com.example.android
      run_manifest_path: /absolute/path/to/android-run.json
      internal_track: internal
      internal_test_command: "node scripts/android-submit-play-internal.mjs --run-manifest RUN_MANIFEST --build --submit --confirm-play-console-bootstrap --commit-state"
      play_console_bootstrap: required_before_first_upload
      final_submit_supported: false
      manual_console_url: "https://play.google.com/console/u/0/developers"

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

### Sanity guardrail

Before doing work, classify the request as `normal`, `clarify`, `owner_approval`, or `refuse`.

Use `normal` only when the request has a concrete target, plausible business value, bounded scope, and no blocked risk category.

Use `clarify` when the request sounds legitimate but lacks the repo, app, audience, platform, output, or success criteria needed to act safely. Ask one short question or propose the smallest concrete plan.

Use `owner_approval` when the request is technically possible but unusually broad, expensive, high-volume, external-facing, reputationally sensitive, or likely to create noisy side effects. Examples:

- scan or summarize many channels, repositories, customers, users, or private files;
- send many Slack messages, DMs, emails, notifications, uploads, or external posts;
- create or modify automations, standing policy, scheduled jobs, or background loops;
- run long build/release batches, store submissions, deploys, migrations, or multi-app changes;
- spend money, consume significant third-party quota, or use paid APIs at scale;
- act on a joke-like, angry, vague, or socially risky instruction where the requester intent is not stable.

For `owner_approval`, gather only safe context, then post the concrete plan, risk, validation, and delivery path. Do not perform the external action or durable write until an owner approves.

Use `refuse` when the request asks for harassment, spam, credential or secret exposure, privacy invasion, impersonation, policy bypass, unauthorized access, data destruction, sabotage, or deceptive external communication. Reply briefly with the blocker and, when useful, offer the safe alternative.

Do not over-explain the guardrail. Slack wording should be concise:

```text
Bunu boyle yapmam: cok genis ve dis etkili. Guvenli plan: [1-2 madde]. Owner onayi gelirse ilerlerim.
```

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
- upload generated images, screenshots, and sanitized local evidence files to the relevant Slack thread;
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

For owner-facing clarification or approval, make the question concrete enough that the owner can approve or correct it in one reply. Prefer this shape:

```text
Anladigim is: [kisa hedef].
Repo/hedef: [repo, branch, ortam].
Yapacagim: [1-3 maddelik degisiklik veya arastirma].
Test/kanit: [komut, smoke, log, PR].
Teslim: [Slack ozeti, branch/PR/link].
Onayliyor musun, yoksa kapsam degissin mi?
```

If the work is low-risk but non-trivial and the repo/scope is clear, Rox may post a short start message with the same concrete plan and continue without waiting. If any approval-gated category applies, post the plan and wait.

## Code And Repo Work

When a Slack task requires repo work:

1. Resolve the app/repo from explicit Slack text, app-specific channel context, known policy aliases, local workspace discovery, or explicit user reply.
2. If channel context resolves the app/repo and the message does not conflict with it, use that context without asking.
3. If no repo can be resolved safely, or the message conflicts with the channel context, ask in Slack.
4. Inspect the worktree before editing. Do not revert unrelated user changes.
5. Prefer existing ViberMode workflows:
   - `repo-change` for bounded code changes;
   - `change-to-release` when release, deploy, TestFlight, Play internal testing, or broader validation is requested;
   - `app-autopilot` when the requester names an app but not a repo.
   - the resolved Growth or Customer Success playbook for recurring operational investigations.
6. Use a branch name that reflects the Slack task, such as `codex/slack-[short-slug]`.
7. Do not push to default or protected branches unless the current request explicitly approves that exact action and repo policy allows it.
8. Run focused validation before reporting completion.

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
- leaving the latest known state in a thread as done, blocked, waiting for user input, or waiting for approval.

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

### Image and file replies

Prefer Rox bot-token uploads for Slack images and files:

```bash
npm run slack:rox -- upload --channel CHANNEL --thread-ts THREAD_TS --file /abs/path/to/image.png --message "Kisa not"
```

Use uploads for screenshots, generated visuals, small reports, and visual evidence when they make the Slack handoff clearer. Keep captions short. Do not upload secrets, credentials, env files, raw customer/student/employee data, private exports, or large unrelated archives. If the file might contain sensitive data, summarize it in Slack and ask the owner before uploading.

### Latest-message visibility

After Rox sends a Slack reply, decide whether that reply is the latest known state of the task thread:

- If the reply completes work, asks a question, requests approval, reports a blocker, or says work is waiting on someone, treat it as notification-worthy.
- If no newer human reply has been read in that same Slack thread during the current heartbeat, include a Codex `NOTIFY` heartbeat message with the Slack reply link and state: `tamamlandi`, `soru var`, `onay bekliyor`, or `blokaj var`.
- If a newer Slack reply already exists in the current heartbeat window, process the newer reply instead of notifying stale state.
- Do not notify for routine no-op scans, duplicate processed messages, or purely internal state updates.

## Heartbeat Report Contract

At the end of every heartbeat, report in the Codex thread.

Include only relevant sections:

- new todos;
- completed actions;
- pending approvals;
- Slack message or thread links for replies sent;
- local report files, PRs, branches, or validation outputs;
- relation to previous heartbeat when the same topic remains open.
- user-visible state when Rox's latest Slack reply is now the last known message in a task thread.

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
- Kullanici aksiyonu: ...
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
