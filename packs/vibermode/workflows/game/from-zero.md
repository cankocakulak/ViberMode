# Workflow: Game From Zero

> Bootstrap a new game lab, then create one signature-quality first prototype.

## Purpose

Use this future-facing upper workflow when the user wants a new game repo/app from scratch. It composes bootstrap and existing prototype workflows instead of duplicating them.

This is not the first-phase default; first-phase work stays inside existing prototype-lab repos.

## Inputs

- `target_repo`
- optional `app_name`
- optional `platform`
- optional `game_brief`
- optional `signature_intensity` - default `standard`

## Composed Workflows

1. `game-lab-bootstrap`
2. `game-signature-prototype`
3. `game-quality-scorecard`
4. `game-review-rank`

## Required Output

- bootstrapped game-lab repo
- first signature prototype
- quality scorecard
- validation and screenshot evidence when practical
- next focused workflow prompt

## Guardrails

- Do not use this when the target is an existing prototype lab; use `game-signature-prototype`, `game-grow-best`, or `game-night-loop`.
- Stop if repo creation or platform choice is ambiguous.
- Keep bootstrap, prototype creation, and scoring as distinct stages.
