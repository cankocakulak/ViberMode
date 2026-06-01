#!/bin/bash
# Compatibility wrapper. Canonical script lives in adapters/codex/install/install-skills.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

bash "$REPO_DIR/adapters/codex/install/install-skills.sh"
