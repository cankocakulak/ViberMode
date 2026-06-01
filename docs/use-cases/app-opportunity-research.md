# Use Case: App Opportunity Research

## Outcome

Produce a research pack for one market/category/theme and optionally add backlog-ready app candidates to the private app factory state repo.

## When To Use

Use this when you want new app ideas before creating any repository.

Do not use it to implement an app or upload TestFlight. This use case stops at research output and backlog candidate state.

## Chain

```text
market/category/theme
  -> app-researcher
  -> app-opportunity-research
  -> idea-research-backlog when candidates should enter the queue
  -> private state commit/push
```

## Repo Surfaces

Roles:

- `packs/vibermode/roles/product/app-researcher.md`

Workflows:

- `packs/vibermode/workflows/app-opportunity-research.md`
- `packs/vibermode/workflows/idea-research-backlog.md`

Scripts:

- `scripts/analyze-app-store-csv.mjs`
- `scripts/research-app-store-gap.mjs`
- `scripts/idea-backlog.mjs`

Docs:

- `docs/operations/app-factory-state.md`
- `docs/operations/app-factory-automation-overview.md`

## Automation

Codex automation:

```text
id: viber-idea-research
name: Manual - Viber Idea Research
status: PAUSED
kind: heartbeat
```

This is a manual runner. When resumed or fired, it should treat the invocation as an explicit request to run one research pass.

## State Boundaries

Reads:

- public ViberMode source
- optional App Store CSV/source data
- current private backlog state

Writes:

- private `research-runs/YYYY-MM-DD/[category-or-theme]/`
- private `ideas/backlog.json` only when candidates pass the readiness gate

Must not write:

- generated iOS app repos
- TestFlight/App Store Connect state
- secrets into docs, prompts, commits, remotes, or logs

## Success

- research pack is written in private state
- rejected and accepted candidates are explicit
- backlog validates after any upsert
- private state commit/push succeeds when mutation occurred

## Blockers

Stop before mutating backlog state when:

- private state root is missing, dirty in a conflicting way, or not writable
- `idea-backlog validate` fails
- source evidence is too thin for a backlog-ready candidate
- GitHub auth or push cannot be performed safely
