#!/bin/bash
# Install ViberMode agents as Claude Code skills.
# Usage: ./adapters/claude/install/install-skills.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SKILLS_SOURCE="$REPO_DIR/adapters/codex/skills"

if [ -n "${CLAUDE_CONFIG_DIR:-}" ]; then
  CLAUDE_ROOT="$CLAUDE_CONFIG_DIR"
elif [ -n "${HOME:-}" ]; then
  CLAUDE_ROOT="$HOME/.claude"
else
  echo "Error: HOME is not set and CLAUDE_CONFIG_DIR was not provided."
  exit 1
fi

CLAUDE_SKILLS="$CLAUDE_ROOT/skills"
SUPPORT_BUNDLE="$CLAUDE_SKILLS/viber-mode"
SKILLS_ROOT_EXISTED=false

if [ -d "$CLAUDE_SKILLS" ]; then
  SKILLS_ROOT_EXISTED=true
fi

if [ ! -d "$SKILLS_SOURCE" ]; then
  echo "Error: Portable skills directory not found at $SKILLS_SOURCE"
  exit 1
fi

echo "Installing ViberMode skills to $CLAUDE_SKILLS..."

mkdir -p "$CLAUDE_SKILLS"

# Keep Claude's skill picker aligned with the curated source directory after
# older public entry points are retired.
for stale_skill in game-new-prototype game-signature-prototype game-night-loop; do
  if [ -d "$CLAUDE_SKILLS/$stale_skill" ] && [ ! -d "$SKILLS_SOURCE/$stale_skill" ]; then
    echo "  Removing stale: $stale_skill"
    rm -rf "$CLAUDE_SKILLS/$stale_skill"
  fi
done

echo "Installing shared ViberMode support bundle..."
rm -rf "$SUPPORT_BUNDLE"
mkdir -p "$SUPPORT_BUNDLE/packs" "$SUPPORT_BUNDLE/docs"
cp -R "$REPO_DIR/packs/vibermode" "$SUPPORT_BUNDLE/packs/"
cp -R "$REPO_DIR/docs/reference" "$SUPPORT_BUNDLE/docs/"
[ -d "$REPO_DIR/docs/operations" ] && cp -R "$REPO_DIR/docs/operations" "$SUPPORT_BUNDLE/docs/"
[ -d "$REPO_DIR/docs/architecture" ] && cp -R "$REPO_DIR/docs/architecture" "$SUPPORT_BUNDLE/docs/"
[ -d "$REPO_DIR/docs/use-cases" ] && cp -R "$REPO_DIR/docs/use-cases" "$SUPPORT_BUNDLE/docs/"
[ -d "$REPO_DIR/scripts" ] && cp -R "$REPO_DIR/scripts" "$SUPPORT_BUNDLE/"
[ -f "$REPO_DIR/package.json" ] && cp "$REPO_DIR/package.json" "$SUPPORT_BUNDLE/package.json"
cp "$REPO_DIR/README.md" "$SUPPORT_BUNDLE/README.md"
cp "$REPO_DIR/AGENTS.md" "$SUPPORT_BUNDLE/AGENTS.md"

for skill_dir in "$SKILLS_SOURCE"/*/; do
  skill_name="$(basename "$skill_dir")"
  target="$CLAUDE_SKILLS/$skill_name"

  if [ -d "$target" ]; then
    echo "  Updating: $skill_name"
    rm -rf "$target"
  else
    echo "  Installing: $skill_name"
  fi

  cp -R "$skill_dir" "$target"
done

echo ""
echo "Done! Installed skills:"
find "$SKILLS_SOURCE" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort | while read -r skill; do
  echo "  - $skill"
done
echo "  - viber-mode (shared support bundle)"
echo ""

if [ "$SKILLS_ROOT_EXISTED" = false ]; then
  echo "Claude Code note: the top-level skills directory was created for the first time."
  echo "Restart any Claude Code session that was already open before this install."
else
  echo "Claude Code watches an existing skills directory and should pick up this update live."
fi
