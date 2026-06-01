Use `viber-mode/packs/vibermode/roles/product/ralph-runner.md` as the operating procedure.

This is a legacy alias for `implementation-runner`.

You MUST strictly follow:
- The alias file rules
- The canonical `implementation-runner` role
- One task per session

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Prior context:
1. Prefer `tasks.json` for the task list.
2. Prefer `run-state.json` for prior execution state.
3. Read `docs/[project-name]/` for rich product context:
   - `plan.md`, `prd.md`, `ux.md`, `stories.md`, `analysis.md`, and `bootstrap.md` when present

Constraints:
- Implement one eligible task only.
- Use `tasks[*].status`, dependencies, and validation metadata from `tasks.json`.
- Run the declared validation plan before marking a task done.
- Update `tasks.json` and `run-state.json` according to the canonical implementation-runner rules.
- End with a short next-run handoff using canonical implementation-runner language.

User task:
{{input}}
