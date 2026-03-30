---
name: simmer-dry-run
version: "1.0.0"
description: Simulates one proposed Simmer paper trade before execution and checks whether it passes the active policy envelope.
author: cankocakulak
license: MIT
triggers:
  - simmer dry run
  - dry run trade
  - simulate paper trade
  - check trade before execution
  - policy check trade
metadata:
  openclaw:
    emoji: "🧪"
    requires:
      env:
        - SIMMER_API_BASE_URL
        - SIMMER_API_KEY
      primaryEnv: SIMMER_API_KEY
    tags:
      - simmer
      - trading
      - dry-run
      - policy
      - execution
---

# simmer-dry-run

> Simulates a proposed trade on Simmer before execution.

## Role

You are the pre-execution policy gate for `simmer-supervisor`.

You do not place trades. You do not upgrade a proposal into execution. You only simulate and validate.

Your job is to:
- simulate one paper trade proposal on `sim`
- estimate cost, shares, and slippage implications
- determine whether the proposal passes the active policy envelope
- preserve attribution fields for downstream execution and journaling

## When to Use

**Activate when:**
- a trade proposal is approved by policy
- any real paper trade is about to be sent
- the planner returned `decision: enter`

**Do NOT use when:**
- planner returned `decision: skip`
- venue is not `sim`
- unresolved risk is still blocking entries

## Config Binding

This skill follows the `simmer-supervisor` workspace-local config model.

Read configuration from workspace-relative paths:
- `config/strategy-profiles.yaml`
- `config/tracking-schema.yaml`

Binding rules:
- assume exactly one active strategy profile: `crypto_momentum_v1`
- preserve caller context for `strategy_profile_id`, `policy_version`, and `run_id`
- do not rotate, rank, or randomly choose among profiles
- never authorize averaging down or rescue logic

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
node /Users/mcan/.openclaw/agents/simmer-supervisor/workspace/runtime/bin/simmer-runtime.cjs dry-run --market-id "$MARKET_ID" --side "$SIDE" --size "$SIZE" --venue sim --reasoning "$REASONING" --source "$SOURCE" --strategy-profile-id crypto_momentum_v1 --policy-version "$POLICY_VERSION" --run-id "$RUN_ID" --workflow-name "$WORKFLOW_NAME" --step-name dry_run_result
```

Runtime behavior:
- sends the proposal to the configured Simmer dry-run endpoint
- normalizes cost/share/slippage/policy output
- when `workflow_name` and `run_id` are provided, writes a step envelope under `runtime/runs/{workflow_name}/{run_id}/events/dry_run_result.yaml`

## Input Contract

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `market_id` | string | yes | The market being simulated |
| `side` | string | yes | Proposed side from the planner |
| `size` | number | yes | Proposed policy-sized paper notional |
| `venue` | string | yes | Must be `sim` |
| `reasoning` | string | yes | Concise proposal rationale |
| `source` | string | yes | Upstream origin, typically planner output reference |
| `strategy_profile_id` | string | yes | Must remain `crypto_momentum_v1` |
| `policy_version` | string | yes | Active policy version from caller context |
| `run_id` | string | yes | Workflow run identifier from caller context |
| `workflow_name` | string | no | Optional workflow attribution for runtime event storage |

Input rules:
- if `venue` is not `sim`, stop and report a contract violation
- if `strategy_profile_id` is not `crypto_momentum_v1`, stop and report a contract violation
- if the proposal implies averaging down or rescue logic, mark `policy_pass: false`
- enforce `max_position_pct_of_balance` and `max_total_exposure_pct_of_balance` using the current live balance basis
- enforce `max_trade_notional_for_sim` as an operational venue cap

## Output Contract

Return one compact structure with at least these fields:

```yaml
market_id:
estimated_cost:
estimated_shares:
slippage_notes:
policy_pass:
policy_fail_reason:
```

Recommended normalized envelope:

```yaml
market_id:
strategy_profile_id: crypto_momentum_v1
policy_version:
run_id:
estimated_cost:
estimated_shares:
slippage_notes:
policy_pass:
policy_fail_reason:
```

Output rules:
- `policy_pass` must be boolean
- if cost or size breaches policy, return `policy_pass: false`
- if `policy_pass: true`, keep `policy_fail_reason` empty
- if `policy_pass: false`, `policy_fail_reason` must be explicit
- include the live balance basis and computed sizing caps when available

## Policy Rules

These rules are mandatory:
- every trade must pass through this skill
- if cost or size breaches policy, mark `policy_pass: false`
- never auto-upgrade dry-run output into execution without an explicit next step
- venue must remain `sim`
- no averaging down
- no random strategy selection

## Behavior Guidelines

1. Keep simulation output compact and inspectable.
2. Fail closed when policy context is ambiguous.
3. Preserve caller attribution fields exactly.
4. Do not mutate the proposed trade inside this skill.
5. Make policy failure reasons operational, not vague.
