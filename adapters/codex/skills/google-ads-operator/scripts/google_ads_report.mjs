#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";

const args = parseArgs(process.argv.slice(2));
const envInfo = loadEnvFile(args.envFile || process.env.GOOGLE_ADS_ENV_FILE || ".vibermode-automation.env");
const keychainPrefix = args.keychainPrefix || process.env.GOOGLE_ADS_KEYCHAIN_PREFIX || "viberboyz-google-ads";
const keychainAccount = args.keychainAccount || process.env.GOOGLE_ADS_KEYCHAIN_ACCOUNT || process.env.USER || os.userInfo().username;
const keychainServices = {
  developerToken: args.developerTokenService || process.env.GOOGLE_ADS_DEVELOPER_TOKEN_KEYCHAIN_SERVICE || keychainService("developer-token"),
  customerId: args.customerIdService || process.env.GOOGLE_ADS_CUSTOMER_ID_KEYCHAIN_SERVICE || keychainService("customer-id"),
  loginCustomerId: args.loginCustomerIdService || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID_KEYCHAIN_SERVICE || keychainService("login-customer-id"),
  serviceAccountJsonB64: args.serviceAccountJsonB64Service || process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64_KEYCHAIN_SERVICE || keychainService("service-account-json-b64"),
  clientId: args.clientIdService || process.env.GOOGLE_ADS_CLIENT_ID_KEYCHAIN_SERVICE || keychainService("client-id"),
  clientSecret: args.clientSecretService || process.env.GOOGLE_ADS_CLIENT_SECRET_KEYCHAIN_SERVICE || keychainService("client-secret"),
  refreshToken: args.refreshTokenService || process.env.GOOGLE_ADS_REFRESH_TOKEN_KEYCHAIN_SERVICE || keychainService("refresh-token"),
};

if (args.checkKeychain) {
  console.log(JSON.stringify({
    env_file: envInfo,
    keychain_account: keychainAccount,
    keychain_prefix: keychainPrefix,
    env: {
      GOOGLE_ADS_DEVELOPER_TOKEN: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
      GOOGLE_ADS_CUSTOMER_ID: Boolean(process.env.GOOGLE_ADS_CUSTOMER_ID),
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: Boolean(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
      GOOGLE_ADS_SERVICE_ACCOUNT_JSON: Boolean(process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON),
      GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64: Boolean(process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64),
      GOOGLE_ADS_JSON_KEY_FILE_PATH: Boolean(process.env.GOOGLE_ADS_JSON_KEY_FILE_PATH),
      GOOGLE_ADS_CLIENT_ID: Boolean(process.env.GOOGLE_ADS_CLIENT_ID),
      GOOGLE_ADS_CLIENT_SECRET: Boolean(process.env.GOOGLE_ADS_CLIENT_SECRET),
      GOOGLE_ADS_REFRESH_TOKEN: Boolean(process.env.GOOGLE_ADS_REFRESH_TOKEN),
    },
    keychain: {
      GOOGLE_ADS_DEVELOPER_TOKEN: { service: keychainServices.developerToken, present: hasKeychainValue(keychainServices.developerToken) },
      GOOGLE_ADS_CUSTOMER_ID: { service: keychainServices.customerId, present: hasKeychainValue(keychainServices.customerId) },
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: { service: keychainServices.loginCustomerId, present: hasKeychainValue(keychainServices.loginCustomerId) },
      GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64: { service: keychainServices.serviceAccountJsonB64, present: hasKeychainValue(keychainServices.serviceAccountJsonB64) },
      GOOGLE_ADS_CLIENT_ID: { service: keychainServices.clientId, present: hasKeychainValue(keychainServices.clientId) },
      GOOGLE_ADS_CLIENT_SECRET: { service: keychainServices.clientSecret, present: hasKeychainValue(keychainServices.clientSecret) },
      GOOGLE_ADS_REFRESH_TOKEN: { service: keychainServices.refreshToken, present: hasKeychainValue(keychainServices.refreshToken) },
    },
  }, null, 2));
  process.exit(0);
}

const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || keychainRead(keychainServices.developerToken);
const customerId = normalizeCustomerId(args.customer || args.customerId || process.env.GOOGLE_ADS_CUSTOMER_ID || keychainRead(keychainServices.customerId));
const loginCustomerId = normalizeCustomerId(args.loginCustomer || args.loginCustomerId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || keychainRead(keychainServices.loginCustomerId));
const apiVersion = args.apiVersion || process.env.GOOGLE_ADS_API_VERSION || "v24";
const outputFormat = args.format || "json";
const outputLimit = Number(args.limit ?? 20);

if (!developerToken) fail("GOOGLE_ADS_DEVELOPER_TOKEN is required");

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

function normalizeCustomerId(value) {
  return String(value || "").replace(/-/g, "").trim();
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(header, claim, privateKey) {
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .end()
    .sign(privateKey);
  return `${unsigned}.${base64Url(signature)}`;
}

function loadServiceAccountJson() {
  const rawJson =
    process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    "";
  if (rawJson) return JSON.parse(rawJson);

  const rawB64 =
    process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON_B64 ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64 ||
    keychainRead(keychainServices.serviceAccountJsonB64);
  if (rawB64) return JSON.parse(Buffer.from(rawB64, "base64").toString("utf8"));

  const filePath =
    process.env.GOOGLE_ADS_JSON_KEY_FILE_PATH ||
    process.env.GOOGLE_ADS_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "";
  if (filePath) return JSON.parse(fs.readFileSync(filePath, "utf8"));

  return null;
}

async function tokenFromServiceAccount(serviceAccount) {
  const tokenUri = serviceAccount.token_uri || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/adwords",
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  };
  const impersonatedEmail = process.env.GOOGLE_ADS_IMPERSONATED_EMAIL;
  if (impersonatedEmail) claim.sub = impersonatedEmail;

  const assertion = signJwt({ alg: "RS256", typ: "JWT" }, claim, serviceAccount.private_key);
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`${json.error_description || json.error || response.statusText}`);
  return json.access_token;
}

