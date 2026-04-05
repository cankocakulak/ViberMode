# OpenClaw Workflow Map

## Overview

OpenClaw currently has active runtime workflows for:
- `product-to-spec`
- `spec-to-code`

ViberMode's canonical target shape now adds:
- `bootstrap`

This yields three base workflows:

1. `product-to-spec`
2. `bootstrap`
3. `spec-to-code`

And one composed workflow:

```text
product-to-code = product-to-spec → bootstrap → spec-to-code
```

## Current Recommendation

Until `bootstrap` is fully projected into OpenClaw and validated end-to-end, prepare the repo manually first.

Practical rule:
- existing repo: clone it yourself first, then pass the local absolute path
- greenfield app: create the target folder or repo root yourself first, then let bootstrap scaffold inside it

This keeps artifact paths deterministic and avoids repo-resolution ambiguity during the first rollout.

## Path Rule

Treat the project root as one canonical local path for the whole run.

Short-term compatibility:
- existing OpenClaw workflows use `target_repo`
- treat `target_repo` as the same thing as canonical `workspace_path`

Target input model:

```yaml
workspace_path: /absolute/path/to/project-root
repo_mode: existing-repo | greenfield
repo_url: optional-remote-url
base_branch: main
working_branch: feature/my-slice
project_name: new-product
platform: mobile | web | desktop | backend
stack: swiftui-ios | nextjs-web | react-native | node-api
```

## Running The Three Workflows Separately

### 1. Product To Spec

Use when:
- starting from an idea
- creating `brainstorm.md`, `prd.md`, `ux.md`, and `stories.md`

Expected artifact root:

```text
[workspace_path]/docs/[project-name]/
```

### 2. Bootstrap

Use when:
- the repo/runtime baseline is not yet trusted
- stack scaffold, branch setup, and first runnable validation still need to happen

Expected artifact:

```text
[workspace_path]/docs/[project-name]/bootstrap.md
```

### 3. Spec To Code

Use when:
- specification artifacts already exist
- implementation should start from `stories.md`

Expected artifacts:

```text
[workspace_path]/docs/[project-name]/tasks.json
[workspace_path]/docs/[project-name]/run-state.json
```

## Running The Composed Workflow

Ideal user-facing behavior:

```text
product-to-code
  → product-to-spec
  → bootstrap
  → spec-to-code
```

This keeps the user-facing experience to one top-level workflow while preserving internal stage boundaries.

## Supervisor Policy

OpenClaw should treat workflow orchestration as a supervised system, not just a sequence of child runs.

Operational rules:
- every delegated step has a minimum wait window, a hard timeout, and at most one automatic retry
- before killing a child run, verify whether the expected artifact already exists
- if a child times out without artifact output, cancel it and retry the same step once with the same artifact context
- if the retry also times out, surface an explicit blocked status instead of hanging the workflow
- if a child asks for clarification and no new user input is available, retry once with a best-effort artifact-first instruction before declaring the workflow blocked

Practical implication:
- `product-to-spec`, `bootstrap`, `spec-to-code`, and `remediation-routing` should all inherit the same watchdog model
- timeout handling belongs to the orchestrator/supervisor layer, not to the specialist skills themselves

Current limitation:
- the timeout table is currently policy, not fully enforced runtime behavior
- without a real watchdog loop, a delegated child may still hang until manually cancelled

Implementation target:
- use one shared watchdog wrapper around delegated `stage-runner` child executions
- track `started_at`, `expected_artifacts`, `hard_timeout`, and `retry_count`
- cancel and retry exactly once when the hard timeout is exceeded without output
- surface `BLOCKED_TIMEOUT` or `BLOCKED_RETRY_EXHAUSTED` instead of waiting indefinitely
