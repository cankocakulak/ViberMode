# OpenClaw + Simmer Paper Trading Architecture

## Goal

Build an OpenClaw-based paper trading system that:

- uses Simmer's `$SIM` venue only
- runs on a predictable heartbeat
- keeps strategy, execution, and risk concerns separate
- avoids a single overpowered "do everything" agent
- can later graduate to real venues without redesign

This document defines:

1. the OpenClaw agent to create
2. the skills that agent should be allowed to use
3. the recurring workflows that should run around it
4. the strategy-profile model those workflows should execute

It does not define where live runtime artifacts should be stored. Those should live in the OpenClaw runtime, with this repo only providing templates and schemas.

## Analysis

The main failure mode here is not "bad code"; it is agent sprawl and prompt collapse. If one OpenClaw agent is asked to scan markets, reason deeply, place trades, manage exits, keep journals, and self-correct on every run, it will drift into inconsistent behavior and become hard to trust.

The right shape is a narrow supervisor agent with deterministic workflows and a small set of skills. The agent decides inside a bounded policy envelope; workflows control timing and sequence; skills do the concrete work with Simmer.

## Strategy

### 1. Recommended Topology

Use one primary OpenClaw agent:

- `simmer-supervisor`

Do not create separate autonomous agents for scouting, execution, and risk yet. Keep those as skills and workflow stages. One agent identity gives you:

- one memory surface
- one journal/history
- one Simmer agent/API key
- one strategy profile to tune

But keep responsibilities split below the agent layer.

### 2. Agent Definition

Recommended agent: `simmer-supervisor`

Purpose:
- operate a single paper-trading strategy on Simmer
- wake on a fixed cadence
- review portfolio state first, then scan opportunities, then consider trades
- never bypass dry-run or policy checks

Core operating rules:
- trade only on `venue="sim"`
- never place a trade without fresh market context
- always run `dry_run` before execution
- if confidence is below threshold, skip
- if open risk already exceeds configured exposure, skip
- manage a small number of concurrent positions
- write a short journal entry for every non-trivial decision

What the agent should *not* do:
- invent new strategies during execution
- resize risk limits on the fly without policy
- trade multiple independent market categories at first
- run continuous loops without a heartbeat boundary

### 3. Recommended Strategy

Use one real strategy, not a generic "trade what looks good" policy.

Recommended initial strategy:
- `event-momentum-with-context-filter`

Definition:
- focus on new or newly active event markets in one domain only
- prefer markets with clear catalyst windows and enough activity/liquidity
- use context and recent developments to decide whether current odds are mispriced
- hold short-to-medium duration positions only
- rely on stop-loss discipline rather than averaging down

Why this strategy:
- simpler than full discretionary macro trading
- more robust than blind copy-trading
- more explainable in logs than pure momentum
- works well with Simmer's `briefing`, `new_markets`, and `context` model

Recommended initial domain choice:
- crypto-adjacent event markets

Reasoning:
- they tend to have frequent catalysts
- context updates matter
- cadence fits heartbeat-based operation

Do not start with:
- multi-domain portfolios
- sports
- politics + crypto mixed in one agent
- full copy-trading as the main strategy

Copy-trading can be added later as a separate skill or alternate workflow, but it should not be the first architecture.

### 4. Skill Set

The agent should not have dozens of skills. Give it a narrow toolbox.

#### Required skills

`simmer-briefing`
- fetches `briefing`
- returns positions, risk alerts, opportunities, and performance
- used at the start and end of every heartbeat

`simmer-market-context`
- fetches market-level context for a candidate market
- used only after a market is shortlisted

`simmer-trade-planner`
- builds a structured trade proposal
- inputs:
  - market snapshot
  - context
  - current exposure
  - strategy rules
- outputs:
  - side
  - size
  - thesis
  - invalidation
  - confidence

`simmer-dry-run`
- executes Simmer dry run
- used before every real order

