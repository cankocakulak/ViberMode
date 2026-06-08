# Use Cases

Use cases describe the real operating outcomes built from ViberMode primitives.

They are not new canonical sources of behavior. Canonical behavior still lives in:

- `packs/vibermode/roles/`
- `packs/vibermode/workflows/`
- `scripts/`

A use case explains how roles, workflows, scripts, docs, state boundaries, and Codex automations combine into something you can actually run.

## Index

| Use Case | Outcome | Automation |
|----------|---------|------------|
| `app-opportunity-research.md` | Research app opportunities and optionally upsert backlog-ready candidates | `viber-idea-research` |
| `ios-app-factory.md` | Select a ready idea, create an iOS repo, implement it, and upload internal TestFlight | `viber-ios-app-factory-manual-runner` |
| `generated-app-change-to-testflight.md` | Apply scoped changes to an existing generated app and upload TestFlight | `manual-plant-routine-change-to-testflight` |
| `mobile-internal-release.md` | Upload a completed generated mobile app to internal testers through the platform release adapter | none standalone |
| `product-to-code.md` | Turn a product idea or slice into reviewed code in a repo | none standalone; used by iOS factory |
| `existing-repo-change-to-release.md` | Apply requested changes to an existing repo with validation and optional release | callable via `viber-change-to-release`; Plant Routine has a dedicated runner |

Operational companion:

- `docs/operations/codex-operational-capabilities.md` explains how Codex can operate connected services such as RevenueCat, App Store Connect, Google Play, store listing metadata, and store-download reporting.

## Template

Each use-case file follows this shape:

```text
Outcome
When To Use
Chain
Repo Surfaces
Automation
State Boundaries
Success
Blockers
```

## Relationship To Other Docs

- `docs/architecture/service-map.md` gives the high-level service map.
- `docs/use-cases/` explains concrete operating paths.
- `docs/reference/` explains individual roles, workflows, and projections.
- `docs/operations/` contains runbooks, credentials, private-state setup, and TestFlight guidance.
