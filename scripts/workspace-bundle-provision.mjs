#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(scriptPath);

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function printUsage() {
  process.stdout.write(`Usage:
  GH_TOKEN=... node scripts/workspace-bundle-provision.mjs \\
    --run-manifest <factory-run.json> \\
    --repo-role backend \\
    --backend-template-owner <owner> \\
    --backend-template-repo <repo> \\
    --destination-owner <owner> \\
    [--dry-run]

Purpose:
  Provision an optional sibling repo inside a product workspace bundle after
  spec review approves runtime topology that requires the repo.

Currently supported repo roles:
  backend
`);
}

function getWorkspaceBundle(manifest) {
  return manifest.product_to_code_input?.workspace_bundle || manifest.workspace_bundle;
}

function primaryRepoName(manifest, bundle) {
  const explicit = manifest.repository?.selected_name || manifest.product_to_code_input?.project_name || manifest.selection?.repo_name;
  if (explicit) return explicit;

  const primaryRole = bundle.primary_repo_role || "ios-app";
  const primaryRepo = bundle.repos?.find((repo) => repo.role === primaryRole);
  if (primaryRepo?.workspace_path) return path.basename(path.dirname(primaryRepo.workspace_path));

  return path.basename(bundle.root);
}

function backendRepoName(args, manifest, bundle) {
  if (args["backend-repo-name"]) return args["backend-repo-name"];
  const baseName = primaryRepoName(manifest, bundle);
  return `${baseName}-backend`;
}

function upsertRepo(bundle, repoEntry) {
  bundle.repos = Array.isArray(bundle.repos) ? bundle.repos : [];
  const index = bundle.repos.findIndex((repo) => repo.role === repoEntry.role);
  if (index === -1) {
    bundle.repos.push(repoEntry);
  } else {
    bundle.repos[index] = {
      ...bundle.repos[index],
      ...repoEntry,
    };
  }
}

function updateManifestBundle(manifest, bundle) {
  manifest.workspace_bundle = bundle;
  manifest.product_to_code_input = manifest.product_to_code_input || {};
  manifest.product_to_code_input.workspace_bundle = bundle;
}

