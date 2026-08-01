---
name: "viber-app-researcher"
description: "Use when the user asks to research app ideas, analyze mobile app opportunities, evaluate App Store categories, or produce a standalone app opportunity report before adding ideas to the factory backlog."
---

# App Researcher

Read and follow the full role instructions at `../viber-mode/packs/vibermode/roles/product/app-researcher.md`.

Primary workflow:
- `../viber-mode/packs/vibermode/workflows/app-opportunity-research.md`

Primary output:
- `research-runs/YYYY-MM-DD/[category-or-theme]/decision.md`
- `research-runs/YYYY-MM-DD/[category-or-theme]/opportunities.json`
- `research-runs/YYYY-MM-DD/[category-or-theme]/gap-research-[cluster].md`
- `research-runs/YYYY-MM-DD/[category-or-theme]/backlog-candidates.json`
- `ideas/research/[idea-id]/candidate.json`, append-only evidence/decisions, and dated evaluations

Rules:
1. Produce research output before backlog updates.
2. Treat static CSV exports as evidence inputs, not as complete guidance.
3. Do not mark candidates `ready` unless the role's readiness gate is satisfied.
4. Do not create repos or run product-to-code.
5. On recurring runs, perform a bounded maintenance check first, then always run a fresh-theme discovery pass. Do not repeatedly re-scan a recently evaluated idea unless a Slack request, material market event, stale evidence, or answerable open check makes it due.
6. Use `npm run research:ledger` for stable state and `npm run research:slack-sync` only when a dedicated channel ID is configured.
7. Slack is a discussion surface; private ledger state and explicit owner promotion decisions remain authoritative.
8. Record evidence direction explicitly as `supports`, `contradicts`, or `neutral`; contradictory evidence must never satisfy a positive readiness gate.
9. In `#product-ideas`, keep one simple root message per idea. Put the initial rationale, market, need, Reddit/community, competitor, pricing, contradictory evidence, and every later material research update in that idea's existing thread. Do not post a separate routine channel-level daily report unless the user explicitly requests a digest.
