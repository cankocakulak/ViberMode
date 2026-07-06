# Game Production Quality Gate

> Hard gate for ViberMode game workflows. Use this when a pass claims to create, upgrade, score, design, or level a playable hyper-casual/mobile puzzle game.

## Why This Exists

Do not trust compile success, self-written scorecards, or large-sounding feature lists as proof of game quality. A pass is only useful when it proves the game is understandable, playable, distinctive, and improving under real inspection.

## Public Reference Anchors

Use current public references when choosing or auditing a concept. Treat them as patterns, not as IP to copy.

- Apple US charts (`https://apps.apple.com/us/iphone/charts/6014`): current top games and puzzle/casual charts show compact puzzle verbs, sorting, block placement, escape routing, and immediate readable goals. Start from the current App Store chart pages when the pass needs fresh references.
- GameAnalytics core loop guidance (`https://www.gameanalytics.com/blog/how-to-perfect-your-games-core-loop`): the core loop is the repeatable set of meaningful player actions that supports the rest of the game.
- GameAnalytics hyper-casual mistake guidance (`https://www.gameanalytics.com/blog/hyper-casual-game-common-mistakes`): early difficulty, confusing onboarding, and failing to test prototypes early are common failure modes.
- CrazyLabs level design guidance (`https://www.crazylabs.com/blog/the-must-have-of-level-design-in-hyper-casual-mobile-games/`): levels 1-2 teach controls, 3-10 create visible progress, 11+ introduce new elements gradually.
- Homa core-loop guidance (`https://www.homagames.com/blog/what-is-a-core-loop-in-a-mobile-game`): mobile loops should be short, simple, and understandable in a few seconds.
- Newzoo/CrazyLabs hyper-casual context (`https://newzoo.com/resources/blog/hypercasual-mobile-games-introduced-millions-of-consumers-to-gaming-ultracasual-interview-crazylabs`): hyper-casual games are commoditized, so visual/mechanical differentiation matters.

## Reference Benchmark Requirement

For full-production, new-prototype, grow-best, design-character, and quality-scorecard passes, create or update:

```text
docs/[project-name]/[prototype-id]-reference-benchmark.md
```

Use `game-reference-benchmark.md` to collect current public references, in-repo comparisons, screenshot observations, reference-fit scoring, and cheap/generic red flags. A pass that cannot access current references must record the blocker and apply score caps instead of replacing the benchmark with confident prose.

## Hard Failure Conditions

Mark the pass `BLOCKED` or `INCOMPLETE`; do not report it as a successful production pass when any item is true:

- The game cannot be launched from hub/dashboard or direct launch.
- The first meaningful action is not obvious within 10 seconds from the opening screen.
- Core rules live mostly in view glue instead of a testable model/state layer.
- Full-production/new-game output has fewer than 20 authored levels/challenges without an explicit blocker.
- Level changes are mostly target inflation, timer reduction, board-size changes, or random hazard density.
- Late levels are not backed by solvability/fairness tests or deterministic simulation.
- A visual/design pass has no fresh screenshot or simulator observation.
- A new/full/design/quality pass has no target-specific reference benchmark when it claims commercial/game quality.
- The reference benchmark lists games but does not extract concrete lessons for first 10 seconds, pressure, visual hook, feedback, and what not to copy.
- A scorecard gives 80+ without screenshot/runtime evidence and focused tests.
- A design identity is only a palette/name change while board framing, HUD, cards, result shell, and object silhouettes stay generic.
- A design pass leaves two or more cheap/generic red flags unresolved without routing to another remediation loop.
- A full pass stops after scaffold, docs, registry, or build-only validation.

## Score Caps

Apply these caps before publishing any scorecard:

| Missing evidence or defect | Maximum total score |
| --- | ---: |
| Not reachable from hub/direct launch | 40 |
| No meaningful result/retry/next/progress shell for a session game | 55 |
| Full-production game has fewer than 20 meaningful levels/challenges | 60 |
| No focused model/rule tests | 65 |
| No target-specific public reference benchmark for concept/design/quality claims | 65 |
| No screenshot or simulator visual inspection for a visual/design claim | 65 |
| Reference benchmark has fewer than three current public references or no visual observations | 72 |
| No middle/late level playtest or deterministic solve simulation | 72 |
| Prototype screenshot reference-fit average is below 6.0 | 72 |
| Visual identity repeats the same card/HUD/board shell as recent prototypes | 74 |
| Two or more unresolved cheap/generic red flags remain after a design pass | 74 |
| Full validation blocked but focused build/tests pass | 78 |
| Reference-fit comparison was done before implementation but not repeated after visual changes | 78 |
| All evidence exists but no remediation loop was run after critique | 82 |

Do not score 90+ unless screenshots, focused tests, representative level playtests, hub/direct launch, and at least one remediation loop all passed.

## Required Playtest Protocol

For full-production, grow-best, design-character, level-pack, and quality-scorecard passes:

1. Launch the target from the same route a user would use.
2. Capture or inspect the first screen and answer: what can be tapped, what is the goal, what pressure exists?
3. Play or simulate the tutorial/first level, one mid level, and one late level.
4. Verify success, failure, retry, next/continue, and level-map return.
5. Capture refreshed screenshots for visual changes when practical.
6. Run focused model tests for rules and level fairness.
7. Run the strongest final build/smoke gate practical for the repo.
8. Compare the final screenshot against the reference benchmark and record whether the reference-fit score changed.

If simulator/screenshot capture is blocked, record the exact blocker and cap visual/design scoring accordingly.

## Design Red-Team Checklist

Flag and fix before handoff:

- Board is too small or buried below HUD/decor.
- Huge dead space exists before the game object.
- HUD cards dominate the screen more than the core toy.
- Important states differ only by color.
- Palette is one-note, low contrast, or repeats recent prototypes.
- Generic rounded cards, white panels, or dark glass are the main visual identity.
- Celebration/failure feedback is only text.
- Special objects do not have distinct silhouette, icon, animation, and result copy.
- Level map/result shell looks interchangeable with prior prototypes.
- The screenshot would not be recognizable if the title were removed.

## Level Curve Gate

For a 20-level pass, use this structure unless the game has a better documented reason:

- Levels 1-2: teach controls and objective; near-impossible to fail.
- Levels 3-5: add one constraint while preserving fast wins.
- Levels 6-10: combine already-taught rules and introduce scoring/mastery.
- Levels 11-15: introduce new obstacles one at a time with a learning level first.
- Levels 16-20: combine constraints for mastery, with recovery space and tested solve paths.

Each level row must include: intent, new pressure, target behavior, expected fail/success pressure, fairness constraint, and test/simulation evidence.

## Research Output Contract

Before building a new full game, write a compact benchmark matrix in the target-specific handoff:

| Reference | Core verb | First 10 seconds | Pressure | Visual hook | What we will not copy |
| --- | --- | --- | --- | --- | --- |

Use at least three current public references and at least two in-repo prototypes to avoid samey output. For full-production passes, write the richer target-specific `[prototype-id]-reference-benchmark.md` artifact; the compact matrix in the handoff is only a summary.

## Artifact Gate

Run the artifact checker when available:

```bash
node /Users/mcan/.codex/skills/viber-mode/packs/vibermode/scripts/game-production-artifact-gate.mjs --docs docs/game-with-water --prototype-id <prototype-id> --mode full-production
```

The checker does not prove fun. It catches missing handoff evidence before the pass self-reports success.
