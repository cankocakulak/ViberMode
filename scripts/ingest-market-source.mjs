#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

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

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, rows.length > 0 ? `${rows.map((row) => JSON.stringify(row)).join("\n")}\n` : "");
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function decodeText(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return stripBom(buffer.toString("utf16le"));
  }

  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer);
    swapped.swap16();
    return stripBom(swapped.toString("utf16le"));
  }

  return stripBom(buffer.toString("utf8"));
}

function sniffDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiters = ["\t", ",", ";"];
  return delimiters
    .map((delimiter) => ({
      delimiter,
      count: firstLine.split(delimiter).length - 1,
    }))
    .sort((left, right) => right.count - left.count)[0].delimiter;
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[%$]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const FIELD_ALIASES = {
  signal_type: ["signal type", "signal_type", "type", "kind"],
  app_name: ["app name", "app", "unified name", "title", "name", "track name"],
  app_id: ["app id", "apple id", "unified id", "track id", "store id"],
  publisher: ["publisher", "publisher name", "unified publisher name", "developer", "seller", "seller name", "artist name"],
  bundle_id: ["bundle id", "bundle", "package", "package name"],
  category: ["category", "primary genre", "genre", "primary genre name"],
  platform: ["platform", "store", "device"],
  market: ["market", "country", "storefront", "geo", "locale"],
  cluster: ["cluster", "segment", "topic", "vertical"],
  keyword: ["keyword", "search term", "term", "query", "keyphrase"],
  rank: ["rank", "position", "ranking", "app rank", "keyword rank"],
  rank_change: ["rank change", "position change", "change", "rank delta"],
  search_volume: ["search volume", "volume", "traffic", "popularity", "search popularity"],
  difficulty: ["difficulty", "competition", "keyword difficulty", "organic difficulty"],
  downloads: ["downloads", "downloads absolute", "download count", "installs", "estimated downloads"],
  download_growth: ["download growth", "downloads pop growth", "downloads growth", "download delta"],
  download_growth_pct: ["download growth pct", "downloads pop growth pct", "downloads growth pct"],
  revenue: ["revenue", "revenue absolute", "estimated revenue", "iap revenue", "consumer spend"],
  revenue_growth: ["revenue growth", "revenue pop growth", "revenue delta"],
  revenue_growth_pct: ["revenue growth pct", "revenue pop growth pct"],
  dau: ["dau", "daily active users", "active users"],
  rating: ["rating", "average rating", "average user rating", "score"],
  rating_count: ["rating count", "ratings", "reviews", "review count", "user rating count"],
  price: ["price", "formatted price"],
  url: ["url", "app url", "store url", "source url", "link"],
  note: ["note", "notes", "summary", "observation", "insight", "pain", "complaint", "review theme"],
  evidence: ["evidence", "evidence detail", "source detail"],
};

const NUMERIC_FIELDS = new Set([
  "rank",
  "rank_change",
  "search_volume",
  "difficulty",
  "downloads",
  "download_growth",
  "download_growth_pct",
  "revenue",
  "revenue_growth",
  "revenue_growth_pct",
  "dau",
  "rating",
  "rating_count",
  "price",
]);

function lookupFor(row) {
  const lookup = new Map();
  for (const [key, value] of Object.entries(row || {})) {
    lookup.set(normalizeHeader(key), value);
  }
  return lookup;
}

function firstValue(lookup, field) {
  for (const alias of FIELD_ALIASES[field] || [field]) {
    const value = lookup.get(normalizeHeader(alias));
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return undefined;
}

function numberValue(value) {
  const cleaned = String(value ?? "")
    .replace(/[$,%]/g, "")
    .replace(/,/g, "")
    .trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanString(value) {
  if (value === undefined || value === null) return undefined;
  const cleaned = String(value).trim();
  return cleaned || undefined;
}

function compactObject(value) {
  const next = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null || entry === "") continue;
    if (typeof entry === "object" && !Array.isArray(entry)) {
      const nested = compactObject(entry);
      if (Object.keys(nested).length > 0) next[key] = nested;
      continue;
    }
    next[key] = entry;
  }
  return next;
}

function flattenJsonRow(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return { note: String(row ?? "") };
  }

  const flattened = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      flattened[key] = "";
    } else if (Array.isArray(value)) {
      flattened[key] = value.map((entry) => (typeof entry === "object" ? JSON.stringify(entry) : String(entry))).join(", ");
    } else if (typeof value === "object") {
      flattened[key] = JSON.stringify(value);
    } else {
      flattened[key] = value;
    }
  }
  return flattened;
}

