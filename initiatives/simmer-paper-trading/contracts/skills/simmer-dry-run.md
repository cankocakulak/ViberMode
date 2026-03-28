# simmer-dry-run

Simulates a proposed trade on Simmer before execution.

## Use When

- a trade proposal is approved by policy
- any real paper trade is about to be sent

## Input

```yaml
market_id:
side:
size:
venue: sim
reasoning:
source:
```

## Output

```yaml
market_id:
estimated_cost:
estimated_shares:
slippage_notes:
policy_pass:
policy_fail_reason:
```

## Rules

- every trade must pass through this skill
- if cost or size breaches policy, mark `policy_pass: false`
- never auto-upgrade dry-run output into execution without an explicit next step
