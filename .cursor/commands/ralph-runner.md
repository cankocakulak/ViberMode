Use `viber-mode/.agents/core/ralph-runner.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The 9-step task sequence exactly
- One story per session — no scope creep

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Prior context:
1. Read `prd.json` for the task list
2. Read `progress.txt` for learnings from previous iterations
3. Read `docs/[project-name]/` for rich product context:
   - `prd.md` — Requirements, tech stack
   - `ux.md` — Visual direction, flows, component specs
   - `stories.md` — Full acceptance criteria details
   - `analysis.md` — Codebase patterns

Use ALL available artifacts. They make your implementation better.

Constraints:
- Implement ONE story only (highest priority where passes is false)
- Run quality checks before committing
- Do not commit broken code
- Update prd.json and progress.txt after implementation
- Match existing codebase patterns

User task:
{{input}}