function rowsFromJson(value) {
  if (Array.isArray(value)) return value.map(flattenJsonRow);

  if (!value || typeof value !== "object") return [flattenJsonRow(value)];

  const candidates = [];
  for (const key of ["rows", "signals", "apps", "keywords", "notes", "observations"]) {
    if (Array.isArray(value[key])) {
      const hint = key === "apps" ? "app_metric" : key === "keywords" ? "keyword_rank" : key === "notes" || key === "observations" ? "market_note" : undefined;
      candidates.push(...value[key].map((row) => ({ ...flattenJsonRow(row), signal_type: flattenJsonRow(row).signal_type || hint })));
    }
  }

  if (candidates.length > 0) return candidates;
  return [flattenJsonRow(value)];
}

function loadRows(inputPath) {
  const buffer = fs.readFileSync(inputPath);
  const ext = path.extname(inputPath).toLowerCase();
  const text = decodeText(buffer);

  if (ext === ".json") {
    return {
      format: "json",
      encoding: buffer[0] === 0xff && buffer[1] === 0xfe ? "utf-16le" : "utf-8",
      delimiter: null,
      rows: rowsFromJson(JSON.parse(text)),
    };
  }

  if (ext === ".jsonl" || ext === ".ndjson") {
    return {
      format: "jsonl",
      encoding: buffer[0] === 0xff && buffer[1] === 0xfe ? "utf-16le" : "utf-8",
      delimiter: null,
      rows: text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => flattenJsonRow(JSON.parse(line))),
    };
  }

  const delimiter = sniffDelimiter(text);
  return {
    format: delimiter === "\t" ? "tsv" : "csv",
    encoding: buffer[0] === 0xff && buffer[1] === 0xfe ? "utf-16le" : "utf-8",
    delimiter,
    rows: parseDelimited(text, delimiter),
  };
}

function detectSignalType(values, requestedKind) {
  if (requestedKind && requestedKind !== "auto") return slugify(requestedKind).replace(/-/g, "_");
  if (values.signal_type) return slugify(values.signal_type).replace(/-/g, "_");
  if (values.keyword) return "keyword_rank";
  if (values.note || values.evidence) return "market_note";
  if (values.app_name && (
    values.downloads !== undefined ||
    values.revenue !== undefined ||
    values.dau !== undefined ||
    values.rating_count !== undefined ||
    values.rank !== undefined
  )) {
    return "app_metric";
  }
  if (values.app_name) return "app_positioning";
  return "unknown";
}

function signalScore(signal) {
  if (signal.signal_type === "keyword_rank") {
    let score = 20;
    if (signal.keyword) score += 10;
    if (signal.app_name) score += 5;
    if (Number.isFinite(signal.search_volume)) score += Math.min(30, Math.log1p(Math.max(0, signal.search_volume)) * 4);
    if (Number.isFinite(signal.rank) && signal.rank > 0) score += Math.max(0, 25 - signal.rank);
    if (Number.isFinite(signal.difficulty)) score += Math.max(0, 15 - Math.min(15, signal.difficulty / 6));
    return Math.round(Math.max(1, Math.min(100, score)));
  }

  if (signal.signal_type === "app_metric") {
    let score = 15;
    if (signal.app_name) score += 10;
    if (Number.isFinite(signal.downloads)) score += Math.min(25, Math.log1p(Math.max(0, signal.downloads)) * 2.2);
    if (Number.isFinite(signal.revenue)) score += Math.min(25, Math.log1p(Math.max(0, signal.revenue)) * 2);
    if (Number.isFinite(signal.download_growth) && signal.download_growth > 0) score += 10;
    if (Number.isFinite(signal.revenue_growth) && signal.revenue_growth > 0) score += 10;
    if (Number.isFinite(signal.rating_count)) score += Math.min(10, Math.log1p(Math.max(0, signal.rating_count)));
    return Math.round(Math.max(1, Math.min(100, score)));
  }

  if (signal.signal_type === "market_note") {
    return signal.note && signal.evidence ? 70 : 50;
  }

  return 30;
}

function normalizeSignal(row, context, rowNumber) {
  const lookup = lookupFor(row);
  const values = {};

  for (const field of Object.keys(FIELD_ALIASES)) {
    const raw = firstValue(lookup, field);
    if (raw === undefined) continue;
    values[field] = NUMERIC_FIELDS.has(field) ? numberValue(raw) : cleanString(raw);
  }

  const signalType = detectSignalType(values, context.sourceKind);
  const signal = compactObject({
    schema_version: 1,
    source_id: context.sourceId,
    provider: context.provider,
    report_type: context.reportType,
    signal_type: signalType,
    captured_at: context.capturedAt,
    row_number: rowNumber,
    category: values.category || context.category,
    market: values.market || context.market,
    platform: values.platform || context.platform,
    cluster: values.cluster,
    app_name: values.app_name,
    app_id: values.app_id,
    publisher: values.publisher,
    bundle_id: values.bundle_id,
    keyword: values.keyword,
    rank: values.rank,
    rank_change: values.rank_change,
    search_volume: values.search_volume,
    difficulty: values.difficulty,
    downloads: values.downloads,
    download_growth: values.download_growth,
    download_growth_pct: values.download_growth_pct,
    revenue: values.revenue,
    revenue_growth: values.revenue_growth,
    revenue_growth_pct: values.revenue_growth_pct,
    dau: values.dau,
    rating: values.rating,
    rating_count: values.rating_count,
    price: values.price,
    url: values.url,
    note: values.note,
    evidence: values.evidence,
  });

  signal.directional_score = signalScore(signal);
  return signal;
}

