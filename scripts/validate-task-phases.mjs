#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validPhases = new Set(["foundation", "core", "polish", "release", "ops"]);
const defaultFactoryFoundationSurfaces = [
  "navigation_shell",
  "onboarding",
  "home",
  "first_value_entry",
  "upgrade_or_paywall_shell",
];

const args = process.argv.slice(2);
const options = {
  tasksPaths: [],
  strict: false,
  factoryIos: false,
  json: false,
};

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--tasks") {
    const value = args[index + 1];
    if (!value) throw new Error("--tasks requires a path");
    options.tasksPaths.push(value);
    index += 1;
  } else if (arg === "--strict") {
    options.strict = true;
  } else if (arg === "--factory-ios") {
    options.factoryIos = true;
  } else if (arg === "--json") {
    options.json = true;
  } else if (arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(0);
  } else {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

function printHelp() {
  console.log(`Usage: node scripts/validate-task-phases.mjs [options]

Options:
  --tasks <path>   Validate one tasks.json file. Can be repeated.
  --strict         Require phasePlan and phase on every task.
  --factory-ios    Enforce iOS app factory foundation and polish gates.
  --json           Print machine-readable JSON.
`);
}

function toRepoRel(absPath) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

function resolveInputPath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(repoRoot, inputPath);
}

function walkFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  return fs.readdirSync(rootDir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) return walkFiles(entryPath);
    if (entry.isFile()) return [entryPath];
    return [];
  });
}

function findTaskFiles() {
  if (options.tasksPaths.length > 0) {
    return options.tasksPaths.map(resolveInputPath);
  }

  return walkFiles(path.join(repoRoot, "docs"))
    .filter((filePath) => path.basename(filePath) === "tasks.json")
    .sort();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function taskSearchText(task) {
  return [
    task.id,
    task.title,
    task.description,
    task.notes,
    ...asArray(task.acceptanceCriteria),
    ...asArray(task.validation?.commands),
    ...asArray(task.validation?.miniScenarios),
    ...asArray(task.validation?.scenarios),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function surfacePattern(surfaceName) {
  const normalized = surfaceName.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  const patterns = {
    navigation_shell: /\b(navigation|routing|tab|shell)\b/,
    onboarding: /\b(onboarding|first[-_\s]?launch|first[-_\s]?run)\b/,
    home: /\b(home|main|dashboard)\b/,
    first_value_entry: /\b(first[-_\s]?value|core loop|primary action|first action|entry point)\b/,
    upgrade_or_paywall_shell: /\b(paywall|upgrade|subscription|monetization|purchase shell)\b/,
  };

  if (patterns[normalized]) return patterns[normalized];

  const words = normalized.split("_").filter(Boolean);
  return new RegExp(words.map(escapeRegExp).join(".*"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPhaseOrder(phasePlan) {
  if (!Array.isArray(phasePlan?.order)) return [];

  return phasePlan.order.filter((phase) => validPhases.has(phase));
}

function validateTaskFile(filePath) {
  const relPath = toRepoRel(filePath);
  const result = {
    file: relPath,
    errors: [],
    warnings: [],
  };

  if (!fs.existsSync(filePath)) {
    result.errors.push("tasks file does not exist");
    return result;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    result.errors.push(`invalid JSON: ${error.message}`);
    return result;
  }

  const tasks = parsed.tasks;
  if (!Array.isArray(tasks)) {
    result.errors.push("missing top-level tasks array");
    return result;
  }

  const hasPhasePlan = Boolean(parsed.phasePlan);
  const enforcePhaseContract = options.strict || options.factoryIos || hasPhasePlan;

  if (!hasPhasePlan) {
    const message = "missing phasePlan; legacy task file skipped unless --strict or --factory-ios is used";
    if (enforcePhaseContract) result.errors.push(message);
    else result.warnings.push(message);
  }

  if (!enforcePhaseContract) return result;

  const phaseOrder = getPhaseOrder(parsed.phasePlan);
  if (hasPhasePlan && phaseOrder.length === 0) {
    result.errors.push("phasePlan.order must include at least one valid phase");
  }

  if (options.factoryIos) {
    for (const requiredPhase of ["foundation", "core", "polish"]) {
      if (!phaseOrder.includes(requiredPhase)) {
        result.errors.push(`phasePlan.order must include ${requiredPhase} for --factory-ios`);
      }
    }
  }

  const tasksByPhase = new Map();
  let lastOrderedPhaseRank = -1;

  tasks.forEach((task, taskIndex) => {
    const taskLabel = task.id ? `${task.id}` : `task at index ${taskIndex}`;
    const phase = task.phase;

    if (!phase) {
      result.errors.push(`${taskLabel}: missing phase`);
      return;
    }

    if (!validPhases.has(phase)) {
      result.errors.push(`${taskLabel}: invalid phase '${phase}'`);
      return;
    }

    if (!tasksByPhase.has(phase)) tasksByPhase.set(phase, []);
    tasksByPhase.get(phase).push(task);

    const phaseRank = phaseOrder.indexOf(phase);
    if (phaseRank === -1) return;

    if (phaseRank < lastOrderedPhaseRank) {
      result.errors.push(`${taskLabel}: phase '${phase}' appears after a later phase in phasePlan.order`);
    } else {
      lastOrderedPhaseRank = phaseRank;
    }
  });

  const foundationGate = parsed.phasePlan?.foundationGate;
  const requiresFoundationGate =
    options.factoryIos || foundationGate?.requiredForUserFacingApps === true;

  if (requiresFoundationGate) {
    const foundationTasks = asArray(tasksByPhase.get("foundation"));
    if (foundationTasks.length === 0) {
      result.errors.push("foundation gate requires at least one foundation task");
    } else {
      const foundationText = foundationTasks.map(taskSearchText).join(" ");
      const requiredSurfaces = asArray(foundationGate?.requiredSurfaces);
      const surfaces = requiredSurfaces.length > 0
        ? requiredSurfaces
        : defaultFactoryFoundationSurfaces;

      for (const surface of surfaces) {
        if (!surfacePattern(surface).test(foundationText)) {
          result.errors.push(`foundation gate is missing surface coverage for ${surface}`);
        }
      }
    }
  }

  const polishGate = parsed.phasePlan?.polishReadyGate;
  const requiresPolishGate =
    options.factoryIos || polishGate?.requiredForUserFacingApps === true;

  if (requiresPolishGate) {
    const polishTasks = asArray(tasksByPhase.get("polish"));
    if (polishTasks.length === 0) {
      result.errors.push("polish-ready gate requires at least one polish task");
    } else {
      const polishText = polishTasks.map(taskSearchText).join(" ");
      if (!/\bsurface[-_\s]?map\b/.test(polishText)) {
        result.errors.push("polish-ready gate requires a polish task that creates or updates surface-map.json");
      }
    }
  }

  return result;
}

const taskFiles = findTaskFiles();
const results = taskFiles.map(validateTaskFile);
const errors = results.flatMap((result) => result.errors.map((message) => `${result.file}: ${message}`));
const warnings = results.flatMap((result) => result.warnings.map((message) => `${result.file}: ${message}`));

if (options.json) {
  console.log(JSON.stringify({ taskFiles: taskFiles.map(toRepoRel), errors, warnings }, null, 2));
} else {
  if (errors.length === 0) {
    console.log(`Task phase validation passed for ${taskFiles.length} file(s).`);
  }

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of warnings) console.log(`- ${warning}`);
  }

  if (errors.length > 0) {
    console.error("Task phase validation failed:");
    for (const error of errors) console.error(`- ${error}`);
  }
}

process.exit(errors.length > 0 ? 1 : 0);
