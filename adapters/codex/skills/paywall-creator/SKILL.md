---
name: paywall-creator
description: Create or adapt template-based mobile paywall surfaces for subscription apps. Use when a user asks to build, replace, polish, or generate a paywall from a reusable template, connect paywall UI to existing purchase or preview flows, adapt paywall copy to an app category, or produce onboarding, post-value, premium-action, or usage-limit paywall variants.
---

# Paywall Creator

This skill owns concrete paywall surface creation. It turns a reusable template into an app-specific paywall that fits the existing design system, runtime truth, and monetization topology.

Read and follow the canonical ViberMode workflow first:

- `../viber-mode/packs/vibermode/workflows/paywall-creator.md`

## Boundary

Own:
- paywall component creation or replacement
- template adaptation for app category, user goal, premium outcome, and placement
- paywall copy, plan cards, benefit stack, CTA hierarchy, restore/legal routes, and loading/error/disabled states
- integration with existing purchase, preview, restore, close, and legal handlers when they already exist

Do not own:
- paywall timing strategy across the full app journey
- review prompt strategy
- creating store products, RevenueCat offerings, entitlements, or pricing decisions
- pretending purchase wiring exists when it is only a preview shell

Use `paywall-review-optimizer` when the trigger/timing strategy is unclear. Use `mobile-monetization-operator` or `revenuecat-operator` when product catalog, entitlements, offerings, or purchase SDK setup are the core issue. Use `design-engineer` for craft-level polish after the component is integrated.

## Resources

- Canonical ViberMode pattern: `../viber-mode/packs/vibermode/patterns/ios-factory/paywall/benefit-stack-packages.md`
- Canonical SwiftUI starter template: `../viber-mode/packs/vibermode/patterns/ios-factory/paywall/paywall-template.swift`
- `references/template-contract.md` defines required inputs, runtime states, and compliance slots.
Copy the canonical SwiftUI starter into the target app only after adapting names, styling, content, and handlers.

## Workflow

1. Confirm the target repo, platform, UI framework, design system, purchase topology, and paywall placement.
2. Inspect existing screens/components before generating UI. Match local naming, navigation, state management, analytics, and styling conventions.
3. Read `references/template-contract.md`.
4. Select or adapt a template variant:
   - `onboarding`: after focused onboarding or goal setup
   - `post-value`: after first useful result or completion
   - `premium-action`: when a user taps a locked capability
   - `usage-limit`: when a free allowance is exhausted
   - `preview-shell`: when purchase wiring is deferred but a credible upgrade surface is needed
5. Populate the template contract with app-specific copy and runtime truth. Do not use generic "Go Pro" copy unless the app already brands the tier that way.
6. Copy the closest asset or local component pattern into the app and adapt it. Do not leave template names, placeholder links, fake prices, or generic benefits.
7. Wire actions to existing purchase, restore, close, preview, terms, and privacy routes. If a route is missing, create an honest disabled/owner-action state or route to the relevant operator.
8. Validate layout on compact and regular mobile sizes. Check copy wrapping, button labels, legal links, loading/disabled/error states, accessibility labels, and stable identifiers.

## Design Rules

- Headline the premium outcome, not the subscription mechanic.
- Put the highest-value plan in a clear but non-deceptive recommended state.
- Show 3-4 concrete benefits tied to real premium capabilities.
- Keep primary CTA, restore, terms, privacy, and close paths reachable.
- Use stable dimensions for package cards and CTA rows so loading, price text, or long localized copy does not resize the layout.
- Do not hide cancellation/renewal meaning behind vague trial copy.
- Do not use fake scarcity, fake countdowns, or fake discounts.

## Output

Return:

- template variant used and why
- app-specific content contract
- files changed or created
- purchase topology: live, existing handler, preview shell, disabled owner-action, or blocked
- compliance slots confirmed: price/trial disclosure, restore, terms, privacy, close
- verification evidence and remaining integration gaps
