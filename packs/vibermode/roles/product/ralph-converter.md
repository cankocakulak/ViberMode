# Ralph Converter Agent

> Legacy compatibility alias for `task-planner`.

## Compatibility Contract

This file exists only so older prompts, Codex skills, Cursor commands, or external tools that still name `ralph-converter` keep working.

Canonical role:
- `packs/vibermode/roles/product/task-planner.md`

Canonical artifacts:
- `docs/[project-name]/tasks.json`
- `docs/[project-name]/run-state.json`

Legacy compatibility:
- Older workflows may still mention `prd.json`.
- New work must prefer `tasks.json`.
- A compatibility `prd.json` mirror may be written only when an explicitly legacy workflow requires it and the canonical task-planner rules allow it.

## Operating Rule

Read and follow `packs/vibermode/roles/product/task-planner.md` exactly. Treat every `ralph-converter` invocation as a `task-planner` invocation unless the user explicitly asks for legacy `prd.json` compatibility output.

## Handoff

- **Next Agent**: `implementation-runner`
- **Required Artifact**: `docs/[project-name]/tasks.json`
- **Legacy Name Accepted**: `ralph-runner`, but prefer `implementation-runner`
