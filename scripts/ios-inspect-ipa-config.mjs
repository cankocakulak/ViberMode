#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = {
    requireKey: [],
    expectKey: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    if (key === "help") {
      args.help = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    index += 1;

    if (key === "require-key") {
      args.requireKey.push(next);
    } else if (key === "expect-key") {
      args.expectKey.push(next);
    } else {
      args[key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = next;
    }
  }

  return args;
}

function usage() {
  return `Usage:
  node scripts/ios-inspect-ipa-config.mjs --ipa /path/to/App.ipa [options]

Options:
  --expect-bundle-id <id>       Require CFBundleIdentifier to match.
  --expect-version <version>    Require CFBundleShortVersionString to match.
  --expect-build <build>        Require CFBundleVersion to match.
  --require-key <plist-key>     Require a non-empty Info.plist key. May repeat.
  --expect-key <key=value>      Require an Info.plist key value. May repeat.
  --output <path>               Write JSON result to a file.

RevenueCat/TestFlight hard-gate example:
  node scripts/ios-inspect-ipa-config.mjs \\
    --ipa artifacts/testflight-202607110232/export/Aichologist.ipa \\
    --expect-bundle-id com.kantakademi.aichologist \\
    --expect-key AppEnvironmentName=Release \\
    --expect-key AppAichologistRemoteEnabled=YES \\
    --require-key AppRevenueCatAPIKey \\
    --require-key AppPrivacyPolicyURL \\
    --require-key AppTermsOfUseURL
`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr.trim() || result.stdout.trim()}`);
  }

  return result.stdout.trim();
}

function commandExists(command) {
  const result = spawnSync("command", ["-v", command], {
    shell: true,
    encoding: "utf8",
  });
  return result.status === 0;
}

function readPlistValue(plistPath, key) {
  const result = spawnSync("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, plistPath], {
    encoding: "utf8",
  });

  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function isSecretKey(key) {
  return /(key|secret|token|password|credential|authorization)/i.test(key);
}

function safeValue(key, value) {
  if (value === null || value === undefined) return null;
  if (isSecretKey(key)) return value ? "<present>" : "";
  return value;
}

function normalizeBooleanLike(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes"].includes(raw)) return "YES";
  if (["0", "false", "no"].includes(raw)) return "NO";
  return String(value ?? "").trim();
}

function compareValue(actual, expected) {
  const expectedNormalized = normalizeBooleanLike(expected);
  const actualNormalized = normalizeBooleanLike(actual);
  return actualNormalized === expectedNormalized;
}

function findAppPlist(extractDir) {
  const payloadDir = path.join(extractDir, "Payload");
  if (!fs.existsSync(payloadDir)) {
    throw new Error("IPA does not contain a Payload directory.");
  }

  const apps = fs.readdirSync(payloadDir)
    .filter((entry) => entry.endsWith(".app"))
    .map((entry) => path.join(payloadDir, entry));

  if (apps.length !== 1) {
    throw new Error(`Expected exactly one .app in Payload, found ${apps.length}.`);
  }

  const plistPath = path.join(apps[0], "Info.plist");
  if (!fs.existsSync(plistPath)) {
    throw new Error(`Info.plist not found at ${plistPath}`);
  }

  return {
    appName: path.basename(apps[0]),
    plistPath,
  };
}

function addCheck(checks, failures, check) {
  checks.push(check);
  if (!check.pass) {
    failures.push(check.message);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  if (!args.ipa) {
    throw new Error("--ipa is required.");
  }
  if (!commandExists("unzip")) {
    throw new Error("unzip is required to inspect IPA files.");
  }

  const ipaPath = path.resolve(args.ipa);
  if (!fs.existsSync(ipaPath)) {
    throw new Error(`IPA does not exist: ${ipaPath}`);
  }

  const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), "viber-ipa-inspect-"));
  try {
    run("unzip", ["-q", ipaPath, "-d", extractDir]);
    const { appName, plistPath } = findAppPlist(extractDir);

    const info = {
      CFBundleIdentifier: readPlistValue(plistPath, "CFBundleIdentifier"),
      CFBundleShortVersionString: readPlistValue(plistPath, "CFBundleShortVersionString"),
      CFBundleVersion: readPlistValue(plistPath, "CFBundleVersion"),
    };

    const checks = [];
    const failures = [];

    if (args.expectBundleId) {
      addCheck(checks, failures, {
        name: "bundle-id",
        pass: info.CFBundleIdentifier === args.expectBundleId,
        expected: args.expectBundleId,
        actual: info.CFBundleIdentifier,
        message: `Expected bundle id ${args.expectBundleId}, got ${info.CFBundleIdentifier || "missing"}.`,
      });
    }

    if (args.expectVersion) {
      addCheck(checks, failures, {
        name: "version",
        pass: info.CFBundleShortVersionString === args.expectVersion,
        expected: args.expectVersion,
        actual: info.CFBundleShortVersionString,
        message: `Expected version ${args.expectVersion}, got ${info.CFBundleShortVersionString || "missing"}.`,
      });
    }

    if (args.expectBuild) {
      addCheck(checks, failures, {
        name: "build",
        pass: info.CFBundleVersion === args.expectBuild,
        expected: args.expectBuild,
        actual: info.CFBundleVersion,
        message: `Expected build ${args.expectBuild}, got ${info.CFBundleVersion || "missing"}.`,
      });
    }

    for (const key of args.requireKey) {
      const value = readPlistValue(plistPath, key);
      info[key] = safeValue(key, value);
      addCheck(checks, failures, {
        name: `require-key:${key}`,
        pass: Boolean(value && value.trim()),
        key,
        actual: safeValue(key, value),
        message: `Required Info.plist key ${key} is missing or empty.`,
      });
    }

    for (const expectation of args.expectKey) {
      const separatorIndex = expectation.indexOf("=");
      if (separatorIndex <= 0) {
        throw new Error(`Invalid --expect-key value "${expectation}". Use key=value.`);
      }

      const key = expectation.slice(0, separatorIndex);
      const expected = expectation.slice(separatorIndex + 1);
      const value = readPlistValue(plistPath, key);
      info[key] = safeValue(key, value);
      addCheck(checks, failures, {
        name: `expect-key:${key}`,
        pass: value !== null && compareValue(value, expected),
        key,
        expected: safeValue(key, expected),
        actual: safeValue(key, value),
        message: `Expected Info.plist key ${key}=${safeValue(key, expected)}, got ${safeValue(key, value) || "missing"}.`,
      });
    }

    const result = {
      status: failures.length === 0 ? "pass" : "fail",
      ipa: ipaPath,
      app: appName,
      info,
      checks,
      failures,
    };

    const output = `${JSON.stringify(result, null, 2)}\n`;
    if (args.output) {
      fs.mkdirSync(path.dirname(path.resolve(args.output)), { recursive: true });
      fs.writeFileSync(path.resolve(args.output), output);
    }
    process.stdout.write(output);

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
