# Workflow: Game Template Kit

> Maintain reusable prototype, level, progress, result, and test templates for game-lab repos.

## Purpose

Use this when the lab repeatedly needs the same scaffolding. This workflow improves the reusable base without turning individual game workflows into boilerplate factories.

For the first phase, use this only to improve existing app conventions. Do not force every prototype into one visual style.

## Inputs

- `target_repo`
- optional `template_scope` - prototype, model, level, progress, result, tests, validation, or auto
- optional `source_prototype` - existing prototype to extract a pattern from

## Steps

1. Inspect at least two existing prototypes before extracting a template.
2. Identify the stable convention and the parts that must remain game-specific.
3. Create or update a small template, helper, reference, or generator.
4. Document when to use it and when not to use it.
5. Validate against one representative prototype or test fixture.

## Template Boundaries

Good template candidates:

- prototype adapter shape
- pure model/test structure
- progress/star/result shell contract
- level data schema examples
- screenshot/launch validation commands

Bad template candidates:

- unique visual identity
- level design content
- signature character/world
- mechanic-specific effects

## Required Output

- changed template/helper/reference files
- example usage or migration note
- validation evidence
- risk that future prototypes may become too samey

## Guardrails

- Do not centralize visual identity.
- Do not refactor existing games broadly unless the template cannot be validated otherwise.
- Do not create templates that make future games look identical.
