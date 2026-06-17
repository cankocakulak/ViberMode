#!/usr/bin/env node

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";

const args = parseArgs(process.argv.slice(2));
const envInfo = loadEnvFile(args.envFile || process.env.TIKTOK_ENV_FILE || ".vibermode-automation.env");
const keychainPrefix = args.keychainPrefix || process.env.TIKTOK_KEYCHAIN_PREFIX || "viberboyz-tiktok";
const keychainAccount = args.keychainAccount || process.env.TIKTOK_KEYCHAIN_ACCOUNT || process.env.USER || os.userInfo().username;
const keychainServices = {
  accessToken: args.accessTokenService || process.env.TIKTOK_ACCESS_TOKEN_KEYCHAIN_SERVICE || keychainService("access-token"),
  advertiserId: args.advertiserIdService || process.env.TIKTOK_ADVERTISER_ID_KEYCHAIN_SERVICE || keychainService("advertiser-id"),
  appId: args.appIdService || process.env.TIKTOK_APP_ID_KEYCHAIN_SERVICE || keychainService("app-id"),
  appSecret: args.appSecretService || process.env.TIKTOK_APP_SECRET_KEYCHAIN_SERVICE || keychainService("app-secret"),
};

if (args.checkKeychain) {
  console.log(JSON.stringify({
    env_file: envInfo,
    keychain_account: keychainAccount,
    keychain_prefix: keychainPrefix,
    env: {
      TIKTOK_ACCESS_TOKEN: Boolean(process.env.TIKTOK_ACCESS_TOKEN),
      TIKTOK_ADVERTISER_ID: Boolean(process.env.TIKTOK_ADVERTISER_ID),
      TIKTOK_API_VERSION: Boolean(process.env.TIKTOK_API_VERSION),
      TIKTOK_APP_ID: Boolean(process.env.TIKTOK_APP_ID),
      TIKTOK_APP_SECRET: Boolean(process.env.TIKTOK_APP_SECRET),
    },
    keychain: {
      TIKTOK_ACCESS_TOKEN: { service: keychainServices.accessToken, present: hasKeychainValue(keychainServices.accessToken) },
      TIKTOK_ADVERTISER_ID: { service: keychainServices.advertiserId, present: hasKeychainValue(keychainServices.advertiserId) },
      TIKTOK_APP_ID: { service: keychainServices.appId, present: hasKeychainValue(keychainServices.appId) },
      TIKTOK_APP_SECRET: { service: keychainServices.appSecret, present: hasKeychainValue(keychainServices.appSecret) },
    },
  }, null, 2));
  process.exit(0);
}

const token = process.env.TIKTOK_ACCESS_TOKEN || keychainRead(keychainServices.accessToken);
const advertiserId = args.advertiser || args.advertiserId || process.env.TIKTOK_ADVERTISER_ID || keychainRead(keychainServices.advertiserId);
const apiVersion = args.apiVersion || process.env.TIKTOK_API_VERSION || "v1.3";
const apiBase = (args.apiBase || process.env.TIKTOK_API_BASE || "https://business-api.tiktok.com").replace(/\/+$/, "");
const outputFormat = args.format || "json";
const outputLimit = Number(args.limit ?? 15);
const pageSize = Number(args.pageSize ?? process.env.TIKTOK_REPORT_PAGE_SIZE ?? 100);
const minSpend = Number(args.minSpend ?? 0);
const dateRange = resolveDateRange(args);
const dimensions = csv(args.dimensions || process.env.TIKTOK_REPORT_DIMENSIONS || "campaign_id,adgroup_id,ad_id,stat_time_day");
const metrics = csv(args.metrics || process.env.TIKTOK_REPORT_METRICS || "spend,impressions,clicks,ctr,cpc,cpm,conversion,cost_per_conversion");
const reportType = args.reportType || process.env.TIKTOK_REPORT_TYPE || "BASIC";
const dataLevel = args.dataLevel || process.env.TIKTOK_DATA_LEVEL || "AUCTION_AD";

