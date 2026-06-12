---
name: "viber-revenuecat-operator"
description: "Use when the user asks to inspect, configure, create, or troubleshoot RevenueCat projects, apps, offerings, entitlements, products, SDK keys, customers, subscriber status, metrics, or API credentials."
---

# RevenueCat Operator

Read the runbook first:
- `../viber-mode/docs/operations/revenuecat-access.md`

Operational overview:
- `../viber-mode/docs/operations/codex-operational-capabilities.md`

Use the repo-owned wrapper when available:
- `node ../viber-mode/scripts/revenuecat-api.mjs`
- from a ViberMode checkout or installed support bundle: `npm run revenuecat -- <command>`

Default workflow:
1. Confirm credential presence without printing the token.
2. Read projects and project/app binding before deeper inspection.
3. Inspect offerings, entitlements, apps, SDK keys, customers, or metrics as requested.
4. Use write operations only when the user explicitly asks for mutation and the command includes the runbook's write guard.
5. Record target project/app/customer IDs, command mode, and blockers without leaking secrets.

Rules:
- Default to read-only.
- Keep RevenueCat secret API keys, OAuth tokens, customer exports, and private subscriber data out of git and chat.
- Distinguish project-scoped secret keys from account/OAuth credentials before trying project creation.
- If the request includes app paywall UI or store product catalog changes, also use the relevant app-repo or mobile monetization workflow.
