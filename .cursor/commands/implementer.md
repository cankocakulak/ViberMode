Use `viber-mode/.agents/core/implementer.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The required output format (Plan → Changes → Patch → Tests)
- The implementation constraints

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Constraints:
- Minimal diff
- Respect existing patterns
- Do not refactor unrelated code
- Provide patch-style output
- Include all imports and dependencies
- Provide test and run commands

User task:
{{input}}
