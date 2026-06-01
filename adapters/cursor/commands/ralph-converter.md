Use `viber-mode/packs/vibermode/roles/product/ralph-converter.md` as the operating procedure.

This is a legacy alias for `task-planner`.

You MUST strictly follow:
- The alias file rules
- The canonical `task-planner` role
- The required output format: Analysis → Document → Handoff Contract → Artifact

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Prior context:
Before starting, check `docs/[project-name]/` for prior pipeline artifacts:
- `stories.md` — user stories to convert (required)
- `prd.md` — product requirements
- `ux.md` — UX specification
- `bootstrap.md` — repo root, branch, and validation baseline
- `analysis.md` — codebase patterns

Constraints:
- Prefer canonical `tasks.json`.
- Write legacy `prd.json` only when the user explicitly asks for legacy compatibility.
- Keep task sizing, dependency ordering, lineage, and validation objects aligned with `task-planner`.
- Leave the next-step handoff for `implementation-runner`; mention `ralph-runner` only as a legacy accepted name.

User task:
{{input}}
