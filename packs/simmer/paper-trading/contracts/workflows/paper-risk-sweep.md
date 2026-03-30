# paper-risk-sweep

Recurring position-management workflow for open paper trades.

## Purpose

Protect open positions, reduce avoidable losses, and realize gains under fixed policy.

## Strategy Binding

- inherit `strategy_profile_id` and `policy_version` from the position being managed
- stamp each run with a unique `run_id`

## Cadence

- every 2 hours

## Required Agent

- `simmer-supervisor`

## Required Skills

- `simmer-briefing`
- `simmer-risk-manager`
- `simmer-dry-run`
- `simmer-executor`
- `simmer-journal`

## Sequence

1. Fetch `simmer-briefing`
2. Run `simmer-risk-manager`
3. For each recommended `reduce` or `exit` action:
4. Build the corresponding trade intent
5. Run `simmer-dry-run`
6. If policy passes, run `simmer-executor`
7. Refresh with `simmer-briefing`
8. Write `simmer-journal`

## Success Condition

- risky positions are reduced or closed when rules require it
- no new positions are opened here
- every action preserves attribution metadata from the original position
- all exits are logged

## Failure Policy

- if briefing fails, do nothing
- if dry-run fails, log and skip that action
- do not convert this workflow into an opportunity scanner
