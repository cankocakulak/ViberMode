#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultConfigPath = path.join(repoRoot, "config", "slack-rox-intents.json");
const defaultPolicyPath = path.join(repoRoot, ".codex", "slack-codex-operator", "policy.yml");
const defaultContextPath = path.join(repoRoot, ".codex", "slack-codex-operator", "context.json");
const stopWords = new Set(["a", "acaba", "ama", "bi", "bir", "bu", "da", "de", "e", "icin", "ile", "mi", "mu", "miyim", "misin", "ve", "ya"]);

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) {
      args._.push(raw);
      continue;
    }
    const eq = raw.indexOf("=");
    if (eq !== -1) {
      args[raw.slice(2, eq)] = raw.slice(eq + 1);
      continue;
    }
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

export function normalizeText(value) {
  return String(value || "")
    .replace(/<@[A-Z0-9]+>/gi, " ")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !stopWords.has(token));
}

export function editDistance(leftValue, rightValue) {
  const left = String(leftValue || "");
  const right = String(rightValue || "");
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
      if (
        i > 1
        && j > 1
        && left[i - 1] === right[j - 2]
        && left[i - 2] === right[j - 1]
      ) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }
  return matrix[left.length][right.length];
}

function longestCommonSubsequenceLength(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      rows[i][j] = left[i - 1] === right[j - 1]
        ? rows[i - 1][j - 1] + 1
        : Math.max(rows[i - 1][j], rows[i][j - 1]);
    }
  }
  return rows[left.length][right.length];
}

export function tokenSimilarity(leftValue, rightValue) {
  const left = normalizeText(leftValue);
  const right = normalizeText(rightValue);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (Math.min(left.length, right.length) >= 5 && (left.startsWith(right) || right.startsWith(left))) return 0.82;
  const distance = editDistance(left, right);
  const longest = Math.max(left.length, right.length);
  if (distance === 1 && longest >= 4) return 0.88;
  if (distance === 2 && longest >= 7) return 0.72;
  const shortest = Math.min(left.length, right.length);
  const orderedCoverage = longestCommonSubsequenceLength(left, right) / shortest;
  if (shortest >= 7 && orderedCoverage >= 0.75) return 0.74;
  return Math.max(0, 1 - distance / longest) * 0.65;
}

function phraseScore(message, example) {
  const messageTokens = tokens(message);
  const exampleTokens = tokens(example);
  if (exampleTokens.length === 0 || messageTokens.length === 0) return 0;
  const similarities = exampleTokens.map((expected) => Math.max(...messageTokens.map((actual) => tokenSimilarity(expected, actual))));
  const average = similarities.reduce((sum, score) => sum + score, 0) / similarities.length;
  const coverage = similarities.filter((score) => score >= 0.72).length / similarities.length;
  return average * 0.6 + coverage * 0.4;
}

