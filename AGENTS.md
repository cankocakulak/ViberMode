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
| **mobile-rating-review-integrator** | `packs/vibermode/roles/product/mobile-rating-review-integrator.md` | Designs, audits, or implements compliant mobile rating/review flows |

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
| **app-autopilot** | `packs/vibermode/workflows/app-autopilot.md` | Resolves a known app by name and routes change, self-improve, or submit-only work through existing quality and release gates |
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
- "Use the **mobile-rating-review-integrator** agent" → Read `packs/vibermode/roles/product/mobile-rating-review-integrator.md`
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

## Rules

- Always read the full agent file before acting
- For operations workflows, always read the full skill or runbook before acting
- Follow the agent's output contract exactly
- Check `docs/[project-name]/` for prior pipeline artifacts before starting
- Product agents produce artifacts in `docs/`
- Product agents should leave a concise handoff for the next step, including suggested next agent and prompt
- Iterate agents work standalone — no pipeline required
