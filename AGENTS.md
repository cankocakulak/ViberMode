# ViberMode Framework

Vendor-agnostic AI agent development framework. When the user references an agent by name, read the corresponding agent file and follow its instructions exactly.

## Available Agents

### Product Agents — Sequential pipeline from idea to implementation

| Agent | File | Description |
|-------|------|-------------|
| **analyzer** | `.agents/product/analyzer.md` | Discovers project structure, tech stack, patterns |
| **brainstormer** | `.agents/product/brainstormer.md` | Rapid ideation, generates structured creative options |
| **prd** | `.agents/product/prd.md` | Produces lean, developer-ready PRDs |
| **ux-designer** | `.agents/product/ux-designer.md` | UX flows, interaction patterns, visual direction |
| **user-stories** | `.agents/product/user-stories.md` | Generates prioritized user stories with acceptance criteria |
| **ralph-converter** | `.agents/product/ralph-converter.md` | Converts user stories into `prd.json` for implementation loop |
| **ralph-runner** | `.agents/product/ralph-runner.md` | Implements one story per session from `prd.json` |

### Iterate Agents — Standalone tools, use anytime

| Agent | File | Description |
|-------|------|-------------|
| **scout** | `.agents/iterate/scout.md` | Quickly reads a module and produces context summary |
| **planner** | `.agents/iterate/planner.md` | Investigates bugs or plans features — thinks before acting |
| **reviewer** | `.agents/iterate/reviewer.md` | Validates code quality, identifies issues |
| **ux-tweaker** | `.agents/iterate/ux-tweaker.md` | UI/UX perspective: design patterns, accessibility |

## How to Use

When the user says any of the following, read the agent file and follow it:

- "Use the **analyzer** agent" → Read `.agents/product/analyzer.md`
- "Use the **brainstormer** agent" → Read `.agents/product/brainstormer.md`
- "Use the **prd** agent" → Read `.agents/product/prd.md`
- "Use the **ux-designer** agent" → Read `.agents/product/ux-designer.md`
- "Use the **user-stories** agent" → Read `.agents/product/user-stories.md`
- "Use the **ralph-converter** agent" → Read `.agents/product/ralph-converter.md`
- "Use the **ralph-runner** agent" → Read `.agents/product/ralph-runner.md`
- "Use the **scout** agent" → Read `.agents/iterate/scout.md`
- "Use the **planner** agent" → Read `.agents/iterate/planner.md`
- "Use the **reviewer** agent" → Read `.agents/iterate/reviewer.md`
- "Use the **ux-tweaker** agent" → Read `.agents/iterate/ux-tweaker.md`

## Rules

- Always read the full agent file before acting
- Follow the agent's output contract exactly
- Check `docs/[project-name]/` for prior pipeline artifacts before starting
- Product agents produce artifacts in `docs/`
- Iterate agents work standalone — no pipeline required
