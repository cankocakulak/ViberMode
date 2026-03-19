# Project Analysis: ViberMode

## Overview
- **Type**: Vendor-agnostic AI agent framework and workflow-definition repo
- **Primary language(s)**: Markdown, shell, minimal JSON/package metadata
- **Framework(s)**: Tool-agnostic agent definitions with Codex and Cursor integration layers
- **Package manager**: npm
- **Monorepo**: No

ViberMode is a documentation-first framework whose real product is the set of agent contracts under `.agents/roles/`. The repo is structurally clean and easy to understand, but it currently behaves more like a prompt framework than an executable workflow system because validation, orchestration, and runtime enforcement are still mostly absent.

## Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Source of truth | Markdown role specs | `.agents/roles/product/` and `.agents/roles/iterate/` define actual behavior |
| Codex integration | `SKILL.md` wrappers | `.agents/skills/*` forwards intent to canonical role files |
| Cursor integration | Slash commands + MDC rules | `.cursor/commands/*` and `.cursor/rules/viber-mode.mdc` expose the same roles in Cursor |
| Workflow definition | Markdown workflow docs | `.agents/workflows/*.md` defines sequencing and artifact contracts |
| Packaging | npm metadata | `package.json` exports `.agents/*`, but `src/` is effectively empty |
| Installation | Shell script | `scripts/install-codex-skills.sh` copies skill wrappers into Codex |
| Validation | Placeholder only | `npm run validate` currently echoes a message and performs no checks |

## Project Structure
```text
.agents/
├── roles/
│   ├── product/        # Sequential product pipeline roles
│   └── iterate/        # Standalone investigation/review/design roles
├── skills/             # Codex skill wrappers
├── templates/          # PRD, UX, and stories templates
└── workflows/          # product-to-spec, spec-to-code, product-to-code

.cursor/
├── commands/           # Slash-command wrappers for each agent
└── rules/              # Shared framework context for Cursor

docs/
└── viber-mode/
    └── analysis.md     # This repo-level analysis artifact

scripts/
└── install-codex-skills.sh

src/
└── .gitkeep            # No runtime implementation yet
```

## Patterns & Conventions
- **Single source of truth**: Canonical behavior lives in `.agents/roles/*`; skills, Cursor commands, and agent indexes mostly point back to those files.
- **Artifact handoff model**: Product pipeline is designed around `docs/[project-name]/` artifacts rather than chat history.
- **Two-tier system**: Product agents form a sequential delivery pipeline; iterate agents are standalone helpers.
- **Thin integration wrappers**: Platform-specific layers intentionally stay small and mostly reference canonical role files.
- **Legacy alias retention**: `ralph-converter` and `ralph-runner` remain for backward compatibility even though `task-planner` and `implementation-runner` are the current canonical names.
- **Prompt-contract orientation**: The repo optimizes for role definitions and output formats rather than executable code.

## Workflow & Agent Architecture
- **Existing-project path**: `analyzer -> product-to-spec -> spec-to-code`
- **Spec path**: `brainstormer -> prd -> ux-designer -> user-stories`
- **Implementation path**: `task-planner -> implementation-runner -> reviewer`
- **Iterate toolkit**: `scout`, `planner`, `reviewer`, and `ux-tweaker` are intentionally usable outside the main pipeline.

The strongest design choice is that downstream agents are expected to consume stable artifacts, especially each document's `## Summary (for downstream agents)` block and explicit handoff contract. That makes the system portable across tools and reduces dependence on conversation memory.

## Current UI/UX State
- **End-user UI**: None; this is a framework/documentation repo, not an application product
- **Primary surfaces**: `README.md`, `AGENTS.md`, `.agents/roles/*`, `.agents/workflows/*`, and `.cursor/commands/*`
- **UX quality of the framework itself**: Good discoverability and naming, especially in `AGENTS.md` and the workflow docs
- **Usability constraint**: The framework is easy to read, but not yet easy to execute mechanically because bootstrapping and validation are manual

## Technical Debt & Concerns
- `npm run validate` is a placeholder, so drift between roles, wrappers, workflow docs, templates, and README can accumulate silently.
- `task-planner` still defaults branch naming to `ralph/`, which conflicts with the repo's newer canonical terminology and suggests unfinished migration.
- `scripts/install-codex-skills.sh` performs a destructive replace of target skill folders without a dry-run or verification step; acceptable for local setup, but not hardened.
- `src/` is empty, so the npm package currently ships definitions rather than an actual runtime or orchestration layer.

## Opportunities
- Add a real validator that checks all referenced paths, required sections, artifact names, and cross-file terminology consistency.
- Add a small bootstrap/status CLI that can initialize `docs/[project-name]/`, show pipeline progress, and verify required upstream artifacts before each step.
- Generate wrapper files from canonical role metadata so README, Cursor commands, skill wrappers, and AGENTS docs cannot diverge manually.
- Add example projects under `docs/examples/` or fixtures so the workflow can be tested end to end.

## Summary (for downstream agents)
```yaml
project_type: ai-agent-framework
key_stacks:
  - markdown-role-specs
  - codex-skills
  - cursor-slash-commands
  - shell-install-script
reusable_patterns:
  - canonical-role-files-under-.agents/roles
  - docs-folder-artifact-handoffs
  - summary-plus-handoff-contract-per-artifact
  - thin-platform-wrapper-files
known_constraints:
  - no runtime workflow engine
  - no automated contract validation
  - npm-package-has-minimal-runtime-code
relevant_system_areas:
  - .agents/roles/product
  - .agents/roles/iterate
  - .agents/workflows
  - .agents/skills
  - .cursor/commands
  - README.md
```

For downstream product work, the most stable assumption is that `.agents/roles/*` and `.agents/workflows/*` are the authoritative sources. For framework-maintenance work, the highest-risk area is contract drift across aliases and wrappers rather than application logic.

## Handoff Contract
- **Next Agent**: `planner` for framework improvements, or `brainstormer` if the next step is productizing the runtime/validator roadmap
- **Required Artifacts**: [analysis.md](/Users/mcan/ViberMode/info/analysis.md)
- **Recommended Artifacts**: [product-to-code.md](/Users/mcan/ViberMode/.agents/workflows/product-to-code.md), [product-to-spec.md](/Users/mcan/ViberMode/.agents/workflows/product-to-spec.md), [spec-to-code.md](/Users/mcan/ViberMode/.agents/workflows/spec-to-code.md), [README.md](/Users/mcan/ViberMode/README.md)
- **Critical Inputs That Must Remain Stable**: Canonical role paths under `.agents/roles/*`, artifact folder convention `docs/[project-name]/`, canonical product-agent order, and the `Summary (for downstream agents)` plus `Handoff Contract` requirement
- **Sections That Must Remain Stable**: `Tech Stack`, `Patterns & Conventions`, `Workflow & Agent Architecture`, and the YAML block in `Summary (for downstream agents)`
- **Suggested Next Prompt**: `Use the planner agent to propose how to add validation tooling in ViberMode. Read info/analysis.md and .agents/workflows/product-to-code.md first.`
