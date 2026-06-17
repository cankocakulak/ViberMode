# TikTok Ads Write Safety

TikTok Ads writes can spend money or disrupt live acquisition. Default to read-only analysis.

## Allowed Without Extra Approval

- Read advertiser, campaign, ad group, ad, creative, and report data.
- Draft a proposed action plan.
- Validate local credentials without printing secrets.

## Requires Explicit Current-Turn Approval

- Creating campaigns, ad groups, ads, identities, audiences, or creatives.
- Updating targeting, bids, budgets, schedules, placements, events, URLs, or creative material.
- Pausing or enabling existing delivery.
- Deleting or archiving anything.
- Uploading media or audiences.

## Paused-By-Default Rule

When the API supports status selection, create new delivery objects in paused/non-delivering status unless the user explicitly approves activation.

## Pre-Write Checklist

- Confirm advertiser id and object ids.
- List exact fields to change.
- List budget and delivery impact.
- Confirm attribution/optimization event assumptions.
- Confirm rollback or revert path.

## Post-Write Checklist

- Read changed objects back.
- Report ids, names, statuses, budgets, and changed fields.
- Do not print access tokens, app secrets, signed upload URLs, or private media URLs.
