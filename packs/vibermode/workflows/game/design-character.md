# Workflow: Game Design Character

> Give one playable prototype a stronger visual identity, character, world cue, and game-feel layer.

## Purpose

Use this when the mechanics work but the game feels generic, flat, or visually unmemorable.

## Inputs

- `target_repo`
- `prototype_name` - required unless the workflow may choose the weakest visual candidate
- optional `identity_direction` - character, object-world, toy-like, arcade, cozy, tense, premium, or auto

## Steps

1. Inspect the actual running surface and screenshots when practical.
2. Read `packs/vibermode/patterns/game-hypercasual-quality-bar.md`, `packs/vibermode/patterns/game-production-quality-gate.md`, and `packs/vibermode/patterns/game-reference-benchmark.md`.
3. Build or update `docs/[project-name]/[prototype-id]-reference-benchmark.md` with at least three current public references and two in-repo comparisons before editing visuals. You may scaffold from `game-reference-benchmark-seed.mjs`, but final evidence must include target screenshot scoring and resolved cheap/generic flags.
4. Define a concise design language: palette, shape language, typography scale, iconography, motion style, character/object cue, and state system.
5. Name the iconic hook: fantasy/metaphor, signature object, signature interaction, signature celebration, and signature failure/hazard read.
6. Compare against at least two existing prototypes or recent screenshots; record what must not be repeated.
7. Improve important game objects so hazards, bonuses, goals, locks, wildcards, and failures are not color-only.
8. Add tactile feedback: press response, combo/failure effects, result/star reveal, transitions, and reduced-motion respect when available.
9. Capture after screenshots and rescore the prototype screenshot against the reference benchmark.
10. Keep theme assets modular so future redesigns can swap visuals without rewriting game rules.
11. Run screenshot QA across practical simulator sizes and final validation when touched surfaces compile.

## Iconicization Contract

The pass is not complete until the handoff can say:

- what this game would be recognized by in a screenshot
- what object/character/world cue makes it memorable
- what animation or feedback moment feels signature
- what visual/state language separates normal, bonus, danger, failure, and success
- what repeated prior UI pattern was intentionally avoided
- which public references set the polish floor and how the final screenshot compares
- whether the reference-fit score is at least 6.0; if not, the design pass is `REMEDIATE` or `BLOCKED`, not complete

## Required Output

- changed UI/design/motion files
- before/after screenshots when practical
- `docs/[project-name]/[prototype-id]-design-pass.md`
- `docs/[project-name]/[prototype-id]-reference-benchmark.md`
- iconicization notes and novelty risks
- validation results and residual design risks
- production-gate design status and any score caps applied

Use a target-specific artifact whenever a single prototype is selected. Do not overwrite shared `game-design-pass.md` files during concurrent or overnight runs; shared files may only be brief indexes that point at target-specific evidence.

## Guardrails

- Do not bury the playable board behind marketing-style pages.
- Do not use generic one-color palettes or color-only semantics.
- Do not refactor game rules unless required for visual state.
- Do not call a visual pass complete without a fresh screenshot or a concrete simulator visual observation. If capture is blocked, mark the design gate blocked or cap the score using `game-production-quality-gate.md`.
- Do not call a design pass complete when the reference benchmark has fewer than three current public references, no visual observations, or unresolved cheap/generic red flags.
