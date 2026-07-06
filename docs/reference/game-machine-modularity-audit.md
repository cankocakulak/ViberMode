# Game Machine Modularity Audit

## Snapshot

ViberMode now has a usable modular game-machine shape for existing prototype-lab repos:

- Atomic workflows live under `packs/vibermode/workflows/game-*.md`.
- Codex skill wrappers live under `adapters/codex/skills/game-*/SKILL.md`.
- Local Play runners live under `$CODEX_HOME/automations/manual-viber-game-*`.
- `game-prototype-lab` is a legacy router.
- `game-signature-prototype`, `game-full-production-pass`, and `game-night-loop` are upper composition workflows.

Game With Water supports the model well: it has a Prototype Hub, per-prototype folders, model tests, UI smoke tests, simulator scripts, validation scripts, screenshots, and per-project docs.

## What Is Modular Enough

These layers can be improved independently:

- `game-new-prototype` - fast fresh prototype creation.
- `game-signature-prototype` - post-new-game quality chain.
- `game-full-production-pass` - one-button fuller game production with core logic, characterful design, 20 levels, iteration, and evidence.
- `game-quality-scorecard` - objective anti-handwave quality gate.
- `game-visual-novelty-audit` - repeated/generic visual-language detector.
- `game-grow-best` - one bounded improvement to an existing game.
- `game-level-pack` - level and difficulty curve work.
- `game-design-character` - identity, character, motion, and readability.
- `game-feature-experiment` - one mechanic/retention experiment.
- `game-bugfix-polish` - blockers, transitions, smoke, validation.
- `game-review-rank` - portfolio scoring and next action routing.
- `game-night-loop` - sequential batch orchestration.

This is the right direction: lower workflows stay narrow, while upper workflows compose them.

## Added Future/Support Layers

These are now represented as separate workflows so they can evolve without bloating the core existing-app pipeline:

- `game-lab-bootstrap`
- `game-from-zero`
- `game-template-kit`
- `game-retention-meta`
- `game-store-readiness`

For the first phase, do not route ordinary Game With Water work to `game-lab-bootstrap` or `game-from-zero`.

## Staging Notes

### 1. Greenfield game-lab bootstrap

The current first-phase game workflows still assume an existing prototype lab. A future workflow now exists for:

- creating a new game repo or app shell
- installing the prototype hub pattern
- creating validation scripts
- setting source-of-truth project generation rules
- bootstrapping first prototype registry/tests/docs

Use this only when explicitly starting or preparing a new repo:

```text
game-lab-bootstrap
  -> repo/app shell setup
  -> prototype hub skeleton
  -> validation scripts
  -> first empty prototype slot
  -> docs and automation handoff
```

Then:

```text
game-from-zero
  -> game-lab-bootstrap
  -> game-signature-prototype
  -> game-review-rank
```

### 2. Objective quality scoring

Review no longer needs to rely only on prose scoring. Use the scorecard contract so agents can compare prototypes consistently.

Workflow:

```text
game-quality-scorecard
```

Score dimensions:

- first 10-second clarity
- core loop depth
- control feel
- design identity
- progression curve
- feedback readability
- replay/retention hook
- technical validation
- store-readiness risk

Output:

```text
docs/[project-name]/game-quality-scorecard.json
```

### 3. Visual novelty guard

`game-signature-prototype` now has a reusable detector/checklist for repeated layout, palette, cards, result shells, or feedback rhythm.

Workflow:

```text
game-visual-novelty-audit
```

It should compare screenshots and implementation surfaces against the last N prototypes before a design pass.

### 4. Template and generator layer

Game With Water has good conventions. ViberMode now has a workflow for extracting reusable templates once patterns stabilize.

Candidate template scopes:

- prototype folder template
- model/test template
- level definition template
- progress/star/result shell template
- screenshot/validation script template

These should live under ViberMode assets or references, not inside a giant workflow.

### 5. Store and retention readiness

The current workflows are prototype-first. Future release-facing game work needs separate workflows for:

- achievements/leaderboards readiness
- local/cloud save readiness
- App Store / Google Play screenshot and metadata truth checks
- live event/daily challenge shell
- privacy/analytics/SDK preflight
- TestFlight/internal testing game QA checklist

Keep these separate from prototype creation.

## Recommended Next Improvements

Priority order for hardening:

1. Exercise `game-full-production-pass` on real runs and tighten the acceptance contract where agents still stop too early.
2. Make `game-quality-scorecard` stricter after real automation runs.
3. Improve `game-visual-novelty-audit` with screenshot comparison conventions.
4. Add concrete template assets under `game-template-kit` only after repeated patterns stabilize.
5. Keep `game-retention-meta` and `game-store-readiness` behind quality gates.
6. Use `game-lab-bootstrap` and `game-from-zero` only when starting a new repo.

## Composition Map

Internal fast ideation:

```text
game-new-prototype
```

Internal quality-new-game child path:

```text
game-signature-prototype
  -> game-new-prototype
  -> game-visual-novelty-audit
  -> game-review-rank scoped audit
  -> game-design-character
  -> game-level-pack
  -> optional game-feature-experiment
  -> game-quality-scorecard
  -> game-bugfix-polish
```

One-button fuller game:

```text
game-full-production-pass
  -> game-review-rank
  -> game-signature-prototype
  -> game-design-character
  -> game-level-pack(level_count=20)
  -> optional game-feature-experiment
  -> game-quality-scorecard
  -> game-visual-novelty-audit
  -> game-bugfix-polish
  -> final validation
```

Existing game growth:

```text
game-review-rank
  -> game-grow-best
  -> game-level-pack or game-design-character or game-feature-experiment
  -> game-quality-scorecard
  -> game-bugfix-polish
```

Greenfield future:

```text
game-from-zero
  -> game-lab-bootstrap
  -> game-signature-prototype
  -> game-quality-scorecard
```

Overnight batch:

```text
game-night-loop
  -> game-review-rank
  -> game-grow-best
  -> game-level-pack or game-design-character
  -> game-quality-scorecard
  -> final validation
```

## Verdict

The current system is modular for existing prototype-lab repos and now has a single first-phase path for one-button fuller game production, plus passive future workflows for zero-to-new-repo and release/store-readiness paths. First-phase Play use should focus on full production passes, visual novelty, scorecards, levels, design character, growth, feature experiments, and bugfix polish. `game-new-prototype`, `game-signature-prototype`, and `game-night-loop` remain support/advanced workflows, not duplicate default runners.

Do not collapse the lower workflows. Add upper workflows and small audit/scoring layers so each capability can keep improving independently.
