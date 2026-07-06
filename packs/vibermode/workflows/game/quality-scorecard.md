# Workflow: Game Quality Scorecard

> Score one or more playable prototypes with a concrete hyper-casual game quality rubric.

## Purpose

Use this when Codex must judge whether a prototype is actually getting better instead of merely accumulating features or polish language.

This workflow does not create broad changes. It produces an evidence-backed scorecard and exact next workflow prompts.

## Inputs

- `target_repo`
- `project_name` - default from repo or `game-with-water`
- optional `prototype_name` - score one prototype when provided, otherwise score registered playable prototypes
- optional `score_threshold` - default `72`
- optional `allow_low_risk_fixes` - default `false`

## Rubric

Score each dimension from 0 to 10:

- first 3-second interactability
- first 10-second action/feedback
- core loop clarity
- control feel
- pressure readability
- level/progression meaning
- feedback readability
- design identity/iconicness
- public reference-fit / commercial screenshot read
- replay/retention hook
- technical validation evidence

Critical fail flags:

- not reachable from hub/direct launch
- no meaningful input loop
- no result/retry/progress state when sessions exist
- generic or duplicated identity with no differentiator
- missing target-specific public reference benchmark for a design or production-quality claim
- reference-fit average below 6.0 with unresolved cheap/generic red flags
- level difficulty mostly random or arbitrary
- validation unavailable and no focused fallback attempted

## Steps

1. Read the shared quality bar at `packs/vibermode/patterns/game-hypercasual-quality-bar.md`, the hard gate at `packs/vibermode/patterns/game-production-quality-gate.md`, and the reference benchmark contract at `packs/vibermode/patterns/game-reference-benchmark.md`.
2. Inventory prototype route, docs, tests, screenshots, and recent validation.
3. Require or create `docs/[project-name]/[prototype-id]-reference-benchmark.md` before scoring above 65.
4. Run or inspect the prototype when practical.
5. Score each dimension with one-sentence evidence.
6. Apply the score caps from `game-production-quality-gate.md` before choosing the final total.
7. Record critical fail flags separately from numeric score.
8. Recommend exactly one next focused workflow per prototype.

## Required Output

Write:

```text
docs/[project-name]/[prototype-id]-quality-scorecard.json
docs/[project-name]/[prototype-id]-quality-scorecard.md
```

When scoring the whole portfolio, use the shared `game-quality-scorecard.*` filenames. When `prototype_name` is provided or selected, use the target-specific filenames above and do not overwrite shared files during concurrent runs.

The JSON must include:

```json
{
  "workflow": "game-quality-scorecard",
  "prototypeScores": [
    {
      "prototypeName": "",
      "total": 0,
      "threshold": 72,
      "criticalFails": [],
      "scoreCapsApplied": [],
      "evidence": {
        "screenshots": [],
        "referenceBenchmark": [],
        "playtestNotes": [],
        "focusedTests": [],
        "finalValidation": []
      },
      "scores": {},
      "nextWorkflow": "",
      "nextPrompt": ""
    }
  ]
}
```

## Guardrails

- Do not inflate scores because a prototype is new.
- Do not bury critical fails inside prose.
- Do not run broad implementation work from this workflow.
- If a low-risk fix is allowed, patch only evaluation blockers and record it.
- Do not score above 82 without screenshot/runtime evidence, focused tests, representative level playtest/simulation, and at least one remediation loop.
