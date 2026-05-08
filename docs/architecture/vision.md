# ViberMode Architecture Vision

## Purpose

This document captures the architectural intent behind combining ViberMode, OpenClaw, and Codex into a workflow that can evolve from idea generation to implementation, validation, and eventually automation.

The core goal is not only "generate code." The goal is to design a reusable execution model for:

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

## Layer Roles

### ViberMode

ViberMode is the contract layer.

Its main value is the artifact-driven workflow:

- `analysis.md`
- `brainstorm.md`
- `prd.md`
- `ux.md`
- `stories.md`
- `tasks.json`
- `run-state.json`

Each step has a stable handoff contract. That makes ViberMode a strong source of truth even if execution is handled elsewhere.

### OpenClaw

OpenClaw is the orchestration shell.

It becomes valuable when the workflow needs:

- multiple workers
- background execution
- session management
- explicit orchestration
- repeatable workflow runs
- future automation via cron or scheduled runs

### Codex

Codex is the strongest immediate coding worker.

For single-repo sequential implementation, Codex is the most pragmatic tool for:

- implementing one task at a time
- reading repo artifacts
- running compile/lint/test commands
- fixing failures
- updating structured state

## Key Distinction

There are two different workflow problems:

1. `product-to-spec`
2. `spec-to-code`

### Product-to-Spec

This stage is mainly an orchestration and specialist-agent problem:

- brainstorm
- PRD
- UX
- stories
- task generation

OpenClaw is a strong fit here, especially when structured delegation matters.

### Spec-to-Code

This stage is mainly a stateful coding-runtime problem:

- pick next task
- implement
- compile/test
- review
- fix
- mark done
- move to next task

Codex is the better direct worker here. OpenClaw becomes useful when this grows into a true orchestrated multi-worker loop.

## Recommended Architecture

The most realistic architecture is hybrid.

### Short-Term Practical Model

- `OpenClaw` handles `product-to-spec`
- `Codex` handles `spec-to-code`

### Longer-Term Workflow Model

- `ViberMode` remains the contract layer
- `OpenClaw` becomes the orchestration runtime
- `OpenProse` becomes the executable workflow layer
- `ACP + Codex` become the main implementation worker path

## State Management Principles

The system should not depend on a single long prompt.

Instead:

- `tasks.json` should remain the source of truth for task definitions and dependencies
- `run-state.json` should track execution history and current progress
- build, test, and review outcomes can be captured as artifacts when needed

This keeps the workflow inspectable, resumable, and testable.
