# Workflow: Product to Code

> Canonical composed workflow: optional workspace acquisition, `product-to-spec`, optional workspace bundle provisioning, `bootstrap`, and `spec-to-code`.

## Pipeline Overview

This workflow is the default path for a new product idea:

```text
idea + optional repo_url → workspace acquisition → product-to-spec → workspace provisioning when needed → bootstrap → spec-to-code
```

Canonical role order:

```text
Workspace Acquisition → Brainstormer → PRD → UX Designer → User Stories → Spec Reviewer ↺ → Workspace Provisioning (when needed) → Bootstrap → Task Planner → Implementation Runner ↺ → Runtime Validator → Experience Reviewer ↺ → Reviewer → Remediation Router (when needed)
```

This workflow is deterministic:
- each step reads explicit inputs
- each step writes a named artifact
- each step has success criteria before the next step can begin
- downstream agents rely on artifacts, not chat history

## Entry Contract

Before starting, the orchestrator must resolve these inputs:

- `project_name` — stable slug used under `docs/[project-name]/`
- `workspace_path` — the canonical primary repo root for artifacts and code, either provided directly or resolved by Stage 0
- optional `workspace_bundle` — typed multi-repo workspace contract when one product spans sibling repos under a shared local root
- optional `repo_url` — remote repository to clone before specification work begins
- optional `workspace_parent` — parent directory used when `repo_url` is provided and `workspace_path` is not yet local
- `product_idea` — raw idea, feature concept, or requested product slice
- `repo_mode` — `existing-repo` or `greenfield`
- `platform` and `stack` — enough runtime context for spec adaptability, bootstrap, and validation
- optional `factory_context` — orchestrator-provided delivery constraints for factory runs, such as required onboarding, first-value, paywall shell, or copy-and-adapt pattern sources
- optional `analysis_artifact` — only when existing-codebase discovery has already run

For `factory_context.type = ios_app_factory`, the default local pattern source is `packs/vibermode/patterns/ios-factory/catalog.json`. External or private pattern catalogs may override or extend it, but downstream UX and task planning must still record selected onboarding/paywall pattern IDs and the app-specific adaptations required before implementation.

If `workspace_path` is not provided but `repo_url` is provided, Stage 0 must clone/acquire the primary repo and set `workspace_path` before Stage 1. If neither `workspace_path` nor `repo_url` can be derived safely, stop before Stage 1 and ask for the missing input. Do not let downstream stages infer different roots, stacks, or artifact folders independently.

When `workspace_bundle` is present, `workspace_path` remains the primary repo path for backward compatibility. The bundle root is the local product workspace that may contain sibling repos such as `ios-app/`, `backend/`, or a symlinked `ai-services/` operations repo. Product artifacts still live in the primary repo by default unless a later workflow explicitly introduces cross-repo artifact storage.

Recommended bundle shape:

```json
{
  "schema_version": 1,
  "root": "$VIBERMODE_WORKSPACE_ROOT/generated-products/ios-example-2026-06-12",
  "layout": "bundle",
  "primary_repo_role": "ios-app",
  "repos": [
    {
      "role": "ios-app",
      "workspace_path": "$VIBERMODE_WORKSPACE_ROOT/generated-products/ios-example-2026-06-12/ios-app",
      "repo_url": "https://github.com/ViberBoyz/ios-example-2026-06-12.git",
      "platform": "ios",
      "stack": "SwiftUI",
      "required": true
    },
    {
      "role": "ai-services",
      "workspace_path": "$VIBERMODE_WORKSPACE_ROOT/generated-products/ios-example-2026-06-12/ai-services",
      "source_path": "$VIBERMODE_AI_SERVICES_PATH",
      "link_type": "symlink",
      "required": false
    }
  ]
}
```

## Composed Workflow

Stage 0:
- workspace acquisition using `scripts/acquire-workspace.mjs`

Stage 1:
- `packs/vibermode/workflows/product-to-spec.md`

Stage 1.5:
- workspace topology application using `scripts/workspace-topology.mjs`; it verifies or attaches `ai-services` when configured and provisions backend only when approved specs require it

Factory/manual runner command shape:

```bash
npm run workspace:topology -- \
  --run-manifest $VIBERMODE_WORKSPACE_ROOT/app-factory-state/factory/runs/run-YYYYMMDDHHMMSS-xxxxxx.json \
  --backend-template-owner "$BACKEND_TEMPLATE_OWNER" \
  --backend-template-repo "$BACKEND_TEMPLATE_REPO" \
  --destination-owner ViberBoyz
```

