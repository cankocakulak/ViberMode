---
name: paid-acquisition-launcher
description: Prepare approval-gated paid acquisition launch plans for mobile apps across Meta, TikTok, Google Ads, Apple Search Ads, and landing/waitlist routes. Use when moving approved creatives toward campaign/ad set/ad drafts, platform preflight, naming, budget assumptions, audience posture, UTMs, tracking requirements, and paused-by-default ad-platform write plans.
---

# Paid Acquisition Launcher

Read and follow the canonical ViberMode workflow first:

- `../viber-mode/packs/vibermode/workflows/paid-acquisition-launcher.md`

## Boundary

Own:

- paid-launch preflight
- destination route, campaign structure, naming, budget assumptions, audience posture, and UTM plan
- paused draft specs and approval gates
- handoff to the relevant ad-platform operator

Do not own:

- activation or live spend without explicit approval
- direct platform writes outside the relevant ad-platform operator
- creative production
- attribution SDK implementation

## Output

Write launch plans under `docs/[project-name]/growth/` and return the launch route, blockers, paused draft spec, approval gates, and downstream operator.
