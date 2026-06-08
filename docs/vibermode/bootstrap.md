# ViberMode Bootstrap

## Resolved Workspace

- Canonical workspace path: `/Users/mcan/ViberMode`
- Project name: `vibermode`
- Repo mode: `existing-repo`
- Platform: `backend/docs tooling`
- Stack: `node-api`

## Repo State

- Repository existed before this run.
- Selected bootstrap mode: `preflight`
- Base branch: `main`
- Working branch: `main`
- Git worktree had pre-existing user changes before this run; RevenueCat edits were scoped to new access tooling and docs.

## Identity Setup

- No app identity changes were requested.
- RevenueCat credential identity is externalized to env vars or macOS Keychain.
- Default Keychain service selected: `viberboyz-revenuecat-api-key`.

## Stack Plan

- Use the official RevenueCat REST API rather than an unofficial CLI dependency.
- Keep secrets outside the repo.
- Add a repo-owned Node wrapper for repeatable local access.
- Support API v2 project/configuration commands and API v1 subscriber reads.

## Repo Scripts Detected

- `npm run validate` is the source-of-truth repository validation command.
- `npm run validate:references` validates the reference map.
- `npm run revenuecat:status` checks RevenueCat network and credential readiness.
- `npm run revenuecat:projects` lists accessible RevenueCat projects when credentials are available.
- `npm run revenuecat -- help` lists supported RevenueCat wrapper commands.
- `npm run revenuecat -- save-keychain --profile [name] --api-key-stdin` stores one RevenueCat key per local project profile.
- `npm run revenuecat -- create-project --profile factory-admin --name [name] --allow-write true` creates a new top-level RevenueCat project when the credential has account-level project write access.

## Commands Run

```bash
command -v revenuecat || true
env | cut -d= -f1 | rg -i '^(REVENUECAT|RC_|REVCAT|PURCHASES)' || true
curl -sS -o /dev/null -w '%{http_code} %{remote_ip}\n' https://api.revenuecat.com/v1/subscribers/test || true
git branch --show-current
node scripts/revenuecat-api.mjs help
npm run revenuecat:status
npm run validate
chmod +x scripts/revenuecat-api.mjs
npm run validate
npm run revenuecat -- status --profile factory-admin
npm run revenuecat -- create-project --profile factory-admin --name "ViberMode API Probe" --allow-write true
npm run revenuecat -- projects --profile factory-admin
```

## Validation Evidence

- `command -v revenuecat` returned no installed official CLI command.
- RevenueCat-related env var scan returned no visible local credentials.
- Unauthenticated RevenueCat API probe returned `401`, proving API network egress reached RevenueCat.
- Current branch resolved to `main`.
- `node scripts/revenuecat-api.mjs help` printed supported wrapper commands.
- `npm run revenuecat:status` returned `blocked_missing_credentials` while confirming API connectivity.
- First `npm run validate` failed because the new shebang script was not executable; the executable bit was corrected before final validation.
- Final `npm run validate` passed: `Reference map validation passed for 41 capabilities.`
- `factory-admin` Keychain credential was present and `npm run revenuecat -- status --profile factory-admin` returned `ready` with `/v2/projects?limit=1` status `200`.
- `npm run revenuecat -- create-project --profile factory-admin --name "ViberMode API Probe" --allow-write true` returned `401 Invalid API key`; no new project appeared in the profile project list.

## Blockers

- RevenueCat read access is available through the `factory-admin` profile.
- Top-level project creation is blocked with project-scoped `sk_...` credentials; use RevenueCat OAuth (`atk_...`) with `project_configuration:projects:read_write`.

## Summary (for downstream agents)

RevenueCat access should use `scripts/revenuecat-api.mjs`. For factory automation that creates one RevenueCat project per generated app, store an account-level OAuth access token in profile `factory-admin` and call `create-project`. For post-create per-project operations, store keys in profile-specific Keychain services such as `viberboyz-revenuecat-api-key-mood-dots` and set profile-specific env vars like `REVENUECAT_MOOD_DOTS_PROJECT_ID`.

## Handoff Contract

- Repo root: `/Users/mcan/ViberMode`
- Branch: `main`
- Prepare command: none required beyond existing Node availability.
- Build command: none declared for this docs/tooling repo.
- Test command: `npm run validate`
- Run command: not applicable.
- Smoke command: `npm run revenuecat:status`
- Smoke scenario: confirm API network egress and credential readiness without printing secrets.
- Preserve: do not commit RevenueCat secret API keys, OAuth tokens, customer exports, or private subscriber data.