If the approved topology does not require backend, this command records `COMPLETE_NOOP`-equivalent evidence in the run manifest and continues. If backend is required, it delegates backend creation to `workspace-bundle-provision.mjs`.

Stage 2:
- `packs/vibermode/workflows/bootstrap.md`

Stage 3:
- `packs/vibermode/workflows/spec-to-code.md`
- includes phased app foundation execution, core feature execution, polish-ready execution, runtime validation, experience hardening for user-facing slices, and final review

Use `product-to-code` when you want the full path from idea to reviewed implementation.
Use `product-to-spec` when you want to stop after specification artifacts are complete.
Use `spec-to-code` when specs already exist and you only want the implementation pipeline.

Stage 0 is required for factory-generated or remote-only repos because specification artifacts must be written inside the target repo, not inside the orchestrator workspace.

## Workflow Scope

Use this workflow when:
- starting from a raw idea
- defining a new feature or product slice
- preparing implementation-ready work with stable artifact handoffs
- continuing from a generated remote repo that must be cloned before specs are written

Do not use this workflow when:
- you only need codebase discovery first
- the task is a small bug fix or isolated iteration task

For existing-product work that requires codebase discovery, run `analyzer` first and then enter this workflow at Stage 1 with `analysis_artifact`.

## Stage Gate Rules

- Stage 0 must complete before `product-to-spec` whenever the input starts from `repo_url` instead of an existing `workspace_path`.
- Stage 0 must set exactly one canonical local `workspace_path`; all primary-repo artifacts and code changes must resolve inside that path.
- When `workspace_bundle` is present, Stage 0 must also preserve one canonical `workspace_bundle.root`. Sibling repo paths must resolve under that root unless they are explicit symlink/reference entries such as shared `ai-services`.
- Stage 1 must write `spec-review.md` and reach `APPROVED` before bootstrap can start.
- Stage 1 must preserve and apply `factory_context` when provided. For user-facing apps, PRD, UX, and stories must name the first-value moment, core loop, product-specific differentiator, quality anchors, and deferred scope before spec review can approve.
- Stage 1 must preserve `launch_appeal` when provided. PRD, UX, and stories must carry forward the hook, first-value moment, signature interaction, visual direction, storefront angle, TestFlight demo path, and anti-generic rule.
- Stage 1 must define and preserve runtime topology before spec review can approve, including whether the first implementation is local-only, app-only, backend-backed, ai-services-assisted, third-party-services-only, or intentionally deferred-service.
- For `factory_context.type = ios_app_factory`, PRD, UX, and stories must cover onboarding, first-value, core loop, upgrade/paywall shell, pattern adaptation, and runtime topology before spec review can approve.
- For `factory_context.type = ios_app_factory`, UX must choose or explicitly reject onboarding/paywall patterns from the configured pattern sources. Task planning must carry chosen pattern IDs into foundation tasks so implementation has a concrete template reference without producing generic copied screens.
- Backend repo creation must be justified by a named P0 backend trigger in PRD/stories; otherwise backend remains deferred even when the workspace bundle supports a future `backend` repo.
- Stage 1.5 must run after approved spec review and before bootstrap whenever a `workspace_bundle` is present. It must record a provisioning checkpoint even when the result is `COMPLETE_NOOP`, so skipped backend creation is explicit rather than implicit.
- When approved specs require a backend sibling repo, Stage 1.5 must provision it before bootstrap and update the run manifest or `workflow-status.json.workspaceBundle` with a `repo.role = "backend"` entry. Do not provision backend repos before spec review approval.
- If Stage 1 reaches `CHANGES_REQUESTED`, rerun only the specification stages named in `spec-review.md`, preserving stable requirement IDs, UX flow names, and story IDs wherever possible. Stay in Stage 1 until `spec-review.md` reaches `APPROVED` or `BLOCKED`.
- If Stage 1 reaches `BLOCKED`, the composed workflow is blocked and later stages must not run.
- Stage 2 must write `bootstrap.md` and establish one canonical workspace path plus a reusable runnable baseline before implementation begins. In `product-to-code`, bootstrap is required even when it only records that an existing baseline is already trusted.
- If Stage 2 reaches `BLOCKED`, Stage 3 must not run.
- Stage 3 task planning must produce phase-aware tasks for user-facing apps. `foundation` tasks establish app shell, onboarding, main surface, first-value entry, upgrade/paywall shell, and baseline states before `core` tasks dominate the run.
- Stage 3 implementation must not advance from `foundation` to `core` while app-shell tasks are still pending or blocked. A generated app should stop early rather than spend most of the run as a generic template with hidden domain logic.
- Stage 3 must include a `polish` phase before runtime validation for user-facing apps. This phase prepares surface maps, screenshot targets, keyboard/small-screen/accessibility checks, edge states, and design-engineering follow-ups so experience hardening can inspect a shaped product rather than invent the product shell after the fact.
- Stage 3 must run experience hardening after runtime validation for user-facing slices. For `factory_context.type = ios_app_factory`, this gate must check onboarding, first-value/core loop, upgrade/paywall shell, keyboard behavior, small-screen fit, and screenshot/video evidence before final review can approve.
- For `factory_context.type = ios_app_factory`, Stage 3 automation must run `npm run factory:experience-gate -- --run-manifest <run-manifest>` after runtime validation and before final factory completion. If the gate cannot capture onboarding, board, and paywall screenshots on a fresh simulator, or if `experience-review.md` is not approved, Stage 3 remains incomplete and must route through experience hardening.
- For `factory_context.type = ios_app_factory`, Stage 3 must not complete when onboarding is one screen, onboarding is a raw `List`/form-style explanation, paywall is a disabled placeholder list, copied pattern code remains sample-like, the app's value is not understandable within 10 seconds of the main surface, or visual evidence is only a UI launch smoke test.
- For `factory_context.type = ios_app_factory`, Stage 3 must not complete when provided `launch_appeal` is ignored or replaced with generic app-shell UI.
- For factory automation, Stage 3 quality failures should automatically re-enter remediation for up to 3 passes before the workflow reports `BLOCKED`.
- All stages must resolve artifacts relative to the same canonical target repo or workspace root.
- Cross-repo work is allowed only when the task or artifact names the target `repo.role`; otherwise implementation, validation, and review default to the primary repo at `workspace_path`.
- The composed workflow should pass forward only stable artifact paths and explicit stage results, not informal chat summaries.

