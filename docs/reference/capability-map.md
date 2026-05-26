# Capability Map

This document answers one practical question:

> Which ViberMode skill, agent, or workflow should I use for this job?

It is written for both humans and tool-assisted workers such as Codex, Claude Code, Cursor, and OpenClaw operators.

## Reading Guide

### Callability

- `always-callable`
  - Can be used at any time in an existing repository
  - Should not require pipeline artifacts to exist first
- `artifact-aware`
  - Uses artifacts such as `analysis.md`, `tasks.json`, or `bootstrap.md` when present
  - Still expected to work best-effort without them unless explicitly noted
- `artifact-required`
  - Requires specific upstream artifacts and should not be used without them

### Kinds

- `product-agent`
  - Sequential, artifact-driven planning and specification agents
- `iterate-agent`
  - Standalone investigation, verification, UX, refactor, and review helpers
- `workflow`
  - Multi-step composed operating procedure

### Surface Tiers

- `primary`
  - Recommended public surface for normal use
- `support`
  - Important capability, but usually part of a larger flow or stage gate
- `legacy`
  - Compatibility-only surface; avoid for new usage

## Quick Picks

| Situation | Use |
|----------|-----|
| I need to understand unfamiliar code | `scout` |
| I need to plan a bug fix or feature approach | `planner` |
| I want to review code quality or regressions | `reviewer` |
| I want to improve the feel of an existing UI | `ux-tweaker` |
| I want to diagnose UX friction before changing it | `ux-investigator` |
| I want to split a large or messy file safely | `modularizer` |
| I need proof that a feature really works | `tester` |
| I need to check whether a feature is actually wired end to end | `integration-auditor` |
| I want to harden empty/loading/error/accessibility states | `surface-hardener` |
| I am starting from an idea and need specs | `product-to-spec` |
| I already have specs and want implementation execution | `spec-to-code` |
| I want the full idea-to-code path | `product-to-code` |
| I want to work inside an existing repo without the full greenfield flow | `repo-change` |
| I need repo baseline and runnable setup clarified first | `bootstrap` |
| I want to factory-create iOS repos and prepare App Store automation | `ios-app-store-factory` |

## Product Agents

### Primary product agents

#### `analyzer`

- Kind: `product-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Discover project structure, patterns, and constraints in an existing codebase
- Use when:
  - starting work on an unfamiliar repository
  - entering the product pipeline for an existing product
- Avoid when:
  - the task is a one-file edit
  - no real project exists yet
- Typical outputs:
  - `docs/[project-name]/analysis.md`
- Surfaces:
  - Codex: `viber-analyzer`
  - Cursor: `/analyzer`
  - Any tool: `analyzer` via `AGENTS.md`

#### `brainstormer`

- Kind: `product-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Explore solution directions and recommend one
- Use when:
  - the product idea is still fuzzy
  - you want structured options before PRD work
- Avoid when:
  - implementation planning is already concrete
- Typical outputs:
  - `docs/[project-name]/brainstorm.md`
- Surfaces:
  - Codex: `viber-brainstormer`
  - Cursor: `/brainstormer`
  - Any tool: `brainstormer`

#### `prd`

- Kind: `product-agent`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Turn ideation into a lean, implementation-aware PRD
- Use when:
  - the product direction is chosen
  - requirements need to become stable
- Avoid when:
  - the work is just a small repo iteration
- Typical outputs:
  - `docs/[project-name]/prd.md`
- Surfaces:
  - Codex: `viber-prd`
  - Cursor: `/prd`
  - Any tool: `prd`

#### `ux-designer`

- Kind: `product-agent`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Define flows, interaction shape, visual direction, and references
- Use when:
  - a feature or product needs UX structure before implementation
- Avoid when:
  - you only need local polish on an existing screen
- Typical outputs:
  - `docs/[project-name]/ux.md`
- Surfaces:
  - Codex: `viber-ux-designer`
  - Cursor: `/ux-designer`
  - Any tool: `ux-designer`

#### `user-stories`

- Kind: `product-agent`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Convert product and UX intent into backlog-style stories
- Use when:
  - PRD and UX context exist or can be inferred
- Avoid when:
  - the change is tiny and does not need backlog breakdown
- Typical outputs:
  - `docs/[project-name]/stories.md`
- Surfaces:
  - Codex: `viber-user-stories`
  - Cursor: `/user-stories`
  - Any tool: `user-stories`

### Support product agents

#### `bootstrap`

