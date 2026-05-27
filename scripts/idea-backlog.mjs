#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_IDEA_STATUSES = new Set([
  "researching",
  "ready",
  "reserved",
  "in_progress",
  "shipped",
  "paused",
  "rejected",
]);

const ALLOWED_FACTORY_STATUSES = new Set([
  "queued",
  "reserved",
  "prepared",
  "building",
  "submitted",
  "complete",
  "blocked",
  "skipped",
]);

export function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function nowIso() {
  return new Date().toISOString();
}

function compactDate(date = new Date(), timeZone = "Europe/Istanbul") {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function runId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `run-${stamp}-${crypto.randomBytes(3).toString("hex")}`;
}

function cleanSlug(value, fieldName) {
  const slug = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug)) {
    throw new Error(`${fieldName} must be a lowercase slug using letters, numbers, and hyphens: ${value}`);
  }
  return slug;
}

function cleanRepoName(value, fieldName) {
  const name = String(value || "").trim();
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new Error(`${fieldName} must use letters, numbers, dots, underscores, or hyphens: ${value}`);
  }
  return name;
}

export function resolveBacklogPath(args = {}) {
  const stateRoot = args["state-root"] || process.env.APP_FACTORY_STATE_ROOT;
  const requested = args.backlog || process.env.IDEA_BACKLOG_PATH || "ideas/backlog.json";
  if (path.isAbsolute(requested)) return requested;
  return path.resolve(stateRoot || process.cwd(), requested);
}

function defaultBacklog() {
  return {
    schema_version: 1,
    updated_at: nowIso(),
    selection_policy: {
      statuses: ["ready"],
      order: "rank_ascending_then_score_desc",
    },
    ideas: [],
  };
}

export function loadBacklog(backlogPath) {
  if (!fs.existsSync(backlogPath)) return defaultBacklog();
  const backlog = readJson(backlogPath);
  if (!Array.isArray(backlog.ideas)) {
    throw new Error(`Backlog must contain an ideas array: ${backlogPath}`);
  }
  return backlog;
}

export function saveBacklog(backlogPath, backlog) {
  backlog.updated_at = nowIso();
  sortBacklog(backlog);
  validateBacklog(backlog);
  writeJson(backlogPath, backlog);
}

function scoreTotal(idea) {
  const total = idea.scores?.total ?? idea.score?.total ?? 0;
  return Number.isFinite(Number(total)) ? Number(total) : 0;
}

export function sortBacklog(backlog) {
  backlog.ideas.sort((left, right) => {
    const leftRank = Number.isFinite(Number(left.rank)) ? Number(left.rank) : Number.MAX_SAFE_INTEGER;
    const rightRank = Number.isFinite(Number(right.rank)) ? Number(right.rank) : Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;
    const scoreDiff = scoreTotal(right) - scoreTotal(left);
    if (scoreDiff !== 0) return scoreDiff;
    return String(left.id).localeCompare(String(right.id));
  });
}

function validateIdea(idea, index) {
  const prefix = `ideas[${index}]`;
  requireValue(`${prefix}.id`, idea.id);
  requireValue(`${prefix}.title`, idea.title);
  requireValue(`${prefix}.app_name`, idea.app_name);
  requireValue(`${prefix}.repo_slug`, idea.repo_slug);
  requireValue(`${prefix}.product_idea`, idea.product_idea);

  idea.id = cleanSlug(idea.id, `${prefix}.id`);
  idea.repo_slug = cleanSlug(idea.repo_slug, `${prefix}.repo_slug`);
  idea.status = idea.status || "researching";

  if (!ALLOWED_IDEA_STATUSES.has(idea.status)) {
    throw new Error(`${prefix}.status is invalid: ${idea.status}`);
  }

  if (!Number.isInteger(Number(idea.rank)) || Number(idea.rank) < 1) {
    throw new Error(`${prefix}.rank must be a positive integer`);
  }

  if (idea.bundle_id) {
    if (!/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)+$/.test(idea.bundle_id)) {
      throw new Error(`${prefix}.bundle_id must be a valid reverse-DNS identifier`);
    }
  }

  if (idea.bundle_id_slug) {
    idea.bundle_id_slug = cleanSlug(idea.bundle_id_slug, `${prefix}.bundle_id_slug`).replace(/-/g, "");
  }

  if (idea.status === "ready") {
    const requiredReadyFields = [
      "category",
      "cluster",
      "specific_gap",
      "mvp_wedge",
      "why_now",
    ];

    for (const field of requiredReadyFields) {
      requireValue(`${prefix}.${field}`, idea[field]);
    }

    if (!Array.isArray(idea.evidence_sources) || idea.evidence_sources.length === 0) {
      throw new Error(`${prefix}.evidence_sources must contain at least one source before status can be ready`);
    }

    if (!Array.isArray(idea.competitors) || idea.competitors.length === 0) {
      throw new Error(`${prefix}.competitors must contain at least one comparable app before status can be ready`);
    }

    if (!idea.metric_snapshot || typeof idea.metric_snapshot !== "object") {
      throw new Error(`${prefix}.metric_snapshot is required before status can be ready`);
    }
  }

  idea.factory = idea.factory || {};
  idea.factory.status = idea.factory.status || "queued";
  if (!ALLOWED_FACTORY_STATUSES.has(idea.factory.status)) {
    throw new Error(`${prefix}.factory.status is invalid: ${idea.factory.status}`);
  }
}

export function validateBacklog(backlog) {
  if (backlog.schema_version !== 1) {
    throw new Error(`Unsupported backlog schema_version: ${backlog.schema_version}`);
  }

  const seen = new Set();
  backlog.ideas.forEach((idea, index) => {
    validateIdea(idea, index);
    if (seen.has(idea.id)) {
      throw new Error(`Duplicate idea id: ${idea.id}`);
    }
    seen.add(idea.id);
  });
}

