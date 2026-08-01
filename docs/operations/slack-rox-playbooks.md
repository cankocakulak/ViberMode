# Rox Slack Playbooks

Use these playbooks after resolving the whole Slack thread with `npm run slack:rox:context -- resolve`. They are operational defaults, not exact command templates.

## Shared Playbooks

### `shared#read-first-investigation`

Use for “bak”, “neden”, “kontrol et”, screenshots, videos, or unclear symptoms.

1. Resolve app/surface from thread and channel.
2. Read available evidence and inspect the relevant system read-only.
3. State the most likely cause with evidence.
4. If the fix is low-risk and bounded, apply and validate it; otherwise ask one concrete question.

### `shared#bounded-repo-change`

Use for app bugs, UI problems, missing behavior, or small features without a narrower playbook.

1. Resolve repo/platform and inspect worktree.
2. Reproduce or trace the issue.
3. Use `repo-change`; create `codex/slack-[slug]` when a branch is needed.
4. Run focused tests/build/smoke validation.
5. Push/open PR when repo policy allows; never silently write a protected branch.

### `shared#status`

Read active-thread state, branch/PR/build/provider evidence, and the latest blocker. Answer with one of: working, completed, blocked, waiting for user, waiting for approval. Do not start the task again.

### `shared#context-update`

Update active task context immediately. Store reusable project facts as sourced provisional context. Promote to durable context only after explicit owner approval. Never store secrets or customer data.

### `shared#cancel-confirmation`

Treat explicit cancellation from the requester or owner as authoritative. Treat jokes, frustration, or third-party side chatter as non-authoritative until confirmed.

## Growth Playbooks

### `growth#mobile-internal-release`

Interpret internal-test intent semantically, including typo-heavy variants of “teste gönder”, “iki build”, “TestFlight”, “Play internal”, or “AAB upload”.

1. Resolve app, platforms, source ref, manifests, and store identities.
2. If both platforms are requested or naturally resolved, run iOS then Android; one blocker must not suppress the other lane.
3. Require clean source, exact commit SHA, quality gates, and submitter preflight.
4. Owner internal-test intent is approval after gates pass.
5. Report per platform: uploaded or exact blocker.

### `growth#final-submit-existing-build`

Use only for store-review intent for builds already uploaded internally. Verify build identity and store declarations. Never rebuild or rerun internal upload unless the owner also requests testing. If no adapter exists, report `UNSUPPORTED_FINAL_SUBMIT_ADAPTER` plus the precise manual step.

### `growth#main-update`

Prepare/update a PR targeting the default branch. Do not direct-push or merge a protected branch unless explicit owner approval and repo policy both permit it.

### `growth#analytics-event-gap`

1. Identify expected event, platform, time window, user/session scope when available.
2. Trace event creation, property mapping, identity, transport, and destination configuration.
3. Compare with a nearby working event.
4. Fix bounded app-side gaps and validate locally.
5. If destination query access is missing, say so immediately and provide the app-side evidence already verified.

Common event families include paywall view, purchase start/completion, restore, login, subscription state, paywall context, and session identifiers. Preserve each repo’s established naming contract.

### `growth#attribution-health`

Use [mobile-attribution-appsflyer-setup.md](mobile-attribution-appsflyer-setup.md) and the `mobile-attribution-operator` skill.

1. Verify app identity and SDK/RevenueCat wiring.
2. Read AppsFlyer and partner integration state when access exists.
3. Separate configured state from runtime proof.
4. Request or perform a fresh internal install/first-open test when runtime evidence is missing.
5. Record iOS and Android independently.

### `growth#payment-analytics-reconcile`

Start read-only. Fix a time window and compare provider transaction truth, backend state, analytics identity, event dedupe, ingestion, and dashboard filters. Payment mutation remains owner-gated. Missing Mixpanel query access is a capability blocker, not a reason to redo repo discovery.

## Customer Success Playbooks

Use only the minimum personal data required for the active task. Prefer account IDs over copied exports and redact Slack/report output.

### `customer-success#login-auth-readonly`

Resolve surface: web, mobile, tablet, or control center. Check account existence/status, auth logs/session behavior, client error, backend response, and deployment version. Do not reset credentials or expose password data without an approved path.

### `customer-success#subscription-entitlement-readonly`

Compare payment/provider state, backend subscription record, RevenueCat customer/entitlement, app-user identity, platform receipt, and client cache. State the mismatch before proposing mutation. Trial, transfer, cancellation, or entitlement writes require owner approval.

### `customer-success#checkout-payment-readonly`

Compare checkout request, Stripe/provider result, webhook delivery, backend persistence, and client result. Refunds, discounts, cancellations, invoice changes, and subscription writes require owner approval.

### `customer-success#notification-delay-readonly`

Collect the event timestamp and notification type. Compare enqueue time, worker processing time, provider/API result, retry state, and queue backlog distribution. Distinguish queue latency from provider delivery latency before changing workers or production state.

### `customer-success#student-search-deploy-mismatch`

Compare canonical account data, backend search behavior, control-center query/filter behavior, deployed commit/version, and any open PR containing the fix. Do not claim a merged but undeployed fix is live.

### `customer-success#external-integration-status`

Separate repo-owned code from external admin configuration. For Intercom/Stripe-style connections, inspect app bootstrap/config and current dashboard state when access exists. If reconnection requires an admin session, 2FA, or vendor permission, report the exact manual blocker instead of searching unrelated repos.

## Product Research Playbooks

These playbooks apply to the configured `#product-ideas` channel. Resolve `idea_id` from the active root thread and use `ideas/research/[idea-id]/` in the private state repo as truth.

### `product-research#validate-or-deepen`

Read the current candidate, evidence, decisions, and evaluation. Research the named question across the relevant evidence class, append sourced evidence, run `research:ledger evaluate`, update the Slack root snapshot, and post a thread delta only when the result materially changed. Do not invent market totals or revenue estimates.

### `product-research#compare-market`

Compare the smallest useful competitor set on audience, job-to-be-done, positioning, pricing, review pain, supply density, and the proposed wedge. Store each sourced observation with capture date. State unavailable revenue/download figures as unknown instead of substituting ratings or rank as revenue proof.

### `product-research#park`

Require a configured owner. Record a `park` decision with the Slack permalink and reason, update the root snapshot, and keep prior evidence/evaluations intact. Parking means "revisit later," not rejection.

### `product-research#reject`

Require a configured owner. Record a `reject` decision with the Slack permalink and concrete reason. Preserve the thread and ledger so future research can explain why the direction was closed.

### `product-research#promote-brainstorm`

Require a configured owner and `evaluation.eligible_for.brainstorm=true`. Record approval, then run brainstorm with `research_context`. If the evidence gate fails, reply with the exact missing checks instead of generating an unsupported product direction.

### `product-research#promote-prd`

Require a configured owner, prior brainstorm approval, and `evaluation.eligible_for.prd=true`. Record approval and create the PRD with a sourced Research Basis. Material target-user/problem/wedge changes return to validation.

### `product-research#status`

Report current research status, score, evidence classes, missing checks, last evaluation time, and next eligible gate. Read-only; do not promote or change status.

## Reply Shape

Start:

```text
Bakiyorum: [app/surface], [investigation or change], [validation/delivery].
```

Done:

```text
Tamamlandi: [result]. Kanit: [test/build/PR/link].
```

Blocked or question:

```text
Blokaj: [exact blocker]. Devam icin gereken tek sey: [input or approval].
```

Keep replies to one sentence or up to three short bullets unless the owner must review a consequential action plan.
