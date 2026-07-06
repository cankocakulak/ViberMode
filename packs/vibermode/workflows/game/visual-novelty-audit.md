# Workflow: Game Visual Novelty Audit

> Check whether a prototype looks, moves, and reads too similarly to previous prototypes before or after a design pass.

## Purpose

Use this when new games feel samey, generic, flat, or too close to the shared shell. This workflow protects the design-character pass from repeating the same card layouts, palettes, feedback rhythm, and result shells.

## Inputs

- `target_repo`
- `project_name`
- `prototype_name` - required unless the workflow may choose the newest prototype
- optional `comparison_count` - default `3`
- optional `allow_low_risk_fixes` - default `false`

## Steps

1. Collect current screenshots when practical.
2. Read `packs/vibermode/patterns/game-production-quality-gate.md`.
3. Read recent prototype screenshots, docs, and UI files for the last `comparison_count` comparable games.
4. Compare:
   - palette families
   - board framing
   - card/glass usage
   - primary object silhouettes
   - HUD density and placement
   - result shell
   - level map shell
   - motion/celebration rhythm
   - hazard/bonus/readability language
5. Name the prototype's intended visual metaphor and signature object.
6. Flag repeated choices that make the game feel like a reskin.
7. Apply score caps when screenshots are missing or the shell is repeated.
8. Produce design-character prompts that target the exact sameness risks.

## Required Output

Write:

```text
docs/[project-name]/[prototype-id]-visual-novelty-audit.md
```

When auditing the whole portfolio, use the shared `game-visual-novelty-audit.md` filename. When `prototype_name` is provided or selected, use the target-specific filename above and do not overwrite shared files during concurrent runs.

Include:

- screenshots inspected or missing
- comparison prototypes
- repeated elements
- distinctive elements
- novelty score from 0 to 10
- required changes before the design can be called distinct
- exact `game-design-character` prompt

## Guardrails

- Do not force novelty by making the game less readable.
- Do not change core rules.
- Do not use novelty as an excuse for decoration that does not communicate state.
- If the novelty score is below 6, route to `game-design-character` before more level or meta work.
- Do not give novelty above 7 without a screenshot/current visual inspection and comparisons against at least two recent prototypes.
