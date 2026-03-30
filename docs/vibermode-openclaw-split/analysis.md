# Project Analysis: vibermode-openclaw-split

## Overview
- **Type**: Dual-repo agent system
- **Primary language(s)**: Markdown, JSON, shell, small Node-based skill tooling
- **Repositories analyzed**:
  - `/Users/mcan/ViberMode`
  - `/Users/mcan/my-openclaw`
- **First impression**: The intended boundary is sound: `ViberMode` is positioned as the canonical authoring/framework repo, while `my-openclaw` is positioned as runtime/bootstrap/config. The main risk is not conceptual overlap, but drift: OpenClaw currently contains copied workflow/skill material that can diverge from the canonical definitions in `ViberMode`.

## Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Canonical framework | Markdown-based role definitions | `ViberMode/packs/vibermode/roles/*` is the clearest source of truth |
| Codex integration | Codex skills | `ViberMode/adapters/codex/skills/*` plus install script to `~/.codex/skills` |
| Runtime configuration | OpenClaw JSON | `my-openclaw/openclaw.example.json` defines providers, models, agents, tools |
| Agent identity/workspace | Markdown workspace files | `workspace/*.md` and `agents/*/workspace/*.md` define behavior and continuity |
| Workflow execution | `.prose` workflow files | `my-openclaw/agents/vibermode-orchestrator/workspace/workflows/*` |
| Skill execution | Skill-local scripts | Example: `skills/search-x/scripts/search.js` and orchestrator workspace skill bundles |
| Bootstrap/install | Shell scripts | `ViberMode/adapters/codex/install/install-skills.sh` |

## Project Structure
### `/Users/mcan/ViberMode`
```text
packs/
  vibermode/          - canonical generic roles, workflows, templates
  simmer/
    paper-trading/    - canonical Simmer pack
adapters/
  codex/              - Codex skill projection
  cursor/             - Cursor command/rule projection
  openclaw/           - OpenClaw projection + publish layer
```

### `/Users/mcan/my-openclaw`
```text
openclaw.example.json           - runtime config template
cron/                           - scheduled jobs
workspace/                      - main-session identity, memory, tools, guardrails
agents/
  vibermode-orchestrator/
    workspace/
      AGENTS.md                 - orchestration rules
      skills/                   - copied/specialized ViberMode skills
      workflows/                - executable workflow definitions
  simmer-supervisor/
    workspace/                  - narrow, policy-heavy initiative agent
skills/
  search-x/                     - runtime-installed external skill example
```

## Patterns & Conventions
- **Canonical vs runtime split**: `ViberMode` holds portable role/workflow definitions; `my-openclaw` holds executable runtime setup, local identities, providers, and delivery channels.
- **Artifact-first thinking**: Both repos consistently treat repo files as workflow state, especially for docs-driven pipelines and target-repo artifact resolution.
- **Thin framework, thick runtime policy**: `ViberMode` defines behavior contracts; `my-openclaw` adds execution policy such as delegation rules, run context, concurrency, and heartbeat behavior.
- **Markdown as interface**: Roles, identities, memories, and workflow rules are mostly plain text documents rather than compiled code.
- **Config-driven agents**: `my-openclaw/openclaw.example.json` centralizes model/provider/tool/agent wiring.
- **Initiative isolation**: `ViberMode/packs/simmer/paper-trading/*` suggests domain-specific contracts should live beside the framework authoring repo, while OpenClaw hosts the runtime agent that uses them.

## Current UI/UX State
- This is not a UI-first codebase. The user-facing surface is primarily agent behavior and workflow ergonomics.
- `ViberMode` has a clean mental model in its README: source-of-truth roles, reusable skills, and portable workflows.
- `my-openclaw` is operationally richer but cognitively denser. Important rules are split across `openclaw.example.json`, main workspace docs, agent workspace docs, and long-term memory.
- The orchestrator UX direction is coherent: classify request, choose workflow, resolve target repo, delegate specialist steps, keep artifacts in the target repo.

