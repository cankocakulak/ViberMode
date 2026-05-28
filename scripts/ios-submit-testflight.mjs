#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { githubApiFetch, githubGitConfigEnv } from "./github-network.mjs";

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

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function output(result, outputFile) {
  const text = `${JSON.stringify(result, null, 2)}\n`;
  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, text);
  }
  process.stdout.write(text);
}

function sanitizeOutput(output) {
  return String(output || "")
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, "<redacted-private-key>")
    .replace(/AuthKey_[A-Z0-9]+\.p8/g, "AuthKey_<redacted>.p8")
    .replace(/\/var\/folders\/[^\s]+\/viber-testflight-[^\s]+/g, "<redacted-temp-dir>")
    .replace(/https:\/\/[^/@\s]+@github\.com/g, "https://<redacted>@github.com")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "<redacted-email>")
    .replace(/(team_id\s+\|\s+)[A-Z0-9]{10}/g, "$1<redacted-team-id>")
    .replace(/(FASTLANE_TEAM_ID['"]?\s*[:=]\s*['"]?)[A-Z0-9]{10}/g, "$1<redacted-team-id>")
    .replace(/(DEVELOPMENT_TEAM=)[A-Z0-9]{10}/g, "$1<redacted-team-id>");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    encoding: "utf8",
  });

  const stdout = sanitizeOutput(result.stdout || "");
  const stderr = sanitizeOutput(result.stderr || "");
  const combined = [stderr, stdout].filter(Boolean).join("\n").trim();

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed${combined ? `:\n${combined}` : ""}`);
  }

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

function runMaybe(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    input: options.input,
    encoding: "utf8",
  });

  return {
    status: result.status,
    stdout: sanitizeOutput(result.stdout || "").trim(),
    stderr: sanitizeOutput(result.stderr || "").trim(),
  };
}

function commandExists(command) {
  const result = spawnSync("command", ["-v", command], {
    shell: true,
    encoding: "utf8",
  });
  return result.status === 0;
}

function keychainRead(service, required = true) {
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

  if (result.status !== 0) {
    if (!required) return null;
    throw new Error(`Missing Keychain item: ${service}`);
  }

  return result.stdout.trim();
}

function keychainService(prefix, name) {
  return `${prefix}-${name}`;
}

function loadCredentials(args) {
  const prefix = args["keychain-prefix"] || process.env.APP_FACTORY_KEYCHAIN_PREFIX || "viberboyz";

  return {
    prefix,
    appleTeamId: args["apple-team-id"] || process.env.APPLE_TEAM_ID || keychainRead(keychainService(prefix, "apple-team-id")),
    ascKeyId: args["asc-key-id"] || process.env.ASC_KEY_ID || keychainRead(keychainService(prefix, "asc-key-id")),
    ascIssuerId: args["asc-issuer-id"] || process.env.ASC_ISSUER_ID || keychainRead(keychainService(prefix, "asc-issuer-id")),
    ascApiKeyP8B64: args["asc-api-key-p8-b64"] || process.env.ASC_API_KEY_P8_B64 || keychainRead(keychainService(prefix, "asc-api-key-p8-b64")),
    appleId: args["apple-id"] || process.env.APPLE_ID || keychainRead(keychainService(prefix, "apple-id")),
    ascTeamId: args["asc-team-id"] || process.env.ASC_TEAM_ID || keychainRead(keychainService(prefix, "asc-team-id"), false),
    fastlaneSession: process.env.FASTLANE_SESSION || keychainRead(keychainService(prefix, "fastlane-session"), false),
  };
}

function withSecretFiles(credentials, callback) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "viber-testflight-"));
  const p8Path = path.join(tempDir, `AuthKey_${credentials.ascKeyId}.p8`);
  const apiKeyPath = path.join(tempDir, "app-store-connect-api-key.json");

  try {
    const key = Buffer.from(credentials.ascApiKeyP8B64, "base64").toString("utf8").trim();
    if (!key.includes("BEGIN PRIVATE KEY")) {
      throw new Error("App Store Connect API key did not decode to a .p8 private key");
    }

    fs.writeFileSync(p8Path, `${key}\n`, { mode: 0o600 });
    fs.writeFileSync(apiKeyPath, `${JSON.stringify({
      key_id: credentials.ascKeyId,
      issuer_id: credentials.ascIssuerId,
      key,
      in_house: false,
    }, null, 2)}\n`, { mode: 0o600 });

    return callback({ tempDir, p8Path, apiKeyPath });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function findXcodeContainer(workspacePath, requestedPath) {
  if (requestedPath) {
    const absolutePath = path.resolve(requestedPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Xcode project/workspace does not exist: ${absolutePath}`);
    }
    return {
      type: absolutePath.endsWith(".xcworkspace") ? "workspace" : "project",
      path: absolutePath,
    };
  }

  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  const workspace = entries.find((entry) => entry.isDirectory() && entry.name.endsWith(".xcworkspace"));
  if (workspace) {
    return {
      type: "workspace",
      path: path.join(workspacePath, workspace.name),
    };
  }

  const project = entries.find((entry) => entry.isDirectory() && entry.name.endsWith(".xcodeproj"));
  if (project) {
    return {
      type: "project",
      path: path.join(workspacePath, project.name),
    };
  }

  throw new Error(`No .xcodeproj or root .xcworkspace found in ${workspacePath}`);
}

