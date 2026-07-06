# Workflow: Game Bugfix Polish

> Fix cross-prototype bugs, broken transitions, launch paths, result screens, smoke tests, and small UX blockers.

## Purpose

Use this when the lab is accumulating playable games but shared wiring, navigation, maps, result screens, tests, or simulator launch behavior is flaky.

## Inputs

- `target_repo`
- optional `issue_brief` - bug, failing test, broken flow, or "find highest priority polish blocker"
- optional `scope` - one prototype, shared hub, tests, or auto

## Steps

1. Reproduce or inspect the blocker with the cheapest command or runtime check.
2. Classify it: launch/wiring, navigation, result/next/retry, level map, persistence, layout, smoke test, validation, or simulator state.
3. Apply the smallest fix that preserves prototype boundaries.
4. Add or repair focused tests so the bug stays fixed.
5. Run the failing check first, then final validation when practical.

## Required Output

- concise diagnosis with file/surface references
- patch scoped to the bug or transition polish
- validation evidence
- updated `docs/[project-name]/[prototype-id]-validation-report.md`, shared `docs/[project-name]/validation-report.md`, or status artifact

## Guardrails

- Do not add new mechanics.
- Do not redesign a prototype unless the bug is visual readability.
- Do not use this for broad growth; route that to `game-grow-best`.
- For named-prototype work during concurrent runs, prefer the target-specific validation report and only append to the shared validation report if it will not overwrite unrelated evidence.
