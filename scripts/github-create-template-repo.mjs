#!/usr/bin/env node

import fs from "node:fs";

class HttpError extends Error {
  constructor(message, response, body, apiPath) {
    super(message);
    this.name = "HttpError";
    this.status = response.status;
    this.body = body;
    this.apiPath = apiPath;
  }
}

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

function validateRepoName(name) {
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new Error(`Invalid repository name '${name}'. Use letters, numbers, dots, underscores, or hyphens.`);
  }
}

function outputGitHubActionValues(values) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;

  const lines = Object.entries(values).map(([key, value]) => `${key}=${value ?? ""}`);
  fs.appendFileSync(outputFile, `${lines.join("\n")}\n`);
}

function writeSummary(result) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  fs.appendFileSync(
    summaryFile,
    [
      "## iOS Template Repo Factory",
      "",
      `Status: \`${result.status}\``,
      `Repository: [${result.full_name}](${result.html_url})`,
      `Private: \`${result.private}\``,
      "",
    ].join("\n"),
  );
}

const args = parseArgs(process.argv.slice(2));

const config = {
  token: process.env.GH_TOKEN,
  templateOwner: args["template-owner"] || process.env.TEMPLATE_OWNER,
  templateRepo: args["template-repo"] || process.env.TEMPLATE_REPO,
  destinationOwner: args.owner || args["destination-owner"] || process.env.DESTINATION_OWNER,
  newRepoName: args.name || args["new-repo-name"] || process.env.NEW_REPO_NAME,
  description: args.description || process.env.DESCRIPTION || "Created by the ViberMode iOS app factory.",
  private: args.public ? false : boolValue(args.private ?? process.env.REPO_PRIVATE, true),
  includeAllBranches: boolValue(args["include-all-branches"] ?? process.env.INCLUDE_ALL_BRANCHES, false),
  maxNameAttempts: Number(args["max-name-attempts"] || process.env.MAX_NAME_ATTEMPTS || 50),
  dryRun: boolValue(args["dry-run"] ?? process.env.DRY_RUN, false),
};

config.token = requireValue("GH_TOKEN", config.token);
config.templateOwner = requireValue("TEMPLATE_OWNER", config.templateOwner);
config.templateRepo = requireValue("TEMPLATE_REPO", config.templateRepo);
config.destinationOwner = requireValue("DESTINATION_OWNER", config.destinationOwner);
config.newRepoName = requireValue("NEW_REPO_NAME", config.newRepoName);

validateRepoName(config.newRepoName);

if (!Number.isInteger(config.maxNameAttempts) || config.maxNameAttempts < 1) {
  throw new Error("MAX_NAME_ATTEMPTS must be a positive integer.");
}

async function github(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
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
    throw new HttpError(`GitHub API ${response.status} on ${path}: ${message}`, response, body, path);
  }

  return body;
}

function repoPath(owner, repo) {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

function candidateRepoName(baseName, attempt) {
  return attempt === 1 ? baseName : `${baseName}-${attempt}`;
}

async function repoExists(owner, repo) {
  try {
    await github(repoPath(owner, repo));
    return true;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return false;
    }
    throw error;
  }
}

async function main() {
  let actorLogin = process.env.GITHUB_ACTOR || "unknown";
  if (actorLogin === "unknown") {
    try {
      actorLogin = (await github("/user")).login;
    } catch {
      actorLogin = "unknown";
    }
  }

  const template = await github(repoPath(config.templateOwner, config.templateRepo));

  if (!template.is_template) {
    throw new Error(`${template.full_name} is not marked as a GitHub template repository.`);
  }

  if (config.dryRun) {
    const exists = await repoExists(config.destinationOwner, config.newRepoName);
    const result = {
      status: "dry_run",
      actor: actorLogin,
      full_name: `${config.destinationOwner}/${config.newRepoName}`,
      html_url: `https://github.com/${config.destinationOwner}/${config.newRepoName}`,
      private: config.private,
      template: template.full_name,
      name_available: !exists,
    };
    outputGitHubActionValues(result);
    writeSummary(result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  let repo;
  let selectedName = config.newRepoName;
  let lastConflict;

  for (let attempt = 1; attempt <= config.maxNameAttempts; attempt += 1) {
    selectedName = candidateRepoName(config.newRepoName, attempt);

    const requestBody = {
      owner: config.destinationOwner,
      name: selectedName,
      description: config.description,
      include_all_branches: config.includeAllBranches,
      private: config.private,
    };

    try {
      repo = await github(`${repoPath(config.templateOwner, config.templateRepo)}/generate`, {
        method: "POST",
        body: requestBody,
        okStatuses: [201, 202],
      });
      break;
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 422) {
        throw error;
      }

      const exists = await repoExists(config.destinationOwner, selectedName);
      if (!exists) {
        throw error;
      }

      lastConflict = selectedName;
    }
  }

  if (!repo) {
    throw new Error(
      `Could not find an available repository name after ${config.maxNameAttempts} attempts. Last conflict: ${lastConflict}`,
    );
  }

  const result = {
    status: "created",
    actor: actorLogin,
    full_name: repo.full_name,
    html_url: repo.html_url,
    clone_url: repo.clone_url,
    ssh_url: repo.ssh_url,
    private: repo.private,
    template: template.full_name,
    requested_name: config.newRepoName,
    selected_name: selectedName,
  };

  outputGitHubActionValues(result);
  writeSummary(result);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  if (error instanceof HttpError && error.body?.errors) {
    for (const detail of error.body.errors) {
      console.error(`- ${detail.message || JSON.stringify(detail)}`);
    }
  }
  process.exit(1);
});