function listSchemes(container) {
  const flag = container.type === "workspace" ? "-workspace" : "-project";
  const result = run("xcodebuild", ["-list", "-json", flag, container.path]);
  const parsed = JSON.parse(result.stdout);
  const root = parsed[container.type] || parsed.project || parsed.workspace;
  return root?.schemes || [];
}

function resolveScheme(container, requestedScheme) {
  const schemes = listSchemes(container);
  if (requestedScheme) {
    if (!schemes.includes(requestedScheme)) {
      throw new Error(`Scheme '${requestedScheme}' was not found. Available schemes: ${schemes.join(", ")}`);
    }
    return requestedScheme;
  }
  const scheme = schemes[0];
  if (!scheme) {
    throw new Error(`No shared schemes found in ${container.path}`);
  }
  return scheme;
}

function compactTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:.TZ]/g, "").slice(0, 12);
}

function defaultSku(manifest, bundleId) {
  return [
    manifest.selection?.repo_name,
    manifest.run_id,
    bundleId,
  ].filter(Boolean).join("-").replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 64);
}

function manifestOwner(manifest) {
  const fullName = manifest.repository?.full_name;
  if (!fullName || !String(fullName).includes("/")) return null;
  return String(fullName).split("/")[0];
}

function loadSubmissionMetadata(args, manifest) {
  const filePath = args["metadata-file"] || process.env.APP_FACTORY_SUBMISSION_METADATA;
  const fromFile = filePath ? readJson(path.resolve(filePath)) : {};
  return {
    ...(manifest.submission_metadata || {}),
    ...fromFile,
  };
}

function arrayValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function summarizeMetadata(metadata) {
  return {
    app_store_name: metadata.app_store_name || null,
    fallback_app_store_name: metadata.fallback_app_store_name || null,
    subtitle: metadata.subtitle || null,
    description: metadata.description ? "provided" : "missing",
    keywords: arrayValue(metadata.keywords),
    support_url: metadata.support_url || null,
    privacy_policy_url: metadata.privacy_policy_url || null,
    primary_locale: metadata.primary_locale || null,
    storefronts: arrayValue(metadata.storefronts),
    price: metadata.price || metadata.price_tier || null,
    testflight_what_to_test: metadata.testflight?.what_to_test || metadata.what_to_test || null,
  };
}

function findFirstDirectory(root, predicate, maxDepth = 6) {
  function walk(current, depth) {
    if (depth > maxDepth) return null;
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return null;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if ([".git", "DerivedData", "build", "artifacts", "xcuserdata"].includes(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      if (predicate(entry.name, fullPath)) return fullPath;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if ([".git", "DerivedData", "build", "artifacts", "xcuserdata"].includes(entry.name)) continue;
      const found = walk(path.join(current, entry.name), depth + 1);
      if (found) return found;
    }

    return null;
  }

  return walk(root, 0);
}

function findAppIconSet(workspacePath) {
  return findFirstDirectory(workspacePath, (name) => name === "AppIcon.appiconset");
}

const APP_ICON_IMAGES = [
  { filename: "Icon-20.png", idiom: "iphone", scale: "2x", size: "20x20" },
  { filename: "Icon-29.png", idiom: "iphone", scale: "2x", size: "29x29" },
  { filename: "Icon-40.png", idiom: "iphone", scale: "2x", size: "40x40" },
  { filename: "Icon-60.png", idiom: "iphone", scale: "3x", size: "20x20" },
  { filename: "Icon-58.png", idiom: "iphone", scale: "2x", size: "29x29" },
  { filename: "Icon-87.png", idiom: "iphone", scale: "3x", size: "29x29" },
  { filename: "Icon-80.png", idiom: "iphone", scale: "2x", size: "40x40" },
  { filename: "Icon-120.png", idiom: "iphone", scale: "3x", size: "40x40" },
  { filename: "Icon-120.png", idiom: "iphone", scale: "2x", size: "60x60" },
  { filename: "Icon-180.png", idiom: "iphone", scale: "3x", size: "60x60" },
  { filename: "Icon-20.png", idiom: "ipad", scale: "1x", size: "20x20" },
  { filename: "Icon-40.png", idiom: "ipad", scale: "2x", size: "20x20" },
  { filename: "Icon-29.png", idiom: "ipad", scale: "1x", size: "29x29" },
  { filename: "Icon-58.png", idiom: "ipad", scale: "2x", size: "29x29" },
  { filename: "Icon-40.png", idiom: "ipad", scale: "1x", size: "40x40" },
  { filename: "Icon-80.png", idiom: "ipad", scale: "2x", size: "40x40" },
  { filename: "Icon-76.png", idiom: "ipad", scale: "1x", size: "76x76" },
  { filename: "Icon-152.png", idiom: "ipad", scale: "2x", size: "76x76" },
  { filename: "Icon-167.png", idiom: "ipad", scale: "2x", size: "83.5x83.5" },
  { filename: "Icon-1024.png", idiom: "ios-marketing", size: "1024x1024" },
  { filename: "Icon-1024.png", idiom: "universal", platform: "ios", size: "1024x1024" },
];

const APP_ICON_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];

