# simmer-executor

Executes a paper trade on Simmer after dry-run and policy approval.

## Use When

- dry-run passed
- the workflow explicitly permits execution

## Input

```yaml
market_id:
side:
size:
venue: sim
reasoning:
source:
dry_run_reference:
```

## Output

```yaml
trade_id:
market_id:
status:
filled_size:
average_price:
exposure_after_trade:
```

## Rules

- venue must remain `sim`
- do not execute if dry-run failed
- do not place more than one new entry per heartbeat
