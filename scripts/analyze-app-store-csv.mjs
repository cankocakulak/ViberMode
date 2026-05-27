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

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
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

function numberValue(value) {
  const cleaned = String(value ?? "")
    .replace(/[$,%]/g, "")
    .replace(/,/g, "")
    .trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const clusterRules = [
  {
    cluster: "Plant / nature ID",
    keywords: ["plant", "plantsnap", "picturethis", "plantin", "plantlush", "bird", "rock", "mushroom", "nature"],
    buildability: 7,
    novelty: 6,
    defaultWedges: [
      "Pet-safe plant scanner focused on toxicity decisions for cat and dog owners.",
      "Family garden helper that turns plant ID into child-friendly care tasks.",
      "Local-first plant care log for people who already know the plant but forget watering and light needs.",
    ],
  },
  {
    cluster: "Language learning / vocabulary",
    keywords: ["language", "english", "lingo", "duolingo", "babbel", "pimsleur", "speak", "airlearn", "vocabulary", "words"],
    buildability: 6,
    novelty: 5,
    defaultWedges: [
      "Role-specific speaking drills for one profession instead of broad language learning.",
      "Daily vocabulary retention for a narrow exam or workplace niche.",
      "Pronunciation coach for common phrases in a single travel/job context.",
    ],
  },
  {
    cluster: "AI homework / study solver",
    keywords: ["ai", "math", "gauth", "question", "homework", "study", "calculator", "answer", "photomath", "solvely"],
    buildability: 5,
    novelty: 4,
    defaultWedges: [
      "Study companion that explains mistakes after a practice set rather than solving homework directly.",
      "Parent-visible homework helper with anti-cheating constraints.",
      "Single-subject flash remediation for weak concepts detected from wrong answers.",
    ],
  },
  {
    cluster: "Kids learning / school",
    keywords: ["kids", "child", "toca", "dojo", "classdojo", "lingokids", "reading", "abc", "baby", "keiki", "kiddopia"],
    buildability: 5,
    novelty: 5,
    defaultWedges: [
      "Parent-child five-minute learning routine with no account requirement.",
      "Teacher-to-parent micro practice assignments for early literacy.",
      "Age-banded offline learning games for a single skill instead of a broad kids platform.",
    ],
  },
  {
    cluster: "Music / creative learning",
    keywords: ["piano", "guitar", "draw", "art", "sing", "music", "yousician"],
    buildability: 6,
    novelty: 6,
    defaultWedges: [
      "Micro-practice coach for one instrument skill, such as chord transitions.",
      "Daily drawing drills that focus on measurable repetition rather than full courses.",
      "Practice habit tracker with progress prompts for one creative discipline.",
    ],
  },
  {
    cluster: "Test prep / driving",
    keywords: ["dmv", "permit", "driving", "prep", "test"],
    buildability: 8,
    novelty: 5,
    defaultWedges: [
      "State-specific DMV prep with weak-area repetition and plain-language explanations.",
      "One-week permit test crash plan for first-time drivers.",
      "Parent-supervised driving practice log tied to permit requirements.",
    ],
  },
  {
    cluster: "Brain training / microlearning",
    keywords: ["brain", "iq", "elevate", "headway", "micro", "imprint", "blinkist"],
    buildability: 7,
    novelty: 5,
    defaultWedges: [
      "Single-topic microlearning streaks for a practical skill instead of broad self-improvement.",
      "Decision flashcards for domain-specific knowledge, such as personal finance basics.",
      "Reflection-based microlearning that turns summaries into action prompts.",
    ],
  },
];

function classifyCluster(appName) {
  const normalized = appName.toLowerCase();
  return clusterRules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword))) || {
    cluster: "Other education",
    keywords: [],
    buildability: 6,
    novelty: 5,
    defaultWedges: [
      "Narrow the audience and job before promoting this cluster to a backlog idea.",
    ],
  };
}

