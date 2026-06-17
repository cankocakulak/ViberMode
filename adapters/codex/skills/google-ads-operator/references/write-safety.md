# Google Ads Write Safety

Google Ads writes can spend money or disrupt live acquisition. Default to read-only analysis.

## Allowed Without Extra Approval

- Read accessible customers and reporting data.
- Draft a proposed action plan.
- Validate local credentials without printing secrets.

## Requires Explicit Current-Turn Approval

- Creating campaigns, ad groups, ads, keywords, assets, asset groups, audiences, or conversion actions.
- Updating targeting, bids, budgets, schedules, placements, URLs, tracking templates, or creative material.
- Pausing, enabling, or removing existing delivery.
- Uploading offline conversions, customer match data, or audience data.

## Paused-By-Default Rule

Create new delivery objects in `PAUSED` status unless the user explicitly approves activation.

## Pre-Write Checklist

- Confirm customer id and login customer id.
- List exact resource names and fields to mutate.
- List budget and delivery impact.
- Confirm conversion/attribution assumptions.
- Confirm rollback or revert path.

## Post-Write Checklist

- Read changed resources back.
- Report resource names, ids, statuses, budgets, and changed fields.
- Do not print developer tokens, service account JSON, refresh tokens, client secrets, upload payloads, or private media URLs.
