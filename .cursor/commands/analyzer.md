Use `viber-mode/.agents/product/analyzer.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The required output format (Analysis → Document → Artifacts)
- The discovery checklist

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Project folder:
Artifacts MUST be saved under `docs/[project-name]/`. Derive the project name from context or ask the user.

Constraints:
- Base every claim on what you see in the code — don't guess
- Report what matters for new feature work, skip noise
- Flag technical debt that will bite during implementation
- Note reusable patterns and solid foundations
- MUST produce artifact: `docs/[project-name]/analysis.md`

User task:
{{input}}
