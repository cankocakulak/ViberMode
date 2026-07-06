# Workflow: Paywall Creator

> Create or adapt a template-based mobile paywall surface that matches the app context, purchase topology, and design system.

## Fast Path

Use this workflow when the main job is to create, replace, or adapt a paywall component.

Good inputs:

- app category and premium promise
- platform and UI framework
- paywall placement: onboarding, post-value, premium-action, usage-limit, or preview shell
- purchase topology: live purchase, existing handler, preview shell, disabled owner action, or blocked
- approved packages, prices, trials, legal links, and restore behavior when purchases are live

Do not use this workflow to decide global paywall timing or review prompt timing. Use `paywall-review-optimizer` first when the trigger strategy is unclear.

## Boundary

Own:

- paywall component/screen generation
- copy adaptation for app category, user state, and premium outcome
- plan/package card layout
- restore, terms, privacy, close, loading, disabled, error, and purchase-in-progress states
- wiring to existing handlers when they already exist

Do not own:

- store product creation
- RevenueCat offerings or entitlements
- live pricing/trial decisions
- review prompt logic
- fake purchase flows

## Template Sources

Use the closest available template or pattern:

- `packs/vibermode/patterns/ios-factory/paywall/benefit-stack-packages.md`
- `packs/vibermode/patterns/ios-factory/paywall/paywall-template.swift`

If the user supplies a better house template, copy it into the appropriate pattern or adapter asset location and update this workflow rather than forking an ad hoc implementation.

## Contract

Before generating UI, define:

```json
{
  "appName": "Example App",
  "platform": "ios",
  "placement": "onboarding | post-value | premium-action | usage-limit | preview-shell",
  "premiumOutcome": "The concrete user outcome unlocked by upgrading",
  "audienceState": "new_user | activated_user | returning_user | limit_reached | locked_feature_intent",
  "purchaseTopology": "live_purchase | existing_handler | preview_shell | disabled_owner_action | blocked",
  "primaryCTA": "Start Free Trial",
  "packages": [],
  "benefits": [],
  "legalDisclosure": ""
}
```

Do not proceed with a live purchase-looking paywall if purchase topology is unknown.

## Workflow

1. Inspect the existing UI framework, navigation, state management, design system, purchase handlers, and legal routes.
2. Select the template variant:
   - `onboarding`: after focused onboarding or goal setup
   - `post-value`: after first useful result or completion
   - `premium-action`: when the user taps a locked capability
   - `usage-limit`: when a free allowance is exhausted
   - `preview-shell`: when purchase wiring is deferred
3. Populate app-specific copy and benefits. Avoid generic "Go Pro" copy unless the app already brands the tier that way.
4. Adapt the template to the local component style. Do not leave template names, placeholder links, fake prices, or generic benefits.
5. Wire primary, restore, close, terms, privacy, loading, and error states to real routes or honest disabled/owner-action states.
6. Add stable identifiers or accessibility labels for package cards, CTA, restore, close, terms, and privacy.
7. Validate compact mobile layout, long copy wrapping, large text, disabled/loading states, and runtime behavior.

## Design Rules

- Headline the premium outcome, not the subscription mechanic.
- Show 3-4 concrete benefits tied to real premium capabilities.
- Use one recommended package at most.
- Keep primary CTA, restore, terms, privacy, and close paths reachable.
- Show trial, renewal, billing, and cancellation meaning truthfully.
- Do not use fake scarcity, fake countdowns, or fake discounts.

## Output Contract

Return:

- template source and variant
- content contract
- files changed or generated
- purchase topology and any owner-action blockers
- compliance slots confirmed
- verification evidence and remaining gaps
