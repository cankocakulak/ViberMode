# Workflow: Game Level Pack

> Add or tune a focused pack of levels for one existing level-based prototype.

## Purpose

Use this when a game has a promising loop but needs more levels, a better curve, late-level fairness, tutorial pacing, or replay goals.

## Inputs

- `target_repo`
- `prototype_name` - required unless the workflow is explicitly allowed to choose the best level-based candidate
- optional `level_count` - default 8
- optional `curve_goal` - tutorial, early, mid, late, expert, or full mini-pack

## Meaningful Level Contract

Read `packs/vibermode/patterns/game-hypercasual-quality-bar.md`.
Also read `packs/vibermode/patterns/game-production-quality-gate.md` for the level curve gate and score caps.

Every added or changed level needs:

- intent label
- target player behavior
- progression dimension
- fairness constraint
- expected completion pressure
- reason it is not just a bigger number

## Steps

1. Read level definitions, model rules, scoring/rank rules, progress store, result shell, and tests.
2. Define progression dimensions: board size, spawn odds, move/time budget, blockers, hazards, combos, goals, routes, or resource pressure.
3. Add or tune levels with clear intent per level.
4. Keep all levels directly playable from the map during tuning unless the user asks for locked progression.
5. Add fairness checks: minimum legal moves, useful groups/routes, maximum hazard density, reachable goals, and enough budget for learning misses.
6. Validate tutorial/early, middle, and late representative levels with model tests or deterministic solve simulation, then final gate when practical.

## Required Output

- new or changed level definitions
- per-level intent table
- focused model tests for level solvability/fairness
- `docs/[project-name]/[prototype-id]-level-plan.md`
- validation results and screenshots if the level map/result screen changed
- production-gate level status and any score caps applied

Use a target-specific artifact whenever a single prototype is selected. Do not overwrite shared `game-level-plan.md` files during concurrent or overnight runs; shared files may only be brief indexes that point at target-specific evidence.

## Guardrails

- Do not invent a new mechanic family unless a level cannot be made interesting without it.
- Avoid making late levels difficult only through randomness or hidden failure.
- Do not count a level as meaningful if only score target, timer, or board size changed without changing player behavior.
- For full-production/new-game passes, do not stop at fewer than 20 levels/challenges unless the artifact marks the pass `BLOCKED` or `INCOMPLETE`.
