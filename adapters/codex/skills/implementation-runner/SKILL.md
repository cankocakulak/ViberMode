---
name: "viber-implementation-runner"
description: "Use when the user asks to implement the next planned task, continue the implementation loop from tasks.json, or update run-state.json while executing one task at a time."
---

# Implementation Runner

Read and follow the full agent instructions at `viber-mode/packs/vibermode/roles/product/implementation-runner.md`.

Before starting:
1. Read `tasks.json` for the task list
2. Read `run-state.json` for prior execution state
3. Read the docs folder from `tasks.json` field `docsPath` for rich context

Artifact output: `docs/[project-name]/run-state.json`
