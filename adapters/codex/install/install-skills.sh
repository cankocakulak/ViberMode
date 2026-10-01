#!/bin/bash
# Install or check a versioned ViberMode snapshot. Unrelated skills are preserved.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CODEX_SKILLS="${CODEX_HOME:-$HOME/.codex}/skills"
SUPPORT_BUNDLE="$CODEX_SKILLS/viber-mode"
MODE=install
if [ "${1:-}" = --check ]; then MODE=check; shift; fi
if [ "$#" -ne 0 ]; then echo 'Usage: install-skills.sh [--check]' >&2; exit 1; fi
node "$REPO_DIR/scripts/skill-install-state.mjs" "$MODE" --source-root "$REPO_DIR" --skills-root "$CODEX_SKILLS" --runtime codex