function normalizeRows(rows, source) {
  const byApp = new Map();

  for (const row of rows) {
    const appName = row["Unified Name"] || row["App Name"];
    if (!appName) continue;

    const key = row["Unified ID"] || row["App ID"] || appName;
    const clusterRule = classifyCluster(appName);
    const current = byApp.get(key) || {
      app_name: appName,
      app_id: row["App ID"] || "",
      publisher: row["Unified Publisher Name"] || row["Publisher Name"] || "",
      platform: row.Platform || source.platform,
      category: row.Category || source.category,
      market: source.market,
      cluster: clusterRule.cluster,
      source_id: source.id,
      dates: [],
      downloads: 0,
      download_growth: 0,
      download_growth_pct_values: [],
      revenue: 0,
      revenue_growth: 0,
      revenue_growth_pct_values: [],
      dau: 0,
      dau_growth: 0,
      dau_growth_pct_values: [],
    };

    current.dates.push(row.Date);
    current.downloads += numberValue(row["Downloads (Absolute)"]);
    current.download_growth += numberValue(row["Downloads (PoP Growth)"]);
    current.download_growth_pct_values.push(numberValue(row["Downloads (PoP Growth %)"]));
    current.revenue += numberValue(row["Revenue (Absolute)"]);
    current.revenue_growth += numberValue(row["Revenue (PoP Growth)"]);
    current.revenue_growth_pct_values.push(numberValue(row["Revenue (PoP Growth %)"]));
    current.dau += numberValue(row["DAU (Absolute)"]);
    current.dau_growth += numberValue(row["DAU (PoP Growth)"]);
    current.dau_growth_pct_values.push(numberValue(row["DAU (PoP Growth %)"]));

    byApp.set(key, current);
  }

  return [...byApp.values()].map((app) => {
    const dayCount = Math.max(1, new Set(app.dates.filter(Boolean)).size);
    return {
      ...app,
      dates: [...new Set(app.dates.filter(Boolean))],
      revenue: round(app.revenue),
      revenue_growth: round(app.revenue_growth),
      revenue_growth_pct: round(average(app.revenue_growth_pct_values), 6),
      downloads: Math.round(app.downloads),
      download_growth: Math.round(app.download_growth),
      download_growth_pct: round(average(app.download_growth_pct_values), 6),
      dau: Math.round(app.dau / dayCount),
      dau_growth: Math.round(app.dau_growth),
      dau_growth_pct: round(average(app.dau_growth_pct_values), 6),
      revenue_per_download: app.downloads > 0 ? round(app.revenue / app.downloads, 4) : 0,
    };
  });
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length === 0) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function scoreFromPositive(value, maxValue) {
  if (maxValue <= 0) return 1;
  const score = 1 + (9 * Math.log1p(Math.max(0, value))) / Math.log1p(maxValue);
  return Math.max(1, Math.min(10, Math.round(score)));
}

function competitionGapScore(appCount) {
  if (appCount <= 3) return 9;
  if (appCount <= 8) return 8;
  if (appCount <= 15) return 7;
  if (appCount <= 25) return 5;
  if (appCount <= 40) return 4;
  return 3;
}

function riskScore(cluster, appCount) {
  if (cluster.includes("Kids")) return 6;
  if (cluster.includes("AI homework")) return 6;
  if (appCount > 35) return 5;
  return 4;
}

function scoreCluster(cluster, maxima) {
  const rule = clusterRules.find((candidate) => candidate.cluster === cluster.cluster) || {
    buildability: 6,
    novelty: 5,
    defaultWedges: [],
  };

  const demand = scoreFromPositive(cluster.downloads + cluster.dau, maxima.demand);
  const revenueSignal = scoreFromPositive(cluster.revenue, maxima.revenue);
  const growthSignal = scoreFromPositive(
    Math.max(0, cluster.revenue_growth) * 2 + Math.max(0, cluster.download_growth) + Math.max(0, cluster.dau_growth) / 10,
    maxima.growth,
  );
  const engagementSignal = scoreFromPositive(cluster.dau, maxima.dau);
  const competitionGap = competitionGapScore(cluster.app_count);
  const risk = riskScore(cluster.cluster, cluster.app_count);

  const weighted =
    demand * 1.3 +
    revenueSignal * 1.4 +
    growthSignal * 1.8 +
    engagementSignal * 0.8 +
    competitionGap * 1.2 +
    rule.buildability * 1.4 +
    rule.novelty * 0.9 +
    (11 - risk) * 0.8;

  return {
    demand,
    revenue_signal: revenueSignal,
    growth_signal: growthSignal,
    engagement_signal: engagementSignal,
    competition_gap: competitionGap,
    buildability: rule.buildability,
    novelty: rule.novelty,
    risk,
    total: Math.round((weighted / 96) * 100),
  };
}

