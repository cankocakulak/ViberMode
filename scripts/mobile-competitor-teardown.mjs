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

function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function todaySlug() {
  return new Date().toISOString().slice(0, 10);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJsonl(filePath, rows) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, rows.length ? `${rows.map((row) => JSON.stringify(row)).join("\n")}\n` : "");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filePath, rows, headers) {
  ensureDir(path.dirname(filePath));
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function readAppEntries(filePath) {
  if (!filePath) return [];
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  if (filePath.endsWith(".json")) {
    const value = JSON.parse(raw);
    const rows = Array.isArray(value) ? value : value.apps || [];
    return rows.map((row) => normalizeManualEntry(row));
  }
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index) => index !== 0 || !/app.?name|track.?id|url/i.test(line))
    .map((line) => {
      const columns = line.split(",").map((column) => column.trim());
      return normalizeManualEntry({
        app_name: columns[0],
        app_id: columns[1],
        url: columns[2],
      });
    });
}

function normalizeManualEntry(entry) {
  if (typeof entry === "string") return { app_name: entry };
  const url = entry.url || entry.trackViewUrl || entry.app_store_url || "";
  const idFromUrl = String(url).match(/id(\d+)/)?.[1];
  return {
    app_name: entry.app_name || entry.name || entry.trackName || "",
    app_id: entry.app_id || entry.trackId || idFromUrl || "",
    url,
  };
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ViberModeCompetitorTeardown/1.0",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  return response.json();
}

async function searchApp(query, country, limit = 10) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("country", country.toUpperCase());
  url.searchParams.set("entity", "software");
  url.searchParams.set("limit", String(limit));
  const body = await fetchJson(url);
  return {
    source: {
      id: `itunes-search-${slugify(query)}-${country}`,
      type: "itunes-search-api",
      provider: "apple",
      report_type: "public-search",
      url: url.toString(),
      captured_at: nowIso(),
      query,
      country,
      limitation: "Public listing metadata only; does not prove live onboarding, paywall timing, or A/B variants.",
    },
    apps: body.results || [],
  };
}

async function lookupApps(ids, country) {
  const apps = [];
  const sources = [];
  for (let index = 0; index < ids.length; index += 50) {
    const slice = ids.slice(index, index + 50);
    if (!slice.length) continue;
    const url = new URL("https://itunes.apple.com/lookup");
    url.searchParams.set("id", slice.join(","));
    url.searchParams.set("country", country.toUpperCase());
    url.searchParams.set("entity", "software");
    const body = await fetchJson(url);
    const source = {
      id: `itunes-lookup-${slice[0]}-${slice.at(-1)}-${country}`,
      type: "itunes-lookup-api",
      provider: "apple",
      report_type: "public-lookup",
      url: url.toString(),
      captured_at: nowIso(),
      country,
      limitation: "Public listing metadata only; does not prove live onboarding, paywall timing, or A/B variants.",
    };
    sources.push(source);
    apps.push(...(body.results || []).map((app) => ({ ...app, source_id: source.id })));
  }
  return { apps, sources };
}

async function fetchTopChart(country, chartType, limit) {
  const type = slugify(chartType || "top-free");
  const url = `https://rss.applemarketingtools.com/api/v2/${country}/apps/${type}/${Number(limit)}/apps.json`;
  const body = await fetchJson(url);
  const chartRows = body.feed?.results || [];
  const ids = chartRows.map((row) => row.id).filter(Boolean);
  const lookup = ids.length ? await lookupApps(ids, country) : { apps: [], sources: [] };
  const byId = new Map(lookup.apps.map((app) => [String(app.trackId), app]));
  return {
    source: {
      id: `apple-chart-${type}-${country}`,
      type: "apple-public-chart-rss",
      provider: "apple",
      report_type: "public-top-chart",
      url,
      captured_at: nowIso(),
      chart_type: type,
      country,
      limitation: "Public chart placement only; does not prove downloads or revenue.",
    },
    lookupSources: lookup.sources,
    apps: chartRows.map((row, index) => ({
      ...(byId.get(String(row.id)) || {
        trackId: row.id,
        trackName: row.name,
        artistName: row.artistName,
        sellerName: row.artistName,
        trackViewUrl: row.url,
        genres: row.genres || [],
      }),
      source_id: `apple-chart-${type}-${country}`,
      source_rank: index + 1,
      source_query: type,
    })),
  };
}

