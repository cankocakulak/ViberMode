#!/bin/bash
# Install or check the portable ViberMode snapshot for Claude Code.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CLAUDE_ROOT="${CLAUDE_CONFIG_DIR:-${HOME:?HOME or CLAUDE_CONFIG_DIR is required}/.claude}"
CLAUDE_SKILLS="$CLAUDE_ROOT/skills"
SUPPORT_BUNDLE="$CLAUDE_SKILLS/viber-mode"
SKILLS_ROOT_EXISTED=false
if [ -d "$CLAUDE_SKILLS" ]; then SKILLS_ROOT_EXISTED=true; fi
MODE=install
if [ "${1:-}" = --check ]; then MODE=check; shift; fi
if [ "$#" -ne 0 ]; then echo 'Usage: install-skills.sh [--check]' >&2; exit 1; fi
node "$REPO_DIR/scripts/skill-install-state.mjs" "$MODE" --source-root "$REPO_DIR" --skills-root "$CLAUDE_SKILLS" --runtime claude
if [ "$MODE" = install ]; then
  if [ "$SKILLS_ROOT_EXISTED" = false ]; then
    echo 'Restart Claude Code sessions opened before the first skills-directory creation.'
  else
    echo 'Claude Code watches its existing skills directory for updates.'
  fi
fi
