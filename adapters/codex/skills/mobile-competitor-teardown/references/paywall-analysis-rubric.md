# Paywall Analysis Rubric

Use this reference when filling teardown matrices and app-level notes.

## Onboarding Fields

- `step_count`: Count visible screens before main app or paywall.
- `onboarding_type`: `carousel`, `quiz`, `interactive_demo`, `account_first`, `content_first`, `permission_first`, `unknown`.
- `personalization`: `none`, `light`, `quiz_based`, `adaptive`, `unknown`.
- `account_gate`: `none`, `before_value`, `after_value`, `after_paywall`, `unknown`.
- `permission_timing`: List notification, camera, microphone, health, tracking, location, or contacts prompts and where they appear.
- `first_value_moment`: The first concrete useful result the app gives.
- `paywall_timing`: `upfront`, `after_onboarding`, `after_first_value`, `premium_action`, `usage_limit`, `returning_session`, `unknown`.

## Paywall Fields

- `layout_archetype`: `single_plan`, `plan_cards`, `longform`, `quiz_result`, `comparison_table`, `trial_timeline`, `unknown`.
- `default_plan`: `weekly`, `monthly`, `annual`, `lifetime`, `unknown`.
- `trial_offer`: `none`, `3_day`, `7_day`, `14_day`, `custom`, `unknown`.
- `close_button`: `visible`, `delayed`, `hidden`, `none`, `unknown`.
- `value_proof`: `features`, `outcomes`, `social_proof`, `personalized_result`, `content_preview`, `unknown`.
- `urgency`: `none`, `limited_offer`, `discount`, `countdown`, `streak_loss`, `unknown`.
- `trust_elements`: restore purchase, terms, privacy, cancellation copy, reminder claim, refund/support copy.
- `dark_pattern_risk`: `low`, `medium`, `high`, `unknown`.

## Monetization Fields

- `model`: `free`, `freemium`, `subscription`, `subscription_plus_iap`, `one_time`, `ads`, `unknown`.
- `gate_type`: `hard_paywall`, `soft_paywall`, `usage_limit`, `feature_lock`, `content_lock`, `energy_limit`, `unknown`.
- `pricing_anchor`: the highlighted price or savings claim.
- `plan_set`: visible plan durations and prices.
- `restore_visible`: `yes`, `no`, `unknown`.
- `legal_visible`: `yes`, `no`, `unknown`.

## Review Prompt Fields

- `review_prompt_observed`: `yes`, `no`, `unknown`.
- `trigger_context`: completed lesson, saved output, streak, purchase success, app open, unknown.
- `risk`: Prompting during onboarding, error, paywall dismissal, checkout, cancellation, or permission denial is risky.

## Scoring

Use 1-5 scores with notes:

- `onboarding_clarity`: Does the user understand the promise quickly?
- `value_before_ask`: Does the app show value before demanding signup/payment?
- `paywall_quality`: Is the paywall clear, truthful, and persuasive?
- `monetization_aggression`: Higher means more aggressive; not necessarily better.
- `trust_compliance`: Are restore, terms, privacy, cancellation/trial details visible?
- `learning_loop_strength`: For Education apps, does the product include practice, feedback, repetition, progress, and content strategy?
