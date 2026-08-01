# Claude Code Skills Installer Plan

## Scope

Add a Claude Code installation path for the existing ViberMode Agent Skills
without duplicating canonical role or workflow content.

## Implementation Approach

1. Add `adapters/claude/install/install-skills.sh`.
   - Reuse the existing Agent Skills-compatible wrappers.
   - Install personal skills into `~/.claude/skills/`.
   - Respect the official `CLAUDE_CONFIG_DIR` override.
   - Provision the shared `viber-mode/` support bundle beside the skills.

2. Add `npm run install:claude` and a compatibility wrapper under `scripts/`.

3. Document first-install restart behavior and existing-directory live reload.

4. Extend repository validation to cover the Claude installer and executable bit.

## Acceptance Checks

- Both shell entry points pass `bash -n`.
- `npm run validate` passes.
- An isolated `CLAUDE_CONFIG_DIR` receives every skill plus the support bundle.
- Installed skill references resolve to files in the installed support bundle.
- The real Claude Code config receives the same installation successfully.
