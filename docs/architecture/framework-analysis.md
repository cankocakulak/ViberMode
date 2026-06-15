# Project Analysis: ViberMode

## Overview
- **Type**: Vendor-agnostic AI agent framework and workflow-definition repository
- **Primary language(s)**: Markdown, JavaScript, shell, YAML/JSON metadata
- **Framework(s)**: Tool-agnostic agent definitions with Codex and Cursor integration notes
- **Package manager**: npm
- **Monorepo**: No

ViberMode is a documentation-first framework whose product is the set of portable agent and workflow contracts under `packs/`. The repository is generally readable and well organized, but it now has enough generated artifacts, compatibility surfaces, and operational scripts that cleanup should be handled as a small controlled pass rather than ad hoc deletion.

## Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Source of truth | Markdown role/workflow specs | `packs/vibermode/roles/` and `packs/vibermode/workflows/` define canonical behavior |
| Codex integration | `SKILL.md` wrappers | `adapters/codex/skills/*` forwards intent to canonical role/workflow files; 33 wrappers are mapped |
| Cursor integration | Slash commands + MDC rules | `adapters/cursor/commands/*` and `adapters/cursor/rules/viber-mode.mdc`; coverage is intentionally partial |
| Workflow definition | Markdown workflow docs | Includes product/spec/code, repo-change, release, remediation, and iOS factory flows |
| Operations tooling | Node.js scripts | App research, backlog, repo factory, workspace acquisition, TestFlight submission, and reference validation |
| Packaging | npm metadata | Exports `packs/*`, `adapters/*`, and `scripts/*`; no runtime dependency tree |
| Installation | Shell script | `adapters/codex/install/install-skills.sh` copies skill wrappers and a shared support bundle into Codex |
| Validation | Node reference and task-phase validators | `npm run validate` runs reference-map validation plus `scripts/validate-task-phases.mjs`; task-phase validation is strict for phase-aware/factory task files and warning-only for legacy task files |

## Project Structure
```text
packs/
└── vibermode/
    ├── roles/          # Product and iterate role contracts
    ├── workflows/      # Product, repo-change, release, remediation, and iOS factory workflows
    ├── patterns/       # Reusable copy-and-adapt iOS factory surface patterns
    └── templates/      # PRD, UX, and stories templates

adapters/
├── codex/              # Skill wrappers + installer
└── cursor/             # Slash commands + always-on rule

docs/
├── architecture/       # Framework analysis and service architecture notes
├── reference/          # Capability map, surface map, decision tree, visual map
└── operations/         # Operational runbooks and historical run archives

scripts/
└── *.mjs / *.sh        # Operational helpers and validators
```

## Patterns & Conventions
- **Single source of truth**: Canonical behavior lives in `packs/vibermode/roles/*` and `packs/vibermode/workflows/*`; wrappers point back to those files.
- **Artifact handoff model**: Product and change workflows use `docs/[project-name]/` artifacts instead of relying on chat history.
- **Surface inventory**: `docs/reference/agent-surface-map.yaml` maps canonical paths to Codex, Cursor, and any-tool surfaces.
- **Factory pattern catalog**: `packs/vibermode/patterns/ios-factory/` stores onboarding and paywall shell references that UX and task planning can select by pattern ID.
- **Thin integration wrappers**: Codex and Cursor surfaces stay small and mostly defer to canonical pack files.
- **Compatibility retention**: `ralph-converter` and `ralph-runner` remain as legacy aliases for `task-planner` and `implementation-runner`.
- **Core boundary**: Domain-specific packs and external orchestration runtime material stay outside ViberMode core; see `docs/architecture/boundary-decisions.md`.
- **Operational expansion**: The repo now includes real app-factory and TestFlight helper scripts, not only prompt contracts.

## Workflow & Agent Architecture
- **Existing-project path**: `analyzer -> product-to-spec -> bootstrap -> spec-to-code`
- **Spec path**: `brainstormer -> prd -> ux-designer -> user-stories`
- **Implementation path**: `task-planner -> implementation-runner` with phase gates (`foundation -> core -> polish`) `-> runtime-validator -> experience-reviewer -> reviewer`
- **Existing-repo change path**: `change-triager -> repo-change -> experience-hardening -> optional release adapter`
- **Iterate toolkit**: `scout`, `planner`, `reviewer`, `ux-tweaker`, `ux-investigator`, `modularizer`, `tester`, `integration-auditor`, `surface-hardener`, and support gates.

