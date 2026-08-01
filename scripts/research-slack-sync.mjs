#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ideaSnapshot, resolveStateRoot } from "./idea-research-ledger.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const slackScript = path.join(repoRoot, "scripts", "slack-rox-bot.mjs");
const defaultOperatorStatePath = path.join(repoRoot, ".codex", "slack-codex-operator", "state.json");
const ROOT_FORMAT_VERSION = 2;
const THREAD_FORMAT_VERSION = 2;

const turkishLabels = {
  app_supply: "uygulama arzı",
  audience_proxy: "kitle göstergesi",
  community_pain: "ihtiyaç sinyali",
  competitor_gap: "rakip boşluğu",
  competitor_gap_supported: "desteklenen rakip boşluğu",
  no_strong_competitor_contradiction: "güçlü rakip çelişkisi olmaması",
  not_evaluated: "henüz değerlendirilmedi",
  keyword_demand: "arama talebi",
  market_size: "pazar büyüklüğü",
  pricing: "fiyatlandırma",
  revenue_signal: "gelir sinyali",
  supports: "destekliyor",
  contradicts: "çelişiyor",
  neutral: "nötr",
  observed: "gözlemleniyor",
  researching: "araştırılıyor",
  validated: "doğrulandı",
  parked: "park edildi",
  rejected: "reddedildi",
  "brainstorm-approved": "brainstorm onaylı",
  "prd-approved": "PRD onaylı",
  ready: "hazır",
};

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith("--")) {
      args._.push(raw);
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

function compact(value, max = 320) {
  const text = String(value || "Not recorded").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function label(value) {
  return String(value || "").replaceAll("_", " ");
}

function trLabel(value) {
  return turkishLabels[value] || label(value);
}

function sourceLink(item) {
  return item.source_url ? ` <${item.source_url}|kaynak>` : "";
}

function evidenceLine(item, max = 210) {
  const metric = item.metric && item.value !== undefined
    ? ` (${item.metric}: ${item.value}${item.unit ? ` ${item.unit}` : ""})`
    : "";
  return `- *${trLabel(item.type)} · ${trLabel(item.direction || "supports")}:* ${compact(item.summary, max)}${metric}${sourceLink(item)}`;
}

function latestEvidence(evidence, predicate, limit = 3) {
  return evidence.filter(predicate).slice(-limit).reverse();
}

function evidenceSection(title, items, emptyText) {
  return [
    `*${title}*`,
    ...(items.length > 0 ? items.map((item) => evidenceLine(item)) : [`- ${emptyText}`]),
  ];
}

function evaluationDate(evaluation) {
  return evaluation?.evaluated_at ? evaluation.evaluated_at.slice(0, 10) : "tarih yok";
}

export function renderIdeaMessage(snapshot) {
  const candidate = snapshot.candidate;
  const pitch = candidate.slack_pitch || {};
  return [
    `*${compact(candidate.title, 100)}*`,
    compact(pitch.one_liner || candidate.product_idea || candidate.problem_statement, 260),
    "",
    `*Kim için:* ${compact(pitch.audience || candidate.target_user || candidate.audience, 180)}`,
    `*Çözdüğü sorun:* ${compact(pitch.problem || candidate.problem_statement, 220)}`,
    `*Temel deneyim:* ${compact(pitch.core_experience || candidate.mvp_wedge, 220)}`,
    "",
    "_Araştırma gerekçeleri ve bütün güncellemeler bu mesajın thread'inde._",
  ].join("\n");
}

export function renderResearchThread(snapshot, { previousEvaluation = null, initial = false } = {}) {
  const candidate = snapshot.candidate;
  const evaluation = snapshot.evaluation;
  const rationale = candidate.selection_rationale || {};
  const marketThesis = candidate.market_thesis || {};
  const allEvidence = snapshot.evidence || [];
  const previousCount = previousEvaluation?.evidence_count || 0;
  const runEvidence = initial || previousCount >= allEvidence.length
    ? allEvidence
    : allEvidence.slice(previousCount);
  const evidence = runEvidence.length > 0 ? runEvidence : allEvidence;
  const reddit = latestEvidence(evidence, (item) => String(item.source_url || "").includes("reddit.com"), 3);
  const pain = latestEvidence(evidence, (item) => item.type === "community_pain" && !reddit.includes(item), 3);
  const market = latestEvidence(evidence, (item) => ["app_supply", "audience_proxy", "keyword_demand", "market_size"].includes(item.type), 4);
  const monetization = latestEvidence(evidence, (item) => ["pricing", "revenue_signal"].includes(item.type), 3);
  const competition = latestEvidence(evidence, (item) => item.type === "competitor_gap", 4);
  const contradictions = latestEvidence(evidence, (item) => item.direction === "contradicts", 4);
  const supportingCount = evaluation?.supporting_evidence_count
    ?? allEvidence.filter((item) => (item.direction || "supports") === "supports").length;
  const contradictingCount = evaluation?.contradicting_evidence_count
    ?? allEvidence.filter((item) => item.direction === "contradicts").length;
  const missing = evaluation?.missing_checks || ["not_evaluated"];
  const followUps = Array.isArray(rationale.follow_up_questions) ? rationale.follow_up_questions.slice(0, 3) : [];
  const recommendation = evaluation?.recommendation || candidate.research_status || "researching";
  const score = evaluation ? `${evaluation.score}/100` : "henüz hesaplanmadı";
  const confidence = evaluation ? `%${Math.round(evaluation.confidence * 100)}` : "bilinmiyor";
  const competitors = Array.isArray(candidate.competitors) ? candidate.competitors.slice(0, 8).join(", ") : "Henüz listelenmedi";
  const update = initial ? null : renderDelta(previousEvaluation, evaluation);

  return [
    `*${initial ? "İlk araştırma özeti" : "Araştırma güncellemesi"} · ${compact(candidate.title, 100)} · ${evaluationDate(evaluation)}*`,
    `*Durum:* ${trLabel(recommendation)} | *Skor:* ${score} | *Güven:* ${confidence}`,
    `*Kanıt dengesi:* ${supportingCount} destekleyen / ${contradictingCount} çelişen`,
    ...(update ? [`*Bu turdaki değişim:* ${update}`] : []),
    "",
    "*Neden bu fikir?*",
    compact(rationale.chosen_because || candidate.specific_gap || "Seçim gerekçesi henüz yazılmadı.", 420),
    "",
    "*Pazar ve kitle yorumu*",
    `- ${compact(rationale.audience_logic || marketThesis.user_pain_intensity || "Kitle tezi henüz netleşmedi.", 320)}`,
    ...(marketThesis.distribution_angle ? [`- *Dağıtım:* ${compact(marketThesis.distribution_angle, 220)}`] : []),
    ...evidenceSection("Pazar sinyalleri", market, "Bu turda yeni ölçülebilir pazar veya kitle sinyali bulunmadı."),
    "",
    ...evidenceSection("İhtiyaç sinyalleri", pain, "Bu turda Reddit dışı yeni ihtiyaç sinyali bulunmadı."),
    "",
    ...evidenceSection("Reddit ve topluluk analizi", reddit, "Bu turda yeni Reddit kaynağı işlenmedi."),
    "",
    "*Rakipler ve ürün boşluğu*",
    `- *İzlenen rakipler:* ${competitors}`,
    `- *Yorum:* ${compact(rationale.competitor_gap || candidate.specific_gap || "Rakip boşluğu henüz netleşmedi.", 360)}`,
    ...competition.map((item) => evidenceLine(item)),
    "",
    ...evidenceSection("Fiyatlandırma ve gelir sinyalleri", monetization, "Güvenilir fiyat veya gelir sinyali henüz yok."),
    "",
    "*Karşı sinyaller ve riskler*",
    `- ${compact(rationale.tradeoffs || "Temel riskler henüz yazılmadı.", 320)}`,
    ...(contradictions.length > 0 ? contradictions.map((item) => evidenceLine(item)) : ["- Bu turda yeni çelişen kanıt kaydedilmedi."]),
    "",
    "*Sonuç ve sonraki kontrol*",
    `- *Öneri:* ${trLabel(recommendation)}`,
    `- *Eksik kontroller:* ${missing.length > 0 ? missing.map(trLabel).join(", ") : "yok"}`,
    ...(followUps.length > 0 ? followUps.map((item) => `- ${compact(item, 240)}`) : ["- Sonraki araştırma sorusu henüz belirlenmedi."]),
  ].join("\n");
}

function evaluationSummary(evaluation) {
  if (!evaluation) return null;
  return {
    recommendation: evaluation.recommendation,
    score: evaluation.score,
    evidence_count: evaluation.evidence_count,
    missing_checks: evaluation.missing_checks,
  };
}

export function renderDelta(previous, current) {
  if (!current) return "Araştırma kaydı güncellendi; henüz değerlendirme oluşmadı.";
  if (!previous) {
    return `İlk değerlendirme oluşturuldu: ${trLabel(current.recommendation)}, ${current.score}/100 skor ve ${current.evidence_count} kanıt.`;
  }
  const changes = [];
  if (previous.recommendation !== current.recommendation) changes.push(`öneri ${trLabel(previous.recommendation)} → ${trLabel(current.recommendation)}`);
  if (previous.score !== current.score) changes.push(`skor ${previous.score} → ${current.score}`);
  if (previous.evidence_count !== current.evidence_count) changes.push(`kanıt ${previous.evidence_count} → ${current.evidence_count}`);
  const beforeMissing = new Set(previous.missing_checks || []);
  const resolved = [...beforeMissing].filter((item) => !(current.missing_checks || []).includes(item));
  const added = (current.missing_checks || []).filter((item) => !beforeMissing.has(item));
  if (resolved.length > 0) changes.push(`kapanan kontroller: ${resolved.map(trLabel).join(", ")}`);
  if (added.length > 0) changes.push(`yeni açıklar: ${added.map(trLabel).join(", ")}`);
  return changes.length > 0 ? changes.join("; ") : null;
}

function runSlack(args) {
  const result = spawnSync(process.execPath, [slackScript, ...args], { cwd: repoRoot, encoding: "utf8", env: process.env });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "Slack command failed").trim());
  return JSON.parse(result.stdout);
}

