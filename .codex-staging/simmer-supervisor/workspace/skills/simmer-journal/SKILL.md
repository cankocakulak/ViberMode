---
name: simmer-journal
version: "1.0.0"
description: Records compact, attributable Simmer heartbeat and trade decisions aligned to the tracking schema and journal entry template.
author: cankocakulak
license: MIT
triggers:
  - simmer journal
  - journal trade decision
  - record heartbeat decision
  - write trade log
  - log paper trade
metadata:
  openclaw:
    emoji: "📝"
    tags:
      - simmer
      - trading
      - journal
      - tracking
      - audit
---

# simmer-journal

> Writes a concise local record of each heartbeat or risk decision.

## Role

You are the attribution and audit layer for `simmer-supervisor`.

You do not plan trades. You do not execute trades. You record what happened in a compact, inspectable structure.

Your job is to:
- persist one attributable decision record
- align the record to `tracking-schema.yaml`
- stay consistent with `templates/journal-entry.yaml`
- capture both executions and intentional skips

## When to Use

**Activate when:**
- a heartbeat ends
- a risk sweep exits or reduces exposure
- a strong candidate is intentionally skipped
- a trade was executed and must be recorded

**Do NOT use when:**
- there is no concrete decision outcome to record
- required attribution fields are missing

## Config Binding

This skill follows the `simmer-supervisor` workspace-local config model.

Read configuration from workspace-relative paths:
- `config/tracking-schema.yaml`

Reference template for record shape:
- `/Users/mcan/ViberMode/initiatives/simmer-paper-trading/templates/journal-entry.yaml`

Binding rules:
- preserve caller context for `strategy_profile_id`, `policy_version`, `run_id`, and `workflow_name`
- do not rotate, rank, or randomly choose among profiles
- keep entries short and inspectable

OpenClaw skill format does not provide a native external-config loader for this skill type.

Fallback rule:
- the caller must read workspace files explicitly when config context is needed
- do not assume OpenClaw injects config objects automatically

## Runtime Storage

This skill writes to the canonical runtime storage convention:
- journals: `runtime/journals/YYYY/MM/DD/{workflow_name}/`
- run events: `runtime/runs/{workflow_name}/{run_id}/events/`

Runtime writer:
- `runtime/bin/simmer-runtime.cjs write-journal`

Use this command shape for real runtime writes:

```bash
node /Users/mcan/.openclaw/agents/simmer-supervisor/workspace/runtime/bin/simmer-runtime.cjs write-journal --payload-file "$JOURNAL_JSON"
```

The payload must already align with:
- `config/tracking-schema.yaml`
- `/Users/mcan/ViberMode/initiatives/simmer-paper-trading/templates/journal-entry.yaml`

## Input Contract

Provide a compact journal record aligned with the template and tracking schema.

Required attribution fields:
- `run_id`
- `workflow_name`
- `strategy_profile_id`
- `policy_version`

Expected input shape:

```yaml
decision_timestamp:
run_id:
workflow_name:
strategy_profile_id:
policy_version:
market_id:
trade_id:
position_id:
action:
side:
size:
confidence:
entry_reason:
exit_reason:
skip_reason:
thesis:
invalidation:
result:
realized_pnl:
unrealized_pnl:
portfolio_state:
```

Input rules:
- if `strategy_profile_id` is not `crypto_momentum_v1`, stop and report a contract violation
- if any required attribution field is missing, stop and report the missing field
- align field names to `journal-entry.yaml` and `tracking-schema.yaml`
- allow `trade_id` or `position_id` to be null for skip records, but not silently omitted

## Output Contract

Return a compact structure with at least:

```yaml
journal_path:
entry_id:
```

Recommended normalized envelope:

```yaml
journal_path:
entry_id:
strategy_profile_id: crypto_momentum_v1
policy_version:
run_id:
workflow_name:
```

## Record Rules

These rules are mandatory:
- log skips as well as executions
- always include attribution metadata for workflow and strategy profile
- keep entries short and inspectable
- avoid free-form long essays

Minimum record expectations:
- include required attribution fields from the tracking schema
- preserve `portfolio_state`
- preserve explicit `skip_reason` when action is skipped
- preserve `entry_reason` or `exit_reason` when relevant

## Behavior Guidelines

1. Prefer schema stability over expressive prose.
2. Keep records compact enough for later weekly review.
3. Preserve caller context exactly.
4. Do not invent missing economics such as PnL.
5. Produce an inspectable path and entry identifier for downstream review.
