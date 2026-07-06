#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function readArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : "true";
    args[key] = value;
  }
  return args;
}

function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
}

function assertIncludes(text, patterns, label, failures) {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    if (!lower.includes(pattern)) failures.push(`${label} missing "${pattern}"`);
  }
}

function requiredFiles(mode, prototypeId) {
  switch (mode) {
    case "full-production":
      return [
        `${prototypeId}-full-production-pass.md`,
        `${prototypeId}-reference-benchmark.md`,
        `${prototypeId}-quality-scorecard.md`,
        `${prototypeId}-quality-scorecard.json`,
        `${prototypeId}-visual-novelty-audit.md`
      ];
    case "design":
      return [`${prototypeId}-design-pass.md`, `${prototypeId}-reference-benchmark.md`];
    case "level":
      return [`${prototypeId}-level-plan.md`];
    case "quality":
      return [`${prototypeId}-quality-scorecard.md`, `${prototypeId}-quality-scorecard.json`, `${prototypeId}-reference-benchmark.md`];
    case "novelty":
      return [`${prototypeId}-visual-novelty-audit.md`];
    default:
      throw new Error(`Unsupported --mode "${mode}"`);
  }
}

const args = readArgs(process.argv);
const docsDir = args.docs;
const prototypeId = args["prototype-id"];
const mode = args.mode || "full-production";

if (!docsDir || !prototypeId) {
  console.error("Usage: game-production-artifact-gate.mjs --docs <docs-dir> --prototype-id <id> [--mode full-production|design|level|quality|novelty]");
  process.exit(2);
}

const failures = [];
const files = requiredFiles(mode, prototypeId);

for (const file of files) {
  const filePath = path.join(docsDir, file);
  if (!fs.existsSync(filePath)) failures.push(`missing required artifact: ${filePath}`);
}

if (mode === "full-production") {
  const handoffPath = path.join(docsDir, `${prototypeId}-full-production-pass.md`);
  const handoff = readFile(handoffPath);
  if (handoff) {
    assertIncludes(
      handoff,
      ["core loop", "level", "iteration", "scorecard", "novelty", "validation", "screenshot", "reference", "next"],
      `${prototypeId}-full-production-pass.md`,
      failures
    );
    if (!handoff.match(/\b20\b/)) failures.push(`${prototypeId}-full-production-pass.md does not mention 20-level/challenge evidence`);
  }
}

if (["full-production", "design", "quality"].includes(mode)) {
  const benchmarkPath = path.join(docsDir, `${prototypeId}-reference-benchmark.md`);
  const benchmark = readFile(benchmarkPath);
  if (benchmark) {
    assertIncludes(
      benchmark,
      ["public references", "in-repo comparisons", "prototype screenshot", "reference-fit", "status"],
      `${prototypeId}-reference-benchmark.md`,
      failures
    );
    const urlCount = benchmark.match(/https?:\/\//g)?.length || 0;
    if (urlCount < 3) {
      failures.push(`${prototypeId}-reference-benchmark.md must include at least three public source URLs`);
    }
    if (/\bTODO\b/i.test(benchmark)) {
      failures.push(`${prototypeId}-reference-benchmark.md still contains TODO placeholders`);
    }
    if (/Status:\s*(BLOCKED|REMEDIATE)/i.test(benchmark)) {
      failures.push(`${prototypeId}-reference-benchmark.md status is not PASS`);
    }
  }
}

for (const file of files.filter((item) => item.endsWith(".json"))) {
  const filePath = path.join(docsDir, file);
  const json = readFile(filePath);
  if (!json) continue;
  try {
    const parsed = JSON.parse(json);
    const scores = Array.isArray(parsed.prototypeScores) ? parsed.prototypeScores : [];
    if (scores.length === 0) failures.push(`${file} has no prototypeScores entries`);
    for (const score of scores) {
      if (typeof score.total !== "number") failures.push(`${file} score entry missing numeric total`);
      if (!Array.isArray(score.criticalFails)) failures.push(`${file} score entry missing criticalFails array`);
      if (score.total > 82 && score.criticalFails.length > 0) {
        failures.push(`${file} has critical fails but total score is above 82`);
      }
      if (score.total > 72) {
        const referenceEvidence = score.evidence && score.evidence.referenceBenchmark;
        if (!Array.isArray(referenceEvidence) || referenceEvidence.length === 0) {
          failures.push(`${file} score above 72 missing evidence.referenceBenchmark`);
        }
      }
    }
  } catch (error) {
    failures.push(`${file} is not valid JSON: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error("Game production artifact gate failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Game production artifact gate passed for ${prototypeId} (${mode}).`);
