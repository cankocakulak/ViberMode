#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptsDir, "..");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

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

function sanitizeOutput(output) {
  return String(output || "").replace(/https:\/\/[^/@\s]+@github\.com/g, "https://<redacted>@github.com");
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

  if (result.status !== 0) {
    const output = sanitizeOutput([result.stderr, result.stdout].filter(Boolean).join("\n").trim());
    throw new Error(`${command} ${args.join(" ")} failed${output ? `:\n${output}` : ""}`);
  }

  return {
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function parseJsonOutput(output, label) {
  const trimmed = output.trim();
  if (!trimmed) {
    throw new Error(`${label} produced no JSON output`);
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(`${label} did not produce parseable JSON`);
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/workspace-topology.mjs \\
    --run-manifest <factory-run.json> \\
    [--topology-file <prd-or-stories-or-json>] \\
    [--docs-path <docs/project-name>] \\
    [--ai-services-path <shared-ai-services-repo>] \\
    [--backend-template-owner <owner>] \\
    [--backend-template-repo <repo>] \\
    [--destination-owner <owner>] \\
    [--dry-run]

Purpose:
  Apply the approved Runtime Topology to a product workspace bundle after
  spec review and before bootstrap. The command verifies or creates the
  shared ai-services symlink when requested, provisions a backend sibling
  only when the approved topology requires it, and records a manifest
  checkpoint when provisioning is intentionally skipped.
`);
}

function getWorkspaceBundle(manifest) {
  return manifest.product_to_code_input?.workspace_bundle || manifest.workspace_bundle;
}

function updateManifestBundle(manifest, bundle) {
  manifest.workspace_bundle = bundle;
  manifest.product_to_code_input = manifest.product_to_code_input || {};
  manifest.product_to_code_input.workspace_bundle = bundle;
}

function primaryRepoEntry(bundle) {
  const primaryRole = bundle.primary_repo_role || "ios-app";
  return bundle.repos?.find((repo) => repo.role === primaryRole) || bundle.repos?.[0] || null;
}

function projectName(manifest, bundle) {
  return (
    manifest.product_to_code_input?.project_name ||
    manifest.repository?.selected_name ||
    manifest.selection?.repo_name ||
    path.basename(bundle.root)
  );
}

function candidateTopologyFiles({ args, manifest, bundle }) {
  const candidates = [];
  if (args["topology-file"]) candidates.push(path.resolve(args["topology-file"]));

  const primaryRepo = primaryRepoEntry(bundle);
  const workspacePath = primaryRepo?.workspace_path || manifest.product_to_code_input?.workspace_path || manifest.workspace?.workspace_path;
  const name = projectName(manifest, bundle);
  const docsRoots = [];

  if (args["docs-path"]) docsRoots.push(path.resolve(args["docs-path"]));
  if (workspacePath) {
    docsRoots.push(path.join(workspacePath, "Docs", name));
    docsRoots.push(path.join(workspacePath, "docs", name));
  }

  for (const docsRoot of docsRoots) {
    candidates.push(
      path.join(docsRoot, "workflow-status.json"),
      path.join(docsRoot, "tasks.json"),
      path.join(docsRoot, "stories.md"),
      path.join(docsRoot, "ux.md"),
      path.join(docsRoot, "prd.md"),
      path.join(docsRoot, "spec-review.md"),
    );
  }

  return [...new Set(candidates)];
}

function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed === "null") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => parseScalar(item))
      .filter((item) => item !== "");
  }

  return trimmed;
}

function parseRuntimeTopologyBlock(markdown) {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => /^\s*runtime_topology:\s*$/.test(line));
  if (startIndex === -1) return null;

  const baseIndent = lines[startIndex].match(/^\s*/)[0].length;
  const block = {};

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^\s*```/.test(line)) break;
    if (/^\s*#{1,6}\s+/.test(line)) break;

    const indent = line.match(/^\s*/)[0].length;
    if (indent <= baseIndent) break;

    const match = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;

    const [, rawKey, rawValue] = match;
    if (!rawValue.trim()) continue;
    block[rawKey] = parseScalar(rawValue);
  }

  return Object.keys(block).length > 0 ? block : null;
}

function topologyFromFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  if (filePath.endsWith(".json")) {
    const json = readJson(filePath);
    const topology =
      json.runtime_topology ||
      json.runtimeTopology ||
      json.bootstrapContext?.runtime_topology ||
      json.bootstrapContext?.runtimeTopology ||
      null;
    return topology ? { source_path: filePath, topology } : null;
  }

  const topology = parseRuntimeTopologyBlock(fs.readFileSync(filePath, "utf8"));
  return topology ? { source_path: filePath, topology } : null;
}

function findTopology({ args, manifest, bundle }) {
  for (const filePath of candidateTopologyFiles({ args, manifest, bundle })) {
    const found = topologyFromFile(filePath);
    if (found) return found;
  }

  return null;
}

function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim().toLowerCase();
}

function stringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) {
    if (value.includes(",")) return value.split(",").map((item) => item.trim()).filter(Boolean);
    return [value.trim()];
  }
  return [];
}

function isNoneValue(value) {
  return ["", "none", "null", "n/a", "na", "deferred", "false"].includes(normalizeText(value));
}

function topologyDecision(topology) {
  const mode = normalizeText(topology.mode || topology.topology_mode || topology.topologyMode);
  const requiredRepos = stringList(
    topology.required_repos_now ||
      topology.required_repo_roles ||
      topology.requiredReposNow ||
      topology.requiredRepoRoles,
  ).map(normalizeText);
  const backendTrigger =
    topology.backend_trigger ||
    topology.backendTrigger ||
    topology.backend_trigger_story ||
    topology.backendTriggerStory ||
    "";
  const aiUsage = normalizeText(topology.ai_services_usage || topology.aiServicesUsage);

  const backendRequired =
    mode.includes("backend") ||
    requiredRepos.includes("backend") ||
    !isNoneValue(backendTrigger);
  const aiServicesRequired =
    mode.includes("ai-services") ||
    requiredRepos.includes("ai-services") ||
    ["symlink", "reference", "runtime"].includes(aiUsage);

  return {
    mode,
    required_repos: requiredRepos,
    backend_trigger: backendTrigger ?? null,
    backend_required: backendRequired,
    ai_services_usage: aiUsage || null,
    ai_services_required: aiServicesRequired,
  };
}

function aiServicesSourcePath(args) {
  const value = args["ai-services-path"] || process.env.VIBERMODE_AI_SERVICES_PATH || process.env.AI_SERVICES_PATH;
  return value ? path.resolve(value) : null;
}

function findRepo(bundle, role) {
  return Array.isArray(bundle.repos) ? bundle.repos.find((repo) => repo.role === role) : null;
}

function upsertRepo(bundle, entry) {
  bundle.repos = Array.isArray(bundle.repos) ? bundle.repos : [];
  const index = bundle.repos.findIndex((repo) => repo.role === entry.role);
  if (index === -1) {
    bundle.repos.push(entry);
  } else {
    bundle.repos[index] = {
      ...bundle.repos[index],
      ...entry,
    };
  }
}

function ensureAiServices({ args, bundle, decision, dryRun }) {
  const existing = findRepo(bundle, "ai-services");
  const sourcePath = aiServicesSourcePath(args) || existing?.source_path || null;
  const shouldEnsure = Boolean(existing || sourcePath || decision.ai_services_required);

  if (!shouldEnsure) {
    return {
      status: "not_configured",
      required: false,
    };
  }

  const linkPath = existing?.workspace_path || path.join(bundle.root, "ai-services");
  const entry = {
    ...existing,
    role: "ai-services",
    workspace_path: linkPath,
    source_path: sourcePath,
    link_type: "symlink",
    required: Boolean(decision.ai_services_required),
  };

  if (bundle.layout && bundle.layout !== "bundle") {
    return {
      ...entry,
      status: "skipped_non_bundle_layout",
      issue: decision.ai_services_required ? "ai-services requires bundle layout" : null,
    };
  }

  if (!sourcePath) {
    return {
      ...entry,
      status: "target_missing",
      issue: decision.ai_services_required ? "ai-services source path is required by runtime topology" : null,
    };
  }

  if (!fs.existsSync(sourcePath)) {
    return {
      ...entry,
      status: "target_missing",
      issue: decision.ai_services_required ? `ai-services source path does not exist: ${sourcePath}` : null,
    };
  }

  if (dryRun) {
    return {
      ...entry,
      status: fs.existsSync(linkPath) ? "would_reuse_or_verify" : "would_link",
    };
  }

  fs.mkdirSync(bundle.root, { recursive: true });

  if (fs.existsSync(linkPath)) {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) {
      return {
        ...entry,
        status: "conflict",
        issue: `Non-symlink path exists at ${linkPath}`,
      };
    }

    const existingTarget = path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath));
    if (existingTarget !== sourcePath) {
      return {
        ...entry,
        status: "conflict",
        existing_target: existingTarget,
        issue: `ai-services symlink points to ${existingTarget}, expected ${sourcePath}`,
      };
    }

    upsertRepo(bundle, { ...entry, status: "reused" });
    return {
      ...entry,
      status: "reused",
    };
  }

  fs.symlinkSync(sourcePath, linkPath, "dir");
  upsertRepo(bundle, { ...entry, status: "created" });
  return {
    ...entry,
    status: "created",
  };
}

