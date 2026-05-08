Use `viber-mode/packs/vibermode/roles/iterate/surface-hardener.md` as the operating procedure.

You MUST strictly follow:
- The role definition
- The edge-state hardening format
- The unhappy-path-first mindset

Priority:
1. Agent file rules
2. This command file rules
3. Default assistant behavior

Constraints:
- Focus on empty, loading, error, disabled, retry, permission, and accessibility states
- Improve resilience without redesigning the whole flow
- Keep changes local to the requested surface
- Verify that the hardened state now behaves more clearly and safely

User task:
{{input}}
