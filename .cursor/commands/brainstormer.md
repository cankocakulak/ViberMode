Use `viber-mode/.agents/product/brainstormer.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The required output format (Analysis → Document → Artifacts)
- The ideation constraints

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Project folder:
Artifacts MUST be saved under `docs/[project-name]/`. Derive the project name from context or ask the user.

Prior context:
Before starting, check `docs/[project-name]/` for prior pipeline artifacts:
- `analysis.md` — Project analysis (if exists, use as context)

Constraints:
- Generate 5-8 ideas minimum
- Always end with a clear recommendation
- No fantasy ideas — everything must be buildable
- Include tech direction when relevant
- Speed over polish
- MUST produce artifact: `docs/[project-name]/brainstorm.md`

User task:
{{input}}
