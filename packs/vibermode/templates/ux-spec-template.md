# UX: [Feature Name]

## User Goal
What is the user trying to accomplish? Single sentence.

## Experience Strategy

- **Experience Thesis**: What this should feel like and why that supports the product.
- **Audience & Context**: Who is using it, where, and with what urgency or intent.
- **First Impression**: What the first viewport or first screen must communicate immediately.
- **Primary Decision**: The main choice or action the interface should make easier.
- **Design Constraints**: Platform, brand, stack, content, accessibility, or runtime constraints.

## Product Experience Core

- **First Value Moment**: What the user should reach first and how the UI gets them there.
- **Core Loop**: The repeatable flow the app should make obvious and easy.
- **Differentiator**: The product-specific angle that should show up in layout, copy, and data.
- **Quality Anchors**: Screens or states that must feel polished enough to test.

## Information Architecture & First Screen

### First Viewport / First Screen
- **Primary Signal**: What the user sees first and why it proves relevance.
- **Hierarchy**: The exact order of headline, controls, content, proof, and next action.
- **Primary Action**: The main action and label.
- **Secondary Action**: Optional supporting action and label.
- **Next Section / Next State Hint**: What should be partially visible or implied next.

### Navigation & Structure
- Top-level sections, tabs, routes, or navigation groups.
- What appears persistently vs. contextually.
- How users move back, cancel, save, retry, or continue.

## Visual Direction

### Tone & Feel
Describe the visual personality and how the feature should feel to use.

### Reference Apps
- **[App Name]** - What to reference and why

### Pattern Adaptation
- **Source/Pattern**: What structure or interaction can be reused
- **Adaptation Required**: What copy, visual treatment, data, or flow must become app-specific
- **Do Not Copy**: Sample text, default colors, placeholder layout, or unrelated behavior to avoid

### Color Direction
- Primary: purpose and suggested tone
- Accent: for CTAs and interactive elements
- Semantic: success/error/warning/info
- Neutral: backgrounds, borders, text hierarchy

### Typography & Spacing
General guidance: compact vs. spacious, font character, density.

### Layout System
- Page/screen grid or shell
- Content width and density
- Card/list/table/form usage
- Mobile and desktop behavior

### Component Language
- Buttons, inputs, segmented controls, tabs, menus, cards, dialogs, sheets
- State treatment: hover, focus, active, selected, disabled, loading, empty, error, success
- Icon and imagery rules

### Asset & Media Strategy
- Real, searched, generated, or product-native visual assets required
- What imagery must show
- What visual treatment to avoid

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

## Motion & Craft Direction
- Which interactions should animate and why
- Which interactions should remain instant
- Easing/duration personality
- Gesture or drag expectations
- Reduced-motion behavior
- Design Engineer Handoff:
  - Surfaces needing `design-engineer`
  - Motion/component details to preserve during implementation

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
experience_thesis: "The product should feel..."
primary_flows:
  - name: "[Flow Name]"
    prd_requirements: ["PR-001"]
first_value_moment: "Flow or screen that proves value first"
core_loop: "Repeatable flow the app centers on"
first_screen:
  primary_signal: "What must be immediately visible"
  primary_action: "Button/action label"
quality_anchors:
  - "Screen or state that must be polished"
visual_system:
  tone: "Visual personality"
  layout: "Layout system"
  component_language: "Component behavior and state model"
motion_craft:
  design_engineer_needed: true
  focus_areas: ["popover motion", "active states"]
pattern_adaptation:
  - source: "Reference or source pattern"
    reuse: "Structure or behavior to reuse"
    adapt: "App-specific changes required"
runtime_topology:
  mode: "Copied from PRD"
  primary_repo_role: "ios-app"
  service_dependencies:
    - name: "Service or local capability"
      integration_posture: "real/mock/placeholder/deferred"
  backend_trigger: "Requirement that justifies backend, or none"
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
- Experience strategy
- Primary flows
- Information architecture and first screen
- Screen/component breakdown
- Runtime topology and integration posture from PRD
- Interaction patterns
- Motion and craft direction
- Copy direction
- Accessibility requirements

Sections That Must Not Change:
- User Goal
- Experience Strategy
- Information Architecture & First Screen
- Primary Flows
- Screen/Component Breakdown
- Interaction Patterns

Mapping Rules:
- Every primary flow must map to at least one story.
- Every screen/component referenced by a flow must appear in at least one story.
- Every P0 requirement referenced from the PRD must remain covered here.
