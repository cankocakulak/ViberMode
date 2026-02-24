Use `viber-mode/.agents/product/prd.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The required output format (Analysis → Document → Artifacts)
- The PRD structure

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Project folder:
Artifacts MUST be saved under `docs/[project-name]/`. Derive the project name from context or ask the user.

Prior context:
Before starting, check `docs/[project-name]/` for prior pipeline artifacts:
- `analysis.md` — Project analysis (existing project context)
- `brainstorm.md` — Brainstorm output (selected direction, ideas)

Use existing artifacts as input context.

Constraints:
- Scope ruthlessly — say NO more than YES
- Every requirement must be testable
- Use checkboxes for requirements
- Prioritize: P0 (won't ship without), P1 (should have), P2 (nice to have)
- Include Tech Stack section
- MUST produce artifact: `docs/[project-name]/prd.md`

User task:
{{input}}
