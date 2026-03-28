# simmer-journal

Writes a concise local record of each heartbeat or risk decision.

## Use When

- a heartbeat ends
- a risk sweep exits or reduces exposure
- a strong candidate is intentionally skipped

## Input

```yaml
timestamp:
run_id:
workflow_name:
strategy_profile_id:
policy_version:
market_id:
action:
confidence:
entry_reason:
exit_reason:
skip_reason:
thesis:
invalidation:
result:
portfolio_state:
```

## Output

```yaml
journal_path:
entry_id:
```

## Rules

- log skips as well as executions
- always include attribution metadata for workflow and strategy profile
- keep entries short and inspectable
- avoid free-form long essays