## Workflow Status Artifact

The orchestrator should maintain a machine-readable status file:

```text
docs/[project-name]/workflow-status.json
```

Minimum shape:

```json
{
  "workflow": "product-to-code",
  "projectName": "[project-name]",
  "workspacePath": "/absolute/path/to/project-root",
  "workspaceBundle": null,
  "status": "RUNNING",
  "currentStage": "workspace-acquisition",
  "stages": {
    "workspace-acquisition": {
      "status": "PENDING",
      "artifact": null,
      "verdict": null
    },
    "product-to-spec": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/spec-review.md",
      "verdict": null
    },
    "workspace-provisioning": {
      "status": "PENDING",
      "artifact": null,
      "verdict": null
    },
    "bootstrap": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/bootstrap.md",
      "verdict": null
    },
    "spec-to-code": {
      "status": "PENDING",
      "artifact": "docs/[project-name]/review.md",
      "verdict": null,
      "phases": {
        "foundation": "PENDING",
        "core": "PENDING",
        "polish": "PENDING",
        "validation": "PENDING",
        "experience": "PENDING",
        "review": "PENDING"
      }
    }
  },
  "blockers": [],
  "nextAction": "Run workspace acquisition when repo_url is provided; otherwise run product-to-spec"
}
```

Allowed top-level statuses:
- `RUNNING`
- `COMPLETE`
- `BLOCKED`
- `INCOMPLETE_SPEC_CHANGES_REQUESTED`
- `INCOMPLETE_TASKS_PENDING`
- `INCOMPLETE_VALIDATION_FAILED`
- `INCOMPLETE_EXPERIENCE_CHANGES_REQUESTED`
- `INCOMPLETE_REMEDIATION_PENDING`

Status rules:
- Update this file after every stage or retryable loop.
- When Stage 0 runs, update `workspacePath` to the acquired local repo root before writing spec artifacts.
- When `workspace_bundle` is present, copy it into `workflow-status.json.workspaceBundle` and keep `workspacePath` aligned with the primary repo entry.
- When Stage 1.5 provisions a sibling repo, update `workflow-status.json.workspaceBundle.repos` before bootstrap starts.
- Use stage artifacts as the source of truth; do not mark a stage complete from prose alone.
- If an artifact exists but lacks an explicit verdict, treat the stage as blocked until the artifact is corrected.
- `COMPLETE` is allowed only after runtime evidence exists, experience review is approved or explicitly not applicable, and final review approves the implemented slice.
- For factory runs, the run manifest should record structured Stage 3 evidence under `product_to_code_result.experience_review`, including `status`, `onboarding_steps`, and screenshot or video file paths. Stage 4 preflight may block without this structure.

