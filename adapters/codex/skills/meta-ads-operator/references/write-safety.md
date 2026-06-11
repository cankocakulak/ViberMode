# Meta Ads Write Safety

## Approval Classes

Read-only, no approval beyond the user's request:

- List accounts, campaigns, ad sets, ads, creatives.
- Pull insights and performance breakdowns.
- Debug token scopes when token and app credentials are already available in env.
- Generate recommendations, reports, exports, scripts, or drafts.

Low-risk writes, allowed only after the user asks for the write:

- Create objects in `PAUSED` status.
- Rename objects.
- Add labels or internal naming structure if supported.
- Duplicate winning structures in `PAUSED` status.

High-risk writes, require explicit final approval:

- Set campaign, ad set, or ad status to `ACTIVE`.
- Increase budget or bid.
- Change targeting on active ad sets.
- Pause currently spending objects.
- Delete/archive objects.
- Upload or publish new creative that will deliver immediately.

## Required Pre-Write Checklist

Before high-risk writes:

1. Identify account id and currency.
2. Identify object ids and names.
3. State current status and recent spend/performance.
4. State the exact requested change.
5. State whether money can start/stop spending.
6. Ask for a clear approval if activation, budget increase, active targeting change, pause, or delete is involved.

## Paused Draft Pattern

When creating a campaign from scratch, create in this order:

1. Campaign with `status=PAUSED`.
2. Ad set with `status=PAUSED`.
3. Creative.
4. Ad with `status=PAUSED`.
5. Read all created objects back.
6. Report ids, names, statuses, and anything that needs manual review.

Only activate after a separate explicit approval that names the created plan or object ids.

## Recommended Test Structure

Use one campaign per objective. Avoid fragmenting budget into too many ad sets. For creative tests, prefer multiple ads inside a controlled ad set unless the test specifically needs different audiences.

Minimum analysis rules:

- Require meaningful spend before judging creative winners. Use a default `min_spend` of 100 TRY when no threshold is specified.
- For conversion decisions, prioritize cost per qualified lead, purchase ROAS, and cost per purchase over CTR.
- For traffic decisions, prioritize landing page views and link CPC over all-click CPC.

## Failure Handling

If any create chain partially succeeds, do not delete automatically unless the user asked for rollback. Pause created objects if needed, then report the partial ids and exact failure.

If Meta returns a policy, objective mismatch, missing promoted object, or permissions error, stop the write workflow and summarize the missing requirement.