`simmer-executor`
- sends the actual paper trade
- only called if policy passes

`simmer-risk-manager`
- reviews open positions against hard rules
- can recommend:
  - hold
  - reduce
  - exit
  - no new trades

`simmer-journal`
- writes a concise local decision log
- should record:
  - timestamp
  - market
  - action
  - thesis
  - confidence
  - exposure after action

#### Optional later skills

`simmer-copytrade-watch`
- tracks a chosen wallet or strategy source
- should stay out of V1

`simmer-postmortem`
- periodically reviews closed trades and finds repeated mistakes

`simmer-skill-tuner`
- adjusts policy thresholds offline, never live during execution

### 5. Workflow Architecture

The recurring logic should live in workflows, not inside one massive prompt.

Create three workflows.

#### Workflow A: Heartbeat

Name:
- `paper-trading-heartbeat`

Cadence:
- every 4 hours to start

Sequence:
1. call `simmer-briefing`
2. handle `risk_alerts` first
3. ask `simmer-risk-manager` whether new trades are allowed this cycle
4. shortlist at most 3 candidate markets from `opportunities.new_markets`
5. for each candidate, fetch `simmer-market-context`
6. run `simmer-trade-planner`
7. keep only proposals above threshold
8. run `simmer-dry-run` on the top candidate
9. if policy passes, run `simmer-executor`
10. call `simmer-briefing` again
11. write `simmer-journal`

Hard limits:
- max 1 new trade per heartbeat
- max 3 open positions
- max fixed dollar size per position
- no averaging down

#### Workflow B: Risk Sweep

Name:
- `paper-risk-sweep`

Cadence:
- every 2 hours

Sequence:
1. call `simmer-briefing`
2. inspect open positions and risk alerts
3. run `simmer-risk-manager`
4. if a position violates exit policy, exit or reduce
5. journal the action

Purpose:
- keep exits separate from opportunity scanning
- reduce the chance that new-entry excitement blinds the agent to existing risk

#### Workflow C: Weekly Review

Name:
- `paper-strategy-review`

Cadence:
- weekly

Sequence:
1. load last week's journal
2. summarize wins, losses, skipped trades, and repeated invalidations
3. identify whether thresholds are too loose or too strict
4. produce a strategy review note
5. recommend policy changes, but do not apply them automatically

Purpose:
- strategy improvement should happen offline, not during live heartbeat execution
- produce recommendations grouped by strategy profile and policy version

### 6. Strategy Profile Model

The workflow should stay mostly stable. What should evolve is the strategy profile.

Treat these as separate concepts:

- workflow
  - operational sequence and cadence
- strategy profile
  - market-selection rules, thresholds, and sizing behavior
- policy version
  - versioned parameters for one strategy profile

Recommended initial model:

- one stable heartbeat workflow
- one stable risk-sweep workflow
- one stable review workflow
- multiple versioned strategy profiles over time

This allows attribution like:

- which profile opened the trade
- which policy version governed the trade
- whether a later profile outperformed the prior one

### 7. Policy Envelope

The strategy only works if the policy is explicit.

Suggested V1 policy:

- allowed venue: `sim`
- allowed domain: `crypto events`
- max new trades per cycle: `1`
- max open positions: `3`
- max position size: fixed small amount
- minimum confidence: `0.68`
- minimum fresh-context requirement: mandatory
- dry run: mandatory
- journal entry: mandatory
- if risk alert exists and is unresolved: no new trades
- if portfolio drawdown exceeds threshold: freeze new entries

### 8. Suggested File Layout

The repo should keep this initiative separate from the framework root and should act as an authoring repo, not a runtime workspace.

Recommended layout:

```text
packs/simmer/paper-trading/
  README.md
  architecture.md
  config/
    strategy-profiles.yaml
    tracking-schema.yaml
  contracts/
    agent.md
    skills/
      simmer-briefing.md
      simmer-market-context.md
      simmer-trade-planner.md
      simmer-dry-run.md
      simmer-executor.md
      simmer-risk-manager.md
      simmer-journal.md
    workflows/
      paper-trading-heartbeat.md
      paper-risk-sweep.md
      paper-strategy-review.md
  templates/
    journal-entry.yaml
    review-report.yaml
```

