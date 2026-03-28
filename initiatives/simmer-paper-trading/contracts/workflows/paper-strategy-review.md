# paper-strategy-review

Offline review workflow for improving the live paper-trading policy.

## Purpose

Analyze prior heartbeats and risk actions, then propose policy changes without applying them automatically.

## Cadence

- weekly

## Required Agent

- `simmer-supervisor`

## Required Inputs

- recent journal entries
- recent portfolio outcomes
- recent skipped-trade decisions
- strategy profile and policy metadata

## Sequence

1. Load the last week's journal entries
2. Group executed trades, skipped trades, exits, and invalidations by `strategy_profile_id` and `policy_version`
3. Identify repeated failure and success patterns
4. Assess whether confidence thresholds are too loose or too strict
5. Assess whether max positions or position size should change
6. Write a review note with recommended policy changes

## Output

```yaml
review_window:
good_patterns:
bad_patterns:
best_profiles:
weak_profiles:
recommended_policy_changes:
changes_to_test_next:
do_not_change:
```

## Success Condition

- produces actionable recommendations for workflow 1 and workflow 2
- does not mutate live policy by itself

## Failure Policy

- if journal coverage is too thin, report low confidence
- if data is mixed or contradictory, prefer fewer recommendations
