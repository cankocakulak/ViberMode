Use `viber-mode/.agents/core/reviewer.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The required output format (Plan → Changes → Patch → Tests)
- The review checklist

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Constraints:
- Binary decisions — issue exists or it doesn't
- Always cite file and line number
- Every issue must include the fix
- End with verdict: APPROVED, CHANGES_REQUESTED, or BLOCKED
- Do not impose personal preferences beyond the spec

User task:
{{input}}
