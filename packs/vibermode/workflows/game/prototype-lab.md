# Workflow: Game Prototype Lab

> Legacy router for game-prototype work inside an existing repo. Prefer the focused game workflows below for new usage.

## Purpose

This workflow used to combine new prototype creation, growth, and review in one mode-based contract. Keep it as a compatibility surface for older prompts and automations, but route real work to the smallest focused workflow that matches the request.

Game With Water is a prototype lab/app shell name, not a theme constraint. Do not force aquatic, water, pipe, droplet, ocean, or liquid mechanics. In new prototype work, prioritize the strongest mechanic opportunity, input loop, and distinct visual identity; use a water-adjacent theme only when it genuinely improves the concept or the user asks for it.

## Focused Workflows

| Intent | Workflow | Codex skill |
|--------|----------|-------------|
| Create one new fuller game with core logic, characterful design, guided progression, and 20 levels | `game-full-production-pass` | `$viber-game-full-production-pass` |
| Internal: add a fast playable game prototype | `game-new-prototype` | Internal workflow doc; no default public Codex skill |
| Internal: add a fresh prototype and immediately give it a distinct identity/level/polish pass | `game-signature-prototype` | Internal workflow doc; no default public Codex skill |
| Score whether a game is actually good enough | `game-quality-scorecard` | `$viber-game-quality-scorecard` |
| Audit repeated/generic visual language | `game-visual-novelty-audit` | `$viber-game-visual-novelty-audit` |
| Improve the best or named existing prototype | `game-grow-best` | `$viber-game-grow-best` |
| Review/rank prototypes and recommend next passes | `game-review-rank` | `$viber-game-review-rank` |
| Add or tune levels and difficulty curves | `game-level-pack` | `$viber-game-level-pack` |
| Give a game a stronger design language, character, motion, and feedback identity | `game-design-character` | `$viber-game-design-character` |
| Try one bounded new mechanic or retention experiment | `game-feature-experiment` | `$viber-game-feature-experiment` |
| Fix broken transitions, blockers, smoke failures, and basic polish issues | `game-bugfix-polish` | `$viber-game-bugfix-polish` |
| Run multiple bounded passes sequentially | `game-night-loop` | Advanced internal workflow doc; no default first-phase public Codex skill |
| Maintain reusable prototype templates | `game-template-kit` | `$viber-game-template-kit` |
| Add one light retention/meta layer | `game-retention-meta` | `$viber-game-retention-meta` |
| Audit store/internal-testing readiness | `game-store-readiness` | `$viber-game-store-readiness` |
| Future: bootstrap a new game-lab repo | `game-lab-bootstrap` | `$viber-game-lab-bootstrap` |
| Future: build a game lab and first prototype from zero | `game-from-zero` | `$viber-game-from-zero` |

## Routing Rules

Resolve the user's intent before reading implementation files:

- "new game", "another prototype", "find a concept", "tek tuşta oyun", "full game", "20 levels", "core logic otursun", "character design plus levels", or no named current game -> `game-full-production-pass`
- "raw prototype", "fast ideation volume", or explicit low-fidelity concept generation -> `game-new-prototype`
- "signature prototype" or explicit lighter post-new-game chain -> `game-signature-prototype`
- "is this good", "score", "quality gate", "savsaklama", or "really improve itself" -> `game-quality-scorecard`
- "samey", "generic UI", "same design", "visual novelty", "ikonik değil", or "ruhsuz" -> `game-visual-novelty-audit`
- "grow", "improve", "continue", "best one", or a named existing prototype -> `game-grow-best`
- "review", "compare", "rank", "QA", or "what should we do next" -> `game-review-rank`
- "levels", "difficulty", "more stages", "curve", "stars", "goals", or "progression" -> `game-level-pack`
- "design language", "character", "make it premium", "animation", "game feel", "visual identity" -> `game-design-character`
- "new feature", "special tile/object", "power-up", "mechanic test", or "retention hook" -> `game-feature-experiment`
- "bug", "not clickable", "transition", "modal", "result screen", "dashboard", "broken build", or "smoke" -> `game-bugfix-polish`
- "overnight", "loop", "tak tak", "run several passes", or "game factory queue" -> `game-night-loop`
- "template", "scaffold", or repeated game boilerplate -> `game-template-kit`
- "daily", "streak", "achievement", "leaderboard", "collection", or replay meta -> `game-retention-meta`
- "store", "TestFlight readiness", "screenshots", "metadata", or release-facing game QA -> `game-store-readiness`
- "new repo", "from zero", "sifirdan oyun repo", or "new game lab" -> `game-lab-bootstrap` or `game-from-zero` only when explicitly requested.

If the request mixes several intents, choose the highest-leverage single workflow for the current pass. Use `game-night-loop` only when the user explicitly wants a multi-pass queue.

First-phase default: stay inside the existing prototype-lab repo and prefer `game-full-production-pass` for new/full game requests, or `game-quality-scorecard`, `game-visual-novelty-audit`, `game-level-pack`, and `game-design-character` for focused passes. Use `game-new-prototype`, `game-signature-prototype`, and greenfield workflows only when explicitly requested or as children of an upper workflow.

## Entry Contract

- `target_repo` - existing local repo root. Default to `/Users/mcan/game-with-water` only when the current workspace or user context matches it.
- `project_name` - artifact slug. Default for Game With Water: `game-with-water`.
- `game_brief` - user idea, theme, genre, mechanic, target prototype, or "choose autonomously".
- optional `prototype_name` - required only when a workflow needs a specific target and cannot infer one safely.
- optional `build_policy` - default `final-gate`, meaning avoid unnecessary full builds until wiring is complete or a compile blocker appears.

If no existing repo can be resolved, stop and ask. Do not create, clone, or initialize a new repo in this workflow.

## Game With Water Defaults

When `target_repo = /Users/mcan/game-with-water`:

- Read `README.md`.
- Read `docs/game-with-water/prototype-hub-guide.md` when present.
- Inspect `GameWithWater/Sources/PrototypeHub/`.
- Add new prototypes under `GameWithWater/Sources/Prototypes/[PrototypeName]/`.
- Register prototypes so the dashboard/launch path can open them.
- Treat existing prototypes as architecture references, not concept constraints.
- Keep all levels directly playable during tuning unless the user explicitly asks for locked progression.
- Use `Scripts/validate.sh` for the final validation command.
- Capture simulator screenshots under `tmp/` when practical.
- Keep artifacts under `docs/game-with-water/` unless the user names another project slug.

## Output Contract

End by reporting:

- the focused workflow chosen
- why it was chosen
- changed files or review artifacts
- validation command results
- screenshot paths when captured
- the next recommended focused workflow or automation to run
