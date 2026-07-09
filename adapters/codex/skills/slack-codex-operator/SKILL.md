---
name: "viber-slack-codex-operator"
description: "Use when Codex should process explicit Slack handoffs, mentions, DMs, or active Slack threads as an operational heartbeat: classify tasks, take low-risk actions, ask clarifying questions, prepare approval-gated responses, update auditable policy/state, reply in Slack threads, and report back to the Codex thread."
---

# Slack Codex Operator

Read and follow the full workflow instructions at `../viber-mode/packs/vibermode/workflows/slack-codex-operator.md`.

Use this skill for Slack-driven Codex/Rox operation, especially heartbeat tasks that say to scan Slack mentions, DMs, or active threads since the previous run.

Core rules:

- Any Slack user may activate the operator by mentioning it or sending a DM.
- A mention inside a thread activates the whole thread; read the root message and relevant replies, then keep following new replies until the thread closes.
- Reply in the same Slack thread by default.
- For clear, low-risk, reversible work, do the research or minimal fix, validate it, then write a short Slack reply and a heartbeat report.
- For DB, payment, discount, contract, HR, privacy, secrets, production, destructive, or irreversible work, gather evidence and draft the response/action but wait for owner approval.
- Only configured owners/admins may create or broaden durable standing policy.
- Keep `#customer-success` out of routine scanning unless explicitly requested for a specific mention/thread.
- End no-op heartbeats with exactly `yeni aksiyon yok`.

Preferred local state:

- `.codex/slack-codex-operator/policy.yml`
- `.codex/slack-codex-operator/state.json`
- `.codex/slack-codex-operator/reports/`