async function tokenFromRefreshToken() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || keychainRead(keychainServices.clientId);
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || keychainRead(keychainServices.clientSecret);
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || keychainRead(keychainServices.refreshToken);
  if (!clientId || !clientSecret || !refreshToken) return "";

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`${json.error_description || json.error || response.statusText}`);
  return json.access_token;
}

async function accessToken() {
  const serviceAccount = loadServiceAccountJson();
  if (serviceAccount) return tokenFromServiceAccount(serviceAccount);

  const token = await tokenFromRefreshToken();
  if (token) return token;

  fail("Google Ads OAuth credentials are required. Set a service account JSON/path/B64 or GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, and GOOGLE_ADS_REFRESH_TOKEN.");
}

function authHeaders(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;
  return headers;
}

async function googleAdsRequest(path, token, body = null) {
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/${path.replace(/^\/+/, "")}`, {
    method: body ? "POST" : "GET",
    headers: authHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Google Ads API returned non-JSON response (${response.status}): ${text.slice(0, 300)}`);
  }
  if (!response.ok || json.error) {
    const details = json.error?.message || response.statusText;
    throw new Error(`${details} (${json.error?.status || response.status})`);
  }
  return json;
}

function defaultQuery() {
  const dateClause = args.since && args.until
    ? `segments.date BETWEEN '${args.since}' AND '${args.until}'`
    : `segments.date DURING ${args.datePreset || "LAST_7_DAYS"}`;
  return `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM campaign
    WHERE ${dateClause}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${Number(args.queryLimit || 100)}
  `.replace(/\s+/g, " ").trim();
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function micros(value) {
  return num(value) / 1_000_000;
}

function round(value, places = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(places));
}

function flattenSearchStream(chunks) {
  const rows = [];
  for (const chunk of Array.isArray(chunks) ? chunks : [chunks]) {
    if (Array.isArray(chunk.results)) rows.push(...chunk.results);
  }
  return rows;
}

