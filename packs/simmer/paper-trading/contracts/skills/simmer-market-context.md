# simmer-market-context

Fetches rich context for a shortlisted market before any trade decision.

## Use When

- a market survived initial screening
- the supervisor needs fresh context before a dry-run

## Input

```yaml
market_id:
domain:
current_position:
```

## Output

```yaml
market_id:
headline_summary:
catalysts:
liquidity_notes:
timing_notes:
risk_notes:
context_freshness:
```

## Rules

- only run for shortlisted candidates
- do not issue trade advice here
- clearly mark stale or thin context
