# OpenClaw Adapter

This adapter root is intentionally thin.

Canonical content still lives in `packs/`. OpenClaw-specific agent workspaces, runtime policy, and local execution setup should be authored in the OpenClaw repo itself.

The goal is:
- keep canonical workflow and domain definitions in `packs/`
- provide minimal integration guidance for how OpenClaw should consume them
- avoid duplicating full OpenClaw workspaces inside ViberMode

`my-openclaw` remains the actual runtime repo and the right place to author:
- agent workspaces
- runtime bindings
- workflow `.prose` files
- local execution policy

Use this adapter only for notes about the integration boundary, not as a second OpenClaw workspace tree.

See also:
- `docs/openclaw-workflows/workflow-map.md` for the current OpenClaw workflow mapping and target bootstrap integration shape
