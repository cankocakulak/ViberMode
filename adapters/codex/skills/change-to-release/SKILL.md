---
name: "viber-change-to-release"
description: "Use when the user wants one or more changes applied to an existing repo with analysis, implementation, validation, experience hardening, and an optional release step such as TestFlight."
---

# Change To Release

Read and follow the full workflow instructions at `../viber-mode/packs/vibermode/workflows/change-to-release.md`.

This is the release-capable existing-repo workflow. Use `product-to-code` for greenfield product creation and `repo-change` for existing-repo changes that do not need release orchestration.

Run model:
1. Treat one invocation as one target repo.
2. Confirm or derive `target_repo`, `project_name`, and `release_target`.
3. Read `change_request_path` when provided; resolve relative paths from `target_repo`.
4. Default artifacts to `<target_repo>/docs/[project-name]/`.
5. Implement only the recommended batch from the triage brief; keep vague, high-risk, or low-confidence notes on hold.
6. Do not batch multiple repositories into one run state.
7. Before any live release step, run the workflow hard gate (`npm run change-release:gate -- --status ...`) and stop if validation, experience review, final review, scope guard, or blockers are incomplete.

Primary artifacts: `docs/[project-name]/change-brief.md`, `plan.md`, `tasks.json`, `validation-report.md`, `experience-review.md`, `review.md`, and `change-release-status.json`.
