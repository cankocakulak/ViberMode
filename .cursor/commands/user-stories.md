Use `viber-mode/.agents/product/user-stories.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The required output format (Analysis → Document → Artifacts)
- The story structure

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Project folder:
Artifacts MUST be saved under `docs/[project-name]/`. Derive the project name from context or ask the user.

Prior context:
Before starting, check `docs/[project-name]/` for prior pipeline artifacts:
- `prd.md` — PRD (requirements — primary input)
- `ux.md` — UX spec (flows, screens, interactions — reference for acceptance criteria)
- `analysis.md` — Project analysis (technical context)

Use existing artifacts as input context.
Stories MUST reference UX spec screens/flows when available.

Constraints:
- Each story must be independently shippable
- Acceptance criteria use Given/When/Then format
- When UX spec exists, include UX details in acceptance criteria (copy, interactions, edge states)
- If a story takes more than 2-3 days, split it
- Prioritize: P0 first, then P1, then P2
- MUST produce artifact: `docs/[project-name]/stories.md`

User task:
{{input}}
