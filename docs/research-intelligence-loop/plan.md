# Research Intelligence Loop Plan

## Analysis

The app opportunity flow already separates public App Store scans, source ingestion, gap research, and backlog readiness. The weak point is explainability and cadence: a recurring run can still look like it is trying to produce an app idea from App Store evidence alone, and generated candidates do not have a first-class field explaining why the idea was selected over alternatives.

## Strategy

Add a small `strategic-research-v4` gate on top of the existing v3 launch-appeal gate. The new gate requires `selection_rationale`, which explains the chosen wedge, evidence summary, audience logic, competitor gap, rejected alternatives, tradeoffs, confidence, and follow-up questions.

## Changes Required

- `scripts/idea-backlog.mjs`: validate `selection_rationale` for `strategic-research-v4` and expose it in selection output.
- `scripts/research-app-store-gap.mjs`: generate `selection_rationale` for candidate drafts and mark new generated candidates as v4.
- `scripts/research-daily-brief.mjs`: summarize a research pack into `daily-brief.md` and `cofounder-slack-report.md` without sending Slack.
- Research workflow/docs: define the daily intelligence loop, non-App-Store evidence expectations, and opt-in Slack reporting boundary.

## Verification

Run syntax checks for changed scripts, validate references, generate a sample daily brief from a temp research pack, and validate a temp v4 backlog candidate.
