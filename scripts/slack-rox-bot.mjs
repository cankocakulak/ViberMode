#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveRoxContext } from "./slack-rox-context.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultStatePath = path.join(repoRoot, ".codex", "slack-codex-operator", "state.json");
const defaultPolicyPath = path.join(repoRoot, ".codex", "slack-codex-operator", "policy.yml");
const defaultKeychainService = "viberboyz-slack-rox-bot-token";
const defaultScanChannels = "team-operation,team-cs,team-hr,customer-success";
const defaultExcludedRoutineChannels = "customer-success";
const defaultThreadLookbackDays = 14;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      args[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
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

const args = parseArgs(process.argv);
const command = args._[0] || "help";

function usage() {
  return `Usage:
  node scripts/slack-rox-bot.mjs check-keychain [--keychain-service NAME]
  printf '%s' "$SLACK_ROX_BOT_TOKEN" | node scripts/slack-rox-bot.mjs save-keychain [--keychain-service NAME]
  node scripts/slack-rox-bot.mjs probe [--keychain-service NAME] [--channels policy|team-operation,team-cs]
  node scripts/slack-rox-bot.mjs scan [--after ISO_OR_EPOCH] [--channels policy|team-operation,team-cs] [--state-path PATH]
  node scripts/slack-rox-bot.mjs ensure-channel --name product-ideas [--private] [--purpose "text"] [--topic "text"]
  node scripts/slack-rox-bot.mjs send --channel C123 --message "text" [--thread-ts TS]
  node scripts/slack-rox-bot.mjs edit --channel C123 --ts TS --message "text"
  node scripts/slack-rox-bot.mjs delete --channel C123 --ts TS
  node scripts/slack-rox-bot.mjs upload --channel C123 --file /path/image.png [--message "caption"] [--thread-ts TS] [--title "Title"]

Token lookup order:
  SLACK_ROX_BOT_TOKEN, SLACK_BOT_TOKEN, then macOS Keychain service ${defaultKeychainService}
`;
}

function keychainService() {
  return args["keychain-service"] || process.env.SLACK_ROX_KEYCHAIN_SERVICE || defaultKeychainService;
}

function keychainRead(service) {
  try {
    return execFileSync("security", ["find-generic-password", "-a", process.env.USER || "", "-s", service, "-w"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    try {
      return execFileSync("security", ["find-generic-password", "-s", service, "-w"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return "";
    }
  }
}

function keychainWrite(service, value) {
  const account = process.env.USER || "local";
  try {
    execFileSync("security", ["delete-generic-password", "-a", account, "-s", service], { stdio: "ignore" });
  } catch {
    // Missing item is fine.
  }
  execFileSync("security", ["add-generic-password", "-a", account, "-s", service, "-w", value], {
    stdio: ["ignore", "ignore", "inherit"],
  });
}

function tokenInfo() {
  if (process.env.SLACK_ROX_BOT_TOKEN) return { token: process.env.SLACK_ROX_BOT_TOKEN, source: "env:SLACK_ROX_BOT_TOKEN" };
  if (process.env.SLACK_BOT_TOKEN) return { token: process.env.SLACK_BOT_TOKEN, source: "env:SLACK_BOT_TOKEN" };
  const service = keychainService();
  const token = keychainRead(service);
  return token ? { token, source: `keychain:${service}` } : { token: "", source: `missing:${service}` };
}

async function slackApi(method, payload = {}) {
  const { token } = tokenInfo();
  if (!token) throw new Error(`Missing Slack bot token. Store it in SLACK_ROX_BOT_TOKEN or Keychain service ${keychainService()}.`);
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    body.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after") || "unknown";
    throw new Error(`Slack rate limited ${method}; retry_after=${retryAfter}`);
  }
  const data = await response.json();
  if (!data.ok) {
    const needed = data.needed ? ` needed=${data.needed}` : "";
    const provided = data.provided ? ` provided=${data.provided}` : "";
    throw new Error(`${method} failed: ${data.error || "unknown"}${needed}${provided}`);
  }
  return data;
}

async function paged(method, payload, itemKey) {
  const items = [];
  let cursor = "";
  do {
    const page = await slackApi(method, { ...payload, cursor, limit: payload.limit || 200 });
    items.push(...(page[itemKey] || []));
    cursor = page.response_metadata?.next_cursor || "";
  } while (cursor);
  return items;
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^#/, ""));
}

function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function policyPath() {
  return path.resolve(args["policy-path"] || process.env.SLACK_ROX_POLICY_PATH || defaultPolicyPath);
}

function statePath() {
  return path.resolve(args["state-path"] || process.env.SLACK_ROX_STATE_PATH || defaultStatePath);
}

function loadState() {
  const target = statePath();
  if (!fs.existsSync(target)) return { active_threads: {} };
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function unquoteYamlScalar(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/,$/, "")
    .trim();
}

function policyBlock(lines, key) {
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start === -1) return [];
  const baseIndent = lines[start].match(/^\s*/)[0].length;
  const block = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      block.push(line);
      continue;
    }
    const indent = line.match(/^\s*/)[0].length;
    if (indent <= baseIndent) break;
    block.push(line);
  }
  return block;
}

function extractYamlValues(lines, keys) {
  const values = [];
  const keyPattern = new RegExp(`^(?:-\\s*)?(${keys.join("|")}):\\s*(.+)$`);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(keyPattern);
    if (!match) continue;
    const value = unquoteYamlScalar(match[2]);
    if (value && value !== "[]" && value !== "{}") values.push(value);
  }
  return values;
}

