# Simmer Paper Trading Initiative

This module is the source-of-truth for a Simmer paper-trading system that will be exported to OpenClaw later.

It is not the runtime itself. This repo should define:

- architecture
- agent contract
- skill contracts
- workflow contracts
- strategy and tracking config
- artifact templates

Live journals, reviews, and run logs should stay in the OpenClaw runtime, not in this repo.

## Module Layout

```text
packs/simmer/paper-trading/
  README.md
  architecture.md
  config/
    strategy-profiles.yaml
    tracking-schema.yaml
  contracts/
    agent.md
    skills/
      *.md
    workflows/
      *.md
  templates/
    journal-entry.yaml
    review-report.yaml
```

## What Lives Here

- human-maintained architecture docs
- portable OpenClaw-ready contracts
- versioned strategy-profile definitions
- attribution/tracking schema
- example output templates for runtime artifacts

## What Does Not Live Here

- live trade journals
- live weekly reviews
- run-by-run operational logs
- raw dry-run and execution outputs

Those belong in the OpenClaw runtime.

## Design Rules

- workflow = process
- strategy profile = behavior
- policy version = parameter set for one behavior
- tracking schema = attribution contract
- templates = shape of runtime outputs

## Source Of Truth

For this initiative, the source-of-truth files are:

- `packs/simmer/paper-trading/architecture.md`
- `packs/simmer/paper-trading/config/strategy-profiles.yaml`
- `packs/simmer/paper-trading/config/tracking-schema.yaml`
- `packs/simmer/paper-trading/contracts/agent.md`
- `packs/simmer/paper-trading/contracts/skills/*.md`
- `packs/simmer/paper-trading/contracts/workflows/*.md`
- `packs/simmer/paper-trading/templates/*.yaml`

If the initiative changes shape, regenerate any OpenClaw-specific runtime files from these contracts rather than from chat history.
