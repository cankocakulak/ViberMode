---
name: viber-game-full-production-pass
description: "Use when Codex should run a one-button new full game production pass inside an existing game/prototype repository: create one brand-new playable hyper-casual game with a real core loop, characterful design language, guided tutorial/progression, 20 meaningful levels, score/star/result shell, quality scorecard, novelty audit, iteration log, validation, and handoff evidence. Use for \"new game\", \"tek tuşta oyun\", \"full game\", \"20 levels\", \"core logic otursun\", or automation that should not stop at a simple prototype."
---

# Viber Game Full Production Pass

Read and follow `../viber-mode/packs/vibermode/workflows/game/full-production-pass.md`.

Default target when unspecified:
- `/Users/mcan/game-with-water`

Rules:
- Treat this as the one-button new full-game path, not a quick prototype pass.
- Always create one new game. Do not upgrade an existing game through this skill.
- Compose focused game workflows sequentially; do not run parallel edits against the same repo.
- Require a real core loop, character/design language, guided progression, result/retry flow, and 20 meaningful levels or a truthful blocker.
- Run scorecard and visual novelty evidence before handoff.
- Apply `game-production-quality-gate.md`: score caps, screenshot/playtest evidence, public reference benchmark evidence, hard fail conditions, and artifact checker.
- Create a target-specific `[new-prototype-id]-reference-benchmark.md` with current public game references, in-repo comparisons, final screenshot comparison, and reference-fit status. Do not claim success without it.
- Iterate through implementation, review, remediation, and validation instead of stopping after first playable output.
- Do not force a water theme for Game With Water.
- Write target-specific handoff/evidence artifacts such as `docs/game-with-water/[new-prototype-id]-full-production-pass.md`; do not overwrite shared generic `game-*.md` files as the primary evidence for a new-game run.
- Avoid unnecessary full builds during exploratory edits; run the strongest validation at the final gate or when a compile blocker requires it.
- Do not report success if the output is scaffold-only, docs-only, build-only, or missing representative playtest/screenshot evidence.

End with the new game name, launch path, core loop, design pillars, reference benchmark status, 20-level progression summary, iteration log, scorecard/novelty evidence, validation evidence, screenshots if captured, blockers, and the next lower-level workflow prompt.