function policyScanChannels() {
  const target = policyPath();
  if (!fs.existsSync(target)) return [];
  const lines = fs.readFileSync(target, "utf8").split(/\r?\n/);
  const identifiers = [
    ...extractYamlValues(policyBlock(lines, "mention_scan_channels"), ["id", "name"]),
    ...extractYamlValues(policyBlock(lines, "channel_contexts"), ["channel_id", "channel_name"]),
  ];
  return [...new Set(identifiers)];
}

function configuredScanChannels() {
  const raw = args.channels || process.env.SLACK_ROX_SCAN_CHANNELS;
  if (raw && raw !== "policy") return raw;
  const fromPolicy = policyScanChannels();
  if (fromPolicy.length > 0) return fromPolicy.join(",");
  if (raw === "policy") throw new Error(`No scan channels found in policy: ${policyPath()}`);
  return defaultScanChannels;
}

function afterTs() {
  const raw = args.after || process.env.SLACK_ROX_AFTER;
  if (raw) {
    if (/^\d+(\.\d+)?$/.test(raw)) return raw;
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return String(parsed / 1000);
    throw new Error(`Invalid --after value: ${raw}`);
  }
  const state = loadState();
  if (state.last_heartbeat_at) return String(Date.parse(state.last_heartbeat_at) / 1000);
  return String(Math.floor(Date.now() / 1000) - 900);
}

function threadLookbackOldestTs() {
  const raw = args["thread-lookback-days"] || process.env.SLACK_ROX_THREAD_LOOKBACK_DAYS || defaultThreadLookbackDays;
  const days = Number(raw);
  if (!Number.isFinite(days) || days <= 0) throw new Error(`Invalid --thread-lookback-days value: ${raw}`);
  return String(Math.floor(Date.now() / 1000) - Math.floor(days * 86400));
}

async function authContext() {
  const auth = await slackApi("auth.test");
  return {
    team_id: auth.team_id,
    team: auth.team,
    bot_user_id: auth.user_id,
    bot_id: auth.bot_id || null,
    url: auth.url || null,
  };
}

async function listConversations(types) {
  return paged("conversations.list", { exclude_archived: true, types }, "channels");
}

function channelMatches(channel, wanted) {
  return wanted.has(channel.id) || wanted.has(channel.name) || wanted.has(channel.name_normalized);
}

async function resolveScanChannels() {
  const names = splitList(configuredScanChannels());
  const wanted = new Set(names);
  const explicitIds = names.filter((name) => /^[CGD][A-Z0-9]+$/.test(name));
  const explicitChannels = [];
  const explicitMissing = [];

  for (const channelId of explicitIds) {
    try {
      const info = await slackApi("conversations.info", { channel: channelId });
      explicitChannels.push(info.channel || { id: channelId, name: channelId });
    } catch (error) {
      explicitMissing.push(channelId);
    }
  }

  const conversations = await listConversations("public_channel,private_channel");
  const channelsById = new Map();
  for (const channel of explicitChannels) channelsById.set(channel.id, channel);
  for (const channel of conversations.filter((channel) => channelMatches(channel, wanted))) {
    channelsById.set(channel.id, channel);
  }

  const channels = [...channelsById.values()];
  const missing = names
    .filter((name) => !/^[CGD][A-Z0-9]+$/.test(name))
    .filter((name) => !channels.some((channel) => channelMatches(channel, new Set([name]))))
    .concat(explicitMissing);
  return { channels, missing };
}

function isDirectBotMention(text, botUserId) {
  return Boolean(text?.includes(`<@${botUserId}>`));
}

async function permalink(channel, messageTs) {
  try {
    const result = await slackApi("chat.getPermalink", { channel, message_ts: messageTs });
    return result.permalink || null;
  } catch {
    return null;
  }
}

