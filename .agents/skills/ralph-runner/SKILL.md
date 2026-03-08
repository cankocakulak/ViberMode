---
name: "viber-ralph-runner"
description: "Use when the user asks to implement the next story, run the Ralph loop, pick up the next task from prd.json, or autonomously implement a user story."
---

# Ralph Runner

Read and follow the full agent instructions at `viber-mode/.agents/roles/product/ralph-runner.md`.

Before starting:
1. Read `prd.json` for the task list
2. Read `progress.txt` for learnings from previous iterations
3. Read the docs folder from `prd.json` field `docsPath` for rich context

End each run with a short handoff for the next iteration, including what changed, carry-forward context, and the next suggested prompt.
