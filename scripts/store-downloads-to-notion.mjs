#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DEFAULT_ENV_PATH = ".vibermode-automation.env";
const APP_STORE_CONNECT_AUDIENCE = "appstoreconnect-v1";
const APP_STORE_CONNECT_BASE_URL = "https://api.appstoreconnect.apple.com/v1";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_STORAGE_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only";
const NOTION_BASE_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const FIRST_DOWNLOAD_PRODUCT_TYPES = new Set(["1", "1F", "1T", "F1"]);

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }
  return args;
}

function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function stripQuotes(value) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\""))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    return { loaded: false, path: absolutePath };
  }

  const text = fs.readFileSync(absolutePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = stripQuotes(rawValue.replace(/\s+#.*$/, ""));
  }

  return { loaded: true, path: absolutePath };
}

function requireValue(name, value) {
  if (!value) throw new Error(`Missing required value: ${name}`);
  return value;
}

function compactErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  const httpMatch = message.match(/^HTTP\s+(\d+)/);
  if (httpMatch) return `HTTP ${httpMatch[1]}`;
  return message.split(/\r?\n/)[0].slice(0, 160);
}

function readJsonValue(value, source) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON in ${source}: ${error.message}`);
  }
}

function loadTrackedApps(args) {
  const appsFile = args["apps-file"] || process.env.STORE_DOWNLOADS_TRACKED_APPS_FILE;
  const appsJson = args["apps-json"] || process.env.STORE_DOWNLOADS_TRACKED_APPS_JSON;
  let apps;

  if (appsFile) {
    const absolutePath = path.resolve(appsFile);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Missing tracked apps file: ${absolutePath}`);
    }
    apps = readJsonValue(fs.readFileSync(absolutePath, "utf8"), absolutePath);
  } else if (appsJson) {
    apps = readJsonValue(appsJson, "STORE_DOWNLOADS_TRACKED_APPS_JSON");
  } else {
    throw new Error("Missing tracked apps config. Set STORE_DOWNLOADS_TRACKED_APPS_JSON or STORE_DOWNLOADS_TRACKED_APPS_FILE.");
  }

  if (!Array.isArray(apps) || apps.length === 0) {
    throw new Error("Tracked apps config must be a non-empty JSON array.");
  }

  return apps.map((app, index) => {
    const key = requireValue(`trackedApps[${index}].key`, app.key);
    return {
      key,
      notionName: requireValue(`trackedApps[${index}].notionName`, app.notionName),
      iosSku: app.iosSku || "",
      iosAppleId: app.iosAppleId || "",
      androidPackage: app.androidPackage || "",
    };
  });
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function readDerLength(buffer, offset) {
  const first = buffer[offset];
  if (first < 0x80) {
    return { length: first, offset: offset + 1 };
  }

  const lengthBytes = first & 0x7f;
  let length = 0;
  for (let index = 0; index < lengthBytes; index += 1) {
    length = (length << 8) | buffer[offset + 1 + index];
  }
  return { length, offset: offset + 1 + lengthBytes };
}

function readDerInteger(buffer, offset) {
  if (buffer[offset] !== 0x02) throw new Error("Invalid ECDSA DER signature");
  const lengthInfo = readDerLength(buffer, offset + 1);
  const start = lengthInfo.offset;
  const end = start + lengthInfo.length;
  return { value: buffer.subarray(start, end), offset: end };
}

function derToJose(signature, partLength = 32) {
  const buffer = Buffer.from(signature);
  if (buffer[0] !== 0x30) throw new Error("Invalid ECDSA DER signature");
  const sequence = readDerLength(buffer, 1);
  let offset = sequence.offset;
  const r = readDerInteger(buffer, offset);
  offset = r.offset;
  const s = readDerInteger(buffer, offset);

  const normalize = (value) => {
    let next = Buffer.from(value);
    while (next.length > 0 && next[0] === 0) next = next.subarray(1);
    if (next.length > partLength) next = next.subarray(next.length - partLength);
    if (next.length === partLength) return next;
    return Buffer.concat([Buffer.alloc(partLength - next.length), next]);
  };

  return Buffer.concat([normalize(r.value), normalize(s.value)]);
}

function signJwt(header, payload, privateKey, algorithm) {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.sign("sha256", Buffer.from(signingInput), privateKey);
  const encodedSignature = algorithm === "ES256"
    ? base64Url(derToJose(signature))
    : base64Url(signature);
  return `${signingInput}.${encodedSignature}`;
}

function appStoreConnectToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const key = Buffer.from(credentials.ascApiKeyP8B64, "base64").toString("utf8").trim();
  if (!key.includes("BEGIN PRIVATE KEY")) {
    throw new Error("ASC_API_KEY_P8_B64 did not decode to a .p8 private key");
  }

  return signJwt(
    { alg: "ES256", kid: credentials.ascKeyId, typ: "JWT" },
    {
      iss: credentials.ascIssuerId,
      exp: now + 1200,
      aud: APP_STORE_CONNECT_AUDIENCE,
    },
    key,
    "ES256",
  );
}

function googleServiceAccountTokenAssertion(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: GOOGLE_STORAGE_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    serviceAccount.private_key,
    "RS256",
  );
}

async function googleAccessToken(serviceAccount) {
  const assertion = googleServiceAccountTokenAssertion(serviceAccount);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || `Google OAuth failed with HTTP ${response.status}`);
  }
  return payload.access_token;
}

function parseDateOnly(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`Invalid date: ${value}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function previousCompletedWeek(referenceDate = new Date()) {
  const reference = new Date(referenceDate);
  reference.setHours(12, 0, 0, 0);
  const dayBefore = addDays(reference, -1);
  const end = addDays(dayBefore, -dayBefore.getDay());
  const start = addDays(end, -6);
  return {
    start,
    end,
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

function eachDate(start, end) {
  const dates = [];
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    dates.push(formatDate(cursor));
  }
  return dates;
}

function monthsInRange(start, end) {
  const months = new Set();
  for (const date of eachDate(start, end)) {
    months.add(date.slice(0, 7).replace("-", ""));
  }
  return [...months];
}

function decompressMaybe(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return zlib.gunzipSync(buffer).toString("utf8");
  }
  return buffer.toString("utf8");
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

function numericValue(value) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchBuffer(url, options) {
  const response = await fetch(url, options);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!response.ok) {
    const text = buffer.toString("utf8").slice(0, 600);
    const error = new Error(`HTTP ${response.status}: ${text || response.statusText}`);
    error.status = response.status;
    throw error;
  }
  return buffer;
}

async function fetchAppleDailyReport({ token, vendorNumber, reportDate }) {
  const params = new URLSearchParams({
    "filter[frequency]": "DAILY",
    "filter[reportDate]": reportDate,
    "filter[reportSubType]": "SUMMARY",
    "filter[reportType]": "SALES",
    "filter[vendorNumber]": vendorNumber,
    "filter[version]": "1_0",
  });
  const url = `${APP_STORE_CONNECT_BASE_URL}/salesReports?${params.toString()}`;

  try {
    const buffer = await fetchBuffer(url, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/a-gzip, application/json",
      },
    });
    return parseDelimited(decompressMaybe(buffer), "\t");
  } catch (error) {
    if (error.status === 404) return [];
    throw error;
  }
}

async function collectIosDownloads({ credentials, week, vendorNumbers, trackedApps, verboseErrors }) {
  const token = appStoreConnectToken(credentials);
  const totals = Object.fromEntries(trackedApps.map((app) => [app.key, 0]));
  const errors = [];

  for (const reportDate of eachDate(week.start, week.end)) {
    for (const vendorNumber of vendorNumbers) {
      try {
        const rows = await fetchAppleDailyReport({ token, vendorNumber, reportDate });
        for (const row of rows) {
          const productType = row["Product Type Identifier"];
          if (!FIRST_DOWNLOAD_PRODUCT_TYPES.has(productType)) continue;
          const sku = row.SKU || row["Vendor Identifier"] || "";
          const appleId = row["Apple Identifier"] || "";
          const units = numericValue(row.Units) ?? 0;
          const app = trackedApps.find((candidate) => (
            candidate.iosSku === sku || candidate.iosAppleId === appleId
          ));
          if (!app) continue;
          totals[app.key] += units;
        }
      } catch (error) {
        errors.push({
          reportDate,
          ...(verboseErrors ? { vendorNumber } : {}),
          message: verboseErrors ? error.message : compactErrorMessage(error),
        });
      }
    }
  }

  return { totals, errors };
}

function readGoogleServiceAccount(args) {
  if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64) {
    return JSON.parse(Buffer.from(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64, "base64").toString("utf8"));
  }

  const requestedPath = args["google-service-account"]
    || process.env.GOOGLE_APPLICATION_CREDENTIALS
    || process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH;
  if (!requestedPath) {
    throw new Error("Missing Google service account. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64, GOOGLE_APPLICATION_CREDENTIALS, or GOOGLE_PLAY_SERVICE_ACCOUNT_PATH.");
  }
  const absolutePath = path.resolve(requestedPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing Google service account JSON: ${absolutePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

async function fetchGoogleInstallsCsv({ accessToken, bucket, packageName, yearMonth }) {
  const objectName = `stats/installs/installs_${packageName}_${yearMonth}_country.csv`;
  const encodedObjectName = encodeURIComponent(objectName);
  const encodedBucket = encodeURIComponent(bucket);
  const url = `https://storage.googleapis.com/storage/v1/b/${encodedBucket}/o/${encodedObjectName}?alt=media`;
  const buffer = await fetchBuffer(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "text/csv, application/octet-stream",
    },
  });
  return parseDelimited(decompressMaybe(buffer), ",");
}

