# ViberMode Framework

Vendor-agnostic AI agent development framework. When the user references an agent by name, read the corresponding agent file and follow its instructions exactly.

## Available Agents

### Product Agents — Sequential pipeline from idea to implementation

| Agent | File | Description |
|-------|------|-------------|
| **analyzer** | `packs/vibermode/roles/product/analyzer.md` | Discovers project structure, tech stack, patterns |
| **app-researcher** | `packs/vibermode/roles/product/app-researcher.md` | Researches mobile app opportunities before backlog/factory handoff |
| **brainstormer** | `packs/vibermode/roles/product/brainstormer.md` | Rapid ideation, generates structured creative options |
| **prd** | `packs/vibermode/roles/product/prd.md` | Produces lean, developer-ready PRDs |
| **ux-designer** | `packs/vibermode/roles/product/ux-designer.md` | Product experience strategy, information architecture, visual direction, and UX flows |
| **user-stories** | `packs/vibermode/roles/product/user-stories.md` | Generates prioritized user stories with acceptance criteria |
| **bootstrap** | `packs/vibermode/roles/product/bootstrap.md` | Prepares repo, branch, and runnable validation baseline |
| **task-planner** | `packs/vibermode/roles/product/task-planner.md` | Converts user stories into `tasks.json` for the implementation pipeline |
| **implementation-runner** | `packs/vibermode/roles/product/implementation-runner.md` | Implements one task per session from `tasks.json` |
| **ios-submitter** | `packs/vibermode/roles/product/ios-submitter.md` | Uploads completed generated iOS apps to internal TestFlight |
| **android-submitter** | `packs/vibermode/roles/product/android-submitter.md` | Uploads completed generated Android apps to Google Play internal testing |

### Game Agents - Existing-repo game prototype pipeline

| Agent | File | Description |
|-------|------|-------------|
| **game-prototype-builder** | `packs/vibermode/roles/game/game-prototype-builder.md` | Researches and builds a playable game prototype inside an existing repo for the focused game workflows |
| **game-design-level-hardener** | `packs/vibermode/roles/game/game-design-level-hardener.md` | Hardens visual language, game feel, level curve, shell, and readability |
| **game-prototype-review-grower** | `packs/vibermode/roles/game/game-prototype-review-grower.md` | Reviews playable prototypes or applies one bounded growth pass within the focused game workflows |

### Legacy Product Aliases

| Alias | File | Description |
|-------|------|-------------|
| **ralph-converter** | `packs/vibermode/roles/product/ralph-converter.md` | Legacy alias for `task-planner` |
| **ralph-runner** | `packs/vibermode/roles/product/ralph-runner.md` | Legacy alias for `implementation-runner` |

### Iterate Agents — Standalone tools, use anytime

| Agent | File | Description |
|-------|------|-------------|
| **scout** | `packs/vibermode/roles/iterate/scout.md` | Quickly reads a module and produces context summary |
| **planner** | `packs/vibermode/roles/iterate/planner.md` | Investigates bugs or plans features — thinks before acting |
| **reviewer** | `packs/vibermode/roles/iterate/reviewer.md` | Validates code quality, identifies issues |
| **ux-tweaker** | `packs/vibermode/roles/iterate/ux-tweaker.md` | UI/UX perspective: design patterns, accessibility |
| **ux-investigator** | `packs/vibermode/roles/iterate/ux-investigator.md` | Investigates an existing interface, clarifies UX friction, and improves the surface |
| **design-engineer** | `packs/vibermode/roles/iterate/design-engineer.md` | Craft-level UI polish for motion, component states, gestures, and interaction feel |
| **modularizer** | `packs/vibermode/roles/iterate/modularizer.md` | Finds safe modularization seams and plans or applies incremental refactors |
| **tester** | `packs/vibermode/roles/iterate/tester.md` | Verifies a surface with CLI plus runtime evidence and focused smoke checks |
| **integration-auditor** | `packs/vibermode/roles/iterate/integration-auditor.md` | Audits whether a feature is actually wired across routes, state, events, and services |
| **surface-hardener** | `packs/vibermode/roles/iterate/surface-hardener.md` | Hardens an existing screen or flow for edge states, resilience, and accessibility |
| **change-triager** | `packs/vibermode/roles/iterate/change-triager.md` | Turns mixed feedback, bug notes, and release-facing requests into a scoped change brief |
| **experience-reviewer** | `packs/vibermode/roles/iterate/experience-reviewer.md` | Reviews product feel and user-facing experience quality after runtime validation |
| **runtime-validator** | `packs/vibermode/roles/iterate/runtime-validator.md` | Executes formal post-implementation build and runtime validation |
| **spec-reviewer** | `packs/vibermode/roles/iterate/spec-reviewer.md` | Reviews spec artifacts before task planning begins |
| **remediation-router** | `packs/vibermode/roles/iterate/remediation-router.md` | Routes failed validation, experience, or review findings back into execution state |
| **change-task-planner** | `packs/vibermode/roles/iterate/change-task-planner.md` | Converts an existing-repo change plan into `tasks.json` |

