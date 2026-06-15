#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
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

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  if (result.status !== 0 && !options.allowFailure) {
    const output = [stderr, stdout].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} failed${output ? `:\n${output}` : ""}`);
  }

  return {
    status: result.status,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

function commandExists(command) {
  return spawnSync("command", ["-v", command], {
    shell: true,
    encoding: "utf8",
  }).status === 0;
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/ios-factory-experience-gate.mjs \\
    --run-manifest /path/to/factory/runs/run-id.json

Options:
  --workspace-path <path>       Override primary iOS app workspace path.
  --project-name <slug>         Override docs/[project-name] resolution.
  --bundle-id <id>              Override simulator bundle id. Defaults to manifest bundle_id + ".debug".
  --app-path <path>             Override built .app path.
  --evidence-dir <path>         Override screenshot output directory.
  --skip-validation             Do not run format/lint/test/task phase validation.
  --skip-screenshots            Do not capture simulator screenshots.
  --no-update-artifacts         Do not update validation-report or surface-map.
  --no-update-manifest          Do not write back to the run manifest.
  --allow-pending-review        Do not fail when experience-review.md is missing or not approved.
  --output <path>               Write JSON result to a file.
  --help                        Show this help.
`);
}

function resolveWorkspacePath(args, manifest) {
  const value =
    args["workspace-path"] ||
    manifest?.product_to_code_result?.workspace_path ||
    manifest?.product_to_code_input?.workspace_path ||
    manifest?.workspace?.workspace_path ||
    manifest?.app_autopilot?.target_repo;

  if (!value) throw new Error("Missing workspace path. Pass --workspace-path or --run-manifest.");
  const workspacePath = path.resolve(value);
  if (!fs.existsSync(workspacePath)) throw new Error(`Workspace path does not exist: ${workspacePath}`);
  return workspacePath;
}

function resolveProjectName(args, manifest, workspacePath) {
  if (args["project-name"]) return args["project-name"];
  if (manifest?.selection?.project_name) return manifest.selection.project_name;
  if (manifest?.product_to_code_input?.project_name) return manifest.product_to_code_input.project_name;

  for (const docsRootName of ["Docs", "docs"]) {
    const docsRoot = path.join(workspacePath, docsRootName);
    if (!fs.existsSync(docsRoot)) continue;
    const entries = fs.readdirSync(docsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    if (entries.length === 1) return entries[0];
  }

  throw new Error("Missing project name. Pass --project-name or include selection.project_name in the manifest.");
}

function resolveDocsDir(workspacePath, projectName) {
  for (const docsRootName of ["Docs", "docs"]) {
    const candidate = path.join(workspacePath, docsRootName, projectName);
    if (fs.existsSync(candidate)) return candidate;
  }

  const fallback = path.join(workspacePath, "Docs", projectName);
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

function resolveBundleId(args, manifest) {
  if (args["bundle-id"]) return args["bundle-id"];
  const base = manifest?.selection?.bundle_id || manifest?.app_autopilot?.bundle_id;
  if (!base) throw new Error("Missing bundle id. Pass --bundle-id or include selection.bundle_id in the manifest.");
  return base.endsWith(".debug") ? base : `${base}.debug`;
}

function walk(rootDir, visitor) {
  if (!fs.existsSync(rootDir)) return;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      visitor(entryPath, entry);
      if (!entry.name.endsWith(".app")) walk(entryPath, visitor);
    } else {
      visitor(entryPath, entry);
    }
  }
}

