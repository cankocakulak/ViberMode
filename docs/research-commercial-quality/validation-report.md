# Validation report · 21 September 2026

## Validation Scope
RCQ-1 through RCQ-3: commercial evidence gate, legacy promotion/factory prevention, founder-facing research labels, existing automation prompts and Notion knowledge structure. This is a local Node research workflow, not an iOS application build.

## Commands Attempted
- `npm run test:idea-research` — final exit 0, 18 tests passed. Earlier new factory fixture failed due to missing required backlog fields; fixture corrected and the complete suite rerun successfully.
- `npm run validate` — exit 1 in reference validation: seven pre-existing untracked Apple/weekly reporting scripts have shebangs but lack executable permissions. None were modified by this change. Task-phase stage therefore did not run in this combined command.
- `npm run validate:task-phases` — separately exit 0, 10 task files checked; two legacy-file warnings.
- `git diff --check` — exit 0.
- `node scripts/idea-research-ledger.mjs evaluate --idea-id wash-window --state-root /Users/mcan/app-factory-state` — exit 0, schema 3, researching, commercial insufficient_evidence; 20 evidence records preserved, old evaluation history preserved.
- `npm run research:daily-brief -- --research-dir /Users/mcan/app-factory-state/research-runs/2026-09-21/education-beginner-watercolor-wash-us --output /Users/mcan/app-factory-state/research-runs/2026-09-21/research-quality-upgrade/daily-brief-preview.md --slack-output /Users/mcan/app-factory-state/research-runs/2026-09-21/research-quality-upgrade/cofounder-preview.md` — exit 0. Own preview outputs subsequently moved to private `operations/research-quality/2026-09-21/` so they do not look like an incomplete new research pack.
- Local `renderResearchThread` invocation on the real Wash Window snapshot — successful; no ambiguous confidence percentage, all six dimensions visible, existing Slack root unchanged. This renders only; no message sent.
- Saved automation TOMLs read back after purpose-built automation tool updates — both ACTIVE; original cadence, target task and channel preserved; quality contract present.
- Notion fetch after structural updates — three product cards, new idea commercial section, prior country/creative sections preserved with nested toggles.

## Environment
Node v20.12.2, macOS, `/Users/mcan/ViberMode` main. Existing unrelated work was present and preserved. Canonical private state is `/Users/mcan/app-factory-state`.

## Scenario Results
PASS: coverage-rich prices/community fixture cannot validate commercial opportunity; scoped numeric signals can pass only preliminary research; expired/future/adjacent/neutral/malformed/proxy observations fail the commercial gate; zero and contradictory measurements remain visible; legacy evaluations cannot promote or pass factory dry run; same evaluation yields no material Slack delta; commercial-only changes yield a delta; stable roots are unchanged; real historic evidence is not relabeled as fresh evidence.

## Failures and Blockers
Full repository validation is not green due to the pre-existing executable-bit issues named above. No unrelated permissions were changed. No new native competitor teardown, live market dataset, real paid demand test or scheduled Slack publication was performed in this setup turn. Source classification still requires researcher judgment; the structural gate cannot prove source truth or market profitability.

## Summary (for downstream agents)
Changed research slice: PASS. Whole-repository validation: FAIL on unrelated existing files. Both scheduled streams use the updated local framework and contracts. First scheduled publication remains to be observed. Next product focus: EasySpell school-list first value and own funnel coverage; next Wash Window check: cheap direct-market/alternative evidence before expensive content production.