Why this layout:
- `config/` holds strategy and attribution rules outside runtime prompts
- `contracts/` holds portable definitions ready to be moved into OpenClaw
- `templates/` defines the shape of runtime outputs without storing live data
- the initiative no longer pollutes the framework root or imitates a runtime

### 9. Agent Prompt Shape

The `simmer-supervisor` prompt should be short and rule-heavy.

It should include:
- role: paper trading supervisor
- domain restriction: one market domain only
- workflow order: risk first, opportunity second, execution third
- hard bans: no dry-run bypass, no revenge trading, no averaging down
- output style: structured proposal, not free-form rambling

It should not include:
- long market education
- multiple strategy variants
- vague language like "be aggressive when appropriate"

### 10. Tracking And Analytics

If you want to know which logic actually works, every journaled action needs attribution metadata.

Minimum fields:

- `workflow_name`
- `strategy_profile_id`
- `policy_version`
- `run_id`
- `trade_id`
- `market_id`
- `action`
- `entry_reason`
- `exit_reason`
- `confidence`
- `result`
- `realized_pnl`

These fields should be emitted by the runtime, but the schema should be defined here.

This is what allows the weekly review to answer:

- which profile performed best
- which thresholds were too loose
- whether one workflow is stable but one profile is weak

### 11. Why This Architecture Can Actually Work

This is effective because it separates three things that agents usually blur:

- thinking
  - trade thesis and confidence
- acting
  - order placement
- governing
  - when to wake, what order to do things in, and when to refuse action

The heartbeat and risk-sweep workflows keep timing deterministic. The small skill set keeps tool use inspectable. The single supervisor agent keeps memory and strategy tuning coherent.

## Changes Required

- `/Users/mcan/ViberMode/packs/simmer/paper-trading/contracts/agent.md`: define the portable agent identity
- `/Users/mcan/ViberMode/packs/simmer/paper-trading/contracts/skills/`: define Simmer-facing skill contracts
- `/Users/mcan/ViberMode/packs/simmer/paper-trading/contracts/workflows/`: define recurring workflows
- `/Users/mcan/ViberMode/packs/simmer/paper-trading/config/strategy-profiles.yaml`: define strategy variants
- `/Users/mcan/ViberMode/packs/simmer/paper-trading/config/tracking-schema.yaml`: define attribution schema
- `/Users/mcan/ViberMode/packs/simmer/paper-trading/templates/`: define runtime artifact templates

## Implementation Hints

- Keep V1 fully on paper trading; do not design around real money yet.
- Use fixed-size positions first. Percentage-based dynamic sizing can wait.
- Journal skipped trades too, not only executed ones. That is where policy quality shows up.
- Make "no trade" a valid success outcome for a heartbeat.
- The first production-quality metric is not PnL. It is decision consistency under the rules.
- If the agent starts mixing domains, split by agent later. Do not start multi-domain.

## Verification

Verify:
- the supervisor can complete a heartbeat without ambiguity
- every trade attempt includes context, dry-run, policy check, and journal output
- risk sweeps can exit positions without requiring the opportunity-scanning flow
- weekly review produces actionable threshold recommendations

Expected:
- a small number of explainable paper trades
- stable cadence
- clean logs
- low behavioral drift between runs

Watch out:
- letting the agent self-modify policy mid-run
- too many skills exposed at once
- combining scouting and risk exits in the same uncontrolled prompt
- turning the heartbeat into an always-on loop

## Recommended Next Step

Write these three assets next:

1. `contracts/agent.md`
2. `config/strategy-profiles.yaml`
3. `config/tracking-schema.yaml`

That is the minimum set that turns this architecture into something runnable.
