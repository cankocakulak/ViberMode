#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

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

function boolValue(value) {
  if (value === true) return true;
  return ["1", "true", "yes", "y", "on"].includes(String(value || "").toLowerCase());
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compact(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9.]+/g, "");
}

function readJsonIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeOutput(value, outputFile) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, text);
  }
  process.stdout.write(text);
}

function walkFiles(rootDir, predicate, results = []) {
  if (!rootDir || !fs.existsSync(rootDir)) return results;

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if ([".git", "node_modules", "DerivedData", "build"].includes(entry.name)) continue;
      walkFiles(entryPath, predicate, results);
    } else if (entry.isFile() && predicate(entryPath)) {
      results.push(entryPath);
    }
  }

  return results;
}

function walkDirs(rootDir, predicate, results = []) {
  if (!rootDir || !fs.existsSync(rootDir)) return results;

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);
    if (!entry.isDirectory()) continue;
    if ([".git", "node_modules", "DerivedData", "build"].includes(entry.name)) continue;
    if (predicate(entryPath, entry.name)) results.push(entryPath);
    walkDirs(entryPath, predicate, results);
  }

  return results;
}

function firstPath(object, paths) {
  for (const parts of paths) {
    let current = object;
    for (const part of parts) {
      current = current?.[part];
    }
    if (current != null && current !== "") return current;
  }
  return null;
}

function inferPlatform(candidate) {
  const declared = String(candidate.platform || "").toLowerCase();
  if (["ios", "android", "web", "custom"].includes(declared)) return declared;

  const repo = String(candidate.target_repo || candidate.workspace_path || "").toLowerCase();
  if (repo.includes("/ios-app") || repo.includes("ios-")) return "ios";
  if (repo.includes("/android-app") || repo.includes("android-")) return "android";
  if (candidate.bundle_id) return "ios";
  if (candidate.package_name) return "android";
  return "custom";
}

function defaultReleaseTarget(platform) {
  if (platform === "ios") return "ios-testflight";
  if (platform === "android") return "android-play-internal";
  return "none";
}

function normalizeCandidate(input, source) {
  const targetRepo = input.target_repo || input.workspace_path || input.repo_path || null;
  const name = input.name || input.app_name || input.display_name || input.project_name || (targetRepo ? path.basename(path.dirname(targetRepo)) : null);
  const platform = inferPlatform({ ...input, target_repo: targetRepo });
  const projectName = input.project_name || slug(name || path.basename(targetRepo || "app"));
  const artifactRoot = input.artifact_root || (targetRepo ? path.join(targetRepo, "docs", projectName) : null);
  const aliases = new Set([
    ...(Array.isArray(input.aliases) ? input.aliases : []),
    name,
    input.app_name,
    input.display_name,
    input.project_name,
    input.bundle_id,
    input.package_name,
    targetRepo,
  ].filter(Boolean).flatMap((value) => [String(value), slug(value), compact(value)]));

  return {
    source,
    name: name || projectName,
    aliases: [...aliases].filter(Boolean).sort(),
    platform,
    target_repo: targetRepo ? path.resolve(targetRepo) : null,
    project_name: projectName,
    artifact_root: artifactRoot ? path.resolve(artifactRoot) : null,
    change_request_path: input.change_request_path
      ? path.resolve(input.change_request_path)
      : artifactRoot
        ? path.resolve(path.join(artifactRoot, "change-request.md"))
        : null,
    run_manifest_path: input.run_manifest_path ? path.resolve(input.run_manifest_path) : null,
    bundle_id: input.bundle_id || null,
    package_name: input.package_name || null,
    default_release_target: input.default_release_target || defaultReleaseTarget(platform),
    submit_when_ready_default: Boolean(input.submit_when_ready_default),
    forbid_dirty: Array.isArray(input.forbid_dirty) ? input.forbid_dirty.map((item) => path.resolve(item)) : [],
  };
}

