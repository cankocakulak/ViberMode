# Workflow: Game Review Rank

> Review existing playable prototypes, rank them, and choose the next action.

## Purpose

Use this when the goal is not to build immediately, but to understand which prototypes deserve new levels, design passes, feature experiments, or retirement.

## Inputs

- `target_repo`
- `project_name`
- optional `review_depth` - default `bounded`
- optional `allow_low_risk_fixes` - default `true`

## Steps

1. Inventory registered prototypes, direct launch routes, docs, tests, and screenshots.
2. Run or inspect each playable prototype when practical.
3. Read `packs/vibermode/patterns/game-hypercasual-quality-bar.md`.
4. Score each prototype on:
   - core-loop clarity
   - first 10 seconds
   - design identity
   - visual novelty
   - tutorial/result/level-map shell
   - difficulty progression
   - meaningful level design
   - feedback readability
   - validation coverage
   - upside for next pass
5. Produce or update `game-quality-scorecard` evidence when the review is used as a gate before more automation.
6. Apply only low-risk P0/P1 wiring or validation fixes required to judge the prototypes.
7. Produce ranked recommendations with exact next workflow prompts.

## Required Output

- `docs/[project-name]/game-review-rank.md`
- for a review scoped to one named prototype, prefer `docs/[project-name]/[prototype-id]-review-rank.md`
- ranked table of prototypes
- recommended next `game-new-prototype`, `game-signature-prototype`, `game-grow-best`, `game-quality-scorecard`, `game-visual-novelty-audit`, `game-level-pack`, `game-design-character`, or `game-feature-experiment` prompt
- validation/screenshot evidence or explicit gaps

Use the shared `game-review-rank.md` only for true portfolio reviews. Named-target or automation-child reviews should write target-specific artifacts so concurrent runs cannot overwrite each other's evidence.

## Guardrails

- Do not add new prototypes.
- Do not run broad growth passes.
- Keep fixes limited to evaluation blockers.