async function collectAndroidDownloads({ args, week, trackedApps, verboseErrors }) {
  const bucket = requireValue(
    "--google-play-bucket or GOOGLE_PLAY_BUCKET",
    args["google-play-bucket"] || process.env.GOOGLE_PLAY_BUCKET,
  );
  const serviceAccount = readGoogleServiceAccount(args);
  const accessToken = await googleAccessToken(serviceAccount);
  const totals = Object.fromEntries(trackedApps.map((app) => [app.key, 0]));
  const errors = [];
  const months = monthsInRange(week.start, week.end);
  const startDate = week.startDate;
  const endDate = week.endDate;

  for (const app of trackedApps) {
    if (!app.androidPackage) {
      errors.push({
        app: app.key,
        message: "Missing androidPackage in tracked apps config",
      });
      continue;
    }
    for (const yearMonth of months) {
      try {
        const rows = await fetchGoogleInstallsCsv({
          accessToken,
          bucket,
          packageName: app.androidPackage,
          yearMonth,
        });
        for (const row of rows) {
          const date = row.Date;
          if (!date || date < startDate || date > endDate) continue;
          const packageName = row["Package Name"] || row["Package name"] || "";
          if (packageName && packageName !== app.androidPackage) continue;
          totals[app.key] += numericValue(row["Daily User Installs"]) ?? 0;
        }
      } catch (error) {
        errors.push({
          app: app.key,
          yearMonth,
          ...(verboseErrors ? { packageName: app.androidPackage } : {}),
          message: verboseErrors ? error.message : compactErrorMessage(error),
        });
      }
    }
  }

  return { totals, errors };
}

function notionToken(args) {
  return args["notion-token"] || process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || "";
}

function notionDatabaseId(args) {
  return requireValue(
    "--notion-database-id or NOTION_APP_DOWNLOADS_DATABASE_ID/NOTION_DATABASE_ID",
    args["notion-database-id"]
    || process.env.NOTION_APP_DOWNLOADS_DATABASE_ID
    || process.env.NOTION_DATABASE_ID,
  );
}

async function notionRequest({ token, pathName, method = "GET", body }) {
  const response = await fetch(`${NOTION_BASE_URL}${pathName}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "notion-version": NOTION_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Notion HTTP ${response.status}`);
  }
  return payload;
}

function notionNumberProperty(value) {
  return Number.isFinite(value) ? { number: value } : { number: null };
}

