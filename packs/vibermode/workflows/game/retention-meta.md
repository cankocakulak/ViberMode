# Workflow: Game Retention Meta

> Add a light retention layer to a playable game after the core loop, levels, and result flow work.

## Purpose

Use this after a prototype has a clear loop and enough levels to justify repeat play. This workflow adds small meta reasons to return without hiding weak gameplay behind menus.

## Inputs

- `target_repo`
- `prototype_name`
- optional `meta_type` - daily challenge, streak, mastery badge, achievement, leaderboard placeholder, collection, skin preview, or auto
- optional `scope` - default `small`

## Steps

1. Verify the core game has a passing quality score or no critical fail flags.
2. Choose one meta hook tied to the core loop.
3. Define the player promise in one sentence.
4. Implement local-only state first unless the repo already has approved backend/game-service wiring.
5. Add result/map/dashboard visibility without bloating the playable board.
6. Add tests for persistence and edge cases.
7. Validate.

## Guardrails

- Do not add retention meta before the first-session game is fun.
- Do not introduce backend, ads, monetization, or account requirements here.
- Do not add more than one meta system per pass.
- Keep failure/retry fast.

## Required Output

- meta hook description
- changed persistence/result/dashboard surfaces
- tests and validation
- next tuning prompt