## Artifact Folder Convention

All artifacts live under:

```text
docs/[project-name]/
```

Canonical artifact set for this workflow:

```text
docs/[project-name]/
├── workflow-status.json
├── brainstorm.md
├── prd.md
├── ux.md
├── stories.md
├── spec-review.md
├── bootstrap.md
├── tasks.json
├── run-state.json
├── surface-map.json
├── validation-report.md
├── experience-review.md
├── remediation.md
└── review.md
```

Notes:
- `run-state.json` is produced during repeated `implementation-runner` execution.
- `architecture.md` is not part of the canonical first production workflow because there is no dedicated architect role in the current system.
- If an external architecture step is inserted later, it should consume `prd.md`, `ux.md`, and `stories.md` without changing IDs or boundaries.
- In the future, analysis may split into typed artifacts such as `codebase-analysis.md` and `product-analysis.md`, but the current workflow keeps `analysis.md` unchanged for compatibility.

## Orchestration Rules

1. Derive or confirm `project-name` before starting.
2. Resolve one canonical `workspace_path` before creating or reading workflow artifacts. If only `repo_url` is known, run Stage 0 first.
3. Write or update `workflow-status.json` after each stage result.
4. Use artifact paths as primary inputs whenever an upstream artifact exists.
5. Do not skip a step unless the workflow rules explicitly allow it.
6. Do not advance if the current stage fails its success criteria.
7. Prefer each artifact's `## Summary (for downstream agents)` section first, then read the full artifact where needed.
8. If approved runtime topology requires a sibling repo, run workspace provisioning before bootstrap and record the resulting repo entry.
9. For user-facing implementation, treat `experience-review.md` as a required Stage 3 gate before final review.
10. Preserve stable IDs and mappings:
   - PRD requirement IDs
   - UX flow names
   - story IDs
11. Review is required before calling the workflow production-ready.

## Stage Result Mapping

Stage 0: `workspace-acquisition`
- `COMPLETE` → continue to `product-to-spec`
- `COMPLETE_NOOP` → continue to `product-to-spec` using the existing local repo
- `BLOCKED` → stop with top-level `BLOCKED`

Stage 1: `product-to-spec`
- `APPROVED` → continue to `workspace-provisioning` when a `workspace_bundle` is present; otherwise continue to `bootstrap`
- `CHANGES_REQUESTED` → rerun routed spec stages, then rerun `spec-reviewer`
- `BLOCKED` → stop with top-level `BLOCKED`

Stage 1.5: `workspace-provisioning`
- `COMPLETE` or `COMPLETE_NOOP` → continue to `bootstrap`
- `BLOCKED` → stop with top-level `BLOCKED`

Stage 2: `bootstrap`
- `COMPLETE` or `COMPLETE_NOOP` → continue to `spec-to-code`
- `BLOCKED` → stop with top-level `BLOCKED`

Stage 3: `spec-to-code`
- `COMPLETE` → top-level `COMPLETE`
- `INCOMPLETE_TASKS_PENDING` → continue `implementation-runner`
- `INCOMPLETE_VALIDATION_FAILED` → run `remediation-routing`, then re-enter implementation
- `INCOMPLETE_EXPERIENCE_CHANGES_REQUESTED` → run `remediation-routing`, then re-enter implementation
- `INCOMPLETE_REMEDIATION_PENDING` → run `remediation-routing`, then re-enter implementation
- `BLOCKED` → stop with top-level `BLOCKED`

## Execution Outcome

The composed workflow is successful only when:
- specification review approved the spec set
- any approved sibling repos were provisioned into `workspace_bundle` before bootstrap
- bootstrap produced `bootstrap.md` with `COMPLETE` or `COMPLETE_NOOP`
- `spec-to-code` reached a non-blocked implementation outcome with runtime evidence, experience review approval or explicit non-applicability, and final review completion
- `workflow-status.json` is updated to `COMPLETE`

If validation, experience review, or final review fails downstream, route through `remediation-routing` and re-enter `spec-to-code` rather than skipping back to ad hoc coding.
