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

- `scripts/research-public-app-scan.mjs`
- `scripts/ingest-market-source.mjs`
- `scripts/analyze-app-store-csv.mjs`
- `scripts/research-app-store-gap.mjs`
- `scripts/research-daily-brief.mjs`
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

This is a manual runner today. When resumed or fired, it should treat the invocation as an explicit request to run one research pass.

Recommended daily mode:

- run one bounded category/theme/follow-up question per day
- collect or ingest cross-source evidence rather than forcing a new idea
- write `daily-brief.md` and `cofounder-slack-report.md`
- send the Slack report only when a target co-founder channel/audience is explicitly configured and the report has been sanitized for secrets and raw paid-source data

## State Boundaries

Reads:

- public ViberMode source
- public Apple app search, chart, and review endpoints
- public web/community/problem sources when explicitly searched or provided
- optional App Store CSV/source data
- optional AppTweak/Sensor Tower/data.ai/keyword/manual source exports
- current private backlog state

Writes:

- private `research-runs/YYYY-MM-DD/[category-or-theme]/`
- private `ideas/backlog.json` only when candidates pass the readiness gate
- optional Slack-ready report body in `cofounder-slack-report.md`

Must not write:

- generated iOS app repos
- TestFlight/App Store Connect state
- secrets into docs, prompts, commits, remotes, or logs

## Success

- research pack is written in private state
- selected ideas explain why they were chosen, why alternatives were not, and what evidence still needs follow-up
- rejected and accepted candidates are explicit
- daily brief and Slack-ready co-founder report are written when the run is recurring or reportable
- backlog validates after any upsert
- private state commit/push succeeds when mutation occurred

## Blockers

Stop before mutating backlog state when:

- private state root is missing, dirty in a conflicting way, or not writable
- `idea-backlog validate` fails
- source evidence is too thin for a backlog-ready candidate
- selection rationale is too weak to explain the recommendation to a co-founder
- GitHub auth or push cannot be performed safely
