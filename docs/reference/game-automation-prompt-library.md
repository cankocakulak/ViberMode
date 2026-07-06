# Game Automation Prompt Library

Use these prompts when a Codex chat or a manual run needs more specificity than the saved Play automation prompt. Keep target names explicit when changing an existing game.

Artifact rule for concurrent runs: once a target or new prototype id is known, write target-specific evidence under `docs/game-with-water/` (`[prototype-id]-full-production-pass.md`, `[prototype-id]-quality-scorecard.md/json`, `[prototype-id]-visual-novelty-audit.md`, `[prototype-id]-level-plan.md`, etc.). Shared generic `game-*.md` files are for portfolio/index summaries only and must not be overwritten as the primary handoff for a named game.

Production quality rule: every new/full/grow/design/level/scorecard prompt should tell Codex to read and apply `game-production-quality-gate.md`. A pass must not report success for scaffold-only, docs-only, build-only, screenshot-missing, untested-level, reference-missing, or generic-design output. Apply score caps before writing any high score.

Reference benchmark rule: for new/full/grow/design/quality runs that claim game quality or design quality, require `docs/game-with-water/[prototype-id]-reference-benchmark.md`. It must include current public App Store/Google Play/report references, in-repo comparisons, screenshot observations, reference-fit scoring, cheap/generic red flags, and required remediation if the final screenshot scores below 6.0.

Agents may scaffold this with:

```bash
node /Users/mcan/.codex/skills/viber-mode/packs/vibermode/scripts/game-reference-benchmark-seed.mjs --docs docs/game-with-water --prototype-id [prototype-id] --prototype-name "[Prototype Name]" --workflow [workflow]
```

The scaffold is not enough. The final artifact gate fails if the benchmark still has TODO placeholders or a non-PASS status.

## Target Selector Snippets

Named target:

```text
Target game: `[TARGET_GAME]`. Do not switch to another prototype after the target is selected.
```

Newest playable prototype:

```text
Target the newest playable prototype. If unclear, review the portfolio first, choose one target, then do not switch targets.
```

Autonomous best candidate:

```text
Review the playable prototype portfolio, choose the highest-ROI existing game to improve, then do not switch targets for this run.
```

## New Full Game Candidate

Use this through `manual-viber-game-full-production-pass` or `$viber-game-full-production-pass` when the goal is to add one new fuller game candidate.

```text
Use the Viber game workflows against target_repo `/Users/mcan/game-with-water` to run one full game production pass.

Stay inside the existing repo. Do not create, clone, or initialize a new repository. Treat Game With Water as a prototype lab/app shell, not a required water theme.

Create one new playable hyper-casual game. Ignore prior run notes that name an existing target game; do not upgrade an existing prototype in this run. The output should aim for one real game candidate, not a thin prototype: core gameplay model and scoring, one-thumb input loop, characterful visual/design language, tutorial/first teaching level, guided level map/progression, result/retry/next flow, 20 meaningful levels or challenges with intent/fairness/star goals, feedback animations for success/failure/combo/danger/bonus/stars, quality scorecard, visual novelty audit, focused tests, screenshots when practical, and final validation.

Read and apply `game-production-quality-gate.md`: hard failure conditions, score caps, design red-team checklist, level curve gate, representative playtest protocol, and artifact checker. Treat this as a max-intensity 60-90 minute production-quality attempt unless the environment stops you.

Before coding, use current public App Store/game references plus in-repo comparisons to write a benchmark matrix and then a target-specific `[new-prototype-id]-reference-benchmark.md`: core verb, first 10 seconds, pressure, visual hook, feedback hook, progression promise, cheap/generic red flags, and what not to copy.

Run an explicit implementation-review-remediation loop and do not stop after the first playable scaffold. If the run ends early, state whether all acceptance criteria were met with evidence, validation blocked progress, or the environment stopped the run.

Artifact isolation is mandatory: after the new prototype id is known, write the primary handoff and evidence to target-specific files under `docs/game-with-water/`, such as `[new-prototype-id]-full-production-pass.md`, `[new-prototype-id]-reference-benchmark.md`, `[new-prototype-id]-quality-scorecard.md/json`, `[new-prototype-id]-visual-novelty-audit.md`, and `[new-prototype-id]-level-plan.md`. Do not overwrite shared generic `game-full-production-pass.md` or other `game-*.md` files as the main result.

Avoid unnecessary full builds during exploratory edits. Use focused tests during iteration and final validation at the end.
```

