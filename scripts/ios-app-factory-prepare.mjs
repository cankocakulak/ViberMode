#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { githubApiFetch, githubGitConfigEnv } from "./github-network.mjs";
import {
  boolValue,
  loadBacklog,
  markPrepared,
  parseArgs,
  resolveBacklogPath,
  saveBacklog,
  selectIdea,
} from "./idea-backlog.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(scriptPath);
const defaultWorkspaceRoot = path.join(os.homedir(), "ViberModeWorkspaces");

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sanitizeOutput(output) {
  return String(output || "").replace(/https:\/\/[^/@\s]+@github\.com/g, "https://<redacted>@github.com");
}

function gitAuthEnv(repoUrl = "https://github.com") {
  return githubGitConfigEnv({ token: process.env.GH_TOKEN, repoUrl });
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
        message: `Record app factory run ${runId}: ${relativePath}`,
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

function commitState(stateRoot, runId) {
  run("git", ["add", "ideas/backlog.json", "factory/runs"], { cwd: stateRoot });
  const status = run("git", ["status", "--porcelain"], { cwd: stateRoot }).stdout;
  if (!status) {
    return { status: "no_changes" };
  }

  run("git", ["commit", "-m", `Record app factory run ${runId}`], { cwd: stateRoot });
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

function output(result, outputFile) {
  const text = `${JSON.stringify(result, null, 2)}\n`;
  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, text);
  }
  process.stdout.write(text);
}

function printUsage() {
  process.stdout.write(`Usage:
  GH_TOKEN=... node scripts/ios-app-factory-prepare.mjs \\
    --state-root <private-state-repo> \\
    --workspace-root <vibermode-workspaces-dir> \\
    --template-owner KantAkademi2 \\
    --template-repo ios-boilerplate \\
    --destination-owner ViberBoyz \\
    [--ai-services-path <shared-ai-services-repo>] \\
    [--commit-state] [--state-sync api|git|none]

Purpose:
  Select the top ready idea from the private backlog, create a private iOS repo
  from the template, clone it locally, and write a run manifest for Stage 3.

State sync:
  --commit-state defaults to --state-sync api, which updates ViberBoyz/app-factory-state
  through the GitHub Contents API instead of relying on git credentials.

Workspace:
  --workspace-root defaults to ~/ViberModeWorkspaces.
  New runs use generated-products/<repo-name>/ios-app as the primary repo path.
`);
}

function resolveFactoryWorkspace(selection, args, workspaceRoot) {
  const generatedProductsRoot = path.resolve(
    args["generated-products-root"] ||
      process.env.VIBERMODE_GENERATED_PRODUCTS_ROOT ||
      path.join(workspaceRoot, "generated-products"),
  );
  const legacyWorkspaceParent = args["workspace-parent"] || process.env.WORKSPACE_PARENT;
  const useBundleLayout = Boolean(
    args["workspace-root"] ||
      process.env.VIBERMODE_WORKSPACE_ROOT ||
      args["generated-products-root"] ||
      process.env.VIBERMODE_GENERATED_PRODUCTS_ROOT ||
      !legacyWorkspaceParent,
  );

  if (useBundleLayout) {
    const bundleRoot = path.join(generatedProductsRoot, selection.repo_name);
    return {
      layout: "bundle",
      workspace_root: workspaceRoot,
      generated_products_root: generatedProductsRoot,
      bundle_root: bundleRoot,
      ios_workspace_path: path.join(bundleRoot, "ios-app"),
    };
  }

  const workspaceParent = path.resolve(legacyWorkspaceParent);
  const workspacePath = path.join(workspaceParent, selection.repo_name);
  return {
    layout: "legacy-flat",
    workspace_root: null,
    generated_products_root: null,
    legacy_workspace_parent: workspaceParent,
    bundle_root: workspacePath,
    ios_workspace_path: workspacePath,
  };
}

function aiServicesPath(args) {
  const value = args["ai-services-path"] || process.env.VIBERMODE_AI_SERVICES_PATH || process.env.AI_SERVICES_PATH;
  return value ? path.resolve(value) : null;
}

