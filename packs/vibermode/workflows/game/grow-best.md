# Workflow: Game Grow Best

> Choose the highest-ROI existing playable prototype and improve one bounded layer.

## Purpose

Use this when the repo already has playable prototypes and the goal is to make the best candidate stronger. Do not add a new prototype.

## Inputs

- `target_repo` - existing repo root.
- `project_name` - artifact slug.
- optional `prototype_name` - if absent, choose the best candidate by evidence.
- optional `growth_theme` - mechanics, levels, result shell, feedback, tutorial, design, validation, or "auto".

## Selection Rubric

Prefer the prototype that has:
- a clear core loop with room to deepen
- reachable hub/direct launch path
- existing tests or testable model surface
- visible upside from one bounded pass
- no large unresolved P0 blocker

Record why the chosen prototype won and why others were deferred.

## Steps

1. Read `packs/vibermode/patterns/game-hypercasual-quality-bar.md`, `packs/vibermode/patterns/game-production-quality-gate.md`, and `packs/vibermode/patterns/game-reference-benchmark.md`.
2. Inspect registered playable prototypes, docs, recent screenshots, tests, and validation state.
3. Pick one prototype and one growth theme.
4. Capture or inspect the current surface when practical.
5. If the growth theme touches design, feedback, tutorial first-read, or quality scoring, create/update `docs/[project-name]/[prototype-id]-reference-benchmark.md` before editing.
6. Implement one bounded improvement: deeper mechanic, better feedback, stronger result shell, level curve fix, tutorial fix, or design/readability pass.
7. Update focused tests and docs.
8. Run focused validation and final validation when the pass is wired.

## Required Output

- `docs/[project-name]/[prototype-id]-growth-pass.md` or updated review/status artifact.
- Chosen prototype, reason, changed behavior, and deferred candidates.
- Reference benchmark path/status when the pass touches design, first-read, feedback, or quality scoring.
- Validation commands/results and screenshot paths when practical.
- production-gate status and score caps, if any.

Use a target-specific artifact after the chosen prototype is known. Do not overwrite shared `game-growth-pass.md` files during concurrent or overnight runs; shared files may only be brief indexes that point at target-specific evidence.

## Guardrails

- Do not add a separate new prototype.
- Do not spread changes across multiple games unless shared wiring blocks validation.
- Stop after one coherent improvement theme.
- Do not add a new feature when the production gate says the bigger problem is missing reachability, missing result/progress shell, generic design, missing screenshots, weak levels, or missing tests.