function registryPaths(args) {
  const requested = args.registry || process.env.VIBERMODE_APP_REGISTRY;
  const paths = [];
  if (requested) paths.push(requested);
  paths.push(
    "docs/operations/app-registry.local.json",
    "docs/operations/app-registry.json",
  );
  return [...new Set(paths.map((item) => path.resolve(item)))];
}

function workspaceRoot(args) {
  return path.resolve(args["workspace-root"] || process.env.VIBERMODE_WORKSPACE_ROOT || path.join(os.homedir(), "ViberModeWorkspaces"));
}

function loadRegistryCandidates(args) {
  const candidates = [];
  for (const registryPath of registryPaths(args)) {
    const registry = readJsonIfExists(registryPath);
    if (!registry) continue;
    const apps = Array.isArray(registry) ? registry : registry.apps;
    if (!Array.isArray(apps)) {
      throw new Error(`Registry must be an array or contain apps[]: ${registryPath}`);
    }
    for (const app of apps) {
      candidates.push(normalizeCandidate(app, `registry:${registryPath}`));
    }
  }
  return candidates;
}

function manifestToCandidate(manifestPath) {
  const manifest = readJsonIfExists(manifestPath);
  if (!manifest) return null;
  const autopilot = manifest.app_autopilot || manifest.appAutopilot || {};

  const workspacePath = firstPath(manifest, [
    ["app_autopilot", "target_repo"],
    ["appAutopilot", "target_repo"],
    ["workspace_path"],
    ["workspace", "path"],
    ["factory_workspace", "workspace_path"],
    ["factory_workspace", "ios_app_path"],
    ["product_to_code_input", "target_repo"],
    ["product_to_code_input", "repo_path"],
  ]);

  if (!workspacePath) return null;

  const appName = firstPath(manifest, [
    ["app_autopilot", "name"],
    ["appAutopilot", "name"],
    ["app_name"],
    ["display_name"],
    ["selected_idea", "app_name"],
    ["idea", "app_name"],
    ["submission_metadata", "app_store_name"],
  ]);

  return normalizeCandidate({
    name: appName,
    aliases: [
      ...(Array.isArray(autopilot.aliases) ? autopilot.aliases : []),
      manifest.run_id,
      firstPath(manifest, [["repo_slug"], ["selected_idea", "repo_slug"], ["idea", "repo_slug"]]),
    ].filter(Boolean),
    platform: autopilot.platform || firstPath(manifest, [["platform"], ["target_platform"]]),
    target_repo: workspacePath,
    run_manifest_path: manifestPath,
    project_name: autopilot.project_name,
    artifact_root: autopilot.artifact_root,
    change_request_path: autopilot.change_request_path,
    bundle_id: autopilot.bundle_id || firstPath(manifest, [["bundle_id"], ["app", "bundle_id"], ["selected_idea", "bundle_id"]]),
    package_name: autopilot.package_name || firstPath(manifest, [["package_name"], ["application_id"], ["android", "package_name"]]),
    default_release_target: autopilot.default_release_target,
    submit_when_ready_default: autopilot.submit_when_ready_default,
    forbid_dirty: autopilot.forbid_dirty,
  }, `manifest:${manifestPath}`);
}

function loadManifestCandidates(args) {
  const stateRoot = args["state-root"] || process.env.APP_FACTORY_STATE_ROOT || path.join(workspaceRoot(args), "app-factory-state");
  const runsRoot = path.resolve(stateRoot, "factory", "runs");
  return walkFiles(runsRoot, (filePath) => filePath.endsWith(".json"))
    .map(manifestToCandidate)
    .filter(Boolean);
}

