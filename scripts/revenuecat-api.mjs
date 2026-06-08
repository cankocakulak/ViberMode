#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";

const DEFAULT_KEYCHAIN_PREFIX = "viberboyz";
const DEFAULT_KEYCHAIN_SERVICE = "revenuecat-api-key";
const V1_BASE_URL = "https://api.revenuecat.com/v1";
const V2_BASE_URL = "https://api.revenuecat.com/v2";

function parseArgs(argv) {
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

function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function activeProfile(args) {
  return args.profile || process.env.REVENUECAT_PROFILE || process.env.RC_PROFILE || "";
}

function profileSlug(profile) {
  return String(profile || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function profileEnvPrefix(args) {
  const slug = profileSlug(activeProfile(args));
  if (!slug) return "";
  return `REVENUECAT_${slug.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

function keychainService(args) {
  if (args["keychain-service"]) return args["keychain-service"];
  const prefix = args["keychain-prefix"] || process.env.APP_FACTORY_KEYCHAIN_PREFIX || DEFAULT_KEYCHAIN_PREFIX;
  const slug = profileSlug(activeProfile(args));
  return slug ? `${prefix}-${DEFAULT_KEYCHAIN_SERVICE}-${slug}` : `${prefix}-${DEFAULT_KEYCHAIN_SERVICE}`;
}

function commandExists(command) {
  const result = spawnSync("command", ["-v", command], {
    shell: true,
    encoding: "utf8",
  });
  return result.status === 0;
}

function keychainRead(service) {
  if (!commandExists("security")) return null;

  const result = spawnSync("security", [
    "find-generic-password",
    "-a",
    process.env.USER || "",
    "-s",
    service,
    "-w",
  ], {
    encoding: "utf8",
  });

  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function keychainWrite(service, value) {
  if (!commandExists("security")) {
    throw new Error("macOS security command is not available; use REVENUECAT_API_KEY instead.");
  }

  const result = spawnSync("security", [
    "add-generic-password",
    "-U",
    "-a",
    process.env.USER || "",
    "-s",
    service,
    "-w",
    value,
  ], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `Failed to write Keychain service: ${service}`);
  }
}

function loadToken(args, required = true) {
  const envCandidates = [
    ["REVENUECAT_API_KEY", process.env.REVENUECAT_API_KEY],
    ["REVENUECAT_SECRET_API_KEY", process.env.REVENUECAT_SECRET_API_KEY],
    ["REVENUECAT_ACCESS_TOKEN", process.env.REVENUECAT_ACCESS_TOKEN],
    ["RC_API_KEY", process.env.RC_API_KEY],
    ["RC_SECRET_API_KEY", process.env.RC_SECRET_API_KEY],
  ];

  const envToken = envCandidates.find(([, value]) => Boolean(value));
  if (envToken) {
    return {
      token: envToken[1],
      source: `env:${envToken[0]}`,
      keychain_service: null,
    };
  }

  const service = keychainService(args);
  const keychainToken = keychainRead(service);
  if (keychainToken) {
    return {
      token: keychainToken,
      source: `keychain:${service}`,
      keychain_service: service,
    };
  }

  if (!required) {
    return {
      token: null,
      source: null,
      keychain_service: service,
    };
  }

  throw new Error(`Missing RevenueCat API key. Set REVENUECAT_API_KEY or store one in Keychain service ${service}.`);
}

function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(error, extra = {}) {
  output({
    status: "error",
    message: error instanceof Error ? error.message : String(error),
    ...extra,
  });
  process.exitCode = 1;
}

function usage() {
  return `Usage:
  npm run revenuecat:status
  npm run revenuecat:projects
  npm run revenuecat -- save-keychain --profile <name> --api-key-stdin
  npm run revenuecat -- status --profile <name>
  npm run revenuecat -- create-project --name <project-name> --allow-write true
  npm run revenuecat -- customer --customer-id <app-user-id> [--project-id <project-id>] [--api-version v1|v2]
  npm run revenuecat -- offerings --project-id <project-id>
  npm run revenuecat -- entitlements --project-id <project-id>
  npm run revenuecat -- metrics-overview --project-id <project-id> [--currency USD]
  npm run revenuecat -- public-keys --project-id <project-id> --app-id <app-id>
  npm run revenuecat -- request --path /v2/projects --method GET
  printf '%s' "$REVENUECAT_API_KEY" | npm run revenuecat -- save-keychain --api-key-stdin

Credential sources:
  1. REVENUECAT_API_KEY / REVENUECAT_SECRET_API_KEY / REVENUECAT_ACCESS_TOKEN
  2. macOS Keychain service viberboyz-revenuecat-api-key
  3. With --profile <name>: macOS Keychain service viberboyz-revenuecat-api-key-<name>
`;
}

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function projectId(args) {
  const prefix = profileEnvPrefix(args);
  return args["project-id"]
    || (prefix ? process.env[`${prefix}_PROJECT_ID`] : "")
    || process.env.REVENUECAT_PROJECT_ID
    || process.env.RC_PROJECT_ID;
}

function appId(args) {
  const prefix = profileEnvPrefix(args);
  return args["app-id"]
    || (prefix ? process.env[`${prefix}_APP_ID`] : "")
    || process.env.REVENUECAT_APP_ID
    || process.env.RC_APP_ID;
}

function requireProjectId(args) {
  return requireValue("--project-id or REVENUECAT_PROJECT_ID", projectId(args));
}

function requireAppId(args) {
  return requireValue("--app-id or REVENUECAT_APP_ID", appId(args));
}

function apiVersion(args, fallback = "v2") {
  const version = args["api-version"] || process.env.REVENUECAT_API_VERSION || fallback;
  if (!["v1", "v2"].includes(version)) {
    throw new Error(`Unsupported API version: ${version}`);
  }
  return version;
}

function withQuery(pathname, params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }

  const text = query.toString();
  return text ? `${pathname}?${text}` : pathname;
}

function encodePathPart(value) {
  return encodeURIComponent(requireValue("path part", value));
}

function normalizeApiPath(rawPath, version = "v2") {
  const path = requireValue("--path", rawPath);
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const parsed = new URL(path);
    if (parsed.origin !== "https://api.revenuecat.com") {
      throw new Error("Only https://api.revenuecat.com URLs are allowed.");
    }
    return `${parsed.pathname}${parsed.search}`;
  }

  if (path.startsWith("/v1/") || path.startsWith("/v2/")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `/${version}/${cleanPath}`;
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function revenueCatFetch(apiPath, args, options = {}) {
  const { token, source } = loadToken(args);
  const method = options.method || "GET";
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "ViberMode-RevenueCat-Access",
    ...(options.headers || {}),
  };

  const response = await fetch(`https://api.revenuecat.com${apiPath}`, {
    method,
    headers,
    body: options.body,
  });
  const body = await readResponseBody(response);

  return {
    ok: response.ok,
    status_code: response.status,
    status_text: response.statusText,
    credential_source: source,
    data: body,
  };
}

async function connectivityProbe() {
  try {
    const response = await fetch(`${V1_BASE_URL}/subscribers/vibermode-connectivity-check`, {
      headers: {
        "User-Agent": "ViberMode-RevenueCat-Access",
      },
    });
    return {
      reachable: true,
      status_code: response.status,
      expected_without_credentials: response.status === 401,
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function statusCommand(args) {
  const tokenInfo = loadToken(args, false);
  const probe = await connectivityProbe();
  const configuredProjectId = projectId(args);
  const statusPath = args["status-path"] || (configuredProjectId
    ? `/v2/projects/${encodePathPart(configuredProjectId)}`
    : "/v2/projects?limit=1");

  if (!tokenInfo.token) {
    output({
      status: "blocked_missing_credentials",
      api: {
        v1_base_url: V1_BASE_URL,
        v2_base_url: V2_BASE_URL,
        connectivity: probe,
      },
      credentials: {
        present: false,
        checked_keychain_service: tokenInfo.keychain_service,
        profile: activeProfile(args) || null,
      },
      next_step: activeProfile(args)
        ? `Store a RevenueCat API key with: printf '%s' "$REVENUECAT_API_KEY" | npm run revenuecat -- save-keychain --profile ${activeProfile(args)} --api-key-stdin`
        : `Store a RevenueCat API key with: printf '%s' "$REVENUECAT_API_KEY" | npm run revenuecat -- save-keychain --api-key-stdin`,
    });
    return;
  }

  const apiResult = await revenueCatFetch(statusPath, args);
  output({
    status: apiResult.ok ? "ready" : "blocked_api_check_failed",
    api: {
      v1_base_url: V1_BASE_URL,
      v2_base_url: V2_BASE_URL,
      connectivity: probe,
      check_path: statusPath,
      check_status_code: apiResult.status_code,
    },
    credentials: {
      present: true,
      source: tokenInfo.source,
      profile: activeProfile(args) || null,
    },
    response: apiResult.data,
  });
}

async function requestCommand(args) {
  const method = (args.method || "GET").toUpperCase();
  if (method !== "GET" && !boolValue(args["allow-write"])) {
    throw new Error("Non-GET requests require --allow-write true.");
  }

  const body = args.body || (args["body-file"] ? fs.readFileSync(args["body-file"], "utf8") : undefined);
  const path = normalizeApiPath(args.path, apiVersion(args));
  output(await revenueCatFetch(path, args, { method, body }));
}

async function projectsCommand(args) {
  const path = withQuery("/v2/projects", {
    limit: args.limit || 20,
    starting_after: args["starting-after"],
  });
  output(await revenueCatFetch(path, args));
}

async function createProjectCommand(args) {
  if (!boolValue(args["allow-write"])) {
    throw new Error("Creating a RevenueCat project requires --allow-write true.");
  }

  const body = JSON.stringify({
    name: requireValue("--name", args.name),
  });
  output(await revenueCatFetch("/v2/projects", args, { method: "POST", body }));
}

async function offeringsCommand(args) {
  const path = withQuery(`/v2/projects/${encodePathPart(requireProjectId(args))}/offerings`, {
    limit: args.limit || 20,
    starting_after: args["starting-after"],
    expand: args.expand,
  });
  output(await revenueCatFetch(path, args));
}

async function entitlementsCommand(args) {
  const path = withQuery(`/v2/projects/${encodePathPart(requireProjectId(args))}/entitlements`, {
    limit: args.limit || 20,
    starting_after: args["starting-after"],
    expand: args.expand,
  });
  output(await revenueCatFetch(path, args));
}

async function customerCommand(args) {
  const customerId = requireValue("--customer-id", args["customer-id"]);
  const version = apiVersion(args, projectId(args) ? "v2" : "v1");

  const path = version === "v1"
    ? `/v1/subscribers/${encodePathPart(customerId)}`
    : withQuery(`/v2/projects/${encodePathPart(requireProjectId(args))}/customers/${encodePathPart(customerId)}`, {
      expand: args.expand,
    });

  output(await revenueCatFetch(path, args));
}

async function metricsOverviewCommand(args) {
  const path = withQuery(`/v2/projects/${encodePathPart(requireProjectId(args))}/metrics/overview`, {
    currency: args.currency,
  });
  output(await revenueCatFetch(path, args));
}

async function publicKeysCommand(args) {
  const path = `/v2/projects/${encodePathPart(requireProjectId(args))}/apps/${encodePathPart(requireAppId(args))}/public_api_keys`;
  output(await revenueCatFetch(path, args));
}

async function appCommand(args) {
  const path = `/v2/projects/${encodePathPart(requireProjectId(args))}/apps/${encodePathPart(requireAppId(args))}`;
  output(await revenueCatFetch(path, args));
}

async function storeKitConfigCommand(args) {
  const path = `/v2/projects/${encodePathPart(requireProjectId(args))}/apps/${encodePathPart(requireAppId(args))}/store_kit_config`;
  output(await revenueCatFetch(path, args));
}

function readStdin() {
  return fs.readFileSync(0, "utf8").trim();
}

function tokenHint(token) {
  if (token.startsWith("sk_")) return "v2_secret_api_key";
  if (token.startsWith("atk_")) return "oauth_access_token";
  if (token.startsWith("appl_") || token.startsWith("goog_")) return "public_sdk_api_key";
  return "unrecognized_prefix";
}

function saveKeychainCommand(args) {
  const service = keychainService(args);
  const token = boolValue(args["api-key-stdin"])
    ? readStdin()
    : process.env.REVENUECAT_API_KEY || process.env.REVENUECAT_SECRET_API_KEY || process.env.REVENUECAT_ACCESS_TOKEN || "";

  if (!token) {
    throw new Error("Pass the key on stdin with --api-key-stdin or set REVENUECAT_API_KEY.");
  }

  keychainWrite(service, token);
  output({
    status: "saved",
    keychain_service: service,
    token_kind: tokenHint(token),
  });
}

function checkKeychainCommand(args) {
  const service = keychainService(args);
  output({
    status: keychainRead(service) ? "present" : "missing",
    keychain_service: service,
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "help";

  try {
    switch (command) {
      case "help":
      case "--help":
      case "-h":
        process.stdout.write(usage());
        break;
      case "status":
        await statusCommand(args);
        break;
      case "request":
        await requestCommand(args);
        break;
      case "projects":
        await projectsCommand(args);
        break;
      case "create-project":
        await createProjectCommand(args);
        break;
      case "offerings":
        await offeringsCommand(args);
        break;
      case "entitlements":
        await entitlementsCommand(args);
        break;
      case "customer":
        await customerCommand(args);
        break;
      case "metrics-overview":
        await metricsOverviewCommand(args);
        break;
      case "public-keys":
        await publicKeysCommand(args);
        break;
      case "app":
        await appCommand(args);
        break;
      case "storekit-config":
        await storeKitConfigCommand(args);
        break;
      case "save-keychain":
        saveKeychainCommand(args);
        break;
      case "check-keychain":
        checkKeychainCommand(args);
        break;
      default:
        throw new Error(`Unknown command: ${command}\n\n${usage()}`);
    }
  } catch (error) {
    fail(error);
  }
}

await main();