function writeJsonAtomic(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, target);
}

function saveCandidate(stateRoot, candidate) {
  candidate.updated_at = new Date().toISOString();
  writeJsonAtomic(path.join(stateRoot, "ideas", "research", candidate.id, "candidate.json"), candidate);
}

function registerActiveThread({ statePath, stateRoot, candidate, channelId, channelName, threadTs }) {
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : { active_threads: {} };
  state.active_threads ||= {};
  const key = `product-ideas:${channelId}:${threadTs}`;
  state.active_threads[key] = {
    channel_id: channelId,
    channel_name: channelName || "product-ideas",
    thread_ts: threadTs,
    root_message_ts: threadTs,
    status: "active",
    risk: "product-research-owner-promotion-gated",
    summary: `Research and decide product idea ${candidate.id}: ${candidate.title}`,
    repo: repoRoot,
    idea_id: candidate.id,
    research_state_root: stateRoot,
    default_workflow: "app-opportunity-research",
    updated_at: new Date().toISOString(),
  };
  writeJsonAtomic(statePath, state);
  return key;
}

export function contentHash(message) {
  return crypto.createHash("sha256").update(message).digest("hex");
}

export function channelReportAlreadySent(state, channelId, hash) {
  return Boolean(state && state.channel_id === channelId && state.content_hash === hash && state.message_ts);
}

