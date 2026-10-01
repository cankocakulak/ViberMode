# Reconciliation — 2026-10-01 (Istanbul)

W39 (September 21–27) is RECONCILING. The October 2 Friday cutoff and normal finalization gates remain in force.

- W39 iOS Store Downloads: missing → Ozard 3,528 and EasySpell 204, both 7/7 days. Android exports still end September 20; no missing days were inferred. AppsFlyer all-source first-launch installs remain 7,717 / 317, separately labelled.
- W38 Android Store Downloads: Ozard 3,127 → 3,648 and EasySpell 52 → 57; both now 7/7. The full successful reconciliation satisfied existing FINAL gates. Its canonical snapshot was read back and locked. iOS download coverage remains 6/7 and is excluded from complete comparisons.
- W39 Ozard Android usage recovered: WAU 6,804, core reach 53.51%; strict operating chain 4,898 → 3,647 → 3,194 → 243 → 17. Ozard iOS identity validation remains blocked; EasySpell iOS identity-free aggregate activity is available separately.
- W37 canonical manifest and verified archive receipt stayed unchanged. Targeted FINAL backfill recorded review candidates and applied no corrections.
- Google Sheets mirrors 1,226 canonical priority-app rows. All 1,604 formulas and 39,455 expected cells reconcile; zero formula errors/mismatches. Both app tabs were visually checked. User tabs were not mutated.
- Existing budget columns had shifted after a user-added country field. Links now resolve exact row-2 headers within fresh grid bounds. Entered actuals stay distinct from verified complete media/Business CPI.
- Product request partitions now split at padded-week boundaries, avoiding all-event collection on unrelated follow-up days. The safety cap and metric populations/calculations are unchanged. Retry used the existing authorized raw-export fallback.
- An archive transport interruption was recovered. Notion omits empty optional children arrays; comparison now treats that as equivalent without changing populated blocks or frozen archive hashes. W38 snapshot and the main report passed full readback; the second report run made zero writes.
- 132 tests passed. The presentation pass preserved all 1,388 warehouse rows and the 355-row historical downloads database.
- Business CPI remains unavailable: complete media + final attributable UGC and complete compatible store coverage are still missing. Known spend is not published as full spend.

Private run evidence: tmp/weekly-2026-10-01/, reconciliation-2026-10-01.local.json, meeting-redesign-verification.local.json and google-sheets-last-publish.local.json.
