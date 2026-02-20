# Contributing to ViberMode

## Creating a New Agent

Agents are markdown files that define AI behavior in a tool-agnostic way.

### Location

Place agents in the appropriate directory:

- `.agents/core/` — Fundamental agents used across all workflows
- `.agents/workflows/` — Multi-agent orchestration templates

### Agent Template

```markdown
# Agent Name

> One-line description of what this agent does.

## Role

Define the agent's identity and expertise. Be specific about:
- Domain expertise
- Behavioral characteristics
- Decision-making authority

## When to Use

Describe the trigger conditions:
- What user intent activates this agent
- Prerequisites that must be met
- Situations where this agent should NOT be used

## Input Contract

Define expected inputs:

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `context` | string | yes | Description of what this input contains |

## Output Contract

All agents MUST produce output in this exact structure:

### Plan

Reasoning and approach before taking action.

### Changes

Explicit list of what will be modified.

### Patch

Actual implementation (code, config, etc.).

### Tests

Verification steps or test code.

## Behavior Guidelines

- Specific instructions for edge cases
- Quality standards to maintain
- Constraints and limitations

## Examples

Provide 1-2 concrete examples of input → output.
```

### Design Rules

1. **No Tool Assumptions**
   - Never reference specific IDE features
   - Never assume file system access patterns
   - Use generic terms (e.g., "modify file" not "use Cursor's edit tool")

2. **Explicit Contracts**
   - Every input must be documented
   - Output structure must be exact
   - No ambiguous requirements

3. **Composability**
   - Agents should accept output from other agents
   - Keep responsibilities focused
   - Avoid overlapping concerns

4. **Codex Compatibility**
   - Agents will be wrapped in SKILL.md format
   - Keep the structure flat and parseable
   - Avoid complex nested structures

### Validation Checklist

Before submitting an agent:

- [ ] Has clear Role definition
- [ ] Has explicit When to Use conditions
- [ ] Has complete Input Contract table
- [ ] Has all four Output Contract sections (Plan, Changes, Patch, Tests)
- [ ] Contains no tool-specific references
- [ ] Includes at least one example
- [ ] Works standalone (no hidden dependencies)

### Testing Your Agent

1. Use the agent in Cursor with various inputs
2. Verify output follows the contract exactly
3. Check that another developer can understand the output
4. Confirm the output could be parsed programmatically

## Creating Workflows

Workflows combine multiple agents. Place them in `.agents/workflows/`.

```markdown
# Workflow Name

## Agents

1. `spec` — Analyze requirements
2. `implementer` — Execute changes
3. `reviewer` — Validate results

## Flow

```
[Input] → spec → implementer → reviewer → [Output]
          ↑                        │
          └────── (if rejected) ───┘
```

## Handoff Contracts

Define how output from one agent becomes input for the next.
```

## Code Style

- Use consistent markdown formatting
- Keep lines under 100 characters
- Use tables for structured data
- Use code blocks for examples

## Pull Request Process

1. Create agent in appropriate directory
2. Run validation (when available): `npm run validate`
3. Test in Cursor environment
4. Submit PR with example usage
