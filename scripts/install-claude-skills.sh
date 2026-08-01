#!/bin/bash
# Compatibility wrapper. Canonical script lives in adapters/claude/install/install-skills.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

bash "$REPO_DIR/adapters/claude/install/install-skills.sh"
