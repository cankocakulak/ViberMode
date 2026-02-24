Use `viber-mode/.agents/product/ux-designer.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The required output format (Analysis → Document → Artifacts)
- The UX specification structure

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Project folder:
Artifacts MUST be saved under `docs/[project-name]/`. Derive the project name from context or ask the user.

Prior context:
Before starting, check `docs/[project-name]/` for prior pipeline artifacts:
- `prd.md` — PRD (requirements, tech stack — primary input)
- `analysis.md` — Project analysis (existing UI patterns, design system)

Use existing artifacts as input context.

Constraints:
- Think in flows, not screens
- Include Visual Direction section (tone, reference apps, colors, typography)
- Specify don't suggest — provide actual copy, not descriptions
- Happy path first, then edge cases
- No Lorem ipsum — write real UI text
- MUST produce artifact: `docs/[project-name]/ux.md`

User task:
{{input}}
