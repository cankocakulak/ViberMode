#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

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

function boolValue(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;
  return ["1", "true", "yes", "y"].includes(String(value).toLowerCase());
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

  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function commandExists(command) {
  const result = run("sh", ["-lc", `command -v ${command}`]);
  return result.status === 0;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
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

function getPath(object, paths) {
  for (const parts of paths) {
    let current = object;
    for (const part of parts) {
      current = current?.[part];
    }
    if (current != null && current !== "") return current;
  }
  return null;
}

function keychainRead(service) {
  if (!service || !commandExists("security")) return null;
  const result = run("security", ["find-generic-password", "-a", process.env.USER || os.userInfo().username, "-s", service, "-w"]);
  return result.status === 0 ? result.stdout : null;
}

function latestFile(files) {
  return files
    .map((filePath) => ({
      filePath,
      mtimeMs: fs.statSync(filePath).mtimeMs,
    }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs)[0]?.filePath || null;
}

function walkFiles(rootDir, predicate, results = []) {
  if (!rootDir || !fs.existsSync(rootDir)) return results;

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, predicate, results);
    } else if (entry.isFile() && predicate(entryPath)) {
      results.push(entryPath);
    }
  }

  return results;
}

function findAab(workspacePath) {
  if (!workspacePath || !fs.existsSync(workspacePath)) return null;
  const releaseRoots = [
    path.join(workspacePath, "app/build/outputs/bundle/release"),
    path.join(workspacePath, "build/outputs/bundle/release"),
  ];

  for (const root of releaseRoots) {
    const files = walkFiles(root, (filePath) => filePath.endsWith(".aab"));
    const latest = latestFile(files);
    if (latest) return latest;
  }

  return latestFile(walkFiles(workspacePath, (filePath) => filePath.endsWith(".aab")));
}

function detectGradleCommand(workspacePath) {
  if (!workspacePath || !fs.existsSync(workspacePath)) return null;
  const wrapper = path.join(workspacePath, "gradlew");
  if (fs.existsSync(wrapper)) return "./gradlew";
  return commandExists("gradle") ? "gradle" : null;
}

function runGradleBuild(workspacePath, task) {
  const gradleCommand = detectGradleCommand(workspacePath);
  if (!gradleCommand) {
    return {
      ok: false,
      error: "No Gradle wrapper or gradle command is available",
    };
  }

  const result = run(gradleCommand, [task], { cwd: workspacePath });
  if (result.status !== 0) {
    return {
      ok: false,
      error: [result.stderr, result.stdout].filter(Boolean).join("\n").slice(0, 4000),
    };
  }

  return { ok: true };
}

function stage3Approved(manifest) {
  if (manifest?.product_to_code_result?.status !== "complete") return false;
  const status = manifest?.product_to_code_result?.experience_review?.status;
  if (!status) return false;
  return ["approved", "complete", "passed"].includes(String(status).toLowerCase());
}

function playConsoleBootstrapComplete(manifest, args) {
  if (boolValue(args["confirm-play-console-bootstrap"])) return true;

  const status = getPath(manifest, [
    ["submission_metadata", "google_play", "console_bootstrap", "status"],
    ["submission_metadata", "play", "console_bootstrap", "status"],
    ["play_console_bootstrap", "status"],
  ]);

  return ["complete", "completed", "ready"].includes(String(status || "").toLowerCase());
}

function updateManifestSubmission(manifestPath, manifest, submission) {
  if (!manifestPath) return;
  const manifestStatus = submission.status === "blocked"
    ? "blocked"
    : submission.status === "play_internal_uploaded"
      ? "submitted"
      : manifest.status || "complete";
  const next = {
    ...manifest,
    status: manifestStatus,
    submission,
  };
  writeJson(manifestPath, next);
}