function pngColorType(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const header = fs.readFileSync(filePath).subarray(0, 26);
  if (header.length < 26 || header.toString("ascii", 1, 4) !== "PNG") return null;
  return header[25];
}

function pngHasAlpha(filePath) {
  const colorType = pngColorType(filePath);
  return colorType === 4 || colorType === 6;
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let index = 0; index < 8; index += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function iconColorAt(x, y, size) {
  const bg = [250, 247, 238];
  const ink = [39, 48, 59];
  const dots = [
    { cx: 0.32, cy: 0.34, r: 0.14, c: [245, 119, 103] },
    { cx: 0.58, cy: 0.28, r: 0.11, c: [80, 163, 132] },
    { cx: 0.68, cy: 0.55, r: 0.15, c: [91, 124, 219] },
    { cx: 0.40, cy: 0.66, r: 0.12, c: [240, 181, 73] },
    { cx: 0.50, cy: 0.48, r: 0.07, c: [39, 48, 59] },
  ];
  const nx = (x + 0.5) / size;
  const ny = (y + 0.5) / size;
  for (const dot of dots) {
    const dx = nx - dot.cx;
    const dy = ny - dot.cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= dot.r) return dot.c;
    if (distance <= dot.r + 0.012) return ink;
  }
  return bg;
}

function makeOpaquePng(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [red, green, blue] = iconColorAt(x, y, size);
      const offset = row + 1 + x * 3;
      raw[offset] = red;
      raw[offset + 1] = green;
      raw[offset + 2] = blue;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function ensureLine(filePath, line) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (current.split(/\r?\n/).includes(line)) return false;
  fs.writeFileSync(filePath, `${current.replace(/\s*$/, "\n")}${line}\n`);
  return true;
}

function updateProjectYamlForSubmission(workspacePath) {
  const projectPath = path.join(workspacePath, "project.yml");
  if (!fs.existsSync(projectPath)) return false;

  let text = fs.readFileSync(projectPath, "utf8");
  let changed = false;
  const insertAfter = (needle, additions) => {
    if (!text.includes(needle)) return;
    const missing = additions.filter((line) => !text.includes(line.trim()));
    if (missing.length === 0) return;
    text = text.replace(needle, `${needle}\n${missing.join("\n")}`);
    changed = true;
  };

  insertAfter("    INFOPLIST_KEY_CFBundleDisplayName: $(APP_DISPLAY_NAME)", [
    "    INFOPLIST_KEY_CFBundleIconName: AppIcon",
  ]);
  insertAfter("    INFOPLIST_KEY_UILaunchScreen_Generation: YES", [
    "    INFOPLIST_KEY_UISupportedInterfaceOrientations: UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight",
    "    INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad: UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight",
  ]);

  if (changed) fs.writeFileSync(projectPath, text);
  return changed;
}

function runProjectGenerator(workspacePath) {
  const scriptPath = path.join(workspacePath, "Scripts", "generate_project.sh");
  if (!fs.existsSync(scriptPath)) {
    return { status: "skipped", reason: "generate_project_script_missing" };
  }

  run(scriptPath, [], { cwd: workspacePath });
  return { status: "generated", command: "Scripts/generate_project.sh" };
}

function checkSubmissionAssets(workspacePath) {
  const issues = [];
  const appIconSet = findAppIconSet(workspacePath);
  if (!appIconSet) {
    issues.push("AppIcon.appiconset was not found");
    return { app_icon_set: null, issues };
  }

  for (const size of [120, 152, 1024]) {
    const filePath = path.join(appIconSet, `Icon-${size}.png`);
    if (!fs.existsSync(filePath)) {
      issues.push(`Missing app icon file: Icon-${size}.png`);
    }
  }

  const largeIcon = path.join(appIconSet, "Icon-1024.png");
  if (fs.existsSync(largeIcon) && pngHasAlpha(largeIcon)) {
    issues.push("Large app icon Icon-1024.png must be opaque and cannot contain an alpha channel");
  }

  const projectYml = path.join(workspacePath, "project.yml");
  const projectText = fs.existsSync(projectYml) ? fs.readFileSync(projectYml, "utf8") : "";
  const pbxproj = findFirstDirectory(workspacePath, (name) => name.endsWith(".xcodeproj"), 2);
  const pbxprojText = pbxproj && fs.existsSync(path.join(pbxproj, "project.pbxproj"))
    ? fs.readFileSync(path.join(pbxproj, "project.pbxproj"), "utf8")
    : "";
  const combinedProjectText = `${projectText}\n${pbxprojText}`;
  if (!combinedProjectText.includes("CFBundleIconName")) {
    issues.push("Missing CFBundleIconName/AppIcon Info.plist setting");
  }
  if (!combinedProjectText.includes("UISupportedInterfaceOrientations_iPad")) {
    issues.push("Missing iPad supported interface orientations for App Store validation");
  }

  return {
    app_icon_set: appIconSet,
    issues,
  };
}