function normalizeApp(app, context = {}) {
  const genres = Array.isArray(app.genres) ? app.genres.map((genre) => typeof genre === "string" ? genre : genre.name).filter(Boolean) : [];
  return {
    app_id: String(app.trackId || app.app_id || ""),
    app_name: app.trackName || app.app_name || "",
    publisher: app.artistName || app.sellerName || "",
    bundle_id: app.bundleId || "",
    platform: "iOS / App Store",
    market: context.market || "",
    category: app.primaryGenreName || genres[0] || context.category || "",
    genres,
    rating: app.averageUserRating ?? "",
    review_count: app.userRatingCount ?? "",
    price: app.price ?? "",
    formatted_price: app.formattedPrice || "",
    offers_iap: app.offersIAP ?? "",
    content_rating: app.trackContentRating || "",
    version: app.version || "",
    release_date: app.releaseDate || "",
    current_version_release_date: app.currentVersionReleaseDate || "",
    app_store_url: app.trackViewUrl || context.url || "",
    screenshot_count: Array.isArray(app.screenshotUrls) ? app.screenshotUrls.length : 0,
    screenshot_urls: Array.isArray(app.screenshotUrls) ? app.screenshotUrls.slice(0, 5) : [],
    ipad_screenshot_count: Array.isArray(app.ipadScreenshotUrls) ? app.ipadScreenshotUrls.length : 0,
    description: app.description || "",
    release_notes: app.releaseNotes || "",
    source_id: app.source_id || context.source_id || "",
    source_query: app.source_query || context.source_query || "",
    source_rank: app.source_rank || "",
    coverage_status: "metadata_only",
    captured_at: nowIso(),
  };
}

function appSlug(app) {
  return slugify(`${app.app_name || "app"}-${app.app_id || ""}`) || "app";
}

function createAppMarkdown(app) {
  return `# ${app.app_name || "Unknown App"}

## Identity

- App Store ID: ${app.app_id || "unknown"}
- Publisher: ${app.publisher || "unknown"}
- Category: ${app.category || "unknown"}
- Market: ${app.market || "unknown"}
- App Store: ${app.app_store_url || "unknown"}
- Coverage: ${app.coverage_status}

## Source Evidence

- Apple metadata source: ${app.source_id || "unknown"}
- Additional paywall/onboarding sources: unknown
- User recording/screenshots: unknown

## Onboarding

- Step count: unknown
- Onboarding type: unknown
- Personalization: unknown
- Account gate: unknown
- Permission timing: unknown
- First value moment: unknown
- Paywall timing: unknown

## Paywall

- Layout archetype: unknown
- Default plan: unknown
- Trial offer: unknown
- Close button: unknown
- Value proof: unknown
- Urgency: unknown
- Trust/legal elements: unknown
- Dark-pattern risk: unknown

## Monetization

- Model: ${app.offers_iap === true ? "subscription_or_iap_likely" : "unknown"}
- Gate type: unknown
- Pricing anchor: unknown
- Visible plans: unknown

## Review Prompt

- Observed: unknown
- Trigger context: unknown
- Notes: Requires live flow evidence or a public source.

## Notes

- Observed facts: Apple public metadata captured at ${app.captured_at}.
- Inferences: none yet.
- Missing evidence: onboarding flow, paywall screenshots, review prompt timing, purchase/trial screen details.
`;
}

function matrixRows(apps) {
  return apps.map((app) => ({
    app_id: app.app_id,
    app_name: app.app_name,
    publisher: app.publisher,
    coverage_status: app.coverage_status,
  }));
}

