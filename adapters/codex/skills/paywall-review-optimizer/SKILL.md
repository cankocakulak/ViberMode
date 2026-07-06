---
name: paywall-review-optimizer
description: Audit and improve mobile app paywall timing, paywall quality, onboarding-to-value flow, and in-app review prompt strategy. Use when a user asks to optimize subscription conversion, paywall placement, review/rating prompts, onboarding monetization, trial timing, App Store or Play review compliance, or to implement bounded paywall/review flow changes inside an existing app repo.
---

# Paywall Review Optimizer

This skill is the monetization and rating-prompt growth operator for existing mobile apps. It decides whether the app needs better onboarding, paywall timing, paywall UI/copy, review prompt timing, instrumentation, or purchase wiring, then either implements a bounded change or routes to the narrower ViberMode capability that owns the work.

Read and follow the canonical ViberMode workflow first:

- `../viber-mode/packs/vibermode/workflows/paywall-review-optimizer.md`

## Boundary

Own:
- first-run, first-value, paywall, purchase, and review-prompt journey audits
- paywall and review prompt trigger decisions
- bounded app-code changes for timing, gating, copy, routing, and instrumentation
- orchestration of follow-up skills when a specialist surface is better

Do not own:
- Apple or Google subscription product creation, tax, legal, pricing owner decisions, or live rollout declarations
- RevenueCat project, offering, entitlement, or product mutation beyond read-only diagnosis
- broad app redesigns unrelated to monetization or rating prompts
- custom rating pre-prompts, rating gates, or fake purchase readiness

Use `mobile-monetization-operator` or `revenuecat-operator` for store/RevenueCat state. Use `paywall-creator` when a new or replacement paywall surface should be generated from a template. Use `design-engineer`, `ux-tweaker`, `integration-auditor`, `runtime-validator`, or `tester` for their narrower responsibilities.

## References

The canonical workflow above is the source of truth. Load these Codex-side references only when the task needs deeper details:

Load only the reference needed for the active task:

- `references/optimization-model.md` for paywall timing, onboarding, trial, offer, and experiment heuristics.
- `references/review-prompt-rules.md` for Apple/Google review prompt rules and trigger/anti-trigger logic.
- `references/event-taxonomy.md` for recommended app events, signals, and instrumentation checks.

## Workflow

1. Resolve the target app, repo, platform, release intent, and artifact root. Prefer existing ViberMode app registry and existing `docs/[project-name]/` artifacts when available.
2. Map the current journey from install or first launch to first value, paywall exposure, purchase attempt, premium unlock, review prompt, and rating outcome.
3. Inspect implementation points with `rg` before making claims. Search for paywall, purchase, subscription, RevenueCat, StoreKit, review, rating, onboarding, entitlement, trial, package, offering, and analytics/event names.
4. Classify each problem as `timing`, `onboarding`, `value-proof`, `paywall-design`, `offer`, `purchase-wiring`, `review-trigger`, `compliance`, `instrumentation`, or `runtime-bug`.
5. Decide the smallest action mode:
   - `audit-only`: produce findings and an experiment plan when code changes are not requested or risk is unclear.
   - `bounded-code-change`: adjust trigger logic, state, routing, copy, analytics, or guardrails in the target app.
   - `template-paywall`: invoke `paywall-creator` behavior to generate or replace the paywall surface.
   - `specialist-route`: hand off to monetization, design, integration, validation, or release workflows.
6. Implement only the highest-confidence batch. Keep speculative monetization bets as experiments, not permanent truths.
7. Verify with build/tests and runtime evidence for changed user-facing flows. Capture screenshots or simulator evidence when the target stack supports it.

## Decision Rules

- Prefer showing a paywall after a user understands the promised outcome or reaches a meaningful value preview. Do not assume delaying monetization is safer; many subscription apps convert heavily on Day 0.
- Treat first-session paywalls as valid only when onboarding has communicated value and the app category supports early purchase intent.
- Prefer post-value, premium-action, usage-limit, and onboarding-completion paywalls over arbitrary launch interruptions.
- Never show a review prompt during onboarding, in the middle of a task, after an error, after a cancellation, after a denied permission, after payment failure, or as a condition for access.
- Use native in-app review APIs and respect platform throttling. Do not build custom "Do you like us?" pre-prompts that steer users away from official review UI.
- Keep pricing, trial length, cancellation, restore, terms, and privacy copy truthful to the actual runtime and store configuration.
- Do not invent product IDs, prices, subscription groups, entitlements, or legal links. If missing, mark owner action or route to the monetization operator.

## Output

Return:

- Journey map: current first-value, paywall, purchase, and review prompt path.
- Findings: ordered by conversion/compliance/user-impact risk, with file references when code was inspected.
- Action plan: exact changes made or recommended, including routed skills.
- Implementation notes: files changed, trigger logic, event names, and any deferred owner actions.
- Verification: commands run, screenshots/runtime evidence, and remaining gaps.
- Experiment backlog: A/B tests or future variants with hypothesis, metric, and guardrail.
