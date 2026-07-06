---
name: "viber-game-prototype-lab"
description: "Legacy router for ViberMode game-lab work inside an existing game/prototype repository. Prefer focused public skills when possible: viber-game-full-production-pass, viber-game-quality-scorecard, viber-game-visual-novelty-audit, viber-game-grow-best, viber-game-review-rank, viber-game-level-pack, viber-game-design-character, viber-game-feature-experiment, viber-game-bugfix-polish, and future greenfield skills when explicitly requested. Use this only when the older combined game prototype lab workflow or the correct focused skill is ambiguous."
---

# Viber Game Prototype Lab

Read `../viber-mode/packs/vibermode/workflows/game/prototype-lab.md` as the legacy router, then route to the most focused workflow.

Focused replacements:
- New/full game: use `$viber-game-full-production-pass`.
- Objective quality scoring: use `$viber-game-quality-scorecard`.
- Samey/generic visual audit: use `$viber-game-visual-novelty-audit`.
- Grow best existing game: use `$viber-game-grow-best`.
- Review/rank prototypes: use `$viber-game-review-rank`.
- Add/tune levels: use `$viber-game-level-pack`.
- Add visual identity/character/game feel: use `$viber-game-design-character`.
- Add one mechanic experiment: use `$viber-game-feature-experiment`.
- Fix blockers/transitions/tests: use `$viber-game-bugfix-polish`.
- Run multiple passes sequentially: no default public runner; use the focused manual automations one by one unless an explicit advanced batch workflow is requested.

This skill is for routing game-lab work inside an existing repo. It is not the iOS app factory and it must not create a new repository.

For Game With Water, do not treat the repo name as a required water theme. It is a prototype lab/app shell. New prototypes may be non-water concepts when the mechanic, market reference, or visual identity is stronger.

Route before coding:
- Fresh idea, another prototype, full game, or no named current game -> `$viber-game-full-production-pass`.
- "is this actually good", quality gate, score, or weak handoff -> `$viber-game-quality-scorecard`.
- "same design", "samey", "ruh yok", "generic UI", or repeated visuals -> `$viber-game-visual-novelty-audit`.
- Improve best/current game -> `$viber-game-grow-best`.
- Compare, QA, decide what to do next -> `$viber-game-review-rank`.
- More levels or difficulty curve -> `$viber-game-level-pack`.
- Design language, character, animation, readability -> `$viber-game-design-character`.
- New mechanic/special object/retention experiment -> `$viber-game-feature-experiment`.
- Broken navigation/result/map/smoke/build -> `$viber-game-bugfix-polish`.
- Overnight or multi-pass queue -> use focused manual automations sequentially; read `game-night-loop.md` only for explicit advanced batch orchestration.

Default target when the current workspace is not explicit:
- `/Users/mcan/game-with-water`

Primary workflow contracts:
- `../viber-mode/packs/vibermode/workflows/game/new-prototype.md`
- `../viber-mode/packs/vibermode/workflows/game/signature-prototype.md`
- `../viber-mode/packs/vibermode/workflows/game/quality-scorecard.md`
- `../viber-mode/packs/vibermode/workflows/game/visual-novelty-audit.md`
- `../viber-mode/packs/vibermode/workflows/game/grow-best.md`
- `../viber-mode/packs/vibermode/workflows/game/review-rank.md`
- `../viber-mode/packs/vibermode/workflows/game/level-pack.md`
- `../viber-mode/packs/vibermode/workflows/game/design-character.md`
- `../viber-mode/packs/vibermode/workflows/game/feature-experiment.md`
- `../viber-mode/packs/vibermode/workflows/game/bugfix-polish.md`
- `../viber-mode/packs/vibermode/workflows/game/night-loop.md`
- Future-only unless explicitly requested:
  - `../viber-mode/packs/vibermode/workflows/game/lab-bootstrap.md`
  - `../viber-mode/packs/vibermode/workflows/game/from-zero.md`
  - `../viber-mode/packs/vibermode/workflows/game/template-kit.md`
  - `../viber-mode/packs/vibermode/workflows/game/retention-meta.md`
  - `../viber-mode/packs/vibermode/workflows/game/store-readiness.md`

Default Game With Water integration:
1. Inspect `README.md`, `docs/game-with-water/prototype-hub-guide.md`, and the existing `GameWithWater/Sources/PrototypeHub/` model.
2. In `new-game`, add new prototypes under `GameWithWater/Sources/Prototypes/[PrototypeName]/`.
3. In `grow`, modify only the selected existing prototype plus shared wiring/tests needed for validation.
4. Register the prototype in the hub so it is playable from launch.
5. Use existing water-themed prototypes as architecture references, not as a requirement for new concepts.
6. Keep artifacts under `docs/game-with-water/` unless the user names another project slug.
7. Prefer `Scripts/validate.sh` for the final gate. Avoid repeated full builds during exploratory edits unless a compile check is the cheapest way to unblock.

Expected end state depends on the routed focused workflow. End by naming the focused workflow used, what changed, validation evidence, screenshots if captured, and the next queued workflow.
