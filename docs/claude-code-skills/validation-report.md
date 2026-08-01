# Claude Code Skills Installer Validation

## Validation Scope

Validated the new Claude Code installer, package entry point, isolated install,
idempotent real install, support-bundle references, and repository metadata.
Final result: **PASS**.

## Commands Attempted

| Command | Task | Exit status | Result |
|---|---|---:|---|
| `bash -n adapters/claude/install/install-skills.sh` | T1 | 0 | PASS |
| `bash -n scripts/install-claude-skills.sh` | T2 | 0 | PASS |
| `CLAUDE_CONFIG_DIR=<temporary-directory> npm run install:claude` | T3 | 0 | PASS |
| `npm run install:claude` | T4 | 0 | PASS |
| `npm run validate` | T2-T3 | 0 | PASS |
| `git diff --check -- <Claude installer scope>` | T1-T2 | 0 | PASS |

## Environment

- Repository: `/Users/mcan/ViberMode`
- Platform: macOS, zsh/bash-compatible shell
- Default Claude config: `/Users/mcan/.claude`
- Isolated install: unique directory under `/tmp` via `CLAUDE_CONFIG_DIR`
- Date: 2026-07-22

## Scenario Results

1. **Fresh config install — PASS**
   - Installed all 68 source skill directories.
   - Installed the sibling `viber-mode/` support bundle.
   - Confirmed representative role and workflow references exist.

2. **Real personal config install — PASS**
   - Installed 68 skills under `/Users/mcan/.claude/skills/`.
   - Installed `/Users/mcan/.claude/skills/viber-mode/`.

3. **Idempotent update — PASS**
   - A second `npm run install:claude` completed successfully.
   - Skill count remained 68.
   - Installer emitted the existing-directory live-reload notice.

4. **Repository validation — PASS**
   - Reference validation passed for 80 capabilities.
   - Task phase validation passed for 8 task files.
   - The existing legacy `game-prototype-lab` tier warning remains non-blocking.

## Failures and Blockers

None. The first validation attempt exposed invalid task phase labels in the new
artifact; they were corrected to the repository's `core`/`ops` phase contract
before final validation.

## Summary (for downstream agents)

The Claude Code installer is runnable, repeatable, respects
`CLAUDE_CONFIG_DIR`, installs every portable skill plus its shared support
bundle, and is installed successfully in the real personal Claude config.
