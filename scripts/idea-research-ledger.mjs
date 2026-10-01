#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessCommercialEvidence } from "./research-commercial-assessment.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultStateRoot = path.join(os.homedir(), "ViberModeWorkspaces", "app-factory-state");

export const RESEARCH_STATUSES = new Set([
  "observed",
  "researching",
  "validated",
  "brainstorm-approved",
  "prd-approved",
  "ready",
  "parked",
  "rejected",
]);

export const EVIDENCE_TYPES = new Set([
  "app_supply",
  "market_size",
  "revenue_signal",
  "growth_signal",
  "community_pain",
  "keyword_demand",
  "audience_proxy",
  "competitor_gap",
  "pricing",
  "user_interview",
  "factory_outcome",
  "payment_signal",
  "acquisition_signal",
  "usage_signal",
  "unit_economics",
]);

export const EVIDENCE_DIRECTIONS = new Set(["supports", "contradicts", "neutral"]);

const DECISION_TYPES = new Set([
  "note",
  "request_validation",
  "park",
  "reject",
  "reopen",
  "approve_brainstorm",
  "approve_prd",
  "mark_ready",
]);

const DEMAND_TYPES = new Set(["community_pain", "keyword_demand", "audience_proxy", "user_interview"]);

export function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith("--")) {
      args._.push(raw);
      continue;
    }
    const equals = raw.indexOf("=");
    if (equals !== -1) {
      args[raw.slice(2, equals)] = raw.slice(equals + 1);
      continue;
    }
    const key = raw.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function nowIso() {
  return new Date().toISOString();
}

function requireValue(name, value) {
  if (value === undefined || value === null || value === "") throw new Error(`${name} is required`);
  return value;
}

