# Game Hyper-Casual Quality Bar

> Shared quality contract for ViberMode game workflows. Use this as a reference when creating, auditing, designing, leveling, or growing prototypes.

For production/new-game/growth/design/level/scorecard passes, also read `packs/vibermode/patterns/game-production-quality-gate.md`. The quality bar defines what good means; the production gate defines when a pass must fail, cap its score, or continue remediation.

For new-game, design-character, grow-best, and quality-scorecard passes, also apply `packs/vibermode/patterns/game-reference-benchmark.md`. The benchmark is the external quality floor: it explains what the prototype is being compared against and prevents "it compiles, therefore it is acceptable" handoffs.

## Non-Negotiables

A prototype is not considered good enough just because it compiles or can be tapped.

Every serious game pass must produce evidence for:

- **First 3 seconds** - player can identify what is interactable.
- **First 10 seconds** - player performs one meaningful action and sees feedback.
- **One-thumb loop** - primary input is simple, repeatable, and ergonomic.
- **Immediate feedback** - every meaningful action changes motion, score, state, audio/haptic placeholder, or visual energy.
- **Short session** - a round or level can reach progress, win, fail, or mastery feedback quickly.
- **Readable pressure** - the player understands what makes the game harder.
- **Iconic identity** - the game has a named visual metaphor, character, toy, world cue, or signature object.
- **Meaningful levels** - levels are not number changes only; each level teaches, tests, combines, or pressures a specific behavior.
- **Recoverable failure** - retry/next/result flows are immediate and clear.
- **Validation evidence** - model tests, simulator/screenshot evidence, or explicit validation gaps are reported.
- **Reference evidence** - current public game references plus in-repo comparisons explain why the mechanic, visual hook, feedback, and progression are commercially plausible.

## Core Loop Bar

Before adding meta systems, menus, or broad visual polish, verify:

- one core verb
- one primary objective
- one pressure model
- one reward or mastery signal
- one failure or setback condition
- no more than one new mechanic family per pass

If the loop cannot be described in one sentence, simplify before building.

## Iconic Design Bar

The design pass must name and implement:

- fantasy or metaphor
- shape language
- palette role map
- typography role
- object/state system
- signature interaction moment
- signature celebration or failure moment
- how this prototype differs from at least two existing prototypes
- what current public references prove about the expected polish floor, screenshot read, feedback energy, and progression promise

Avoid:

- generic glass cards as the main identity
- single-hue palettes
- color-only semantics
- decoration that does not explain state
- marketing/landing-page layout around the playable board

Do not call a design iconic if the screenshot only works because the title says what the theme is. The main object, board, world cue, or feedback moment must remain recognizable when the title is removed.

## Meaningful Level Bar

Every level added or tuned must have:

- intent label
- progression dimension
- target player behavior
- new rule or pressure, or a deliberate mastery repetition
- fairness constraint
- expected completion pressure

Good dimensions include:

- board size
- legal move density
- hazard density
- time or move budget
- target score/rank
- combo requirement
- route complexity
- spawn odds
- blocker placement
- resource scarcity

Bad difficulty is mostly randomness, hidden failure, or arbitrary target inflation.

## Self-Improvement Bar

When Codex sees a weak output from its own pass, it must not handwave it as "future polish" if the current workflow owns that layer.

It should:

- name the weak layer
- route to the focused workflow that owns it
- apply a bounded fix if still inside budget
- record what remains and why it stopped

## Evidence Bar

Every handoff should include:

- prototype name and launch path
- changed files or surfaces
- tests/builds run
- screenshots when practical for visual work
- scorecard or audit artifact when applicable
- reference benchmark artifact when the workflow touches concept choice, design quality, or final scoring
- next recommended focused workflow

## Anti-Handwave Rule

Do not let prose override missing evidence. If screenshots, playtest notes, level tests, or validation are missing, apply the score caps and stop conditions from `game-production-quality-gate.md`. A pass that only writes confident documentation without proof should be marked `INCOMPLETE`, not successful.
