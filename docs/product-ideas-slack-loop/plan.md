# Product Ideas Slack Loop Plan

## Objective

Turn app opportunity research into a persistent, evidence-led product research loop. Research must explain why an idea is selected, what is known versus unknown, how the conclusion changed over time, and whether the idea is ready for brainstorm or PRD work.

## Architecture

- Keep the private app-factory state repository as the source of truth.
- Store one stable research folder per idea with a candidate snapshot, append-only evidence and decision logs, and dated evaluations.
- Use a dedicated private `#product-ideas` Slack channel as the discussion surface.
- Keep one root Slack message per idea. Update that snapshot and preserve discussion in its thread.
- Re-evaluate existing ideas before discovering new ones in the daily automation.
- Require explicit owner promotion before brainstorm, PRD, or factory handoff.

## Scope

1. Add the idea research ledger and deterministic evaluation CLI.
2. Add Slack channel setup, snapshot sync, active-thread registration, and product research routing.
3. Update the app researcher, Slack operator, brainstorm, PRD, and product-to-code contracts.
4. Preserve research context in iOS factory run manifests.
5. Configure and enable the recurring research automation after live Slack setup succeeds.

## Validation

- Unit tests for ledger evaluation, append-only history, Slack rendering, and product-idea intent routing.
- Syntax checks for all changed scripts.
- Repository reference and task-phase validation.
- Skill validation and local skill installation.
- Live Slack probe/channel setup/snapshot post where credentials and scopes permit.
- Automation inspection after update.
