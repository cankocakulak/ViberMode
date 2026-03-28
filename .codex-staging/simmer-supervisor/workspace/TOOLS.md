# TOOLS.md - Local Notes

Runtime binding for Simmer now uses one shared adapter script:
- `runtime/bin/simmer-runtime.cjs`

Keep non-secret runtime-specific notes here:
- Simmer account aliases
- venue/environment notes
- expected env source order:
  - process env
  - `runtime/env/simmer.env`
  - `~/.openclaw/.env`
- runtime storage conventions:
  - `runtime/journals/YYYY/MM/DD/{workflow_name}/`
  - `runtime/reviews/YYYY/Www/`
  - `runtime/runs/{workflow_name}/{run_id}/events/`
- non-secret operational reminders
