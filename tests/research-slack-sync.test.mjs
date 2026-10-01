import assert from "node:assert/strict";
import test from "node:test";

import {
  channelReportAlreadySent,
  contentHash,
  renderDelta,
  renderIdeaMessage,
  renderResearchThread,
} from "../scripts/research-slack-sync.mjs";

const snapshot = {
  candidate: {
    id: "focus-room",
    title: "Focus Room",
    research_status: "validated",
    problem_statement: "Students struggle to focus alone.",
    target_user: "Remote students",
    mvp_wedge: "A planned focus room with a completion recap.",
    market_thesis: {
      distribution_angle: "Student communities and study creators.",
    },
    competitors: ["Forest", "Flora"],
    selection_rationale: {
      chosen_because: "Pain appears in communities and current timers miss accountability.",
      audience_logic: "Remote students are reachable and repeat this workflow every week.",
      competitor_gap: "Current timers do not close the loop with accountability.",
      tradeoffs: "Retention depends on repeated study routines.",
      follow_up_questions: ["Will students return for the recap?"],
    }
  },
  evaluation: {
    evaluated_at: "2026-07-20T08:00:00.000Z",
    recommendation: "validated",
    score: 76,
    confidence: 0.71,
    missing_checks: [],
    evidence_count: 5,
    supporting_evidence_count: 4,
    contradicting_evidence_count: 1,
    eligible_for: { brainstorm: true }
  },
  evidence: [
    { type: "app_supply", summary: "Twenty generic timers found.", metric: "apps", value: 20, unit: "apps" },
    {
      type: "community_pain",
      summary: "Students ask for accountability.",
      source_url: "https://www.reddit.com/r/GetStudying/example",
    },
    { type: "competitor_gap", summary: "No intention-to-recap loop." },
    { type: "pricing", summary: "Comparable apps sell annual plans." },
    { type: "competitor_gap", direction: "contradicts", summary: "One incumbent recently added group rooms." },
  ]
};

test("renders a simple Turkish root message without research detail", () => {
  const message = renderIdeaMessage(snapshot);
  assert.match(message, /\*Focus Room\*/);
  assert.match(message, /\*Kim için:\*/);
  assert.match(message, /\*Çözdüğü sorun:\*/);
  assert.doesNotMatch(message, /güncellemeler bu mesajın thread'inde/);
  assert.doesNotMatch(message, /76\/100/);
  assert.doesNotMatch(message, /Reddit/);
  assert.ok(message.length < 1500);
  assert.equal(contentHash(message), contentHash(message));
});

test("renders the detailed research in the idea thread", () => {
  const message = renderResearchThread(snapshot, { initial: true });
  assert.match(message, /İlk araştırma özeti · Focus Room/);
  assert.match(message, /\*Neden bu fikir\?\*/);
  assert.match(message, /\*Pazar ve kitle yorumu\*/);
  assert.match(message, /\*Reddit ve topluluk analizi\*/);
  assert.match(message, /reddit\.com\/r\/GetStudying/);
  assert.match(message, /\*Rakipler ve ürün boşluğu\*/);
  assert.match(message, /\*Fiyatlandırma ve gelir sinyalleri\*/);
  assert.match(message, /\*Karşı sinyaller ve riskler\*/);
  assert.ok(message.length < 8000);
  assert.match(message, /Araştırma kapsamı/);
  assert.match(message, /Ticari değerlendirme yenilenmeli/);
  assert.doesNotMatch(message, /\*Güven:\*|%71/);
});

test("posts only material evaluation deltas in Turkish", () => {
  const previous = { recommendation: "researching", score: 54, evidence_count: 3, missing_checks: ["competitor_gap_supported"] };
  const current = { recommendation: "validated", score: 76, evidence_count: 5, missing_checks: [] };
  const delta = renderDelta(previous, current);
  assert.match(delta, /öneri araştırılıyor → ön araştırma eşiğini geçti/);
  assert.match(delta, /kapanan kontroller: desteklenen rakip boşluğu/);
  assert.equal(renderDelta(current, current), null);
});

test("commercial evidence changes produce a delta even when coverage is unchanged", () => {
  const previous = { ...snapshot.evaluation, commercial_assessment: null };
  const assessment = { label: "Ticari karşılık henüz gösterilemedi", missing_dimensions: ["demand"], dimensions: { demand: { label: "Talep", status: "unknown", next_check: "Hedef iş için talebi ölç." } } };
  const current = { ...previous, commercial_assessment: assessment };
  assert.match(renderDelta(previous, current), /ticari değerlendirme güncellendi/);
  assert.equal(renderDelta(current, current), null);
  const message = renderResearchThread({ ...snapshot, evaluation: current });
  assert.match(message, /Ticari karşılık henüz gösterilemedi/);
  assert.match(message, /Hedef iş için talebi ölç/);
});

test("deduplicates an explicitly requested cross-idea digest", () => {
  const hash = contentHash("daily report");
  const state = { channel_id: "CIDEAS", content_hash: hash, message_ts: "123.456" };
  assert.equal(channelReportAlreadySent(state, "CIDEAS", hash), true);
  assert.equal(channelReportAlreadySent(state, "COTHER", hash), false);
  assert.equal(channelReportAlreadySent(state, "CIDEAS", contentHash("changed")), false);
});
