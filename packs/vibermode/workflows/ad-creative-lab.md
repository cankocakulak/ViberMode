# Workflow: Ad Creative Lab

> Generate policy-aware mobile app ad creative briefs, copy variants, scripts, storyboards, image/video prompts, and asset production plans.

## Fast Path

Use this workflow when a user wants to create or improve ad creatives for a mobile app, especially after a growth strategy or competitor research pass.

Good inputs:

- product docs or growth plan
- app screenshots, screen recordings, design references, or UI mockups
- target channel and format
- competitor creative patterns
- policy-sensitive category notes
- selected acquisition route and success metric

## Boundary

Own:

- creative pillars and concept generation
- ad copy, hooks, headlines, CTAs, and compliance notes
- UGC scripts and acted scenarios
- video storyboards and shot lists
- static, carousel, app-demo, and store-screenshot creative briefs
- image/video generation prompts and asset manifests

Do not own:

- live ad account writes
- campaign budget decisions
- final legal or regulated-claims approval
- store listing mutation unless routed to storefront workflow
- pretending generated mockups are real shipped screenshots

## Related Workflows

- Use `mobile-growth-strategy` when positioning, audience posture, or acquisition route is still unclear.
- Use `paid-acquisition-launcher` when assets are approved and a paused campaign/ad spec is needed.
- Use `mobile-competitor-teardown` when competitor visuals or paywall/onboarding patterns need evidence.
- Use `mobile-storefront` when App Store or Play screenshots/listing assets should be produced or updated.

## Workflow

1. Resolve app, channel, format, market, destination, and success metric.
2. Read current growth and product artifacts under `docs/[project-name]/`.
3. Select one creative pillar per concept. Do not generate many near-duplicate copy variants as if they were separate concepts.
4. Build each brief with:
   - id
   - format
   - hypothesis
   - target user moment
   - hook
   - primary text
   - visual direction
   - scene, storyboard, or panel plan
   - CTA
   - compliance notes
   - success metric
   - variants
   - assets needed
5. Run a claims and policy pass:
   - Does copy assert something sensitive about the viewer?
   - Does the visual imply shame, crisis, before/after transformation, or an unsupported outcome?
   - Are product claims backed by shipped functionality?
   - Are generated mockups labeled internally when they are not real screenshots?
6. Save the creative bank and any asset manifest.

## Creative Quality Rules

- Prefer product demonstration over generic stock imagery.
- Show real app states or honest mockups when possible.
- Make the first 2 seconds legible without sound.
- Keep one concept focused on one user moment and one product action.
- Write for mobile placement length, not website hero copy.
- Make variants meaningfully different by hook, visual, or product mechanism.

## Policy-Sensitive Copy Rules

For regulated or sensitive apps:

- Use neutral scenarios: "When a task is hard to start..." instead of "You have ADHD."
- Use first-person UGC carefully: "I wanted a calmer way to..." is safer than "You are struggling with..."
- Avoid diagnosis, treatment, guaranteed earnings, guaranteed admissions, guaranteed weight loss, crisis, or shame hooks.
- Do not target sensitive conditions through copy or audience labels.

## Output Contract

Write creative briefs under:

```text
docs/[project-name]/growth/creative-briefs.md
```

If asset production starts, add:

```text
docs/[project-name]/growth/asset-manifest.json
```

Return:

- selected concept ids
- creative brief path
- asset requirements
- compliance risks
- recommended next workflow