function loadWorkspaceCandidates(args) {
  const generatedRoot = args["generated-products-root"] || process.env.VIBERMODE_GENERATED_PRODUCTS_ROOT || path.join(workspaceRoot(args), "generated-products");
  return walkDirs(generatedRoot, (_dirPath, name) => ["ios-app", "android-app", "app"].includes(name))
    .map((repoPath) => normalizeCandidate({
      target_repo: repoPath,
      name: path.basename(path.dirname(repoPath)),
    }, `workspace:${repoPath}`));
}

function dedupe(candidates) {
  const byKey = new Map();
  for (const candidate of candidates) {
    const key = candidate.run_manifest_path || candidate.target_repo || `${candidate.name}:${candidate.source}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }

    byKey.set(key, {
      source: `${existing.source},${candidate.source}`,
      name: existing.name || candidate.name,
      aliases: [...new Set([...existing.aliases, ...candidate.aliases])].sort(),
      platform: existing.platform || candidate.platform,
      target_repo: existing.target_repo || candidate.target_repo,
      project_name: existing.project_name || candidate.project_name,
      artifact_root: existing.artifact_root || candidate.artifact_root,
      change_request_path: existing.change_request_path || candidate.change_request_path,
      run_manifest_path: existing.run_manifest_path || candidate.run_manifest_path,
      bundle_id: existing.bundle_id || candidate.bundle_id,
      package_name: existing.package_name || candidate.package_name,
      default_release_target: existing.default_release_target || candidate.default_release_target,
      submit_when_ready_default: existing.submit_when_ready_default || candidate.submit_when_ready_default,
      forbid_dirty: [...new Set([...(existing.forbid_dirty || []), ...(candidate.forbid_dirty || [])])],
    });
  }
  return [...byKey.values()];
}

function matchCandidates(candidates, appQuery) {
  if (!appQuery) return [];
  const query = String(appQuery).trim();
  const querySlug = slug(query);
  const queryCompact = compact(query);
  const queryPath = path.isAbsolute(query) ? path.resolve(query) : null;

  return candidates.filter((candidate) => {
    if (queryPath && candidate.target_repo === queryPath) return true;
    return candidate.aliases.includes(query) ||
      candidate.aliases.includes(querySlug) ||
      candidate.aliases.includes(queryCompact);
  });
}

function applyOverrides(candidate, args) {
  return {
    ...candidate,
    mode: args.mode || null,
    release_target: args["release-target"] || candidate.default_release_target,
    submit_when_ready: args["submit-when-ready"] != null
      ? boolValue(args["submit-when-ready"])
      : candidate.submit_when_ready_default,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const app = args.app || args._[0];
  const candidates = dedupe([
    ...loadRegistryCandidates(args),
    ...loadManifestCandidates(args),
    ...loadWorkspaceCandidates(args),
  ]);

  if (boolValue(args.all)) {
    writeOutput({ status: "ok", candidates }, args.output);
    return;
  }

  if (!app) {
    writeOutput({
      status: "missing_app",
      error: "Pass --app <name-or-alias> or use --all to list candidates.",
      candidates,
    }, args.output);
    process.exitCode = 1;
    return;
  }

  const matches = matchCandidates(candidates, app);
  if (matches.length === 1) {
    writeOutput({
      status: "resolved",
      app: applyOverrides(matches[0], args),
      next_action: "Pass this resolved context into app-autopilot.",
    }, args.output);
    return;
  }

  if (matches.length > 1) {
    writeOutput({
      status: "ambiguous",
      error: `Multiple apps matched '${app}'. Add a registry alias or pass a more specific bundle id, package name, run id, or repo path.`,
      candidates: matches,
    }, args.output);
    process.exitCode = 2;
    return;
  }

  writeOutput({
    status: "not_found",
    error: `No app matched '${app}'. Add docs/operations/app-registry.local.json or pass --registry, --workspace-root, --state-root, or --generated-products-root.`,
    candidates,
  }, args.output);
  process.exitCode = 3;
}

try {
  main();
} catch (error) {
  writeOutput({
    status: "error",
    error: error.message,
  });
  process.exitCode = 1;
}
