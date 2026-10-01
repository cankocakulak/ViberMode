#!/usr/bin/env node

import { spawn, execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultStatePath = path.join(repoRoot, ".codex", "slack-codex-operator", "state.json");
const defaultEventDir = path.join(repoRoot, ".codex", "slack-codex-operator", "events");
const defaultPolicyPath = path.join(repoRoot, ".codex", "slack-codex-operator", "policy.yml");
const defaultBotKeychainService = "viberboyz-slack-rox-bot-token";
const defaultAppKeychainService = "viberboyz-slack-rox-app-token";
const defaultAutomationId = "rox-slack-codex-operator";
const defaultLaunchAgentLabel = "com.vibermode.slack-rox-event-bridge";
const defaultReconnectMinMs = 1500;
const defaultReconnectMaxMs = 30000;

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
  node scripts/slack-rox-event-bridge.mjs check-keychain [--app-keychain-service NAME]
  printf '%s' "$SLACK_ROX_APP_TOKEN" | node scripts/slack-rox-event-bridge.mjs save-keychain [--app-keychain-service NAME]
  node scripts/slack-rox-event-bridge.mjs probe [--app-keychain-service NAME] [--bot-keychain-service NAME]
  node scripts/slack-rox-event-bridge.mjs listen [--dry-run] [--codex-bin codex] [--state-path PATH]
  node scripts/slack-rox-event-bridge.mjs install-agent [--write-only] [--skip-probe] [--codex-bin PATH] [--node-bin PATH]
  node scripts/slack-rox-event-bridge.mjs agent-status
  node scripts/slack-rox-event-bridge.mjs uninstall-agent [--keep-plist]

App-level token lookup order:
  SLACK_ROX_APP_TOKEN, SLACK_APP_TOKEN, then macOS Keychain service ${defaultAppKeychainService}

Bot token lookup order:
  SLACK_ROX_BOT_TOKEN, SLACK_BOT_TOKEN, then macOS Keychain service ${defaultBotKeychainService}
`;
}

function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function appKeychainService() {
  return args["app-keychain-service"] || process.env.SLACK_ROX_APP_KEYCHAIN_SERVICE || defaultAppKeychainService;
}

function botKeychainService() {
  return args["bot-keychain-service"] || process.env.SLACK_ROX_KEYCHAIN_SERVICE || defaultBotKeychainService;
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

function appTokenInfo() {
  if (process.env.SLACK_ROX_APP_TOKEN) return { token: process.env.SLACK_ROX_APP_TOKEN, source: "env:SLACK_ROX_APP_TOKEN" };
  if (process.env.SLACK_APP_TOKEN) return { token: process.env.SLACK_APP_TOKEN, source: "env:SLACK_APP_TOKEN" };
  const service = appKeychainService();
  const token = keychainRead(service);
  return token ? { token, source: `keychain:${service}` } : { token: "", source: `missing:${service}` };
}

function botTokenInfo() {
  if (process.env.SLACK_ROX_BOT_TOKEN) return { token: process.env.SLACK_ROX_BOT_TOKEN, source: "env:SLACK_ROX_BOT_TOKEN" };
  if (process.env.SLACK_BOT_TOKEN) return { token: process.env.SLACK_BOT_TOKEN, source: "env:SLACK_BOT_TOKEN" };
  const service = botKeychainService();
  const token = keychainRead(service);
  return token ? { token, source: `keychain:${service}` } : { token: "", source: `missing:${service}` };
}

async function slackApi(method, payload = {}, token) {
  if (!token) throw new Error(`Missing Slack token for ${method}`);
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

async function openSocketUrl() {
  const { token } = appTokenInfo();
  const result = await slackApi("apps.connections.open", {}, token);
  if (!result.url) throw new Error("apps.connections.open returned no websocket URL");
  return result.url;
}

async function botAuthContext() {
  const { token } = botTokenInfo();
  const auth = await slackApi("auth.test", {}, token);
  return {
    team_id: auth.team_id,
    team: auth.team,
    bot_user_id: auth.user_id,
    bot_id: auth.bot_id || null,
    url: auth.url || null,
  };
}

function statePath() {
  return path.resolve(args["state-path"] || process.env.SLACK_ROX_STATE_PATH || defaultStatePath);
}

function eventDir() {
  return path.resolve(args["event-dir"] || process.env.SLACK_ROX_EVENT_DIR || defaultEventDir);
}

function loadState() {
  const target = statePath();
  if (!fs.existsSync(target)) return { active_threads: {} };
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function launchAgentLabel() {
  return args["launch-agent-label"] || process.env.SLACK_ROX_LAUNCH_AGENT_LABEL || defaultLaunchAgentLabel;
}

function launchAgentPath() {
  const configured = args["launch-agent-path"] || process.env.SLACK_ROX_LAUNCH_AGENT_PATH;
  if (configured) return path.resolve(configured);
  return path.join(process.env.HOME || repoRoot, "Library", "LaunchAgents", `${launchAgentLabel()}.plist`);
}

function launchctlDomain() {
  const uid = typeof process.getuid === "function" ? process.getuid() : Number(execFileSync("id", ["-u"], { encoding: "utf8" }).trim());
  return `gui/${uid}`;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function executableOnPath(name) {
  for (const dir of String(process.env.PATH || "").split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, name);
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile() && (stat.mode & 0o111)) return candidate;
    } catch {
      // Keep scanning PATH.
    }
  }
  return "";
}

function codexExecutableForAgent() {
  if (args["codex-bin"]) return path.resolve(String(args["codex-bin"]));
  if (process.env.SLACK_ROX_CODEX_BIN) return process.env.SLACK_ROX_CODEX_BIN;
  const fromPath = executableOnPath("codex");
  if (fromPath) return fromPath;
  const bundled = "/Applications/ChatGPT.app/Contents/Resources/codex";
  return fs.existsSync(bundled) ? bundled : "codex";
}

function nodeExecutableForAgent() {
  if (args["node-bin"]) return path.resolve(String(args["node-bin"]));
  if (process.env.SLACK_ROX_NODE_BIN) return process.env.SLACK_ROX_NODE_BIN;
  const stableHomebrew = "/opt/homebrew/opt/node@20/bin/node";
  if (fs.existsSync(stableHomebrew)) return stableHomebrew;
  const fromPath = executableOnPath("node");
  return fromPath || process.execPath;
}

function launchAgentPathEnv() {
  const codexBin = codexExecutableForAgent();
  const candidates = [
    path.dirname(nodeExecutableForAgent()),
    path.isAbsolute(codexBin) ? path.dirname(codexBin) : "",
    "/opt/homebrew/bin",
    "/opt/homebrew/sbin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
  ].filter(Boolean);
  return [...new Set(candidates)].join(":");
}

function launchAgentLogPaths() {
  const dir = eventDir();
  return {
    stdout: path.join(dir, "launch-agent.out.log"),
    stderr: path.join(dir, "launch-agent.err.log"),
  };
}

function launchAgentPlistXml() {
  const label = launchAgentLabel();
  const logs = launchAgentLogPaths();
  const programArguments = [
    nodeExecutableForAgent(),
    path.join(repoRoot, "scripts", "slack-rox-event-bridge.mjs"),
    "listen",
  ];
  const environment = {
    PATH: launchAgentPathEnv(),
    SLACK_ROX_CODEX_BIN: codexExecutableForAgent(),
  };
  const argumentXml = programArguments.map((item) => `    <string>${xmlEscape(item)}</string>`).join("\n");
  const envXml = Object.entries(environment)
    .map(([key, value]) => `    <key>${xmlEscape(key)}</key>\n    <string>${xmlEscape(value)}</string>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${xmlEscape(label)}</string>
  <key>ProgramArguments</key>
  <array>
${argumentXml}
  </array>
  <key>WorkingDirectory</key>
  <string>${xmlEscape(repoRoot)}</string>
  <key>EnvironmentVariables</key>
  <dict>
${envXml}
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>${xmlEscape(logs.stdout)}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEscape(logs.stderr)}</string>
</dict>
</plist>
`;
}

function launchctl(argsList) {
  try {
    const stdout = execFileSync("launchctl", argsList, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, stdout: stdout.trim(), error: "" };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || "").trim(),
      error: String(error.stderr || error.message || "").trim(),
    };
  }
}

function writeLaunchAgentPlist() {
  const target = launchAgentPath();
  ensureDir(path.dirname(target));
  ensureDir(eventDir());
  fs.writeFileSync(target, launchAgentPlistXml(), { mode: 0o644 });
  execFileSync("plutil", ["-lint", target], { stdio: ["ignore", "ignore", "pipe"] });
  return target;
}

function writeEventRecord(record) {
  const dir = eventDir();
  ensureDir(dir);
  const day = new Date().toISOString().slice(0, 10);
  const target = path.join(dir, `${day}.jsonl`);
  fs.appendFileSync(target, `${JSON.stringify(record)}\n`);
}

function eventTsToIso(ts, fallback = new Date()) {
  const number = Number(ts);
  if (!Number.isFinite(number)) return fallback.toISOString();
  return new Date(Math.floor(number * 1000)).toISOString();
}

function isoBeforeSlackTs(ts, seconds = 2) {
  const number = Number(ts);
  if (!Number.isFinite(number)) return new Date(Date.now() - seconds * 1000).toISOString();
  return new Date(Math.max(0, Math.floor(number * 1000) - seconds * 1000)).toISOString();
}

function isBotAuthored(event, botUserId) {
  return Boolean(event.bot_id || event.subtype === "bot_message" || (botUserId && event.user === botUserId));
}

function isIgnorableMessageSubtype(subtype) {
  return ["message_changed", "message_deleted", "channel_join", "channel_leave"].includes(String(subtype || ""));
}

function activeThreadKeyFor(event) {
  const threadTs = event.thread_ts || event.ts;
  if (!event.channel || !threadTs || threadTs === event.ts) return null;
  const state = loadState();
  for (const [key, thread] of Object.entries(state.active_threads || {})) {
    if (thread.status !== "active") continue;
    if (thread.channel_id !== event.channel) continue;
    const activeThreadTs = thread.thread_ts || thread.root_message_ts;
    if (activeThreadTs === threadTs) return key;
  }
  return null;
}

function classifySlackEvent(event, botUserId) {
  if (!event || typeof event !== "object") return { actionable: false, reason: "missing_event" };
  if (isBotAuthored(event, botUserId)) return { actionable: false, reason: "bot_authored" };

  if (event.type === "app_mention") {
    return {
      actionable: true,
      trigger: "app_mention",
      channel_id: event.channel,
      ts: event.ts,
      thread_ts: event.thread_ts || event.ts,
      user: event.user || null,
      scan_channels: event.channel || "policy",
    };
  }

  if (event.type !== "message") return { actionable: false, reason: `unsupported_event:${event.type || "unknown"}` };
  if (isIgnorableMessageSubtype(event.subtype)) return { actionable: false, reason: `ignored_subtype:${event.subtype}` };

  const channelType = event.channel_type || "";
  if (channelType === "im" || channelType === "mpim" || String(event.channel || "").startsWith("D")) {
    return {
      actionable: true,
      trigger: channelType === "mpim" ? "group_dm" : "dm",
      channel_id: event.channel,
      ts: event.ts,
      thread_ts: event.thread_ts || event.ts,
      user: event.user || null,
      scan_channels: "policy",
    };
  }

  const activeThreadKey = activeThreadKeyFor(event);
  if (activeThreadKey) {
    return {
      actionable: true,
      trigger: "active_thread_reply",
      active_thread_key: activeThreadKey,
      channel_id: event.channel,
      ts: event.ts,
      thread_ts: event.thread_ts,
      user: event.user || null,
      scan_channels: event.channel || "policy",
    };
  }

  return { actionable: false, reason: "not_mention_dm_or_active_thread" };
}

function makeCodexPrompt(batch, afterIso) {
  const events = batch.map(({ classification, event }) => ({
    trigger: classification.trigger,
    channel_id: classification.channel_id,
    ts: classification.ts,
    thread_ts: classification.thread_ts,
    user: classification.user,
    active_thread_key: classification.active_thread_key || null,
    event_type: event.type,
    channel_type: event.channel_type || null,
  }));
  const scanChannels = [...new Set(batch.map((item) => item.classification.scan_channels).filter(Boolean))].join(",");
  const heartbeatTime = new Date().toISOString();
  return `<slack_event_bridge>
  <automation_id>${defaultAutomationId}</automation_id>
  <current_time_iso>${heartbeatTime}</current_time_iso>
  <event_triggered>true</event_triggered>
  <preferred_scan_command>npm run slack:rox:scan -- --channels ${scanChannels || "policy"} --after ${afterIso}</preferred_scan_command>
  <instructions>
