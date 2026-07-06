# Event Taxonomy

Use this reference when auditing analytics, local state, paywall triggers, review prompt triggers, or experiment readiness.

## Journey Events

Recommended core events:

```text
app_first_open
onboarding_started
onboarding_step_viewed
onboarding_completed
first_value_started
first_value_completed
activation_completed
paywall_viewed
paywall_dismissed
paywall_package_selected
trial_started
purchase_started
purchase_completed
purchase_failed
restore_started
restore_completed
restore_failed
entitlement_unlocked
premium_action_tapped
usage_limit_reached
review_eligibility_met
review_prompt_requested
review_prompt_suppressed_or_unavailable
review_prompt_completed_or_returned
negative_signal_detected
```

Use existing analytics naming when the app already has a convention. Do not rename established events just to match this taxonomy unless a broader analytics migration is approved.

## User State Signals

Track or infer:

- install date or first open date
- onboarding completion
- first-value completion
- successful session count
- premium entitlement state
- last paywall view date
- last review request date
- active experiment assignment
- negative signal in current session
- last system prompt date
- trial or subscription lifecycle when available

For early apps without analytics, persist local state names that can later map to analytics events.

## Negative Signals

Negative signals should suppress review prompts and can change paywall strategy:

- crash or fatal error
- payment failure or restore failure
- denied important permission
- cancellation or downgrade action
- refund/support/account deletion intent
- repeated validation errors
- empty or failed generation/result
- network or sync failure
- rapid paywall close
- rage taps or repeated back-outs when detectable

## Paywall Metrics

Minimum funnel:

```text
eligible users
  -> paywall viewed
  -> package selected
  -> purchase/trial started
  -> purchase/trial completed
  -> entitlement active
```

Useful metrics:

- paywall view rate by trigger
- paywall-to-trial or paywall-to-purchase conversion
- trial-to-paid conversion
- revenue per install or revenue per activated user
- close rate and time-to-close
- package selection mix
- restore success/failure rate
- entitlement unlock latency

## Review Metrics

Minimum funnel:

```text
eligible users
  -> review prompt requested
  -> platform prompt shown when detectable
  -> user completed/returned
  -> rating/review movement from store data
```

Useful metrics:

- eligibility rate after first-value events
- request rate after positive events
- prompt suppression/fallback rate
- rating average and count movement after release
- support tickets or negative reviews mentioning prompt timing

## Experiment Event Fields

Add these fields when possible:

- `trigger`: onboarding_completion, post_value, premium_action, usage_limit, returning_session, settings
- `placement`: screen or route name
- `variant`: stable experiment variant id
- `package_id`: only non-secret product/package identifier
- `has_trial`: boolean
- `entitlement_state`: free, trial, subscribed, expired, unknown
- `review_eligibility_reason`: successful_session, export, streak, completion, returning_user

Do not log secrets, raw subscriber exports, payment tokens, personal content, or sensitive health/financial/legal data unless the app has an approved analytics privacy design.
