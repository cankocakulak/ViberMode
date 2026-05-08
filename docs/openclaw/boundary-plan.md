# ViberMode / OpenClaw Boundary Plan

## Analysis

Current structure mixes three concerns:

1. canonical behavior definitions
2. platform-specific projections
3. runtime-instantiated agent workspaces

The `packs/` layout fixed the biggest ownership problem; the remaining task is to phase out compatibility paths and clarify what is authored once versus what is projected into runtime.

## Strategy

### 1. Approach

Unify canonical content in `ViberMode` around **packs**, not hidden-dot folders or runtime workspaces.

Platform-specific import/export definitions belong in adapters, not inside canonical pack roots.

### 2. Target Structure

Recommended target shape for `/Users/mcan/ViberMode`:

```text
packs/
  vibermode/
    roles/
      product/
      iterate/
    workflows/
    templates/
  simmer/
    paper-trading/
      workflows/
      templates/
      contracts/

adapters/
  codex/
    skills/
    install/
  cursor/
    commands/
    rules/
  openclaw/
    manifests/
    projections/
    publish/

docs/
  architecture/
  openclaw/
```

### 3. Naming Rules

Use these rules consistently:

- `packs/` = canonical authoring roots
- `adapters/` = platform-specific projections and generators
- `docs/` = public architecture, usage, and integration notes

Avoid:

- hiding the main source of truth under side folders
- mixing runtime notes with canonical definitions
- storing platform projections beside canonical definitions unless they are thin wrappers

### 4. Ownership Model

- `packs/vibermode/*`
  - owns generic workflow roles and templates
- `packs/simmer/paper-trading/*`
  - owns Simmer-specific contracts and templates
- `adapters/*`
  - owns how canonical pack content becomes tool-specific surfaces
- `my-openclaw/*`
  - owns actual OpenClaw runtime layout, providers, tools, and local state

### 5. Verification

Verify that:

- a new contributor can answer "where do I edit the canonical version?" in one step
- a new contributor can answer "where do I edit OpenClaw runtime behavior?" in one step
- Codex import, Cursor projection, and OpenClaw projection all clearly derive from canonical pack roots