Use the installed \`viber-slack-codex-operator\` skill and the canonical workflow at \`/Users/mcan/ViberMode/packs/vibermode/workflows/slack-codex-operator.md\`.
This run was triggered by Slack Socket Mode, not by a scheduled heartbeat. Process only explicit Slack handoffs represented by the bridge events below, plus new replies in active task threads from \`.codex/slack-codex-operator/state.json\`.

Slack access:
1. From \`/Users/mcan/ViberMode\`, prefer the preferred scan command above. It uses the Rox bot token from approved env/Keychain sources and must not print token values.
2. If the scan is unavailable, use the Codex Slack connector only as fallback.
3. If both paths fail, report the exact blocker in this Codex run and leave state auditable.

Action rules:
- Treat app mentions, DMs, and active-thread replies as natural Slack handoffs.
- Use candidate \`routing\`, or run \`npm run slack:rox:context -- resolve\`, before broad discovery.
- Preserve approval gates for DB/payment/billing/discount/contract/HR/privacy/secrets/production/destructive/irreversible actions.
- Reply as Rox in the same thread/DM using \`npm run slack:rox -- send\`; upload only sanitized useful files.
- Update \`.codex/slack-codex-operator/state.json\` after processing and write meaningful reports under \`.codex/slack-codex-operator/reports/\` for real work.
- If no actionable candidate remains after dedupe, update scan state and report exactly \`yeni aksiyon yok\`.
  </instructions>
  <bridge_events_json>${JSON.stringify(events)}</bridge_events_json>
</slack_event_bridge>`;
}

