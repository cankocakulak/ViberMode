import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  appendEvidence,
  dailyMaintenancePlan,
  evaluateIdea,
  ideaSnapshot,
  importBacklog,
  initializeIdea,
  recordDecision,
  reconcileBacklog,
} from "../scripts/idea-research-ledger.mjs";

function fixture() {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "idea-ledger-"));
  const payload = {
    id: "focus-room",
    title: "Focus Room",
    app_name: "Focus Room",
    product_idea: "A structured focus companion for remote students.",
    problem_statement: "Remote students struggle to start and sustain focused study sessions.",
    target_user: "Remote university students who study alone",
    specific_gap: "Existing timers do not create lightweight accountability around a real study plan.",
    mvp_wedge: "Plan one session, enter a quiet room, and receive a completion recap.",
    metric_snapshot: {
      known: ["competitor count"],
      unknown: ["paid conversion", "total addressable users"]
    },
    selection_rationale: {
      chosen_because: "Repeated pain appears outside app stores and the wedge is narrow.",
      evidence_summary: "Store supply, Reddit pain, and competitor gaps point to an accountability gap.",
      audience_logic: "Remote students already use timers and study communities.",
      competitor_gap: "Timers track minutes but do not connect intention, presence, and recap.",
      why_this_wedge: "A single-session loop is testable without a dense social graph.",
      why_not_alternatives: "A generic habit tracker does not address study accountability.",
      tradeoffs: "Community density may be difficult at launch.",
      confidence: 0.72,
      follow_up_questions: ["Will users join asynchronous rooms?"]
    }
  };
  initializeIdea({ stateRoot, payload });
  return { stateRoot, payload };
}

function evidence() {
  return [
    {
      type: "app_supply",
      source_url: "https://apps.apple.com/example",
      summary: "Twenty relevant focus timers were found; most lead with generic Pomodoro features.",
      metric: "relevant_apps",
      value: 20,
      unit: "apps",
      confidence: 0.8
    },
    {
      type: "community_pain",
      source_url: "https://www.reddit.com/r/GetStudying/example",
      summary: "Students repeatedly ask for accountability when studying alone.",
      confidence: 0.75
    },
    {
      type: "competitor_gap",
      source_url: "https://example.com/competitor-review",
      summary: "Comparable products expose timers but no intention-to-recap loop.",
      confidence: 0.7
    },
    {
      type: "audience_proxy",
      source_url: "https://example.com/enrollment-data",
      summary: "Distance-learning enrollment provides a bounded audience proxy.",
      metric: "distance_students",
      value: 1000000,
      unit: "people",
      confidence: 0.6
    },
    {
      type: "pricing",
      source_url: "https://example.com/pricing",
      summary: "Adjacent focus products charge monthly subscriptions.",
      confidence: 0.65
    }
  ];
}

test("validates an idea only after store and non-store evidence are both present", () => {
  const { stateRoot } = fixture();
  appendEvidence({ stateRoot, ideaId: "focus-room", entries: evidence() });
  const result = evaluateIdea({ stateRoot, ideaId: "focus-room", at: new Date("2026-07-18T10:00:00.000Z") });
  assert.equal(result.evaluation.recommendation, "validated");
  assert.equal(result.evaluation.eligible_for.brainstorm, true);
  assert.ok(result.evaluation.score >= 65);
  assert.deepEqual(result.evaluation.missing_checks, []);
  assert.equal(ideaSnapshot({ stateRoot, ideaId: "focus-room" }).candidate.research_status, "validated");
});

test("keeps evidence append-only and deduplicates repeated observations", () => {
  const { stateRoot } = fixture();
  const first = appendEvidence({ stateRoot, ideaId: "focus-room", entries: [evidence()[0]] });
  const second = appendEvidence({ stateRoot, ideaId: "focus-room", entries: [evidence()[0]] });
  assert.equal(first.appended.length, 1);
  assert.equal(second.appended.length, 0);
  assert.equal(second.duplicates.length, 1);
  assert.equal(ideaSnapshot({ stateRoot, ideaId: "focus-room" }).evidence.length, 1);
});

test("does not let contradictory competitor evidence satisfy the validation gate", () => {
  const { stateRoot } = fixture();
  const entries = evidence().map((item) => (
    item.type === "competitor_gap"
      ? { ...item, direction: "contradicts", summary: "A direct competitor already ships the proposed intention-to-recap loop." }
      : item
  ));
  appendEvidence({ stateRoot, ideaId: "focus-room", entries });
  const result = evaluateIdea({ stateRoot, ideaId: "focus-room", at: new Date("2026-07-18T10:00:00.000Z") });
  assert.equal(result.evaluation.recommendation, "researching");
  assert.equal(result.evaluation.checks.competitor_gap_supported, false);
  assert.equal(result.evaluation.checks.no_strong_competitor_contradiction, false);
  assert.equal(result.evaluation.contradicting_evidence_count, 1);
  assert.equal(result.evaluation.score_parts.contradiction_penalty, -10);
  assert.equal(result.evaluation.eligible_for.brainstorm, false);
});

