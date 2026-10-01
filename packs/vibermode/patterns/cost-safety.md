# Cost safety for changes

Read this reference when a change affects database reads/writes, scheduled jobs, polling, retries, paid API calls, cloud resources, or data transfer. Skip it for changes with no such effect. Review the workload in the changed path; a backend label alone is not evidence of increased cost.

## Queries and data transfer

- Apply tenant/user/rule/time predicates in the database **before** pagination or limits. Fetching a global `LIMIT 1000` then filtering in application code both wastes transfer and can hide valid records beyond that limit.
- Select required columns, use database aggregates for counts, and bound pagination/batches. Reuse facts already fetched within the operation; preserve data freshness and isolation when caching.
- An index can reduce database work but does not by itself reduce transferred rows. Check both query count and returned rows/bytes. Do not prescribe indexes or caching without inspecting query shape and semantics.
- Use a fixture containing more irrelevant records than the limit and a matching record outside it to check scope correctness. Where volume is the risk, assert query count/returned rows as well as output correctness.

## Jobs, polling and retries

Estimate the changed path with known inputs:

`runs/day × active workers × eligible items/run × queries/item × returned rows/query × approximate bytes/row`

This is a workload estimate, not a bill. Include shared queries separately, peak overlap, retry amplification, and cache behavior. State unknown inputs and compare before/after using the same assumptions. Check whether a scheduler runs once or on every replica, concurrency is bounded, duplicate execution is prevented, and retries stop. Do not reduce cadence if product freshness requires it; choose the lowest justified workload that preserves behavior.

## Cloud resources and operations

Reuse the project's existing provider, ORM, project, database branch and environment conventions. A git branch or UI edit alone does not justify a new paid database branch/compute, provider migration, or ORM replacement. Use an isolated database branch when schema/data tests need it; record its owner, purpose, TTL/cleanup, compute bounds and any cost uncertainty. Local fixtures can often validate query semantics without remote queries.

Read-only cloud queries and EXPLAIN ANALYZE can still consume compute/transfer; avoid broad scans, repeat production probes or cost-incurring benchmarks merely to inspect code. Use existing metrics and bounded samples only when authorized. Code inspection does not authorize live provisioning or changes to database settings.

Preserve the user's existing authorization. Before a cost-incurring live operation outside that scope, identify the specific resource/action and its likely workload; do not add a blanket approval stop to ordinary local fixes. A missing price or unavailable billing account does not block a code-level review. Consult current official provider documentation when quoting pricing or provider settings; never invent currency savings.

## Evidence to carry forward

For relevant plans/tasks/reviews, record only: changed workload driver, before/after estimate or unknowns, correctness constraints, bounded verification, and unresolved cost risk. Do not claim a billing reduction from code inspection or a passing fixture. A current billing/usage comparison is required for measured savings.