The strongest design choice remains the stable handoff contract: downstream agents consume file artifacts with summaries, explicit acceptance checks, and named next steps. The main complexity is no longer basic structure; it is keeping the growing projection and operations surfaces synchronized.

## Current UI/UX State
- **End-user UI**: None; this is a framework/documentation repository, not an app UI.
- **Primary user surfaces**: `README.md`, `AGENTS.md`, `docs/reference/*`, `packs/vibermode/roles/*`, and `packs/vibermode/workflows/*`.
- **Framework UX quality**: Discoverability is good for main paths, but some maps and quickstart material lag newer agents and workflows.
- **Operational UX**: App-factory scripts have concrete runbooks, but some scripts are exposed only through documentation and long command examples.

## Technical Debt & Concerns
- `adapters/cursor/commands/kickoff.md` is intentionally kept as a Cursor-only helper outside the canonical surface map.
- Legacy alias files are intentionally retained, but now act as thin compatibility pointers to canonical roles.
- `task-planner` uses a generic `feature/` branch prefix by default; downstream tools can still override it.
- Historical run/bootstrap artifacts are archived under `docs/operations/archive/`, but they still contain local absolute paths and should stay out of primary docs.

## Opportunities
- Add validator checks for lingering `.gitkeep` files and tracked primary docs with local absolute paths.
- Generate wrappers and reference inventory from one capability manifest so `README.md`, `AGENTS.md`, Codex skills, Cursor commands, and maps cannot drift manually.
- Add a small `scripts/repo-health.mjs` or extend `validate-reference-map.mjs` to report cleanup candidates without changing files.

## Summary (for downstream agents)
```yaml
project_type: ai-agent-framework
key_stacks:
  - markdown-role-and-workflow-specs
  - codex-skills
  - cursor-slash-commands
  - node-operational-scripts
  - npm-reference-validation
reusable_patterns:
  - canonical-role-and-workflow-files-under-packs/vibermode
  - docs-folder-artifact-handoffs
  - summary-plus-handoff-contract-per-artifact
  - thin-platform-wrapper-files
  - machine-readable-agent-surface-map
  - copy-and-adapt-ios-factory-pattern-catalog
known_constraints:
  - no full workflow runtime engine in this repo
  - compatibility surfaces for ralph aliases are intentionally retained
  - operational scripts depend on external GitHub, Apple, Xcode, Fastlane, and private state setup
  - working tree currently contains user changes and untracked new capability files
cleanup_targets: []
relevant_system_areas:
  - packs/vibermode/roles/product
  - packs/vibermode/roles/iterate
  - packs/vibermode/workflows
  - adapters/codex/skills
  - adapters/cursor/commands
  - docs/reference
  - scripts
```

For downstream framework work, the stable assumption is that `packs/vibermode/roles/*`, `packs/vibermode/workflows/*`, and `docs/reference/agent-surface-map.yaml` are the authoritative surfaces. The highest-risk cleanup area is deleting compatibility or operational artifacts without first deciding whether they are public examples, historical run evidence, or active automation inputs.

## Handoff Contract
- **Next Agent**: `planner`
- **Required Artifacts**: `docs/architecture/framework-analysis.md`
- **Recommended Artifacts**: `README.md`, `docs/reference/agent-surface-map.yaml`, `docs/reference/repo-visual-map.md`, `packs/vibermode/README.md`, `CONTRIBUTING.md`
- **Critical Inputs That Must Remain Stable**: canonical role/workflow paths under `packs/vibermode/`, artifact folder convention `docs/[project-name]/`, `docs/reference/agent-surface-map.yaml`, and `npm run validate`
- **Sections That Must Remain Stable**: `Tech Stack`, `Patterns & Conventions`, `Technical Debt & Concerns`, and the YAML block in `Summary (for downstream agents)`
- **Suggested Next Prompt**: `Use the planner agent to create a safe cleanup plan for ViberMode. Read docs/architecture/framework-analysis.md, then classify each cleanup target as delete, archive, update, or keep.`
