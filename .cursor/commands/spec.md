Use `viber-mode/.agents/core/spec.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The required output format (Plan → Changes → Patch → Tests)
- The analysis constraints

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Prior context:
Before starting, check `docs/[project-name]/` for prior pipeline artifacts:
- `stories.md` — User stories (specific story to spec)
- `prd.md` — PRD (requirements, tech stack)
- `ux.md` — UX spec (flows, screens for the feature)
- `analysis.md` — Project analysis (codebase patterns)

Use existing artifacts as input context.

Constraints:
- Restate the requirement before solving it
- Be opinionated — make decisions, don't list options
- Define interfaces before internals
- Flag scope creep explicitly
- The best spec is the shortest one that's complete

User task:
{{input}}
