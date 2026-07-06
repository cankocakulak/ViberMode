# Workflow: Game Full Production Pass

> Build one new playable game inside an existing prototype app until it has a real core loop, characterful design, guided progression, 20 meaningful levels, validation evidence, and explicit iteration notes.

## Purpose

Use this when the user wants the one-button new-game behavior: not a loose prototype, not a single polish pass, but a fuller hyper-casual game slice that can be played level by level and judged as a real candidate.

This workflow composes focused game workflows. It is allowed to be more demanding than `game-signature-prototype`; do not hand off after a scaffold, a generic board, or a handful of levels.

For Game With Water, treat the app name as a prototype lab/app shell, not a water-theme requirement.

Read before starting:

- `packs/vibermode/patterns/game-hypercasual-quality-bar.md`
- `packs/vibermode/patterns/game-production-quality-gate.md`
- `packs/vibermode/patterns/game-reference-benchmark.md`

## Inputs

- `target_repo` - existing repo root. Default: `/Users/mcan/game-with-water` only when context matches.
- `project_name` - default `game-with-water`.
- optional `game_brief` - mechanic, genre, theme, reference, or "find a strong game direction".
- optional `level_count` - default 20.
- optional `production_intensity` - `focused`, `full`, or `max`; default `full`.
- optional `build_policy` - default `final-gate`.

For manual Play automations, treat `production_intensity` as `max` unless the user explicitly asks for a quick pass. Plan for a 60-90 minute production-quality attempt. If the host stops earlier or the pass cannot complete the gates, report `INCOMPLETE` or `BLOCKED` with evidence instead of claiming success.

## Composed Workflows

Run focused workflows sequentially and stop only at real blockers:

1. `game-review-rank` - understand the existing portfolio and avoid duplicating recent outputs.
2. Reference benchmark - research current public game references and write `[new-prototype-id]-reference-benchmark.md` as soon as the prototype id is known. Before the id is known, keep a draft matrix in the production handoff.
3. `game-signature-prototype` - create one new playable game.
4. `game-design-character` - establish the game's visual identity, character/world hook, feedback language, motion, and readability against the benchmark.
5. `game-level-pack` with `level_count=20` - add or tune a 20-level progression.
6. `game-feature-experiment` only when the core loop is still too thin after first play.
7. `game-quality-scorecard` - score the result and expose critical fails, including reference-fit score caps.
8. `game-visual-novelty-audit` - verify the result is not visually generic or samey.
9. `game-bugfix-polish` - fix launch, transition, tapping, result, persistence, smoke, or validation blockers.
10. Final validation and handoff.

Before coding, write or include a benchmark matrix with at least five references: three current public references, one mechanic-adjacent reference, one visual/UX-quality reference, and at least two in-repo comparison prototypes. The goal is not to copy a chart game; it is to force a concrete answer for first 10 seconds, pressure, visual hook, feedback energy, level/progression promise, and what the new game must not repeat.

You may seed the benchmark with `game-reference-benchmark-seed.mjs`, but the final artifact must not remain seed-only or TODO-only. Replace seed rows with current target-relevant references when needed, add in-repo comparisons, inspect the final screenshot, and score reference-fit.

## Production Acceptance Contract

Do not present the pass as complete unless these are true or a blocker is explicitly named:

- Reachability: the game opens from the app's hub/dashboard and returns cleanly.
- Core logic: the primary input loop, win/loss/scoring, reset/retry, and progression state are implemented in a maintainable model rather than only in view glue.
- First play: the player can make a meaningful action within 10 seconds without reading a long explanation.
- Design identity: the game has a named fantasy, character/object/world hook, recognizable silhouettes, distinct palette, readable hazard/bonus language, and a result/tutorial presentation that does not reuse the same generic shell.
- Guided progression: there is a tutorial or first teaching level, level selection/progression, next/retry flow, and player-facing feedback about what improved.
- Levels: ship 20 authored or tuned levels/challenges by default. Each changed level must have intent, new pressure or rule variation, expected player behavior, score/star target, and a fairness/solvability note.
- Difficulty curve: early levels teach, middle levels combine rules, late levels pressure mastery without becoming arbitrary or grindy.
- Feedback: success, failure, combo, danger, bonus, star gain, level complete, and retry states have distinct visual/motion feedback.
- Validation: include focused logic tests where the repo supports them plus the strongest final build/smoke validation practical for the app.
- Evidence: record screenshots or simulator observations when practical, quality scorecard, novelty audit, and concise handoff notes.
- Reference benchmark: record current public references, in-repo comparisons, cheap/generic red flags, final screenshot comparison, and reference-fit status.
- Production gate: apply all hard failure conditions and score caps from `game-production-quality-gate.md`.

## Iteration Requirement

Run an explicit self-improvement loop instead of stopping after first implementation:

1. Implement a playable slice.
2. Play or inspect the first 60 seconds and at least three representative levels: tutorial/early, middle, late.
3. Run or update scorecard/novelty/reference-benchmark evidence.
4. Apply the highest-ROI remediation pass.
5. Repeat until acceptance criteria are met, validation blocks progress, or at least three implementation-review-remediation cycles have been attempted.

If the job ends in less than a substantial production pass, the handoff must say why: all acceptance criteria were met with evidence, the repo/runtime blocked progress, or the environment stopped the run. Do not use elapsed time alone as proof of quality.

Do not count a loop as complete unless it produced new evidence: screenshot/simulator observation, test result, level simulation, or a concrete code change driven by critique.

## Production Artifact

Create or update:

```text
docs/[project-name]/[new-prototype-id]-full-production-pass.md
```

Minimum fields:

- new game name and launch path
- one-sentence core loop
- design/character pillars
- level progression table or manifest summary for all 20 levels
- iteration log with at least implementation, review, remediation, and validation notes
- quality scorecard summary and critical fails
- visual novelty audit summary
- validation commands and results
- screenshots or simulator notes when practical
- blockers, deferred work, and next exact workflow prompt
- benchmark matrix from the research scan
- target-specific reference benchmark path and final reference-fit status
- production-gate status: `PASS`, `BLOCKED`, or `INCOMPLETE`

Do not use `docs/[project-name]/game-full-production-pass.md` as the primary handoff for a target-specific or new-game run. That shared filename is reserved only for a short index/summary that links to target-specific files. When multiple game automations run against the same repo, target-specific artifacts are required so one run cannot overwrite another run's evidence.

After writing artifacts, run the artifact checker when available:

```bash
node /Users/mcan/.codex/skills/viber-mode/packs/vibermode/scripts/game-production-artifact-gate.mjs --docs docs/[project-name] --prototype-id [new-prototype-id] --mode full-production
```

## Stop Conditions

Stop with a clear blocker when:

- the target repo cannot run enough to verify playable behavior
- the new game cannot be launched from the app shell after one bugfix/polish attempt
- validation turns red and cannot be recovered inside one focused remediation pass
- 20-level work would be fake because the core loop is not stable enough; fix or route the core loop first
- the next decision requires product judgment that cannot be inferred from the repo, scorecard, or user request

## Required Output

- one newly created reachable game candidate
- `docs/[project-name]/[new-prototype-id]-full-production-pass.md`
- `docs/[project-name]/[new-prototype-id]-reference-benchmark.md`
- 20-level progression or an explicit blocker preventing truthful 20-level delivery
- implemented design/character/game-feel pass
- quality scorecard and visual novelty evidence
- focused tests and final validation result
- screenshot paths or simulator notes when practical
- exact next lower-level workflow prompt for further improvement