function cleanId(value) {
  const id = String(requireValue("idea id", value)).trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(id)) {
    throw new Error(`idea id must be a lowercase slug: ${value}`);
  }
  return id;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at ${filePath}:${index + 1}: ${error.message}`);
      }
    });
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, filePath);
}

function appendJsonLine(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, { mode: 0o600 });
}

export function resolveStateRoot(args = {}) {
  return path.resolve(args["state-root"] || process.env.APP_FACTORY_STATE_ROOT || defaultStateRoot);
}

export function ideaDirectory(stateRoot, ideaId) {
  return path.join(path.resolve(stateRoot), "ideas", "research", cleanId(ideaId));
}

function candidatePath(stateRoot, ideaId) {
  return path.join(ideaDirectory(stateRoot, ideaId), "candidate.json");
}

function loadCandidate(stateRoot, ideaId) {
  const target = candidatePath(stateRoot, ideaId);
  if (!fs.existsSync(target)) throw new Error(`Idea not found: ${cleanId(ideaId)}`);
  return readJson(target);
}

function saveCandidate(stateRoot, candidate) {
  candidate.updated_at = nowIso();
  writeJsonAtomic(candidatePath(stateRoot, candidate.id), candidate);
}

function sourceCandidate(payload, requestedId) {
  if (Array.isArray(payload)) {
    if (!requestedId && payload.length !== 1) throw new Error("--idea-id is required when the candidate file contains multiple entries");
    return requestedId ? payload.find((item) => item.id === requestedId) : payload[0];
  }
  const list = payload.candidates || payload.ideas;
  if (Array.isArray(list)) {
    if (!requestedId && list.length !== 1) throw new Error("--idea-id is required when the candidate file contains multiple entries");
    return requestedId ? list.find((item) => item.id === requestedId) : list[0];
  }
  return payload.candidate || payload.idea || payload;
}

function normalizeCandidate(raw, requestedId) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Candidate must be a JSON object");
  const id = cleanId(requestedId || raw.id);
  const importedStatus = RESEARCH_STATUSES.has(raw.research_status) ? raw.research_status : "observed";
  const createdAt = raw.created_at || nowIso();
  return {
    ...raw,
    id,
    title: requireValue("candidate.title", raw.title || raw.app_name),
    research_status: importedStatus,
    factory_status: raw.factory_status || raw.status || null,
    created_at: createdAt,
    updated_at: nowIso(),
    slack: raw.slack || null,
    research_contract_version: 1,
  };
}

export function initializeIdea({ stateRoot, payload, ideaId, replace = false }) {
  const raw = sourceCandidate(payload, ideaId);
  if (!raw) throw new Error(`Candidate not found in input: ${ideaId || "single candidate"}`);
  const candidate = normalizeCandidate(raw, ideaId);
  const target = candidatePath(stateRoot, candidate.id);
  if (fs.existsSync(target) && !replace) throw new Error(`Idea already exists: ${candidate.id}. Use --replace to refresh its snapshot.`);
  if (fs.existsSync(target)) {
    const existing = readJson(target);
    candidate.created_at = existing.created_at || candidate.created_at;
    candidate.slack = existing.slack || candidate.slack;
    candidate.research_status = existing.research_status || candidate.research_status;
  }
  saveCandidate(stateRoot, candidate);
  return { status: fs.existsSync(target) && replace ? "refreshed" : "initialized", candidate, idea_dir: ideaDirectory(stateRoot, candidate.id) };
}

export function importBacklog({ stateRoot, payload, replace = false }) {
  const entries = Array.isArray(payload) ? payload : payload.ideas || payload.candidates;
  if (!Array.isArray(entries)) throw new Error("Backlog import requires an ideas or candidates array");
  const imported = [];
  const refreshed = [];
  const skipped = [];
  for (const entry of entries) {
    const id = cleanId(entry.id);
    const exists = fs.existsSync(candidatePath(stateRoot, id));
    if (exists && !replace) {
      skipped.push(id);
      continue;
    }
    initializeIdea({ stateRoot, payload: entry, replace });
    (exists ? refreshed : imported).push(id);
  }
  return { status: "complete", imported, refreshed, skipped };
}

function evidenceId(evidence) {
  const material = [
    evidence.idea_id,
    evidence.type,
    evidence.direction,
    evidence.source_url || evidence.source_path,
    evidence.metric || "",
    evidence.value ?? "",
    evidence.summary,
  ].join("|");
  return `ev-${crypto.createHash("sha256").update(material).digest("hex").slice(0, 16)}`;
}

function normalizeEvidence(raw, ideaId) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Evidence must be a JSON object");
  const type = requireValue("evidence.type", raw.type);
  if (!EVIDENCE_TYPES.has(type)) throw new Error(`Unsupported evidence type: ${type}`);
  const sourceUrl = raw.source_url || null;
  const sourcePath = raw.source_path || null;
  if (!sourceUrl && !sourcePath) throw new Error("Evidence requires source_url or source_path");
  if (sourceUrl && !/^https?:\/\//.test(sourceUrl) && !sourceUrl.startsWith("slack://")) {
    throw new Error("evidence.source_url must use http(s):// or slack://");
  }
  const confidence = raw.confidence === undefined ? 0.5 : Number(raw.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error("evidence.confidence must be between 0 and 1");
  const direction = raw.direction || "supports";
  if (!EVIDENCE_DIRECTIONS.has(direction)) {
    throw new Error(`Unsupported evidence direction: ${direction}`);
  }
  const evidence = {
    ...raw,
    idea_id: cleanId(ideaId || raw.idea_id),
    type,
    source_id: raw.source_id || null,
    source_url: sourceUrl,
    source_path: sourcePath,
    observed_at: raw.observed_at || nowIso(),
    summary: requireValue("evidence.summary", raw.summary),
    direction,
    confidence,
    expires_at: raw.expires_at || null,
    recorded_at: nowIso(),
  };
  evidence.id = raw.id || evidenceId(evidence);
  return evidence;
}

export function appendEvidence({ stateRoot, ideaId, entries }) {
  const candidate = loadCandidate(stateRoot, ideaId);
  const target = path.join(ideaDirectory(stateRoot, candidate.id), "evidence.jsonl");
  const existingIds = new Set(readJsonLines(target).map((item) => item.id));
  const appended = [];
  const duplicates = [];
  for (const raw of entries) {
    const evidence = normalizeEvidence(raw, candidate.id);
    if (existingIds.has(evidence.id)) {
      duplicates.push(evidence.id);
      continue;
    }
    appendJsonLine(target, evidence);
    existingIds.add(evidence.id);
    appended.push(evidence);
  }
  if (appended.length > 0 && candidate.research_status === "observed") {
    candidate.research_status = "researching";
    saveCandidate(stateRoot, candidate);
  }
  return { status: "complete", idea_id: candidate.id, appended, duplicates, evidence_path: target };
}

function activeEvidence(entries, at = new Date()) {
  return entries.filter((item) => !item.expires_at || Date.parse(item.expires_at) >= at.getTime());
}

function nonEmpty(value) {
  return Boolean(typeof value === "string" ? value.trim() : value);
}

function selectionRationaleComplete(candidate) {
  const rationale = candidate.selection_rationale;
  return Boolean(
    rationale
    && nonEmpty(rationale.chosen_because)
    && nonEmpty(rationale.evidence_summary)
    && nonEmpty(rationale.audience_logic)
    && nonEmpty(rationale.competitor_gap)
    && nonEmpty(rationale.why_this_wedge)
    && nonEmpty(rationale.why_not_alternatives)
    && nonEmpty(rationale.tradeoffs)
    && nonEmpty(rationale.confidence)
    && Array.isArray(rationale.follow_up_questions)
    && rationale.follow_up_questions.length > 0,
  );
}

function metricsExplicit(candidate, evidence) {
  const snapshot = candidate.metric_snapshot;
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    if (Array.isArray(snapshot.known) || Array.isArray(snapshot.unknown)) return true;
    if (Object.keys(snapshot).length > 0) return true;
  }
  return evidence.some((item) => item.metric && item.value !== undefined && item.value !== null);
}

function unresolvedCriticalBlockers(candidate) {
  return (candidate.blockers || []).filter((blocker) => (
    typeof blocker === "object"
    && blocker.severity === "critical"
    && blocker.status !== "resolved"
  ));
}

export function evaluateIdea({ stateRoot, ideaId, at = new Date() }) {
  const candidate = loadCandidate(stateRoot, ideaId);
  const directory = ideaDirectory(stateRoot, candidate.id);
  const allEvidence = readJsonLines(path.join(directory, "evidence.jsonl"));
  const evidence = activeEvidence(allEvidence, at);
  const evidenceTypes = new Set(evidence.map((item) => item.type));
  const supportingEvidence = evidence.filter((item) => (item.direction || "supports") === "supports");
  const contradictingEvidence = evidence.filter((item) => item.direction === "contradicts");
  const supportingEvidenceTypes = new Set(supportingEvidence.map((item) => item.type));
  const demandTypes = [...DEMAND_TYPES].filter((type) => supportingEvidenceTypes.has(type));
  const strongCompetitorContradictions = contradictingEvidence.filter((item) => (
    item.type === "competitor_gap" && item.confidence >= 0.7
  ));
  const criticalBlockers = unresolvedCriticalBlockers(candidate);
  const commercialAssessment = assessCommercialEvidence(candidate, allEvidence, at);
  const checks = {
    problem_defined: nonEmpty(candidate.problem_statement || candidate.product_idea),
    audience_defined: nonEmpty(candidate.target_user || candidate.audience),
    wedge_defined: nonEmpty(candidate.specific_gap) && nonEmpty(candidate.mvp_wedge),
    app_supply_measured: supportingEvidenceTypes.has("app_supply"),
    non_store_demand_found: demandTypes.length > 0,
    competitor_gap_supported: supportingEvidenceTypes.has("competitor_gap"),
    selection_rationale_complete: selectionRationaleComplete(candidate),
    metrics_known_or_unknown_explicit: metricsExplicit(candidate, evidence),
    no_critical_blocker: criticalBlockers.length === 0,
    no_strong_competitor_contradiction: strongCompetitorContradictions.length === 0,
    commercial_signals_supported: commercialAssessment.preliminary_gate_passed,
  };
  const scoreParts = {
    problem_and_audience: checks.problem_defined && checks.audience_defined ? 10 : 0,
    buildable_wedge: checks.wedge_defined ? 10 : 0,
    app_supply: checks.app_supply_measured ? 12 : 0,
    non_store_demand: checks.non_store_demand_found ? Math.min(24, 16 + Math.max(0, demandTypes.length - 1) * 4) : 0,
    competitor_gap: checks.competitor_gap_supported ? 14 : 0,
    market_or_audience_size: supportingEvidenceTypes.has("market_size") || supportingEvidenceTypes.has("audience_proxy") ? 12 : 0,
    monetization: supportingEvidenceTypes.has("revenue_signal") || supportingEvidenceTypes.has("pricing") ? 8 : 0,
    selection_rationale: checks.selection_rationale_complete ? 10 : 0,
    contradiction_penalty: -Math.min(20, strongCompetitorContradictions.length * 10),
  };
  const score = Math.max(0, Object.values(scoreParts).reduce((sum, value) => sum + value, 0));
  const requiredChecks = [
    "problem_defined",
    "audience_defined",
    "wedge_defined",
    "app_supply_measured",
    "non_store_demand_found",
    "competitor_gap_supported",
    "selection_rationale_complete",
    "metrics_known_or_unknown_explicit",
    "no_critical_blocker",
    "no_strong_competitor_contradiction",
    "commercial_signals_supported",
  ];
  const missing = requiredChecks.filter((key) => !checks[key]);
  const evidenceClasses = [...evidenceTypes].sort();
  const supportingEvidenceClasses = [...supportingEvidenceTypes].sort();
  const isValidated = missing.length === 0 && score >= 65 && supportingEvidenceClasses.length >= 4;
  const recommendation = candidate.research_status === "rejected"
    ? "rejected"
    : candidate.research_status === "parked"
      ? "parked"
      : isValidated ? "validated" : "researching";
  const evaluation = {
    schema_version: 3,
    idea_id: candidate.id,
    evaluated_at: at.toISOString(),
    research_status: candidate.research_status,
    recommendation,
    score,
    research_coverage_score: score,
    score_meaning: "Research evidence coverage, not commercial attractiveness or success probability",
    commercial_assessment: commercialAssessment,
    score_parts: scoreParts,
    confidence: Number((evidence.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, evidence.length)).toFixed(2)),
    confidence_meaning: "Mean recorded source confidence, including contradictory sources; not hypothesis confidence",
    evidence_count: evidence.length,
    supporting_evidence_count: supportingEvidence.length,
    contradicting_evidence_count: contradictingEvidence.length,
    expired_evidence_count: allEvidence.length - evidence.length,
    evidence_classes: evidenceClasses,
    supporting_evidence_classes: supportingEvidenceClasses,
    demand_classes: demandTypes,
    checks,
    missing_checks: missing,
    critical_blockers: criticalBlockers,
    strong_competitor_contradictions: strongCompetitorContradictions.map((item) => item.id),
    eligible_for: {
      brainstorm: isValidated,
      prd: isValidated && ["brainstorm-approved", "prd-approved", "ready"].includes(candidate.research_status),
      factory: candidate.research_status === "ready" && isValidated,
    },
  };
  const stamp = at.toISOString().replace(/[:.]/g, "-");
  const evaluationPath = path.join(directory, "evaluations", `${stamp}.json`);
  writeJsonAtomic(evaluationPath, evaluation);
  writeJsonAtomic(path.join(directory, "evaluation.json"), evaluation);
  if (isValidated && ["observed", "researching"].includes(candidate.research_status)) {
    candidate.research_status = "validated";
    saveCandidate(stateRoot, candidate);
    evaluation.research_status = "validated";
    writeJsonAtomic(evaluationPath, evaluation);
    writeJsonAtomic(path.join(directory, "evaluation.json"), evaluation);
  }
  return { status: "evaluated", evaluation, evaluation_path: evaluationPath };
}

function statusForDecision(type) {
  return {
    request_validation: "researching",
    park: "parked",
    reject: "rejected",
    reopen: "researching",
    approve_brainstorm: "brainstorm-approved",
    approve_prd: "prd-approved",
    mark_ready: "ready",
  }[type] || null;
}

export function recordDecision({ stateRoot, ideaId, type, reason, actor = null, sourceUrl = null }) {
  const candidate = loadCandidate(stateRoot, ideaId);
  if (!DECISION_TYPES.has(type)) throw new Error(`Unsupported decision type: ${type}`);
  if (!nonEmpty(reason)) throw new Error("decision reason is required");
  const latestEvaluationPath = path.join(ideaDirectory(stateRoot, candidate.id), "evaluation.json");
  const latestEvaluation = fs.existsSync(latestEvaluationPath) ? readJson(latestEvaluationPath) : null;
  if (["approve_brainstorm", "approve_prd", "mark_ready"].includes(type)
    && (latestEvaluation?.schema_version !== 3 || !latestEvaluation?.commercial_assessment?.preliminary_gate_passed)) {
    throw new Error("Idea is not eligible for promotion; re-evaluate with the commercial evidence gate first");
  }
  if (type === "approve_brainstorm" && !latestEvaluation?.eligible_for?.brainstorm) {
    throw new Error("Idea is not eligible for brainstorm; resolve the evaluation's missing checks first");
  }
  if (type === "approve_prd" && !latestEvaluation?.eligible_for?.prd) {
    throw new Error("Idea is not eligible for PRD; approve brainstorm and re-evaluate first");
  }
  if (type === "mark_ready" && !latestEvaluation?.eligible_for?.factory) {
    const eligibleAfterPromotion = latestEvaluation?.recommendation === "validated" && candidate.research_status === "prd-approved";
    if (!eligibleAfterPromotion) throw new Error("Idea is not eligible for factory readiness");
  }
  const decision = {
    id: `decision-${crypto.randomUUID()}`,
    idea_id: candidate.id,
    type,
    reason,
    actor,
    source_url: sourceUrl,
    previous_status: candidate.research_status,
    decided_at: nowIso(),
  };
  const nextStatus = statusForDecision(type);
  if (nextStatus) candidate.research_status = nextStatus;
  decision.next_status = candidate.research_status;
  appendJsonLine(path.join(ideaDirectory(stateRoot, candidate.id), "decisions.jsonl"), decision);
  saveCandidate(stateRoot, candidate);
  return { status: "recorded", decision, candidate };
}

export function ideaSnapshot({ stateRoot, ideaId }) {
  const candidate = loadCandidate(stateRoot, ideaId);
  const directory = ideaDirectory(stateRoot, candidate.id);
  const evaluationPath = path.join(directory, "evaluation.json");
  return {
    candidate,
    evaluation: fs.existsSync(evaluationPath) ? readJson(evaluationPath) : null,
    evidence: readJsonLines(path.join(directory, "evidence.jsonl")),
    decisions: readJsonLines(path.join(directory, "decisions.jsonl")),
    idea_dir: directory,
  };
}

export function listIdeas({ stateRoot, statuses = [] }) {
  const root = path.join(path.resolve(stateRoot), "ideas", "research");
  if (!fs.existsSync(root)) return [];
  const wanted = new Set(statuses);
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const target = path.join(root, entry.name, "candidate.json");
      return fs.existsSync(target) ? readJson(target) : null;
    })
    .filter(Boolean)
    .filter((candidate) => wanted.size === 0 || wanted.has(candidate.research_status))
    .sort((left, right) => String(right.updated_at).localeCompare(String(left.updated_at)));
}

export function dailyMaintenancePlan({ stateRoot, at = new Date(), cooldownDays = 7 } = {}) {
  const now = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(now.getTime())) throw new Error("daily maintenance plan requires a valid date");
  const days = Number(cooldownDays);
  if (!Number.isFinite(days) || days < 0) throw new Error("cooldownDays must be a non-negative number");
  const activeStatuses = ["observed", "researching", "validated", "brainstorm-approved", "prd-approved", "ready", "parked"];
  const ideas = listIdeas({ stateRoot, statuses: activeStatuses });
  const due = [];
  const cooldown = [];
  const blocked = [];

  for (const candidate of ideas) {
    const directory = ideaDirectory(stateRoot, candidate.id);
    const evaluationPath = path.join(directory, "evaluation.json");
    const evaluation = fs.existsSync(evaluationPath) ? readJson(evaluationPath) : null;
    const schedule = candidate.research_schedule || {};
    const nextEligibleAt = schedule.next_eligible_at ? new Date(schedule.next_eligible_at) : null;
    const base = {
      idea_id: candidate.id,
      title: candidate.title,
      research_status: candidate.research_status,
      recommendation: evaluation?.recommendation || null,
      missing_checks: evaluation?.missing_checks || [],
      evaluated_at: evaluation?.evaluated_at || null,
    };

    if (schedule.automation_state === "blocked_external_input" && !schedule.next_eligible_at) {
      blocked.push({
        ...base,
        reason: schedule.reason || "external input required before more automated research",
        blocked_on: schedule.blocked_on || [],
      });
      continue;
    }

    if (nextEligibleAt && !Number.isNaN(nextEligibleAt.getTime()) && nextEligibleAt > now) {
      cooldown.push({ ...base, reason: "scheduled cooldown", next_eligible_at: nextEligibleAt.toISOString() });
      continue;
    }

    if (!evaluation?.evaluated_at) {
      due.push({ ...base, reason: "not_evaluated" });
      continue;
    }

    const evaluatedAt = new Date(evaluation.evaluated_at);
    if (Number.isNaN(evaluatedAt.getTime())) {
      due.push({ ...base, reason: "invalid_evaluation_date" });
      continue;
    }
    const ageDays = (now.getTime() - evaluatedAt.getTime()) / 86_400_000;
    if (ageDays >= days) {
      due.push({ ...base, reason: "evidence_stale", age_days: Number(ageDays.toFixed(2)) });
    } else {
      cooldown.push({
        ...base,
        reason: "recently_evaluated",
        age_days: Number(Math.max(0, ageDays).toFixed(2)),
        next_eligible_at: new Date(evaluatedAt.getTime() + days * 86_400_000).toISOString(),
      });
    }
  }

  return {
    status: "complete",
    generated_at: now.toISOString(),
    cooldown_days: days,
    due,
    cooldown,
    blocked,
  };
}

export function reconcileBacklog({ stateRoot, backlogPath = path.join(stateRoot, "ideas", "backlog.json"), write = false }) {
  const backlog = readJson(path.resolve(backlogPath));
  if (!Array.isArray(backlog.ideas)) throw new Error("Backlog must contain an ideas array");
  const demoted = [];
  const approved = [];
  for (const idea of backlog.ideas) {
    if (idea.status !== "ready") continue;
    const directory = ideaDirectory(stateRoot, idea.id);
    const stableCandidatePath = path.join(directory, "candidate.json");
    const evaluationPath = path.join(directory, "evaluation.json");
    const stableCandidate = fs.existsSync(stableCandidatePath) ? readJson(stableCandidatePath) : null;
    const evaluation = fs.existsSync(evaluationPath) ? readJson(evaluationPath) : null;
    const isApproved = stableCandidate?.research_status === "ready" && evaluation?.recommendation === "validated"
      && evaluation?.schema_version === 3 && evaluation?.commercial_assessment?.preliminary_gate_passed === true;
    if (isApproved) {
      approved.push(idea.id);
      continue;
    }
    demoted.push({
      idea_id: idea.id,
      previous_status: idea.status,
      ledger_status: stableCandidate?.research_status || "missing",
      recommendation: evaluation?.recommendation || "not_evaluated",
      missing_checks: evaluation?.missing_checks || ["stable_research_ledger_missing"],
    });
    idea.status = "researching";
    idea.research ||= {};
    idea.research.revalidation_required = true;
    idea.research.revalidation_requested_at = nowIso();
    idea.research.previous_factory_status = "ready";
  }
  if (write && demoted.length > 0) {
    backlog.updated_at = nowIso();
    writeJsonAtomic(path.resolve(backlogPath), backlog);
  }
  return { status: write ? "reconciled" : "preview", backlog_path: path.resolve(backlogPath), demoted, approved };
}

function entriesFromArgs(args) {
  if (args.file) {
    const payload = readJson(path.resolve(args.file));
    return Array.isArray(payload) ? payload : payload.evidence || [payload];
  }
  return [{
    type: args.type,
    source_url: args["source-url"],
    source_path: args["source-path"],
    source_id: args["source-id"],
    observed_at: args["observed-at"],
    summary: args.summary,
    metric: args.metric,
    value: args.value,
    unit: args.unit,
    confidence: args.confidence,
    expires_at: args["expires-at"],
  }];
}

function usage() {
  return `Usage:
  node scripts/idea-research-ledger.mjs init --candidate-file candidate.json [--idea-id ID] [--replace] [--state-root PATH]
  node scripts/idea-research-ledger.mjs import-backlog --candidate-file ideas/backlog.json [--replace] [--state-root PATH]
  node scripts/idea-research-ledger.mjs evidence --idea-id ID (--file evidence.json | --type TYPE --source-url URL --summary TEXT) [--state-root PATH]
  node scripts/idea-research-ledger.mjs evaluate --idea-id ID [--state-root PATH]
  node scripts/idea-research-ledger.mjs evaluate-all [--statuses observed,researching,validated,ready] [--state-root PATH]
  node scripts/idea-research-ledger.mjs reconcile-backlog [--backlog PATH] [--write] [--state-root PATH]
  node scripts/idea-research-ledger.mjs decide --idea-id ID --type TYPE --reason TEXT [--actor USER] [--source-url URL]
  node scripts/idea-research-ledger.mjs show --idea-id ID [--state-root PATH]
  node scripts/idea-research-ledger.mjs list [--statuses researching,validated] [--state-root PATH]
  node scripts/idea-research-ledger.mjs daily-plan [--cooldown-days 7] [--at ISO] [--state-root PATH]

