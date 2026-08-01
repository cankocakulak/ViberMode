# Workflow: Paid Acquisition Launcher

> Convert approved mobile growth strategy and ad creatives into a paused, approval-gated paid acquisition launch plan.

## Fast Path

Use this workflow when a user is ready to move from creative planning toward Meta, TikTok, Google Ads, Apple Search Ads, or another paid acquisition platform.

Good inputs:

- approved growth strategy
- approved creative briefs and asset files
- destination route: store listing, TestFlight, landing page, waitlist, or web purchase
- attribution and event readiness
- target market, budget assumption, and launch objective
- ad-platform account access expectations

## Boundary

Own:

- launch preflight
- campaign/ad group/ad set/ad naming
- objective and destination route selection
- budget and learning assumptions
- audience posture and placement posture
- UTM and event tracking plan
- paused draft specifications
- approval gates and readback plan

Do not own:

- activation or spend without explicit approval
- live platform writes unless routed through the relevant ad-platform operator
- asset creation beyond identifying missing assets
- attribution SDK implementation
- store listing, product, or paywall configuration

## Related Workflows

- Use `mobile-growth-strategy` if the acquisition route is not decided.
- Use `ad-creative-lab` if creative assets are missing or not approved.
- Use `mobile-attribution-operator` if SDK, SKAN, partner, or purchase-forwarding readiness is missing.
- Use `meta-ads-operator`, `tiktok-ads-operator`, or `google-ads-operator` for live account inspection, reporting, paused object creation, or approved writes.

## Workflow

1. Resolve platform, app, market, destination, budget assumption, and launch objective.
2. Read existing `docs/[project-name]/growth/` artifacts.
3. Preflight destination readiness:
   - store listing, landing page, TestFlight, or web route
   - privacy policy and terms
   - app/event readiness and platform-specific promoted object requirements
   - attribution/SKAN/AEM/SDK state when applicable
   - asset files and final copy
4. Choose launch route:
   - App install/app promotion when store and events are ready
   - landing/waitlist/lead route when app install path is blocked
   - web conversion route when web checkout is the true destination
5. Write paused draft specs:
   - campaign names and objective
   - ad set/ad group names, market, age posture, audience route, placements, budget, optimization event
   - creative/ad names, asset paths, primary text, headline, CTA, destination
   - UTMs and event mapping
   - readback verification fields
6. State the approval gate:
   - read-only inspection can run after the user asks
   - creating paused drafts requires explicit approval of the draft plan
   - activation, budget increase, active targeting changes, or pausing/deleting live objects require separate explicit approval

## Default Mobile Test Shape

For a first paid test:

- Keep audience broad unless the platform and policy context justify narrowing.
- Use 3-5 genuinely distinct concepts.
- Start with a small learning budget.
- Judge by the chosen objective, not only CTR.
- Do not declare winners from tiny spend or low event volume.

## Output Contract

Write launch specs under:

```text
docs/[project-name]/growth/paid-acquisition-launch-plan.md
```

Return:

- launch route
- blockers
- paused draft spec
- approval gates
- exact downstream ad-platform operator to use
- reporting cadence
