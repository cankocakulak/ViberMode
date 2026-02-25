#!/bin/bash
# Install ViberMode agents as Codex Skills
# Usage: ./scripts/install-codex-skills.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_SOURCE="$REPO_DIR/.agents/skills"
CODEX_SKILLS="${CODEX_HOME:-$HOME/.codex}/skills"

if [ ! -d "$SKILLS_SOURCE" ]; then
  echo "Error: Skills directory not found at $SKILLS_SOURCE"
  exit 1
fi

echo "Installing ViberMode skills to $CODEX_SKILLS..."

for skill_dir in "$SKILLS_SOURCE"/*/; do
  skill_name=$(basename "$skill_dir")
  target="$CODEX_SKILLS/$skill_name"

  if [ -d "$target" ]; then
    echo "  Updating: $skill_name"
    rm -rf "$target"
  else
    echo "  Installing: $skill_name"
  fi

  cp -r "$skill_dir" "$target"
done

echo ""
echo "Done! Installed skills:"
ls -1 "$SKILLS_SOURCE" | while read -r skill; do
  [ -d "$SKILLS_SOURCE/$skill" ] && echo "  - $skill"
done
echo ""
echo "Skills are now available in Codex App and Codex CLI."
