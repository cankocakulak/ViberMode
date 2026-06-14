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

## Runtime Topology

State how the first implementation should run locally and which repos or external services are actually required.

- **Topology Mode**: `local-only`, `ios-app-only`, `ios-app-plus-backend`, `ios-app-plus-backend-plus-ai-services`, `third-party-services-only`, or `deferred-service`
- **Primary Repo Role**: Usually `ios-app`
- **Required Repos Now**:
  - `ios-app`: why it is required
- **Optional / Deferred Repos**:
  - `backend`: create only if the P0 scope needs server-owned data, auth, jobs, APIs, or shared state
  - `ai-services`: use as a symlink/reference when operational AI workflows are needed; do not copy it into the app repo
- **Service Dependencies**: local persistence, backend APIs, RevenueCat/StoreKit, analytics, notifications, AI providers, or none
- **Integration Posture**: `real`, `mock`, `placeholder`, or `deferred` for each service dependency
- **Backend Trigger**: exact requirement or story that would justify creating the backend repo; write `none` when not needed
- **Data Ownership**: what lives on-device vs. server-side vs. external service
- **Local Workspace Expectation**: expected repo layout under the product workspace bundle

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
runtime_topology:
  mode: "local-only"
  primary_repo_role: "ios-app"
  required_repos_now: ["ios-app"]
  optional_repos: ["backend", "ai-services"]
  service_dependencies:
    - name: "local persistence"
      integration_posture: "real"
  backend_trigger: "none"
  data_ownership: "What is local, server-side, or external"
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
- Runtime topology and service integration posture

Sections That Must Not Change:
- Problem
- Solution
- Product Core
- P0 requirements
- Runtime Topology, unless spec review routes back to PRD
- Out of Scope

Mapping Rules:
- Every P0 requirement must map to at least one UX flow or user story.
- Any flow listed in `primary_flows_expected` should survive into UX unless explicitly revised.
- Open questions must stay visible until resolved by a downstream artifact.
