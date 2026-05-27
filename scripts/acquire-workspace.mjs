#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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

function repoNameFromUrl(repoUrl) {
  const trimmed = repoUrl.replace(/\/+$/, "");
  const lastSegment = trimmed.split(/[/:]/).pop() || "";
  return lastSegment.replace(/\.git$/, "");
}

function safeDirectoryName(name) {
  const cleaned = name.trim().replace(/\.git$/, "");
  if (!/^[A-Za-z0-9._-]+$/.test(cleaned)) {
    throw new Error(`Invalid workspace directory name '${name}'. Use letters, numbers, dots, underscores, or hyphens.`);
  }
  if (cleaned === "." || cleaned === "..") {
    throw new Error(`Invalid workspace directory name '${name}'.`);
  }
  return cleaned;
}

function ensureInside(parentPath, targetPath) {
  const parent = path.resolve(parentPath);
  const target = path.resolve(targetPath);
  const relative = path.relative(parent, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  throw new Error(`Resolved workspace path is outside workspace parent: ${target}`);
}

function gitAuthEnv(repoUrl) {
  const token = process.env.GH_TOKEN;
  if (!token) return {};

  try {
    const parsed = new URL(repoUrl);
    if (parsed.hostname !== "github.com" || !parsed.protocol.startsWith("http")) {
      return {};
    }
  } catch {
    return {};
  }

  return {
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`,
  };
}

function sanitizeArg(arg) {
  return String(arg).replace(/https:\/\/[^/@\s]+@github\.com/g, "https://<redacted>@github.com");
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    const safeCommand = args.map(sanitizeArg).join(" ");
    throw new Error(`git ${safeCommand} failed${output ? `:\n${output}` : ""}`);
  }

  return result.stdout.trim();
}

function outputGitHubActionValues(values) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;

  const lines = Object.entries(values).map(([key, value]) => `${key}=${value ?? ""}`);
  fs.appendFileSync(outputFile, `${lines.join("\n")}\n`);
}

const args = parseArgs(process.argv.slice(2));

const config = {
  repoUrl: args["repo-url"] || process.env.REPO_URL,
  workspaceParent: args["workspace-parent"] || process.env.WORKSPACE_PARENT,
  workspacePath: args["workspace-path"] || process.env.WORKSPACE_PATH,
  projectName: args["project-name"] || process.env.PROJECT_NAME,
  baseBranch: args["base-branch"] || process.env.BASE_BRANCH,
  allowExisting: boolValue(args["allow-existing"] ?? process.env.ALLOW_EXISTING, true),
  dryRun: boolValue(args["dry-run"] ?? process.env.DRY_RUN, false),
};

function resolveWorkspacePath() {
  if (config.workspacePath) {
    const resolved = path.resolve(config.workspacePath);
    if (config.workspaceParent) {
      ensureInside(config.workspaceParent, resolved);
    }
    return resolved;
  }

  requireValue("WORKSPACE_PARENT", config.workspaceParent);
  requireValue("REPO_URL", config.repoUrl);

  const directoryName = safeDirectoryName(config.projectName || repoNameFromUrl(config.repoUrl));
  return path.resolve(config.workspaceParent, directoryName);
}

function main() {
  const workspacePath = resolveWorkspacePath();
  const workspaceParent = path.dirname(workspacePath);
  const exists = fs.existsSync(workspacePath);

  if (config.dryRun) {
    const result = {
      status: exists ? "would_reuse" : "would_clone",
      repo_url: config.repoUrl || "",
      workspace_path: workspacePath,
      workspace_parent: workspaceParent,
      project_name: config.projectName || path.basename(workspacePath),
    };
    outputGitHubActionValues(result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (exists) {
    if (!config.allowExisting) {
      throw new Error(`Workspace already exists and ALLOW_EXISTING=false: ${workspacePath}`);
    }
    if (!fs.existsSync(path.join(workspacePath, ".git"))) {
      throw new Error(`Workspace already exists but is not a git repository: ${workspacePath}`);
    }

    const result = {
      status: "reused",
      repo_url: runGit(["remote", "get-url", "origin"], { cwd: workspacePath }),
      workspace_path: workspacePath,
      workspace_parent: workspaceParent,
      project_name: config.projectName || path.basename(workspacePath),
      head_sha: runGit(["rev-parse", "HEAD"], { cwd: workspacePath }),
      branch: runGit(["branch", "--show-current"], { cwd: workspacePath }),
    };
    outputGitHubActionValues(result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  requireValue("REPO_URL", config.repoUrl);
  fs.mkdirSync(workspaceParent, { recursive: true });

  const cloneArgs = ["clone"];
  if (config.baseBranch) {
    cloneArgs.push("--branch", config.baseBranch);
  }
  cloneArgs.push(config.repoUrl, workspacePath);

  runGit(cloneArgs, { env: gitAuthEnv(config.repoUrl) });

  const result = {
    status: "cloned",
    repo_url: runGit(["remote", "get-url", "origin"], { cwd: workspacePath }),
    workspace_path: workspacePath,
    workspace_parent: workspaceParent,
    project_name: config.projectName || path.basename(workspacePath),
    head_sha: runGit(["rev-parse", "HEAD"], { cwd: workspacePath }),
    branch: runGit(["branch", "--show-current"], { cwd: workspacePath }),
  };

  outputGitHubActionValues(result);
  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