if (!token) fail("TIKTOK_ACCESS_TOKEN is required");
if (!advertiserId) fail("TIKTOK_ADVERTISER_ID or --advertiser is required");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function fail(message) {
  console.error(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return { loaded: false, path: filePath || null };
  const text = fs.readFileSync(filePath, "utf8");
  let loadedKeys = 0;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = stripQuotes(rawValue.replace(/\s+#.*$/, ""));
    loadedKeys++;
  }
  return { loaded: true, path: filePath, loaded_keys: loadedKeys };
}

function keychainService(name) {
  return `${keychainPrefix}-${name}`;
}

function keychainRead(service) {
  try {
    return execFileSync("security", [
      "find-generic-password",
      "-a",
      keychainAccount,
      "-s",
      service,
      "-w",
    ], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function hasKeychainValue(service) {
  return Boolean(keychainRead(service));
}

function csv(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function resolveDateRange(parsedArgs) {
  if (parsedArgs.since && parsedArgs.until) {
    return { since: parsedArgs.since, until: parsedArgs.until, preset: null };
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const preset = parsedArgs.datePreset || "last_7d";

  if (preset === "today") return { since: toDateString(today), until: toDateString(today), preset };
  if (preset === "yesterday") {
    const yesterday = addDays(today, -1);
    return { since: toDateString(yesterday), until: toDateString(yesterday), preset };
  }
  if (preset === "last_30d") return { since: toDateString(addDays(today, -30)), until: toDateString(addDays(today, -1)), preset };
  if (preset === "last_14d") return { since: toDateString(addDays(today, -14)), until: toDateString(addDays(today, -1)), preset };
  if (preset === "last_7d") return { since: toDateString(addDays(today, -7)), until: toDateString(addDays(today, -1)), preset };

  fail(`Unsupported --date-preset: ${preset}. Use today, yesterday, last_7d, last_14d, last_30d, or --since/--until.`);
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, places = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(places));
}

function endpoint(path) {
  return `${apiBase}/open_api/${apiVersion}/${path.replace(/^\/+/, "")}`;
}

async function tiktokGet(path, params = {}) {
  const url = new URL(endpoint(path));
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      url.searchParams.set(key, JSON.stringify(value));
    } else if (typeof value === "object") {
      url.searchParams.set(key, JSON.stringify(value));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      "Access-Token": token,
      "Content-Type": "application/json",
      "User-Agent": "vibermode-tiktok-ads-operator/0.1",
    },
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`TikTok API returned non-JSON response (${response.status}): ${text.slice(0, 300)}`);
  }
  if (!response.ok || (json.code !== undefined && Number(json.code) !== 0)) {
    throw new Error(`${json.message || json.msg || response.statusText} (${json.code ?? response.status})`);
  }
  return json;
}

async function fetchReportPage(page) {
  return tiktokGet("report/integrated/get/", {
    advertiser_id: advertiserId,
    report_type: reportType,
    data_level: dataLevel,
    dimensions,
    metrics,
    start_date: dateRange.since,
    end_date: dateRange.until,
    order_field: args.orderField || "spend",
    order_type: args.orderType || "DESC",
    page,
    page_size: pageSize,
    enable_total_metrics: true,
  });
}

async function fetchAllReportRows() {
  const rows = [];
  let totalPage = 1;
  for (let page = 1; page <= totalPage; page++) {
    const json = await fetchReportPage(page);
    const data = json.data || {};
    const list = data.list || data.report_list || [];
    rows.push(...list);
    totalPage = Number(data.page_info?.total_page || data.page_info?.total_pages || totalPage || 1);
    if (page >= Number(args.maxPages || 25)) break;
  }
  return rows;
}

function flattenRow(row) {
  return {
    ...(row.dimensions || {}),
    ...(row.metrics || {}),
    ...Object.fromEntries(Object.entries(row).filter(([key]) => !["dimensions", "metrics"].includes(key))),
  };
}

function metric(row, name) {
  return num(row[name]);
}

function rowName(row) {
  return row.ad_name || row.ad_id || row.adgroup_name || row.adgroup_id || row.campaign_name || row.campaign_id || row.stat_time_day || "row";
}

function summarizeRows(rows) {
  return rows.map((row) => ({
    date: row.stat_time_day || row.stat_time_hour || null,
    campaign_id: row.campaign_id || null,
    adgroup_id: row.adgroup_id || null,
    ad_id: row.ad_id || null,
    name: rowName(row),
    spend: round(metric(row, "spend")),
    impressions: metric(row, "impressions"),
    clicks: metric(row, "clicks"),
    ctr: round(metric(row, "ctr")),
    cpc: round(metric(row, "cpc")),
    cpm: round(metric(row, "cpm")),
    conversion: metric(row, "conversion") || metric(row, "conversions"),
    cost_per_conversion: round(metric(row, "cost_per_conversion")),
  }));
}

function mdCell(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function mdNumber(value, suffix = "") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "-";
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}${suffix}`;
}

function markdownTable(headers, rows) {
  const header = `| ${headers.map(mdCell).join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(mdCell).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# TikTok Ads Performance Report");
  lines.push("");
  lines.push(`Scope: ${report.scope.since} to ${report.scope.until} | Advertiser: ${report.advertiser_id} | Data level: ${report.scope.data_level}`);
  lines.push("");
  lines.push("## Totals");
  lines.push(markdownTable(
    ["Spend", "Impressions", "Clicks", "CTR", "CPC", "CPM", "Conversions", "CPA", "Rows"],
    [[
      mdNumber(report.totals.spend),
      mdNumber(report.totals.impressions),
      mdNumber(report.totals.clicks),
      mdNumber(report.totals.ctr, "%"),
      mdNumber(report.totals.cpc),
      mdNumber(report.totals.cpm),
      mdNumber(report.totals.conversion),
      mdNumber(report.totals.cost_per_conversion),
      report.scope.rows,
    ]],
  ));
  lines.push("");
  lines.push("## Top Rows");
  lines.push(markdownTable(
    ["Date", "Name", "Campaign", "Ad Group", "Ad", "Spend", "Impr.", "Clicks", "CTR", "CPC", "Conv.", "CPA"],
    report.rows.slice(0, outputLimit).map((row) => [
      row.date,
      row.name,
      row.campaign_id,
      row.adgroup_id,
      row.ad_id,
      mdNumber(row.spend),
      mdNumber(row.impressions),
      mdNumber(row.clicks),
      mdNumber(row.ctr, "%"),
      mdNumber(row.cpc),
      mdNumber(row.conversion),
      mdNumber(row.cost_per_conversion),
    ]),
  ));
  lines.push("");
  lines.push("## Notes");
  lines.push("- This script is read-only and uses TikTok API for Business reporting endpoints.");
  lines.push("- Conversion names and attribution depend on the advertiser optimization event and tracking setup.");
  lines.push("- Do not create, activate, pause, or budget-change TikTok objects without a separate approved action plan.");
  return lines.join("\n");
}

const rawRows = await fetchAllReportRows();
const rows = rawRows
  .map(flattenRow)
  .filter((row) => metric(row, "spend") >= minSpend)
  .sort((a, b) => metric(b, "spend") - metric(a, "spend"));

const totals = rows.reduce(
  (acc, row) => {
    acc.spend += metric(row, "spend");
    acc.impressions += metric(row, "impressions");
    acc.clicks += metric(row, "clicks");
    acc.conversion += metric(row, "conversion") || metric(row, "conversions");
    return acc;
  },
  { spend: 0, impressions: 0, clicks: 0, conversion: 0 },
);

const report = {
  advertiser_id: advertiserId,
  scope: {
    api_version: apiVersion,
    report_type: reportType,
    data_level: dataLevel,
    date_preset: dateRange.preset,
    since: dateRange.since,
    until: dateRange.until,
    dimensions,
    metrics,
    min_spend: minSpend,
    rows: rows.length,
  },
  totals: {
    spend: round(totals.spend),
    impressions: totals.impressions,
    clicks: totals.clicks,
    conversion: totals.conversion,
    ctr: round(totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0),
    cpc: totals.clicks ? round(totals.spend / totals.clicks) : null,
    cpm: totals.impressions ? round((totals.spend / totals.impressions) * 1000) : null,
    cost_per_conversion: totals.conversion ? round(totals.spend / totals.conversion) : null,
  },
  rows: summarizeRows(rows).slice(0, 100),
};

if (outputFormat === "markdown" || outputFormat === "md") {
  console.log(renderMarkdown(report));
} else if (outputFormat === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  fail(`Unsupported --format: ${outputFormat}`);
}
