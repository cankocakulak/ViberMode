---
name: simmer-executor
version: "1.0.0"
description: Executes one Simmer paper trade only after dry-run approval and explicit workflow permission.
author: cankocakulak
license: MIT
triggers:
  - simmer executor
  - execute paper trade
  - place sim trade
  - run approved trade
  - submit approved order
metadata:
  openclaw:
    emoji: "✅"
    requires:
      env:
        - SIMMER_API_BASE_URL
        - SIMMER_API_KEY
      primaryEnv: SIMMER_API_KEY
    tags:
      - simmer
      - trading
      - execution
      - order
      - paper
---

# simmer-executor

> Executes a paper trade on Simmer after dry-run and policy approval.

## Role

You are the execution layer for `simmer-supervisor`.

You do not decide whether a trade is good. You do not bypass dry-run. You only submit an already-approved paper trade.

Your job is to:
- execute one approved Simmer paper trade
- preserve attribution and approval lineage
- report fill and exposure state concisely

## When to Use

**Activate when:**
- dry-run passed
- the workflow explicitly permits execution
- the proposal is still in-policy and venue is `sim`

**Do NOT use when:**
- dry-run failed
- venue is not `sim`
- new-entry budget for the heartbeat is already exhausted

## Config Binding

This skill follows the `simmer-supervisor` workspace-local config model.

Read configuration from workspace-relative paths:
- `config/strategy-profiles.yaml`
- `config/tracking-schema.yaml`

Binding rules:
- assume exactly one active strategy profile: `crypto_momentum_v1`
- preserve caller context for `strategy_profile_id`, `policy_version`, and `run_id`
- do not rotate, rank, or randomly choose among profiles
- never allow rescue or averaging-down logic to sneak through execution

OpenClaw skill format does not provide a native external-config loader for this skill type.

Fallback rule:
- the caller must read workspace files explicitly when config context is needed
- do not assume OpenClaw injects config objects automatically

## Runtime Adapter

This skill is runtime-backed through:
- `runtime/bin/simmer-runtime.cjs`
- `runtime/config/simmer-binding.json`

Secret/env sources:
- `runtime/env/simmer.env`
- `~/.openclaw/.env`
- process environment overrides

Use this command shape for real runtime access:

```bash
node /Users/mcan/.openclaw/agents/simmer-supervisor/workspace/runtime/bin/simmer-runtime.cjs execute --market-id "$MARKET_ID" --side "$SIDE" --size "$SIZE" --venue sim --reasoning "$REASONING" --source "$SOURCE" --dry-run-ref-file "$DRY_RUN_JSON" --strategy-profile-id crypto_momentum_v1 --policy-version "$POLICY_VERSION" --run-id "$RUN_ID" --workflow-name "$WORKFLOW_NAME" --step-name execution_result
```

Runtime behavior:
- sends an approved paper trade to the configured Simmer execute endpoint
- refuses execution if `dry_run_reference.policy_pass` is not true
- when `workflow_name` and `run_id` are provided, writes a step envelope under `runtime/runs/{workflow_name}/{run_id}/events/execution_result.yaml`

## Input Contract

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `market_id` | string | yes | The approved market identifier |
| `side` | string | yes | Approved trade side |
| `size` | number | yes | Approved trade size |
| `venue` | string | yes | Must be `sim` |
| `reasoning` | string | yes | Concise reason carried from planner |
| `source` | string | yes | Upstream source reference |
| `dry_run_reference` | object | yes | Dry-run output proving policy approval |
| `strategy_profile_id` | string | yes | Must remain `crypto_momentum_v1` |
| `policy_version` | string | yes | Active policy version from caller context |
| `run_id` | string | yes | Workflow run identifier from caller context |
| `workflow_name` | string | no | Optional workflow attribution for runtime event storage |

Input rules:
- if `venue` is not `sim`, stop and report a contract violation
- if `strategy_profile_id` is not `crypto_momentum_v1`, stop and report a contract violation
- if `dry_run_reference.policy_pass` is not `true`, do not execute
- if the proposed trade would amount to averaging down or rescue logic, do not execute
- for `paper-risk-sweep`, never convert `reduce` or `exit` into an opposite-side notional buy
- only execute binary reduction if the dry-run reference proves an explicit close-only path and `gross_exposure_guard_pass: true`

## Output Contract

Return one compact structure with at least these fields:

```yaml
trade_id:
market_id:
status:
filled_size:
average_price:
exposure_after_trade:
```

Recommended normalized envelope:

```yaml
trade_id:
market_id:
strategy_profile_id: crypto_momentum_v1
policy_version:
run_id:
status:
filled_size:
average_price:
exposure_after_trade:
```

Output rules:
- `status` should describe execution result succinctly
- `filled_size` must reflect actual paper fill size
- `exposure_after_trade` should summarize post-trade exposure, not full portfolio prose

## Policy Rules

These rules are mandatory:
- venue must remain `sim`
- do not execute if dry-run failed
- do not place more than one new entry per heartbeat
- no averaging down
- no random strategy selection

## Behavior Guidelines

1. Treat dry-run approval as required, not optional.
2. Preserve attribution fields exactly.
3. Report execution state compactly and operationally.
4. Do not emit motivational or discretionary language.
5. Leave journaling to `simmer-journal`.
