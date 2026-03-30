# simmer-risk-manager

Reviews open positions and determines whether exposure should be held, reduced, or closed.

## Use When

- a risk sweep starts
- the briefing contains risk alerts
- the supervisor wants to know if new entries are allowed this cycle

## Input

```yaml
positions:
risk_alerts:
performance:
policy:
```

## Output

```yaml
new_entries_allowed:
actions:
  - market_id:
    decision: hold | reduce | exit
    reason:
priority:
portfolio_note:
```

## Rules

- unresolved alerts block new entries
- keep decisions rule-based, not emotional
- prefer simple exit logic over complex rescue logic
