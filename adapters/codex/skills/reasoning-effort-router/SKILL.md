---
name: reasoning-effort-router
description: "Use at the start of coding, debugging, planning, review, research, release, or other multi-step work when Codex should choose an appropriate reasoning effort/depth from task size, uncertainty, risk, and validation needs. Also use when the user asks to adjust model reasoning level, reasoning effort, thinking budget, deep/quick mode, akil yurutme seviyesi, or automatic task-size based reasoning."
---

# Reasoning Effort Router

Select the smallest reasoning effort that can safely handle the task, then adapt the visible workflow depth to match it.

This skill cannot guarantee changing the host model's hidden runtime configuration. If the current Codex surface exposes an actual reasoning-effort control, use the selected value. If it does not, do not claim the setting changed; apply the profile by adjusting planning depth, context gathering, validation, and how much uncertainty you resolve before acting.

## Routing

Choose one profile before starting substantive work. Reclassify if new evidence changes complexity or risk.

| Profile | Use When | Working Style |
| --- | --- | --- |
| `low` | The user asks a direct question, a single command answers it, the edit is tiny and local, or the failure mode is low impact. | Answer or act directly. Use minimal exploration. Skip formal plans unless the user asks. Verify only the touched behavior when relevant. |
| `medium` | The task needs repo inspection, touches a small feature area, affects 2-5 files, has moderate ambiguity, or benefits from tests/build checks. | Gather enough context first. Use a short plan for non-trivial work. Prefer existing patterns. Run focused validation. |
| `high` | The task is architectural, security/privacy-sensitive, release-facing, data-destructive, cross-system, hard to reproduce, high ambiguity, or likely to require multiple iterations. | Build a clear plan, inspect dependencies and prior artifacts, preserve user changes carefully, validate broadly, and surface assumptions. |

If the host supports `minimal`, map it below `low` for trivial replies only. If the host supports values above `high`, reserve them for work that is both high impact and uncertain, such as irreversible operations, production incidents, or multi-service migrations.

## Escalation Rules

Escalate by one level when any of these appear:

- The first hypothesis fails or tests reveal unrelated-looking breakage.
- The task crosses module boundaries, storage boundaries, auth/permissions, billing, ads, release, or external APIs.
- The user asks for "think hard", "deep", "careful", "root cause", "audit", "review", "prove", or equivalent phrasing.
- Incorrect work could lose data, send messages, spend money, publish a release, or expose private information.

Downgrade only when the implementation path becomes obvious, the blast radius is smaller than expected, and validation is straightforward.

## Execution Rules

- Do not announce the selected profile unless it helps the user understand pace, risk, or a requested mode change.
- Never expose hidden chain-of-thought. Provide concise rationale, assumptions, plan, or verification evidence instead.
- If a real runtime setting is available, set it before doing the expensive work and mention it only if user-facing confirmation is useful.
- If no runtime setting is available, silently apply the chosen profile through workflow depth.
- Keep `low` work fast; do not over-plan trivial tasks.
- Keep `high` work evidence-driven; do not rely on memory for facts that can change or be inspected.
- When the user explicitly requests a profile, honor it unless it would be unsafe; explain any safety-driven escalation briefly.
