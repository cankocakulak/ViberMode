# ViberMode Framework

Vendor-agnostic AI agent development framework. When the user references an agent by name, read the corresponding agent file and follow its instructions exactly.

## Available Agents

### Product Agents — Sequential pipeline from idea to implementation

| Agent | File | Description |
|-------|------|-------------|
| **analyzer** | `packs/vibermode/roles/product/analyzer.md` | Discovers project structure, tech stack, patterns |
| **brainstormer** | `packs/vibermode/roles/product/brainstormer.md` | Rapid ideation, generates structured creative options |
| **prd** | `packs/vibermode/roles/product/prd.md` | Produces lean, developer-ready PRDs |
| **ux-designer** | `packs/vibermode/roles/product/ux-designer.md` | UX flows, interaction patterns, visual direction |
| **user-stories** | `packs/vibermode/roles/product/user-stories.md` | Generates prioritized user stories with acceptance criteria |
| **bootstrap** | `packs/vibermode/roles/product/bootstrap.md` | Prepares repo, branch, and runnable validation baseline |
| **task-planner** | `packs/vibermode/roles/product/task-planner.md` | Converts user stories into `tasks.json` for the implementation pipeline |
| **implementation-runner** | `packs/vibermode/roles/product/implementation-runner.md` | Implements one task per session from `tasks.json` |

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
| **modularizer** | `packs/vibermode/roles/iterate/modularizer.md` | Finds safe modularization seams and plans or applies incremental refactors |
| **tester** | `packs/vibermode/roles/iterate/tester.md` | Verifies a surface with CLI plus runtime evidence and focused smoke checks |
| **integration-auditor** | `packs/vibermode/roles/iterate/integration-auditor.md` | Audits whether a feature is actually wired across routes, state, events, and services |
| **surface-hardener** | `packs/vibermode/roles/iterate/surface-hardener.md` | Hardens an existing screen or flow for edge states, resilience, and accessibility |
| **runtime-validator** | `packs/vibermode/roles/iterate/runtime-validator.md` | Executes formal post-implementation build and runtime validation |
| **spec-reviewer** | `packs/vibermode/roles/iterate/spec-reviewer.md` | Reviews spec artifacts before task planning begins |
| **remediation-router** | `packs/vibermode/roles/iterate/remediation-router.md` | Routes failed review or validation findings back into execution state |
| **change-task-planner** | `packs/vibermode/roles/iterate/change-task-planner.md` | Converts an existing-repo change plan into `tasks.json` |

## How to Use

When the user says any of the following, read the agent file and follow it:

- "Use the **analyzer** agent" → Read `packs/vibermode/roles/product/analyzer.md`
- "Use the **brainstormer** agent" → Read `packs/vibermode/roles/product/brainstormer.md`
- "Use the **prd** agent" → Read `packs/vibermode/roles/product/prd.md`
- "Use the **ux-designer** agent" → Read `packs/vibermode/roles/product/ux-designer.md`
- "Use the **user-stories** agent" → Read `packs/vibermode/roles/product/user-stories.md`
- "Use the **bootstrap** agent" → Read `packs/vibermode/roles/product/bootstrap.md`
- "Use the **task-planner** agent" → Read `packs/vibermode/roles/product/task-planner.md`
- "Use the **implementation-runner** agent" → Read `packs/vibermode/roles/product/implementation-runner.md`
- "Use the **ralph-converter** agent" → Read `packs/vibermode/roles/product/ralph-converter.md`
- "Use the **ralph-runner** agent" → Read `packs/vibermode/roles/product/ralph-runner.md`
- "Use the **scout** agent" → Read `packs/vibermode/roles/iterate/scout.md`
- "Use the **planner** agent" → Read `packs/vibermode/roles/iterate/planner.md`
- "Use the **reviewer** agent" → Read `packs/vibermode/roles/iterate/reviewer.md`
- "Use the **ux-tweaker** agent" → Read `packs/vibermode/roles/iterate/ux-tweaker.md`
- "Use the **ux-investigator** agent" → Read `packs/vibermode/roles/iterate/ux-investigator.md`
- "Use the **modularizer** agent" → Read `packs/vibermode/roles/iterate/modularizer.md`
- "Use the **tester** agent" → Read `packs/vibermode/roles/iterate/tester.md`
- "Use the **integration-auditor** agent" → Read `packs/vibermode/roles/iterate/integration-auditor.md`
- "Use the **surface-hardener** agent" → Read `packs/vibermode/roles/iterate/surface-hardener.md`
- "Use the **runtime-validator** agent" → Read `packs/vibermode/roles/iterate/runtime-validator.md`
- "Use the **spec-reviewer** agent" → Read `packs/vibermode/roles/iterate/spec-reviewer.md`
- "Use the **remediation-router** agent" → Read `packs/vibermode/roles/iterate/remediation-router.md`
- "Use the **change-task-planner** agent" → Read `packs/vibermode/roles/iterate/change-task-planner.md`

## Rules

- Always read the full agent file before acting
- Follow the agent's output contract exactly
- Check `docs/[project-name]/` for prior pipeline artifacts before starting
- Product agents produce artifacts in `docs/`
- Product agents should leave a concise handoff for the next step, including suggested next agent and prompt
- Iterate agents work standalone — no pipeline required
