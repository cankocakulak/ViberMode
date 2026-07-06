#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function slugToTitle(slug) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function escapeCell(value) {
  return String(value || "")
    .replace(/\|/g, "\\|")
    .replace(/\n+/g, " ")
    .trim();
}

function formatLinks(urls) {
  return urls.map((url, index) => `[${index + 1}](${url})`).join(" ");
}

function referenceRow(reference) {
  return [
    reference.name,
    formatLinks(reference.sourceUrls),
    reference.signals.join("; "),
    reference.coreVerb,
    reference.firstTenSeconds,
    reference.pressure,
    reference.visualHook,
    reference.feedbackHook,
    reference.doNotCopy
  ].map(escapeCell).join(" | ");
}

function readSeeds(seedPath) {
  const raw = fs.readFileSync(seedPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.references)) {
    throw new Error(`Invalid seed file: ${seedPath}`);
  }
  return parsed;
}

function writeBenchmark({ docsDir, prototypeId, prototypeName, workflow, screenshot, seedPath, force }) {
  const seeds = readSeeds(seedPath);
  fs.mkdirSync(docsDir, { recursive: true });

  const outPath = path.join(docsDir, `${prototypeId}-reference-benchmark.md`);
  if (fs.existsSync(outPath) && !force) {
    throw new Error(`${outPath} already exists. Pass --force true to overwrite.`);
  }

  const title = prototypeName || slugToTitle(prototypeId);
  const screenshotLine = screenshot ? `- ${screenshot}` : "- TODO: capture simulator screenshot and add path";

  const markdown = `# ${title} Reference Benchmark

Date: ${new Date().toISOString().slice(0, 10)}
Prototype: \`${prototypeId}\`
Workflow: ${workflow}
Seed catalog: \`${path.relative(process.cwd(), seedPath)}\`

## Public References

| Reference | Source | Signal | Core Verb | First 10 Seconds | Pressure | Visual Hook | Feedback Hook | Do Not Copy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${seeds.references.map((reference) => `| ${referenceRow(reference)} |`).join("\n")}

## In-Repo Comparisons

| Prototype | Screenshot/Doc | Repeated Risk | What Must Differ |
| --- | --- | --- | --- |
| TODO | TODO | TODO | TODO |
| TODO | TODO | TODO | TODO |

## Prototype Screenshot Read

- screenshot(s) inspected:
${screenshotLine}
- what is tappable in 3 seconds: TODO
- what the player understands in 10 seconds: TODO
- title-removed identity: TODO
- cheap/generic red flags: TODO

## Reference-Fit Score

| Dimension | Score | Evidence |
| --- | ---: | --- |
| First-screen commercial read | 0 | TODO |
| Core verb legibility | 0 | TODO |
| Signature object/silhouette | 0 | TODO |
| Material and polish | 0 | TODO |
| UI chrome restraint | 0 | TODO |
| Feedback spectacle | 0 | TODO |
| Pressure readability | 0 | TODO |
| Progression promise | 0 | TODO |
| Store-screenshot power | 0 | TODO |
| Distinctness without cloning | 0 | TODO |

Average: 0
Status: BLOCKED

## Required Changes Before Acceptance

- TODO: replace seed-only benchmark with current research and final screenshot comparison.
- TODO: mark PASS only when the final reference-fit average is at least 6.0 and cheap/generic red flags are resolved or routed.
`;

  fs.writeFileSync(outPath, markdown);
  return outPath;
}

const args = readArgs(process.argv);
const docsDir = args.docs;
const prototypeId = args["prototype-id"];
const prototypeName = args["prototype-name"];
const workflow = args.workflow || "manual";
const screenshot = args.screenshot;
const force = args.force === "true";

const currentFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(currentFile);
const defaultSeedPath = path.resolve(scriptDir, "../patterns/game-public-reference-seeds.json");
const seedPath = args.seeds ? path.resolve(args.seeds) : defaultSeedPath;

if (!docsDir || !prototypeId) {
  console.error("Usage: game-reference-benchmark-seed.mjs --docs <docs-dir> --prototype-id <id> [--prototype-name <name>] [--workflow <name>] [--screenshot <path>] [--force true]");
  process.exit(2);
}

try {
  const outPath = writeBenchmark({
    docsDir,
    prototypeId,
    prototypeName,
    workflow,
    screenshot,
    seedPath,
    force
  });
  console.log(`Wrote reference benchmark seed: ${outPath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