function prepareSubmissionAssets(context, args) {
  if (boolValue(args["no-prepare-assets"], false)) {
    return { status: "skipped", reason: "no_prepare_assets_requested" };
  }

  const appIconSet = findAppIconSet(context.workspacePath);
  if (!appIconSet) {
    return { status: "skipped", reason: "app_icon_set_missing" };
  }

  const before = checkSubmissionAssets(context.workspacePath);
  if (before.issues.length === 0 && !boolValue(args["force-prepare-assets"], false)) {
    return { status: "ready", app_icon_set: appIconSet };
  }

  for (const size of APP_ICON_SIZES) {
    fs.writeFileSync(path.join(appIconSet, `Icon-${size}.png`), makeOpaquePng(size));
  }
  writeJson(path.join(appIconSet, "Contents.json"), {
    images: APP_ICON_IMAGES,
    info: {
      author: "xcode",
      version: 1,
    },
  });

  const projectUpdated = updateProjectYamlForSubmission(context.workspacePath);
  const gitignoreUpdated = ensureLine(path.join(context.workspacePath, ".gitignore"), "artifacts/");
  const generatedProject = runProjectGenerator(context.workspacePath);

  return {
    status: "prepared",
    app_icon_set: appIconSet,
    fixed_issues: before.issues,
    generated_icons: APP_ICON_SIZES.length,
    project_yml_updated: projectUpdated,
    gitignore_updated: gitignoreUpdated,
    generated_project: generatedProject,
  };
}

