# User Stories: [Feature Name]

## Epic Summary
One-line description of the overall feature.

## Stories

### P0 FEATURE-001: [Story Title]
**As a** [user role]
**I want** [goal]
**So that** [benefit]

**PRD Requirement References:** `PR-001`
**UX Flow References:** `[Flow Name]`
**Dependencies:** None
**Implementation Boundary:** What is included in this story, and what is explicitly excluded.

**Acceptance Criteria:**
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

**Notes:** Optional implementation hints or edge cases.

---

## Coverage Map

### PRD Requirement Coverage
- `PR-001` → `FEATURE-001`

### UX Flow Coverage
- `[Flow Name]` → `FEATURE-001`

## Summary (for downstream agents)

```yaml
feature: "[Feature Name]"
source_artifacts:
  prd: "docs/[project-name]/prd.md"
  ux: "docs/[project-name]/ux.md"
story_ids:
  p0: ["FEATURE-001"]
  p1: []
coverage:
  prd_requirements:
    PR-001: ["FEATURE-001"]
  ux_flows:
    "[Flow Name]": ["FEATURE-001"]
dependencies:
  FEATURE-001: []
implementation_risks:
  - "Any story likely to need splitting or coordination"
```

## Handoff Contract

Next Agent: `task-planner`

Required Artifacts:
- `docs/[project-name]/stories.md`
- `docs/[project-name]/prd.md`

Recommended Artifacts:
- `docs/[project-name]/ux.md`
- `docs/[project-name]/analysis.md`

Critical Inputs:
- Story ordering
- Story IDs
- Acceptance criteria
- Dependencies
- Implementation boundaries
- Coverage map

Sections That Must Not Change:
- Story IDs
- Acceptance criteria intent
- Dependencies
- Implementation Boundary

Mapping Rules:
- Every P0 requirement must map to at least one story.
- Every primary UX flow must map to at least one story.
- Every story must be independently implementable or explicitly flagged for splitting.
