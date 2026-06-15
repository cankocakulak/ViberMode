# Launch Appeal Gate Plan

## Analysis

The path from a ready idea to TestFlight already has implementation, runtime validation, experience review, and TestFlight submission gates. The missing piece is an explicit idea-level launch appeal contract: the system can select a practical app idea without preserving the hook, first-value moment, signature interaction, visual direction, and TestFlight demo path that make the app feel desirable rather than generic.

## Strategy

Add a `strategic-research-v3` gate that keeps the existing market, AI/backend, differentiation, and learning-loop requirements while adding `launch_appeal`. Surface that field in backlog selection so factory run manifests can pass it into product-to-code.

## Changes Required

- `scripts/idea-backlog.mjs`: validate `launch_appeal` for `strategic-research-v3` and expose it in selected idea output.
- `scripts/research-app-store-gap.mjs`: generate launch appeal defaults for future candidate drafts and mark generated candidates as `strategic-research-v3`.
- Product/research workflow docs: require launch appeal for factory-bound ready ideas.
- Daily iOS factory and product-to-code docs: preserve launch appeal into PRD, UX, stories, implementation, experience review, and screenshots.
- Private backlog: upgrade `ielts-cue-card-sprint` with strategic v3 fields and a concrete TestFlight demo path.

## Verification

- `node --check scripts/idea-backlog.mjs`
- `node --check scripts/research-app-store-gap.mjs`
- `node scripts/idea-backlog.mjs validate --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state`
- `node scripts/idea-backlog.mjs select --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state`
- `npm run validate`
