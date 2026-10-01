# Monday reporting adoption — 2026-09-28

The user authorized a Monday morning preliminary report for a 17:00–18:00 meeting. The existing heartbeat now runs Monday 09:30 and Wednesday/Friday 21:30 Europe/Istanbul; Friday finalization requirements are unchanged. See [source decisions](monday-reporting.md).

W39 (September 21–27) was freshly collected from existing providers. The initial Notion publication timed out after partial progress; publication was recovered using the exact collected snapshot and canonical-key lookup. All 510 W39 rows then passed readback. The replay does not count as another successful collection and cannot finalize the week. W39 remains preliminary. The interrupted wrapper did not reach a normal W38 fresh reconciliation; W38 remains RECONCILING for the existing subsequent schedule.

The latest FINAL missing-date check completed separately: no safe corrections were applied, eight review candidates remain unapplied. W37 canonical fingerprint and archived projection remain unchanged. The presentation-only rerun made zero writes; all warehouse rows and the 355 historical download rows remained unchanged.

Sheets Ozard/EasySpell and the hidden canonical mirror were updated for W39, preserving budget input tabs. Readback verified 1,221 mirrored canonical rows and 1,437 formulas, with no mismatch or formula error. A subsequent bounded header correction labels the completed W39 observation as “Ön veri”; its readback passed. W40 stays a budget/current-week column. Both app tabs were visually checked. Existing finalized weeks were not retrofitted with new AppsFlyer totals.

Open limitations: W39 store coverage is unavailable; Meta browser login is required and its API remains blocked; other network and finalized UGC coverage is incomplete. The new Ozard iOS product data failed the existing cross-identity paywall contract checks, and EasySpell Android release/calendar validation remains unresolved. These populations were not promoted to complete usage values. EasySpell iOS Mixpanel remains disabled.

Validation: 129 weekly/economics tests passed. Private receipts are in `tmp/weekly-2026-09-28/`, `docs/weekly-app-growth/2026-09-21.publish.local.json`, `meeting-redesign-verification.local.json`, and `google-sheets-last-publish.local.json`.
