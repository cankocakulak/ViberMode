# Workflow: Game New Prototype

> Create one new playable game prototype inside an existing prototype lab repo.

## Purpose

Use this when the desired output is a new game idea implemented as a playable prototype. This workflow must not spend the pass improving an existing game.

For `/Users/mcan/game-with-water`, treat "Game With Water" as the app shell name, not a required water theme. Existing prototypes are architecture references only.

## Inputs

- `target_repo` - existing repo root. Default: `/Users/mcan/game-with-water` only when context matches.
- `project_name` - default `game-with-water`.
- optional `game_brief` - mechanic, genre, theme, or "find a strong game direction".
- optional `prototype_name` - choose a unique one if absent.
- optional `quality_bar` - default `hypercasual`.
- optional `build_policy` - default `final-gate`.

## Hyper-Casual Quality Contract

Read `packs/vibermode/patterns/game-hypercasual-quality-bar.md` before concept selection.
Also read `packs/vibermode/patterns/game-production-quality-gate.md` before concept selection for hard failure conditions, score caps, playtest protocol, and design red-team checks.
Read `packs/vibermode/patterns/game-reference-benchmark.md` before concept approval so public references become a measurable quality floor, not a vague moodboard.

Do not ship a "technically playable" but empty prototype. The concept gate must prove:

- one primary input family
- one-sentence core loop
- first meaningful action within 10 seconds
- immediate feedback for every action
- one clear pressure model
- one iconic object, character, toy, or world cue
- one meaningful progression dimension
- one replay or mastery hook
- one explicit reference-fit hypothesis: which current public games define the polish floor and which specific patterns will be borrowed without cloning

If the concept cannot satisfy these points, choose a sharper concept before coding.

## Steps

1. Repo scan: inspect app entry, prototype registry, launch args, tests, design tokens, validation scripts, and current prototypes.
2. Public mechanic scan: research current App Store/game references for mechanics, first-session teaching, pressure, retention, visual language, and common complaints.
3. Duplicate gate: compare current repo prototypes and reject ideas that are only a reskin of an existing game.
4. Reference benchmark: draft the public/in-repo benchmark before coding, then write `docs/[project-name]/[new-prototype-id]-reference-benchmark.md` after the id is known. You may scaffold from `game-reference-benchmark-seed.mjs`, but final evidence must include current target-relevant references and screenshot scoring, not only seed rows.
5. Concept gate: write title, core verb, input loop, win/fail state, pressure model, tutorial, progression dimensions, signature feedback, iconic identity, reference-fit hypothesis, and deferred scope.
6. Build slice: create new model/state, view/scene, session shell, tutorial/first level, result/retry/continue, progress if levels exist, and hub/direct-launch registration.
7. Hardening: give the prototype a distinct design language, readable special objects, tactile feedback, and meaningful difficulty curve.
8. Validate: run focused tests first, then final repo validation at the final gate. Capture simulator screenshots when practical and compare the result back against the reference benchmark.

## Required Output

- New prototype folder/module and hub registration.
- Direct launch path or dashboard route.
- Focused tests for game rules and progression constraints.
- `docs/[project-name]/[new-prototype-id]-research.md`
- `docs/[project-name]/[new-prototype-id]-reference-benchmark.md`
- `docs/[project-name]/[new-prototype-id]-prototype-build.md`
- `docs/[project-name]/[new-prototype-id]-prototype-status.json` with `workflow: "game-new-prototype"`
- quality-bar checklist in the handoff
- production-gate checklist with explicit `PASS`, `BLOCKED`, or `INCOMPLETE`
- benchmark matrix covering at least three current public references and two in-repo prototypes
- reference-fit score and required remediation if the final screenshot scores below 6.0
- Final handoff with screenshot paths and validation results.

Shared generic `game-*.md` files may only be used as brief indexes. New-prototype evidence must stay in `[new-prototype-id]-*.md` files so concurrent automations cannot overwrite another prototype's handoff.

## Stop Conditions

Stop instead of switching workflows when:
- a new prototype cannot be safely added
- the repo is too conflicted to identify shared wiring
- validation is blocked by local environment
