#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const yamlPath = path.join(repoRoot, "docs/reference/agent-surface-map.yaml");
const agentsPath = path.join(repoRoot, "AGENTS.md");
const codexInstallScriptPath = path.join(repoRoot, "adapters/codex/install/install-skills.sh");

const yaml = fs.readFileSync(yamlPath, "utf8");
const agentsText = fs.readFileSync(agentsPath, "utf8");
const codexInstallScript = fs.readFileSync(codexInstallScriptPath, "utf8");

const errors = [];
const warnings = [];

function toFsPath(relPath) {
  return path.join(repoRoot, relPath);
}

function parseCapabilities(text) {
  const lines = text.split(/\r?\n/);
  const capabilities = [];
  let current = null;
  let inSurfaces = false;

  for (const line of lines) {
    const topId = line.match(/^  - id: (.+)$/);
    if (topId) {
      if (current) capabilities.push(current);
      current = {
        id: topId[1].trim(),
        surfaces: {},
      };
      inSurfaces = false;
      continue;
    }

    if (!current) continue;

    if (/^    surfaces:\s*$/.test(line)) {
      inSurfaces = true;
      continue;
    }

    const topField = line.match(/^    ([a-z_]+): (.+)$/);
    if (topField && !inSurfaces) {
      current[topField[1]] = topField[2].trim();
      continue;
    }

    const surfaceField = line.match(/^      ([a-z_]+): (.+)$/);
    if (surfaceField && inSurfaces) {
      current.surfaces[surfaceField[1]] = surfaceField[2].trim();
      continue;
    }

    if (/^    [a-z_]+:\s*$/.test(line) && !/^    surfaces:\s*$/.test(line)) {
      inSurfaces = false;
    }
  }

  if (current) capabilities.push(current);
  return capabilities;
}

function unquote(value) {
  if (!value) return value;
  if (value === "null") return null;
  return value.replace(/^["']|["']$/g, "");
}

const capabilities = parseCapabilities(yaml);

if (capabilities.length === 0) {
  errors.push(`No capabilities parsed from ${path.relative(repoRoot, yamlPath)}`);
}

const validTiers = new Set(["primary", "support", "legacy"]);
const validKinds = new Set(["product-agent", "iterate-agent", "workflow", "legacy-alias"]);

for (const capability of capabilities) {
  const { id, kind, tier, surfaces } = capability;
  const cleanKind = unquote(kind);
  const cleanTier = unquote(tier);

  if (!validKinds.has(cleanKind)) {
    errors.push(`${id}: invalid kind '${cleanKind ?? "missing"}'`);
  }

  if (!validTiers.has(cleanTier)) {
    errors.push(`${id}: invalid tier '${cleanTier ?? "missing"}'`);
  }

  const canonicalRole = unquote(surfaces.canonical_role);
  const canonicalWorkflow = unquote(surfaces.canonical_workflow);
  const codexSkill = unquote(surfaces.codex_skill);
  const cursorCommand = unquote(surfaces.cursor_command);
  const anyToolAgent = unquote(surfaces.any_tool_agent);

  if (canonicalRole && !fs.existsSync(toFsPath(canonicalRole))) {
    errors.push(`${id}: missing canonical role ${canonicalRole}`);
  }

  if (canonicalWorkflow && !fs.existsSync(toFsPath(canonicalWorkflow))) {
    errors.push(`${id}: missing canonical workflow ${canonicalWorkflow}`);
  }

  if (!canonicalRole && !canonicalWorkflow) {
    warnings.push(`${id}: no canonical role/workflow path declared`);
  }

  if (codexSkill) {
    const skillDir = codexSkill.replace(/^viber-/, "");
    const skillPath = path.join(repoRoot, "adapters/codex/skills", skillDir, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      errors.push(`${id}: missing Codex skill wrapper for ${codexSkill}`);
    } else {
      const skillText = fs.readFileSync(skillPath, "utf8");
      if (
        skillText.includes("Read and follow the full") &&
        !skillText.includes("../viber-mode/packs/vibermode/")
      ) {
        errors.push(`${id}: Codex skill wrapper should reference ../viber-mode/packs/vibermode/...`);
      }
    }
  }

  if (cursorCommand) {
    const commandFile = cursorCommand.replace(/^\//, "") + ".md";
    const commandPath = path.join(repoRoot, "adapters/cursor/commands", commandFile);
    if (!fs.existsSync(commandPath)) {
      errors.push(`${id}: missing Cursor command wrapper for ${cursorCommand}`);
    }
  }

  if (anyToolAgent && !agentsText.includes(`**${anyToolAgent}**`)) {
    warnings.push(`${id}: AGENTS.md may be missing explicit agent listing for ${anyToolAgent}`);
  }

  if (cleanTier === "legacy" && cleanKind !== "legacy-alias") {
    warnings.push(`${id}: legacy tier usually pairs with legacy-alias kind`);
  }
}

if (!codexInstallScript.includes('SUPPORT_BUNDLE="$CODEX_SKILLS/viber-mode"')) {
  errors.push("Codex install script is missing the shared viber-mode support bundle");
}

if (warnings.length > 0) {
  console.log("Warnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
  console.log("");
}

if (errors.length > 0) {
  console.error("Reference map validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Reference map validation passed for ${capabilities.length} capabilities.`);
