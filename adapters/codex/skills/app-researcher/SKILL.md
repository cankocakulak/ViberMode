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

Rules:
1. Produce research output before backlog updates.
2. Treat static CSV exports as evidence inputs, not as complete guidance.
3. Do not mark candidates `ready` unless the role's readiness gate is satisfied.
4. Do not create repos or run product-to-code.