- Kind: `product-agent`
- Callability: `artifact-aware`
- Tier: `support`
- Purpose: Establish repo root, branch, setup baseline, and runnable validation context
- Use when:
  - implementation will depend on stable repo and validation commands
- Avoid when:
  - the repo is already known-good and ready
- Typical outputs:
  - `docs/[project-name]/bootstrap.md`
- Naming note:
  - This is the underlying bootstrap role.
  - In day-to-day capability selection, think of `bootstrap` mainly as a support stage rather than a first-choice entrypoint.
- Surfaces:
  - Codex: `viber-bootstrap`
  - Cursor: not currently projected
  - Any tool: `bootstrap`

#### `task-planner`

- Kind: `product-agent`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Convert stories into `tasks.json`
- Requires:
  - `docs/[project-name]/stories.md`
- Typical outputs:
  - `docs/[project-name]/tasks.json`
- Surfaces:
  - Codex: `viber-task-planner`
  - Cursor: `/task-planner`
  - Any tool: `task-planner`

#### `implementation-runner`

- Kind: `product-agent`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Implement exactly one eligible task from `tasks.json`, validate it, and update execution state
- Requires:
  - `docs/[project-name]/tasks.json`
- Typical outputs:
  - updated code
  - updated `docs/[project-name]/tasks.json`
  - updated `docs/[project-name]/run-state.json`
- Surfaces:
  - Codex: `viber-implementation-runner`
  - Cursor: `/implementation-runner`
  - Any tool: `implementation-runner`

### Legacy aliases

| Canonical | Alias | Use note |
|----------|-------|----------|
| `task-planner` | `ralph-converter` | Compatibility only |
| `implementation-runner` | `ralph-runner` | Compatibility only |

## Iterate Agents

### Understand

#### `scout`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Build fast local context on a file, module, or folder
- Use when:
  - you need to understand code before touching it
- Avoid when:
  - you need a fix strategy or a review verdict
- Surfaces:
  - Codex: `viber-scout`
  - Cursor: `/scout`
  - Any tool: `scout`

#### `planner`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Trace a bug or plan a feature/refactor before implementation
- Use when:
  - thinking first will save time
- Avoid when:
  - the desired change is already fully obvious and tiny
- Surfaces:
  - Codex: `viber-planner`
  - Cursor: `/planner`
  - Any tool: `planner`

### Improve

#### `ux-tweaker`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Improve the feel, clarity, accessibility, or responsiveness of an existing UI surface
- Use when:
  - the desired UX direction is already mostly clear
- Avoid when:
  - you first need to diagnose why the UX feels wrong
- Surfaces:
  - Codex: `viber-ux-tweaker`
  - Cursor: `/ux-tweaker`
  - Any tool: `ux-tweaker`

#### `ux-investigator`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Investigate UX friction, clarify direction, and then improve the current surface
- Use when:
  - you want a UX diagnosis before implementation
  - the right change is not obvious yet
- Avoid when:
  - you need a top-down product UX spec
- Surfaces:
  - Codex: `viber-ux-investigator`
  - Cursor: `/ux-investigator`
  - Any tool: `ux-investigator`

#### `modularizer`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Find safe seams for modularization and incremental refactor
- Use when:
  - a file or feature is too large, mixed, or coupled
- Avoid when:
  - the main problem is product behavior rather than structure
- Surfaces:
  - Codex: `viber-modularizer`
  - Cursor: `/modularizer`
  - Any tool: `modularizer`

#### `surface-hardener`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Harden unhappy-path states such as loading, empty, error, disabled, retry, and accessibility
- Use when:
  - a feature works on the happy path but feels brittle
- Avoid when:
  - the user needs broad redesign rather than resilience work
- Surfaces:
  - Codex: `viber-surface-hardener`
  - Cursor: `/surface-hardener`
  - Any tool: `surface-hardener`

### Verify

#### `integration-auditor`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Audit whether a feature is actually wired across routes, state, events, services, and persistence
- Use when:
  - code exists but you suspect the connection path is incomplete
  - you want a path trace from entry point to outcome
- Avoid when:
  - the main question is broad product ideation
  - you primarily need release-gate build/runtime evidence
- Distinction:
  - Choose this before `tester` when the core question is "is the connection path complete?"
- Surfaces:
  - Codex: `viber-integration-auditor`
  - Cursor: `/integration-auditor`
  - Any tool: `integration-auditor`

#### `tester`

- Kind: `iterate-agent`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Verify a surface with CLI checks plus runtime evidence
- Use when:
  - you need proof, not just code inspection
  - you want narrow feature verification or smoke testing
