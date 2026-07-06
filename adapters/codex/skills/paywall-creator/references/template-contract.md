# Paywall Template Contract

Use this contract before copying or adapting any paywall template.

## Required Inputs

```json
{
  "appName": "Example App",
  "platform": "ios",
  "placement": "onboarding | post-value | premium-action | usage-limit | preview-shell",
  "premiumOutcome": "The concrete user outcome unlocked by upgrading",
  "audienceState": "new_user | activated_user | returning_user | limit_reached | locked_feature_intent",
  "purchaseTopology": "live_purchase | existing_handler | preview_shell | disabled_owner_action | blocked",
  "primaryCTA": "Start Free Trial",
  "secondaryCTA": "Maybe Later",
  "restoreRoute": "existing | create | blocked",
  "termsRoute": "existing | create | blocked",
  "privacyRoute": "existing | create | blocked",
  "packages": [],
  "benefits": [],
  "legalDisclosure": ""
}
```

Do not proceed with a live purchase-looking paywall if `purchaseTopology` is unknown.

## Package Shape

Each package should include:

```json
{
  "id": "annual",
  "title": "Annual",
  "subtitle": "Best for steady progress",
  "price": "$39.99/year",
  "badge": "Best value",
  "hasTrial": true,
  "trialText": "7 days free",
  "isDefault": true,
  "isEnabled": true
}
```

Rules:

- Use approved product/package IDs when purchases are live.
- Use honest preview copy when purchases are deferred.
- Use one default package at most.
- Do not invent prices, discounts, or trial lengths.

## Benefit Shape

Each benefit should include:

```json
{
  "id": "adaptive-plan",
  "title": "Adaptive weekly plan",
  "detail": "Your schedule updates when you miss a day.",
  "symbol": "calendar.badge.clock"
}
```

Rules:

- Use benefits that match real implemented or explicitly planned premium behavior.
- Avoid vague claims such as "unlimited", "smarter", "advanced", or "powerful" unless the app proves them.
- Include at least one benefit tied to the user's immediate context or last completed action.

## Placement Adaptation

### Onboarding

- Use the user's selected goal, problem, or setup answers in the headline/subheadline when available.
- Keep copy compact; the user has not yet formed trust.
- Avoid review prompt, notification prompt, account creation, and paywall all in the same breath.

### Post-Value

- Reference the result the user just created or completed.
- Show how premium improves, saves, exports, repeats, or personalizes that result.
- Avoid blocking access to the result after the user has already invested effort unless the product model intentionally gates the final output.

### Premium Action

- Name the exact locked capability.
- Show what changes after upgrading.
- Return the user to the intended action after purchase when possible.

### Usage Limit

- Show the free allowance truthfully.
- Explain reset behavior when it exists.
- Offer upgrade as continuity, not punishment.

### Preview Shell

- Use when purchase wiring is deferred.
- CTA must say what happens now: "Preview Premium", "Join Waitlist", "Notify Me", or "Continue".
- Package cards may be disabled or marked as preview. Do not show a live purchase CTA.

## Required States

Every production paywall should handle:

- package loading
- package load failure with retry or owner-action copy
- purchase in progress
- purchase failure
- restore in progress
- restore failure
- already subscribed or entitlement active
- compact device layout
- large text accessibility

For prototypes, explicitly mark unavailable states as deferred in the output.

## Verification Checklist

- No placeholder app name, package ID, price, URL, or generic benefits remain.
- Primary CTA matches runtime truth.
- Restore, terms, privacy, and close are reachable.
- Legal disclosure matches visible package and trial copy.
- All buttons have stable identifiers or accessibility labels.
- Text fits on compact screens without overlapping.
- The paywall can be dismissed unless the product intentionally uses a hard paywall and the app has a compliant path for restore/legal access.
