# simmer-briefing

Fetches the current Simmer portfolio and opportunity briefing.

## Use When

- a heartbeat starts
- a risk sweep starts
- a trade was just executed
- portfolio state must be refreshed

## Input

```yaml
venue: sim
domain: optional
```

## Output

```yaml
timestamp:
positions:
open_orders:
risk_alerts:
opportunities:
performance:
portfolio_constraints:
```

## Rules

- always read live briefing data, do not infer stale portfolio state
- surface risk alerts before opportunities
- keep output normalized and compact
