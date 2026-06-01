# Ralph Runner Agent

> Legacy compatibility alias for `implementation-runner`.

## Compatibility Contract

This file exists only so older prompts, Codex skills, Cursor commands, or external tools that still name `ralph-runner` keep working.

Canonical role:
- `packs/vibermode/roles/product/implementation-runner.md`

Canonical artifacts:
- `docs/[project-name]/tasks.json`
- `docs/[project-name]/run-state.json`

Legacy compatibility:
- Older workflows may still mention `prd.json` or `progress.txt`.
- New work must prefer `tasks.json` and `run-state.json`.
- Legacy inputs may be read only when they already exist or the user explicitly asks for that compatibility path.

## Operating Rule

Read and follow `packs/vibermode/roles/product/implementation-runner.md` exactly. Treat every `ralph-runner` invocation as an `implementation-runner` invocation unless the user explicitly asks for legacy `prd.json` or `progress.txt` behavior.

## Handoff

- **Primary Status Line**: use the canonical `implementation-runner` status and handoff language.
- **Required Artifact**: `docs/[project-name]/tasks.json`
- **State Artifact**: `docs/[project-name]/run-state.json`
