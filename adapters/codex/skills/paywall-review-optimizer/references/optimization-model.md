# Paywall Optimization Model

Use this reference when deciding how, when, and why to show a paywall or monetization offer.

## Current Evidence Baseline

Re-check these sources when a decision depends on current benchmarks or platform policy:

- RevenueCat State of Subscription Apps 2026: subscription trial starts often happen on Day 0, and hard paywalls can outperform freemium on download-to-paid conversion when executed well.
- Adapty 2026 paywall guidance: onboarding paywalls and trials can outperform later in-app paywalls, but trial impact differs by category and offer quality.
- Superwall 2026 onboarding/paywall analysis: multi-page onboarding paywalls can outperform single-page paywalls when each step builds intent and reduces uncertainty.
- App Store and Google Play policy docs: pricing, trial, renewal, cancellation, restore, terms, and privacy disclosures must match the real store configuration.

Treat vendor benchmark numbers as directional evidence, not universal constants. App category, value clarity, user intent, product maturity, traffic source, and purchase wiring can dominate the average.

## Core Mental Model

Optimize in this order:

1. Value realization: the user understands or experiences a concrete product outcome.
2. Paywall reach: enough qualified users actually see the paywall.
3. Offer comprehension: price, trial, renewal, plan difference, and cancellation are clear.
4. Payment trust: restore, legal links, store-native purchase behavior, and honest states are present.
5. Experiment loop: only then tune copy, visual hierarchy, social proof, and plan defaults.

Do not begin with colors or microcopy if the app has not solved first value, paywall reach, or runtime truth.

## Paywall Placements

### Onboarding Completion

Use when:
- the app category has strong pre-use purchase intent
- onboarding has captured goals, constraints, or personalization
- the final step names a concrete premium outcome
- the user has not been asked for review, account, notification, and purchase decisions all at once

Risks:
- generic onboarding makes the paywall feel like a toll booth
- too many setup questions before value can create sunk-friction without trust
- aggressive close hiding can damage rating and review outcomes

### Post-Value

Use when:
- the app can show a quick useful result before asking for money
- premium expands or deepens a result the user just created
- the user has completed a meaningful action

Examples:
- generated a plan, summary, workout, recipe, lesson, habit schedule, or analysis
- completed a first session and wants the next level, export, personalization, or history

Risks:
- waiting too long can leave low-intent users unmonetized
- if the free result is too complete, premium value may feel optional

### Premium Action Gate

Use when:
- the user taps a clearly premium capability
- the locked capability is understandable from context
- the app explains the outcome, not only the restriction

Avoid:
- locking core setup before the user understands the app
- gating basic navigation or required permissions

### Usage Limit

Use when:
- the free tier has a real allowance
- the user has consumed enough value to understand the upgrade
- the limit is predictable and explained before the block when possible

Avoid:
- surprise limits after data entry
- unclear resets or inconsistent counters

### Launch or Session Start

Use sparingly. Consider only for mature apps with known subscriber intent, winback offers, or returning users who have already seen value. Avoid on cold first launch unless the app deliberately uses a hard-paywall model and the onboarding proves value immediately.

## Diagnosis Matrix

| Symptom | Likely Cause | First Action |
| --- | --- | --- |
| Paywall views are low | placement hidden, routing bug, no premium entry point | audit navigation and trigger reach |
| Paywall views high, purchases low | weak value proof, unclear offer, poor trust, wrong default package | inspect copy, pricing display, restore/legal, plan hierarchy |
| Trials start but paid conversion low | wrong trial length, low commitment, weak habit before renewal | inspect trial lifecycle and activation events |
| High onboarding drop before paywall | setup friction or generic onboarding | shorten, personalize, move first value earlier |
| Users dismiss paywall immediately | timing too early or close/price surprise | test post-value trigger or clearer pre-paywall framing |
| Review prompts underperform | wrong moment or negative-user prompting | move to successful completion/streak/export events |
| Rejections or review risk | custom rating pre-prompt, disclosure gaps, access gating | remove risky prompt and use native APIs |

## Offer and Copy Rules

- Headline the premium outcome: "Build a weekly study plan that adapts to missed days" beats "Go Pro".
- Benefits must map to implemented or explicitly deferred premium behavior.
- Use one recommended plan only when the default is intentional.
- Display trial length, renewal price, billing period, and cancellation expectation truthfully.
- Keep restore, terms, privacy, and close routes visible and reachable.
- Use urgency only when real. Do not fake countdowns, discounts, or scarcity.

## Experiment Plan Shape

Each experiment should include:

- hypothesis: what user belief or behavior will change
- target segment: new users, activated users, returning users, cancelled users, country/cohort when available
- variant: trigger, copy, offer, trial, package layout, or visual template
- primary metric: paywall view rate, trial start rate, purchase rate, trial-to-paid, revenue per install, rating prompt acceptance
- guardrails: onboarding completion, retention, refund/cancel intent, support complaints, crash-free sessions, review score
- minimum runtime: enough traffic for stable directional signal; do not overfit tiny cohorts

Prefer one high-leverage experiment at a time. For low-traffic apps, implement the strongest qualitative improvement first and record the measurement plan for later.
