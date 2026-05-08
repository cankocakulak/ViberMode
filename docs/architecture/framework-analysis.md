# Project Analysis: ViberMode

## Overview
- **Type**: Vendor-agnostic AI agent framework and workflow-definition repository
- **Primary language(s)**: Markdown, shell, minimal JSON/package metadata
- **Framework(s)**: Tool-agnostic agent definitions with Codex and Cursor integration layers
- **Package manager**: npm
- **Monorepo**: No

ViberMode is a documentation-first framework whose real product is the set of agent contracts under `packs/vibermode/roles/`. The repository is easy to read and structurally clean, but it currently behaves more like a prompt-contract framework than an executable runtime because validation, orchestration, and enforcement are still mostly absent.

## Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Source of truth | Markdown role specs | `packs/vibermode/roles/product/` and `packs/vibermode/roles/iterate/` define actual behavior |
| Codex integration | `SKILL.md` wrappers | `adapters/codex/skills/*` forwards intent to canonical role files |
| Cursor integration | Slash commands + MDC rules | `adapters/cursor/commands/*` and `adapters/cursor/rules/viber-mode.mdc` expose the same roles in Cursor |
| Workflow definition | Markdown workflow docs | `packs/vibermode/workflows/*.md` defines sequencing and artifact contracts |
| Packaging | npm metadata | The package exports framework assets such as `packs/*`, `adapters/*`, and `scripts/*` |
| Installation | Shell script | `adapters/codex/install/install-skills.sh` copies skill wrappers into Codex |
| Validation | Placeholder only | `npm run validate` currently echoes a message and performs no checks |

## Project Structure
```text
packs/
├── vibermode/
│   ├── roles/          # Sequential + iterate role contracts
│   ├── workflows/      # product-to-spec, spec-to-code, product-to-code
│   └── templates/      # PRD, UX, and stories templates
└── simmer/
    └── paper-trading/  # Simmer domain pack

adapters/
├── codex/              # Skill wrappers + install helpers
├── cursor/             # Slash commands + always-on rules
└── openclaw/           # OpenClaw projections + integration guidance

docs/
├── architecture/       # Framework analysis and roadmap notes
└── openclaw/           # OpenClaw integration and boundary docs
```

## Patterns & Conventions
- **Single source of truth**: Canonical behavior lives in `packs/vibermode/roles/*`; skills, Cursor commands, and agent indexes point back to those files.
- **Artifact handoff model**: The product pipeline is designed around `docs/[project-name]/` artifacts rather than chat history.
- **Two-tier system**: Product agents form a sequential delivery pipeline; iterate agents are standalone helpers.
- **Thin integration wrappers**: Platform-specific layers intentionally stay small and mostly reference canonical role files.
- **Legacy alias retention**: `ralph-converter` and `ralph-runner` remain for backward compatibility even though `task-planner` and `implementation-runner` are the canonical names.
- **Prompt-contract orientation**: The repository optimizes for role definitions and output formats rather than executable code.

## Workflow & Agent Architecture
- **Existing-project path**: `analyzer -> product-to-spec -> spec-to-code`
- **Spec path**: `brainstormer -> prd -> ux-designer -> user-stories`
- **Implementation path**: `task-planner -> implementation-runner -> reviewer`
- **Iterate toolkit**: `scout`, `planner`, `reviewer`, `ux-tweaker`, and newer investigation skills are intentionally usable outside the main pipeline.

The strongest design choice is that downstream agents consume stable artifacts, especially each document's `## Summary (for downstream agents)` block and explicit handoff contract. That makes the system portable across tools and reduces dependence on conversation memory.

## Current UI/UX State
- **End-user UI**: None; this is a framework/documentation repository, not an application product
- **Primary surfaces**: `README.md`, `AGENTS.md`, `packs/vibermode/roles/*`, `packs/vibermode/workflows/*`, and `adapters/cursor/commands/*`
- **Framework UX quality**: Good discoverability and naming in the top-level docs and workflow files
- **Usability constraint**: The framework is easy to read, but not yet easy to execute mechanically because bootstrapping and validation are still manual

## Technical Debt & Concerns
- `npm run validate` is a placeholder, so drift between roles, wrappers, workflow docs, templates, and README can accumulate silently.
- `task-planner` still defaults branch naming to `ralph/`, which conflicts with the repo's newer canonical terminology and suggests unfinished migration.
- `adapters/codex/install/install-skills.sh` performs a destructive replace of target skill folders without a dry-run or verification step; acceptable for local setup, but not hardened.
- The npm package currently publishes definition assets rather than a real runtime or orchestration layer.

## Opportunities
- Add a real validator that checks referenced paths, required sections, artifact names, and cross-file terminology consistency.
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
  - canonical-role-files-under-packs/vibermode/roles
  - docs-folder-artifact-handoffs
  - summary-plus-handoff-contract-per-artifact
  - thin-platform-wrapper-files
known_constraints:
  - no runtime workflow engine
  - no automated contract validation
  - npm-package-publishes-definition-assets
relevant_system_areas:
  - packs/vibermode/roles/product
  - packs/vibermode/roles/iterate
  - packs/vibermode/workflows
  - adapters/codex/skills
  - adapters/cursor/commands
  - README.md
```

For downstream framework work, the most stable assumption is that `packs/vibermode/roles/*` and `packs/vibermode/workflows/*` are the authoritative sources. The highest-risk area is contract drift across aliases and wrappers rather than application logic.

## Handoff Contract
- **Next Agent**: `planner` for framework improvements, or `brainstormer` if the next step is productizing the runtime/validator roadmap
- **Required Artifacts**: `docs/architecture/framework-analysis.md`
- **Recommended Artifacts**: `packs/vibermode/workflows/product-to-code.md`, `packs/vibermode/workflows/product-to-spec.md`, `packs/vibermode/workflows/spec-to-code.md`, `README.md`
- **Critical Inputs That Must Remain Stable**: canonical role paths under `packs/vibermode/roles/*`, artifact folder convention `docs/[project-name]/`, canonical product-agent order, and the `Summary (for downstream agents)` plus `Handoff Contract` requirement
- **Sections That Must Remain Stable**: `Tech Stack`, `Patterns & Conventions`, `Workflow & Agent Architecture`, and the YAML block in `Summary (for downstream agents)`
- **Suggested Next Prompt**: `Use the planner agent to propose how to add validation tooling in ViberMode. Read docs/architecture/framework-analysis.md and packs/vibermode/workflows/product-to-code.md first.`