function commitState(manifestPath, runId) {
  const marker = `${path.sep}factory${path.sep}runs${path.sep}`;
  if (!manifestPath || !manifestPath.includes(marker)) {
    return { status: "skipped", reason: "manifest is not under factory/runs" };
  }

  const stateRoot = manifestPath.slice(0, manifestPath.indexOf(marker));
  if (!fs.existsSync(path.join(stateRoot, ".git"))) {
    return { status: "skipped", reason: "state root is not a git checkout" };
  }

  run("git", ["add", path.relative(stateRoot, manifestPath)], { cwd: stateRoot });
  const status = run("git", ["status", "--porcelain"], { cwd: stateRoot }).stdout;
  if (!status) return { status: "no_changes" };

  const commit = run("git", ["commit", "-m", `Record Google Play internal submission ${runId || path.basename(manifestPath, ".json")}`], { cwd: stateRoot });
  if (commit.status !== 0) {
    return { status: "blocked", error: commit.stderr || commit.stdout };
  }

  const branch = run("git", ["branch", "--show-current"], { cwd: stateRoot }).stdout || "main";
  const push = run("git", ["push", "origin", branch], { cwd: stateRoot });
  if (push.status !== 0) {
    return { status: "blocked", branch, error: push.stderr || push.stdout };
  }

  return { status: "pushed", branch };
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/android-submit-play-internal.mjs \\
    --run-manifest /path/to/factory/runs/run-id.json

  node scripts/android-submit-play-internal.mjs \\
    --run-manifest /path/to/factory/runs/run-id.json \\
    --build \\
    --submit \\
    --confirm-play-console-bootstrap \\
    --commit-state

Purpose:
  Preflight a completed Android generated app for Google Play internal testing.
  Live upload uses fastlane supply and requires --submit.

Important:
  Google Play app creation and required declarations remain Play Console
  bootstrap work. This script only automates API-controlled release work after
  the Play app/package is ready for API edits.
`);
}

function buildContext(args, manifest, manifestPath) {
  const googlePlay = manifest?.submission_metadata?.google_play || manifest?.submission_metadata?.play || {};
  const rawWorkspacePath = args["workspace-path"] || getPath(manifest, [
    ["workspace_path"],
    ["generated_repo", "workspace_path"],
    ["product_to_code_result", "workspace_path"],
  ]);
  const workspacePath = rawWorkspacePath ? path.resolve(rawWorkspacePath) : null;

  const packageName = args["package-name"] || googlePlay.package_name || getPath(manifest, [
    ["selection", "package_name"],
    ["selection", "android_package_name"],
    ["product_to_code_input", "package_name"],
    ["product_to_code_input", "android_package_name"],
  ]);

  return {
    run_id: manifest?.run_id || path.basename(manifestPath || "", ".json"),
    app_name: args["app-name"] || googlePlay.app_name || manifest?.selection?.app_name || manifest?.app_name || null,
    package_name: packageName || null,
    workspace_path: workspacePath,
    track: args.track || googlePlay.track || "internal",
    release_status: args["release-status"] || googlePlay.release_status || "completed",
    metadata_path: args["metadata-path"] || googlePlay.metadata_path || null,
    service_account_keychain_service: args["service-account-keychain-service"] || "viberboyz-google-play-service-account-json-b64",
  };
}

function preflight(args, manifest, manifestPath) {
  const context = buildContext(args, manifest, manifestPath);
  const issues = [];
  const warnings = [];

  if (!manifestPath || !fs.existsSync(manifestPath)) issues.push("Missing run manifest");
  if (!manifest) issues.push("Run manifest is not readable JSON");
  if (manifest && manifest.product_to_code_result?.status !== "complete") {
    issues.push("product_to_code_result.status must be complete before Play upload");
  }
  if (manifest && !stage3Approved(manifest)) {
    issues.push("Stage 3 experience review evidence must be approved before Play upload");
  }
  if (!context.workspace_path || !fs.existsSync(context.workspace_path)) {
    issues.push("Generated Android workspace does not exist");
  }
  if (!context.package_name) {
    issues.push("Missing Android package name. Pass --package-name or set submission_metadata.google_play.package_name.");
  }
  if (!playConsoleBootstrapComplete(manifest, args)) {
    issues.push("Play Console bootstrap is not confirmed. Create the app, accept required declarations, configure Play App Signing, and confirm first-artifact/API readiness.");
  }

  const gradleCommand = detectGradleCommand(context.workspace_path);
  if (!gradleCommand) {
    issues.push("No Gradle wrapper or gradle command found for the generated workspace");
  }

  if (!commandExists("java")) warnings.push("java command not found; Gradle/Android builds may fail");
  if (!commandExists("fastlane")) issues.push("fastlane is required for live Google Play upload via supply");

  const serviceAccountJsonB64 = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64 || keychainRead(context.service_account_keychain_service);
  if (!serviceAccountJsonB64) {
    issues.push(`Missing Google Play service account JSON in GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64 or Keychain service ${context.service_account_keychain_service}`);
  }

  let build_result = null;
  if (boolValue(args.build) && context.workspace_path && fs.existsSync(context.workspace_path)) {
    build_result = runGradleBuild(context.workspace_path, args["gradle-task"] || ":app:bundleRelease");
    if (!build_result.ok) issues.push(`Gradle bundle build failed: ${build_result.error}`);
  }

  const rawAabPath = args.aab || findAab(context.workspace_path);
  const aabPath = rawAabPath ? path.resolve(rawAabPath) : null;
  if (!aabPath || !fs.existsSync(aabPath)) {
    issues.push("No release AAB found. Pass --aab or run with --build after the Android project is configured.");
  }

  return {
    status: issues.length > 0 ? "preflight_failed" : "preflight_passed",
    mode: boolValue(args.submit) ? "submit" : "preflight",
    context: {
      ...context,
      aab_path: aabPath || null,
      has_service_account_json: Boolean(serviceAccountJsonB64),
      gradle_command: gradleCommand,
    },
    build_result,
    issues,
    warnings,
    next_action: issues.length > 0
      ? "Resolve preflight issues before running --submit."
      : "Run with --submit to upload the AAB to the Google Play internal track.",
  };
}

function runFastlaneSupply(preflightResult, args) {
  const serviceAccountJsonB64 = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64
    || keychainRead(preflightResult.context.service_account_keychain_service);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vibermode-google-play-"));
  const jsonKeyPath = path.join(tempDir, "service-account.json");

  try {
    fs.writeFileSync(jsonKeyPath, Buffer.from(serviceAccountJsonB64, "base64").toString("utf8"), { mode: 0o600 });

    const supplyArgs = [
      "supply",
      "--aab", preflightResult.context.aab_path,
      "--track", preflightResult.context.track,
      "--package_name", preflightResult.context.package_name,
      "--json_key", jsonKeyPath,
      "--release_status", preflightResult.context.release_status,
    ];

    if (boolValue(args["validate-only"])) {
      supplyArgs.push("--validate_only", "true");
    }

    if (preflightResult.context.metadata_path) {
      supplyArgs.push("--metadata_path", preflightResult.context.metadata_path);
    } else {
      supplyArgs.push(
        "--skip_upload_metadata", "true",
        "--skip_upload_changelogs", "true",
        "--skip_upload_images", "true",
        "--skip_upload_screenshots", "true",
      );
    }

    const result = run("fastlane", supplyArgs);
    return {
      ok: result.status === 0,
      stdout: result.stdout.slice(-4000),
      stderr: result.stderr.slice(-4000),
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printUsage();
    return;
  }

  const manifestPath = args["run-manifest"] ? path.resolve(args["run-manifest"]) : null;
  let manifest = null;
  try {
    manifest = manifestPath && fs.existsSync(manifestPath) ? readJson(manifestPath) : null;
  } catch (error) {
    output({
      status: "preflight_failed",
      mode: boolValue(args.submit) ? "submit" : "preflight",
      issues: [`Run manifest is not readable JSON: ${error.message}`],
    }, args["output-file"]);
    process.exitCode = 1;
    return;
  }

  const preflightResult = preflight(args, manifest, manifestPath);
  if (!boolValue(args.submit)) {
    output(preflightResult, args["output-file"]);
    process.exitCode = preflightResult.issues.length > 0 ? 1 : 0;
    return;
  }

  if (preflightResult.issues.length > 0) {
    output(preflightResult, args["output-file"]);
    process.exitCode = 1;
    return;
  }

  const upload = runFastlaneSupply(preflightResult, args);
  const submittedAt = new Date().toISOString();

  if (!upload.ok) {
    const submission = {
      status: "blocked",
      distribution: "google_play_internal",
      package_name: preflightResult.context.package_name,
      track: preflightResult.context.track,
      error: upload.stderr || upload.stdout || "fastlane supply failed",
      blocked_at: submittedAt,
    };
    updateManifestSubmission(manifestPath, manifest, submission);
    output({
      status: "blocked",
      mode: "submit",
      submission,
      fastlane: upload,
      next_action: "Resolve the Google Play submission blocker and rerun android-submit-play-internal for this same manifest.",
    }, args["output-file"]);
    process.exitCode = 1;
    return;
  }

  const validateOnly = boolValue(args["validate-only"]);
  const submission = {
    status: validateOnly ? "play_internal_validated" : "play_internal_uploaded",
    distribution: "google_play_internal",
    app_name: preflightResult.context.app_name,
    package_name: preflightResult.context.package_name,
    track: preflightResult.context.track,
    release_status: preflightResult.context.release_status,
    aab_path: preflightResult.context.aab_path,
    ...(validateOnly ? { validated_at: submittedAt } : { uploaded_at: submittedAt }),
  };
  updateManifestSubmission(manifestPath, manifest, submission);

  const stateSync = boolValue(args["commit-state"])
    ? commitState(manifestPath, preflightResult.context.run_id)
    : { status: "not_requested" };

  output({
    status: validateOnly ? "validated" : "submitted",
    mode: "submit",
    submission,
    fastlane: upload,
    state_sync: stateSync,
    next_action: validateOnly
      ? "Rerun without --validate-only to upload to Google Play internal testing."
      : "Check Google Play Console internal testing processing and tester access before promoting tracks.",
  }, args["output-file"]);
}

main().catch((error) => {
  output({
    status: "blocked",
    error: error.message,
  });
  process.exitCode = 1;
});