function provisionBackend({ args, manifest, bundle, dryRun }) {
  const destinationOwner = requireValue("--destination-owner or DESTINATION_OWNER", args["destination-owner"] || process.env.DESTINATION_OWNER);
  const templateOwner = requireValue(
    "--backend-template-owner or BACKEND_TEMPLATE_OWNER",
    args["backend-template-owner"] || process.env.BACKEND_TEMPLATE_OWNER,
  );
  const templateRepo = requireValue(
    "--backend-template-repo or BACKEND_TEMPLATE_REPO",
    args["backend-template-repo"] || process.env.BACKEND_TEMPLATE_REPO,
  );
  const repoName = backendRepoName(args, manifest, bundle);
  const workspacePath = path.join(bundle.root, "backend");
  const stack = args["backend-stack"] || process.env.BACKEND_STACK || "backend";
  const existingEntry = Array.isArray(bundle.repos)
    ? bundle.repos.find((repo) => repo.role === "backend")
    : null;

  if (existingEntry) {
    const existingWorkspacePath = existingEntry.workspace_path || workspacePath;

    if (dryRun) {
      return {
        ...existingEntry,
        role: "backend",
        status: fs.existsSync(existingWorkspacePath) ? "would_reuse_existing_workspace" : "would_preserve_existing_entry",
        workspace_path: existingWorkspacePath,
        stack: existingEntry.stack || stack,
        required: existingEntry.required ?? true,
      };
    }

    if (!existingEntry.repo_url) {
      return {
        ...existingEntry,
        role: "backend",
        status: fs.existsSync(existingWorkspacePath) ? "reused_existing_workspace" : "preserved_existing_entry",
        workspace_path: existingWorkspacePath,
        stack: existingEntry.stack || stack,
        required: existingEntry.required ?? true,
      };
    }

    const workspaceProcess = run(
      process.execPath,
      [
        path.join(scriptsDir, "acquire-workspace.mjs"),
        "--repo-url",
        existingEntry.repo_url,
        "--workspace-path",
        existingWorkspacePath,
        "--project-name",
        path.basename(existingWorkspacePath),
        "--allow-existing",
        "true",
      ],
      { cwd: path.resolve(scriptsDir, "..") },
    );
    const workspaceResult = parseJsonOutput(workspaceProcess.stdout, "acquire-workspace");

    return {
      ...existingEntry,
      role: "backend",
      status: workspaceResult.status === "reused" ? "reused_existing_workspace" : "cloned_existing_repo",
      workspace_path: workspaceResult.workspace_path,
      branch: workspaceResult.branch,
      head_sha: workspaceResult.head_sha,
      stack: existingEntry.stack || stack,
      required: existingEntry.required ?? true,
    };
  }

  if (dryRun) {
    return {
      role: "backend",
      status: fs.existsSync(workspacePath) ? "would_reuse_workspace" : "would_create",
      requested_repo_name: repoName,
      template: `${templateOwner}/${templateRepo}`,
      destination_owner: destinationOwner,
      workspace_path: workspacePath,
      stack,
      required: true,
    };
  }

  requireValue("GH_TOKEN", process.env.GH_TOKEN);

  const repoProcess = run(
    process.execPath,
    [
      path.join(scriptsDir, "github-create-template-repo.mjs"),
      "--template-owner",
      templateOwner,
      "--template-repo",
      templateRepo,
      "--destination-owner",
      destinationOwner,
      "--name",
      repoName,
      "--private",
      "--description",
      `Generated backend sibling for ${primaryRepoName(manifest, bundle)}`,
    ],
    { cwd: path.resolve(scriptsDir, "..") },
  );
  const repoResult = parseJsonOutput(repoProcess.stdout, "github-create-template-repo");

  const workspaceProcess = run(
    process.execPath,
    [
      path.join(scriptsDir, "acquire-workspace.mjs"),
      "--repo-url",
      repoResult.clone_url,
      "--workspace-path",
      workspacePath,
      "--project-name",
      repoResult.selected_name,
      "--allow-existing",
      "false",
    ],
    { cwd: path.resolve(scriptsDir, "..") },
  );
  const workspaceResult = parseJsonOutput(workspaceProcess.stdout, "acquire-workspace");

  return {
    role: "backend",
    status: "created",
    requested_repo_name: repoName,
    template: repoResult.template,
    full_name: repoResult.full_name,
    html_url: repoResult.html_url,
    repo_url: repoResult.clone_url,
    workspace_path: workspaceResult.workspace_path,
    branch: workspaceResult.branch,
    head_sha: workspaceResult.head_sha,
    platform: "backend",
    stack,
    required: true,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const runManifestPath = path.resolve(requireValue("--run-manifest", args["run-manifest"]));
  const repoRole = requireValue("--repo-role", args["repo-role"]);
  const dryRun = boolValue(args["dry-run"] ?? process.env.DRY_RUN, false);
  const manifest = readJson(runManifestPath);
  const bundle = getWorkspaceBundle(manifest);

  if (!bundle?.root) {
    throw new Error("Run manifest does not contain workspace_bundle.root.");
  }

  if (repoRole !== "backend") {
    throw new Error(`Unsupported repo role: ${repoRole}. Currently supported: backend.`);
  }

  const repoEntry = provisionBackend({ args, manifest, bundle, dryRun });
  const nextBundle = {
    ...bundle,
    repos: Array.isArray(bundle.repos) ? [...bundle.repos] : [],
  };
  upsertRepo(nextBundle, repoEntry);

  const result = {
    status: dryRun ? "dry_run" : "provisioned",
    run_manifest_path: runManifestPath,
    repo_role: repoRole,
    repo: repoEntry,
    workspace_bundle: nextBundle,
  };

  if (!dryRun) {
    manifest.provisioning = manifest.provisioning || {};
    manifest.provisioning.updated_at = new Date().toISOString();
    manifest.provisioning[repoRole] = repoEntry;
    updateManifestBundle(manifest, nextBundle);
    writeJson(runManifestPath, manifest);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
