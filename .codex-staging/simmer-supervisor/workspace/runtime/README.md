# Simmer Runtime

Canonical runtime binding for `simmer-supervisor`.

## Binding Model

- Transport adapter: `bin/simmer-runtime.cjs`
- Non-secret binding config: `config/simmer-binding.json`
- Local secret/env override: `env/simmer.env`
- Global fallback env: `~/.openclaw/.env`

Resolution order:
1. process env
2. `runtime/env/simmer.env`
3. `~/.openclaw/.env`
4. macOS Keychain fallback for `SIMMER_API_KEY` (`service=simmer-supervisor`, `account=SIMMER_API_KEY`)

The adapter is shared by:
- `simmer-briefing`
- `simmer-dry-run`
- `simmer-executor`
- `simmer-journal`

There is no special main-agent-only Simmer privilege. Skills call the same adapter through OpenClaw native exec.

## Required Env

- `SIMMER_API_BASE_URL`
- `SIMMER_API_KEY`

Practical default:
- `SIMMER_API_BASE_URL=https://api.simmer.markets`

Recommended local setup:
- keep `SIMMER_API_BASE_URL` in `runtime/env/simmer.env`
- keep `SIMMER_API_KEY` in macOS Keychain instead of plaintext env when possible

Optional overrides:
- `SIMMER_AUTH_HEADER`
- `SIMMER_AUTH_SCHEME`
- `SIMMER_TIMEOUT_MS`
- `SIMMER_HEALTH_URL` or `SIMMER_HEALTH_PATH`
- `SIMMER_BRIEFING_URL` or `SIMMER_BRIEFING_PATH`
- `SIMMER_DRY_RUN_URL` or `SIMMER_DRY_RUN_PATH`
- `SIMMER_EXECUTE_URL` or `SIMMER_EXECUTE_PATH`

## Storage Convention

- journals: `runtime/journals/YYYY/MM/DD/{workflow_name}/`
- reviews: `runtime/reviews/YYYY/Www/`
- run events: `runtime/runs/{workflow_name}/{run_id}/events/`

Expected run event names:
- `initial_briefing`
- `risk_review`
- `candidate_selection`
- `dry_run_result`
- `execution_result`
