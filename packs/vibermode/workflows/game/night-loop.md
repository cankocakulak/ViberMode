# Workflow: Game Night Loop

> Sequentially run multiple modular game-lab passes to grow a prototype portfolio overnight.

## Purpose

Use this as an advanced orchestrator when the goal is to run several distinct portfolio-maintenance passes without manually choosing every pass. It composes atomic workflows; it should not become a monolithic implementation workflow.

Do not use this as the default one-button new-game path. When the user expects one fuller game with core logic, character design, guided progression, and 20 levels, use `game-full-production-pass` directly.

## Inputs

- `target_repo`
- optional `batch_goal` - default `portfolio-maintenance`
- optional `new_game_count` - default 0
- optional `signature_new_game_count` - default 0 unless the prompt explicitly requests new-game volume
- optional `grow_count` - default 1
- optional `level_pack_count` - default 1
- optional `design_character_count` - default 1
- optional `feature_experiment_count` - default 0
- optional `bugfix_budget` - default `only-blockers`

## Atomic Workflows

- `game-review-rank` - choose priorities and next prompts
- `game-new-prototype` - add new playable games
- `game-signature-prototype` - add one new game and immediately run audit, identity, level, polish, and validation passes
- `game-quality-scorecard` - expose whether prototypes are really improving
- `game-visual-novelty-audit` - catch repeated visuals and generic design language
- `game-grow-best` - improve existing best candidate
- `game-level-pack` - add/tune levels
- `game-design-character` - add identity and game feel
- `game-feature-experiment` - add one mechanic experiment
- `game-bugfix-polish` - fix blockers and transitions

## Orchestration Rules

1. Never run multiple passes in parallel against the same repo.
2. Start with a quick review/rank unless a fresh review exists and is current.
3. Run each atomic pass to a validation checkpoint before starting the next.
4. If a pass leaves validation red, route to `game-bugfix-polish` or stop with a blocker.
5. Use `game-full-production-pass` directly instead of `game-night-loop` for one fuller game. Inside a night loop, call `game-full-production-pass` only when the batch explicitly needs one new flagship candidate among other portfolio passes.
6. Use `game-quality-scorecard` after meaningful growth or signature passes so weak outputs route themselves instead of being accepted.
7. After each pass, update a batch manifest:

```text
docs/[project-name]/game-night-loop-status.json
```

8. Stop early when the repo is dirty in a way that cannot be attributed to the current batch, validation is blocked, or the next pass would need product judgment.

## Default Portfolio Maintenance Batch

Use this default when no narrower batch goal is supplied:

1. `game-review-rank`
2. `game-grow-best`
3. `game-level-pack` or `game-design-character`, whichever the review recommends
4. `game-quality-scorecard`
5. `game-bugfix-polish` only for blockers or critical fails
6. final validation and handoff

The run is not a replacement for the one-game production path. It succeeds by improving a selected existing prototype or portfolio layer with evidence.

## Fast Balanced Batch

Use this only when the prompt asks for several lighter passes instead of one fuller game:

1. `game-review-rank`
2. `game-signature-prototype`
3. `game-quality-scorecard`
4. `game-grow-best`
5. `game-level-pack`
6. `game-design-character`
7. final validation and handoff

## Required Output

- batch manifest with pass list, status, commands, screenshots, and blockers
- final summary of new prototypes, grown prototypes, level packs, design passes, experiments, and recommended next queue
