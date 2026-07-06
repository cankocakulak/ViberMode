# Workflow: Paywall Review Optimizer

> Audit and improve subscription paywall timing, onboarding-to-value flow, and native review prompt timing inside an existing app.

## Fast Path

Use this workflow when an existing mobile app has weak or suspicious monetization/review behavior:

- paywall appears too early, too late, too often, or in the wrong context
- onboarding does not create enough value before the paywall
- paywall copy/design/offer is generic or unclear
- review prompts appear during onboarding, after errors, after paywall dismissal, or at arbitrary launch moments
- the user wants a bounded implementation pass that can change app code

Do not use this workflow for store product creation, tax/legal owner decisions, production rollout declarations, or RevenueCat offering mutation. Route those to mobile monetization operations.

## Boundary

Own:

- journey audit from first launch to first value, paywall, purchase, premium unlock, and review prompt
- paywall trigger strategy and native review prompt trigger strategy
- bounded implementation of trigger logic, state guards, analytics events, and paywall/review routing
- orchestration of specialist workflows when needed

Do not own:

- subscription product catalog creation
- RevenueCat project/offering/entitlement mutation
- full app redesign outside monetization/review scope
- custom rating pre-prompts, rating gates, fake urgency, or fake purchase readiness

## Related Capabilities

- Use `paywall-creator` when the main action is a replacement paywall surface from a reusable template.
- Use `mobile-monetization-operator` when store products, RevenueCat packages, entitlements, or purchase readiness are the blocker.
- Use `revenuecat-operator` for RevenueCat inspection or configuration.
- Use `design-engineer` or `ux-tweaker` for craft-level paywall polish after the strategy is clear.
- Use `integration-auditor`, `runtime-validator`, or `tester` when wiring or runtime proof is the main risk.

## Workflow

1. Resolve target app, repo, platform, artifact root, and release intent.
2. Prefer existing `docs/[project-name]/` artifacts when available.
3. Search implementation before making claims. Look for onboarding, paywall, purchase, subscription, RevenueCat, StoreKit, entitlement, review, rating, and analytics/event names.
4. Map the current journey:
   - first launch
   - onboarding
   - first-value action
   - paywall exposure
   - purchase/trial start
   - entitlement unlock
   - review eligibility and prompt
5. Classify findings as `timing`, `onboarding`, `value-proof`, `paywall-design`, `offer`, `purchase-wiring`, `review-trigger`, `compliance`, `instrumentation`, or `runtime-bug`.
6. Choose the smallest action mode:
   - `audit-only`: report findings and experiments
   - `bounded-code-change`: adjust app logic, events, state, copy, or routing
   - `template-paywall`: route to `paywall-creator`
   - `specialist-route`: route to monetization, design, integration, validation, or release workflow
7. Implement only the highest-confidence bounded batch.
8. Validate changed user-facing flows with build/test/runtime evidence when possible.

## Paywall Decision Rules

- Prefer showing a paywall after the user understands or experiences a concrete premium outcome.
- Do not assume delaying the paywall is safer; first-session paywalls can be valid when onboarding proves value quickly.
- Prefer onboarding-completion, post-value, premium-action, usage-limit, or returning-session paywalls over arbitrary launch interruptions.
- Keep pricing, trial length, billing period, cancellation, restore, terms, and privacy copy truthful to actual runtime and store state.
- Do not invent product IDs, prices, packages, entitlements, or legal URLs.

## Review Prompt Decision Rules

- Use native platform review APIs.
- Prompt only after meaningful positive events such as completed sessions, saved/exported results, streaks, lessons, workouts, levels, or repeat success.
- Never prompt during onboarding, active tasks, checkout, paywall dismissal, error recovery, cancellation, permission denial, refund/support/account deletion, or payment failure.
- Keep local cooldowns and eligibility guards even when platform APIs throttle prompts.
- Do not build custom "Do you like us?" pre-prompts that steer only happy users to official review UI.

## Instrumentation Baseline

Prefer existing event naming. When missing, add or recommend local/analytics events for:

```text
onboarding_completed
first_value_completed
activation_completed
paywall_viewed
paywall_dismissed
paywall_package_selected
trial_started
purchase_started
purchase_completed
purchase_failed
restore_completed
entitlement_unlocked
premium_action_tapped
usage_limit_reached
review_eligibility_met
review_prompt_requested
negative_signal_detected
```

Do not log secrets, payment tokens, raw subscriber exports, or sensitive user content.

## Output Contract

Return:

- journey map
- ordered findings with file references when code was inspected
- action mode and rationale
- changes made or recommended
- routed specialist capabilities, if any
- verification evidence
- experiment backlog with hypothesis, metric, and guardrail