function rowTotal(row) {
  const values = [row.ios, row.android].filter(Number.isFinite);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

function createNotionProperties(row) {
  const properties = {
    "İsim": {
      title: [{ text: { content: row.name } }],
    },
    Date: {
      date: { start: row.weekStart },
    },
  };

  if (Number.isFinite(row.ios)) properties.IOS = notionNumberProperty(row.ios);
  if (Number.isFinite(row.android)) properties.Android = notionNumberProperty(row.android);
  const total = rowTotal(row);
  if (Number.isFinite(total)) properties["Sayı"] = notionNumberProperty(total);

  return properties;
}

function existingNumber(page, propertyName) {
  const property = page?.properties?.[propertyName];
  if (!property || property.type !== "number") return null;
  return Number.isFinite(property.number) ? property.number : null;
}

function isMissing(value) {
  return value === null || value === undefined;
}

function buildPatchProperties(page, row, allowOverwrite) {
  const patch = {};
  const existingIos = existingNumber(page, "IOS");
  const existingAndroid = existingNumber(page, "Android");
  const existingTotal = existingNumber(page, "Sayı");
  let androidWillBeFilled = false;

  if (Number.isFinite(row.ios) && (isMissing(existingIos) || (allowOverwrite && existingIos !== row.ios))) {
    patch.IOS = notionNumberProperty(row.ios);
  }

  if (Number.isFinite(row.android) && (isMissing(existingAndroid) || (allowOverwrite && existingAndroid !== row.android))) {
    patch.Android = notionNumberProperty(row.android);
    if (isMissing(existingAndroid)) androidWillBeFilled = true;
  }

  const desiredTotal = rowTotal({
    ...row,
    ios: Number.isFinite(row.ios) ? row.ios : existingIos,
    android: Number.isFinite(row.android) ? row.android : existingAndroid,
  });
  if (Number.isFinite(desiredTotal)) {
    const existingWasIosOnly = Number.isFinite(existingIos) && existingTotal === existingIos;
    if (
      isMissing(existingTotal)
      || (androidWillBeFilled && existingWasIosOnly)
      || (allowOverwrite && existingTotal !== desiredTotal)
    ) {
      patch["Sayı"] = notionNumberProperty(desiredTotal);
    }
  }

  return patch;
}

async function findExistingNotionRow({ token, databaseId, row }) {
  const payload = await notionRequest({
    token,
    pathName: `/databases/${databaseId}/query`,
    method: "POST",
    body: {
      filter: {
        and: [
          {
            property: "Date",
            date: { equals: row.weekStart },
          },
          {
            property: "İsim",
            title: { equals: row.name },
          },
        ],
      },
      page_size: 10,
    },
  });
  return payload.results || [];
}

async function upsertNotionRows({ args, rows }) {
  const token = notionToken(args);
  if (!token) {
    return {
      status: "skipped",
      reason: "missing_notion_token",
      message: "Set NOTION_API_KEY or NOTION_TOKEN to write directly to Notion.",
    };
  }

  const databaseId = notionDatabaseId(args);
  const dryRun = boolValue(args["dry-run"], false);
  const allowOverwrite = boolValue(args["allow-overwrite"], false);
  const results = [];

  for (const row of rows) {
    const existingRows = await findExistingNotionRow({ token, databaseId, row });
    if (existingRows.length === 0) {
      const properties = createNotionProperties(row);
      if (dryRun) {
        results.push({ action: "create", dryRun: true, name: row.name, properties });
        continue;
      }
      const page = await notionRequest({
        token,
        pathName: "/pages",
        method: "POST",
        body: {
          parent: { database_id: databaseId },
          properties,
        },
      });
      results.push({ action: "created", name: row.name, pageId: page.id, url: page.url });
      continue;
    }

    const page = existingRows[0];
    const patch = buildPatchProperties(page, row, allowOverwrite);
    if (Object.keys(patch).length === 0) {
      results.push({ action: "noop", name: row.name, pageId: page.id, url: page.url });
      continue;
    }

    if (dryRun) {
      results.push({ action: "update", dryRun: true, name: row.name, pageId: page.id, properties: patch });
      continue;
    }

    const updated = await notionRequest({
      token,
      pathName: `/pages/${page.id}`,
      method: "PATCH",
      body: { properties: patch },
    });
    results.push({ action: "updated", name: row.name, pageId: updated.id, url: updated.url, properties: patch });
  }

  return { status: dryRun ? "dry_run" : "complete", databaseId, results };
}

function buildRows({ week, iosTotals, androidTotals, androidAvailableByApp, trackedApps, includeIdentifiers }) {
  return trackedApps.map((app) => {
    const ios = iosTotals?.[app.key];
    const android = androidAvailableByApp?.[app.key] ? androidTotals?.[app.key] : null;
    return {
      key: app.key,
      name: app.notionName,
      weekStart: week.startDate,
      weekEnd: week.endDate,
      ios: Number.isFinite(ios) ? ios : null,
      android: Number.isFinite(android) ? android : null,
      total: rowTotal({
        ios: Number.isFinite(ios) ? ios : null,
        android: Number.isFinite(android) ? android : null,
      }),
      ...(includeIdentifiers ? { identifiers: {
        iosSku: app.iosSku,
        iosAppleId: app.iosAppleId,
        androidPackage: app.androidPackage,
      } } : {}),
    };
  });
}

function androidAvailability(errors, trackedApps) {
  const blockedKeys = new Set(errors.map((error) => error.app).filter(Boolean));
  return Object.fromEntries(trackedApps.map((app) => [app.key, !blockedKeys.has(app.key)]));
}

function loadAppleCredentials(args) {
  return {
    ascKeyId: requireValue("--asc-key-id or ASC_KEY_ID", args["asc-key-id"] || process.env.ASC_KEY_ID),
    ascIssuerId: requireValue("--asc-issuer-id or ASC_ISSUER_ID", args["asc-issuer-id"] || process.env.ASC_ISSUER_ID),
    ascApiKeyP8B64: requireValue(
      "--asc-api-key-p8-b64 or ASC_API_KEY_P8_B64",
      args["asc-api-key-p8-b64"] || process.env.ASC_API_KEY_P8_B64,
    ),
  };
}

function output(value, outputFile) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, text);
  }
  process.stdout.write(text);
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/store-downloads-to-notion.mjs [--date YYYY-MM-DD] [--dry-run]

