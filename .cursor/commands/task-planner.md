Use `viber-mode/.agents/roles/product/task-planner.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The conversion rules
- The required output format (Analysis → Document → Handoff Contract → Artifacts)

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Prior context:
Before starting, check `docs/[project-name]/` for prior pipeline artifacts:
- `stories.md` — primary input
- `prd.md` — requirement context
- `ux.md` — flow and screen context
- `analysis.md` — codebase context

Constraints:
- Preserve story IDs and dependencies
- Preserve lineage when tasks are split
- Output valid JSON
- Produce `docs/[project-name]/tasks.json`

User task:
{{input}}