function plistBundleId(appPath) {
  const infoPath = path.join(appPath, "Info.plist");
  if (!fs.existsSync(infoPath)) return null;
  const result = run("plutil", ["-extract", "CFBundleIdentifier", "raw", "-o", "-", infoPath], {
    allowFailure: true,
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function findBuiltApp(bundleId, explicitAppPath) {
  if (explicitAppPath) {
    const appPath = path.resolve(explicitAppPath);
    if (!fs.existsSync(appPath)) throw new Error(`App path does not exist: ${appPath}`);
    return appPath;
  }

  const derivedData = path.join(os.homedir(), "Library", "Developer", "Xcode", "DerivedData");
  const matches = [];
  walk(derivedData, (entryPath, entry) => {
    if (!entry.isDirectory() || !entry.name.endsWith(".app")) return;
    if (!entryPath.includes(`${path.sep}Build${path.sep}Products${path.sep}`)) return;
    if (plistBundleId(entryPath) !== bundleId) return;
    matches.push({
      appPath: entryPath,
      mtimeMs: fs.statSync(entryPath).mtimeMs,
    });
  });

  matches.sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (!matches[0]) throw new Error(`No built simulator app found for bundle id ${bundleId}`);
  return matches[0].appPath;
}

function sourceContains(workspacePath, needle) {
  const roots = ["App", "Sources", "UITests"].map((name) => path.join(workspacePath, name));
  let found = false;
  for (const root of roots) {
    walk(root, (entryPath, entry) => {
      if (found || !entry.isFile() || !entryPath.endsWith(".swift")) return;
      if (fs.readFileSync(entryPath, "utf8").includes(needle)) found = true;
    });
  }
  return found;
}

function repoPathOrAbsolute(workspacePath, filePath) {
  const relativePath = path.relative(workspacePath, filePath).split(path.sep).join("/");
  return relativePath.startsWith("../") || relativePath === ".." ? filePath : relativePath;
}

function simctlJson(args) {
  return JSON.parse(run("xcrun", ["simctl", "list", ...args, "-j"]).stdout);
}

function parseRuntimeVersion(runtime) {
  const value = runtime.version || runtime.name || "";
  return String(value).split(/[^0-9]+/).filter(Boolean).map(Number);
}

function compareVersion(left, right) {
  const maxLength = Math.max(left.length, right.length);
  for (let index = 0; index < maxLength; index += 1) {
    const delta = (left[index] || 0) - (right[index] || 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

function resolveSimulatorRuntime(requestedRuntime) {
  if (requestedRuntime) return requestedRuntime;
  const runtimes = simctlJson(["runtimes"]).runtimes
    .filter((runtime) => runtime.isAvailable && runtime.identifier.includes(".iOS-"))
    .sort((left, right) => compareVersion(parseRuntimeVersion(right), parseRuntimeVersion(left)));
  if (!runtimes[0]) throw new Error("No available iOS simulator runtime found");
  return runtimes[0].identifier;
}

function resolveSimulatorDeviceType(requestedDeviceType) {
  if (requestedDeviceType) return requestedDeviceType;
  const preferredNames = ["iPhone 17 Pro", "iPhone 17", "iPhone 16 Pro Max", "iPhone 16 Plus", "iPhone 16"];
  const deviceTypes = simctlJson(["devicetypes"]).devicetypes;
  for (const name of preferredNames) {
    const match = deviceTypes.find((deviceType) => deviceType.name === name);
    if (match) return match.identifier;
  }
  const fallback = deviceTypes.find((deviceType) => deviceType.name.startsWith("iPhone"));
  if (!fallback) throw new Error("No iPhone simulator device type found");
  return fallback.identifier;
}

function captureScreenshots({ workspacePath, docsDir, bundleId, appPath, evidenceDir, args }) {
  if (!commandExists("xcrun")) throw new Error("xcrun is required for screenshot capture");
  if (!sourceContains(workspacePath, "--skip-onboarding")) {
    throw new Error("App does not expose --skip-onboarding; factory screenshot capture cannot reach the board directly.");
  }
  if (!sourceContains(workspacePath, "--show-paywall")) {
    throw new Error("App does not expose --show-paywall; factory screenshot capture cannot reach the paywall directly.");
  }

  const outputDir = path.resolve(evidenceDir || path.join(docsDir, "validation"));
  fs.mkdirSync(outputDir, { recursive: true });

  const runtime = resolveSimulatorRuntime(args["sim-runtime"]);
  const deviceType = resolveSimulatorDeviceType(args["sim-device-type"]);
  const simulatorName = `FactoryExperienceGate-${Date.now()}`;
  const simulatorId = run("xcrun", ["simctl", "create", simulatorName, deviceType, runtime]).stdout.trim();

  const screenshots = [];
  const scenarios = [
    { id: "onboarding", file: "onboarding-factory-gate.png", launchArgs: [] },
    { id: "home-board", file: "board-factory-gate.png", launchArgs: ["--skip-onboarding"] },
    { id: "paywall", file: "paywall-factory-gate.png", launchArgs: ["--skip-onboarding", "--show-paywall"] },
  ];

  try {
    run("xcrun", ["simctl", "boot", simulatorId]);
    run("xcrun", ["simctl", "bootstatus", simulatorId, "-b"]);
    run("xcrun", ["simctl", "install", simulatorId, appPath]);

    for (const scenario of scenarios) {
      run("xcrun", ["simctl", "terminate", simulatorId, bundleId], { allowFailure: true });
      run("xcrun", ["simctl", "launch", simulatorId, bundleId, ...scenario.launchArgs]);
      run("sleep", [String(args["settle-seconds"] || 3)]);
      const screenshotPath = path.join(outputDir, scenario.file);
      run("xcrun", ["simctl", "io", simulatorId, "screenshot", screenshotPath]);
      screenshots.push({
        id: scenario.id,
        path: screenshotPath,
        repoPath: repoPathOrAbsolute(workspacePath, screenshotPath),
        sizeBytes: fs.statSync(screenshotPath).size,
      });
    }
  } finally {
    run("xcrun", ["simctl", "shutdown", simulatorId], { allowFailure: true });
    run("xcrun", ["simctl", "delete", simulatorId], { allowFailure: true });
  }

  return screenshots;
}

function runValidation(workspacePath, docsDir) {
  const commands = [];
  const scripts = [
    ["format", "./Scripts/format.sh"],
    ["lint", "./Scripts/lint.sh"],
    ["test", "./Scripts/test.sh"],
  ];

  for (const [id, script] of scripts) {
    const scriptPath = path.join(workspacePath, script);
    if (!fs.existsSync(scriptPath)) continue;
    run(script, [], { cwd: workspacePath });
    commands.push({ id, command: script, status: "passed" });
  }

  const tasksPath = path.join(docsDir, "tasks.json");
  if (fs.existsSync(tasksPath)) {
    run("node", [
      path.join(repoRoot, "scripts", "validate-task-phases.mjs"),
      "--tasks",
      tasksPath,
      "--factory-ios",
    ], { cwd: repoRoot });
    commands.push({
      id: "task-phases",
      command: `node scripts/validate-task-phases.mjs --tasks ${tasksPath} --factory-ios`,
      status: "passed",
    });
  }

  return commands;
}

function readExperienceVerdict(docsDir) {
  const reviewPath = path.join(docsDir, "experience-review.md");
  if (!fs.existsSync(reviewPath)) {
    return {
      path: reviewPath,
      status: "missing",
      approved: false,
    };
  }

  const content = fs.readFileSync(reviewPath, "utf8");
  const verdict = content.match(/^Verdict:\s*([A-Z0-9_ -]+)/m)?.[1]?.trim() || "UNKNOWN";
  return {
    path: reviewPath,
    status: verdict,
    approved: ["APPROVED", "APPROVED_FOR_FACTORY_SMOKE", "SKIPPED_NOT_APPLICABLE"].includes(verdict),
  };
}

function updateSurfaceMap(workspacePath, docsDir, screenshots) {
  const surfaceMapPath = path.join(docsDir, "surface-map.json");
  if (!fs.existsSync(surfaceMapPath)) return null;

  const surfaceMap = readJson(surfaceMapPath);
  const byId = new Map(screenshots.map((screenshot) => [screenshot.id, screenshot.repoPath]));
  for (const surface of surfaceMap.surfaces || []) {
    const screenshotPath = byId.get(surface.id);
    if (screenshotPath) {
      surface.screenshotTargets = [screenshotPath];
    }
  }
  surfaceMap.reviewNotes = [
    ...(surfaceMap.reviewNotes || []),
    `Factory experience gate captured screenshots at ${new Date().toISOString()}.`,
  ];
  writeJson(surfaceMapPath, surfaceMap);
  return surfaceMapPath;
}

function appendValidationReport(docsDir, result) {
  const reportPath = path.join(docsDir, "validation-report.md");
  const screenshotLines = result.screenshots
    .map((screenshot) => `- ${screenshot.id}: \`${screenshot.repoPath || screenshot.path}\``)
    .join("\n");
  const commandLines = result.validation.commands
    .map((command) => `- ${command.command}`)
    .join("\n");

  const section = `\n## Factory Experience Gate\n\nStatus: ${result.status}\n\nCommands:\n${commandLines || "- skipped"}\n\nScreenshots:\n${screenshotLines || "- skipped"}\n\nExperience review verdict: ${result.experienceReview.status}\n`;

  fs.appendFileSync(reportPath, section);
  return reportPath;
}

function updateManifest(workspacePath, manifestPath, manifest, result) {
  if (!manifestPath) return null;

  manifest.product_to_code_result = manifest.product_to_code_result || {};
    manifest.product_to_code_result.experience_gate = {
    status: result.status,
    screenshots: result.screenshots.map((screenshot) => screenshot.repoPath || screenshot.path),
    validation_commands: result.validation.commands,
    experience_review_status: result.experienceReview.status,
    updated_at: result.generatedAt,
  };

  if (result.status === "APPROVED_FOR_FACTORY_SMOKE") {
    manifest.status = "factory_smoke_polish_complete";
    manifest.product_to_code_result.status = "APPROVED_FOR_FACTORY_SMOKE";
    manifest.product_to_code_result.experience_review = {
      ...(manifest.product_to_code_result.experience_review || {}),
      status: "APPROVED_FOR_FACTORY_SMOKE",
      artifact: repoPathOrAbsolute(workspacePath, result.experienceReview.path),
      screenshot_files: result.screenshots.map((screenshot) => screenshot.repoPath || screenshot.path),
    };
  }

  writeJson(manifestPath, manifest);
  return manifestPath;
}

function writeOutput(result, outputPath) {
  const text = `${JSON.stringify(result, null, 2)}\n`;
  if (outputPath) {
    fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
    fs.writeFileSync(outputPath, text);
  }
  process.stdout.write(text);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const manifestPath = args["run-manifest"] ? path.resolve(args["run-manifest"]) : null;
  const manifest = manifestPath ? readJson(manifestPath) : null;
  const workspacePath = resolveWorkspacePath(args, manifest);
  const projectName = resolveProjectName(args, manifest, workspacePath);
  const docsDir = resolveDocsDir(workspacePath, projectName);
  const bundleId = resolveBundleId(args, manifest);

  const validation = boolValue(args["skip-validation"], false)
    ? { commands: [] }
    : { commands: runValidation(workspacePath, docsDir) };

  const screenshots = boolValue(args["skip-screenshots"], false)
    ? []
    : captureScreenshots({
      workspacePath,
      docsDir,
      bundleId,
      appPath: findBuiltApp(bundleId, args["app-path"]),
      evidenceDir: args["evidence-dir"],
      args,
    });

  const experienceReview = readExperienceVerdict(docsDir);
  const hasRequiredScreenshots = ["onboarding", "home-board", "paywall"].every((id) =>
    screenshots.some((screenshot) => screenshot.id === id && screenshot.sizeBytes > 0));
  const allowPendingReview = boolValue(args["allow-pending-review"], false);
  const status = hasRequiredScreenshots && experienceReview.approved
    ? "APPROVED_FOR_FACTORY_SMOKE"
    : hasRequiredScreenshots
      ? "EVIDENCE_CAPTURED_PENDING_REVIEW"
      : "BLOCKED_MISSING_SCREENSHOTS";

  const result = {
    schema_version: 1,
    generatedAt: new Date().toISOString(),
    status,
    workspacePath,
    projectName,
    docsDir,
    bundleId,
    validation,
    screenshots,
    experienceReview,
    artifacts: {},
  };

  if (!boolValue(args["no-update-artifacts"], false)) {
    result.artifacts.surfaceMap = updateSurfaceMap(workspacePath, docsDir, screenshots);
    result.artifacts.validationReport = appendValidationReport(docsDir, result);
  }

  if (!boolValue(args["no-update-manifest"], false)) {
    result.artifacts.runManifest = updateManifest(workspacePath, manifestPath, manifest, result);
  }

  writeOutput(result, args.output);

  if (status === "BLOCKED_MISSING_SCREENSHOTS") process.exitCode = 1;
  if (!allowPendingReview && status === "EVIDENCE_CAPTURED_PENDING_REVIEW") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
