import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateKeyPairSync, verify } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readAccountProfile, loadBoundCredentials, assertBoundSubmission, verifyAccountAccess } from "../scripts/ios-account-profile.mjs";

const profile = { schemaVersion: 1, keychainPrefix: "recipient", appleTeamId: "ABCDEFGHIJ",
  ascIssuerId: "12345678-abcd-1234-abcd-123456789012", bundleId: "com.example.transferred", appStoreAppId: "1234567890" };
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const values = { "apple-team-id": profile.appleTeamId, "asc-key-id": "EXAMPLEKEY",
  "asc-issuer-id": profile.ascIssuerId, "asc-api-key-p8-b64": Buffer.from(privateKey.export({ type: "pkcs8", format: "pem" })).toString("base64"),
  "apple-id": "uploader@example.invalid" };
function credentials(options = {}) {
  return loadBoundCredentials(profile, { env: {}, keychainRead(service) {
    assert.ok(service.startsWith("recipient-"));
    return values[service.slice("recipient-".length)] || null;
  }, ...options });
}
function workspace(t, value = profile) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ios-account-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  if (value !== null) fs.writeFileSync(path.join(dir, "ios-deployment.json"), JSON.stringify(value));
  return dir;
}

test("unbound workspaces preserve legacy routing; bound config roundtrips", (t) => {
  assert.equal(readAccountProfile(workspace(t, null)), null);
  assert.deepEqual(readAccountProfile(workspace(t)), profile);
});
test("invalid or secret-bearing profiles fail closed", (t) => {
  for (const bad of [null, [], {}, { ...profile, privateKey: "secret" }, { ...profile, appleTeamId: "wrong" },
    { ...profile, schemaVersion: 2 }, { ...profile, appStoreAppId: 123 }, { ...profile, bundleId: "" }]) {
    const dir = workspace(t, bad);
    if (bad === null) fs.writeFileSync(path.join(dir, "ios-deployment.json"), "null");
    assert.throws(() => readAccountProfile(dir), /Invalid/);
  }
});
test("bound credentials use only the selected namespace and do not inherit sessions", () => {
  const actual = credentials();
  assert.equal(actual.appleTeamId, profile.appleTeamId);
  assert.equal(actual.prefix, "recipient");
  assert.equal(actual.fastlaneSession, null);
});
test("wrong prefix, global overrides and session authentication are rejected", () => {
  for (const options of [
    { args: { "keychain-prefix": "legacy" } }, { env: { APP_FACTORY_KEYCHAIN_PREFIX: "legacy" } },
    ...["APPLE_TEAM_ID", "ASC_ISSUER_ID", "ASC_KEY_ID", "ASC_API_KEY_P8_B64", "APPLE_ID", "ASC_TEAM_ID", "FASTLANE_SESSION"].map((key) => ({ env: { [key]: "do-not-print-this" } })),
    { args: { "asc-key-id": "override" } }, { args: { "upload-auth": "apple-session" } }, { args: { "signing-auth": "xcode-account" } },
  ]) {
    assert.throws(() => credentials(options), (error) => !error.message.includes("do-not-print-this"));
  }
  assert.equal(credentials({ args: { "keychain-prefix": "recipient" } }).prefix, "recipient");
});
test("wrong team and issuer are rejected before network access", () => {
  for (const suffix of ["apple-team-id", "asc-issuer-id"]) {
    assert.throws(() => credentials({ keychainRead: (service) => service === `recipient-${suffix}` ? "wrong" : values[service.slice(10)] }), /binding conflict/);
  }
});
test("bound submission rejects wrong app and historical manifest version fallback", () => {
  assert.throws(() => assertBoundSubmission(profile, { bundleId: "com.example.other" }, {}), /bundle ID/);
  assert.throws(() => assertBoundSubmission(profile, { bundleId: profile.bundleId }, { submit: "true", "allow-incomplete": "true" }), /explicit/);
  assert.doesNotThrow(() => assertBoundSubmission(profile, { bundleId: profile.bundleId }, { submit: "true", version: "2.0", "build-number": "42" }));
});
test("live verifier issues one signed GET to the exact app; result contains no credentials", async () => {
  let calls = 0;
  const result = await verifyAccountAccess(profile, credentials(), { now: 1800000000000, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, `https://api.appstoreconnect.apple.com/v1/apps/${profile.appStoreAppId}?fields[apps]=bundleId,name`);
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "error");
    const [header, payload, signature] = options.headers.Authorization.slice(7).split(".");
    assert.equal(JSON.parse(Buffer.from(payload, "base64url")).iss, profile.ascIssuerId);
    assert.equal(JSON.parse(Buffer.from(payload, "base64url")).exp, 1800000300);
    assert.equal(JSON.parse(Buffer.from(header, "base64url")).alg, "ES256");
    assert.ok(verify("sha256", Buffer.from(`${header}.${payload}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(signature, "base64url")));
    return { ok: true, json: async () => ({ data: { id: profile.appStoreAppId, attributes: { bundleId: profile.bundleId } } }) };
  } });
  assert.equal(calls, 1);
  assert.equal(result.status, "account_verified");
  assert.ok(!JSON.stringify(result).includes(values["asc-api-key-p8-b64"]));
});
test("API denial, timeout, wrong app, invalid key all fail closed", async () => {
  for (const fetchImpl of [
    async () => ({ ok: false, status: 403 }),
    async () => { throw new Error("private network detail"); },
    async () => ({ ok: true, json: async () => ({ data: { id: "wrong", attributes: { bundleId: profile.bundleId } } }) }),
    async () => ({ ok: true, json: async () => ({ data: { id: profile.appStoreAppId, attributes: { bundleId: "wrong" } } }) }),
  ]) await assert.rejects(verifyAccountAccess(profile, credentials(), { fetchImpl }), /no submission allowed/);
  await assert.rejects(verifyAccountAccess(profile, { ...credentials(), ascApiKeyP8B64: "invalid" }, { fetchImpl: () => assert.fail("must not fetch") }), /no request was sent/);
});
test("CLI account-only mode rejects writes, missing profile, wrong prefix without manifest", (t) => {
  const bound = workspace(t);
  const unbound = workspace(t, null);
  const script = new URL("../scripts/ios-submit-testflight.mjs", import.meta.url);
  for (const [args, expected] of [
    [["--workspace", bound, "--submit"], /cannot be combined/],
    [["--workspace", bound, "--prepare-assets"], /cannot be combined/],
    [["--workspace", unbound], /requires ios-deployment.json/],
    [["--workspace", bound, "--keychain-prefix", "legacy"], /binding conflict/],
  ]) {
    const result = spawnSync(process.execPath, [script.pathname, "--account-preflight", ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, expected);
  }
});
