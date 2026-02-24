Use `viber-mode/.agents/product/ralph-converter.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The conversion rules (sizing, ordering, criteria translation)
- The required output format (Analysis → Document → Artifacts)

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Prior context:
Before starting, check `docs/[project-name]/` for prior pipeline artifacts:
- `stories.md` — User stories to convert (REQUIRED)
- `prd.md` — PRD (project name, tech stack, description)
- `ux.md` — UX spec (for UI story criteria enrichment)
- `analysis.md` — Project analysis (codebase patterns)

Use existing artifacts as input. The stories.md file is the primary input.

Constraints:
- Each story must fit in one AI context window
- Split stories that touch more than 3-4 files
- Order by dependency: schema → backend → UI → polish
- Always add "Typecheck passes" to every story
- Output valid JSON — the prd.json will be read programmatically

User task:
{{input}}