Research state is written under ideas/research/<idea-id>/ in the private state repository.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "help";
  const stateRoot = resolveStateRoot(args);
  let result;
  if (command === "help" || args.help) {
    process.stdout.write(usage());
    return;
  }
  if (command === "init") {
    const payload = readJson(path.resolve(requireValue("--candidate-file", args["candidate-file"])));
    result = initializeIdea({ stateRoot, payload, ideaId: args["idea-id"], replace: Boolean(args.replace) });
  } else if (command === "import-backlog") {
    const payload = readJson(path.resolve(requireValue("--candidate-file", args["candidate-file"])));
    result = importBacklog({ stateRoot, payload, replace: Boolean(args.replace) });
  } else if (command === "evidence") {
    result = appendEvidence({ stateRoot, ideaId: requireValue("--idea-id", args["idea-id"]), entries: entriesFromArgs(args) });
  } else if (command === "evaluate") {
    result = evaluateIdea({ stateRoot, ideaId: requireValue("--idea-id", args["idea-id"]) });
  } else if (command === "evaluate-all") {
    const statuses = String(args.statuses || "").split(",").filter(Boolean);
    const ideas = listIdeas({ stateRoot, statuses });
    result = {
      status: "evaluated",
      evaluations: ideas.map((candidate) => evaluateIdea({ stateRoot, ideaId: candidate.id }).evaluation),
    };
  } else if (command === "reconcile-backlog") {
    result = reconcileBacklog({ stateRoot, backlogPath: args.backlog || path.join(stateRoot, "ideas", "backlog.json"), write: Boolean(args.write) });
  } else if (command === "decide") {
    result = recordDecision({
      stateRoot,
      ideaId: requireValue("--idea-id", args["idea-id"]),
      type: requireValue("--type", args.type),
      reason: requireValue("--reason", args.reason),
      actor: args.actor || null,
      sourceUrl: args["source-url"] || null,
    });
  } else if (command === "show") {
    result = ideaSnapshot({ stateRoot, ideaId: requireValue("--idea-id", args["idea-id"]) });
  } else if (command === "list") {
    result = { status: "complete", ideas: listIdeas({ stateRoot, statuses: String(args.statuses || "").split(",").filter(Boolean) }) };
  } else if (command === "daily-plan") {
    result = dailyMaintenancePlan({
      stateRoot,
      at: args.at ? new Date(args.at) : new Date(),
      cooldownDays: args["cooldown-days"] === undefined ? 7 : Number(args["cooldown-days"]),
    });
  } else {
    throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
