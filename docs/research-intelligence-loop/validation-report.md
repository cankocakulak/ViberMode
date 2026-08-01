# Validation Report

## Commands

```bash
node --check scripts/idea-backlog.mjs
node --check scripts/research-app-store-gap.mjs
node --check scripts/research-daily-brief.mjs
npm run validate
npm run research:daily-brief -- --research-dir /tmp/.../research-runs/2026-07-10/education-us
node scripts/idea-backlog.mjs validate --state-root /tmp/...
```

## Results

- Script syntax checks passed.
- Reference map validation passed for 76 capabilities.
- Task phase validation passed for 6 files.
- Temp daily brief smoke test wrote `daily-brief.md` and `cofounder-slack-report.md`.
- Temp `strategic-research-v4` backlog validation passed with 1 ready idea.

## Residual Warnings

- `npm run validate` still reports the pre-existing archive warning for `docs/operations/archive/app-factory-stage4/tasks.json` missing `phasePlan`.