function deriveStateRoot(researchDir) {
  const parts = path.resolve(researchDir).split(path.sep);
  const index = parts.lastIndexOf("research-runs");
  if (index < 0) return null;
  const root = parts.slice(0, index).join(path.sep);
  return root || path.sep;
}

function copySourceFile({ inputPath, researchDir, provider, reportType, noCopy }) {
  if (noCopy) return { sourcePath: inputPath, statePath: null };
  const stateRoot = deriveStateRoot(researchDir);
  if (!stateRoot) return { sourcePath: inputPath, statePath: null };

  const destination = path.join(stateRoot, "sources", slugify(provider), slugify(reportType), path.basename(inputPath));
  if (path.resolve(inputPath) !== path.resolve(destination)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(inputPath, destination);
  }

  return {
    sourcePath: destination,
    statePath: path.relative(stateRoot, destination).split(path.sep).join("/"),
  };
}

function mergeSourceInventory(researchDir, source) {
  const filePath = path.join(researchDir, "source-inventory.json");
  const inventory = fs.existsSync(filePath)
    ? readJson(filePath)
    : { schema_version: 1, sources: [] };

  const byId = new Map((inventory.sources || []).map((entry) => [entry.id, entry]));
  byId.set(source.id, source);

  writeJson(filePath, {
    ...inventory,
    generated_at: nowIso(),
    sources: [...byId.values()],
  });
}

function mergeSignals(researchDir, signals) {
  const filePath = path.join(researchDir, "market-signals.jsonl");
  const incomingSourceIds = new Set(signals.map((signal) => signal.source_id));
  const retained = readJsonl(filePath).filter((signal) => !incomingSourceIds.has(signal.source_id));
  writeJsonl(filePath, [...retained, ...signals]);
  return filePath;
}

function groupCount(rows, field) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[field];
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || String(left.value).localeCompare(String(right.value)));
}

function topByScore(rows, field) {
  const byValue = new Map();
  for (const row of rows) {
    const value = row[field];
    if (!value) continue;
    const current = byValue.get(value);
    if (!current || row.directional_score > current.directional_score) byValue.set(value, row);
  }
  return [...byValue.values()]
    .sort((left, right) => right.directional_score - left.directional_score || String(left[field]).localeCompare(String(right[field])))
    .slice(0, 12);
}

function summarizeSignals(signals, source) {
  return {
    schema_version: 1,
    generated_at: nowIso(),
    source,
    signal_count: signals.length,
    signal_counts: Object.fromEntries(groupCount(signals, "signal_type").map((item) => [item.value, item.count])),
    category_counts: groupCount(signals, "category").slice(0, 12),
    market_counts: groupCount(signals, "market").slice(0, 12),
    top_keywords: topByScore(signals.filter((signal) => signal.keyword), "keyword").map((signal) => ({
      keyword: signal.keyword,
      app_name: signal.app_name,
      rank: signal.rank,
      search_volume: signal.search_volume,
      difficulty: signal.difficulty,
      directional_score: signal.directional_score,
    })),
    top_apps: topByScore(signals.filter((signal) => signal.app_name), "app_name").map((signal) => ({
      app_name: signal.app_name,
      keyword: signal.keyword,
      rank: signal.rank,
      downloads: signal.downloads,
      revenue: signal.revenue,
      rating_count: signal.rating_count,
      directional_score: signal.directional_score,
    })),
    top_notes: signals
      .filter((signal) => signal.note || signal.evidence)
      .sort((left, right) => right.directional_score - left.directional_score)
      .slice(0, 10)
      .map((signal) => ({
        app_name: signal.app_name,
        keyword: signal.keyword,
        note: signal.note,
        evidence: signal.evidence,
        directional_score: signal.directional_score,
      })),
  };
}