## Existing Game Full Upgrade

Replace `[TARGET_GAME]` with the exact game name.

```text
Use the Viber game workflows against target_repo `/Users/mcan/game-with-water` to run one full existing-game upgrade pass for `[TARGET_GAME]`.

Stay inside the existing repo. Do not create, clone, or initialize a new repository. Do not add a new game prototype. Do not switch to another prototype after the target is selected.

Run the underlying workflows sequentially, not in parallel:

1. Review/rank only enough to understand `[TARGET_GAME]` and current blockers.
2. Grow `[TARGET_GAME]` with one coherent gameplay/UX improvement.
3. Run a design-character pass: current public reference benchmark, stronger visual identity, character/world hook, motion, feedback, danger/bonus/readability, result/tutorial feel.
4. Run a level-pack pass: add or rebalance meaningful levels, score/star goals, difficulty curve, fairness/solvability notes, and keep levels directly playable.
5. Run one feature-experiment only if it strengthens the core loop: special object, power-up, hazard, combo, retention hook, or similar.
6. Run quality-scorecard and visual novelty audit.
7. Run bugfix-polish for launch, dashboard, tapping/clicking, transitions, result screens, persistence, smoke tests, and validation blockers.
8. Run final validation with the strongest practical repo command.

Acceptance bar:
- `[TARGET_GAME]` remains reachable from the hub/dashboard.
- Core loop, scoring, win/loss/retry/next flow, and progression are clear.
- Design language feels specific, not generic.
- Reference benchmark compares the final screenshot against current public references and names cheap/generic red flags.
- Levels have meaningful progression, not only bigger numbers.
- Feature additions are readable and testable.
- Critical scorecard or novelty failures are either fixed once or reported as blockers.
- Do not call the pass complete if validation is red.

Avoid unnecessary full builds during exploratory edits. Use focused tests during iteration and final validation at the end.

Artifact isolation:
- Write primary evidence to target-specific files such as `[target-prototype-id]-growth-pass.md`, `[target-prototype-id]-reference-benchmark.md`, `[target-prototype-id]-design-pass.md`, `[target-prototype-id]-level-plan.md`, `[target-prototype-id]-feature-experiment.md`, `[target-prototype-id]-quality-scorecard.md/json`, `[target-prototype-id]-visual-novelty-audit.md`, and `[target-prototype-id]-validation-report.md`.
- Do not overwrite shared generic `game-*.md` files as the primary handoff for this target.

End with concise handoff notes:
- target game
- what changed by workflow
- level/design/feature changes
- scorecard and novelty result
- validation commands/results
- screenshots if captured
- blockers or next exact workflow prompt
```

## Pipe Garden Full Upgrade

Ready-to-use prompt:

```text
Use the Viber game workflows against target_repo `/Users/mcan/game-with-water` to run one full existing-game upgrade pass for `Pipe Garden`.

Stay inside the existing repo. Do not create, clone, or initialize a new repository. Do not add a new game prototype. Do not switch to another prototype after the target is selected.

Run the underlying workflows sequentially, not in parallel:

1. Review/rank only enough to understand `Pipe Garden` and current blockers.
2. Grow `Pipe Garden` with one coherent gameplay/UX improvement.
3. Run a design-character pass: current public reference benchmark, stronger visual identity, character/world hook, motion, feedback, danger/bonus/readability, result/tutorial feel.
4. Run a level-pack pass: add or rebalance meaningful levels, score/star goals, difficulty curve, fairness/solvability notes, and keep levels directly playable.
5. Run one feature-experiment only if it strengthens the core loop: special object, power-up, hazard, combo, retention hook, or similar.
6. Run quality-scorecard and visual novelty audit.
7. Run bugfix-polish for launch, dashboard, tapping/clicking, transitions, result screens, persistence, smoke tests, and validation blockers.
8. Run final validation with the strongest practical repo command.

Acceptance bar:
- `Pipe Garden` remains reachable from the hub/dashboard.
- Core loop, scoring, win/loss/retry/next flow, and progression are clear.
- Design language feels specific, not generic.
- Reference benchmark compares the final screenshot against current public references and names cheap/generic red flags.
- Levels have meaningful progression, not only bigger numbers.
- Feature additions are readable and testable.
- Critical scorecard or novelty failures are either fixed once or reported as blockers.
- Do not call the pass complete if validation is red.

Avoid unnecessary full builds during exploratory edits. Use focused tests during iteration and final validation at the end.

Artifact isolation:
- Write primary evidence to target-specific files such as `pipe-garden-growth-pass.md`, `pipe-garden-reference-benchmark.md`, `pipe-garden-design-pass.md`, `pipe-garden-level-plan.md`, `pipe-garden-feature-experiment.md`, `pipe-garden-quality-scorecard.md/json`, `pipe-garden-visual-novelty-audit.md`, and `pipe-garden-validation-report.md`.
- Do not overwrite shared generic `game-*.md` files as the primary handoff for this target.

End with concise handoff notes:
- target game
- what changed by workflow
- level/design/feature changes
- scorecard and novelty result
- validation commands/results
- screenshots if captured
- blockers or next exact workflow prompt
```

