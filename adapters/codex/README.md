# Codex Adapter

This adapter projects canonical ViberMode pack content into Codex-facing skills.

Primary surfaces:
- `skills/` for Codex skill wrappers
- `install/` for install and publish helpers

Installation note:
- the Codex installer also provisions a shared `viber-mode/` support bundle under `~/.codex/skills/`
- skill wrappers resolve canonical role and workflow docs through that shared bundle using relative paths

Canonical behavior should still be edited in `packs/`, not here, unless the change is specific to the Codex projection layer.
