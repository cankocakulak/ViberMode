# UX: [Feature Name]

## User Goal
What is the user trying to accomplish? Single sentence.

## Visual Direction

### Tone & Feel
Describe the visual personality and how the feature should feel to use.

### Reference Apps
- **[App Name]** — What to reference and why

### Color Direction
- Primary: purpose and suggested tone
- Accent: for CTAs and interactive elements
- Semantic: success/error/warning/info
- Neutral: backgrounds, borders, text hierarchy

### Typography & Spacing
General guidance: compact vs. spacious, font character, density.

## Primary Flows

### Flow Name: [Flow Name]
- **User Goal**: What the user wants from this flow
- **Trigger**: What starts the flow
- **Steps**:
  1. First step
  2. Second step
- **Edge Cases**:
  - Empty state
  - Error state
- **Success State**: Where the user lands when the flow succeeds
- **PRD Requirement References**:
  - `PR-001`

## Screen/Component Breakdown

### [Screen/Component Name]
- **Purpose**: Why this exists
- **Layout**: Brief structure description
- **Key elements**: Main UI elements
- **Primary action**: Main user action
- **Edge cases**: Empty, loading, error, permission states
- **Flow References**:
  - `[Flow Name]`
- **PRD Requirement References**:
  - `PR-001`

## Interaction Patterns
- How elements behave
- Feedback mechanisms
- Navigation patterns
- Loading and transition behavior

## Copy Direction
Provide actual labels, button text, empty-state copy, and error copy.

## Accessibility
- Keyboard navigation requirements
- Screen reader considerations
- Color contrast notes
- Touch target sizes where relevant

## Summary (for downstream agents)

```yaml
feature: "[Feature Name]"
source_artifacts:
  prd: "docs/[project-name]/prd.md"
  analysis: "docs/[project-name]/analysis.md"
primary_flows:
  - name: "[Flow Name]"
    prd_requirements: ["PR-001"]
screens:
  - name: "[Screen/Component Name]"
    flows: ["[Flow Name]"]
p0_requirements_covered:
  - "PR-001"
key_risks:
  - "Risk, dependency, or interaction concern"
```

## Handoff Contract

Next Agent: `user-stories`

Required Artifacts:
- `docs/[project-name]/prd.md`
- `docs/[project-name]/ux.md`

Recommended Artifacts:
- `docs/[project-name]/analysis.md`

Critical Inputs:
- User goal
- Primary flows
- Screen/component breakdown
- Interaction patterns
- Copy direction
- Accessibility requirements

Sections That Must Not Change:
- User Goal
- Primary Flows
- Screen/Component Breakdown
- Interaction Patterns

Mapping Rules:
- Every primary flow must map to at least one story.
- Every screen/component referenced by a flow must appear in at least one story.
- Every P0 requirement referenced from the PRD must remain covered here.
