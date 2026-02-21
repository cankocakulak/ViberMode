# Contributing to ViberMode

## Agent Types

ViberMode has two agent categories with different output contracts:

| Category | Location | Output Contract |
|----------|----------|-----------------|
| **Code agents** | `.agents/core/` | Plan → Changes → Patch → Tests |
| **Product agents** | `.agents/product/` | Analysis → Document → Artifacts |

Choose the right category before creating an agent.

---

## Creating a Code Agent

Code agents produce technical output: specifications, code changes, reviews.

### Template

```markdown
# Agent Name

> One-line description.

## Role

Who is this agent? What expertise does it have?
- Specific capabilities
- What it does NOT do

## When to Use

**Activate when:**
- Trigger conditions

**Do NOT use when:**
- Anti-patterns

## Input Contract

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `input_name` | string | yes | What this input contains |

## Output Contract

### Plan
Reasoning and approach before acting.

### Changes
Explicit list of file modifications.

### Patch
Complete, working code.

### Tests
Verification steps or test code.

## Behavior Guidelines
- Specific rules for this agent

## Examples
- Input → Output example
```

---

## Creating a Product Agent

Product agents produce documents: PRDs, user stories, UX specs, ideas.

### Template

```markdown
# Agent Name

> One-line description.

## Role

Who is this agent? What expertise does it have?
- Specific capabilities
- What it does NOT do

## When to Use

**Activate when:**
- Trigger conditions

**Do NOT use when:**
- Anti-patterns

## Input Contract

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `input_name` | string | yes | What this input contains |

## Output Contract

### Analysis
2-3 sentences. Reframe the problem. Identify the real challenge.

### Document
The main deliverable. Use a clear markdown structure with:
- Headings that match the document type
- Checkboxes for actionable items
- Concrete, specific language

### Artifacts
Standalone .md file(s) to create:
```
File: docs/[type]-[name].md
Content: [Complete document]
```
Or: `No artifacts needed.`

## Behavior Guidelines
- Specific rules for this agent

## Examples
- Input → Output example
```

---

## Design Rules (All Agents)

1. **No Tool Assumptions**
   - Never reference specific IDE features
   - Never assume file system access patterns
   - Use generic terms: "modify file" not "use Cursor's edit tool"

2. **Explicit Contracts**
   - Every input must be documented
   - Output structure must be exact
   - No ambiguous requirements

3. **Composability**
   - Agents should accept output from other agents
   - Keep responsibilities focused
   - Avoid overlapping concerns

4. **Be Opinionated**
   - Always make a recommendation
   - Never end with "it depends"
   - Decide, don't defer

5. **Be Fast**
   - No unnecessary ceremony
   - Skip sections that add no value
   - Shortest complete answer wins

6. **Codex Compatibility**
   - Keep structure flat and parseable
   - Avoid complex nesting
   - Agents can be wrapped in SKILL.md with minimal modification

## Validation Checklist

Before submitting an agent:

- [ ] Has clear Role definition
- [ ] Has explicit When to Use conditions
- [ ] Has complete Input Contract table
- [ ] Output follows the correct contract for its category
- [ ] Contains no tool-specific references
- [ ] Includes at least one complete example
- [ ] Works standalone (no hidden dependencies)
- [ ] Is opinionated — makes decisions, not suggestions

## Creating Workflows

Workflows combine multiple agents. Place them in `.agents/workflows/`.

```markdown
# Workflow Name

## Agents
1. `agent-a` — What it does in this flow
2. `agent-b` — What it does in this flow

## Flow
[Input] → agent-a → agent-b → [Output]

## Handoff Contracts
How output from one agent becomes input for the next.
```