## Technical Debt & Concerns
- **Source-of-truth drift risk**: `my-openclaw/agents/vibermode-orchestrator/workspace/skills/*` contains skill copies or specialized variants of ViberMode concepts. Without a sync mechanism, these will drift from `ViberMode/packs/*` and `ViberMode/adapters/openclaw/*`.
- **Boundary is documented, not enforced**: The intended split exists in docs and memory, but there is no obvious automated export/sync pipeline from `ViberMode` into OpenClaw runtime assets.
- **Behavior stored in memory files**: Important architectural decisions are present in `my-openclaw/workspace/MEMORY.md`. Useful operationally, but brittle as system design documentation.
- **Destructive install script**: `ViberMode/adapters/codex/install/install-skills.sh` replaces target skill folders wholesale. Fine for local setup, but not enough for controlled promotion into OpenClaw runtime workspaces.
- **Mixed contract ownership**: Some workflow semantics live in `ViberMode`, while executable `.prose` workflows and agent guardrails live only in `my-openclaw`. This is probably intentional, but currently not formalized as an explicit contract layer.
- **No visible verification layer**: There is no obvious test or diff check that confirms OpenClaw’s orchestrator workspace still matches the current ViberMode role expectations.

## Opportunities
- **This split is directionally correct**: Keeping `ViberMode` as authoring/canonical and `my-openclaw` as runtime/executor is a strong architecture, especially if you want portability across tools.
- **Keep the OpenClaw adapter thin**: Prefer authoring OpenClaw-specific workspaces in `my-openclaw`, while `ViberMode` keeps the canonical pack contracts and reference material.
- **Separate three layers cleanly**:
  - `ViberMode`: canonical roles, templates, workflow contracts
  - `my-openclaw`: runtime policies, agent identities, provider/tool wiring
  - generated runtime bundle: materialized skill/workflow copies for execution
- **Promote architecture notes out of memory**: Decisions now in `my-openclaw/workspace/MEMORY.md` should become durable contract docs in `ViberMode`, then be referenced by runtime agents.
- **Add drift checks**: A simple comparison script could flag when OpenClaw’s orchestrator skill/workflow copies no longer match the expected source files in `ViberMode`.
- **Use initiative contracts consistently**: The `simmer-paper-trading` structure in `ViberMode` is a strong pattern for future domain packs consumed by OpenClaw agents.

## Summary (for downstream agents)
```yaml
project_type: dual-repo agent framework plus runtime executor
key_stacks:
  - markdown role and workflow definitions
  - openclaw runtime json config
  - codex skill wrappers
  - shell bootstrap scripts
  - prose workflow execution files
reusable_patterns:
  - source-of-truth roles in ViberMode
  - artifact-first workflow execution
  - target-repo-root artifact resolution
  - runtime agent identity in workspace markdown
  - initiative-specific contracts under ViberMode/packs/simmer
known_constraints:
  - runtime repo currently contains copied skill/workflow material
  - sync boundary between canonical and runtime layers is not automated
  - important design rules are partially stored in runtime memory docs
  - OpenClaw execution semantics depend on explicit absolute repo paths
ui_or_system_areas:
  - orchestrator request classification
  - workflow delegation and handoff
  - artifact path resolution
  - skill publishing/sync pipeline
  - runtime agent workspace composition
```

The architecture is already close to the right split. `ViberMode` should remain the canonical design surface, and `my-openclaw` should remain the operational shell. The immediate architectural gap is a missing promotion mechanism that turns ViberMode definitions into OpenClaw-consumable runtime assets without manual copying.

## Handoff Contract
- **Next agent**: `planner`
- **Goal for next step**: Define the exact contract and sync flow between `ViberMode` and `my-openclaw`.
- **Required artifacts**:
  - `docs/vibermode-openclaw-split/analysis.md`
  - proposed `docs/vibermode-openclaw-split/boundary-plan.md`
- **Critical inputs**:
  - `ViberMode/packs/vibermode/roles/*`
  - `ViberMode/adapters/codex/skills/*`
  - `my-openclaw/openclaw.example.json`
  - `my-openclaw/agents/vibermode-orchestrator/workspace/*`
- **Sections that must remain stable**:
  - canonical ownership: `ViberMode`
  - runtime ownership: `my-openclaw`
  - target-repo-root artifact resolution
  - orchestrator logic living in agent setup, not framework definitions
- **Suggested planning focus**:
  - what is authored once in `ViberMode`
  - what is generated into `my-openclaw`
  - what remains hand-written runtime policy
  - how drift is detected and corrected
