# Workflow: Game Feature Experiment

> Add one bounded gameplay feature or mechanic experiment to a selected prototype and test whether it improves the loop.

## Purpose

Use this when the game needs a new mechanic, special object, combo rule, objective type, meta hook, or retention experiment.

## Inputs

- `target_repo`
- `prototype_name` - required unless the workflow may choose a candidate
- optional `feature_brief` - mechanic or problem to solve
- optional `experiment_size` - default `small`

## Steps

1. Read `packs/vibermode/patterns/game-production-quality-gate.md`.
2. Identify the loop problem: too shallow, too random, no comeback, weak risk/reward, weak replay, or unclear mastery.
3. If the gate shows missing reachability, result/progress shell, generic design, missing screenshots, weak levels, or missing tests, route there instead of adding a feature.
4. Propose one feature with hypothesis, player action, reward/penalty, visual state, and failure case.
5. Implement the feature in model/state first, then UI feedback.
6. Add tutorial/tip/result copy only where the feature first appears.
7. Add focused tests for rule behavior, scoring/ranking impact, and edge cases.
8. Validate and record whether the feature should keep, iterate, or revert in a later pass.

## Required Output

- one feature implemented or a documented no-go decision
- tests proving the feature rules
- updated level/config use where needed
- `docs/[project-name]/[prototype-id]-feature-experiment.md`
- validation results
- production-gate status and score caps, if any

Use a target-specific artifact whenever a single prototype is selected. Do not overwrite shared `game-feature-experiment.md` files during concurrent or overnight runs; shared files may only be brief indexes that point at target-specific evidence.

## Guardrails

- Add at most one mechanic family per pass.
- Do not mask a weak core loop by adding menus or meta systems.
- Keep feature code modular enough to remove if the experiment fails.
