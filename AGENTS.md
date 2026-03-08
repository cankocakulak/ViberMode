# ViberMode Framework

Vendor-agnostic AI agent development framework. When the user references an agent by name, read the corresponding agent file and follow its instructions exactly.

## Available Agents

### Product Agents — Sequential pipeline from idea to implementation

| Agent | File | Description |
|-------|------|-------------|
| **analyzer** | `.agents/roles/product/analyzer.md` | Discovers project structure, tech stack, patterns |
| **brainstormer** | `.agents/roles/product/brainstormer.md` | Rapid ideation, generates structured creative options |
| **prd** | `.agents/roles/product/prd.md` | Produces lean, developer-ready PRDs |
| **ux-designer** | `.agents/roles/product/ux-designer.md` | UX flows, interaction patterns, visual direction |
| **user-stories** | `.agents/roles/product/user-stories.md` | Generates prioritized user stories with acceptance criteria |
| **task-planner** | `.agents/roles/product/task-planner.md` | Converts user stories into `tasks.json` for the implementation pipeline |
| **implementation-runner** | `.agents/roles/product/implementation-runner.md` | Implements one task per session from `tasks.json` |

### Legacy Product Aliases

| Alias | File | Description |
|-------|------|-------------|
| **ralph-converter** | `.agents/roles/product/ralph-converter.md` | Legacy alias for `task-planner` |
| **ralph-runner** | `.agents/roles/product/ralph-runner.md` | Legacy alias for `implementation-runner` |

### Iterate Agents — Standalone tools, use anytime

| Agent | File | Description |
|-------|------|-------------|
| **scout** | `.agents/roles/iterate/scout.md` | Quickly reads a module and produces context summary |
| **planner** | `.agents/roles/iterate/planner.md` | Investigates bugs or plans features — thinks before acting |
| **reviewer** | `.agents/roles/iterate/reviewer.md` | Validates code quality, identifies issues |
| **ux-tweaker** | `.agents/roles/iterate/ux-tweaker.md` | UI/UX perspective: design patterns, accessibility |

## How to Use

When the user says any of the following, read the agent file and follow it:

- "Use the **analyzer** agent" → Read `.agents/roles/product/analyzer.md`
- "Use the **brainstormer** agent" → Read `.agents/roles/product/brainstormer.md`
- "Use the **prd** agent" → Read `.agents/roles/product/prd.md`
- "Use the **ux-designer** agent" → Read `.agents/roles/product/ux-designer.md`
- "Use the **user-stories** agent" → Read `.agents/roles/product/user-stories.md`
- "Use the **task-planner** agent" → Read `.agents/roles/product/task-planner.md`
- "Use the **implementation-runner** agent" → Read `.agents/roles/product/implementation-runner.md`
- "Use the **ralph-converter** agent" → Read `.agents/roles/product/ralph-converter.md`
- "Use the **ralph-runner** agent" → Read `.agents/roles/product/ralph-runner.md`
- "Use the **scout** agent" → Read `.agents/roles/iterate/scout.md`
- "Use the **planner** agent" → Read `.agents/roles/iterate/planner.md`
- "Use the **reviewer** agent" → Read `.agents/roles/iterate/reviewer.md`
- "Use the **ux-tweaker** agent" → Read `.agents/roles/iterate/ux-tweaker.md`

## Rules

- Always read the full agent file before acting
- Follow the agent's output contract exactly
- Check `docs/[project-name]/` for prior pipeline artifacts before starting
- Product agents produce artifacts in `docs/`
- Product agents should leave a concise handoff for the next step, including suggested next agent and prompt
- Iterate agents work standalone — no pipeline required
