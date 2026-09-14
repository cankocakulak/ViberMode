import fs from "node:fs";
import path from "node:path";
import { sign } from "node:crypto";

export function readAccountProfile(workspacePath) {
  const file = path.join(workspacePath, "ios-deployment.json");
  if (!fs.existsSync(file)) return null;
  const profile = JSON.parse(fs.readFileSync(file, "utf8"));
  const fields = ["schemaVersion", "keychainPrefix", "appleTeamId", "ascIssuerId", "bundleId", "appStoreAppId"];
  if (!profile || Array.isArray(profile) || typeof profile !== "object"
      || Object.keys(profile).some((key) => !fields.includes(key))) {
    throw new Error("Invalid ios-deployment.json: only the documented non-secret fields are allowed");
  }
  if (profile.schemaVersion !== 1
      || !/^[a-zA-Z0-9_-]+$/.test(profile.keychainPrefix || "")
      || !/^[A-Z0-9]{10}$/.test(profile.appleTeamId || "")
      || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(profile.ascIssuerId || "")
      || !/^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(profile.bundleId || "")
      || typeof profile.appStoreAppId !== "string" || !/^\d+$/.test(profile.appStoreAppId)) {
    throw new Error("Invalid ios-deployment.json: all six account binding fields are required");
  }
  return profile;
}

// Bound profiles are an atomic Keychain namespace. Global CI/session values must
// not silently mix credentials from different organizations.
export function loadBoundCredentials(profile, { args = {}, env = process.env, keychainRead }) {
  for (const prefix of [args["keychain-prefix"], env.APP_FACTORY_KEYCHAIN_PREFIX]) {
    if (prefix && prefix !== profile.keychainPrefix) throw new Error("Account binding conflict: keychain prefix");
  }
  const overrides = {
    "apple-team-id": "APPLE_TEAM_ID", "asc-key-id": "ASC_KEY_ID",
    "asc-issuer-id": "ASC_ISSUER_ID", "asc-api-key-p8-b64": "ASC_API_KEY_P8_B64",
    "apple-id": "APPLE_ID", "asc-team-id": "ASC_TEAM_ID",
  };
  for (const [argument, variable] of Object.entries(overrides)) {
    if (args[argument] || env[variable]) {
      throw new Error(`Bound account uses Keychain only; unset --${argument} / ${variable}`);
    }
  }
  if (env.FASTLANE_SESSION) throw new Error("Bound account uses API-key authentication; unset FASTLANE_SESSION");
  for (const option of ["signing-auth", "upload-auth"]) {
    if (args[option] && args[option] !== "api-key") throw new Error(`Bound account requires --${option} api-key`);
  }
  const prefix = profile.keychainPrefix;
  const read = (name, required = true) => keychainRead(`${prefix}-${name}`, required);
  const credentials = {
    prefix, appleTeamId: read("apple-team-id"), ascKeyId: read("asc-key-id"),
    ascIssuerId: read("asc-issuer-id"), ascApiKeyP8B64: read("asc-api-key-p8-b64"),
    appleId: read("apple-id"), ascTeamId: read("asc-team-id", false), fastlaneSession: null,
  };
  if (credentials.appleTeamId !== profile.appleTeamId) throw new Error("Account binding conflict: Apple team ID");
  if (credentials.ascIssuerId !== profile.ascIssuerId) throw new Error("Account binding conflict: ASC issuer ID");
  return credentials;
}

export function assertBoundSubmission(profile, context, args) {
  if (context.bundleId !== profile.bundleId) throw new Error("Account binding conflict: bundle ID");
  if (["true", "1", "yes", "y", "on"].includes(String(args.submit).toLowerCase())) {
    if (!args.version || !args["build-number"]) {
      throw new Error("Bound existing app requires explicit --version and --build-number; historical manifest values are not release intent");
    }
  }
}

export async function verifyAccountAccess(profile, credentials, { fetchImpl = globalThis.fetch, now = Date.now() } = {}) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const timestamp = Math.floor(now / 1000);
  const unsigned = `${encode({ alg: "ES256", kid: credentials.ascKeyId, typ: "JWT" })}.${encode({
    iss: credentials.ascIssuerId, iat: timestamp, exp: timestamp + 300, aud: "appstoreconnect-v1",
  })}`;
  let signature;
  try {
    signature = sign("sha256", Buffer.from(unsigned), {
      key: Buffer.from(credentials.ascApiKeyP8B64, "base64").toString("utf8"), dsaEncoding: "ieee-p1363",
    }).toString("base64url");
  } catch {
    throw new Error("ASC private key is invalid; no request was sent");
  }
  let response;
  try {
    response = await fetchImpl(`https://api.appstoreconnect.apple.com/v1/apps/${profile.appStoreAppId}?fields[apps]=bundleId,name`, {
      method: "GET", redirect: "error", signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${unsigned}.${signature}` },
    });
  } catch {
    throw new Error("ASC account verification could not connect; no submission allowed");
  }
  if (!response.ok) throw new Error(`ASC account verification failed (HTTP ${response.status}); no submission allowed`);
  const body = await response.json();
  if (body.data?.id !== profile.appStoreAppId || body.data?.attributes?.bundleId !== profile.bundleId) {
    throw new Error("ASC account verification returned a different app; no submission allowed");
  }
  return { status: "account_verified", keychain_prefix: profile.keychainPrefix,
    apple_team_id: profile.appleTeamId, app_store_app_id: profile.appStoreAppId, bundle_id: profile.bundleId,
    note: "Read-only app access verified. This does not prove archive/export, upload permissions, or release readiness." };
}
