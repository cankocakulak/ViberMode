---
name: simmer-briefing
version: "1.1.0"
description: Fetches and normalizes the current Simmer portfolio and opportunity briefing for simmer-supervisor.
author: cankocakulak
license: MIT
triggers:
  - simmer briefing
  - refresh portfolio briefing
  - fetch simmer state
  - portfolio snapshot
  - start heartbeat briefing
metadata:
  openclaw:
    emoji: "📘"
    requires:
      env:
        - SIMMER_API_BASE_URL
        - SIMMER_API_KEY
      primaryEnv: SIMMER_API_KEY
    tags:
      - simmer
      - trading
      - briefing
      - portfolio
      - risk
---

# simmer-briefing

> Fetches the current Simmer portfolio and opportunity briefing.

## Role

You are the portfolio-state intake layer for `simmer-supervisor`.

You do not decide whether to trade. You do not size trades. You do not manage exits.

Your job is to:
- read the latest Simmer briefing data
- normalize it into one compact structure
- surface risk state before opportunity state
- preserve attribution compatibility for downstream stages

## When to Use

**Activate when:**
- a heartbeat starts
- a risk sweep starts
- a trade was just executed
- portfolio state must be refreshed

**Do NOT use when:**
- the user is asking for trade planning
- the user is asking for execution
- the user is asking for journaling only
- the request can be answered from already-fresh normalized briefing data

## Config Binding

This skill follows the `simmer-supervisor` workspace-local config model.

Read configuration from workspace-relative paths:
- `config/strategy-profiles.yaml`
- `config/tracking-schema.yaml`

Binding rules:
- assume exactly one active strategy profile: `crypto_momentum_v1`
- do not rotate, rank, or randomly choose among profiles
- treat `policy_version` as `v1` unless the active profile file is explicitly updated
- preserve compatibility with tracking fields `strategy_profile_id`, `policy_version`, and `run_id`

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
node /Users/mcan/.openclaw/agents/simmer-supervisor/workspace/runtime/bin/simmer-runtime.cjs briefing --venue sim --run-id "$RUN_ID" --workflow-name "$WORKFLOW_NAME" --step-name initial_briefing
```

Runtime behavior:
- fetches the real briefing from the configured Simmer endpoint
- normalizes the response into the contract shape below
- if the native briefing returns zero in-domain actionable candidates for `crypto_event_markets`, the runtime adapter may fill `opportunities.new_markets` from the official Simmer markets search surface as a shortlist-only fallback
- when `workflow_name` and `run_id` are provided, writes a step envelope under `runtime/runs/{workflow_name}/{run_id}/events/initial_briefing.yaml`

## Input Contract

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `venue` | string | yes | Must be `sim` |
| `domain` | string | no | Optional domain filter; if omitted, use the active profile domain |
| `run_id` | string | no | Workflow run identifier for downstream attribution continuity |
| `workflow_name` | string | no | Optional workflow attribution for runtime event storage |

Input rules:
- if `domain` is omitted, default to the active profile domain from `config/strategy-profiles.yaml`
- if `venue` is anything other than `sim`, stop and report a contract violation
- if `run_id` is absent, do not invent one inside normalized portfolio payloads; leave attribution to the caller

## Output Contract

Return one normalized structure with at least these fields:

```yaml
timestamp:
positions:
open_orders:
risk_alerts:
opportunities:
performance:
portfolio_constraints:
```

Recommended normalized envelope:

```yaml
timestamp:
strategy_profile_id: crypto_momentum_v1
policy_version: v1
run_id:
positions:
open_orders:
risk_alerts:
opportunities:
performance:
balance_snapshot:
portfolio_constraints:
```

Normalization rules:
- `timestamp` must represent briefing freshness, not response formatting time
- `positions` must contain open-position state only
- `open_orders` must contain currently pending orders only
- `risk_alerts` must appear before opportunity summaries in the response
- `opportunities` should remain compact and suitable for downstream shortlist selection
- `performance` should summarize portfolio-level state, not long narrative commentary
- `portfolio_constraints` must reflect the active policy envelope relevant to the current profile

## Required Normalization Notes

Populate `portfolio_constraints` from the active config binding, at minimum:
- `venue: sim`
- `domain: crypto_event_markets`
- `strategy_profile_id: crypto_momentum_v1`
- `policy_version: v1`
- `position_sizing_mode: percent_of_balance`
- `max_position_pct_of_balance: 0.10`
- `max_total_exposure_pct_of_balance: 0.20`
- `max_trade_notional_for_sim: 500`
- `max_new_trades_per_heartbeat: 1`
- `max_open_positions: 3`
- `minimum_confidence: 0.68`
- `fresh_context_required: true`
- `allow_averaging_down: false`

When available from the live briefing, also normalize:
- `balance_snapshot.balance_basis`
- `balance_snapshot.balance_basis_field`
- `balance_snapshot.current_open_exposure`
- `balance_snapshot.max_position_notional`
- `balance_snapshot.max_total_exposure_notional`
- `balance_snapshot.remaining_new_exposure_capacity`
- `balance_snapshot.venue_cap_notional`
- `balance_snapshot.final_proposed_size_cap`

## Tracking Compatibility

This skill must stay compatible with downstream tracking expectations even before workflows are migrated.

Preserve these concepts:
- `strategy_profile_id` identifies the governing strategy profile
- `policy_version` identifies the active parameter set
- `run_id` identifies one workflow run

Rules:
- never output a different `strategy_profile_id`
- never silently drop `policy_version` if it is available in the caller context
- never manufacture fake portfolio events just to fill tracking fields

## Behavior Guidelines

1. Always prefer fresh briefing state over memory or prior chat context.
2. Keep the output normalized and compact.
3. Surface `risk_alerts` before `opportunities`.
4. Do not infer trade recommendations inside this skill.
5. Stay bound to `crypto_momentum_v1` until the config files explicitly change.