function aggregateClusters(apps) {
  const clusters = new Map();

  for (const app of apps) {
    const current = clusters.get(app.cluster) || {
      cluster: app.cluster,
      app_count: 0,
      revenue: 0,
      revenue_growth: 0,
      downloads: 0,
      download_growth: 0,
      dau: 0,
      dau_growth: 0,
      apps: [],
    };

    current.app_count += 1;
    current.revenue += app.revenue;
    current.revenue_growth += app.revenue_growth;
    current.downloads += app.downloads;
    current.download_growth += app.download_growth;
    current.dau += app.dau;
    current.dau_growth += app.dau_growth;
    current.apps.push(app);
    clusters.set(app.cluster, current);
  }

  const rawClusters = [...clusters.values()].map((cluster) => ({
    ...cluster,
    revenue: round(cluster.revenue),
    revenue_growth: round(cluster.revenue_growth),
    downloads: Math.round(cluster.downloads),
    download_growth: Math.round(cluster.download_growth),
    dau: Math.round(cluster.dau),
    dau_growth: Math.round(cluster.dau_growth),
    top_apps: cluster.apps
      .slice()
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 8)
      .map((app) => ({
        app_name: app.app_name,
        publisher: app.publisher,
        revenue: app.revenue,
        revenue_growth: app.revenue_growth,
        downloads: app.downloads,
        download_growth: app.download_growth,
        dau: app.dau,
        dau_growth: app.dau_growth,
      })),
  }));

  const maxima = {
    demand: Math.max(...rawClusters.map((cluster) => cluster.downloads + cluster.dau), 1),
    revenue: Math.max(...rawClusters.map((cluster) => cluster.revenue), 1),
    growth: Math.max(
      ...rawClusters.map(
        (cluster) =>
          Math.max(0, cluster.revenue_growth) * 2 +
          Math.max(0, cluster.download_growth) +
          Math.max(0, cluster.dau_growth) / 10,
      ),
      1,
    ),
    dau: Math.max(...rawClusters.map((cluster) => cluster.dau), 1),
  };

  return rawClusters
    .map((cluster) => {
      const rule = clusterRules.find((candidate) => candidate.cluster === cluster.cluster) || { defaultWedges: [] };
      const scores = scoreCluster(cluster, maxima);
      return {
        ...cluster,
        scores,
        interpretation: interpretCluster(cluster, scores),
        wedge_hypotheses: rule.defaultWedges,
      };
    })
    .sort((left, right) => right.scores.total - left.scores.total);
}

function interpretCluster(cluster, scores) {
  const notes = [];
  if (cluster.revenue_growth > 0) notes.push("positive revenue growth");
  if (cluster.download_growth > 0) notes.push("positive download growth");
  if (cluster.dau_growth > 0) notes.push("positive DAU growth");
  if (cluster.app_count > 25) notes.push("crowded segment");
  if (scores.growth_signal >= 8) notes.push("strong growth signal");
  if (scores.competition_gap >= 8) notes.push("relatively sparse cluster");
  if (notes.length === 0) notes.push("weak or mixed structured-data signal");
  return notes.join("; ");
}

function buildOpportunities(clusters, source) {
  return clusters.map((cluster, index) => ({
    rank: index + 1,
    cluster: cluster.cluster,
    category: source.category,
    market: source.market,
    platform: source.platform,
    metric_snapshot: {
      app_count: cluster.app_count,
      revenue: cluster.revenue,
      revenue_growth: cluster.revenue_growth,
      downloads: cluster.downloads,
      download_growth: cluster.download_growth,
      dau: cluster.dau,
      dau_growth: cluster.dau_growth,
    },
    scores: cluster.scores,
    top_apps: cluster.top_apps.slice(0, 5),
    wedge_hypotheses: cluster.wedge_hypotheses,
    evidence_sources: [source.id],
    status: cluster.scores.total >= 62 ? "promising" : "watchlist",
    next_research:
      "Inspect competitor App Store pages, reviews, pricing, onboarding, and keyword positioning before promoting to a ready backlog candidate.",
  }));
}