function syncChannelReport(args) {
  const channelId = args["channel-id"] || process.env.PRODUCT_IDEAS_SLACK_CHANNEL_ID;
  if (!channelId) throw new Error("--channel-id is required for a channel report");
  const messageFile = path.resolve(args["message-file"] || "");
  if (!args["message-file"] || !fs.existsSync(messageFile)) throw new Error("--message-file must point to a Slack-ready report");
  const message = fs.readFileSync(messageFile, "utf8").trim();
  if (!message) throw new Error("Slack report is empty");
  const hash = contentHash(message);
  const statePath = path.resolve(args["report-state"] || path.join(path.dirname(messageFile), "slack-report-state.json"));
  const previous = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : null;
  if (channelReportAlreadySent(previous, channelId, hash)) {
    return { status: "unchanged", ...previous, state_path: statePath };
  }
  const result = runSlack(["send", "--channel", channelId, "--message", message]);
  const state = {
    schema_version: 1,
    channel_id: channelId,
    message_ts: result.ts,
    permalink: result.link || null,
    content_hash: hash,
    sent_at: new Date().toISOString(),
  };
  writeJsonAtomic(statePath, state);
  return { status: "posted", ...state, state_path: statePath };
}

function usage() {
  return `Usage:
  node scripts/research-slack-sync.mjs render --idea-id ID [--state-root PATH]
  node scripts/research-slack-sync.mjs sync --idea-id ID --channel-id C123 [--channel-name product-ideas] [--post-delta]
  node scripts/research-slack-sync.mjs report --channel-id C123 --message-file cofounder-slack-report.md [--report-state PATH]

The sync command maintains one simple root card per idea, creates its initial research thread, and appends later material updates to that same thread. The report command is reserved for an explicitly requested idempotent cross-idea digest.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "help";
  if (command === "help" || args.help) {
    process.stdout.write(usage());
    return;
  }
  if (command === "report") {
    process.stdout.write(`${JSON.stringify(syncChannelReport(args), null, 2)}\n`);
    return;
  }
  const stateRoot = resolveStateRoot(args);
  const ideaId = args["idea-id"];
  if (!ideaId) throw new Error("--idea-id is required");
  const snapshot = ideaSnapshot({ stateRoot, ideaId });
  const message = renderIdeaMessage(snapshot);
  if (command === "render") {
    process.stdout.write(`${message}\n`);
    return;
  }
  if (command !== "sync") throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  const candidate = snapshot.candidate;
  const channelId = args["channel-id"] || candidate.slack?.channel_id || process.env.PRODUCT_IDEAS_SLACK_CHANNEL_ID;
  if (!channelId) throw new Error("--channel-id is required for the first sync");
  const channelName = args["channel-name"] || candidate.slack?.channel_name || "product-ideas";
  const hash = contentHash(message);
  const previousEvaluation = candidate.slack?.last_evaluation || null;
  const hadRootMessage = Boolean(candidate.slack?.message_ts);
  let result;
  if (!hadRootMessage) {
    result = runSlack(["send", "--channel", channelId, "--message", message]);
  } else if (candidate.slack.content_hash !== hash) {
    result = runSlack(["edit", "--channel", channelId, "--ts", candidate.slack.message_ts, "--message", message]);
  } else {
    result = { status: "unchanged", channel: channelId, ts: candidate.slack.message_ts, link: candidate.slack.permalink || null };
  }
  const messageTs = result.ts || candidate.slack?.message_ts;
  if (!messageTs) throw new Error("Slack sync did not return a message timestamp");
  const delta = renderDelta(previousEvaluation, snapshot.evaluation);
  let deltaResult = null;
  const needsThreadBootstrap = candidate.slack?.thread_format_version !== THREAD_FORMAT_VERSION;
  const shouldPostThread = needsThreadBootstrap || (args["post-delta"] && Boolean(delta));
  let threadContentHash = candidate.slack?.last_thread_content_hash || null;
  if (shouldPostThread) {
    const threadMessage = renderResearchThread(snapshot, {
      previousEvaluation: needsThreadBootstrap ? null : previousEvaluation,
      initial: needsThreadBootstrap,
    });
    const nextThreadHash = contentHash(threadMessage);
    if (threadContentHash !== nextThreadHash) {
      deltaResult = runSlack(["send", "--channel", channelId, "--thread-ts", messageTs, "--message", threadMessage]);
      threadContentHash = nextThreadHash;
    }
  }
  candidate.slack = {
    channel_id: channelId,
    channel_name: channelName,
    message_ts: messageTs,
    permalink: result.link || candidate.slack?.permalink || null,
    content_hash: hash,
    root_format_version: ROOT_FORMAT_VERSION,
    thread_format_version: THREAD_FORMAT_VERSION,
    last_thread_content_hash: threadContentHash,
    last_evaluation: evaluationSummary(snapshot.evaluation),
    last_synced_at: new Date().toISOString(),
  };
  saveCandidate(stateRoot, candidate);
  const activeThreadKey = registerActiveThread({
    statePath: path.resolve(args["operator-state-path"] || defaultOperatorStatePath),
    stateRoot,
    candidate,
    channelId,
    channelName,
    threadTs: messageTs,
  });
  process.stdout.write(`${JSON.stringify({
    status: result.status,
    idea_id: candidate.id,
    channel_id: channelId,
    message_ts: messageTs,
    permalink: candidate.slack.permalink,
    delta_posted: Boolean(deltaResult),
    active_thread_key: activeThreadKey,
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