function exportOptionsPlist({ teamId, internalOnly }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>destination</key>
  <string>export</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>${teamId}</string>
  <key>uploadSymbols</key>
  <true/>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
  <key>testFlightInternalTestingOnly</key>
  <${internalOnly ? "true" : "false"}/>
</dict>
</plist>
`;
}

function liveEnv(credentials) {
  return {
    FASTLANE_DONT_STORE_PASSWORD: "1",
    FASTLANE_HIDE_CHANGELOG: "1",
    FASTLANE_IS_INTERACTIVE: "false",
    FASTLANE_SKIP_UPDATE_CHECK: "1",
    FASTLANE_TEAM_ID: credentials.appleTeamId,
    FASTLANE_USER: credentials.appleId,
    ...(credentials.ascTeamId ? { FASTLANE_ITC_TEAM_ID: credentials.ascTeamId } : {}),
    ...(credentials.fastlaneSession ? { FASTLANE_SESSION: credentials.fastlaneSession } : {}),
  };
}

function runProduce({ credentials, appName, bundleId, sku, primaryLanguage, version }) {
  const args = [
    "produce",
    "--username",
    credentials.appleId,
    "--app_identifier",
    bundleId,
    "--app_name",
    appName,
    "--sku",
    sku,
    "--platform",
    "ios",
    "--language",
    primaryLanguage,
    "--app_version",
    version,
    "--team_id",
    credentials.appleTeamId,
  ];

  if (credentials.ascTeamId) {
    args.push("--itc_team_id", credentials.ascTeamId);
  }

  const twoFactorCode = process.env.APPLE_2FA_CODE;
  return runMaybe("fastlane", args, {
    env: liveEnv(credentials),
    input: twoFactorCode ? `${twoFactorCode}\n` : undefined,
  });
}

function produceApp({ credentials, appName, fallbackAppName, bundleId, sku, primaryLanguage, version, skipProduce }) {
  if (skipProduce) {
    return { status: "skipped", reason: "skip_produce_requested", app_name: appName };
  }

  const result = runProduce({ credentials, appName, bundleId, sku, primaryLanguage, version });
  const combined = `${result.stderr}\n${result.stdout}`;
  if (result.status !== 0) {
    const nameTaken = /App Name.*already being used|name.*already.*used|already been used on a different account/i.test(combined);
    if (nameTaken && fallbackAppName && fallbackAppName !== appName) {
      const fallbackResult = runProduce({
        credentials,
        appName: fallbackAppName,
        bundleId,
        sku,
        primaryLanguage,
        version,
      });
      const fallbackCombined = `${fallbackResult.stderr}\n${fallbackResult.stdout}`;
      if (fallbackResult.status === 0) {
        return {
          status: "ensured_with_fallback_name",
          tool: "fastlane produce",
          app_name: fallbackAppName,
          original_app_name: appName,
        };
      }
      throw new Error(`fastlane produce failed after app name fallback:\n${fallbackCombined.trim()}`);
    }

    if (/DevCenter.*already exists|bundle identifier.*exists|App .*already exists/i.test(combined) && !nameTaken) {
      return {
        status: "already_exists",
        tool: "fastlane produce",
        app_name: appName,
      };
    }
    throw new Error(`fastlane produce failed:\n${combined.trim()}`);
  }

  return {
    status: "ensured",
    tool: "fastlane produce",
    app_name: appName,
  };
}

function signingAuthArgs({ credentials, p8Path, signingAuth }) {
  if (signingAuth === "xcode-account") {
    return [];
  }

  return [
    "-authenticationKeyPath",
    p8Path,
    "-authenticationKeyID",
    credentials.ascKeyId,
    "-authenticationKeyIssuerID",
    credentials.ascIssuerId,
  ];
}

function archiveApp({ workspacePath, container, scheme, configuration, archivePath, credentials, p8Path, version, buildNumber, signingAuth }) {
  const containerFlag = container.type === "workspace" ? "-workspace" : "-project";
  const args = [
    containerFlag,
    container.path,
    "-scheme",
    scheme,
    "-configuration",
    configuration,
    "-destination",
    "generic/platform=iOS",
    "-archivePath",
    archivePath,
    "-allowProvisioningUpdates",
    ...signingAuthArgs({ credentials, p8Path, signingAuth }),
    "clean",
    "archive",
    `DEVELOPMENT_TEAM=${credentials.appleTeamId}`,
    "CODE_SIGN_STYLE=Automatic",
    `MARKETING_VERSION=${version}`,
    `CURRENT_PROJECT_VERSION=${buildNumber}`,
  ];

  run("xcodebuild", args, { cwd: workspacePath });
  return {
    status: "archived",
    archive_path: archivePath,
  };
}

function exportIpa({ workspacePath, archivePath, exportPath, exportOptionsPath, credentials, p8Path, signingAuth }) {
  run("xcodebuild", [
    "-exportArchive",
    "-archivePath",
    archivePath,
    "-exportPath",
    exportPath,
    "-exportOptionsPlist",
    exportOptionsPath,
    "-allowProvisioningUpdates",
    ...signingAuthArgs({ credentials, p8Path, signingAuth }),
  ], { cwd: workspacePath });

  const ipa = fs.readdirSync(exportPath)
    .filter((entry) => entry.endsWith(".ipa"))
    .map((entry) => path.join(exportPath, entry))[0];

  if (!ipa) {
    throw new Error(`No .ipa produced in ${exportPath}`);
  }

  return {
    status: "exported",
    ipa_path: ipa,
  };
}

function uploadIpa({ credentials, apiKeyPath, ipaPath, bundleId, changelog, uploadAuth }) {
  const args = [
    "pilot",
    "upload",
    "--ipa",
    ipaPath,
    "--app_identifier",
    bundleId,
    "--skip_waiting_for_build_processing",
    "true",
    "--distribute_external",
    "false",
    "--dev_portal_team_id",
    credentials.appleTeamId,
    "--uses_non_exempt_encryption",
    "false",
  ];

  if (uploadAuth === "api-key") {
    args.push("--api_key_path", apiKeyPath);
  } else {
    args.push("--username", credentials.appleId);
  }

  if (credentials.ascTeamId) {
    args.push("--team_id", credentials.ascTeamId);
  }

  if (changelog) {
    args.push("--changelog", changelog);
  }

  run("fastlane", args, { env: liveEnv(credentials) });
  return {
    status: "uploaded",
    tool: "fastlane pilot upload",
    processing_status: "not_waited",
  };
}

class HttpError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

async function github(repoFullName, apiPath, options = {}) {
  const token = requireValue("GH_TOKEN", process.env.GH_TOKEN);
  const response = await githubApiFetch(`/repos/${repoFullName}${apiPath}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  const okStatuses = options.okStatuses || [200];

  if (!okStatuses.includes(response.status)) {
    const message = body?.message || response.statusText;
    throw new HttpError(`GitHub API ${response.status} on ${apiPath}: ${message}`, response.status, body);
  }

  return body;
}