Purpose:
  Fetch the last completed Monday-Sunday app download counts for configured
  tracked apps and upsert them into a Notion table.

Default week:
  The script uses the last completed Monday-Sunday range strictly before
  the run date. For example, running on 2026-06-08 targets 2026-06-01..2026-06-07.

Credential sources:
  - .vibermode-automation.env is loaded automatically when present.
  - App config: STORE_DOWNLOADS_TRACKED_APPS_JSON or STORE_DOWNLOADS_TRACKED_APPS_FILE
  - iOS: ASC_KEY_ID, ASC_ISSUER_ID, ASC_API_KEY_P8_B64, ASC_VENDOR_NUMBERS
  - Android: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64,
    GOOGLE_APPLICATION_CREDENTIALS, or GOOGLE_PLAY_SERVICE_ACCOUNT_PATH; plus GOOGLE_PLAY_BUCKET
  - Notion writes: NOTION_API_KEY or NOTION_TOKEN; plus NOTION_APP_DOWNLOADS_DATABASE_ID

Useful flags:
  --env-file <path>
  --date YYYY-MM-DD
  --week-start YYYY-MM-DD
  --week-end YYYY-MM-DD
  --dry-run
  --allow-overwrite
  --output <path>
  --skip-ios
  --skip-android
  --skip-notion
  --apps-file <path>
  --apps-json '<json-array>'
  --include-identifiers
  --verbose-errors
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printUsage();
    return;
  }

  const envInfo = loadEnvFile(args["env-file"] || DEFAULT_ENV_PATH);
  const trackedApps = loadTrackedApps(args);
  const verboseErrors = boolValue(args["verbose-errors"], false);
  const week = args["week-start"] && args["week-end"]
    ? {
      start: parseDateOnly(args["week-start"]),
      end: parseDateOnly(args["week-end"]),
      startDate: args["week-start"],
      endDate: args["week-end"],
    }
    : previousCompletedWeek(args.date ? parseDateOnly(args.date) : new Date());

  let iosResult = { totals: Object.fromEntries(trackedApps.map((app) => [app.key, null])), errors: [] };
  if (!boolValue(args["skip-ios"], false)) {
    const vendorNumbers = requireValue(
      "--vendor-numbers or ASC_VENDOR_NUMBERS",
      args["vendor-numbers"] || process.env.ASC_VENDOR_NUMBERS,
    )
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (vendorNumbers.length === 0) {
      throw new Error("ASC_VENDOR_NUMBERS must include at least one vendor number.");
    }

    iosResult = await collectIosDownloads({
      credentials: loadAppleCredentials(args),
      week,
      vendorNumbers,
      trackedApps,
      verboseErrors,
    });
  }

  let androidResult = { totals: Object.fromEntries(trackedApps.map((app) => [app.key, null])), errors: [] };
  if (!boolValue(args["skip-android"], false)) {
    try {
      androidResult = await collectAndroidDownloads({ args, week, trackedApps, verboseErrors });
    } catch (error) {
      androidResult = {
        totals: Object.fromEntries(trackedApps.map((app) => [app.key, null])),
        errors: [{ message: verboseErrors ? error.message : compactErrorMessage(error) }],
      };
    }
  }

  const rows = buildRows({
    week,
    iosTotals: iosResult.totals,
    androidTotals: androidResult.totals,
    androidAvailableByApp: androidAvailability(androidResult.errors, trackedApps),
    trackedApps,
    includeIdentifiers: boolValue(args["include-identifiers"], false),
  });

  const notion = boolValue(args["skip-notion"], false)
    ? { status: "skipped", reason: "skip_notion" }
    : await upsertNotionRows({ args, rows });

  const result = {
    status: "complete",
    env: {
      loaded: envInfo.loaded,
      path: envInfo.path,
    },
    week: {
      start: week.startDate,
      end: week.endDate,
    },
    rows,
    sources: {
      ios: {
        status: iosResult.errors.length > 0 ? "partial" : "complete",
        errors: iosResult.errors,
      },
      android: {
        status: androidResult.errors.length > 0 ? "partial" : "complete",
        errors: androidResult.errors,
      },
      notion,
    },
  };

  output(result, args.output);
}

main().catch((error) => {
  output({
    status: "error",
    message: error.message,
  });
  process.exitCode = 1;
});
