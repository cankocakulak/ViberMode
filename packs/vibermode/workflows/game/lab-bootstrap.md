# Workflow: Game Lab Bootstrap

> Prepare a new or empty repo to behave like a modular game prototype lab.

## Purpose

Use this for future greenfield game-lab work. It is intentionally separate from the first-phase existing-app workflows.

The output is not a polished game. The output is a repo structure that can safely run `game-signature-prototype` and later focused workflows.

## Inputs

- `target_repo`
- optional `platform` - iOS, Android, web, or auto
- optional `app_name`
- optional `prototype_lab_name`
- optional `bootstrap_depth` - minimal or standard

## Steps

1. Confirm the target repo exists or the user explicitly asked to create one.
2. Establish source-of-truth project files and validation commands.
3. Add a prototype hub or equivalent game selector.
4. Add a prototype registration contract.
5. Add a first empty/sample prototype slot.
6. Add focused test and smoke-test structure.
7. Add docs explaining how future prototypes are added.
8. Run bootstrap validation.

## Required Output

- app shell or prototype hub
- prototype folder convention
- registry convention
- validation scripts
- first smoke test
- `docs/[project-name]/game-lab-bootstrap.md`

## Guardrails

- Do not create, clone, or initialize a repo unless the user explicitly asked.
- Do not build a full game here.
- Do not pick a final visual identity for future games.
