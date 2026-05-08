# OpenClaw Watchdog Design

## Goal

OpenClaw should supervise delegated specialist runs as a real watchdog system, not as prompt-only guidance.

The timeout policy is useful, but it does not kill, retry, or recover stuck child runs by itself. This document defines the missing enforcement layer.

## Problem

Today a workflow can specify:

- minimum wait
- hard timeout
- one automatic retry

But if no runtime component actively tracks elapsed time and child outputs, the workflow can still hang.

Typical failure shape:

- a specialist child is spawned
- the child loops or stalls
- no required artifact is written
- the orchestrator keeps waiting because no external supervisor intervenes

## Design Principle

Timeout handling belongs to the orchestrator supervisor layer, not to specialist skills and not to individual workflow prompts.

Specialists should only do bounded work and write artifacts. The supervisor should own:

- step timing
- stuck detection
- artifact existence checks
- cancellation
- retry
- blocked escalation

## Required Runtime Shape

Each delegated step should be tracked as a supervised child run with this minimum record:

```yaml
child_run:
  workflow: product-to-spec
  step: stories
  child_id: opaque-runtime-id
  started_at: 2026-04-05T14:22:00+03:00
  minimum_wait_seconds: 180
  hard_timeout_seconds: 480
  expected_artifacts:
    - /absolute/path/to/repo/docs/project/stories.md
  retry_count: 0
  max_retries: 1
  status: running
```

This record may live in memory, a runtime session store, or a workflow-state file. It should not depend on chat history.

## Watchdog Loop

For every delegated child run:

1. Spawn child.
2. Register child with start time and expected artifacts.
3. Do not poll aggressively before `minimum_wait_seconds`.
4. At or after the minimum wait:
   - check for expected artifact
   - check whether the child already completed
5. At `hard_timeout_seconds`:
   - if artifact exists, mark recovered-complete
   - if child completed, mark complete
   - if neither exists, cancel child
6. Retry once with the same workflow context plus a retry note.
7. If the retry also times out, stop automation and surface blocked status.

## Retry Prompt Contract

The retry should not restart the whole workflow from scratch.

Retry note:

```text
Previous child run exceeded timeout without producing the expected artifact.
Continue from repository state and existing artifacts.
Do not repeat completed upstream work.
Prefer a shorter artifact-first completion path.
```

## Output Rules

The watchdog should produce explicit step outcomes:

- `COMPLETED`
- `RECOVERED_FROM_ARTIFACT`
- `RETRIED_ONCE`
- `BLOCKED_TIMEOUT`
- `BLOCKED_RETRY_EXHAUSTED`
- `NEEDS_USER_INPUT`

These should be visible to the parent workflow so that it can:

- continue
- retry the same workflow later
- stop and ask for user help

## Artifact-First Recovery

Before cancelling any child, always check whether the required artifact already exists at the resolved repo path.

The supervisor should also prefer lightweight validity checks:

- file exists
- file is non-empty
- file has expected section headings when applicable

## Step-Specific Timeouts

Current recommended starting values:

| Step | Minimum Wait | Hard Timeout | Max Retries |
|------|--------------|--------------|-------------|
| brainstorm | 2 min | 7 min | 1 |
| prd | 3 min | 8 min | 1 |
| ux | 4 min | 9 min | 1 |
| stories | 3 min | 8 min | 1 |
| bootstrap | 4 min | 10 min | 1 |
| task-planner | 3 min | 7 min | 1 |
| implementation-runner | 7 min | 12 min | 1 |
| runtime-validator | 5 min | 8 min | 1 |
| reviewer | 4 min | 7 min | 1 |
| remediation-router | 2 min | 5 min | 1 |

These values are policy defaults, not hardcoded truth. They should be configurable in one place.

## Integration Point

The watchdog should be implemented once and reused across:

- `product-to-spec`
- `bootstrap`
- `spec-to-code`
- `remediation-routing`
- `product-to-code`
