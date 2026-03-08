# Project Analysis: ViberMode

## Overview
- **Type**: AI agent framework / prompt-definition library
- **Primary language(s)**: Markdown, shell, minimal JavaScript package metadata
- **Framework(s)**: Tool-agnostic agent definition system with Cursor and Codex integrations
- **Package manager**: npm
- **Monorepo**: No

## Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Core definitions | Markdown agent specs | `.agents/roles/product/` and `.agents/roles/iterate/` are the real source of behavior |
| Codex integration | Codex Skills (`SKILL.md`) | Thin wrappers in `.agents/skills/` point back to agent files |
| Cursor integration | Slash command markdown + MDC rules | `.cursor/commands/` and `.cursor/rules/viber-mode.mdc` |
| Packaging | npm package metadata | `package.json` exports `.agents/*`, but no real runtime yet |
| Automation/runtime | Shell install script | `scripts/install-codex-skills.sh` copies skills into Codex |
| Testing/validation | Placeholder only | `npm run validate` is not implemented |

## Project Structure
```
.agents/
├── roles/
│   ├── product/  — sequential product pipeline from analysis to implementation handoff
│   └── iterate/  — standalone investigation/review/design helpers
├── product/      — legacy compatibility redirects to roles/product
├── iterate/      — legacy compatibility redirects to roles/iterate
├── skills/       — Codex skill wrappers for agent specs
└── workflows/    — pipeline choreography docs

.cursor/
├── commands/     — slash-command wrappers for each agent
└── rules/        — always-on framework context

scripts/
└── install-codex-skills.sh  — installs Codex skill wrappers

src/
└── .gitkeep      — runtime layer not built yet
```

## Patterns & Conventions
- **Source of truth**: Agent behavior is defined in `.agents/*`; integrations are wrappers, not separate implementations.
- **Product pipeline**: `Analyzer → Brainstormer → PRD → UX Designer → User Stories → Ralph Converter → Ralph Runner`.
- **Artifact handoff model**: Product agents are intended to communicate via `docs/[project-name]/` artifacts.
- **Explicit handoff model**: Product agents now also leave a next-step summary with recommended agent, carry-forward context, and a suggested prompt.
- **Integration pattern**: Cursor commands and Codex skills mainly restate constraints and point back to the base agent files.
- **Separation of concerns**: Product agents create documents; iterate agents are standalone operational helpers.

## Current UI/UX State
- **Design system**: N/A, this is primarily a framework/docs repo rather than an end-user app
- **Responsive**: N/A
- **Accessibility**: Not applicable at product UI level
- **Key surfaces**: README, `.agents/roles/product/*`, `.cursor/commands/*`, `AGENTS.md`

## Product Agents: Current Purpose
- The `roles/product` set is the framework's structured delivery pipeline for taking an idea from discovery to implementation.
- Its main job is not to run code directly, but to standardize how an AI agent thinks, what it outputs, and which artifact the next step consumes.
- In practice, the strongest current value is prompt contract design: each product agent has a clear role, input contract, output format, and handoff expectation.

## Product Agents: Current Functionality
- **Analyzer** maps an existing codebase and is meant to create `analysis.md` for downstream context.
- **Brainstormer** expands option space, then narrows to a recommendation.
- **PRD** turns selected direction into scoped, testable requirements.
- **UX Designer** translates requirements into flows, screens, copy, and visual direction.
- **User Stories** slices the PRD/UX output into sprint-ready stories.
- **Task Planner** reshapes stories into `tasks.json` for autonomous execution while preserving story lineage.
- **Implementation Runner** is the execution-side contract for implementing one task per session from `tasks.json`, then updating `run-state.json` for the next iteration.

## Technical Debt & Concerns
- Product pipeline documentation was recently aligned around the folder-based artifact convention `docs/[project-name]/*.md`, but there is still no automated validator to prevent future drift.
- The claimed pipeline is mostly documentation and wrapper orchestration today; there is no runtime validator, no artifact bootstrapper, and no actual workflow engine yet.
- `src/` is effectively empty, so the package behaves more like a framework definition repo than a software tool with executable internals.
- `npm run validate` is a placeholder, which means contract drift between agent files, skills, commands, and README can accumulate unnoticed.

## Opportunities
- Add validation tooling that checks every product agent, skill, command, and README reference for path and contract consistency.
- Add a small runtime/bootstrap CLI for `kickoff`, artifact creation, and pipeline status so the workflow is executable, not just documented.
- Keep README, workflow docs, and command wrappers synchronized through generation or linting instead of manual edits.
- The current separation between source-of-truth agents and thin wrappers is strong and reusable; that architecture is the repo's cleanest asset.
