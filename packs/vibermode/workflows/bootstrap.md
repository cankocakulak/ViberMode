# Workflow: Bootstrap

> Canonical repo and runtime preparation workflow for turning a workspace path plus stack choice into a runnable baseline before implementation begins.

## Pipeline

```text
workspace resolution → repo preflight → stack scaffold/setup → runnable validation
```

This workflow sits between specification work and implementation work when the target project root is not yet trusted as runnable.

## Step 1 — Resolve Workspace

Role:
`packs/vibermode/roles/product/bootstrap.md`

Purpose:
Resolve one canonical local project root for artifacts and code.

Inputs:
- `workspace_path`
- `project_name`
- optional: `analysis_artifact`

Outputs:
- resolved workspace section in `docs/[project-name]/bootstrap.md`

Success Criteria:
- one canonical local project root is chosen
- artifact destination resolves inside that root
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

## Step 3 — Stack Scaffold / Setup

Role:
`packs/vibermode/roles/product/bootstrap.md`

Purpose:
Prepare the declared stack so implementation can begin from a stable baseline.

Inputs:
- `stack`
- `platform`
- optional: `constraints`

Outputs:
- stack plan and commands sections in `docs/[project-name]/bootstrap.md`

Success Criteria:
- setup path is explicit
- the commands needed to reproduce setup are recorded
- scaffold or dependency setup is complete enough for validation

## Step 4 — Runnable Validation

Role:
`packs/vibermode/roles/product/bootstrap.md`

Purpose:
Verify the baseline actually builds, starts, or launches.

Inputs:
- the prepared workspace from Steps 1-3

Outputs:
- validation evidence and blockers in `docs/[project-name]/bootstrap.md`

Success Criteria:
- at least one stack-appropriate runnable validation command is executed
- success or failure is recorded explicitly
- blockers are clear enough for downstream work to stop safely if needed

## Artifacts

```text
docs/[project-name]/
└── bootstrap.md
```

`bootstrap.md` is the canonical handoff artifact for repo state, scaffold decisions, and runnable baseline evidence.

## Execution Notes

- Use this workflow for greenfield app creation and for existing repos that need preflight validation before implementation.
- Skip this workflow only when the repo root, branch, and runnable baseline are already known and recorded.
- `workspace_path` is the canonical root. Do not resolve workflow artifacts against the orchestrator workspace.

## Typical Handoffs

- `product-to-spec → bootstrap` for greenfield projects
- `analyzer → product-to-spec → bootstrap → spec-to-code` for existing repos that need runtime preflight
- `bootstrap → spec-to-code` when specification artifacts already exist
