# ViberMode / OpenClaw Boundary Plan

## Analysis

Current structure mixes three concerns:

1. canonical behavior definitions
2. platform-specific projections
3. runtime-instantiated agent workspaces

Evidence:
- Canonical generic workflow material now lives under `/Users/mcan/ViberMode/packs/vibermode/*`.
- Domain-specific Simmer material now lives under `/Users/mcan/ViberMode/packs/simmer/paper-trading/*`.
- OpenClaw runtime agent workspaces consume both:
  - `/Users/mcan/my-openclaw/agents/vibermode-orchestrator/workspace/*`
  - `/Users/mcan/my-openclaw/agents/simmer-supervisor/workspace/*`

The original issue was not that OpenClaw has a fixed layout. The issue was that `ViberMode` grouped generic agents under `.agents` while domain/agent packs like Simmer lived under `initiatives/`, even though both were consumed by OpenClaw as agent-facing assets. The new `packs/` layout resolves that mismatch; the remaining task is to phase out compatibility paths safely.

## Strategy

### 1. Approach

Unify canonical content in `ViberMode` by organizing it around **packs**, not around hidden-dot folders vs initiatives.

Recommendation:
- Move generic ViberMode orchestrator-related material into a first-class pack root.
- Keep Simmer as another first-class pack root at the same conceptual level.
- Move Codex/Cursor/OpenClaw-specific import/export definitions out of the canonical pack roots and into adapter/export roots.

Reasoning:
- OpenClaw consumes both "generic ViberMode" and "Simmer" as runtime agent inputs.
- They should therefore look like siblings in the source repo, not like one is framework internals and the other is a special initiative.
- Platform exports are derivative views, not canonical content, so they should not define the primary source tree shape.

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
    agents/
      vibermode-orchestrator/
        contract.md
        runtime-notes.md
  simmer/
    paper-trading/
      agents/
        simmer-supervisor/
      workflows/
      skills/
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
info/
```

### 3. Naming Rules

Use these rules consistently:

- `packs/` = canonical authoring roots
- `adapters/` = platform-specific projections and generators
- `agents/` inside a pack = agent-specific canonical behavior contracts
- `workflows/`, `templates/`, `contracts/` = reusable content owned by that pack
- `projections/` or `dist/` under `adapters/openclaw` = generated OpenClaw-facing material

Avoid:
- hiding the main source-of-truth under `.agents`
- mixing domain packs (`initiatives/`) with framework internals at different hierarchy levels
- storing platform projections beside canonical definitions unless they are thin wrappers

### 4. Ownership Model

Canonical ownership after refactor:

- `packs/vibermode/*`
  - owns generic workflow roles
  - owns generic templates
  - owns generic orchestrator contract

- `packs/simmer/paper-trading/*`
  - owns Simmer-specific agent contracts
  - owns Simmer-specific templates and workflow contracts

- `adapters/codex/*`
  - owns how canonical pack content becomes Codex-importable skills

- `adapters/cursor/*`
  - owns how canonical pack content becomes Cursor commands/rules

- `adapters/openclaw/*`
  - owns how canonical pack content becomes OpenClaw-compatible workspace/agent projections

- `/Users/mcan/my-openclaw/*`
  - owns actual OpenClaw runtime layout
  - owns provider/model/tool config
  - owns runtime identity files and local state
  - consumes published/projection content from `ViberMode`

### 5. Changes Required

- `/Users/mcan/ViberMode/packs/simmer/paper-trading/*`
  - migrate into `packs/simmer/paper-trading/`
- `/Users/mcan/ViberMode/adapters/codex/install/install-skills.sh`
  - move under `adapters/codex/install/` or rewrite to publish from canonical packs
- `/Users/mcan/my-openclaw/agents/vibermode-orchestrator/workspace/*`
  - keep as runtime target; stop treating as source of truth
- `/Users/mcan/my-openclaw/agents/simmer-supervisor/workspace/*`
  - keep as runtime target; consume from published Simmer pack outputs where possible

### 6. Migration Order

Do this in phases:

1. Introduce new canonical roots without deleting old ones.
2. Copy or move `ViberMode` content into `packs/vibermode` and `packs/simmer/paper-trading`.
3. Add adapter-level README/ownership docs that say what is canonical vs generated.
4. Update Codex/Cursor/OpenClaw exporters to read from `packs/*`.
5. Switch `my-openclaw` consumption to adapter outputs.
6. Remove legacy compatibility roots after parity is verified.

### 7. Implementation Hints

- Treat this as an ownership refactor first, not as a behavior refactor.
- Do not rewrite runtime OpenClaw layout to mirror source layout exactly; project into it.
- Keep agent IDs stable: `vibermode-orchestrator` and `simmer-supervisor` should remain runtime IDs unless there is a strong reason to change them.
- Preserve the rule that artifact paths resolve to the active target repo, not the OpenClaw workspace.
- Add one small manifest per pack if needed, for example:
  - pack name
  - exported agents
  - exported workflows
  - exported skills
  - supported adapters

### 8. Verification

Verify:
- A new contributor can answer “where do I edit the canonical version of vibermode-orchestrator?” in one step.
- A new contributor can answer “where do I edit Simmer-specific behavior?” in one step.
- Codex import, Cursor projection, and OpenClaw projection all clearly derive from canonical pack roots.
- `my-openclaw` no longer contains ambiguous source-owned copies.

Expected:
- `ViberMode` reads as an authoring repo with clear sibling pack roots.
- OpenClaw remains runtime-shaped, not source-shaped.
- Naming becomes explainable in one sentence.

Watch out:
- path churn across scripts and docs
- breaking existing Codex skill install flow
- accidentally moving runtime-only OpenClaw identity docs into canonical source space
