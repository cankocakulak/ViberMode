Use `viber-mode/packs/vibermode/roles/product/implementation-runner.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The implementation loop exactly
- One task per iteration; continue the authorized loop in the same session

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Prior context:
1. Read `tasks.json` for the task list
2. Read `run-state.json` for prior execution state
3. Read `docs/[project-name]/` for product context:
   - `prd.md`
   - `ux.md`
   - `stories.md`
   - `analysis.md`

Constraints:
- Implement one task per iteration
- Update `tasks.json` and `run-state.json`
- Respect task lineage and implementation boundaries
- Do not leave broken code behind

User task:
{{input}}