function valueAfterColon(line) {
  const value = line.slice(line.indexOf(":") + 1).trim();
  if (!value) return "";
  const unquoted = value.replace(/^['"]|['"]$/g, "");
  if (unquoted.startsWith("[") && unquoted.endsWith("]")) {
    return unquoted.slice(1, -1).split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
  }
  return unquoted;
}

export function loadPolicyChannelContexts(policyPath = defaultPolicyPath) {
  if (!fs.existsSync(policyPath)) return [];
  const lines = fs.readFileSync(policyPath, "utf8").split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "channel_contexts:");
  if (start === -1) return [];
  const contexts = [];
  let current = null;
  let listKey = null;
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indent = line.match(/^\s*/)[0].length;
    if (indent === 0) break;
    if (indent === 2 && line.trim().startsWith("- ")) {
      if (current) contexts.push(current);
      current = {};
      listKey = null;
      const entry = line.trim().slice(2);
      const key = entry.slice(0, entry.indexOf(":"));
      current[key] = valueAfterColon(entry);
      continue;
    }
    if (!current) continue;
    if (indent === 4 && line.trim().endsWith(":")) {
      listKey = line.trim().slice(0, -1);
      if (listKey === "aliases") current.aliases = [];
      continue;
    }
    if (indent === 4 && line.includes(":")) {
      const trimmed = line.trim();
      const key = trimmed.slice(0, trimmed.indexOf(":"));
      current[key] = valueAfterColon(trimmed);
      listKey = null;
      continue;
    }
    if (indent === 6 && listKey === "aliases" && line.trim().startsWith("- ")) {
      current.aliases.push(line.trim().slice(2).replace(/^['"]|['"]$/g, ""));
    }
  }
  if (current) contexts.push(current);
  return contexts;
}

function loadJson(target, fallback) {
  if (!fs.existsSync(target)) return fallback;
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function findChannelContext(contexts, channelId, channelName) {
  const normalizedName = normalizeText(channelName);
  return contexts.find((context) => (
    (channelId && context.channel_id === channelId)
    || (normalizedName && normalizeText(context.channel_name) === normalizedName)
  )) || null;
}

function aliasScore(message, alias) {
  const normalizedMessage = normalizeText(message);
  const normalizedAlias = normalizeText(alias);
  if (!normalizedAlias) return 0;
  if (normalizedMessage.includes(normalizedAlias)) return 1;
  return phraseScore(message, alias);
}

function resolveApp(message, contexts, channelContext) {
  const matches = [];
  for (const context of contexts) {
    const aliases = [context.app, ...(Array.isArray(context.aliases) ? context.aliases : [])].filter(Boolean);
    const score = Math.max(0, ...aliases.map((alias) => aliasScore(message, alias)));
    if (score >= 0.76) matches.push({ app: context.app, score, context });
  }
  matches.sort((left, right) => right.score - left.score);
  const explicit = matches[0] || null;
  const selected = explicit || (channelContext?.app ? { app: channelContext.app, score: 1, context: channelContext } : null);
  const conflict = Boolean(explicit && channelContext?.app && normalizeText(explicit.app) !== normalizeText(channelContext.app));
  return {
    canonical: selected?.app || null,
    source: explicit ? "message" : (selected ? "channel" : "unresolved"),
    confidence: selected ? Number(selected.score.toFixed(2)) : 0,
    conflict,
    message_app: explicit?.app || null,
    channel_app: channelContext?.app || null,
    context: selected?.context || null,
  };
}

function resolvePlatforms(message, config, channelContext) {
  const matched = [];
  for (const [platform, aliases] of Object.entries(config.platforms || {})) {
    const score = Math.max(...aliases.map((alias) => aliasScore(message, alias)));
    if (score >= 0.8) matched.push(platform);
  }
  const both = /\b(ikisi|ikisini|ikiside|her iki|both)\b/.test(normalizeText(message));
  if (both && !matched.includes("ios")) matched.push("ios");
  if (both && !matched.includes("android")) matched.push("android");
  if (matched.length > 0) return { values: matched, source: "message" };
  const defaults = Array.isArray(channelContext?.platforms) ? channelContext.platforms : [];
  return { values: defaults, source: defaults.length ? "channel" : "unresolved" };
}

function resolveDomain(config, channelId, channelName) {
  return config.channel_domains?.[channelId]
    || config.channel_domains?.[channelName]
    || config.channel_domains?.[normalizeText(channelName).replaceAll(" ", "-")]
    || null;
}

function scoreIntent(message, intent, channelDomain) {
  const anchorScore = Math.max(0, ...intent.anchors.map((anchor) => aliasScore(message, anchor)));
  if (anchorScore < 0.72) return 0;
  const exampleScore = Math.max(0, ...intent.examples.map((example) => phraseScore(message, example)));
  let score = anchorScore * 0.45 + exampleScore * 0.55;
  if (channelDomain && intent.domain === channelDomain) score += 0.1;
  if (channelDomain && intent.domain === "shared") score -= 0.04;
  if (channelDomain && intent.domain !== "shared" && intent.domain !== "release" && intent.domain !== "code" && intent.domain !== channelDomain) {
    score -= 0.12;
  }
  return Math.max(0, Math.min(1, score));
}

function activeProjectFacts(memory, project) {
  if (!project) return {};
  const projectKey = normalizeText(project);
  const entries = memory.project_facts?.[projectKey] || {};
  const now = Date.now();
  return Object.fromEntries(Object.entries(entries).filter(([, fact]) => (
    fact.status === "durable" || !fact.expires_at || Date.parse(fact.expires_at) > now
  )));
}

export function resolveRoxContext({
  text = "",
  channelId = "",
  channelName = "",
  policyPath = defaultPolicyPath,
  configPath = defaultConfigPath,
  contextPath = defaultContextPath,
} = {}) {
  const config = loadJson(configPath, { intents: [], platforms: {}, channel_domains: {} });
  const contexts = loadPolicyChannelContexts(policyPath);
  const channelContext = findChannelContext(contexts, channelId, channelName);
  const channelDomain = resolveDomain(config, channelId, channelName);
  const app = resolveApp(text, contexts, channelContext);
  const platforms = resolvePlatforms(text, config, channelContext);
  const intents = config.intents
    .map((intent) => ({
      id: intent.id,
      confidence: scoreIntent(text, intent, channelDomain),
      domain: intent.domain,
      workflow: intent.workflow,
      playbook: intent.playbook,
      risk: intent.risk,
    }))
    .filter((intent) => intent.confidence >= 0.53)
    .sort((left, right) => right.confidence - left.confidence)
    .map((intent) => ({ ...intent, confidence: Number(intent.confidence.toFixed(2)) }));
  const memory = loadJson(contextPath, { version: 1, project_facts: {} });
  const clarificationReasons = [];
  if (app.conflict) clarificationReasons.push("message_app_conflicts_with_channel_app");
  const primary = intents[0] || null;
  if (
    platforms.source === "channel"
    && ["internal-release", "final-submit"].includes(primary?.id)
  ) {
    platforms.values = platforms.values.filter((platform) => ["ios", "android"].includes(platform));
  }
  const appRequired = primary && ["internal-release", "final-submit", "main-update", "code-change", "analytics-gap", "attribution-health"].includes(primary.id);
  if (appRequired && !app.canonical) clarificationReasons.push("app_or_repo_unresolved");
  return {
    version: 1,
    normalized_text: normalizeText(text),
    channel: {
      id: channelId || null,
      name: channelName || null,
      domain: channelDomain,
      app_context: channelContext ? {
        app: channelContext.app || null,
        repo: channelContext.repo || null,
        repo_ios: channelContext.repo_ios || null,
        repo_android: channelContext.repo_android || null,
        repo_backend: channelContext.repo_backend || null,
        repo_control_center: channelContext.repo_control_center || null,
        default_workflow: channelContext.default_workflow || null,
        state_root: channelContext.state_root || null,
        research_channel: channelContext.research_channel || null,
        research_mode: channelContext.research_mode || null,
      } : null,
    },
    app: {
      canonical: app.canonical,
      source: app.source,
      confidence: app.confidence,
      conflict: app.conflict,
      message_app: app.message_app,
      channel_app: app.channel_app,
    },
    platforms,
    primary_intent: primary,
    intents,
    project_facts: activeProjectFacts(memory, app.canonical),
    authority_checks: primary?.id === "cancel" ? ["requester_or_owner_must_clearly_confirm"] : [],
    clarification: clarificationReasons.length > 0 ? {
      required: true,
      reasons: clarificationReasons,
    } : { required: false, reasons: [] },
    interpretation_policy: {
      typo_tolerant: true,
      exact_phrase_match_required: false,
      model_must_read_thread_context: true,
      ask_only_if_answer_changes_action_or_risk: true,
    },
  };
}

function containsSensitiveMaterial(value) {
  const text = String(value || "");
  return [
    /-----BEGIN [A-Z ]+PRIVATE KEY-----/i,
    /\bxox[baprs]-[a-z0-9-]+\b/i,
    /\b(?:sk|rk)_(?:live|test)_[a-z0-9]+\b/i,
    /\b(?:password|passwd|secret|token|api[_ -]?key)\s*[:=]/i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  ].some((pattern) => pattern.test(text));
}

function writeJsonAtomic(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, target);
}

function rememberProjectFact(args) {
  const project = args.project;
  const key = args.key;
  const value = args.value;
  const source = args["source-url"] || args.source;
  const status = args.status || "provisional";
  if (!project || !key || value === undefined || !source) {
    throw new Error("remember requires --project, --key, --value, and --source-url");
  }
  if (!/^[a-z0-9._-]+$/i.test(key)) throw new Error("--key must contain only letters, digits, dot, underscore, or dash");
  if (!String(source).startsWith("https://") && !String(source).startsWith("slack://")) {
    throw new Error("--source-url must be an https:// or slack:// source");
  }
  if (!new Set(["provisional", "durable"]).has(status)) throw new Error("--status must be provisional or durable");
  if (status === "durable" && !args["owner-approved"]) throw new Error("Durable project context requires --owner-approved");
  if (containsSensitiveMaterial(value)) throw new Error("Refusing to store likely secret or personal data in project context");
  const contextPath = path.resolve(args["context-path"] || defaultContextPath);
  const memory = loadJson(contextPath, { version: 1, project_facts: {} });
  const projectKey = normalizeText(project);
  memory.project_facts ||= {};
  memory.project_facts[projectKey] ||= {};
  const now = new Date();
  const ttlDays = Number(args["ttl-days"] || 30);
  if (!Number.isFinite(ttlDays) || ttlDays <= 0 || ttlDays > 365) throw new Error("--ttl-days must be between 1 and 365");
  memory.project_facts[projectKey][key] = {
    value,
    status,
    source,
    created_by: args["created-by"] || null,
    updated_at: now.toISOString(),
    expires_at: status === "provisional" ? new Date(now.getTime() + ttlDays * 86400000).toISOString() : null,
    verify_before_write: status === "provisional",
  };
  writeJsonAtomic(contextPath, memory);
  return { status: "remembered", project, key, durability: status, context_path: contextPath };
}

function forgetProjectFact(args) {
  if (!args.project || !args.key) throw new Error("forget requires --project and --key");
  if (!args["owner-approved"]) throw new Error("Forgetting project context requires --owner-approved");
  const contextPath = path.resolve(args["context-path"] || defaultContextPath);
  const memory = loadJson(contextPath, { version: 1, project_facts: {} });
  const projectKey = normalizeText(args.project);
  const existed = Boolean(memory.project_facts?.[projectKey]?.[args.key]);
  if (existed) delete memory.project_facts[projectKey][args.key];
  writeJsonAtomic(contextPath, memory);
  return { status: existed ? "forgotten" : "not_found", project: args.project, key: args.key, context_path: contextPath };
}

function usage() {
  return `Usage:
  node scripts/slack-rox-context.mjs resolve --text "MESSAGE" [--channel-id C123] [--channel-name growth]
  node scripts/slack-rox-context.mjs remember --project Ozard --key repo --value /path --source-url https://... [--status provisional|durable] [--owner-approved]
  node scripts/slack-rox-context.mjs forget --project Ozard --key repo --owner-approved
  node scripts/slack-rox-context.mjs list [--project Ozard]

Project facts are provisional by default and expire after 30 days. Durable facts require --owner-approved.
`;
}

async function main() {
  const args = parseArgs(process.argv);
  const command = args._[0] || "help";
  if (command === "help" || args.help) {
    process.stdout.write(usage());
    return;
  }
  if (command === "resolve") {
    console.log(JSON.stringify(resolveRoxContext({
      text: args.text || "",
      channelId: args["channel-id"] || "",
      channelName: args["channel-name"] || "",
      policyPath: path.resolve(args["policy-path"] || defaultPolicyPath),
      configPath: path.resolve(args["config-path"] || defaultConfigPath),
      contextPath: path.resolve(args["context-path"] || defaultContextPath),
    }), null, 2));
    return;
  }
  if (command === "remember") {
    console.log(JSON.stringify(rememberProjectFact(args), null, 2));
    return;
  }
  if (command === "forget") {
    console.log(JSON.stringify(forgetProjectFact(args), null, 2));
    return;
  }
  if (command === "list") {
    const contextPath = path.resolve(args["context-path"] || defaultContextPath);
    const memory = loadJson(contextPath, { version: 1, project_facts: {} });
    const projectKey = args.project ? normalizeText(args.project) : null;
    console.log(JSON.stringify(projectKey ? (memory.project_facts?.[projectKey] || {}) : memory, null, 2));
    return;
  }
  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
