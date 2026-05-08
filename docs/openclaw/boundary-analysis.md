# Project Analysis: ViberMode / OpenClaw Split

## Overview
- **Type**: Dual-repository agent system
- **Primary language(s)**: Markdown, JSON, shell, small Node-based skill tooling
- **Repositories analyzed**:
  - `/Users/mcan/ViberMode`
  - `/Users/mcan/my-openclaw`
- **First impression**: The intended boundary is sound: `ViberMode` is the canonical authoring/framework repository, while `my-openclaw` is runtime/bootstrap/config. The main risk is not conceptual overlap, but drift: OpenClaw currently contains copied workflow/skill material that can diverge from the canonical definitions in `ViberMode`.

## Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Canonical framework | Markdown-based role definitions | `ViberMode/packs/vibermode/roles/*` is the clearest source of truth |
| Codex integration | Codex skills | `ViberMode/adapters/codex/skills/*` plus install script to `~/.codex/skills` |
| Runtime configuration | OpenClaw JSON | `my-openclaw/openclaw.example.json` defines providers, models, agents, tools |
| Agent identity/workspace | Markdown workspace files | `workspace/*.md` and `agents/*/workspace/*.md` define behavior and continuity |
| Workflow execution | `.prose` workflow files | `my-openclaw/agents/vibermode-orchestrator/workspace/workflows/*` |
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
docs/
  architecture/       - framework notes
  openclaw/           - integration and boundary docs
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
      skills/                   - copied or specialized ViberMode skills
      workflows/                - executable workflow definitions
  simmer-supervisor/
    workspace/                  - narrow, policy-heavy initiative agent
skills/
  search-x/                     - runtime-installed external skill example
```

## Patterns & Conventions
- **Canonical vs runtime split**: `ViberMode` holds portable role/workflow definitions; `my-openclaw` holds executable runtime setup, local identities, providers, and delivery channels.
- **Artifact-first thinking**: Both repositories treat files as workflow state, especially for docs-driven pipelines and target-repo artifact resolution.
- **Thin framework, thick runtime policy**: `ViberMode` defines behavior contracts; `my-openclaw` adds execution policy such as delegation rules, run context, concurrency, and heartbeat behavior.
- **Markdown as interface**: Roles, identities, memories, and workflow rules are mostly plain-text documents rather than compiled code.

## Technical Debt & Concerns
- **Source-of-truth drift risk**: `my-openclaw/agents/vibermode-orchestrator/workspace/skills/*` contains copied or specialized ViberMode concepts. Without a sync mechanism, these will drift from `ViberMode/packs/*` and `ViberMode/adapters/openclaw/*`.
- **Boundary is documented, not enforced**: The intended split exists in docs and memory, but there is no obvious automated export/sync pipeline from `ViberMode` into OpenClaw runtime assets.
- **Behavior stored in memory files**: Important architectural decisions are present in runtime memory documents. Useful operationally, but brittle as system design documentation.
- **No visible verification layer**: There is no obvious test or diff check that confirms OpenClaw's orchestrator workspace still matches the current ViberMode role expectations.

## Opportunities
- Keeping `ViberMode` as authoring/canonical and `my-openclaw` as runtime/executor is a strong architecture, especially if portability across tools matters.
- OpenClaw-specific workspaces should continue to be authored in `my-openclaw`, while `ViberMode` keeps the canonical pack contracts and reference material.
- A promotion pipeline should eventually materialize ViberMode definitions into OpenClaw-consumable runtime assets without manual copying.

## Handoff Contract
- **Next Agent**: `planner`
- **Goal for next step**: Define the exact contract and sync flow between `ViberMode` and `my-openclaw`
- **Required Artifacts**:
  - `docs/openclaw/boundary-analysis.md`
  - `docs/openclaw/boundary-plan.md`
