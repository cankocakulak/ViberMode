# Workflow: Bootstrap

> Canonical repo and runtime preparation workflow for turning a workspace path plus stack choice into a runnable baseline before implementation begins.

## Pipeline

```text
workspace resolution → repo preflight → identity/setup alignment → script-first runnable validation
```

This workflow sits between specification work and implementation work when the target project root is not yet trusted as runnable.

## Stage Result

`bootstrap.md` must include one explicit result in `## Summary (for downstream agents)`:

- `COMPLETE` — canonical workspace, branch/setup assumptions, and reusable validation baseline are established
- `COMPLETE_NOOP` — an existing baseline was already trusted, and the artifact records the repo root, branch, scripts, and evidence being reused
- `BLOCKED` — implementation must not start because repo setup, scaffold, branch state, or runnable validation is incomplete

For composed `product-to-code` runs, `COMPLETE` and `COMPLETE_NOOP` may continue to `spec-to-code`; `BLOCKED` must stop the workflow.

## Step 1 — Resolve Runtime Workspace

Role:
`packs/vibermode/roles/product/bootstrap.md`

Purpose:
Resolve one canonical local project root for runtime setup and validation.

Inputs:
- `workspace_path`
- `project_name`
- optional: `repo_url`
- optional: `analysis_artifact`

Outputs:
- resolved workspace section in `docs/[project-name]/bootstrap.md`

Success Criteria:
- one canonical local project root is chosen
- artifact destination resolves inside that root
- if the composed workflow started from `repo_url`, that repo has already been acquired before bootstrap starts
- downstream steps will not need to guess the active workspace

## Step 2 — Repo Preflight

Role:
`packs/vibermode/roles/product/bootstrap.md`

Purpose:
Determine whether the target is an existing repo or greenfield root and resolve branch state.

Inputs:
- `repo_mode`
- optional: `repo_url`
- optional: `base_branch`
- optional: `working_branch`

Outputs:
- repo state section in `docs/[project-name]/bootstrap.md`

Success Criteria:
- repo mode is explicit
- base branch is resolved or the absence of git is recorded
- working branch is resolved, created, or intentionally deferred

## Step 3 — Identity Setup / Stack Setup

Role:
`packs/vibermode/roles/product/bootstrap.md`

Purpose:
Prepare the declared repo so implementation can begin from a stable baseline. Prefer identity alignment and existing repo setup over generating fresh scaffolding.

Inputs:
- `stack`
- `platform`
- optional: `bootstrap_mode`
- optional: `identity_overrides`
- optional: `constraints`

Outputs:
- stack plan and commands sections in `docs/[project-name]/bootstrap.md`

Success Criteria:
- setup path is explicit
- identity updates are explicit or intentionally deferred
- the commands needed to reproduce setup are recorded
- repo-provided scripts are detected when they exist
- setup is complete enough for validation

## Step 4 — Runnable Validation

Role:
`packs/vibermode/roles/product/bootstrap.md`

Purpose:
Verify the baseline actually builds, starts, launches, or passes repo-native test/smoke commands.

Inputs:
- the prepared workspace from Steps 1-3

Outputs:
- validation evidence and blockers in `docs/[project-name]/bootstrap.md`

Success Criteria:
- at least one stack-appropriate runnable validation command is executed
- repo-native scripts are preferred when they exist
- success or failure is recorded explicitly
- blockers are clear enough for downstream work to stop safely if needed
- mobile app bootstrap does not confuse a library/package compile with a runnable app baseline
- `## Summary (for downstream agents)` reports `COMPLETE`, `COMPLETE_NOOP`, or `BLOCKED`

## Artifacts

```text
docs/[project-name]/
└── bootstrap.md
```

`bootstrap.md` is the canonical handoff artifact for repo state, identity/setup decisions, and runnable baseline evidence.

## Execution Notes

- Use this workflow for ready repos, template-derived repos, and greenfield app creation when preflight validation is still needed.
- In composed `product-to-code` runs that start from `repo_url`, workspace acquisition happens before `product-to-spec`; bootstrap must validate the acquired local repo rather than cloning after spec artifacts exist.
- Skip this workflow only in standalone contexts when the repo root, branch, and runnable baseline are already known and recorded.
- In composed `product-to-code`, do not skip the bootstrap artifact; write `bootstrap.md` with `COMPLETE_NOOP` when the existing baseline is being reused.
- `workspace_path` is the canonical root. Do not resolve workflow artifacts against the orchestrator workspace.

## Typical Handoffs

- `product-to-spec → bootstrap` for greenfield projects
- `analyzer → product-to-spec → bootstrap → spec-to-code` for existing repos that need runtime preflight
- `bootstrap → spec-to-code` when specification artifacts already exist