function summarizeRows(rows) {
  return rows.map((row) => ({
    date: row.segments?.date || null,
    campaign_id: row.campaign?.id || null,
    campaign: row.campaign?.name || null,
    status: row.campaign?.status || null,
    cost: round(micros(row.metrics?.costMicros ?? row.metrics?.cost_micros)),
    impressions: num(row.metrics?.impressions),
    clicks: num(row.metrics?.clicks),
    ctr: round(num(row.metrics?.ctr) * 100),
    average_cpc: round(micros(row.metrics?.averageCpc ?? row.metrics?.average_cpc)),
    conversions: round(num(row.metrics?.conversions)),
    cost_per_conversion: round(micros(row.metrics?.costPerConversion ?? row.metrics?.cost_per_conversion)),
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
  lines.push("# Google Ads Performance Report");
  lines.push("");
  lines.push(`Scope: ${report.scope.date_scope} | Customer: ${report.customer_id} | API: ${report.scope.api_version}`);
  lines.push("");
  lines.push("## Totals");
  lines.push(markdownTable(
    ["Cost", "Impressions", "Clicks", "CTR", "Avg CPC", "Conversions", "CPA", "Rows"],
    [[
      mdNumber(report.totals.cost),
      mdNumber(report.totals.impressions),
      mdNumber(report.totals.clicks),
      mdNumber(report.totals.ctr, "%"),
      mdNumber(report.totals.average_cpc),
      mdNumber(report.totals.conversions),
      mdNumber(report.totals.cost_per_conversion),
      report.scope.rows,
    ]],
  ));
  lines.push("");
  lines.push("## Campaigns");
  lines.push(markdownTable(
    ["Date", "Campaign", "Status", "Cost", "Impr.", "Clicks", "CTR", "Avg CPC", "Conv.", "CPA"],
    report.rows.slice(0, outputLimit).map((row) => [
      row.date,
      row.campaign,
      row.status,
      mdNumber(row.cost),
      mdNumber(row.impressions),
      mdNumber(row.clicks),
      mdNumber(row.ctr, "%"),
      mdNumber(row.average_cpc),
      mdNumber(row.conversions),
      mdNumber(row.cost_per_conversion),
    ]),
  ));
  lines.push("");
  lines.push("## Notes");
  lines.push("- This script is read-only and uses GoogleAdsService SearchStream.");
  lines.push("- Customer IDs and login customer IDs must be supplied without hyphens.");
  lines.push("- Do not create, pause, activate, or budget-change Google Ads objects without a separate approved action plan.");
  return lines.join("\n");
}

const token = await accessToken();

if (args.listCustomers) {
  const json = await googleAdsRequest("customers:listAccessibleCustomers", token);
  console.log(JSON.stringify(json, null, 2));
  process.exit(0);
}

if (!customerId) fail("GOOGLE_ADS_CUSTOMER_ID or --customer is required");

const query = args.query || defaultQuery();
const response = await googleAdsRequest(`customers/${customerId}/googleAds:searchStream`, token, { query });
const rows = summarizeRows(flattenSearchStream(response)).sort((a, b) => b.cost - a.cost);
const totals = rows.reduce(
  (acc, row) => {
    acc.cost += num(row.cost);
    acc.impressions += num(row.impressions);
    acc.clicks += num(row.clicks);
    acc.conversions += num(row.conversions);
    return acc;
  },
  { cost: 0, impressions: 0, clicks: 0, conversions: 0 },
);

const report = {
  customer_id: customerId,
  login_customer_id: loginCustomerId || null,
  scope: {
    api_version: apiVersion,
    date_scope: args.since && args.until ? `${args.since} to ${args.until}` : args.datePreset || "LAST_7_DAYS",
    rows: rows.length,
    query,
  },
  totals: {
    cost: round(totals.cost),
    impressions: totals.impressions,
    clicks: totals.clicks,
    conversions: round(totals.conversions),
    ctr: round(totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0),
    average_cpc: totals.clicks ? round(totals.cost / totals.clicks) : null,
    cost_per_conversion: totals.conversions ? round(totals.cost / totals.conversions) : null,
  },
  rows: rows.slice(0, 100),
};

if (outputFormat === "markdown" || outputFormat === "md") {
  console.log(renderMarkdown(report));
} else if (outputFormat === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  fail(`Unsupported --format: ${outputFormat}`);
}