async function syncStateWithGitHubApi(stateRoot, repoFullName, filePaths, runId) {
  const synced = [];

  for (const relativePath of filePaths) {
    const absolutePath = path.join(stateRoot, relativePath);
    const content = fs.readFileSync(absolutePath, "utf8");
    const contentPath = `/contents/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;

    let sha;
    try {
      const existing = await github(repoFullName, contentPath);
      sha = existing.sha;
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 404) {
        throw error;
      }
    }

    await github(repoFullName, contentPath, {
      method: "PUT",
      okStatuses: [200, 201],
      body: {
        message: `Record TestFlight submission ${runId}: ${relativePath}`,
        content: Buffer.from(content).toString("base64"),
        sha,
      },
    });
    synced.push(relativePath);
  }

  return {
    status: "synced_api",
    repo: repoFullName,
    files: synced,
  };
}

function gitAuthEnv(repoUrl = "https://github.com") {
  return githubGitConfigEnv({ token: process.env.GH_TOKEN, repoUrl });
}

function commitState(stateRoot, runManifestPath, runId) {
  const relativeManifest = path.relative(stateRoot, runManifestPath);
  run("git", ["add", relativeManifest], { cwd: stateRoot });
  const status = run("git", ["status", "--porcelain", "--", relativeManifest], { cwd: stateRoot }).stdout;
  if (!status) {
    return { status: "no_changes" };
  }

  run("git", ["commit", "-m", `Record TestFlight submission ${runId}`], { cwd: stateRoot });
  const branch = run("git", ["branch", "--show-current"], { cwd: stateRoot }).stdout || "main";
  const remoteUrl = run("git", ["remote", "get-url", "origin"], { cwd: stateRoot }).stdout;
  run("git", ["push", "origin", branch], {
    cwd: stateRoot,
    env: gitAuthEnv(remoteUrl),
  });

  return {
    status: "pushed",
    branch,
  };
}

async function syncState(args, stateRoot, runManifestPath, runId) {
  if (!boolValue(args["commit-state"], false)) {
    return { status: "not_requested" };
  }

  const stateSync = args["state-sync"] || "api";
  if (!process.env.GH_TOKEN) {
    const ghToken = keychainRead(args["github-token-service"] || "viberboyz-gh-token", false);
    if (ghToken) process.env.GH_TOKEN = ghToken;
  }

  if (stateSync === "api") {
    const stateRepo = args["state-repo"] || process.env.APP_FACTORY_STATE_REPO || "ViberBoyz/app-factory-state";
    return syncStateWithGitHubApi(stateRoot, stateRepo, [path.relative(stateRoot, runManifestPath)], runId);
  }

  if (stateSync === "git") {
    return commitState(stateRoot, runManifestPath, runId);
  }

  if (stateSync === "none") {
    return { status: "skipped" };
  }

  throw new Error(`Invalid --state-sync value: ${stateSync}. Use api, git, or none.`);
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/ios-submit-testflight.mjs \\
    --run-manifest <state-root/factory/runs/run-id.json> \\
    [--submit] [--skip-produce] [--commit-state] \\
    [--app-name <unique App Store Connect name>] \\
    [--metadata-file <submission-metadata.json>]

Purpose:
  Stage 4 of the ViberMode iOS app factory. By default, this command only
  runs local preflight checks. Pass --submit to create/ensure the App Store
  Connect app, archive the generated iOS app, export an IPA, and upload it to
  internal TestFlight.

Submission readiness:
  --prepare-assets       Generate fallback AppIcon PNGs and App Store validation settings.
  --no-prepare-assets    Disable automatic asset preparation during --submit.
  --app-name             Use a unique App Store Connect name when the display name is taken.
  --fallback-app-name    Retry Fastlane produce with this name if the first app name is taken.

Keychain defaults:
  viberboyz-apple-team-id
  viberboyz-asc-key-id
  viberboyz-asc-issuer-id
  viberboyz-asc-api-key-p8-b64
  viberboyz-apple-id
  viberboyz-fastlane-session (optional)
  viberboyz-asc-team-id (optional)
`);
}

