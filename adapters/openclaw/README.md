# OpenClaw Adapter

This adapter root is reserved for OpenClaw-facing projections, manifests, and publish helpers.

The goal is:
- keep canonical workflow and domain definitions in `packs/`
- project them into OpenClaw-compatible runtime shapes from here
- avoid treating runtime workspaces as the source of truth

`my-openclaw` remains the actual runtime repo. This adapter is the source-side projection layer.