async function scanHistory(channel, oldest, context, excludedRoutineNames) {
  let messages;
  try {
    messages = await paged("conversations.history", { channel: channel.id, oldest, inclusive: false, limit: 100 }, "messages");
  } catch (error) {
    return {
      channel: { id: channel.id, name: channel.name || channel.id },
      error: error.message,
      candidates: [],
    };
  }
  const excludedRoutine = excludedRoutineNames.has(channel.name) || excludedRoutineNames.has(channel.name_normalized);
  const candidates = [];
  for (const message of messages) {
    if (message.user === context.bot_user_id) continue;
    if (!isDirectBotMention(message.text, context.bot_user_id)) continue;
    const threadTs = message.thread_ts || message.ts;
    candidates.push({
      trigger: excludedRoutine ? "direct_mention_in_excluded_routine_channel" : "direct_mention",
      channel_id: channel.id,
      channel_name: channel.name || channel.id,
      ts: message.ts,
      thread_ts: threadTs,
      user: message.user || message.username || null,
      text: message.text || "",
      permalink: await permalink(channel.id, message.ts),
    });
  }
  return {
    channel: { id: channel.id, name: channel.name || channel.id },
    error: null,
    candidates,
  };
}

async function scanThreadMentionReplies(channel, oldest, context, excludedRoutineNames) {
  let roots;
  try {
    roots = await paged("conversations.history", {
      channel: channel.id,
      oldest: threadLookbackOldestTs(),
      inclusive: true,
      limit: 200,
    }, "messages");
  } catch (error) {
    return {
      channel: { id: channel.id, name: channel.name || channel.id },
      error: error.message,
      candidates: [],
    };
  }

  const excludedRoutine = excludedRoutineNames.has(channel.name) || excludedRoutineNames.has(channel.name_normalized);
  const candidates = [];
  const seen = new Set();
  for (const root of roots) {
    const threadTs = root.thread_ts || root.ts;
    if (!threadTs) continue;
    if (!root.reply_count && !root.latest_reply) continue;
    if (root.latest_reply && Number(root.latest_reply) <= Number(oldest)) continue;

    let replies;
    try {
      replies = await paged("conversations.replies", {
        channel: channel.id,
        ts: threadTs,
        oldest,
        inclusive: false,
        limit: 100,
      }, "messages");
    } catch (error) {
      candidates.push({
        trigger: "thread_scan_error",
        channel_id: channel.id,
        channel_name: channel.name || channel.id,
        thread_ts: threadTs,
        error: error.message,
      });
      continue;
    }

    for (const reply of replies) {
      if (reply.ts === root.ts) continue;
      if (reply.user === context.bot_user_id) continue;
      if (!isDirectBotMention(reply.text, context.bot_user_id)) continue;
      const key = `${channel.id}:${threadTs}:${reply.ts}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        trigger: excludedRoutine ? "thread_mention_in_excluded_routine_channel" : "thread_mention",
        channel_id: channel.id,
        channel_name: channel.name || channel.id,
        ts: reply.ts,
        thread_ts: threadTs,
        user: reply.user || reply.username || null,
        text: reply.text || "",
        root_user: root.user || root.username || null,
        root_text: root.text || "",
        permalink: await permalink(channel.id, reply.ts),
      });
    }
  }

  return {
    channel: { id: channel.id, name: channel.name || channel.id },
    error: null,
    candidates,
  };
}

async function scanDmHistory(oldest, context) {
  const conversations = await listConversations("im,mpim");
  const results = [];
  for (const conversation of conversations) {
    let messages;
    try {
      messages = await paged("conversations.history", { channel: conversation.id, oldest, inclusive: false, limit: 100 }, "messages");
    } catch (error) {
      const field = error.message.includes("channel_not_found") ? "warning" : "error";
      results.push({
        channel: { id: conversation.id, name: conversation.name || conversation.id },
        [field]: error.message,
        candidates: [],
      });
      continue;
    }
    const candidates = [];
    for (const message of messages) {
      if (message.user === context.bot_user_id) continue;
      candidates.push({
        trigger: conversation.is_im ? "dm" : "group_dm",
        channel_id: conversation.id,
        channel_name: conversation.name || conversation.id,
        ts: message.ts,
        thread_ts: message.thread_ts || message.ts,
        user: message.user || null,
        text: message.text || "",
        permalink: await permalink(conversation.id, message.ts),
      });
    }
    results.push({ channel: { id: conversation.id, name: conversation.name || conversation.id }, error: null, candidates });
  }
  return results;
}

async function scanActiveThreads(oldest, context) {
  const state = loadState();
  const activeThreads = Object.entries(state.active_threads || {}).filter(([, thread]) => thread.status === "active");
  const candidates = [];
  for (const [key, thread] of activeThreads) {
    try {
      const replies = await paged("conversations.replies", {
        channel: thread.channel_id,
        ts: thread.thread_ts || thread.root_message_ts,
        oldest,
        inclusive: false,
        limit: 100,
      }, "messages");
      for (const reply of replies) {
        if (Number(reply.ts) <= Number(oldest)) continue;
        if (reply.ts === (thread.thread_ts || thread.root_message_ts)) continue;
        if (reply.ts === thread.root_message_ts) continue;
        if (reply.user === context.bot_user_id) continue;
        candidates.push({
          trigger: "active_thread_reply",
          active_thread_key: key,
          channel_id: thread.channel_id,
          channel_name: thread.channel_name || thread.channel_id,
          ts: reply.ts,
          thread_ts: thread.thread_ts || thread.root_message_ts,
          user: reply.user || null,
          text: reply.text || "",
          permalink: await permalink(thread.channel_id, reply.ts),
        });
      }
    } catch (error) {
      candidates.push({
        trigger: "active_thread_error",
        active_thread_key: key,
        channel_id: thread.channel_id,
        thread_ts: thread.thread_ts || thread.root_message_ts,
        error: error.message,
      });
    }
  }
  return candidates;
}

async function commandCheckKeychain() {
  const service = keychainService();
  const token = keychainRead(service);
  console.log(JSON.stringify({ status: token ? "present" : "missing", keychain_service: service }, null, 2));
}

async function commandSaveKeychain() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const token = Buffer.concat(chunks).toString("utf8").trim();
  if (!token) throw new Error("No token received on stdin");
  keychainWrite(keychainService(), token);
  console.log(JSON.stringify({ status: "saved", keychain_service: keychainService() }, null, 2));
}

async function commandProbe() {
  const source = tokenInfo().source;
  const auth = await authContext();
  let channels = null;
  try {
    const resolved = await resolveScanChannels();
    channels = {
      resolved: resolved.channels.map((channel) => ({ id: channel.id, name: channel.name, is_member: channel.is_member })),
      missing: resolved.missing,
    };
  } catch (error) {
    channels = { error: error.message };
  }
  console.log(JSON.stringify({ status: "ok", token_source: source, auth, channels }, null, 2));
}

async function commandScan() {
  const context = await authContext();
  const oldest = afterTs();
  const excludedRoutineNames = new Set(splitList(args["excluded-routine-channels"] || process.env.SLACK_ROX_EXCLUDED_ROUTINE_CHANNELS || defaultExcludedRoutineChannels));
  const resolved = await resolveScanChannels();
  const channelResults = [];
  const threadResults = [];
  for (const channel of resolved.channels) {
    channelResults.push(await scanHistory(channel, oldest, context, excludedRoutineNames));
    threadResults.push(await scanThreadMentionReplies(channel, oldest, context, excludedRoutineNames));
  }
  const dmResults = await scanDmHistory(oldest, context);
  const activeThreadCandidates = await scanActiveThreads(oldest, context);
  const candidates = [
    ...channelResults.flatMap((result) => result.candidates),
    ...threadResults.flatMap((result) => result.candidates),
    ...dmResults.flatMap((result) => result.candidates),
    ...activeThreadCandidates,
  ].map((candidate) => {
    if (!candidate.text) return candidate;
    const routingText = candidate.root_text ? `${candidate.root_text}\n${candidate.text}` : candidate.text;
    return {
      ...candidate,
      routing: resolveRoxContext({
        text: routingText,
        channelId: candidate.channel_id,
        channelName: candidate.channel_name,
        policyPath: policyPath(),
      }),
    };
  });
  console.log(JSON.stringify({
    status: "ok",
    oldest,
    auth: context,
    missing_channels: resolved.missing,
    channel_errors: [...channelResults, ...threadResults, ...dmResults].filter((result) => result.error).map((result) => ({ channel: result.channel, error: result.error })),
    warnings: [...channelResults, ...threadResults, ...dmResults].filter((result) => result.warning).map((result) => ({ channel: result.channel, warning: result.warning })),
    candidates,
  }, null, 2));
}

async function commandEnsureChannel() {
  const name = String(args.name || "").trim().replace(/^#/, "").toLowerCase();
  if (!name) throw new Error("--name is required");
  if (!/^[a-z0-9_-]{1,80}$/.test(name)) throw new Error("--name must be a valid Slack channel name");
  const isPrivate = boolValue(args.private, false);
  const conversations = await listConversations("public_channel,private_channel");
  let channel = conversations.find((item) => item.name === name || item.name_normalized === name);
  let created = false;
  if (!channel) {
    const result = await slackApi("conversations.create", { name, is_private: isPrivate });
    channel = result.channel;
    created = true;
  } else if (Boolean(channel.is_private) !== isPrivate) {
    throw new Error(`#${name} already exists with is_private=${Boolean(channel.is_private)}; requested is_private=${isPrivate}`);
  }
  if (args.purpose) {
    await slackApi("conversations.setPurpose", { channel: channel.id, purpose: args.purpose });
  }
  if (args.topic) {
    await slackApi("conversations.setTopic", { channel: channel.id, topic: args.topic });
  }
  const auth = await authContext();
  console.log(JSON.stringify({
    status: created ? "created" : "exists",
    team_id: auth.team_id,
    channel: {
      id: channel.id,
      name: channel.name,
      is_private: Boolean(channel.is_private),
      is_member: channel.is_member ?? true,
    },
  }, null, 2));
}

async function commandSend() {
  if (!args.channel) throw new Error("--channel is required");
  if (!args.message) throw new Error("--message is required");
  const payload = {
    channel: args.channel,
    text: args.message,
  };
  if (args["thread-ts"]) payload.thread_ts = args["thread-ts"];
  const sent = await slackApi("chat.postMessage", payload);
  const link = await permalink(args.channel, sent.ts);
  console.log(JSON.stringify({ status: "sent", channel: sent.channel, ts: sent.ts, link }, null, 2));
}

async function commandEdit() {
  if (!args.channel) throw new Error("--channel is required");
  if (!args.ts) throw new Error("--ts is required");
  if (!args.message) throw new Error("--message is required");
  const updated = await slackApi("chat.update", {
    channel: args.channel,
    ts: args.ts,
    text: args.message,
  });
  const link = await permalink(args.channel, updated.ts);
  console.log(JSON.stringify({ status: "updated", channel: updated.channel, ts: updated.ts, link }, null, 2));
}

async function commandDelete() {
  if (!args.channel) throw new Error("--channel is required");
  if (!args.ts) throw new Error("--ts is required");
  await slackApi("chat.delete", { channel: args.channel, ts: args.ts });
  console.log(JSON.stringify({ status: "deleted", channel: args.channel, ts: args.ts }, null, 2));
}

async function commandUpload() {
  if (!args.channel) throw new Error("--channel is required");
  if (!args.file) throw new Error("--file is required");

  const filePath = path.resolve(String(args.file));
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) throw new Error(`--file is not a regular file: ${filePath}`);
  if (stat.size <= 0) throw new Error(`--file is empty: ${filePath}`);

  const filename = args.filename || path.basename(filePath);
  const title = args.title || filename;
  const upload = await slackApi("files.getUploadURLExternal", {
    filename,
    length: stat.size,
  });

  const uploadResponse = await fetch(upload.upload_url, {
    method: "POST",
    headers: {
      "Content-Type": args["content-type"] || "application/octet-stream",
      "Content-Length": String(stat.size),
    },
    body: fs.readFileSync(filePath),
  });
  const uploadBody = await uploadResponse.text();
  if (!uploadResponse.ok) {
    const detail = uploadBody ? ` body=${uploadBody.slice(0, 200)}` : "";
    throw new Error(`Slack file upload failed: status=${uploadResponse.status}${detail}`);
  }

  const completePayload = {
    files: [{ id: upload.file_id, title }],
    channel_id: args.channel,
  };
  if (args.message) completePayload.initial_comment = args.message;
  if (args["thread-ts"]) completePayload.thread_ts = args["thread-ts"];

  const completed = await slackApi("files.completeUploadExternal", completePayload);
  const file = completed.files?.[0] || null;
  console.log(JSON.stringify({
    status: "uploaded",
    channel: args.channel,
    file_id: upload.file_id,
    filename,
    title,
    link: file?.permalink || null,
  }, null, 2));
}

try {
  if (command === "help" || args.help) {
    process.stdout.write(usage());
  } else if (command === "check-keychain") {
    await commandCheckKeychain();
  } else if (command === "save-keychain") {
    await commandSaveKeychain();
  } else if (command === "probe") {
    await commandProbe();
  } else if (command === "scan") {
    await commandScan();
  } else if (command === "ensure-channel") {
    await commandEnsureChannel();
  } else if (command === "send") {
    await commandSend();
  } else if (command === "edit") {
    await commandEdit();
  } else if (command === "delete") {
    await commandDelete();
  } else if (command === "upload") {
    await commandUpload();
  } else {
    throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
