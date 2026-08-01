# Product Ideas Slack Loop Review

Status: approved with operational note

No critical implementation defects were found after focused tests and live Slack validation.

## Residual Notes

- The existing Rox bot token does not yet carry the new `groups:write` / `channels:manage` scopes. The connected Slack user created the private channel and invited Rox, so reading, posting, editing snapshots, deleting bot messages, and thread scanning work now. Reinstall the Slack app from the updated manifest before relying on Rox itself to create future private channels or set their purpose/topic.
- Migrated legacy candidates intentionally start with zero structured ledger evidence. Existing source IDs remain in each candidate snapshot, but the daily researcher must revisit and append source-typed evidence before validation.
- The factory queue is intentionally empty after demoting `box-path` and `warranty-window`; this prevents legacy readiness labels from bypassing the new evidence and owner-decision gates.