function provisionBackend({ args, runManifestPath, dryRun }) {
  const provisionArgs = [
    path.join(scriptsDir, "workspace-bundle-provision.mjs"),
    "--run-manifest",
    runManifestPath,
    "--repo-role",
    "backend",
  ];

  const passThroughKeys = [
    "backend-template-owner",
    "backend-template-repo",
    "backend-repo-name",
    "backend-stack",
    "destination-owner",
  ];

  for (const key of passThroughKeys) {
    if (args[key]) {
      provisionArgs.push(`--${key}`, args[key]);
    }
  }

  if (dryRun) provisionArgs.push("--dry-run");

  const result = run(process.execPath, provisionArgs, { cwd: repoRoot });
  return parseJsonOutput(result.stdout, "workspace-bundle-provision");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const runManifestPath = path.resolve(requireValue("--run-manifest", args["run-manifest"]));
  const dryRun = boolValue(args["dry-run"] ?? process.env.DRY_RUN, false);
  const manifest = readJson(runManifestPath);
  const bundle = getWorkspaceBundle(manifest);

  if (!bundle?.root) {
    throw new Error("Run manifest does not contain workspace_bundle.root.");
  }

  const foundTopology = findTopology({ args, manifest, bundle });
  if (!foundTopology) {
    throw new Error("No runtime_topology found in topology file, workflow status, tasks, stories, UX, or PRD artifacts.");
  }

  const decision = topologyDecision(foundTopology.topology);
  const nextBundle = {
    ...bundle,
    repos: Array.isArray(bundle.repos) ? [...bundle.repos] : [],
  };
  const aiServices = ensureAiServices({ args, bundle: nextBundle, decision, dryRun });
  const issues = [aiServices.issue].filter(Boolean);

  let backend = {
    status: "skipped",
    reason: decision.backend_required ? "not_started" : "runtime_topology_does_not_require_backend",
  };
  let backendProvisionResult = null;

  if (issues.length === 0 && decision.backend_required) {
    backendProvisionResult = provisionBackend({ args, runManifestPath, dryRun });
    backend = backendProvisionResult.repo;
  }

  const status = issues.length > 0
    ? "blocked"
    : decision.backend_required
      ? backendProvisionResult?.status || "provisioned"
      : "complete_noop";

  const checkpoint = {
    status,
    dry_run: dryRun,
    updated_at: new Date().toISOString(),
    topology_source: foundTopology.source_path,
    runtime_topology: foundTopology.topology,
    decision,
    ai_services: aiServices,
    backend,
    issues,
  };

  const result = {
    status,
    run_manifest_path: runManifestPath,
    workspace_bundle: backendProvisionResult?.workspace_bundle || nextBundle,
    workspace_topology: checkpoint,
  };

  if (!dryRun) {
    const nextManifest = decision.backend_required && backendProvisionResult
      ? readJson(runManifestPath)
      : manifest;
    const manifestBundle = backendProvisionResult?.workspace_bundle || nextBundle;

    updateManifestBundle(nextManifest, manifestBundle);
    nextManifest.provisioning = nextManifest.provisioning || {};
    nextManifest.provisioning.updated_at = checkpoint.updated_at;
    nextManifest.provisioning.workspace_topology = checkpoint;
    if (backendProvisionResult?.repo) {
      nextManifest.provisioning.backend = backendProvisionResult.repo;
    }
    writeJson(runManifestPath, nextManifest);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
