# Project Analysis: OpenClaw Simmer to Polymarket Paper Trading

## Overview

- **Type**: Local OpenClaw trading-operations workspace plus historical ViberMode Simmer paper-trading contract pack
- **Primary language(s)**: Markdown, YAML, JSON, Node.js runtime adapter; proposed Polymarket slice should be Python
- **Runtime owner**: `/Users/mcan/my-openclaw`
- **Framework boundary**: `/Users/mcan/ViberMode` records that Simmer and OpenClaw runtime assets were deliberately removed from ViberMode core
- **Focus area analyzed**: Simmer supervisor workflows, runtime adapter, cron jobs, research virtual-book model, and feasibility of a local Polymarket paper-trading replacement

The current Simmer setup is a real OpenClaw runtime workspace, not just notes. It has a policy-bound supervisor, scheduled research jobs, skill contracts, a shared Node.js adapter, journal schemas, and local virtual books. The cleanest Polymarket path is to reuse the operational shape, not the Simmer API binding: build a separate local paper-trading Python project or a new `polymarket-supervisor` workspace that reads public Polymarket data and mutates only a local `portfolio.json`.

## Tech Stack

| Layer | Current Simmer/OpenClaw | Polymarket Paper-Trading Fit |
|---|---|---|
| Orchestration | OpenClaw agent workspace under `/Users/mcan/my-openclaw/agents/simmer-supervisor` | Optional; Codex can run the Python loop directly, OpenClaw cron can be added later |
| Runtime adapter | Node.js script at `runtime/bin/simmer-runtime.cjs` | Replace with Python modules: market data client, portfolio store, risk engine, terminal UI |
| Strategy config | YAML at `config/strategy-profiles.yaml` | Keep this pattern; reduce max position cap from 10% to requested 2% |
| Tracking schema | YAML at `config/tracking-schema.yaml` | Keep stable attribution fields and add Polymarket fields: `condition_id`, `token_id`, `outcome`, `spread`, `fee_usdc` |
| Portfolio state | Simmer API live positions plus research `runtime/research/books/*.json` | Local `portfolio.json` is enough for V1 |
| Scheduling | `cron/jobs.json` sends agent turns to `simmer-supervisor` | Not needed for first CLI; useful later for heartbeat/risk-sweep/report jobs |
| Market data | Simmer API briefing/context/search endpoints | Public Polymarket Gamma API for market discovery; CLOB public read endpoints for orderbook, spread, prices |
| Execution | Simmer dry-run + execute endpoints | No real execution in V1; simulate fills locally |
| UI | OpenClaw run summaries and journals | Python terminal UI with refresh loop; `rich` is the likely fit |

Polymarket docs confirm that market data is available through public REST endpoints with no wallet required. Gamma covers discovery, while CLOB read endpoints cover orderbooks, prices, spreads, midpoint, and price history. Auth is only needed for actual order placement and order management.

## Project Structure

Current runtime files that matter:

```text
/Users/mcan/my-openclaw/
|-- cron/
|   |-- jobs.json
|   `-- runs/
|       |-- simmer-heartbeat-*.jsonl
|       |-- simmer-risk-sweep-*.jsonl
|       `-- simmer-weekly-review.jsonl
`-- agents/simmer-supervisor/workspace/
    |-- AGENTS.md
    |-- config/
    |   |-- strategy-profiles.yaml
    |   `-- tracking-schema.yaml
    |-- runtime/
    |   |-- bin/simmer-runtime.cjs
    |   |-- config/simmer-binding.json
    |   |-- env/simmer.env.example
    |   `-- research/
    |       |-- books/crypto_research_book.json
    |       `-- books/weather_research_book.json
    |-- skills/
    |   |-- simmer-briefing/
    |   |-- simmer-risk-manager/
    |   |-- simmer-market-context/
    |   |-- simmer-trade-planner/
    |   |-- simmer-dry-run/
    |   |-- simmer-executor/
    |   `-- simmer-journal/
    `-- workflows/
        |-- paper-trading-heartbeat/
        |-- paper-risk-sweep/
        |-- paper-strategy-review/
        |-- research-crypto-heartbeat/
        |-- research-weather-heartbeat/
        |-- research-virtual-risk-sweep/
        `-- research-strategy-review/
```

Historical ViberMode source files were removed on purpose:

```text
packs/simmer/paper-trading/
  README.md
  STRATEGY.md
  architecture.md
  config/
  contracts/
  templates/