function codexArgs(finalPath) {
  const codexBin = args["codex-bin"] || process.env.SLACK_ROX_CODEX_BIN || "codex";
  const result = [
    "exec",
    "-C",
    repoRoot,
    "--sandbox",
    "danger-full-access",
    "--ask-for-approval",
    "never",
    "--output-last-message",
    finalPath,
    "-",
  ];
  if (args.model || process.env.SLACK_ROX_CODEX_MODEL) {
    result.splice(1, 0, "--model", args.model || process.env.SLACK_ROX_CODEX_MODEL);
  }
  return { codexBin, result };
}

function runCodex(batch) {
  const state = loadState();
  const eventAfterIso = batch
    .map((item) => isoBeforeSlackTs(item.classification.ts || item.event.event_ts))
    .sort()[0] || new Date(Date.now() - 2000).toISOString();
  const afterIso = [state.last_heartbeat_at, eventAfterIso].filter(Boolean).sort()[0] || eventAfterIso;
  const prompt = makeCodexPrompt(batch, afterIso);
  const dir = eventDir();
  ensureDir(dir);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(dir, `codex-${stamp}.log`);
  const finalPath = path.join(dir, `codex-${stamp}.final.txt`);
  const logStream = fs.createWriteStream(logPath, { flags: "a" });
  const { codexBin, result } = codexArgs(finalPath);

  if (args["dry-run"]) {
    const dryRunPath = path.join(dir, `dry-run-${stamp}.json`);
    fs.writeFileSync(dryRunPath, JSON.stringify({ afterIso, batch: batch.map((item) => item.classification), prompt }, null, 2));
    console.log(JSON.stringify({ status: "dry_run_triggered", event_count: batch.length, after: afterIso, path: dryRunPath }, null, 2));
    return Promise.resolve({ status: "dry_run", path: dryRunPath });
  }

  console.log(JSON.stringify({ status: "codex_start", event_count: batch.length, after: afterIso, log_path: logPath }, null, 2));

  return new Promise((resolve) => {
    const child = spawn(codexBin, result, {
      cwd: repoRoot,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.stdin.end(prompt);
    child.stdout.pipe(logStream, { end: false });
    child.stderr.pipe(logStream, { end: false });
    child.on("error", (error) => {
      logStream.write(`\n[bridge] codex spawn error: ${error.message}\n`);
      logStream.end();
      resolve({ status: "spawn_error", error: error.message, logPath });
    });
    child.on("close", (code) => {
      logStream.write(`\n[bridge] codex exit code=${code}\n`);
      logStream.end();
      console.log(JSON.stringify({ status: code === 0 ? "codex_done" : "codex_failed", code, log_path: logPath, final_path: finalPath }, null, 2));
      resolve({ status: code === 0 ? "done" : "failed", code, logPath, finalPath });
    });
  });
}

function encodeFrame(opcode, payload = Buffer.alloc(0)) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
  const length = data.length;
  const lengthBytes = length < 126 ? 0 : length <= 0xffff ? 2 : 8;
  const header = Buffer.alloc(2 + lengthBytes + 4);
  header[0] = 0x80 | opcode;
  if (length < 126) {
    header[1] = 0x80 | length;
  } else if (length <= 0xffff) {
    header[1] = 0x80 | 126;
    header.writeUInt16BE(length, 2);
  } else {
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  const maskOffset = 2 + lengthBytes;
  const mask = crypto.randomBytes(4);
  mask.copy(header, maskOffset);
  const masked = Buffer.alloc(length);
  for (let i = 0; i < length; i += 1) masked[i] = data[i] ^ mask[i % 4];
  return Buffer.concat([header, masked]);
}

class MinimalWebSocket {
  constructor(url) {
    this.url = new URL(url);
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.handshakeComplete = false;
    this.closed = false;
    this.handlers = { message: () => {}, close: () => {}, error: () => {} };
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString("base64");
      const port = Number(this.url.port || 443);
      const socket = tls.connect({ host: this.url.hostname, port, servername: this.url.hostname });
      this.socket = socket;
      socket.once("secureConnect", () => {
        const requestPath = `${this.url.pathname}${this.url.search}`;
        socket.write([
          `GET ${requestPath} HTTP/1.1`,
          `Host: ${this.url.host}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "User-Agent: viber-mode-rox-event-bridge",
          "",
          "",
        ].join("\r\n"));
      });
      socket.on("data", (chunk) => {
        try {
          this.receive(chunk);
          if (this.handshakeComplete) resolve(this);
        } catch (error) {
          reject(error);
          this.handlers.error(error);
          this.close();
        }
      });
      socket.on("error", (error) => {
        if (!this.handshakeComplete) reject(error);
        this.handlers.error(error);
      });
      socket.on("close", () => {
        this.closed = true;
        this.handlers.close();
      });
    });
  }

  receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    if (!this.handshakeComplete) {
      const marker = this.buffer.indexOf("\r\n\r\n");
      if (marker === -1) return;
      const head = this.buffer.slice(0, marker).toString("utf8");
      if (!head.startsWith("HTTP/1.1 101")) throw new Error(`WebSocket handshake failed: ${head.split("\r\n")[0]}`);
      this.buffer = this.buffer.slice(marker + 4);
      this.handshakeComplete = true;
    }
    this.readFrames();
  }

  readFrames() {
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const opcode = first & 0x0f;
      const masked = Boolean(second & 0x80);
      let offset = 2;
      let length = second & 0x7f;
      if (length === 126) {
        if (this.buffer.length < offset + 2) return;
        length = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (length === 127) {
        if (this.buffer.length < offset + 8) return;
        length = Number(this.buffer.readBigUInt64BE(offset));
        offset += 8;
      }
      const maskOffset = masked ? 4 : 0;
      if (this.buffer.length < offset + maskOffset + length) return;
      let payload = this.buffer.slice(offset + maskOffset, offset + maskOffset + length);
      if (masked) {
        const mask = this.buffer.slice(offset, offset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }
      this.buffer = this.buffer.slice(offset + maskOffset + length);
      if (opcode === 0x1) this.handlers.message(payload.toString("utf8"));
      if (opcode === 0x8) this.close();
      if (opcode === 0x9) this.sendPong(payload);
    }
  }

  sendJson(value) {
    this.socket.write(encodeFrame(0x1, JSON.stringify(value)));
  }

  sendPong(payload) {
    if (!this.closed) this.socket.write(encodeFrame(0x0a, payload));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.socket?.end(encodeFrame(0x8));
    } catch {
      // Socket is already gone.
    }
  }
}

async function commandCheckKeychain() {
  const service = appKeychainService();
  const token = keychainRead(service);
  console.log(JSON.stringify({ status: token ? "present" : "missing", app_keychain_service: service }, null, 2));
}

async function commandSaveKeychain() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const token = Buffer.concat(chunks).toString("utf8").trim();
  if (!token) throw new Error("No token received on stdin");
  if (!token.startsWith("xapp-")) throw new Error("Expected a Slack app-level token starting with xapp-");
  keychainWrite(appKeychainService(), token);
  console.log(JSON.stringify({ status: "saved", app_keychain_service: appKeychainService() }, null, 2));
}

async function probeBridge() {
  const appSource = appTokenInfo().source;
  const botSource = botTokenInfo().source;
  const auth = await botAuthContext();
  const socket = await openSocketUrl();
  return {
    status: "ok",
    app_token_source: appSource,
    bot_token_source: botSource,
    auth,
    socket_url_present: Boolean(socket),
  };
}

async function commandProbe() {
  console.log(JSON.stringify(await probeBridge(), null, 2));
}

async function commandInstallAgent() {
  const writeOnly = boolValue(args["write-only"], false);
  const skipProbe = boolValue(args["skip-probe"], false);
  let probe = null;
  if (!writeOnly && !skipProbe) {
    probe = await probeBridge();
  }

  const plistPath = writeLaunchAgentPlist();
  const label = launchAgentLabel();
  const domain = launchctlDomain();
  const logs = launchAgentLogPaths();

  if (writeOnly) {
    console.log(JSON.stringify({
      status: "written",
      loaded: false,
      reason: "write_only",
      label,
      plist_path: plistPath,
      log_paths: logs,
    }, null, 2));
    return;
  }

  launchctl(["bootout", domain, plistPath]);
  const bootstrap = launchctl(["bootstrap", domain, plistPath]);
  if (!bootstrap.ok && !bootstrap.error.includes("already bootstrapped")) {
    throw new Error(`launchctl bootstrap failed: ${bootstrap.error || bootstrap.stdout || "unknown"}`);
  }
  const kickstart = launchctl(["kickstart", "-k", `${domain}/${label}`]);
  if (!kickstart.ok) {
    throw new Error(`launchctl kickstart failed: ${kickstart.error || kickstart.stdout || "unknown"}`);
  }
  console.log(JSON.stringify({
    status: "installed",
    loaded: true,
    label,
    plist_path: plistPath,
    log_paths: logs,
    probe,
  }, null, 2));
}

async function commandAgentStatus() {
  const plistPath = launchAgentPath();
  const label = launchAgentLabel();
  const domain = launchctlDomain();
  const printed = launchctl(["print", `${domain}/${label}`]);
  const stdout = printed.stdout || "";
  const pidMatch = stdout.match(/pid = (\d+)/);
  const lastExitMatch = stdout.match(/last exit code = (-?\d+)/);
  console.log(JSON.stringify({
    status: "ok",
    label,
    plist_path: plistPath,
    installed: fs.existsSync(plistPath),
    loaded: printed.ok,
    pid: pidMatch ? Number(pidMatch[1]) : null,
    last_exit_code: lastExitMatch ? Number(lastExitMatch[1]) : null,
    log_paths: launchAgentLogPaths(),
    error: printed.ok ? null : printed.error || null,
  }, null, 2));
}

async function commandUninstallAgent() {
  const plistPath = launchAgentPath();
  const label = launchAgentLabel();
  const domain = launchctlDomain();
  const bootout = launchctl(["bootout", domain, plistPath]);
  if (!boolValue(args["keep-plist"], false) && fs.existsSync(plistPath)) {
    fs.unlinkSync(plistPath);
  }
  console.log(JSON.stringify({
    status: "uninstalled",
    label,
    plist_path: plistPath,
    plist_present: fs.existsSync(plistPath),
    bootout_ok: bootout.ok,
    bootout_error: bootout.ok ? null : bootout.error || null,
  }, null, 2));
}

async function commandListen() {
  const botAuth = await botAuthContext();
  const seen = new Set();
  const pending = [];
  let running = false;
  let reconnectDelay = defaultReconnectMinMs;

  async function processQueue() {
    if (running || pending.length === 0) return;
    running = true;
    const batch = pending.splice(0, pending.length);
    try {
      await runCodex(batch);
    } finally {
      running = false;
      if (pending.length > 0) setTimeout(processQueue, 500);
    }
  }

  function enqueue(envelope, event, classification) {
    const key = envelope.payload?.event_id || `${classification.channel_id}:${classification.ts}:${classification.trigger}`;
    if (seen.has(key)) return;
    seen.add(key);
    pending.push({ envelope, event, classification });
    writeEventRecord({
      at: new Date().toISOString(),
      status: "queued",
      event_key: key,
      classification,
    });
    setTimeout(processQueue, 1000);
  }

  async function connectOnce() {
    const socketUrl = await openSocketUrl();
    const ws = new MinimalWebSocket(socketUrl);
    ws.on("message", (text) => {
      let envelope;
      try {
        envelope = JSON.parse(text);
      } catch (error) {
        writeEventRecord({ at: new Date().toISOString(), status: "invalid_json", error: error.message });
        return;
      }
      if (envelope.envelope_id) {
        ws.sendJson({ envelope_id: envelope.envelope_id });
      }
      const event = envelope.payload?.event;
      const classification = classifySlackEvent(event, botAuth.bot_user_id);
      writeEventRecord({
        at: new Date().toISOString(),
        status: classification.actionable ? "actionable" : "ignored",
        envelope_type: envelope.type || null,
        payload_type: envelope.payload?.type || null,
        event_time: eventTsToIso(event?.event_ts || event?.ts),
        classification,
      });
      if (classification.actionable) enqueue(envelope, event, classification);
    });
    ws.on("error", (error) => {
      writeEventRecord({ at: new Date().toISOString(), status: "socket_error", error: error.message });
    });
    await ws.connect();
    reconnectDelay = defaultReconnectMinMs;
    console.log(JSON.stringify({ status: "listening", team: botAuth.team, bot_user_id: botAuth.bot_user_id }, null, 2));
    await new Promise((resolve) => ws.on("close", resolve));
  }

  while (true) {
    try {
      await connectOnce();
    } catch (error) {
      writeEventRecord({ at: new Date().toISOString(), status: "connect_error", error: error.message });
      console.error(`connect_error: ${error.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, reconnectDelay));
    reconnectDelay = Math.min(defaultReconnectMaxMs, Math.floor(reconnectDelay * 1.8));
  }
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
  } else if (command === "install-agent") {
    await commandInstallAgent();
  } else if (command === "agent-status") {
    await commandAgentStatus();
  } else if (command === "uninstall-agent") {
    await commandUninstallAgent();
  } else if (command === "listen") {
    await commandListen();
  } else {
    throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
