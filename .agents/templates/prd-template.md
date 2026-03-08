# PRD: [Feature Name]

## Problem
What user problem are we solving? Include evidence or reasoning.

## Solution
High-level approach. What will the user experience?

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
- P0 requirements
- Tech stack constraints

Sections That Must Not Change:
- Problem
- Solution
- P0 requirements
- Out of Scope

Mapping Rules:
- Every P0 requirement must map to at least one UX flow or user story.
- Any flow listed in `primary_flows_expected` should survive into UX unless explicitly revised.
- Open questions must stay visible until resolved by a downstream artifact.
