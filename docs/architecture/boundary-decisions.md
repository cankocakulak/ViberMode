# Boundary Decisions

This document records deliberate repository-boundary decisions so removed surfaces do not look accidental.

## Core Boundary

ViberMode is the core framework for portable agent and workflow contracts.

It owns:

- canonical roles under `packs/vibermode/roles/`
- canonical workflows under `packs/vibermode/workflows/`
- Codex and Cursor projections under `adapters/`
- reusable scripts under `scripts/`
- service, reference, and operations docs under `docs/`

It does not own unrelated domain packs or external orchestration runtime workspaces.

## Removed: `packs/simmer/paper-trading`

Decision:
Remove the Simmer paper-trading pack from ViberMode core.

Reason:
It is domain-specific and makes the repo read like both a framework and a trading-system workspace. That weakens the first-read story for ViberMode.

Future path:
If Simmer becomes useful again, extract it into a separate repo or restore it from git history into its own domain pack repository. Do not reintroduce it under ViberMode core unless the repo intentionally becomes a multi-pack distribution.

## Removed: OpenClaw Projection Docs

Decision:
Remove OpenClaw-specific adapter/docs from this repo.

Reason:
OpenClaw runtime behavior, workspaces, OpenProse files, provider setup, and orchestration state are external to ViberMode. Keeping partial OpenClaw projection notes here made the boundary harder to understand.

Future path:
If OpenClaw integration returns, keep executable runtime material in the OpenClaw-side repo and add only a short integration note here that points to that owner.

## Removed: `ios-app-store-factory`

Decision:
Remove the old monolithic `ios-app-store-factory` workflow.

Reason:
Its responsibilities are now split into clearer workflows:

```text
app-opportunity-research
  -> idea-research-backlog
  -> daily-ios-app-pipeline
  -> product-to-code
  -> ios-submit-testflight
```

The old file mixed repo generation, app identity, assets, signing, App Store Connect, TestFlight, and metadata in one workflow. The current structure gives each stage a clearer owner.

Current replacements:

- repo creation and run manifest: `packs/vibermode/workflows/daily-ios-app-pipeline.md`
- generated app implementation: `packs/vibermode/workflows/product-to-code.md`
- user-facing quality gate: `packs/vibermode/workflows/experience-hardening.md`
- internal TestFlight upload: `packs/vibermode/workflows/ios-submit-testflight.md`
- operational overview: `docs/operations/app-factory-automation-overview.md`

## Historical Run Artifacts

Historical run and validation artifacts may live under `docs/operations/archive/` while they are still useful for understanding past implementation work.

They should not become primary documentation. If they start adding noise, move them to the private state repo or remove them from the public repo after preserving any still-useful operational lessons.