function buildContext(args) {
  const runManifestPath = path.resolve(requireValue("--run-manifest", args["run-manifest"] || process.env.APP_FACTORY_RUN_MANIFEST));
  const manifest = readJson(runManifestPath);
  const workspacePath = path.resolve(args.workspace || manifest.workspace?.workspace_path || manifest.product_to_code_input?.workspace_path || "");
  if (!workspacePath || !fs.existsSync(workspacePath)) {
    throw new Error(`Workspace path does not exist: ${workspacePath}`);
  }

  const metadata = loadSubmissionMetadata(args, manifest);
  const owner = manifestOwner(manifest);
  const appName = args["app-name"] || args["store-app-name"] || metadata.app_store_name || manifest.selection?.app_name;
  const defaultFallbackAppName = owner && appName && !String(appName).toLowerCase().includes(`by ${String(owner).toLowerCase()}`)
    ? `${appName} by ${owner}`
    : null;
  const fallbackAppName = args["fallback-app-name"] || metadata.fallback_app_store_name || defaultFallbackAppName;
  const bundleId = args["bundle-id"] || manifest.selection?.bundle_id;
  requireValue("app name", appName);
  requireValue("bundle id", bundleId);

  const container = findXcodeContainer(workspacePath, args.xcode);
  const scheme = resolveScheme(container, args.scheme);
  const configuration = args.configuration || "Release";
  const version = args.version || manifest.submission?.version || "1.0.0";
  const buildNumber = args["build-number"] || manifest.submission?.build_number || compactTimestamp();
  const primaryLanguage = args["primary-language"] || "en-US";
  const sku = args.sku || defaultSku(manifest, bundleId);
  const artifactsRoot = path.resolve(args["artifacts-dir"] || path.join(workspacePath, "artifacts", "testflight", manifest.run_id || "manual-run"));
  const archivePath = path.join(artifactsRoot, `${scheme}.xcarchive`);
  const exportPath = path.join(artifactsRoot, "export");
  const exportOptionsPath = path.join(artifactsRoot, "ExportOptions.plist");
  const internalOnly = boolValue(args["internal-only"], true);
  const signingAuth = args["signing-auth"] || "api-key";
  if (!["api-key", "xcode-account"].includes(signingAuth)) {
    throw new Error(`Invalid --signing-auth value: ${signingAuth}. Use api-key or xcode-account.`);
  }
  const uploadAuth = args["upload-auth"] || "api-key";
  if (!["api-key", "apple-session"].includes(uploadAuth)) {
    throw new Error(`Invalid --upload-auth value: ${uploadAuth}. Use api-key or apple-session.`);
  }

  return {
    runManifestPath,
    manifest,
    metadata,
    workspacePath,
    appName,
    fallbackAppName,
    bundleId,
    container,
    scheme,
    configuration,
    version,
    buildNumber,
    primaryLanguage,
    sku,
    artifactsRoot,
    archivePath,
    exportPath,
    exportOptionsPath,
    internalOnly,
    signingAuth,
    uploadAuth,
  };
}

function preflightResult(context, credentials) {
  const issues = [];
  if (!commandExists("xcodebuild")) issues.push("xcodebuild is not available");
  if (!commandExists("fastlane")) issues.push("fastlane is not available");
  if (context.manifest.product_to_code_result?.status !== "complete") {
    issues.push("product_to_code_result.status is not complete");
  }
  const assetCheck = checkSubmissionAssets(context.workspacePath);
  for (const issue of assetCheck.issues) {
    issues.push(`submission asset: ${issue}`);
  }

  return {
    status: issues.length > 0 ? "preflight_blocked" : "preflight_passed",
    mode: "preflight",
    run_id: context.manifest.run_id,
    app: {
      name: context.appName,
      fallback_name: context.fallbackAppName,
      bundle_id: context.bundleId,
      sku: context.sku,
      version: context.version,
      build_number: context.buildNumber,
      primary_language: context.primaryLanguage,
    },
    metadata: summarizeMetadata(context.metadata),
    submission_assets: {
      status: assetCheck.issues.length > 0 ? "needs_preparation" : "ready",
      app_icon_set: assetCheck.app_icon_set,
      issues: assetCheck.issues,
    },
    workspace: {
      path: context.workspacePath,
      xcode_container_type: context.container.type,
      xcode_container_path: context.container.path,
      scheme: context.scheme,
      configuration: context.configuration,
      artifacts_root: context.artifactsRoot,
      signing_auth: context.signingAuth,
      upload_auth: context.uploadAuth,
    },
    credentials: {
      keychain_prefix: credentials.prefix,
      apple_team_id: "available",
      asc_key_id: "available",
      asc_issuer_id: "available",
      asc_api_key_p8_b64: "available",
      apple_id: "available",
      asc_team_id: credentials.ascTeamId ? "available" : "not_set",
      fastlane_session: credentials.fastlaneSession ? "available" : "not_set",
    },
    issues,
    next_action: issues.length > 0 ? "Resolve preflight issues before running --submit." : "Run with --submit to create/ensure the App Store Connect app, archive, export, and upload internal TestFlight.",
  };
}

async function submit(context, credentials, args) {
  fs.mkdirSync(context.artifactsRoot, { recursive: true });
  fs.writeFileSync(context.exportOptionsPath, exportOptionsPlist({
    teamId: credentials.appleTeamId,
    internalOnly: context.internalOnly,
  }));

  return withSecretFiles(credentials, ({ p8Path, apiKeyPath }) => {
    const produced = produceApp({
      credentials,
      appName: context.appName,
      fallbackAppName: context.fallbackAppName,
      bundleId: context.bundleId,
      sku: context.sku,
      primaryLanguage: context.primaryLanguage,
      version: context.version,
      skipProduce: boolValue(args["skip-produce"], false),
    });

    const archived = archiveApp({
      workspacePath: context.workspacePath,
      container: context.container,
      scheme: context.scheme,
      configuration: context.configuration,
      archivePath: context.archivePath,
      credentials,
      p8Path,
      version: context.version,
      buildNumber: context.buildNumber,
      signingAuth: context.signingAuth,
    });

    const exported = exportIpa({
      workspacePath: context.workspacePath,
      archivePath: context.archivePath,
      exportPath: context.exportPath,
      exportOptionsPath: context.exportOptionsPath,
      credentials,
      p8Path,
      signingAuth: context.signingAuth,
    });

    const uploaded = uploadIpa({
      credentials,
      apiKeyPath,
      ipaPath: exported.ipa_path,
      bundleId: context.bundleId,
      changelog: args.changelog || context.metadata.testflight?.what_to_test || context.metadata.what_to_test || `Factory build ${context.manifest.run_id || context.buildNumber}`,
      uploadAuth: context.uploadAuth,
    });

    return {
      produced,
      archived,
      exported,
      uploaded,
    };
  });
}

