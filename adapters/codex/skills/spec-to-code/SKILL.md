---
name: "viber-spec-to-code"
description: "Use when specification artifacts already exist and the user wants the implementation pipeline from tasks through runtime validation and review."
---

# Spec to Code

Read and follow the full workflow instructions at `viber-mode/packs/vibermode/workflows/spec-to-code.md`.

Before starting:
1. Confirm `docs/[project-name]/stories.md` exists
2. Read `bootstrap.md` when it exists and treat it as the runtime handoff
3. Keep `tasks.json` as the source of truth for task definitions
4. Keep `run-state.json` as execution state only

Primary artifact set:
- `docs/[project-name]/tasks.json`
- `docs/[project-name]/run-state.json`
- `docs/[project-name]/validation-report.md`
- `docs/[project-name]/review.md`
- `docs/[project-name]/remediation.md` when needed
