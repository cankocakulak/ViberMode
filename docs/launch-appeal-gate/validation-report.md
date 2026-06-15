# Validation Report

## Commands

```bash
node --check scripts/idea-backlog.mjs
node --check scripts/research-app-store-gap.mjs
node scripts/idea-backlog.mjs validate --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state
node scripts/idea-backlog.mjs select --state-root $VIBERMODE_WORKSPACE_ROOT/app-factory-state
npm run validate
```

## Results

- Script syntax checks passed.
- Private backlog validation passed with 12 ideas and 6 ready ideas.
- Backlog selection still returns `ielts-cue-card-sprint`.
- Selection output now exposes `launch_appeal` at top level for factory manifests.
- Reference map validation passed.
