# Review Prompt Rules

Use this reference when auditing or changing in-app rating and review prompts.

## Source Priority

Prefer official platform docs when there is any conflict:

- Apple App Store ratings and reviews: `https://developer.apple.com/app-store/ratings-and-reviews/`
- Apple App Review Guidelines: `https://developer.apple.com/app-store/review/guidelines/`
- Apple StoreKit review request docs: `https://developer.apple.com/documentation/storekit/requesting-app-store-reviews`
- Google Play In-App Review API docs: `https://developer.android.com/guide/playcore/in-app-review`

Re-check official docs before shipping release-bound review prompt changes.

## Non-Negotiable Rules

- Use native review APIs: StoreKit review request on iOS and Play In-App Review on Android.
- Do not make rating or review a condition for access, content, currency, features, or rewards.
- Do not ask "Do you like the app?" or similar pre-questions immediately before routing only happy users to the store review UI.
- Do not interrupt active tasks, onboarding, checkout, permission requests, or error recovery.
- Do not assume the platform will show the prompt. Both iOS and Android can suppress it.
- Maintain local throttling even though platform APIs have their own quotas.

## Good Trigger Candidates

Use a trigger only after the user has completed a meaningful, positive action:

- completed a first successful session
- saved, exported, shared, or published a result
- reached a streak or habit milestone
- finished a lesson, workout, meditation, level, project, or checklist
- completed a premium outcome without friction
- returned after multiple successful sessions
- resolved a problem the app exists to solve

The prompt should appear at a natural break point after success feedback, not before the user sees the result.

## Anti-Triggers

Never prompt after:

- first app launch or onboarding completion with no meaningful value yet
- app crash, force quit, sync failure, API error, empty result, or payment failure
- permission denial for notifications, location, camera, microphone, health, photos, or contacts
- cancellation, refund flow, downgrade, churn survey, account deletion, or support complaint
- paywall dismissal, checkout screen, purchase restore failure, or price display
- repeated failed attempts, rage taps, form validation errors, or abandoned setup
- notification opt-in request or other system prompt in the same session

When in doubt, wait for another successful session.

## State Machine

Maintain app-side eligibility in addition to platform limits:

```text
not_eligible
  -> activated_after_value
  -> eligible_after_positive_event
  -> prompt_requested
  -> cooldown
  -> eligible_after_next_milestone
```

Recommended app-side gates:

- `hasCompletedFirstValue == true`
- `successfulSessionCount >= 2` or category-specific equivalent
- `daysSinceInstall >= 1` unless the app has very fast repeated successful sessions
- `daysSinceLastReviewRequest >= 30-90`
- `negativeSignalInCurrentSession == false`
- `systemPromptShownThisSession == false`
- `paywallOrCheckoutShownRecently == false`

For tiny apps or early prototypes, implement the state names and guards even if analytics are local-only. This makes later instrumentation straightforward.

## iOS Notes

- Use StoreKit APIs; do not build a custom rating dialog.
- iOS controls whether the prompt appears and limits display frequency.
- Do not ask during onboarding unless the app has already delivered meaningful engagement and the platform guidance is still satisfied. Treat onboarding review asks as high rejection risk.
- If the user taps a separate "Rate us" settings/support link, opening the App Store product review page is different from programmatically requesting a contextual prompt.

## Android Notes

- Use Play Core In-App Review for in-context prompts.
- Quota is controlled by Google Play and should be treated as opaque.
- Do not call the API from a button that must always show a prompt; provide a separate store listing link for explicit user-initiated rating routes if needed.
- Do not pre-screen sentiment immediately before invoking the official review card.

## Output Checks

Every review prompt change should state:

- trigger event
- positive signal proving satisfaction
- cooldown and max prompt policy
- anti-trigger guards
- native API used
- fallback behavior when the platform suppresses the prompt
- files changed and runtime validation status