## Focused Existing-Game Prompts

Design and character:

```text
Use $viber-game-design-character against `/Users/mcan/game-with-water`.
Target game: `[TARGET_GAME]`. Do not switch to another prototype.
Strengthen visual identity, character/world hook, motion, feedback, danger/bonus readability, result/tutorial feel, and accessibility contrast. Preserve core rules unless a small design-led adjustment is needed for readability. Validate the changed flow.
Read and apply `game-production-quality-gate.md` and `game-reference-benchmark.md`; current public references, screenshot/runtime visual evidence, and final reference-fit comparison are required for high confidence.
Write target-specific docs such as `[prototype-id]-reference-benchmark.md` and `[prototype-id]-design-pass.md`; do not overwrite shared generic `game-design-pass.md`.
```

Levels and difficulty:

```text
Use $viber-game-level-pack against `/Users/mcan/game-with-water`.
Target game: `[TARGET_GAME]`. Do not switch to another prototype.
Add or rebalance meaningful levels with score/star goals, difficulty curve, fairness/solvability notes, and directly playable tuning. Avoid only increasing numbers; each level should teach or combine a distinct behavior.
Read and apply `game-production-quality-gate.md`; validate tutorial/early, middle, and late levels with tests or deterministic simulation.
Write target-specific docs such as `[prototype-id]-level-plan.md`; do not overwrite shared generic `game-level-plan.md`.
```

Feature experiment:

```text
Use $viber-game-feature-experiment against `/Users/mcan/game-with-water`.
Target game: `[TARGET_GAME]`. Do not switch to another prototype.
Add one bounded mechanic, special object, power-up, hazard, combo, or retention hook with a clear hypothesis. Make it readable in UI, test it, and leave keep/kill/tune guidance.
Read and apply `game-production-quality-gate.md`; do not add a feature to mask weak core clarity, missing shell, generic design, or untested levels.
Write target-specific docs such as `[prototype-id]-feature-experiment.md`; do not overwrite shared generic `game-feature-experiment.md`.
```

Bugfix and flow polish:

```text
Use $viber-game-bugfix-polish against `/Users/mcan/game-with-water`.
Target game: `[TARGET_GAME]` if known; otherwise inspect the newest known friction.
Fix launch, dashboard, tapping/clicking, transitions, result screens, next/retry flow, persistence, smoke tests, and validation blockers. Keep scope minimal and run final validation.
For one target, prefer `[prototype-id]-validation-report.md`; append shared validation only when it will not overwrite unrelated evidence.
```

Quality scorecard:

```text
Use $viber-game-quality-scorecard against `/Users/mcan/game-with-water`.
Target game: `[TARGET_GAME]`. Score hyper-casual quality, critical fail flags, core loop clarity, feedback, progression, replay hook, design identity, and validation evidence. Leave exact next focused workflow prompts.
Read and apply `game-production-quality-gate.md` and `game-reference-benchmark.md`; cap scores when public references, screenshots, playtest, tests, validation, remediation, or final reference-fit evidence is missing.
Write target-specific docs such as `[prototype-id]-quality-scorecard.md/json`; use shared scorecards only for portfolio scoring.
```

Visual novelty audit:

```text
Use $viber-game-visual-novelty-audit against `/Users/mcan/game-with-water`.
Target game: `[TARGET_GAME]`. Compare against recent prototypes/screenshots. Name repeated/generic patterns directly and leave the exact design-character prompt needed to make it more iconic.
Read and apply `game-production-quality-gate.md`; no novelty score above 7 without current visual inspection and at least two in-repo comparisons.
Write target-specific docs such as `[prototype-id]-visual-novelty-audit.md`; use shared novelty docs only for portfolio audits.
```
