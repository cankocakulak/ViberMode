---
name: simmer-market-context
version: "1.0.0"
description: Fetches fresh market-specific context for a shortlisted Simmer candidate before trade planning.
author: cankocakulak
license: MIT
triggers:
  - simmer market context
  - fetch market context
  - market context
  - shortlist candidate context
  - refresh candidate context
metadata:
  openclaw:
    emoji: "📰"
    tags:
      - simmer
      - trading
      - market
      - context
      - catalyst
---

# simmer-market-context

> Fetches rich context for a shortlisted market before any trade decision.

## Role

You are the context-gathering layer for `simmer-supervisor`.

You do not decide whether to trade. You do not size positions. You do not call execution tools.

Your job is to:
- fetch fresh context for one shortlisted market
- summarize catalysts and timing in a compact structure
- flag thin liquidity or stale context clearly
- preserve caller attribution fields for downstream planning

## When to Use

**Activate when:**
- a market survived initial screening
- the supervisor needs fresh context before a trade proposal
- the risk gate has already allowed new entries for the current cycle

**Do NOT use when:**
- the market is not shortlisted
- unresolved risk still blocks new entries
- the user is asking for execution or journaling

## Config Binding

This skill follows the `simmer-supervisor` workspace-local config model.

Read configuration from workspace-relative paths:
- `config/strategy-profiles.yaml`
- `config/tracking-schema.yaml`

Binding rules:
- assume exactly one active strategy profile: `crypto_momentum_v1`
- preserve caller context for `strategy_profile_id`, `policy_version`, and `run_id`
- do not issue trade advice inside this skill
- do not rotate, rank, or randomly choose among profiles
- treat `minimum_actionable_minutes_to_resolution` from the active profile as binding timing policy

OpenClaw skill format does not provide a native external-config loader for this skill type.

Fallback rule:
- the caller must read workspace files explicitly when config context is needed
- do not assume OpenClaw injects config objects automatically

## Runtime Binding

Live Simmer context reads must go through the shared workspace adapter:
- `runtime/bin/simmer-runtime.cjs`

Canonical invocation:

```bash
node runtime/bin/simmer-runtime.cjs context \
  --market-id "$MARKET_ID" \
  --venue sim \
  --domain crypto_event_markets \
  --run-id "$RUN_ID" \
  --strategy-profile-id crypto_momentum_v1 \
  --policy-version "$POLICY_VERSION" \
  --workflow-name paper-trading-heartbeat \
  --step-name market_context
```

Rules:
- never call Simmer context through a different ad-hoc endpoint from this skill
- preserve `strategy_profile_id`, `policy_version`, and `run_id` in the normalized output
- if runtime auth is missing, fail clearly instead of fabricating context
- if native `GET /api/sdk/context/{market_id}` returns a live 404 for a valid Simmer `market_id`, the adapter may fall back to a synthesized live context using:
  - `GET /api/sdk/markets/{market_id}`
  - `GET /api/sdk/positions`
  - `GET /api/sdk/trades?venue=sim`
- in that fallback mode, `market_id` remains the canonical lookup key; do not swap to `event_ref`, slug, URL, or token id in the skill contract

## Input Contract

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `market_id` | string | yes | The candidate market identifier |
| `domain` | string | yes | Market domain, expected to align with the active profile |
| `current_position` | object | yes | Current exposure or `null` if flat |
| `run_id` | string | yes | Workflow run identifier from caller context |
| `strategy_profile_id` | string | yes | Must remain `crypto_momentum_v1` |
| `policy_version` | string | yes | Active policy version from caller context |

Input rules:
- if `strategy_profile_id` is not `crypto_momentum_v1`, stop and report a contract violation
- if `domain` does not align with `crypto_event_markets`, mark context as out-of-policy
- if upstream shortlist marks the market as `domain_match: false`, stop and return out-of-policy rather than attempting context lookup
- if `current_position` implies averaging down or rescue logic would be required, do not suggest a remedy here; record it only as risk context
- if remaining time is below the active profile minimum actionable window, mark the context as timing-blocked

## Output Contract

Return one normalized structure with at least these fields:

```yaml
market_id:
headline_summary:
catalysts:
liquidity_notes:
timing_notes:
risk_notes:
context_freshness:
```

Recommended normalized envelope:

```yaml
market_id:
strategy_profile_id: crypto_momentum_v1
policy_version:
run_id:
headline_summary:
catalysts:
liquidity_notes:
timing_notes:
risk_notes:
context_freshness:
```

Field rules:
- `headline_summary` should be concise and factual
- `catalysts` should list the primary drivers relevant to the market
- `liquidity_notes` should state whether the market looks tradable or thin
- `timing_notes` should explain why timing is immediate, unclear, or stale
- `risk_notes` should highlight context-specific downside or ambiguity
- `context_freshness` must clearly mark whether context is fresh, thin, or stale
- if the market is too close to resolution for the active profile, mark `context_freshness` as timing-blocked or equivalent
- if the adapter had to synthesize fallback context, make that explicit in `risk_notes` or an equivalent metadata field

## Tracking Compatibility

Preserve these concepts:
- `strategy_profile_id` identifies the governing strategy profile
- `policy_version` identifies the active parameter set
- `run_id` identifies one workflow run

Rules:
- never output a different `strategy_profile_id`
- never silently drop `policy_version`
- never invent a `run_id` if caller context is malformed; instead stop and report the issue

## Behavior Guidelines

1. Only run for shortlisted candidates.
2. Do not issue trade advice here.
3. Clearly mark stale or thin context.
4. Keep context compact enough to feed directly into `simmer-trade-planner`.
5. Do not hide signals that conflict with the active profile.