- Avoid when:
  - no runnable or observable verification path exists and pure planning is sufficient
  - you need formal pipeline-grade validation artifact output
- Distinction:
  - Choose this before `runtime-validator` for ad-hoc, developer-driven verification.
  - Choose this after `integration-auditor` when the wiring path looks complete and now needs behavioral proof.
- Surfaces:
  - Codex: `viber-tester`
  - Cursor: `/tester`
  - Any tool: `tester`

#### `reviewer`

- Kind: `iterate-agent`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Review implementation quality, regressions, and requirement alignment
- Use when:
  - you need findings and risk assessment
- Avoid when:
  - you only need contextual understanding
- Surfaces:
  - Codex: `viber-reviewer`
  - Cursor: `/reviewer`
  - Any tool: `reviewer`

### Other iterate-stage capabilities

| Capability | Status | Notes |
|-----------|--------|-------|
| `runtime-validator` | Codex-only support | Formal pipeline-grade build/runtime gate with `validation-report.md` output |
| `spec-reviewer` | Codex-only support | Spec approval gate before implementation begins |
| `remediation-router` | Codex-only support | Routes failed review or validation findings back into execution state |
| `change-task-planner` | Codex-only support | Existing-repo sibling of `task-planner`; converts `plan.md` rather than `stories.md` |

## Workflows

### Primary workflows

#### `product-to-spec`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Run the full idea-to-specification path
- Stages:
  - `brainstormer -> prd -> ux-designer -> user-stories -> spec-reviewer`
- Use when:
  - starting from an idea
  - you want implementation-ready specification artifacts
- Surfaces:
  - Codex: `viber-product-to-spec`
  - Cursor: not currently projected
  - OpenClaw: documented target workflow

#### `spec-to-code`

- Kind: `workflow`
- Callability: `artifact-required`
- Tier: `primary`
- Purpose: Convert completed specs into tasks, implementation runs, validation, and review
- Requires:
  - completed specification artifacts
- Surfaces:
  - Codex: `viber-spec-to-code`
  - Cursor: not currently projected
  - OpenClaw: documented active workflow

#### `product-to-code`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `primary`
- Purpose: Run the full path from idea through implementation
- Stages:
  - `product-to-spec -> bootstrap -> spec-to-code`
- Surfaces:
  - Codex: `viber-product-to-code`
  - Cursor: not currently projected
  - OpenClaw: documented composed workflow target

#### `repo-change`

- Kind: `workflow`
- Callability: `always-callable`
- Tier: `primary`
- Purpose: Handle change planning and execution inside an existing repository without forcing the full greenfield flow
- Use when:
  - the task is a real repo change but not a full new-product flow
- Distinction:
  - Use this instead of `product-to-spec` when the repo already exists and the task is a bounded repo change.
- Surfaces:
  - Codex: `viber-repo-change`
  - Cursor: not currently projected
  - OpenClaw: not currently projected

### Support workflows

#### `bootstrap`

- Kind: `workflow`
- Callability: `artifact-aware`
- Tier: `support`
- Purpose: Prepare repo and runtime baseline before implementation
- Use when:
  - branch, setup, and validation baseline are not yet trusted
- Naming note:
  - This is the public support workflow name.
  - The underlying executor is the bootstrap role described above.
- Surfaces:
  - Canonical workflow only
  - OpenClaw: documented target workflow

#### `remediation-routing`

- Kind: `workflow`
- Callability: `artifact-required`
- Tier: `support`
- Purpose: Route failed validation or review findings back into implementation state
- Surfaces:
  - Codex: `viber-remediation-routing`
  - Cursor: not currently projected
  - OpenClaw: documented workflow target

## Surface Notes

### Codex

- Broadest surface coverage today
- Supports product agents, iterate agents, and multiple workflows through skill wrappers

### Cursor

- Best coverage for high-frequency command-style interactions
- Does not yet expose every workflow or every product capability

### Claude Code and other generic tools

- Use `AGENTS.md`
- Canonical role names remain the stable surface

### OpenClaw

- Use the docs under `docs/openclaw/`
- OpenClaw is treated as the orchestration/runtime shell rather than the canonical authoring surface
- Some workflows are documented targets rather than fully projected first-class commands inside this repository

## Simplification Notes

- Prefer `primary` surfaces unless you are intentionally operating inside a stage-gated pipeline.
- Treat `support` surfaces as internal workflow stages, validation gates, or translation helpers.
- Treat `legacy` surfaces as compatibility-only; do not recommend them for new usage.
