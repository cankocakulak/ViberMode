# App Factory State Git Bootstrap

## Resolved Workspace

- Canonical state root: `/Users/mcan/Documents/Codex/vibermode-state/app-factory-state`
- Remote: `https://github.com/ViberBoyz/app-factory-state.git`
- Public workflow repo: `/Users/mcan/ViberMode`

## Repo State

- Mode: existing state workspace converted from a plain local folder into a real git clone.
- Base branch: `main`
- Working branch: `main`
- Previous plain folder backup: `/Users/mcan/Documents/Codex/vibermode-state/app-factory-state.backup-20260528-131921`
- Current state root is clean and tracks `origin/main`.
- Recent state commits:
  - `18451e6` Preserve local app factory state files
  - `c191913` Sync idea research state for 2026-05-28
  - `3058f94` Record TestFlight source commit run-20260527120805-7bc409

## Identity Setup

- No app identity changes were applied.
- The state repository identity is `ViberBoyz/app-factory-state`.

## Stack Plan

- This workspace is a private state repository, not a runnable app.
- Validation baseline is state/schema oriented:
  - Prepare command: `git pull --ff-only origin main`
  - Validation command: `node /Users/mcan/ViberMode/scripts/idea-backlog.mjs validate --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state`
  - Sync command: local `git add`, `git commit`, and token-authenticated `git push origin main`

## Repo Scripts Detected

- `/Users/mcan/ViberMode/scripts/idea-backlog.mjs`
- `/Users/mcan/ViberMode/scripts/ios-app-factory-prepare.mjs`
- `/Users/mcan/ViberMode/scripts/ios-submit-testflight.mjs`

## Commands Run

```sh
git clone https://github.com/ViberBoyz/app-factory-state.git /Users/mcan/Documents/Codex/vibermode-state/app-factory-state.clone-20260528-131829
node /Users/mcan/ViberMode/scripts/idea-backlog.mjs validate --state-root /Users/mcan/Documents/Codex/vibermode-state/app-factory-state.clone-20260528-131829
diff -qr /Users/mcan/Documents/Codex/vibermode-state/app-factory-state /Users/mcan/Documents/Codex/vibermode-state/app-factory-state.clone-20260528-131829 -x .git
rsync -a /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/research-runs/2026-05-27/education-us-stage1-smoke /Users/mcan/Documents/Codex/vibermode-state/app-factory-state.clone-20260528-131829/research-runs/2026-05-27/
cp /Users/mcan/Documents/Codex/vibermode-state/app-factory-state/sources/app-store/revenue-pop-growth/2026-05-11_2026-05-20_US_Education.csv /Users/mcan/Documents/Codex/vibermode-state/app-factory-state.clone-20260528-131829/sources/app-store/revenue-pop-growth/2026-05-11_2026-05-20_US_Education.csv
git add research-runs/2026-05-27/education-us-stage1-smoke sources/app-store/revenue-pop-growth/2026-05-11_2026-05-20_US_Education.csv
git commit -m "Preserve local app factory state files"
git push origin main
mv /Users/mcan/Documents/Codex/vibermode-state/app-factory-state /Users/mcan/Documents/Codex/vibermode-state/app-factory-state.backup-20260528-131921
mv /Users/mcan/Documents/Codex/vibermode-state/app-factory-state.clone-20260528-131829 /Users/mcan/Documents/Codex/vibermode-state/app-factory-state
git -C /Users/mcan/Documents/Codex/vibermode-state/app-factory-state pull --ff-only origin main
```

## Validation Evidence

```json
{
  "status": "valid",
  "backlog_path": "/Users/mcan/Documents/Codex/vibermode-state/app-factory-state/ideas/backlog.json",
  "idea_count": 8,
  "ready_count": 6
}
```

`git -C /Users/mcan/Documents/Codex/vibermode-state/app-factory-state status --short --branch` returned:

```text
## main...origin/main
```

`diff -qr` between the backup and the new clone, excluding `.git`, returned no differences after the preservation commit.

## Blockers

- None for the state clone baseline.
- Automations still depend on the local Mac being awake and Keychain access to `viberboyz-gh-token`.

## Summary (for downstream agents)

The app factory private state root is now a real local clone of `ViberBoyz/app-factory-state`. Future research, factory, and TestFlight state updates should use local git commits and pushes instead of direct GitHub Contents API sync when possible.

## Handoff Contract

- Use `/Users/mcan/Documents/Codex/vibermode-state/app-factory-state` as the only private state root.
- Do not create staged copies for normal automation runs.
- Pull `origin/main` before state changes.
- Validate the backlog after idea updates.
- Commit and push state changes through the local clone.
