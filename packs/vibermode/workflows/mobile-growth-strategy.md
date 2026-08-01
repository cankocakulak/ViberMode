# Workflow: Mobile Growth Strategy

> Turn a mobile app's product docs, competitor evidence, monetization state, and policy constraints into a practical acquisition and growth operating plan.

## Fast Path

Use this workflow when a user wants to plan paid or organic growth for a mobile app before creating ads or launching campaigns.

Good inputs:

- product docs, PRD, UX, storefront notes, or app screenshots
- competitor research pack or app list
- target market and platform
- monetization state, subscription/paywall readiness, and first-value event
- intended acquisition channels such as Meta, TikTok, Google Ads, ASA, influencers, or organic social

## Boundary

Own:

- product positioning and acquisition wedge
- audience and user-moment hypotheses
- channel and funnel route selection
- creative pillar definition
- measurement prerequisites and event taxonomy
- phase plan and task backlog for growth execution
- handoff into creative, attribution, paywall, storefront, and ad-platform operators

Do not own:

- live ad account writes or budget changes
- store product, RevenueCat, or entitlement mutation
- attribution SDK implementation beyond measurement requirements
- final legal, medical, financial, or regulated-category review
- broad app redesign unrelated to acquisition learning

## Related Workflows

- Use `mobile-competitor-teardown` when competitor evidence is missing or stale.
- Use `ad-creative-lab` after the growth strategy needs creative briefs, copy, scripts, or asset prompts.
- Use `paid-acquisition-launcher` after creative and destination readiness are clear and a paused ad-launch spec is needed.
- Use ad-platform operators such as `meta-ads-operator`, `tiktok-ads-operator`, or `google-ads-operator` for live account reads, reporting, or approved API writes.
- Use `mobile-attribution-operator` when AppsFlyer, SKAN, partner connections, or purchase forwarding must be configured.
- Use `paywall-review-optimizer` when first value, paywall timing, and subscription conversion are central to the growth problem.
- Use `mobile-storefront` when App Store or Google Play listing metadata and screenshots need update.

## Workflow

1. Resolve app scope:
   - app name and repo/doc root
   - platform, target market, channel assumptions, current release state
   - destination route: live store listing, TestFlight/beta, landing page, waitlist, or web checkout
2. Read existing artifacts under `docs/[project-name]/` before creating a new growth plan. Prefer updating existing growth artifacts when present.
3. Build the source baseline:
   - product value proposition and first-value moment
   - current UI/storefront evidence
   - competitor and category patterns
   - monetization and paywall readiness
   - attribution/event readiness
   - regulated-category or platform-policy constraints
4. Define the positioning wedge:
   - one plain-language product promise
   - 3-5 creative pillars
   - audience moments that can be represented in creative
   - copy or targeting constraints
5. Select the first acquisition route:
   - store install when listing and measurement are ready
   - TestFlight/beta interest when public listing is not ready
   - landing/waitlist when install path is blocked
   - organic/content when paid tracking or policy risk is too high
6. Define the measurement plan:
   - primary metric for the first test
   - supporting events and UTMs
   - attribution prerequisites
   - reporting cadence and minimum-volume rules
7. Produce a phase plan and task backlog.

## Policy And Claims Guardrails

For sensitive categories such as health, mental health, finance, employment, housing, education admissions, dating, minors, or personal hardship:

- Re-check official ad-platform policy before final copy or targeting recommendations.
- Do not write copy that asserts or implies sensitive personal attributes about the viewer.
- Do not promise clinical, financial, legal, or guaranteed outcomes unless the product and legal review support it.
- Keep targeting broad when narrow interest targeting could imply a sensitive condition or status.
- Use neutral user moments and product actions rather than claims about the viewer.

## Output Contract

Write a growth plan under:

```text
docs/[project-name]/growth/growth-operating-system.md
```

Include:

- `## Analysis`
- `## Evidence Used`
- `## Positioning`
- `## Audience And Market Posture`
- `## Creative Pillars`
- `## Acquisition Route`
- `## Measurement Prerequisites`
- `## Phase Plan`
- `## Risks And Blockers`
- `## Next Step Handoff`

When task tracking is useful, write:

```text
docs/[project-name]/growth/tasks.json
```

Task rows should include `id`, `title`, `phase`, `ownerWorkflow`, `status`, `description`, `inputs`, `outputs`, `dependencies`, `validation`, and `risk`.
