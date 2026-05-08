# OpenClaw Rollout Plan

## Purpose

This plan defines the order in which OpenClaw should be introduced so that `product-to-spec` and `spec-to-code` are solved in the right sequence rather than as one overloaded system.

## Guiding Approach

- Do not treat OpenClaw as one super-agent that solves everything from day one.
- Stabilize `product-to-spec` first.
- Add ACP-based workers for `spec-to-code` second.
- Keep responsibilities separate:
  - `skills/agents` = specialist roles
  - `OpenProse` = executable workflow structure
  - `ACP workers` = implementation, build, and review workers

## Rollout Steps

### 1. Workspace Bootstrap

Establish the stable bootstrap files and conventions:

- `AGENTS.md`
- ViberMode role files
- artifact path convention
- `tasks.json` and `run-state.json` shape

### 2. Initial OpenClaw Skill Set

Start with a narrow set of skills:

- `brainstormer`
- `prd-writer`
- `ux-designer`
- `story-writer`
- `task-planner`
- `spec-orchestrator`

### 3. First `.prose` Workflow

The first real `.prose` workflow should be `product-to-spec.prose`.

Success criterion:
- the same idea can be run multiple times and still produce consistent artifacts

### 4. Design `spec-to-code` as a Worker Graph

Before turning it into `.prose`, define the first worker graph:

- `task-orchestrator`
- `codex-implementer` via ACP
- `build-tester`
- `reviewer`
- optional `fixer`

### 5. Use ACP Only for Coding Work

ACP should first be introduced on the implementation side:

- `codex-implementer`
- `build-test`
- `review`

### 6. Expand `run-state.json`

Track more than completed tasks:

- current task
- current stage
- last implement result
- last build result
- last review result
- retry count
- files changed
- notes

### 7. Delay Automation

Only add cron/automation after:

- artifact production is stable
- task looping is stable
- retry/failure state is stable

## Recommended First Version

- OpenClaw handles `product-to-spec`
- Codex handles `spec-to-code`
- artifacts remain the source of truth in the target repository
- `run-state.json` remains the execution memory