test("requires validation before promotion and records decision history", () => {
  const { stateRoot } = fixture();
  assert.throws(() => recordDecision({
    stateRoot,
    ideaId: "focus-room",
    type: "approve_brainstorm",
    reason: "Looks useful"
  }), /not eligible/);

  appendEvidence({ stateRoot, ideaId: "focus-room", entries: evidence() });
  evaluateIdea({ stateRoot, ideaId: "focus-room", at: new Date("2026-07-18T10:00:00.000Z") });
  recordDecision({
    stateRoot,
    ideaId: "focus-room",
    type: "approve_brainstorm",
    reason: "Evidence gate passed",
    actor: "UOWNER",
    sourceUrl: "slack://CIDEAS/123"
  });
  const snapshot = ideaSnapshot({ stateRoot, ideaId: "focus-room" });
  assert.equal(snapshot.candidate.research_status, "brainstorm-approved");
  assert.equal(snapshot.decisions.length, 1);
  assert.equal(snapshot.decisions[0].previous_status, "validated");
});

test("writes immutable timestamped evaluations plus a current snapshot", () => {
  const { stateRoot } = fixture();
  appendEvidence({ stateRoot, ideaId: "focus-room", entries: evidence() });
  evaluateIdea({ stateRoot, ideaId: "focus-room", at: new Date("2026-07-18T10:00:00.000Z") });
  evaluateIdea({ stateRoot, ideaId: "focus-room", at: new Date("2026-07-19T10:00:00.000Z") });
  const evaluationDir = path.join(stateRoot, "ideas", "research", "focus-room", "evaluations");
  assert.equal(fs.readdirSync(evaluationDir).length, 2);
  assert.ok(fs.existsSync(path.join(stateRoot, "ideas", "research", "focus-room", "evaluation.json")));
});

test("imports a backlog idempotently without treating old ready status as validation", () => {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "idea-ledger-import-"));
  const payload = { ideas: [
    { id: "old-ready", title: "Old Ready", app_name: "Old Ready", status: "ready", product_idea: "An older candidate." },
    { id: "old-shipped", title: "Old Shipped", app_name: "Old Shipped", status: "shipped", product_idea: "A shipped candidate." }
  ] };
  const first = importBacklog({ stateRoot, payload });
  const second = importBacklog({ stateRoot, payload });
  assert.deepEqual(first.imported, ["old-ready", "old-shipped"]);
  assert.deepEqual(second.skipped, ["old-ready", "old-shipped"]);
  const ready = ideaSnapshot({ stateRoot, ideaId: "old-ready" }).candidate;
  assert.equal(ready.research_status, "observed");
  assert.equal(ready.factory_status, "ready");
});

test("demotes factory-ready backlog ideas that have not passed the stable ledger gate", () => {
  const { stateRoot, payload } = fixture();
  const backlogPath = path.join(stateRoot, "ideas", "backlog.json");
  fs.mkdirSync(path.dirname(backlogPath), { recursive: true });
  fs.writeFileSync(backlogPath, `${JSON.stringify({ schema_version: 1, ideas: [{ ...payload, status: "ready" }] }, null, 2)}\n`);
  const preview = reconcileBacklog({ stateRoot, backlogPath });
  assert.equal(preview.demoted.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(backlogPath)).ideas[0].status, "ready");
  reconcileBacklog({ stateRoot, backlogPath, write: true });
  const reconciled = JSON.parse(fs.readFileSync(backlogPath));
  assert.equal(reconciled.ideas[0].status, "researching");
  assert.equal(reconciled.ideas[0].research.revalidation_required, true);
});

test("daily maintenance plan cools down recent ideas and respects external-input blockers", () => {
  const { stateRoot } = fixture();
  appendEvidence({ stateRoot, ideaId: "focus-room", entries: evidence() });
  evaluateIdea({ stateRoot, ideaId: "focus-room", at: new Date("2026-07-20T10:00:00.000Z") });
  initializeIdea({
    stateRoot,
    payload: {
      id: "interview-only",
      title: "Interview Only",
      research_schedule: {
        automation_state: "blocked_external_input",
        blocked_on: ["direct_interviews"],
        reason: "Direct interviews are required before another public scan."
      }
    }
  });

  const recent = dailyMaintenancePlan({ stateRoot, at: new Date("2026-07-23T10:00:00.000Z"), cooldownDays: 7 });
  assert.equal(recent.cooldown.some((item) => item.idea_id === "focus-room"), true);
  assert.equal(recent.due.some((item) => item.idea_id === "focus-room"), false);
  assert.equal(recent.blocked.some((item) => item.idea_id === "interview-only"), true);

  const stale = dailyMaintenancePlan({ stateRoot, at: new Date("2026-07-28T10:00:00.000Z"), cooldownDays: 7 });
  assert.equal(stale.due.some((item) => item.idea_id === "focus-room"), true);
});
