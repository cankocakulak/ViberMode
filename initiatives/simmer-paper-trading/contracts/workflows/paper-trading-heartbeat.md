# paper-trading-heartbeat

Primary recurring entry workflow for Simmer paper trading.

## Purpose

Scan for new opportunities and open at most one new paper position when policy allows.

## Strategy Binding

- execute exactly one `strategy_profile_id`
- stamp every decision with `strategy_profile_id`, `policy_version`, and `run_id`

## Cadence

- every 4 hours

## Required Agent

- `simmer-supervisor`

## Required Skills

- `simmer-briefing`
- `simmer-market-context`
- `simmer-trade-planner`
- `simmer-dry-run`
- `simmer-executor`
- `simmer-risk-manager`
- `simmer-journal`

## Sequence

1. Fetch `simmer-briefing`
2. Run `simmer-risk-manager` against current state
3. If `new_entries_allowed` is false, write journal and stop
4. Shortlist at most 3 candidate markets from `opportunities.new_markets`
5. For each shortlisted market, fetch `simmer-market-context`
6. Run `simmer-trade-planner`
7. Keep only proposals with confidence above threshold
8. Select the single best candidate
9. Run `simmer-dry-run`
10. If dry-run fails policy, write journal and stop
11. Run `simmer-executor`
12. Refresh with `simmer-briefing`
13. Write `simmer-journal`

## Success Condition

- zero or one new paper trade opened
- every decision logged
- every decision attributed to one strategy profile and one policy version
- no policy bypass

## Failure Policy

- if briefing fails, do nothing
- if context is stale, skip the market
- if no candidate is strong enough, log `no trade`