function materializeAiServicesLink(factoryWorkspace, args, { dryRun = false } = {}) {
  const sourcePath = aiServicesPath(args);
  if (!sourcePath) return null;

  const linkPath = path.join(factoryWorkspace.bundle_root, "ai-services");
  const entry = {
    role: "ai-services",
    workspace_path: linkPath,
    source_path: sourcePath,
    link_type: "symlink",
    required: false,
  };

  if (factoryWorkspace.layout !== "bundle") {
    return {
      ...entry,
      status: "skipped_legacy_flat_layout",
      note: "ai-services symlinks are only materialized next to bundle-layout repos, not inside a generated app repo.",
    };
  }

  if (dryRun) {
    return {
      ...entry,
      status: "would_link",
    };
  }

  if (!fs.existsSync(sourcePath)) {
    return {
      ...entry,
      status: "target_missing",
    };
  }

  fs.mkdirSync(factoryWorkspace.bundle_root, { recursive: true });

  if (fs.existsSync(linkPath)) {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      const existingTarget = path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath));
      return {
        ...entry,
        status: existingTarget === sourcePath ? "reused" : "conflict",
        existing_target: existingTarget,
      };
    }

    return {
      ...entry,
      status: "conflict",
      note: "A non-symlink path already exists at the ai-services link location.",
    };
  }

  fs.symlinkSync(sourcePath, linkPath, "dir");
  return {
    ...entry,
    status: "created",
  };
}

function buildWorkspaceBundle({ factoryWorkspace, selection, repoUrl, workspaceResult, aiServicesEntry }) {
  const iosRepo = {
    role: "ios-app",
    workspace_path: workspaceResult?.workspace_path || factoryWorkspace.ios_workspace_path,
    repo_url: workspaceResult?.repo_url || repoUrl,
    platform: selection.platform || "ios",
    stack: selection.stack || "SwiftUI",
    required: true,
  };

  if (workspaceResult?.branch) iosRepo.branch = workspaceResult.branch;
  if (workspaceResult?.head_sha) iosRepo.head_sha = workspaceResult.head_sha;

  return {
    schema_version: 1,
    root: factoryWorkspace.bundle_root,
    layout: factoryWorkspace.layout,
    workspace_root: factoryWorkspace.workspace_root,
    generated_products_root: factoryWorkspace.generated_products_root,
    primary_repo_role: "ios-app",
    repos: [
      iosRepo,
      ...(aiServicesEntry ? [aiServicesEntry] : []),
    ],
    future_repo_roles: [
      {
        role: "backend",
        creation: "on-demand",
        note: "Create from the backend template only when PRD/stories require an app-specific service.",
      },
      {
        role: "ai-services",
        creation: "symlink-or-existing-repo",
        note: "Prefer a symlink to the shared ai-services operations repo instead of copying it into the app repo.",
      },
    ],
  };
}

function buildFactoryContext(selection, args) {
  const platform = String(selection.platform || "").toLowerCase();
  if (!platform.includes("ios")) {
    return null;
  }

  const patternRepo = args["pattern-repo"] || process.env.IOS_FACTORY_PATTERN_REPO || "ViberBoyz/ios-factory-patterns";
  const patternRef = args["pattern-ref"] || process.env.IOS_FACTORY_PATTERN_REF || "main";
  const localPatternCatalog =
    args["local-pattern-catalog"] ||
    process.env.IOS_FACTORY_LOCAL_PATTERN_CATALOG ||
    "packs/vibermode/patterns/ios-factory/catalog.json";

  return {
    type: "ios_app_factory",
    distribution_target: "testflight",
    pattern_repo: {
      full_name: patternRepo,
      ref: patternRef,
      catalog_path: "catalog.json",
    },
    pattern_catalog: {
      local_path: localPatternCatalog,
      default_onboarding_pattern: "onboarding.focused-promise-steps",
      default_paywall_pattern: "paywall.benefit-stack-packages",
    },
    required_flows: [
      "onboarding",
      "first_value_moment",
      "upgrade_paywall_shell",
    ],
    stage3_requirements: {
      onboarding: {
        required: true,
        notes: "Create an app-specific first-launch flow with 2-4 screens and persistent completion state.",
      },
      first_value_moment: {
        required: true,
        notes: "The user must be able to reach the core value loop without making a purchase.",
      },
      paywall_shell: {
        required: true,
        purchase_integration: "mock_or_placeholder",
        notes: "Design and implement a visible upgrade/paywall shell. Real RevenueCat/StoreKit wiring is deferred unless explicitly requested.",
      },
    },
    stage3_quality_gate: {
      workflow: "packs/vibermode/workflows/experience-hardening.md",
      required_artifact: "docs/[project-name]/experience-review.md",
      min_onboarding_steps: 3,
      required_visual_evidence: {
        type: "screenshot_or_video_files",
        flows: [
          "onboarding",
          "first_value_moment",
          "core_loop",
          "upgrade_paywall_shell",
        ],
        note: "UI launch smoke is not visual evidence. Store screenshot or video file paths in the experience review and product_to_code_result.",
      },
      required_checks: [
        "onboarding_is_app_specific",
        "onboarding_has_at_least_3_steps",
        "onboarding_is_not_plain_list_or_form",
        "first_value_reachable_without_purchase",
        "paywall_shell_is_app_specific_and_honest",
        "paywall_shell_is_not_disabled_placeholder_list",
        "keyboard_dismissal_for_text_entry",
        "small_screen_layout_has_no_clipping_or_overlap",
        "screenshot_or_video_files_cover_key_flows",
      ],
    },
    pattern_sources: [
      {
        kind: "local_catalog",
        id: "ios-factory-local-pattern-catalog",
        path: localPatternCatalog,
        required: true,
      },
      {
        kind: "local_pattern",
        id: "onboarding.focused-promise-steps",
        path: "packs/vibermode/patterns/ios-factory/onboarding/focused-promise-steps.md",
        type: "onboarding",
      },
      {
        kind: "local_pattern",
        id: "paywall.benefit-stack-packages",
        path: "packs/vibermode/patterns/ios-factory/paywall/benefit-stack-packages.md",
        type: "paywall",
      },
      {
        kind: "private_repo_pattern",
        id: "swiftui-value-carousel-onboarding",
        repo: patternRepo,
        ref: patternRef,
        path: "patterns/onboarding/swiftui-value-carousel",
        required: false,
      },
      {
        kind: "private_repo_pattern",
        id: "onboarding-core-paywall-state-machine",
        repo: patternRepo,
        ref: patternRef,
        path: "patterns/app-routing/onboarding-core-paywall-state-machine",
        required: false,
      },
      {
        kind: "private_repo_pattern",
        id: "swiftui-upgrade-paywall-shell",
        repo: patternRepo,
        ref: patternRef,
        path: "patterns/paywall/swiftui-upgrade-shell",
        required: false,
      },
    ],
    implementation_notes: [
      "Use local and private pattern sources as copy-and-adapt source material, not as runtime dependencies.",
      "Keep generated app code self-contained after copying the relevant pattern files.",
      "Do not block TestFlight evaluation on real IAP. Keep paywall purchase actions honest when purchase infrastructure is not wired.",
      "After runtime validation, run the experience-hardening gate before final review.",
      "Do not mark Stage 3 complete without actual screenshot/video artifacts for onboarding, first value, core loop, and upgrade/paywall shell.",
    ],
  };
}