### Operations Workflows — Connected service operators

| Workflow | Surface | Description |
|----------|---------|-------------|
| **game-prototype-lab** | `packs/vibermode/workflows/game/prototype-lab.md` | Legacy router for focused game prototype workflows inside an existing repo |
| **game-new-prototype** | `packs/vibermode/workflows/game/new-prototype.md` | Internal/fast fresh prototype builder used by higher-level game workflows |
| **game-signature-prototype** | `packs/vibermode/workflows/game/signature-prototype.md` | Internal composition layer for new prototype plus audit, identity, level, polish, and validation |
| **game-full-production-pass** | `packs/vibermode/workflows/game/full-production-pass.md` | Builds one new fuller game with core logic, characterful design, guided progression, 20 levels, iteration, and validation |
| **game-quality-scorecard** | `packs/vibermode/workflows/game/quality-scorecard.md` | Scores whether prototypes are actually strong enough by hyper-casual quality criteria |
| **game-visual-novelty-audit** | `packs/vibermode/workflows/game/visual-novelty-audit.md` | Audits repeated/samey visual language before or after design passes |
| **game-grow-best** | `packs/vibermode/workflows/game/grow-best.md` | Improves the highest-ROI or named existing prototype with one bounded growth pass |
| **game-review-rank** | `packs/vibermode/workflows/game/review-rank.md` | Reviews, ranks, and recommends next game prototype passes |
| **game-level-pack** | `packs/vibermode/workflows/game/level-pack.md` | Adds or tunes level packs, goals, stars, and difficulty progression |
| **game-design-character** | `packs/vibermode/workflows/game/design-character.md` | Establishes stronger game identity, character, motion, feedback, and visual language |
| **game-feature-experiment** | `packs/vibermode/workflows/game/feature-experiment.md` | Adds one bounded mechanic, power-up, special object, or retention experiment |
| **game-bugfix-polish** | `packs/vibermode/workflows/game/bugfix-polish.md` | Fixes blockers, transitions, smoke issues, and baseline polish defects |
| **game-night-loop** | `packs/vibermode/workflows/game/night-loop.md` | Advanced portfolio batch workflow; not the default one-game production path |
| **game-template-kit** | `packs/vibermode/workflows/game/template-kit.md` | Maintains reusable game templates without centralizing visual identity |
| **game-retention-meta** | `packs/vibermode/workflows/game/retention-meta.md` | Adds one light retention/meta layer after core gameplay quality passes |
| **game-store-readiness** | `packs/vibermode/workflows/game/store-readiness.md` | Audits store/internal-testing readiness after gameplay quality passes |
| **game-lab-bootstrap** | `packs/vibermode/workflows/game/lab-bootstrap.md` | Future greenfield setup for a modular game prototype lab |
| **game-from-zero** | `packs/vibermode/workflows/game/from-zero.md` | Future upper workflow for bootstrap plus first signature prototype |
| **app-autopilot** | `packs/vibermode/workflows/app-autopilot.md` | Resolves a known app by name and routes change, self-improve, or submit-only work through existing quality and release gates |
| **paywall-review-optimizer** | `packs/vibermode/workflows/paywall-review-optimizer.md` | Audits and improves app paywall timing, onboarding-to-value, and review prompt strategy |
| **paywall-creator** | `packs/vibermode/workflows/paywall-creator.md` | Creates or adapts template-based mobile paywall surfaces |
| **meta-ads-operator** | `adapters/codex/skills/meta-ads-operator/SKILL.md` | Analyzes Meta/Facebook/Instagram Ads performance and safely plans or performs Marketing API actions with paused-by-default write workflows |
| **tiktok-ads-operator** | `adapters/codex/skills/tiktok-ads-operator/SKILL.md` | Analyzes TikTok Ads performance and safely plans or performs TikTok API for Business actions with paused-by-default write workflows |
| **google-ads-operator** | `adapters/codex/skills/google-ads-operator/SKILL.md` | Analyzes Google Ads performance and safely plans or performs Google Ads API actions with paused-by-default write workflows |

