# Strategy Context

This file is the handoff point for any future strategy work on the Simmer paper-trading system.

Read this before proposing strategy changes, profile changes, or market-selection changes.

## What This Role Owns

The strategy layer owns:

- market selection quality
- threshold tuning
- sizing policy
- position-count policy
- diversification policy
- entry/skip behavior
- reduce/exit policy quality
- review-driven iteration

The strategy layer does **not** own:

- OpenClaw runtime wiring
- Simmer auth or connector setup
- cron plumbing
- storage layout
- generic workflow orchestration order

Those are infrastructure concerns. Strategy work should change behavior, not the platform.

## Current System State

The current paper-trading system is past the architecture stage and into live paper operation.

Working now:

- live briefing
- live market context
- live trade proposal flow
- live dry-run
- live paper execution on `sim`
- live risk-sweep reduce/exit
- journaling
- weekly review workflow
- balance-percentage sizing with venue cap
- explicit close semantics for reduce/exit

Known operational realities:

- transient briefing timeouts can still happen
- market availability is uneven
- concentration alerts are common in a single-position portfolio
- Simmer discovery quality can vary by run

## Active Strategy

Current live profile:

- `strategy_profile_id: crypto_momentum_v1`
- `policy_version: v1`
- `domain: crypto_event_markets`
- `venue: sim`

This means the current system is not general-purpose yet. It is a crypto-focused paper-trading setup.

## Current Behavioral Shape

The system currently prefers:

- crypto event markets
- relatively near-term but still actionable resolution windows
- fresh context
- thresholded confidence
- small, policy-bounded entries
- risk-first blocking before new entries

The system currently avoids:

- averaging down
- multi-profile rotation
- blind re-entry in the same theme
- new entries while unresolved risk alerts exist

## Current Policy Direction

These are the important live strategy assumptions to keep in mind:

- minimum confidence gate is enforced before dry-run
- sizing is config-driven, not hardcoded
- per-trade size is capped by:
  - balance-based policy cap
  - venue cap
  - remaining exposure capacity
- max open positions is limited
- dry-run is mandatory
- risk-sweep must not increase gross exposure

## What We Have Learned So Far

1. Infrastructure is no longer the main bottleneck.
   Strategy quality is now the main area of iteration.

2. Bitcoin markets appear frequently, but that may be a discovery bias, not a deliberate hardcoded preference.

3. A single-position portfolio easily triggers concentration alerts.
   This means multi-position policy and concentration logic are likely the next strategic tuning area.

4. Opportunity scoring alone is not enough.
   Tradability, timing, state, and confidence gates matter more than raw candidate count.

5. Journal review is now meaningful.
   Future strategy changes should be justified by repeated journal/review patterns, not intuition alone.

## Strategy Questions To Revisit

These are the main open strategy questions, ordered by likely value:

1. Is the system too Bitcoin-heavy because of discovery bias?
2. Is the concentration policy too strict for a low-position-count paper system?
3. Should `max_open_positions` remain `3`, or should multi-position behavior be encouraged more explicitly?
4. Should `crypto_momentum_v1` remain the only active profile, or is it time to test `crypto_momentum_conservative_v1`?
5. Should market selection prefer better liquidity over raw opportunity score more aggressively?
6. Should risk-sweep reduce logic be more gradual or more decisive?

## What Good Strategy Work Looks Like

Good strategy work:

- changes one behavior at a time
- cites journals or reviews
- updates config first where possible
- preserves workflow order
- preserves safety rails
- makes attribution easier, not harder

Bad strategy work:

- changing multiple thresholds at once without a reason
- rewriting workflows to compensate for a weak profile
- mixing infrastructure fixes with profile tuning
- making the system more opaque

## Strategy Change Rules

If you change strategy behavior:

1. Prefer `config/strategy-profiles.yaml` first
2. Only change contracts when behavior truly changes
3. Do not bypass:
   - confidence gate
   - dry-run gate
   - risk-first ordering
   - journaling
4. Keep `strategy_profile_id` and `policy_version` attribution intact

## Recommended Next Strategy Focus

If we continue from here, the next strategic work should likely be:

1. analyze journal output for Bitcoin bias and market-type skew
2. decide whether concentration alert policy is too restrictive for a one-profile paper system
3. decide whether to enable more natural multi-position behavior
4. only then consider introducing a second strategy profile

## Quick Summary

This pack is now in the strategy-tuning phase, not the platform-building phase.

Use this file to remember:

- what is already solved
- what the current strategy actually is
- where future strategy work should focus
- what should not be touched casually
