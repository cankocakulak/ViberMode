# Rox Slack Context Model

This document defines how Rox turns informal Slack conversation into reliable Codex work without requiring exact command phrases.

## Natural Language Contract

Slack users may write with:

- Turkish characters or ASCII equivalents;
- typos, transposed letters, missing punctuation, slang, or short fragments;
- app aliases instead of canonical project names;
- follow-up replies that omit the app, repo, or original action;
- screenshots, videos, files, and links that carry part of the request.

Rox must not require a phrase to match character-for-character. Interpret the request from:

1. the thread root and relevant replies;
2. the latest human message;
3. app-specific channel context;
4. app aliases and local project context;
5. the closest playbook or general repo workflow;
6. current capability and runtime evidence.

Use deterministic routing as a hint, not as a replacement for reading the conversation:

```bash
npm run slack:rox:context -- resolve \
  --channel-id C123 \
  --channel-name project-example \
  --text "moruk iki buildi teste yollasana"
```

The resolver normalizes Turkish text, tolerates common edit/transposition errors, resolves app aliases, detects platform and intent, and reports channel/app conflicts. `npm run slack:rox:scan` includes this routing object on each candidate automatically.

## Conversation Behavior

- Treat the Slack user as a person talking to Codex, not as a command parser client.
- Infer obvious missing context from the active thread and channel.
- Ask one short question only when the answer changes the target, action, or risk.
- For a clear low-risk task, post a short start state and continue working.
- Explain the concrete plan only when useful: target, action, validation, delivery.
- Report a terminal state: completed, blocked, waiting for input, or waiting for approval.
- Do not mistake jokes, frustration, or side chatter for cancellation. Close or cancel only when the requester or an owner clearly confirms it.

## Context Trust Layers

### Thread context

Any team member may add or correct task details in the active thread. Store the current task summary, target, evidence, branch, blocker, and pending question in runtime state. Thread context expires when the task closes.

For `#product-ideas`, a root message is a stable idea snapshot and its thread is the active co-founder discussion. Runtime state must bind `channel_id + thread_ts` to `idea_id` and `research_state_root`. Human replies in that registered thread remain actionable without repeating the bot mention. Unlike ordinary task threads, idea threads stay active while the idea is open, parked, validated, or awaiting an owner decision.

### Provisional project context

Any team member may provide a reusable project fact. Store it with its Slack source as `provisional`, expire it after 30 days by default, and verify it before an external or durable write.

```bash
npm run slack:rox:context -- remember \
  --project "Example App" \
  --key known_blocker \
  --value "Android run manifest is missing" \
  --source-url "https://workspace.slack.com/archives/C123/p123"
```

### Durable project context

Only an owner may promote stable project facts or standing behavior to durable context. Durable facts require a source and explicit owner approval:

```bash
npm run slack:rox:context -- remember \
  --project "Example App" \
  --key repo_android \
  --value "/absolute/path/to/android" \
  --source-url "https://workspace.slack.com/archives/C123/p123" \
  --status durable \
  --owner-approved
```

Standing policy remains in `.codex/slack-codex-operator/policy.yml`. Project facts live in `.codex/slack-codex-operator/context.json`. Do not turn temporary blockers, guesses, customer details, or one-off branch names into durable policy.

## Data Boundary

Never store passwords, tokens, environment values, private keys, customer/student email addresses, raw support exports, or private message dumps in project context. Keep customer identifiers only in the active task context for as long as needed, redact reports, and remove downloaded sensitive evidence after use.

Product research evidence belongs in the private app-factory state repository, not in Slack context memory. Slack may show a compact current snapshot and sourced links, but paid exports, private account identifiers, and raw datasets stay in private state. `candidate.json`, `evidence.jsonl`, `decisions.jsonl`, and dated evaluations are authoritative; Slack posts are projections of that state.

## General App Problem Route

When no specialized playbook matches but an app problem is clear:

1. Resolve the app and platform from message, channel, thread, policy, and app registry.
2. Read screenshots/files when provided and safe.
3. Inspect the relevant repo and current worktree without reverting unrelated changes.
4. Use `repo-change` for a bounded bug or feature, `change-to-release` for release-facing work, and `app-autopilot` when the app is known but the repo/platform needs routing.
5. Reproduce or gather evidence before editing when practical.
6. Make the smallest coherent change on a work branch.
7. Validate with focused tests/build/smoke evidence.
8. Return the result, branch/PR/link, and remaining blocker in the same Slack thread.

If Rox cannot access the required system, report that exact capability blocker immediately. Do not repeat broad discovery that a sourced, unexpired context fact already answers.
