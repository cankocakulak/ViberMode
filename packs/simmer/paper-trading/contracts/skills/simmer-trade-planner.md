# simmer-trade-planner

Turns strategy rules plus market context into a structured trade proposal.

## Use When

- briefing and market context are both available
- a candidate market must be evaluated for entry

## Input

```yaml
strategy: event-momentum-with-context-filter
strategy_profile_id:
policy_version:
market:
context:
portfolio_state:
policy:
```

## Output

```yaml
market_id:
strategy_profile_id:
policy_version:
decision: enter | skip
side:
size:
confidence:
thesis:
invalidation:
time_horizon:
why_now:
skip_reason:
```

## Rules

- if confidence is weak, return `decision: skip`
- size must respect fixed-size paper limits
- thesis and invalidation must be explicit
- do not call execution tools from this skill