function mergeByAppId(rows) {
  const byId = new Map();
  for (const row of rows) {
    const id = String(row.trackId || row.app_id || "");
    if (!id) continue;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, row);
      continue;
    }
    byId.set(id, {
      ...existing,
      ...row,
      source_id: existing.source_id || row.source_id,
      source_query: existing.source_query || row.source_query,
      source_rank: existing.source_rank || row.source_rank,
    });
  }
  return [...byId.values()];
}

function defaultOutputDir(theme) {
  return path.resolve(".vibermode-state", "app-factory-state", "research-runs", todaySlug(), slugify(theme || "mobile-competitor-teardown"));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const market = String(args.market || "US").toUpperCase();
  const country = market.toLowerCase();
  const category = args.category || "Education";
  const theme = args.theme || "education-paywall-teardown";
  const outputDir = path.resolve(args["output-dir"] || defaultOutputDir(theme));
  const includeTopChart = boolValue(args["include-top-chart"], false);
  const limit = Number(args.limit || 25);
  const queryLimit = Number(args["query-limit"] || 10);
  const queries = parseList(args.queries || "language learning,math solver,homework helper,micro learning,vocabulary builder,test prep");
  const manualEntries = [
    ...parseList(args.apps).map((appName) => ({ app_name: appName })),
    ...readAppEntries(args["apps-file"]),
  ];

  ensureDir(outputDir);
  ensureDir(path.join(outputDir, "matrices"));
  ensureDir(path.join(outputDir, "apps"));
  ensureDir(path.join(outputDir, "screenshots"));

  const sources = [];
  const rawApps = [];

  for (const query of queries) {
    const result = await searchApp(query, country, queryLimit);
    sources.push(result.source);
    rawApps.push(...result.apps.map((app, index) => ({
      ...app,
      source_id: result.source.id,
      source_query: query,
      source_rank: index + 1,
    })));
  }

  for (const entry of manualEntries) {
    if (entry.app_id) continue;
    if (!entry.app_name) continue;
    const result = await searchApp(entry.app_name, country, 1);
    sources.push({ ...result.source, id: `${result.source.id}-manual`, manual_entry: true });
    rawApps.push(...result.apps.map((app) => ({
      ...app,
      source_id: `${result.source.id}-manual`,
      source_query: entry.app_name,
      source_rank: 1,
    })));
  }

  const manualIds = manualEntries.map((entry) => entry.app_id).filter(Boolean);
  if (manualIds.length) {
    const lookup = await lookupApps(manualIds, country);
    sources.push(...lookup.sources);
    rawApps.push(...lookup.apps);
  }

  if (includeTopChart) {
    try {
      const chart = await fetchTopChart(country, "top-free", limit);
      sources.push(chart.source, ...chart.lookupSources);
      rawApps.push(...chart.apps);
    } catch (error) {
      sources.push({
        id: `apple-chart-top-free-${country}-failed`,
        type: "apple-public-chart-rss",
        provider: "apple",
        report_type: "public-top-chart",
        captured_at: nowIso(),
        country,
        error: error.message,
      });
    }
  }

  const normalized = mergeByAppId(rawApps)
    .map((app) => normalizeApp(app, { market, category }))
    .filter((app) => !category || app.category === category || app.genres.includes(category))
    .sort((a, b) => {
      const aReviews = Number(a.review_count || 0);
      const bReviews = Number(b.review_count || 0);
      return bReviews - aReviews || String(a.app_name).localeCompare(String(b.app_name));
    });

  const sourceInventory = {
    schema_version: 1,
    generated_at: nowIso(),
    category,
    market,
    platform: "iOS / App Store",
    sources: [
      ...sources,
      {
        id: "paywallpro-open-gallery",
        type: "web",
        provider: "paywallpro",
        url: "https://github.com/paywallpro/paywall-gallery",
        captured_at: null,
        status: "planned_enrichment",
      },
      {
        id: "paywallscreens",
        type: "web",
        provider: "superwall",
        url: "https://www.paywallscreens.com/",
        captured_at: null,
        status: "planned_enrichment",
      },
      {
        id: "mobbin",
        type: "web",
        provider: "mobbin",
        url: "https://mobbin.com/",
        captured_at: null,
        status: "planned_enrichment",
      },
      {
        id: "page-flows",
        type: "web",
        provider: "pageflows",
        url: "https://pageflows.com/",
        captured_at: null,
        status: "planned_enrichment",
      },
    ],
  };

  writeJson(path.join(outputDir, "source-inventory.json"), sourceInventory);
  writeJsonl(path.join(outputDir, "normalized-apps.jsonl"), normalized);

  writeCsv(path.join(outputDir, "app-list.csv"), normalized, [
    "app_id",
    "app_name",
    "publisher",
    "category",
    "market",
    "rating",
    "review_count",
    "formatted_price",
    "offers_iap",
    "version",
    "current_version_release_date",
    "coverage_status",
    "app_store_url",
  ]);

  const baseRows = matrixRows(normalized);
  writeCsv(path.join(outputDir, "matrices", "onboarding-matrix.csv"), baseRows.map((row) => ({
    ...row,
    step_count: "unknown",
    onboarding_type: "unknown",
    personalization: "unknown",
    account_gate: "unknown",
    permission_timing: "unknown",
    first_value_moment: "unknown",
    paywall_timing: "unknown",
    evidence_url: "",
  })), [
    "app_id", "app_name", "publisher", "coverage_status", "step_count", "onboarding_type", "personalization", "account_gate", "permission_timing", "first_value_moment", "paywall_timing", "evidence_url",
  ]);
  writeCsv(path.join(outputDir, "matrices", "paywall-matrix.csv"), baseRows.map((row) => ({
    ...row,
    layout_archetype: "unknown",
    default_plan: "unknown",
    trial_offer: "unknown",
    close_button: "unknown",
    value_proof: "unknown",
    urgency: "unknown",
    trust_elements: "unknown",
    dark_pattern_risk: "unknown",
    evidence_url: "",
  })), [
    "app_id", "app_name", "publisher", "coverage_status", "layout_archetype", "default_plan", "trial_offer", "close_button", "value_proof", "urgency", "trust_elements", "dark_pattern_risk", "evidence_url",
  ]);
  writeCsv(path.join(outputDir, "matrices", "monetization-matrix.csv"), normalized.map((app) => ({
    app_id: app.app_id,
    app_name: app.app_name,
    publisher: app.publisher,
    coverage_status: app.coverage_status,
    model: app.offers_iap === true ? "subscription_or_iap_likely" : "unknown",
    gate_type: "unknown",
    pricing_anchor: "unknown",
    plan_set: "unknown",
    restore_visible: "unknown",
    legal_visible: "unknown",
    evidence_url: "",
  })), [
    "app_id", "app_name", "publisher", "coverage_status", "model", "gate_type", "pricing_anchor", "plan_set", "restore_visible", "legal_visible", "evidence_url",
  ]);
  writeCsv(path.join(outputDir, "matrices", "review-prompt-matrix.csv"), baseRows.map((row) => ({
    ...row,
    review_prompt_observed: "unknown",
    trigger_context: "unknown",
    risk: "unknown",
    evidence_url: "",
  })), [
    "app_id", "app_name", "publisher", "coverage_status", "review_prompt_observed", "trigger_context", "risk", "evidence_url",
  ]);
  writeCsv(path.join(outputDir, "matrices", "pricing-matrix.csv"), normalized.map((app) => ({
    app_id: app.app_id,
    app_name: app.app_name,
    publisher: app.publisher,
    coverage_status: app.coverage_status,
    formatted_price: app.formatted_price,
    offers_iap: app.offers_iap,
    default_plan: "unknown",
    monthly_price: "unknown",
    annual_price: "unknown",
    weekly_price: "unknown",
    lifetime_price: "unknown",
    trial: "unknown",
    evidence_url: app.app_store_url,
  })), [
    "app_id", "app_name", "publisher", "coverage_status", "formatted_price", "offers_iap", "default_plan", "monthly_price", "annual_price", "weekly_price", "lifetime_price", "trial", "evidence_url",
  ]);

  for (const app of normalized) {
    fs.writeFileSync(path.join(outputDir, "apps", `${appSlug(app)}.md`), createAppMarkdown(app));
  }

  const dashboardData = {
    schema_version: 1,
    generated_at: nowIso(),
    category,
    market,
    platform: "iOS / App Store",
    summary: {
      total_apps: normalized.length,
      coverage: normalized.reduce((acc, app) => {
        acc[app.coverage_status] = (acc[app.coverage_status] || 0) + 1;
        return acc;
      }, {}),
    },
    apps: normalized.map((app) => ({
      app_id: app.app_id,
      app_name: app.app_name,
      publisher: app.publisher,
      category: app.category,
      rating: app.rating,
      review_count: app.review_count,
      formatted_price: app.formatted_price,
      offers_iap: app.offers_iap,
      version: app.version,
      current_version_release_date: app.current_version_release_date,
      coverage_status: app.coverage_status,
      app_store_url: app.app_store_url,
      screenshot_urls: app.screenshot_urls,
      onboarding: {
        step_count: "unknown",
        type: "unknown",
        paywall_timing: "unknown",
      },
      paywall: {
        layout_archetype: "unknown",
        trial_offer: "unknown",
        close_button: "unknown",
      },
      monetization: {
        model: app.offers_iap === true ? "subscription_or_iap_likely" : "unknown",
        pricing_anchor: "unknown",
      },
      review_prompt: {
        observed: "unknown",
        trigger_context: "unknown",
      },
    })),
    sources: sourceInventory.sources,
    patterns: [],
    recommendations: [],
  };
  writeJson(path.join(outputDir, "dashboard-data.json"), dashboardData);
  writeJson(path.join(outputDir, "backlog-candidates.json"), {
    schema_version: 1,
    candidates: [],
  });

  fs.writeFileSync(path.join(outputDir, "decision.md"), `# Mobile Competitor Teardown: ${category} / ${market}

## Executive Takeaway

Initial Apple public metadata snapshot created. Paywall, onboarding, and review prompt fields remain \`unknown\` until enriched from PaywallPro, PaywallScreens, Mobbin, Page Flows, ScreensDesign, public teardowns, or user-provided device recordings.

## Scope

- Category: ${category}
- Market: ${market}
- Platform: iOS / App Store
- Generated: ${nowIso()}
- App count: ${normalized.length}

## Data Sources

- Apple public search/lookup/chart sources are recorded in \`source-inventory.json\`.
- Planned enrichment sources are listed in \`source-inventory.json\`.

## Coverage

${Object.entries(dashboardData.summary.coverage).map(([status, count]) => `- ${status}: ${count}`).join("\n") || "- none"}

## Next Enrichment Pass

1. Search paywall/onboarding libraries by exact app name and publisher.
2. Fill \`matrices/*.csv\` with observed values only.
3. Update app markdown files with evidence links and notes.
4. Sync \`dashboard-data.json\` into the dashboard repo.

## Gaps

- Live review prompt timing requires direct flow evidence.
- Apple Sign In, purchase, trial, and 2FA steps must remain user-controlled.
`);

  const dashboardRepo = args["dashboard-repo"] ? path.resolve(args["dashboard-repo"]) : "";
  if (dashboardRepo) {
    ensureDir(path.join(dashboardRepo, "data", "latest"));
    fs.copyFileSync(path.join(outputDir, "dashboard-data.json"), path.join(dashboardRepo, "data", "latest", "dashboard-data.json"));
    fs.copyFileSync(path.join(outputDir, "app-list.csv"), path.join(dashboardRepo, "data", "latest", "app-list.csv"));
  }

  console.log(`Created competitor teardown run: ${outputDir}`);
  console.log(`Apps: ${normalized.length}`);
  if (dashboardRepo) console.log(`Synced dashboard data to: ${path.join(dashboardRepo, "data", "latest")}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
