---
name: viber-game-quality-scorecard
description: Use when Codex should score one or more playable game prototypes inside an existing game/prototype repository against a concrete hyper-casual quality rubric, including first 10 seconds, core loop, control feel, design identity, meaningful levels, retention hook, validation evidence, and exact next workflow prompts. Use to prevent weak or generic outputs from being accepted as finished.
---

# Viber Game Quality Scorecard

Read and follow `../viber-mode/packs/vibermode/workflows/game/quality-scorecard.md`.

Default target when unspecified:
- `/Users/mcan/game-with-water`

Rules:
- Score with evidence, not vibes.
- Apply `game-production-quality-gate.md` score caps before final totals.
- Require `[prototype-id]-reference-benchmark.md` before scoring a design or production-quality claim above 65, and include `evidence.referenceBenchmark` in scorecard JSON for totals above 72.
- Report critical fail flags separately from numeric score.
- Do not run broad implementation work.
- Recommend exactly one next focused workflow per prototype.
- Do not score above 82 without screenshot/runtime evidence, focused tests, representative level playtest/simulation, and at least one remediation loop.

End with scorecard JSON/Markdown paths, reference benchmark path/status, critical fails, next prompts, validation evidence, and any missing runtime/screenshot evidence.
