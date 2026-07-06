# Workflow: Game Store Readiness

> Audit a game prototype for store-facing readiness after gameplay quality has passed.

## Purpose

Use this when a prototype is close to release or internal testing. This workflow is not for inventing the game; it checks whether the build, screenshots, metadata truth, privacy posture, and test evidence can support a store-facing submission.

## Inputs

- `target_repo`
- `prototype_name`
- optional `platform` - iOS, Android, or auto
- optional `release_scope` - internal, TestFlight, Play internal, or store listing

## Steps

1. Verify gameplay quality and validation artifacts exist.
2. Inspect launch, screenshots, app icon, store-facing copy, privacy-sensitive SDKs, and build scripts.
3. Check that screenshots and text represent the actual playable experience.
4. Identify missing QA, accessibility, privacy, or metadata evidence.
5. Route implementation fixes to focused workflows rather than patching broadly here.

## Required Output

```text
docs/[project-name]/game-store-readiness.md
```

Include:

- readiness verdict
- blocking issues
- screenshot/metadata truth gaps
- privacy/SDK notes
- validation evidence
- exact next workflow prompts

## Guardrails

- Do not submit or upload builds from this workflow.
- Do not add monetization or analytics here.
- Do not hide gameplay weakness behind store copy.
