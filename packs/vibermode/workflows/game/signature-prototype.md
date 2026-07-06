# Workflow: Game Signature Prototype

> Create one new playable prototype, then immediately run a signature-quality pass so the result feels like a distinct game rather than another generic prototype.

## Purpose

Use this as the upper workflow for "new game, but do not leave it flat." It composes focused game workflows; it must not become a monolithic builder.

This workflow exists because a raw new prototype often proves the mechanic but still shares the same simple UI, level shape, reward language, and interaction rhythm as prior prototypes. The signature pass forces a second look at identity, feel, levels, and blockers before handoff.

For Game With Water, treat the app name as a prototype lab/app shell, not a water-theme requirement.

## Inputs

- `target_repo` - existing repo root. Default: `/Users/mcan/game-with-water` only when context matches.
- `project_name` - default `game-with-water`.
- optional `game_brief` - mechanic, genre, theme, reference, or "find a strong game direction".
- optional `signature_intensity` - `tight`, `standard`, or `bold`; default `standard`.
- optional `feature_experiment` - `none`, `if-needed`, or `required`; default `if-needed`.
- optional `build_policy` - default `final-gate`.

## Composed Workflows

Run these focused workflows in order, stopping at blockers:

1. `game-new-prototype` - create one new playable game.
2. `game-visual-novelty-audit` scoped to the new prototype - identify sameness risks before design work.
3. `game-review-rank` scoped to the new prototype - audit first-play clarity and quality risks.
4. `game-design-character` - define and implement a distinct visual/character/motion language.
5. `game-level-pack` when the game is level-based - add/tune a small progression pack.
6. `game-feature-experiment` only when the audit finds the core loop is too thin.
7. `game-quality-scorecard` - score the result and expose critical fails.
8. `game-bugfix-polish` - fix launch, transition, result, persistence, smoke, or validation blockers.
9. Final validation and handoff.

## Signature Audit Gate

After `game-new-prototype`, inspect the new game before broad edits.

Record a short audit in:

```text
docs/[project-name]/[new-prototype-id]-signature-pass.md
```

Minimum fields:

- new prototype name and launch path
- first 10-second read: what the player understands without instructions
- sameness risks versus existing prototypes: palette, cards, layout, object shapes, feedback rhythm, result shell, level map, scoring language
- one named fantasy, metaphor, character, or world hook
- one signature interaction moment
- one signature failure or hazard read
- one progression dimension that changes how the player thinks
- which focused workflows will run next and why

Do not continue into design work until the audit names what this game should feel like and how it should differ from at least two existing prototypes or recent game outputs.

## No-Handwave Quality Gate

Before handoff, run or produce `game-quality-scorecard` evidence for the new prototype.

If the scorecard has critical fail flags, do not present the prototype as finished. Route once to the focused workflow that owns the weak layer:

- weak identity or samey visuals -> `game-design-character`
- weak level progression -> `game-level-pack`
- thin loop -> `game-feature-experiment`
- broken launch/result/validation -> `game-bugfix-polish`

Stop only after applying one bounded remediation or after naming the blocker clearly.

## Design Composition Rules

- Keep `game-design-character` responsible for the actual visual language implementation.
- Keep `game-level-pack` responsible for level construction and difficulty math.
- Keep `game-feature-experiment` responsible for one mechanic experiment only.
- Keep `game-bugfix-polish` responsible for blockers and validation repair.
- Do not duplicate detailed rules from those workflows here. Improve the child workflow when that layer needs to become smarter.

## Stop Conditions

Stop with a clear blocker when:

- `game-new-prototype` did not create a reachable playable prototype
- the first-play audit cannot identify a distinct direction without product judgment
- validation turns red and cannot be fixed inside one bugfix/polish pass
- level or feature work would require redesigning the core game rather than strengthening it

## Required Output

- new prototype summary and launch path
- `docs/[project-name]/[new-prototype-id]-signature-pass.md`
- `docs/[project-name]/[new-prototype-id]-visual-novelty-audit.md`
- `docs/[project-name]/[new-prototype-id]-quality-scorecard.json`
- design identity implemented through `game-design-character`
- level/progression work when applicable
- focused tests and final validation result
- screenshot paths when practical
- recommendation for the next lower-level workflow to improve independently

Shared generic `game-*.md` files may only be used as brief indexes. New-game evidence must stay in `[new-prototype-id]-*.md` files so concurrent automations cannot overwrite another prototype's handoff.
