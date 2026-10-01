# Commercial evidence contract v1

Read this contract before evaluating or publishing any idea. It applies to new discovery and user-proposed ideas. Research coverage is not commercial attractiveness; recorded source confidence is not a probability of success. `validated` means the preliminary research gate passed, not that the product, payment conversion, retention or profit is proven. Owner decisions remain mandatory.

## Six dimensions

Show demand, monetization, competition, distribution, repeat use and economics separately. The first four require source-linked signals before the preliminary gate passes. The latter two remain visible open risks even when that gate passes. Do not start expensive product/learning experiments before answering the cheapest decisive demand question. Never fabricate observations to satisfy this gate. No gate passage is required to research, retain or discuss an interesting hypothesis.

Prices, review totals, subreddit subscribers, category population and advertised features are useful context; they are not measured sales, active target users, successful acquisition or an observed product flow. Nearby-category evidence stays `adjacent` and cannot pass the direct-market gate. Estimated app revenue can establish a comparable-market signal, not our willingness-to-pay or profit.

## Evidence shape

Keep existing evidence records append-only. Add reviewed observations through `research:ledger -- evidence --file ...`; do not mass-label legacy records as verified. Each commercial observation uses the regular source URL/path, summary, observed_at, expires_at (explicit review date), direction and confidence, plus:

```json
{
  "type": "revenue_signal",
  "metric": "revenue",
  "value": 1234,
  "unit": "USD",
  "commercial": {
    "dimension": "monetization",
    "relevance": "direct",
    "scope_fit": "Explain how this named comparable serves this candidate's target job and buyer",
    "basis": "estimate",
    "country": "US",
    "platform": "iOS",
    "population": "Explicit app IDs or test cohort; never imply a single app is the whole market",
    "currency": "USD",
    "period_start": "2026-08-01",
    "period_end": "2026-08-31"
  }
}
```

The number above is an illustrative schema value, not research evidence. Use only actual sourced numeric values. Accepted types/metrics are defined in `scripts/research-commercial-assessment.mjs`: demand uses downloads/active users/real search volume/buyers/paid conversions; monetization uses revenue/buyers/paid conversions; distribution uses qualified visits/activated users/buyers; repeat use uses repeat users/rate; economics uses contribution margin in an explicit currency. Competition requires a directly observed, dated comparison. Declare the named population, denominator and measurement method in the summary; raw keyword scores are not search volume. State estimate ranges, assumptions and costs in the source artifact. Negative/zero observations and contradictory evidence cannot count as support. Missing observations remain unknown. The gate verifies structure and classification, not the truth of source claims; the researcher must inspect sources.

Use candidate `commercial_case.<dimension>.next_check` to replace a generic question with a concrete smallest next check. Keep human decision notes, source links, counterarguments, stop conditions and cost assumptions in the candidate/report. Call `research:ledger -- evaluate` before promotion or a material publication; schema-v2 scores cannot authorize promotion. Do not bulk re-evaluate old ideas merely to reset their research recency.

## Research and bulletin rhythm

Start from market signals → user job → alternatives → reachable segment → payment/repeat behavior → differentiated small hypothesis. Successful crowded categories may contain better opportunities than empty micro niches. Do not force a brand-new niche every day, restrict all runs to the US, or treat education as only adult hobby training. Choose the most useful answerable question across education segments and countries; explain the selected scope and maintain a recent coverage record.

When authorized, publish one short bulletin per stream/date containing the conclusion, source/date/scope, contrary explanation, commercial unknown, next inexpensive check and exact Notion link. A useful market observation, disconfirmation, user-idea evaluation or follow-up qualifies; no new idea card is required. Preserve stable idea roots and deduplicate deliveries. Do not publish unchanged blockers.

## Existing product card

Maintain trigger → buyer/user → promise → first value → return reason → payment reason → acquisition path → evidence type/source/date → next test. Distinguish store claim, directly observed flow, user review, measured own funnel and hypothesis. For each product compare three close competitors before expanding the list again. Track paid search, organic search/content, creators, schools/teachers, community and referral only where relevant; visibility is not acquisition efficiency. Connect creative hook → demonstrated user job → landing/store promise → activation/repeat/payment measurement. Preserve historical country cohorts and measure near competitors separately from broad category references.