function escapePipe(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderSummaryMarkdown(summary, outputDir) {
  const lines = [
    `# Market Source Summary: ${summary.source.id}`,
    "",
    "## Source",
    "",
    `- Provider: ${summary.source.provider}`,
    `- Report type: ${summary.source.report_type}`,
    `- Path: ${summary.source.path}`,
    `- Rows: ${summary.signal_count}`,
    "",
    "## Signal Mix",
    "",
    ...Object.entries(summary.signal_counts).map(([type, count]) => `- ${type}: ${count}`),
    "",
    "## Top Keywords",
    "",
    "| Keyword | App | Rank | Volume | Difficulty | Score |",
    "|---|---|---:|---:|---:|---:|",
    ...summary.top_keywords.slice(0, 10).map((item) => `| ${escapePipe(item.keyword)} | ${escapePipe(item.app_name)} | ${item.rank ?? ""} | ${item.search_volume ?? ""} | ${item.difficulty ?? ""} | ${item.directional_score} |`),
    "",
    "## Top Apps",
    "",
    "| App | Keyword | Rank | Downloads | Revenue | Ratings | Score |",
    "|---|---|---:|---:|---:|---:|---:|",
    ...summary.top_apps.slice(0, 10).map((item) => `| ${escapePipe(item.app_name)} | ${escapePipe(item.keyword)} | ${item.rank ?? ""} | ${item.downloads ?? ""} | ${item.revenue ?? ""} | ${item.rating_count ?? ""} | ${item.directional_score} |`),
    "",
    "## Top Notes",
    "",
    ...summary.top_notes.slice(0, 8).map((item) => `- ${[item.app_name, item.keyword].filter(Boolean).join(" / ") || "note"}: ${item.note || item.evidence}`),
    "",
    "## Output Files",
    "",
    `- ${path.join(outputDir, "market-signals.jsonl")}`,
    `- ${path.join(outputDir, `market-source-summary-${slugify(summary.source.id)}.json`)}`,
  ];

  return `${lines.join("\n")}\n`;
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/ingest-market-source.mjs \\
    --input /path/to/export.csv \\
    --output-dir /path/to/research-runs/YYYY-MM-DD/education-us \\
    --provider apptweak \\
    --report-type keyword-ranking \\
    --category Education \\
    --market US

Purpose:
  Normalize AppTweak, Sensor Tower, App Store, or manual research exports into
  market-signals.jsonl and source inventory files for app opportunity research.

Supported inputs:
  CSV, TSV, JSON arrays, JSONL, or JSON objects with rows/signals/apps/keywords/notes.
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const inputPath = path.resolve(requireValue("--input", args.input));
  const outputDir = path.resolve(requireValue("--output-dir", args["output-dir"]));
  const provider = slugify(args.provider || "manual");
  const reportType = slugify(args["report-type"] || args.report || "market-source");
  const sourceId = slugify(args["source-id"] || `${provider}-${reportType}-${path.basename(inputPath, path.extname(inputPath))}`);
  const capturedAt = args["captured-at"] || nowIso();
  const category = args.category || "Unknown";
  const market = args.market || "US";
  const platform = args.platform || "App Store";
  const sourceKind = args["source-kind"] || "auto";

  const loaded = loadRows(inputPath);
  const fileLocation = copySourceFile({
    inputPath,
    researchDir: outputDir,
    provider,
    reportType,
    noCopy: boolValue(args["no-copy-source"], false),
  });

  const context = {
    sourceId,
    provider,
    reportType,
    capturedAt,
    category,
    market,
    platform,
    sourceKind,
  };

  const signals = loaded.rows
    .map((row, index) => normalizeSignal(row, context, index + 1))
    .filter((signal) => signal.signal_type !== "unknown" || boolValue(args["keep-unknown"], false));

  const source = compactObject({
    id: sourceId,
    type: "market-source",
    provider,
    report_type: reportType,
    source_kind: sourceKind,
    path: fileLocation.sourcePath,
    state_path: fileLocation.statePath,
    input_path: inputPath,
    category,
    market,
    platform,
    format: loaded.format,
    encoding: loaded.encoding,
    delimiter: loaded.delimiter === "\t" ? "tab" : loaded.delimiter,
    row_count: loaded.rows.length,
    signal_count: signals.length,
    captured_at: capturedAt,
    generated_at: nowIso(),
    notes: args.notes || "Imported external market source. Treat as directional evidence until paired with competitor/review gap research.",
  });

  fs.mkdirSync(outputDir, { recursive: true });
  mergeSourceInventory(outputDir, source);
  const signalPath = mergeSignals(outputDir, signals);
  const summary = summarizeSignals(signals, source);
  const summaryBase = `market-source-summary-${slugify(sourceId)}`;
  writeJson(path.join(outputDir, `${summaryBase}.json`), summary);
  fs.writeFileSync(path.join(outputDir, `${summaryBase}.md`), renderSummaryMarkdown(summary, outputDir));

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "complete",
        source_id: sourceId,
        provider,
        report_type: reportType,
        output_dir: outputDir,
        row_count: loaded.rows.length,
        signal_count: signals.length,
        signal_counts: summary.signal_counts,
        market_signals_path: signalPath,
        summary_path: path.join(outputDir, `${summaryBase}.md`),
      },
      null,
      2,
    )}\n`,
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
