# PRD: [Feature Name]

## Problem
What user problem are we solving? Include evidence or reasoning.

## Solution
High-level approach. What will the user experience?

## Product Core

- **First Value Moment**: What useful or satisfying thing should the user reach first?
- **Core Loop**: What repeatable action makes the product worth returning to?
- **Differentiator**: What makes this app feel specific rather than generic?
- **Quality Anchors**: Surfaces that must feel polished enough to test, such as onboarding, main screen, empty state, upgrade/paywall shell, or core action flow.
- **Defer List**: Important ideas intentionally not included in the first implementation pass.

## Requirements

### Must Have (P0)
- [ ] `PR-001` Requirement with clear acceptance criteria

### Should Have (P1)
- [ ] `PR-101` Requirement with clear acceptance criteria

### Nice to Have (P2)
- [ ] `PR-201` Requirement with clear acceptance criteria

## Tech Stack
For new projects: chosen stack with reasoning.
For existing projects: reference analysis artifact, note any new dependencies needed.

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| Frontend | ... | ... |
| Backend | ... | ... |
| ... | ... | ... |

## Out of Scope
Explicitly list what this is NOT.

## Success Criteria
How do we know this worked? Measurable where possible.

## Open Questions
Decisions that still need to be made.

## Summary (for downstream agents)

```yaml
feature: "[Feature Name]"
source_artifacts:
  analysis: "docs/[project-name]/analysis.md"
  brainstorm: "docs/[project-name]/brainstorm.md"
primary_user_problem: "One-sentence restatement of the problem"
solution_shape: "One-sentence restatement of the solution"
first_value_moment: "What the user reaches first that proves value"
core_loop: "Repeatable action or habit loop"
differentiator: "What should make this feel app-specific"
quality_anchors:
  - "Surface or flow that must not feel generic"
defer_list:
  - "Important idea intentionally deferred"
p0_requirements:
  - id: "PR-001"
    summary: "Requirement summary"
p1_requirements:
  - id: "PR-101"
    summary: "Requirement summary"
primary_flows_expected:
  - "Flow name"
key_risks:
  - "Risk or constraint"
open_questions:
  - "Question that still needs resolution"
```

## Handoff Contract

Next Agent: `ux-designer` or `user-stories`

Required Artifacts:
- `docs/[project-name]/prd.md`

Recommended Artifacts:
- `docs/[project-name]/analysis.md`
- `docs/[project-name]/brainstorm.md`

Critical Inputs:
- Problem
- Solution
- Product Core
- P0 requirements
- Tech stack constraints

Sections That Must Not Change:
- Problem
- Solution
- Product Core
- P0 requirements
- Out of Scope

Mapping Rules:
- Every P0 requirement must map to at least one UX flow or user story.
- Any flow listed in `primary_flows_expected` should survive into UX unless explicitly revised.
- Open questions must stay visible until resolved by a downstream artifact.