function buildAppAutopilotContext({ selection, workspaceResult, runManifestPath }) {
  const targetRepo = workspaceResult.workspace_path;
  const projectName = selection.repo_name;
  const artifactRoot = path.join(targetRepo, "docs", projectName);

  return {
    schema_version: 1,
    name: selection.app_name,
    aliases: [
      selection.app_name,
      selection.project_name,
      selection.repo_name,
      selection.idea_id,
      selection.run_id,
    ].filter(Boolean),
    platform: "ios",
    target_repo: targetRepo,
    project_name: projectName,
    artifact_root: artifactRoot,
    change_request_path: path.join(artifactRoot, "change-request.md"),
    run_manifest_path: runManifestPath,
    bundle_id: selection.bundle_id,
    default_release_target: "ios-testflight",
    submit_when_ready_default: false,
    forbid_dirty: [],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  const workspaceRoot = path.resolve(args["workspace-root"] || process.env.VIBERMODE_WORKSPACE_ROOT || defaultWorkspaceRoot);
  const stateRoot = path.resolve(
    args["state-root"] || process.env.APP_FACTORY_STATE_ROOT || path.join(workspaceRoot, "app-factory-state"),
  );
  const templateOwner = args["template-owner"] || process.env.TEMPLATE_OWNER || "KantAkademi2";
  const templateRepo = args["template-repo"] || process.env.TEMPLATE_REPO || "ios-boilerplate";
  const destinationOwner = args["destination-owner"] || process.env.DESTINATION_OWNER || "ViberBoyz";
  const dryRun = boolValue(args["dry-run"] ?? process.env.DRY_RUN, false);
  const commitStateChanges = boolValue(args["commit-state"] ?? process.env.COMMIT_STATE, false);
  const stateSync = args["state-sync"] || process.env.STATE_SYNC || (commitStateChanges ? "api" : "none");
  const stateRepo = args["state-repo"] || process.env.APP_FACTORY_STATE_REPO || "ViberBoyz/app-factory-state";
  const backlogPath = resolveBacklogPath({ ...args, "state-root": stateRoot });
  const backlog = loadBacklog(backlogPath);

  const selection = selectIdea(backlog, {
    statuses: String(args.statuses || "ready").split(","),
    reserve: !dryRun,
    date: args.date,
    timeZone: args["time-zone"] || "Europe/Istanbul",
    repoPrefix: args["repo-prefix"] ?? "ios",
    runId: args["run-id"],
  });

  if (selection.status === "empty") {
    output(selection, args.output);
    process.exitCode = 2;
    return;
  }

  const factoryWorkspace = resolveFactoryWorkspace(selection, args, workspaceRoot);
  const previewRepoUrl = `https://github.com/${destinationOwner}/${selection.repo_name}.git`;

  if (dryRun) {
    const aiServicesEntry = materializeAiServicesLink(factoryWorkspace, args, { dryRun: true });
    output(
      {
        status: "dry_run",
        selection,
        product_to_code_input_preview: {
          project_name: selection.repo_name,
          workspace_path: factoryWorkspace.ios_workspace_path,
          repo_url: previewRepoUrl,
          product_idea: selection.product_idea,
          launch_appeal: selection.launch_appeal || null,
          repo_mode: "greenfield",
          platform: selection.platform,
          stack: selection.stack,
          workspace_bundle: buildWorkspaceBundle({
            factoryWorkspace,
            selection,
            repoUrl: previewRepoUrl,
            workspaceResult: null,
            aiServicesEntry,
          }),
          factory_context: buildFactoryContext(selection, args),
        },
        next_action: "Run without --dry-run to create the template repo and clone the workspace.",
      },
      args.output,
    );
    return;
  }

  requireValue("GH_TOKEN", process.env.GH_TOKEN);
  saveBacklog(backlogPath, backlog);

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
      selection.repo_name,
      "--private",
      "--description",
      `Generated from ${templateOwner}/${templateRepo} for ${selection.app_name}`,
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
      ...(factoryWorkspace.layout === "bundle"
        ? ["--workspace-path", factoryWorkspace.ios_workspace_path]
        : ["--workspace-parent", factoryWorkspace.legacy_workspace_parent]),
      "--project-name",
      repoResult.selected_name,
      "--allow-existing",
      "false",
    ],
    { cwd: path.resolve(scriptsDir, "..") },
  );
  const workspaceResult = parseJsonOutput(workspaceProcess.stdout, "acquire-workspace");
  const aiServicesEntry = materializeAiServicesLink(factoryWorkspace, args);
  const workspaceBundle = buildWorkspaceBundle({
    factoryWorkspace,
    selection,
    repoUrl: repoResult.clone_url,
    workspaceResult,
    aiServicesEntry,
  });

  markPrepared(backlog, selection, repoResult, workspaceResult);
  saveBacklog(backlogPath, backlog);

  const runManifestPath = path.join(stateRoot, "factory", "runs", `${selection.run_id}.json`);
  const runManifest = {
    schema_version: 1,
    run_id: selection.run_id,
    status: "prepared",
    prepared_at: new Date().toISOString(),
    idea_id: selection.idea_id,
    selection: {
      project_name: selection.project_name,
      repo_name: selection.repo_name,
      app_name: selection.app_name,
      bundle_id: selection.bundle_id,
      platform: selection.platform,
      stack: selection.stack,
      product_idea: selection.product_idea,
      launch_appeal: selection.launch_appeal || null,
    },
    repository: repoResult,
    workspace: workspaceResult,
    workspace_bundle: workspaceBundle,
    app_autopilot: buildAppAutopilotContext({
      selection,
      workspaceResult,
      runManifestPath,
    }),
    product_to_code_input: {
      project_name: repoResult.selected_name,
      workspace_path: workspaceResult.workspace_path,
      repo_url: repoResult.clone_url,
      product_idea: selection.product_idea,
      launch_appeal: selection.launch_appeal || null,
      repo_mode: "greenfield",
      platform: selection.platform,
      stack: selection.stack,
      workspace_bundle: workspaceBundle,
      factory_context: buildFactoryContext(selection, args),
    },
    next_action:
      "Run ViberMode product-to-code using product_to_code_input, then update this run manifest with validation and commit details.",
  };

  writeJson(runManifestPath, runManifest);

  let stateCommit = { status: "not_requested" };
  if (stateSync === "git") {
    stateCommit = commitState(stateRoot, selection.run_id);
  } else if (stateSync === "api") {
    stateCommit = await syncStateWithGitHubApi(stateRoot, stateRepo, [
      path.relative(stateRoot, backlogPath),
      path.relative(stateRoot, runManifestPath),
    ], selection.run_id);
  } else if (stateSync !== "none") {
    throw new Error(`Invalid --state-sync value: ${stateSync}. Use api, git, or none.`);
  }

  output(
    {
      status: "prepared",
      run_id: selection.run_id,
      idea_id: selection.idea_id,
      app_name: selection.app_name,
      repo_url: repoResult.html_url,
      clone_url: repoResult.clone_url,
      workspace_path: workspaceResult.workspace_path,
      workspace_bundle_root: workspaceBundle.root,
      run_manifest_path: runManifestPath,
      state_commit: stateCommit,
      next_action: runManifest.next_action,
    },
    args.output,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
