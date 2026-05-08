# ViberMode Visual Map

This document gives a quick visual model of the repository using Mermaid.

Use it when you want to explain:

- what is canonical vs projected
- where workflows and skills live
- how `packs/`, `adapters/`, `docs/`, and `scripts/` relate

## Top-Level Repository Map

```mermaid
flowchart TB
    root["ViberMode"]

    root --> packs["packs/"]
    root --> adapters["adapters/"]
    root --> docs["docs/"]
    root --> scripts["scripts/"]
    root --> agents["AGENTS.md"]
    root --> readme["README.md"]
    root --> contributing["CONTRIBUTING.md"]
    root --> pkg["package.json"]

    subgraph packs_detail["Canonical Packs"]
        vibermode["packs/vibermode/"]
        simmer["packs/simmer/paper-trading/"]
    end
    packs --> vibermode
    packs --> simmer

    subgraph adapters_detail["Platform Projections"]
        codex["adapters/codex/"]
        cursor["adapters/cursor/"]
        openclaw["adapters/openclaw/"]
    end
    adapters --> codex
    adapters --> cursor
    adapters --> openclaw

    subgraph docs_detail["Public Docs"]
        arch["docs/architecture/"]
        openclaw_docs["docs/openclaw/"]
        ref["docs/reference/"]
    end
    docs --> arch
    docs --> openclaw_docs
    docs --> ref
```

## ViberMode Pack Map

```mermaid
flowchart TB
    vm["packs/vibermode/"]

    vm --> roles["roles/"]
    vm --> workflows["workflows/"]
    vm --> templates["templates/"]
    vm --> vm_readme["README.md"]

    subgraph roles_detail["roles/"]
        product["product/"]
        iterate["iterate/"]
    end
    roles --> product
    roles --> iterate

    subgraph product_roles["Product Roles"]
        analyzer["analyzer"]
        brainstormer["brainstormer"]
        prd["prd"]
        ux_designer["ux-designer"]
        user_stories["user-stories"]
        bootstrap["bootstrap"]
        task_planner["task-planner"]
        implementation_runner["implementation-runner"]
    end
    product --> analyzer
    product --> brainstormer
    product --> prd
    product --> ux_designer
    product --> user_stories
    product --> bootstrap
    product --> task_planner
    product --> implementation_runner

    subgraph iterate_roles["Iterate Roles"]
        scout["scout"]
        planner["planner"]
        ux_tweaker["ux-tweaker"]
        ux_investigator["ux-investigator"]
        modularizer["modularizer"]
        surface_hardener["surface-hardener"]
        integration_auditor["integration-auditor"]
        tester["tester"]
        reviewer["reviewer"]
        runtime_validator["runtime-validator"]
        spec_reviewer["spec-reviewer"]
        remediation_router["remediation-router"]
        change_task_planner["change-task-planner"]
    end
    iterate --> scout
    iterate --> planner
    iterate --> ux_tweaker
    iterate --> ux_investigator
    iterate --> modularizer
    iterate --> surface_hardener
    iterate --> integration_auditor
    iterate --> tester
    iterate --> reviewer
    iterate --> runtime_validator
    iterate --> spec_reviewer
    iterate --> remediation_router
    iterate --> change_task_planner

    subgraph workflow_detail["Workflows"]
        product_to_spec["product-to-spec"]
        spec_to_code["spec-to-code"]
        product_to_code["product-to-code"]
        repo_change["repo-change"]
        bootstrap_workflow["bootstrap"]
        remediation_routing["remediation-routing"]
    end
    workflows --> product_to_spec
    workflows --> spec_to_code
    workflows --> product_to_code
    workflows --> repo_change
    workflows --> bootstrap_workflow
    workflows --> remediation_routing

    subgraph template_detail["Templates"]
        prd_template["prd-template.md"]
        stories_template["stories-template.md"]
        ux_template["ux-spec-template.md"]
    end
    templates --> prd_template
    templates --> stories_template
    templates --> ux_template
```

## Projection Model

```mermaid
flowchart LR
    canonical["Canonical Role or Workflow\npacks/vibermode/..."]

    canonical --> codex["Codex Skill Wrapper\nadapters/codex/skills/.../SKILL.md"]
    canonical --> cursor["Cursor Command\nadapters/cursor/commands/*.md"]
    canonical --> agents["Agent Index\nAGENTS.md"]
    canonical --> reference["Reference Layer\ndocs/reference/*"]
    canonical --> openclaw["OpenClaw Notes\nadapters/openclaw + docs/openclaw"]

    reference --> capability["capability-map.md"]
    reference --> decision["decision-tree.md"]
    reference --> surface["agent-surface-map.yaml"]
```

## Product Pipeline View

```mermaid
flowchart LR
    analyzer["analyzer"] --> brainstormer["brainstormer"]
    brainstormer --> prd["prd"]
    prd --> ux["ux-designer"]
    ux --> stories["user-stories"]
    stories --> bootstrap["bootstrap"]
    bootstrap --> task_planner["task-planner"]
    task_planner --> implementation["implementation-runner"]
    implementation --> runtime["runtime-validator"]
    runtime --> reviewer["reviewer"]
    reviewer --> remediation["remediation-routing"]
```

## Iterate Toolkit View

```mermaid
flowchart LR
    subgraph understand["Understand"]
        scout["scout"]
        planner["planner"]
    end

    subgraph improve["Improve"]
        ux_investigator["ux-investigator"]
        ux_tweaker["ux-tweaker"]
        modularizer["modularizer"]
        surface_hardener["surface-hardener"]
    end

    subgraph verify["Verify"]
        integration_auditor["integration-auditor"]
        tester["tester"]
        reviewer["reviewer"]
        runtime_validator["runtime-validator"]
    end
```

## Practical Use

- Use the top-level map when introducing the repo to contributors.
- Use the pack map when explaining where to add or edit a capability.
- Use the projection model when explaining how one canonical contract appears in Codex, Cursor, and other tools.
- Use the pipeline and iterate views when discussing routing or orchestration.