```

The ViberMode boundary decision says Simmer paper-trading should stay out of ViberMode core and return only as a separate repo/domain pack if needed.

## Patterns & Conventions

- **Risk-first workflow**: Simmer heartbeat starts with a briefing, then risk review, then opportunity scanning. This should carry over directly.
- **Single selected candidate**: Current heartbeat shortlists up to three markets but executes at most one new entry. This is a good default for paper trading while validating data quality.
- **Dry-run before execution**: Existing Simmer has a dry-run gate before paper execution. In Polymarket V1, the local fill simulator should become the dry-run and executor combined, because no live order is sent.
- **Research virtual books**: The research path already uses local JSON books with `starting_balance`, `cash_balance`, `open_positions`, `closed_positions`, `realized_pnl`, `unrealized_pnl`, and `max_drawdown`. This is the closest ancestor of the requested `portfolio.json`.
- **Comparable profiles**: Current research runs baseline/balanced/aggressive profiles against one shared snapshot. For Polymarket, keep this later as backtest/shadow mode, but do not start there.
- **Attribution fields**: `run_id`, `workflow_name`, `strategy_profile_id`, and `policy_version` are consistently required. Keep these in every trade/journal record.
- **Storage convention**: Runtime writes are inspectable local files. Preserve that style with `data/portfolio.json`, `data/trades.jsonl`, `data/snapshots/*.json`, and optional `reports/`.
- **Fail closed**: Existing contracts stop when auth, market integrity, sizing, or risk context is ambiguous. Polymarket code should skip ambiguous markets instead of guessing.

## Current UI/UX State

There is no conventional product UI. The existing operator UX is a mix of OpenClaw cron summaries, JSONL logs, YAML journals, and config files.

For the requested Python version, the terminal UI should be deliberately operational:

- top line: cash, equity, realized PnL, unrealized PnL, open exposure, refresh age
- market table: question, outcome, best bid, best ask, spread, 24h volume, liquidity, pass/fail reason
- positions table: market, outcome, shares, average entry, mark price, notional, PnL, exposure %
- event log: recent simulated buys/sells/skips with reason

Use a plain terminal dashboard rather than an LLM-generated prose report for the live loop. `rich.Live`/`rich.Table` is the likely implementation choice.

## Technical Debt & Concerns

- **Simmer dependency is deep**: Skills and runtime adapter hard-code Simmer concepts: `$SIM`, `SIMMER_API_KEY`, `crypto_momentum_v1`, Simmer endpoints, and Simmer-specific market normalization.
- **Current live policy is too loose for the new request**: Simmer profiles allow 10% per position and 20-40% total exposure. The requested Polymarket rule is 2% max per market contract, so the config/risk engine must be tightened.
- **Logs show fragile agent execution**: Some cron summaries are normal live runs, but at least one later heartbeat produced a contract-style report instead of real runtime execution because the environment could not execute the adapter.
- **Liquidity handling should be deterministic**: Simmer logs often skipped candidates because `opportunity_score=0` or spread was too wide. Polymarket should not rely on opaque opportunity scores; it should compute spread and depth directly.
- **Endpoint drift is real**: Terminal headers showed the old Gamma `/markets` endpoint is deprecated/sunset and warns to use keyset pagination. Use `/markets/keyset` for fresh work.
- **Polymarket restrictions matter if this ever becomes live trading**: Official docs say some locations, including the United States, are blocked from placing orders. Paper trading with public data is different, but live order placement must check geoblock before any authenticated flow.
- **Fees are non-trivial**: Polymarket fees can be enabled per market; docs give the fee formula `shares * feeRate * p * (1-p)` and expose market-level fee metadata. A simple 1% haircut is fine for conservative V1, but the code should keep fee calculation configurable and record both modeled fee and slippage.
- **USDC denomination has changed language**: Polymarket docs refer to pUSD/USDC mechanics in current pages. The simulator can call the balance `USDC` for user clarity, but code should keep currency configurable.

## Opportunities

The requested V1 is very feasible directly from Codex, without Simmer:

1. Fetch active, liquid markets from Polymarket Gamma:
   - `GET https://gamma-api.polymarket.com/markets/keyset`
   - filters: `active=true`, `closed=false`, `limit=100`, `order=volume24hr,liquidityNum`, `ascending=false`
   - keep markets where `enableOrderBook=true`, `acceptingOrders=true`, `clobTokenIds` is present, `closed=false`
2. Fetch tradability per token/outcome:
   - use `bestBid`, `bestAsk`, `spread`, `volume24hr`, `liquidityNum` from Gamma when present
   - confirm critical candidates with CLOB `/book` or `/spread` using the selected token id
3. Apply deterministic filters:
   - spread <= 0.015
   - volume/liquidity thresholds configurable
   - skip restricted/closed/non-orderbook markets
   - skip missing token IDs or missing best bid/ask
4. Simulate fills locally:
   - buy fill price = `bestAsk * 1.01` plus modeled fee
   - sell fill price = `bestBid * 0.99` minus modeled fee
   - clamp prices to `[0.01, 0.99]`
   - shares = notional / effective_buy_price
5. Enforce risk:
   - starting balance = 10000
   - max notional per market = equity * 0.02
   - use existing exposure per `market_id + outcome` when deciding add size
   - default total exposure cap should also exist, even though the user only requested per-market cap; 10-20% is a safe V1 configurable default
6. Keep accounting local:
   - `portfolio.json`: cash, positions, realized/unrealized PnL, snapshots
   - `trades.jsonl`: immutable trade ledger
   - no wallet, no private key, no API key

Potential strategy styles for later:

- **Liquidity-only watcher**: no auto entries; ranks liquid markets and computes hypothetical paper fill economics.
- **Mean-reversion scout**: looks for markets with sharp one-day price moves but tight spread and deep book.
- **Event-catalyst profile**: uses market text/event metadata and optionally web/news context before entering.
- **Shadow profiles**: baseline/balanced/aggressive virtual books, copied from current Simmer research model.

For V1, avoid fully autonomous alpha claims. Build the market data, accounting, risk gates, and UI first.

## Suggested V1 Shape

```text
polymarket-paper/
|-- pyproject.toml
|-- README.md
|-- data/
|   |-- portfolio.json
|   `-- trades.jsonl
`-- polymarket_paper/
    |-- __main__.py
    |-- config.py
    |-- models.py
    |-- polymarket.py
    |-- portfolio.py
    |-- risk.py
    |-- simulator.py
    `-- ui.py
```

Core commands:

```bash
python -m polymarket_paper scan
python -m polymarket_paper run --refresh 30
python -m polymarket_paper buy --market-id ... --outcome yes --notional 100
python -m polymarket_paper sell --market-id ... --outcome yes --shares 50
```

V1 should start with scan/run and manual simulated buy/sell hooks. Auto-entry can be a later flag after the dashboard and ledger prove stable.

## Summary (for downstream agents)

```yaml
project_type: "local OpenClaw trading workspace analysis and Polymarket paper-trading design"
key_stacks:
  - "OpenClaw runtime workspace"
  - "Markdown/YAML/JSON contracts"
  - "Node.js Simmer runtime adapter"
  - "Python proposed for Polymarket paper trading"
  - "Polymarket Gamma API and CLOB public read endpoints"
reusable_patterns:
  - "risk-first heartbeat"
  - "single best candidate per cycle"
  - "dry-run/policy gate before any execution"
  - "stable attribution fields"
  - "local JSON virtual books"
  - "separate research/shadow books from live paper state"
known_constraints:
  - "do not reintroduce Simmer/OpenClaw runtime material into ViberMode core"
  - "requested per-market cap is 2%, not current Simmer 10%"
  - "V1 must not use wallet/private key/authenticated trading endpoints"
  - "spread threshold is hard gate at 1.5%"
  - "fee/slippage must be modeled on every fill"
  - "old Gamma offset pagination is deprecated; prefer keyset endpoint"
  - "live trading would require geoblock/compliance checks"
ui_or_system_areas_relevant_to_downstream_product_work:
  - "/Users/mcan/my-openclaw/agents/simmer-supervisor/workspace/config"
  - "/Users/mcan/my-openclaw/agents/simmer-supervisor/workspace/runtime/research/books"
  - "/Users/mcan/my-openclaw/agents/simmer-supervisor/workspace/workflows"
  - "/Users/mcan/my-openclaw/agents/simmer-supervisor/workspace/skills"
  - "/Users/mcan/ViberMode/docs/architecture/boundary-decisions.md"
recommended_next_agent: "planner"
recommended_next_step: "write an implementation plan for a standalone Python Polymarket paper-trading V1"
```

## Handoff Contract

- **Next Agent**: `planner` for implementation planning, then `implementation-runner` or direct Codex coding for the first Python slice.
- **Required Artifacts**: this analysis file, plus any future `docs/polymarket-paper/prd.md` or direct implementation task list if the user wants the ViberMode pipeline.
- **Critical Inputs That Must Remain Stable**:
  - starting simulated balance: `10000 USDC`
  - buy slippage: `+1%`
  - sell slippage: `-1%`
  - max per market contract exposure: `2% of current equity`
  - spread hard gate: `<= 1.5%`
  - no real wallet or authenticated order placement in V1
  - local portfolio source of truth: `portfolio.json`
  - terminal dashboard required
- **Suggested Next Prompt**: "Use the planner agent to turn this analysis into a scoped implementation plan for a standalone Python Polymarket paper-trading CLI, then implement V1."

## Artifacts

File: `docs/openclaw-simmer-polymarket/analysis.md`