## How to Use

When the user says any of the following, read the agent file and follow it:

- "Use the **analyzer** agent" → Read `packs/vibermode/roles/product/analyzer.md`
- "Use the **app-researcher** agent" → Read `packs/vibermode/roles/product/app-researcher.md`
- "Use the **brainstormer** agent" → Read `packs/vibermode/roles/product/brainstormer.md`
- "Use the **prd** agent" → Read `packs/vibermode/roles/product/prd.md`
- "Use the **ux-designer** agent" → Read `packs/vibermode/roles/product/ux-designer.md`
- "Use the **user-stories** agent" → Read `packs/vibermode/roles/product/user-stories.md`
- "Use the **bootstrap** agent" → Read `packs/vibermode/roles/product/bootstrap.md`
- "Use the **task-planner** agent" → Read `packs/vibermode/roles/product/task-planner.md`
- "Use the **implementation-runner** agent" → Read `packs/vibermode/roles/product/implementation-runner.md`
- "Use the **ios-submitter** agent" → Read `packs/vibermode/roles/product/ios-submitter.md`
- "Use the **android-submitter** agent" → Read `packs/vibermode/roles/product/android-submitter.md`
- "Use the **game-prototype-builder** agent" → Read `packs/vibermode/roles/game/game-prototype-builder.md`
- "Use the **game-design-level-hardener** agent" → Read `packs/vibermode/roles/game/game-design-level-hardener.md`
- "Use the **game-prototype-review-grower** agent" → Read `packs/vibermode/roles/game/game-prototype-review-grower.md`
- "Use the **ralph-converter** agent" → Read `packs/vibermode/roles/product/ralph-converter.md`
- "Use the **ralph-runner** agent" → Read `packs/vibermode/roles/product/ralph-runner.md`
- "Use the **scout** agent" → Read `packs/vibermode/roles/iterate/scout.md`
- "Use the **planner** agent" → Read `packs/vibermode/roles/iterate/planner.md`
- "Use the **reviewer** agent" → Read `packs/vibermode/roles/iterate/reviewer.md`
- "Use the **ux-tweaker** agent" → Read `packs/vibermode/roles/iterate/ux-tweaker.md`
- "Use the **ux-investigator** agent" → Read `packs/vibermode/roles/iterate/ux-investigator.md`
- "Use the **design-engineer** agent" → Read `packs/vibermode/roles/iterate/design-engineer.md`
- "Use the **modularizer** agent" → Read `packs/vibermode/roles/iterate/modularizer.md`
- "Use the **tester** agent" → Read `packs/vibermode/roles/iterate/tester.md`
- "Use the **integration-auditor** agent" → Read `packs/vibermode/roles/iterate/integration-auditor.md`
- "Use the **surface-hardener** agent" → Read `packs/vibermode/roles/iterate/surface-hardener.md`
- "Use the **change-triager** agent" → Read `packs/vibermode/roles/iterate/change-triager.md`
- "Use the **experience-reviewer** agent" → Read `packs/vibermode/roles/iterate/experience-reviewer.md`
- "Use the **runtime-validator** agent" → Read `packs/vibermode/roles/iterate/runtime-validator.md`
- "Use the **spec-reviewer** agent" → Read `packs/vibermode/roles/iterate/spec-reviewer.md`
- "Use the **remediation-router** agent" → Read `packs/vibermode/roles/iterate/remediation-router.md`
- "Use the **change-task-planner** agent" → Read `packs/vibermode/roles/iterate/change-task-planner.md`
- "Use the **meta-ads-operator** workflow" → Read `adapters/codex/skills/meta-ads-operator/SKILL.md`
- "Use the **tiktok-ads-operator** workflow" → Read `adapters/codex/skills/tiktok-ads-operator/SKILL.md`
- "Use the **google-ads-operator** workflow" → Read `adapters/codex/skills/google-ads-operator/SKILL.md`
- "Use the **app-autopilot** workflow" → Read `packs/vibermode/workflows/app-autopilot.md`
- "Use the **paywall-review-optimizer** workflow" → Read `packs/vibermode/workflows/paywall-review-optimizer.md`
- "Use the **paywall-creator** workflow" → Read `packs/vibermode/workflows/paywall-creator.md`
- "Use the **game-prototype-lab** workflow" → Read `packs/vibermode/workflows/game/prototype-lab.md` and route to the smallest focused game workflow
- "Use the **game-new-prototype** workflow" → Read `packs/vibermode/workflows/game/new-prototype.md`
- "Use the **game-signature-prototype** workflow" → Read `packs/vibermode/workflows/game/signature-prototype.md`
- "Use the **game-full-production-pass** workflow" → Read `packs/vibermode/workflows/game/full-production-pass.md`
- "Use the **game-quality-scorecard** workflow" → Read `packs/vibermode/workflows/game/quality-scorecard.md`
- "Use the **game-visual-novelty-audit** workflow" → Read `packs/vibermode/workflows/game/visual-novelty-audit.md`
- "Use the **game-grow-best** workflow" → Read `packs/vibermode/workflows/game/grow-best.md`
- "Use the **game-review-rank** workflow" → Read `packs/vibermode/workflows/game/review-rank.md`
- "Use the **game-level-pack** workflow" → Read `packs/vibermode/workflows/game/level-pack.md`
- "Use the **game-design-character** workflow" → Read `packs/vibermode/workflows/game/design-character.md`
- "Use the **game-feature-experiment** workflow" → Read `packs/vibermode/workflows/game/feature-experiment.md`
- "Use the **game-bugfix-polish** workflow" → Read `packs/vibermode/workflows/game/bugfix-polish.md`
- "Use the **game-night-loop** workflow" → Read `packs/vibermode/workflows/game/night-loop.md`
- "Use the **game-template-kit** workflow" → Read `packs/vibermode/workflows/game/template-kit.md`
- "Use the **game-retention-meta** workflow" → Read `packs/vibermode/workflows/game/retention-meta.md`
- "Use the **game-store-readiness** workflow" → Read `packs/vibermode/workflows/game/store-readiness.md`
- "Use the **game-lab-bootstrap** workflow" → Read `packs/vibermode/workflows/game/lab-bootstrap.md`
- "Use the **game-from-zero** workflow" → Read `packs/vibermode/workflows/game/from-zero.md`

## Rules

- Always read the full agent file before acting
- For operations workflows, always read the full skill or runbook before acting
- Follow the agent's output contract exactly
- Check `docs/[project-name]/` for prior pipeline artifacts before starting
- Product agents produce artifacts in `docs/`
- Product agents should leave a concise handoff for the next step, including suggested next agent and prompt
- Iterate agents work standalone — no pipeline required