function buildDecisionMarkdown({ source, clusters, opportunities, outputDir }) {
  const top = opportunities.slice(0, 5);
  const lines = [
    `# App Opportunity Research: ${source.category} / ${source.market}`,
    "",
    "## Executive Takeaway",
    "",
    `Analyzed ${source.row_count} rows from a static ${source.platform} metric export. Treat this as directional evidence: it identifies clusters worth deeper research, but it should be paired with current App Store pages, reviews, and keyword checks before backlog promotion.`,
    "",
    "## Source",
    "",
    `- ${source.id}: ${source.path}`,
    `- Encoding: ${source.encoding}; delimiter: ${source.delimiter === "\t" ? "tab" : source.delimiter}`,
    `- Metrics: downloads, revenue, DAU, and period-over-period growth`,
    "",
    "## Top Cluster Signals",
    "",
    "| Rank | Cluster | Apps | Revenue | Revenue Growth | Downloads | Download Growth | DAU | Score |",
    "|---:|---|---:|---:|---:|---:|---:|---:|---:|",
    ...top.map(
      (item) =>
        `| ${item.rank} | ${item.cluster} | ${item.metric_snapshot.app_count} | ${money(item.metric_snapshot.revenue)} | ${money(item.metric_snapshot.revenue_growth)} | ${integer(item.metric_snapshot.downloads)} | ${integer(item.metric_snapshot.download_growth)} | ${integer(item.metric_snapshot.dau)} | ${item.scores.total} |`,
    ),
    "",
    "## Recommended Follow-Up",
    "",
    ...top.flatMap((item) => [
      `### ${item.rank}. ${item.cluster}`,
      "",
      `Signal: ${clusters.find((cluster) => cluster.cluster === item.cluster)?.interpretation || "mixed signal"}.`,
      "",
      "Possible wedges:",
      ...item.wedge_hypotheses.map((wedge) => `- ${wedge}`),
      "",
      "Competitor check:",
      ...item.top_apps.slice(0, 3).map((app) => `- ${app.app_name}: revenue ${money(app.revenue)}, downloads ${integer(app.downloads)}, DAU ${integer(app.dau)}`),
      "",
    ]),
    "## Rejected / Not Ready",
    "",
    "- Broad category clones such as generic language learning, generic homework solver, or generic plant ID should not enter the factory without a narrower audience and gap.",
    "- Any candidate without review/positioning evidence should stay `researching`.",
    "",
    "## Output Files",
    "",
    `- ${path.join(outputDir, "source-inventory.json")}`,
    `- ${path.join(outputDir, "normalized-apps.jsonl")}`,
    `- ${path.join(outputDir, "clusters.json")}`,
    `- ${path.join(outputDir, "opportunities.json")}`,
  ];

  return `${lines.join("\n")}\n`;
}

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function integer(value) {
  return Math.round(value).toLocaleString("en-US");
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/analyze-app-store-csv.mjs \\
    --input "/path/to/app-store-export.csv" \\
    --output-dir /path/to/research-runs/YYYY-MM-DD/category-theme \\
    --source-id app-store-education-revenue-growth-YYYY-MM-DD \\
    --market US \\
    --category Education

Notes:
  Handles UTF-8 and UTF-16 CSV/TSV exports.
  Produces source inventory, normalized app rows, cluster metrics, opportunities, and decision.md.
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
  const sourceId = args["source-id"] || `app-store-${slugify(path.basename(inputPath, path.extname(inputPath)))}`;
  const market = args.market || "US";
  const category = args.category || "Unknown";
  const platform = args.platform || "App Store";
  const generatedAt = new Date().toISOString();

  const buffer = fs.readFileSync(inputPath);
  const text = decodeText(buffer);
  const delimiter = sniffDelimiter(text);
  const rows = parseDelimited(text, delimiter);

  const source = {
    id: sourceId,
    type: "csv",
    path: inputPath,
    category,
    market,
    platform,
    encoding: buffer[0] === 0xff && buffer[1] === 0xfe ? "utf-16le" : "utf-8",
    delimiter,
    row_count: rows.length,
    generated_at: generatedAt,
    notes: "Static metric export. Use as directional evidence, not as the sole research guide.",
  };

  const normalizedApps = normalizeRows(rows, source);
  const clusters = aggregateClusters(normalizedApps);
  const opportunities = buildOpportunities(clusters, source);
  const rejected = {
    schema_version: 1,
    generated_at: generatedAt,
    rejected: [
      {
        title: "Generic category clone",
        reason: "A broad app type without a narrow audience, competitor gap, and MVP wedge is not backlog-ready.",
      },
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  writeJson(path.join(outputDir, "source-inventory.json"), {
    schema_version: 1,
    generated_at: generatedAt,
    sources: [source],
  });
  writeJsonl(path.join(outputDir, "normalized-apps.jsonl"), normalizedApps);
  writeJson(path.join(outputDir, "clusters.json"), {
    schema_version: 1,
    generated_at: generatedAt,
    category,
    market,
    clusters,
  });
  writeJson(path.join(outputDir, "opportunities.json"), {
    schema_version: 1,
    generated_at: generatedAt,
    category,
    market,
    opportunities,
  });
  writeJson(path.join(outputDir, "rejected.json"), rejected);
  writeJson(path.join(outputDir, "backlog-candidates.json"), {
    schema_version: 1,
    generated_at: generatedAt,
    candidates: [],
    notes: "No candidates are emitted automatically from one static CSV. Promote only after gap research validates a specific wedge.",
  });
  fs.writeFileSync(
    path.join(outputDir, "decision.md"),
    buildDecisionMarkdown({ source, clusters, opportunities, outputDir }),
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "complete",
        source_id: source.id,
        output_dir: outputDir,
        row_count: rows.length,
        app_count: normalizedApps.length,
        cluster_count: clusters.length,
        top_clusters: opportunities.slice(0, 5).map((opportunity) => ({
          cluster: opportunity.cluster,
          score: opportunity.scores.total,
          revenue: opportunity.metric_snapshot.revenue,
          revenue_growth: opportunity.metric_snapshot.revenue_growth,
          download_growth: opportunity.metric_snapshot.download_growth,
        })),
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