function updateManifestSuccess(context, submissionResult) {
  const updatedAt = new Date().toISOString();
  const submittedAppName = submissionResult.produced.app_name || context.appName;
  const nextManifest = {
    ...context.manifest,
    status: "submitted",
    blocked_at: undefined,
    submitted_at: updatedAt,
    submission: {
      status: "testflight_uploaded",
      distribution: "internal_testflight",
      app_name: submittedAppName,
      bundle_id: context.bundleId,
      sku: context.sku,
      version: context.version,
      build_number: context.buildNumber,
      uploaded_at: updatedAt,
      app_store_connect_app_id: null,
      testflight_url: null,
      processing_status: submissionResult.uploaded.processing_status,
      metadata: summarizeMetadata(context.metadata),
      asset_preparation: context.assetPreparation || { status: "not_recorded" },
      produce: submissionResult.produced,
      archive: submissionResult.archived,
      export: submissionResult.exported,
      upload: submissionResult.uploaded,
    },
    next_action: "Wait for App Store Connect processing, then enable internal TestFlight testers.",
  };

  writeJson(context.runManifestPath, nextManifest);
  return nextManifest;
}

function updateManifestFailure(context, error) {
  const blockedAt = new Date().toISOString();
  const nextManifest = {
    ...context.manifest,
    status: "blocked",
    blocked_at: blockedAt,
    submission: {
      ...(context.manifest.submission || {}),
      status: "blocked",
      distribution: "internal_testflight",
      app_name: context.appName,
      fallback_app_name: context.fallbackAppName,
      bundle_id: context.bundleId,
      version: context.version,
      build_number: context.buildNumber,
      blocked_at: blockedAt,
      error: sanitizeOutput(error.message || String(error)),
    },
    next_action: "Resolve Stage 4 submission blocker and rerun ios-submit-testflight for this same manifest.",
  };

  writeJson(context.runManifestPath, nextManifest);
  return nextManifest;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (boolValue(args.help, false)) {
    printUsage();
    return;
  }

  const context = buildContext(args);
  const credentials = loadCredentials(args);
  const shouldPrepareAssets = boolValue(args["prepare-assets"], false)
    || (boolValue(args.submit, false) && !boolValue(args["no-prepare-assets"], false));
  const assetPreparation = shouldPrepareAssets
    ? prepareSubmissionAssets(context, args)
    : { status: "not_requested" };
  context.assetPreparation = assetPreparation;
  const preflight = preflightResult(context, credentials);
  preflight.asset_preparation = assetPreparation;

  if (!boolValue(args.submit, false)) {
    output(preflight, args.output);
    if (preflight.status !== "preflight_passed") {
      process.exitCode = 1;
    }
    return;
  }

  if (preflight.status !== "preflight_passed" && !boolValue(args["allow-incomplete"], false)) {
    output(preflight, args.output);
    process.exitCode = 1;
    return;
  }

  try {
    const submissionResult = await submit(context, credentials, args);
    updateManifestSuccess(context, submissionResult);
    const stateSync = await syncState(args, path.dirname(path.dirname(path.dirname(context.runManifestPath))), context.runManifestPath, context.manifest.run_id);

    output({
      status: "testflight_uploaded",
      run_id: context.manifest.run_id,
      app: {
        name: submissionResult.produced.app_name || context.appName,
        bundle_id: context.bundleId,
        version: context.version,
        build_number: context.buildNumber,
      },
      submission: submissionResult,
      run_manifest_path: context.runManifestPath,
      state_sync: stateSync,
    }, args.output);
  } catch (error) {
    updateManifestFailure(context, error);
    const stateSync = await syncState(args, path.dirname(path.dirname(path.dirname(context.runManifestPath))), context.runManifestPath, context.manifest.run_id);
    output({
      status: "blocked",
      run_id: context.manifest.run_id,
      run_manifest_path: context.runManifestPath,
      state_sync: stateSync,
      error: sanitizeOutput(error.message || String(error)),
    }, args.output);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(sanitizeOutput(error.message || String(error)));
  process.exit(1);
});
