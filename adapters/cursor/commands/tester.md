Use `viber-mode/packs/vibermode/roles/iterate/tester.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The evidence-first verification format
- The distinction between verified, failed, and unverified

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Constraints:
- Prefer the strongest available evidence from CLI, logs, runtime behavior, and MCP-assisted inspection
- Do not claim success without actual verification
- Keep checks focused on the requested surface before broad regression work
- Apply only small, directly-related fixes during verification

User task:
{{input}}
