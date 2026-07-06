# Game Workflow Index

Game workflows live under `packs/vibermode/workflows/game/`. Workflow IDs and Codex skill names stay stable even when file paths move.

Prompt templates live in `docs/reference/game-automation-prompt-library.md`.

For named-target or new-game automation runs, workflow artifacts must be target-specific under `docs/[project-name]/[prototype-id]-*.md`. Shared `game-*.md` files are reserved for portfolio/index summaries so concurrent runs do not overwrite each other's handoff evidence.

Production quality gate lives at `packs/vibermode/patterns/game-production-quality-gate.md`. New/full/grow/design/level/scorecard passes should apply this gate before claiming success or assigning high scores.

Reference benchmark contract lives at `packs/vibermode/patterns/game-reference-benchmark.md`. New/full/grow/design/quality runs that claim game or design quality should produce `docs/[project-name]/[prototype-id]-reference-benchmark.md` and compare the final screenshot against current public references plus in-repo prototypes.

## Canonical User-Facing Entry Points

- `full-production-pass.md` - create one new fuller playable game; this is the only default new-game production path.
- `grow-best.md` - improve the best or named existing prototype.
- `level-pack.md` - add or rebalance levels.
- `design-character.md` - strengthen identity, character, and feedback.
- `feature-experiment.md` - test one bounded mechanic.
- `bugfix-polish.md` - fix blockers and flow issues.
- `review-rank.md`, `quality-scorecard.md`, `visual-novelty-audit.md` - evaluate and route.

## Creation

- `new-prototype.md` - internal/fast fresh playable prototype creation; not a default Play runner
- `signature-prototype.md` - internal composition layer for new prototype plus first audit, identity, levels, polish, and validation
- `full-production-pass.md` - one-button new game production with core logic, character, 20 levels, iteration, and evidence

## Improvement

- `grow-best.md` - improve the best or named existing prototype
- `level-pack.md` - add or rebalance levels, stars, goals, and difficulty progression
- `design-character.md` - strengthen visual identity, character, world cues, motion, and feedback
- `feature-experiment.md` - add one bounded mechanic, power-up, hazard, combo, or retention experiment

## Audit

- `review-rank.md` - compare prototypes and pick next work
- `quality-scorecard.md` - score hyper-casual quality and route critical fails
- `visual-novelty-audit.md` - catch repeated visual language and generic presentation

## Orchestration

- `night-loop.md` - advanced portfolio batch orchestration; not the default one-game production path
- `bugfix-polish.md` - fix launch, transitions, persistence, result screens, smoke, and validation blockers
- `prototype-lab.md` - legacy compatibility router for older combined game prompts

## Support And Future

- `template-kit.md` - maintain reusable prototype templates without centralizing visual identity
- `retention-meta.md` - add light replay/retention layers after gameplay quality passes
- `store-readiness.md` - audit store/internal-testing readiness after gameplay quality passes
- `lab-bootstrap.md` - future greenfield setup for a modular game prototype lab
- `from-zero.md` - future bootstrap plus first signature prototype path
