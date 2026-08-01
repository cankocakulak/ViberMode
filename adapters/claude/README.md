# Claude Code Adapter

This adapter installs the Agent Skills-compatible ViberMode wrappers for Claude Code.

Primary surfaces:

- `install/` for the Claude Code installer
- `~/.claude/skills/` (or `$CLAUDE_CONFIG_DIR/skills/`) for installed personal skills

The installer currently reuses the portable `SKILL.md` wrappers under
`adapters/codex/skills/` and provisions the same shared `viber-mode/` support
bundle beside them. Canonical behavior should still be edited in `packs/`.

Install with:

```bash
npm run install:claude
```

Claude Code live-reloads changes when the top-level skills directory already
exists. If the installer creates that directory for the first time while a
session is open, restart that session once.
