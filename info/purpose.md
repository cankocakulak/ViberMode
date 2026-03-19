# ViberMode Purpose Notes: OpenClaw, Codex, and Workflow Architecture

## Purpose

This document captures the current architectural intent behind combining ViberMode, OpenClaw, and Codex into a workflow that can evolve from idea generation to implementation, validation, and eventually automation.

The core goal is not just "generate code." The goal is to design a reusable execution model for:

- idea exploration
- product specification
- UX definition
- story slicing
- task generation
- implementation
- compile/test/review loops
- repeatable automation over time

## Core Goal

The desired end state is a workflow that can:

- start from a raw product idea
- produce structured artifacts
- turn those artifacts into executable tasks
- implement tasks in order
- run compile, lint, and test checks
- review changes through intermediate workers
- continue with minimal human intervention
- later support scheduled or recurring execution

This means the system is not only a coding setup. It is a workflow runtime problem.

## ViberMode's Role

ViberMode is best understood as the contract layer.

Its main value is the artifact-driven workflow:

- `analysis.md`
- `brainstorm.md`
- `prd.md`
- `ux.md`
- `stories.md`
- `tasks.json`
- `run-state.json`

The strongest part of ViberMode is that each step has a stable handoff contract. That makes it a good source of truth even if execution is handled by another platform.

## OpenClaw's Role

OpenClaw is best understood as the orchestration shell.

It becomes useful when the workflow needs:

- multiple workers
- background execution
- session management
- explicit orchestration
- repeatable workflow runs
- future automation via cron or scheduled runs

OpenClaw is not the simplest answer for "just code tasks in one repo." It is useful when the workflow becomes multi-step and multi-worker.

## Codex's Role

Codex is best understood as the strongest immediate coding worker.

For single-repo sequential implementation, Codex is the most pragmatic tool for:

- implementing one task at a time
- reading repo artifacts
- running compile/lint/test commands
- fixing failures
- updating structured state

If the problem is only "take `tasks.json` and finish tasks in order," Codex is the simpler choice.

## Important Distinction

There are really two different problems:

1. `product-to-spec`
2. `spec-to-code`

These should not be treated as the same kind of workflow.

### Product-to-Spec

This stage is mainly an orchestration and specialist-agent problem:

- brainstorm
- PRD
- UX
- stories
- task generation

OpenClaw is a strong fit here, especially if the workflow needs structured delegation.

### Spec-to-Code

This stage is mainly a stateful coding-runtime problem:

- pick next task
- implement
- compile/test
- review
- fix
- mark done
- move to next task

Codex is the better direct worker here. OpenClaw becomes useful only when this turns into a true orchestrated multi-worker loop.

## Why Native OpenClaw Subagents Were Not Enough

Earlier experiments showed friction around:

- spawning specialist subagents reliably
- keeping the delegated context stable
- continuing automatically without asking for permission after each step

The likely reasons are:

- subagent context is narrower than the full repo context
- subagent execution is primitive-level orchestration, not a full workflow engine
- coding loops need stronger state continuity than simple subagent delegation provides

This does not make OpenClaw unusable. It means native subagents alone are not the full answer for long coding loops.

## What OpenProse Adds

Normal markdown workflow files are descriptive.

OpenProse is valuable because it moves a workflow closer to execution:

- explicit control flow
- repeatable workflow structure
- workflow state and run records
- clearer sequencing and handoffs

This makes it more suitable than a plain markdown guide when the same workflow needs to be re-run, modified, and tested repeatedly.

OpenProse is therefore a strong candidate for `product-to-spec`, and possibly for orchestration around later phases.

## What ACP Adds

ACP is the bridge that lets OpenClaw use stronger external workers.

In practice, this matters because OpenClaw can orchestrate while Codex does the implementation work.

That means:

- OpenClaw can supervise
- Codex can code
- other workers can compile, test, or review

ACP is therefore important when the desired system is:

- one orchestrator
- multiple specialized workers
- shared state through repo artifacts

## Recommended Architecture

The most realistic architecture is hybrid.

### Short-Term Practical Model

- `OpenClaw` handles `product-to-spec`
- `Codex` handles `spec-to-code`

That means:

- OpenClaw produces `brainstorm.md`, `prd.md`, `ux.md`, `stories.md`, and `tasks.json`
- Codex reads `tasks.json` and executes the implementation loop

This is the lowest-friction path that still preserves the larger vision.

### Longer-Term Workflow Model

- `ViberMode` remains the contract layer
- `OpenClaw` becomes the orchestration runtime
- `OpenProse` becomes the executable workflow layer
- `ACP + Codex` become the main implementation worker path

This allows the workflow to expand into:

- implementation workers
- compile/test workers
- review workers
- retry/fix workers
- scheduled runs

## Proposed Multi-Worker Spec-to-Code Loop

The future `spec-to-code` state machine should look like this:

1. `pick-task`
2. `implement`
3. `compile-and-test`
4. `review`
5. `fix-if-needed`
6. `mark-done`
7. `next-task`

This is the right mental model for the long-term system.

The orchestrator should own the loop. Workers should not improvise the loop themselves.

## State Management Principles

The system should not depend on a single long prompt.

Instead:

- `tasks.json` should remain the source of truth for task definitions and dependencies
- `run-state.json` should track execution history and current progress
- build, test, and review outcomes can be captured as artifacts when needed

This keeps the workflow inspectable, resumable, and testable.

## Why Stateful Loops Matter

Large multi-step runs are fragile if they live only inside prompt memory.

A stateful loop is more reliable because it supports:

- resumability
- retries
- inspection
- partial completion
- automation
- future scheduled execution

This is important for workflows with 20 to 30 tasks or more.

## Realistic Assessment

This direction is realistic, but only with the right expectations.

- OpenClaw is a strong orchestration candidate, not the best raw coding tool.
- Codex is a strong coding worker, not by itself a full workflow platform.
- OpenProse is useful when the workflow must be executable rather than just documented.
- ACP matters when OpenClaw needs to delegate real implementation work to stronger coding runtimes.

The combined direction is realistic if approached in phases.

## Recommended Roadmap

### Phase 1

Stabilize `spec-to-code` directly with ViberMode artifacts and Codex.

Goal:

- make sequential task execution reliable
- make compile/test loops reliable
- make `tasks.json` and `run-state.json` solid

### Phase 2

Use OpenClaw for `product-to-spec`.

Goal:

- specialist delegation
- stable artifact creation
- repeatable workflow entry

### Phase 3

Introduce `OpenClaw + ACP + Codex` for implementation orchestration.

Goal:

- orchestrator-driven task loop
- stronger worker specialization
- cleaner background continuation

### Phase 4

Add compile/test/review workers and fix loops.

Goal:

- validate before marking tasks done
- reduce manual supervision

### Phase 5

Add scheduled or recurring automation.

Goal:

- periodic retries
- nightly validation
- backlog continuation

## Final Position

The current best framing is:

- `ViberMode` = contract layer
- `Codex` = best immediate coding worker
- `OpenClaw` = best long-term orchestration shell
- `OpenProse` = executable workflow layer
- `ACP` = bridge from orchestrator to strong external workers

The near-term practical decision is:

- use OpenClaw for spec generation
- use Codex for implementation

The long-term platform direction is:

- use OpenClaw to orchestrate the full idea-to-code pipeline while Codex and other workers execute specialized steps against ViberMode artifacts.