export function buildSelection(idea, options = {}) {
  const date = options.date || compactDate(new Date(), options.timeZone || "Europe/Istanbul");
  const prefix = options.repoPrefix ?? "ios";
  const baseName = prefix ? `${prefix}-${idea.repo_slug}` : idea.repo_slug;
  const repoName = cleanRepoName(`${baseName}-${date}`, "repo_name");
  const bundleId = idea.bundle_id || `com.viberboyz.${idea.bundle_id_slug || idea.repo_slug.replace(/-/g, "")}`;
  const selectedRunId = options.runId || runId();

  return {
    status: "selected",
    run_id: selectedRunId,
    idea_id: idea.id,
    project_name: repoName,
    repo_name: repoName,
    app_name: idea.app_name,
    bundle_id: bundleId,
    platform: idea.platform || "ios",
    stack: idea.stack || "SwiftUI",
    product_idea: idea.product_idea,
    idea,
  };
}

export function selectIdea(backlog, options = {}) {
  validateBacklog(backlog);
  sortBacklog(backlog);

  const statuses = new Set((options.statuses || ["ready"]).map((status) => status.trim()).filter(Boolean));
  const idea = backlog.ideas.find((candidate) => {
    const factoryStatus = candidate.factory?.status || "queued";
    return statuses.has(candidate.status) && ["queued", "blocked"].includes(factoryStatus);
  });

  if (!idea) {
    return {
      status: "empty",
      message: `No eligible ideas found for statuses: ${Array.from(statuses).join(", ")}`,
    };
  }

  const selection = buildSelection(idea, options);

  if (options.reserve) {
    idea.status = "reserved";
    idea.factory = {
      ...idea.factory,
      status: "reserved",
      reserved_at: nowIso(),
      last_run_id: selection.run_id,
    };
  }

  return selection;
}

export function markPrepared(backlog, selection, repoResult, workspaceResult) {
  const idea = backlog.ideas.find((candidate) => candidate.id === selection.idea_id);
  if (!idea) {
    throw new Error(`Cannot mark prepared; idea not found: ${selection.idea_id}`);
  }

  idea.status = "in_progress";
  idea.factory = {
    ...idea.factory,
    status: "prepared",
    prepared_at: nowIso(),
    last_run_id: selection.run_id,
    generated_repo: {
      full_name: repoResult.full_name,
      html_url: repoResult.html_url,
      clone_url: repoResult.clone_url,
      selected_name: repoResult.selected_name,
    },
    workspace_path: workspaceResult.workspace_path,
  };
}

export function upsertIdea(backlog, incomingIdea) {
  const index = backlog.ideas.findIndex((idea) => idea.id === incomingIdea.id);
  if (index === -1) {
    backlog.ideas.push(incomingIdea);
    return "inserted";
  }

  const existing = backlog.ideas[index];
  backlog.ideas[index] = {
    ...existing,
    ...incomingIdea,
    factory: {
      ...existing.factory,
      ...incomingIdea.factory,
    },
  };
  return "updated";
}

function writeOutput(args, result) {
  const text = `${JSON.stringify(result, null, 2)}\n`;
  if (args.output) {
    fs.mkdirSync(path.dirname(path.resolve(args.output)), { recursive: true });
    fs.writeFileSync(args.output, text);
  }
  process.stdout.write(text);
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/idea-backlog.mjs validate --state-root <path>
  node scripts/idea-backlog.mjs select --state-root <path> [--reserve] [--output <file>]
  node scripts/idea-backlog.mjs upsert --state-root <path> --idea-file <file>

Environment:
  APP_FACTORY_STATE_ROOT  Private state repo checkout root.
  IDEA_BACKLOG_PATH       Optional backlog path, defaults to ideas/backlog.json.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "validate";

  if (command === "help" || args.help) {
    printUsage();
    return;
  }

  const backlogPath = resolveBacklogPath(args);
  const backlog = loadBacklog(backlogPath);

  if (command === "validate") {
    validateBacklog(backlog);
    sortBacklog(backlog);
    if (boolValue(args.write, false)) saveBacklog(backlogPath, backlog);
    writeOutput(args, {
      status: "valid",
      backlog_path: backlogPath,
      idea_count: backlog.ideas.length,
      ready_count: backlog.ideas.filter((idea) => idea.status === "ready").length,
    });
    return;
  }

  if (command === "select") {
    const selection = selectIdea(backlog, {
      statuses: String(args.statuses || "ready").split(","),
      reserve: boolValue(args.reserve, false),
      date: args.date,
      timeZone: args["time-zone"] || "Europe/Istanbul",
      repoPrefix: args["repo-prefix"] ?? "ios",
      runId: args["run-id"],
    });

    if (selection.status === "empty") {
      writeOutput(args, selection);
      process.exitCode = 2;
      return;
    }

    if (boolValue(args.reserve, false)) saveBacklog(backlogPath, backlog);
    writeOutput(args, {
      ...selection,
      backlog_path: backlogPath,
    });
    return;
  }

  if (command === "upsert") {
    const ideaFile = requireValue("--idea-file", args["idea-file"]);
    const incomingIdea = readJson(path.resolve(ideaFile));
    const action = upsertIdea(backlog, incomingIdea);
    saveBacklog(backlogPath, backlog);
    writeOutput(args, {
      status: action,
      backlog_path: backlogPath,
      idea_id: incomingIdea.id,
      idea_count: backlog.ideas.length,
    });
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
