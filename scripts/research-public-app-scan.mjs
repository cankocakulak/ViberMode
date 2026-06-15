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

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value || 0) * factor) / factor;
}

function integer(value) {
  return Math.round(value || 0).toLocaleString("en-US");
}

function money(value) {
  return `$${Math.round(value || 0).toLocaleString("en-US")}`;
}

function escapePipe(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function compactObject(value) {
  const next = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null || entry === "") continue;
    if (Array.isArray(entry) && entry.length === 0) continue;
    next[key] = entry;
  }
  return next;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ViberModePublicAppScan/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.json();
}

function countryFromMarket(market) {
  return String(market || "US").toLowerCase();
}

function appStoreUrl(appId, country) {
  return `https://apps.apple.com/${country}/app/id${appId}`;
}

async function searchApps(query, country, limit) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("country", country.toUpperCase());
  url.searchParams.set("entity", "software");
  url.searchParams.set("limit", String(limit));

  const body = await fetchJson(url);
  const source = {
    id: `itunes-search-${slugify(query)}-${country}`,
    type: "itunes-search-api",
    provider: "apple",
    report_type: "public-search",
    url: url.toString(),
    captured_at: nowIso(),
    query,
    country,
  };

  return {
    source,
    results: (body.results || []).map((app, index) => compactApp(app, {
      source_id: source.id,
      source_query: query,
      source_rank: index + 1,
      country,
    })),
  };
}

async function fetchTopChart(country, chartType, limit) {
  const normalizedType = slugify(chartType || "top-free");
  const url = `https://rss.applemarketingtools.com/api/v2/${country}/apps/${normalizedType}/${Number(limit)}/apps.json`;
  const body = await fetchJson(url);
  const source = {
    id: `apple-chart-${normalizedType}-${country}`,
    type: "apple-public-chart-rss",
    provider: "apple",
    report_type: "public-top-chart",
    url,
    captured_at: nowIso(),
    country,
    chart_type: normalizedType,
  };
  const chartApps = body.feed?.results || [];
  const ids = chartApps.map((app) => app.id).filter(Boolean);
  const lookupApps = ids.length > 0 ? await lookupAppsById(ids, country) : [];
  const byId = new Map(lookupApps.map((app) => [String(app.trackId || ""), app]));

  return {
    source,
    results: chartApps.map((chartApp, index) => {
      const detail = byId.get(String(chartApp.id)) || {
        trackId: chartApp.id,
        trackName: chartApp.name,
        artistName: chartApp.artistName,
        sellerName: chartApp.artistName,
        genres: chartApp.genres || [],
        trackViewUrl: chartApp.url,
      };
      return compactApp(detail, {
        source_id: source.id,
        source_query: normalizedType,
        source_rank: index + 1,
        country,
      });
    }),
  };
}

async function lookupAppsById(ids, country) {
  const apps = [];
  for (let index = 0; index < ids.length; index += 50) {
    const slice = ids.slice(index, index + 50);
    const url = new URL("https://itunes.apple.com/lookup");
    url.searchParams.set("id", slice.join(","));
    url.searchParams.set("country", country.toUpperCase());
    url.searchParams.set("entity", "software");
    const body = await fetchJson(url);
    apps.push(...(body.results || []));
  }
  return apps;
}

async function fetchReviews(appId, country, limit = 25) {
  const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${encodeURIComponent(appId)}/sortby=mostrecent/json`;
  try {
    const body = await fetchJson(url);
    const entries = body.feed?.entry || [];
    const reviews = entries
      .filter((entry) => entry["im:rating"])
      .slice(0, limit)
      .map((entry) => ({
        rating: Number(entry["im:rating"]?.label || 0),
        title: entry.title?.label || "",
        content: entry.content?.label || "",
        updated: entry.updated?.label || "",
      }));

    return {
      source: {
        id: `itunes-reviews-${appId}-${country}`,
        type: "itunes-customer-reviews-rss",
        provider: "apple",
        report_type: "public-review-rss",
        url,
        captured_at: nowIso(),
        app_id: String(appId),
        country,
      },
      reviews,
    };
  } catch (error) {
    return {
      source: {
        id: `itunes-reviews-${appId}-${country}`,
        type: "itunes-customer-reviews-rss",
        provider: "apple",
        report_type: "public-review-rss",
        url,
        captured_at: nowIso(),
        app_id: String(appId),
        country,
        error: error.message,
      },
      reviews: [],
    };
  }
}

function compactApp(app, context) {
  return {
    app_id: String(app.trackId || ""),
    app_name: app.trackName || "",
    publisher: app.sellerName || app.artistName || "",
    bundle_id: app.bundleId || "",
    primary_genre: app.primaryGenreName || "",
    genres: app.genres || [],
    price: app.price || 0,
    formatted_price: app.formattedPrice || "",
    average_rating: app.averageUserRating || 0,
    rating_count: app.userRatingCount || 0,
    current_version_rating: app.averageUserRatingForCurrentVersion || 0,
    current_version_rating_count: app.userRatingCountForCurrentVersion || 0,
    description: app.description || "",
    url: app.trackViewUrl || appStoreUrl(app.trackId, context.country),
    source_id: context.source_id,
    source_query: context.source_query,
    source_rank: context.source_rank,
  };
}

function dedupeApps(apps) {
  const byId = new Map();
  for (const app of apps) {
    const appId = String(app.app_id || "");
    if (!appId) continue;
    const current = byId.get(appId);
    if (!current) {
      byId.set(appId, {
        ...app,
        source_ids: [app.source_id].filter(Boolean),
        source_queries: [app.source_query].filter(Boolean),
        best_source_rank: Number.isFinite(Number(app.source_rank)) ? Number(app.source_rank) : null,
      });
    } else {
      if (app.source_id && !current.source_ids.includes(app.source_id)) current.source_ids.push(app.source_id);
      if (app.source_query && !current.source_queries.includes(app.source_query)) current.source_queries.push(app.source_query);
      if (Number.isFinite(Number(app.source_rank))) {
        current.best_source_rank = current.best_source_rank === null
          ? Number(app.source_rank)
          : Math.min(current.best_source_rank, Number(app.source_rank));
      }
    }
  }

  return [...byId.values()].sort((left, right) => {
    const ratingDiff = (right.rating_count || 0) - (left.rating_count || 0);
    if (ratingDiff !== 0) return ratingDiff;
    const rankDiff = (left.best_source_rank || 9999) - (right.best_source_rank || 9999);
    if (rankDiff !== 0) return rankDiff;
    return String(left.app_name).localeCompare(String(right.app_name));
  });
}

const clusterRules = [
  {
    cluster: "Language learning / vocabulary",
    terms: ["language", "english", "ielts", "speaking", "pronunciation", "vocabulary", "duolingo", "elsa", "speak"],
    buildability: 6,
    novelty: 6,
    defaultWedges: [
      "Exam-specific speaking drills with feedback loops instead of a generic language app.",
      "Pronunciation repair for one narrow learner group or accent problem.",
      "Daily vocabulary retention for a specific test, job, or travel context.",
    ],
  },
  {
    cluster: "AI homework / study solver",
    terms: ["homework", "math", "solver", "study", "ai tutor", "question", "photomath", "gauth", "calculator"],
    buildability: 5,
    novelty: 4,
    defaultWedges: [
      "Mistake review after practice instead of direct answer solving.",
      "Parent-visible practice assistant with anti-cheating constraints.",
      "Single-subject remediation for repeated weak concepts.",
    ],
  },
  {
    cluster: "Test prep / driving",
    terms: ["dmv", "permit", "driving", "test prep", "exam", "practice test"],
    buildability: 8,
    novelty: 5,
    defaultWedges: [
      "State-specific weak-area repetition with plain-language explanations.",
      "One-week test sprint with daily progress and missed-question review.",
    ],
  },
  {
    cluster: "Kids learning / school",
    terms: ["kids", "child", "reading", "abc", "school", "parent", "classroom", "teacher"],
    buildability: 5,
    novelty: 5,
    defaultWedges: [
      "Parent-child five-minute practice routine with no account requirement.",
      "Single-skill early literacy drills with offline progress.",
    ],
  },
  {
    cluster: "Music / creative learning",
    terms: ["piano", "guitar", "music", "drawing", "art", "sing", "creative", "practice"],
    buildability: 6,
    novelty: 6,
    defaultWedges: [
      "Micro-practice for one instrument skill such as chord transitions.",
      "Daily drawing reps with measurable repetition rather than broad lessons.",
    ],
  },
  {
    cluster: "Brain training / microlearning",
    terms: ["brain", "microlearning", "flashcard", "quiz", "memory", "learn", "summary", "headway", "blinkist"],
    buildability: 7,
    novelty: 5,
    defaultWedges: [
      "Single-topic microlearning streaks for one practical skill.",
      "Reflection prompts that turn summaries into recall and action.",
    ],
  },
  {
    cluster: "Plant / nature ID",
    terms: ["plant", "plants", "plant id", "identifier", "garden", "nature", "bird", "mushroom"],
    buildability: 7,
    novelty: 6,
    defaultWedges: [
      "Pet-safe plant decisions for cat and dog owners.",
      "Local-first plant routine for users who already know their plants.",
    ],
  },
];

function classifyCluster(app) {
  const text = `${app.app_name} ${app.source_query} ${app.primary_genre} ${(app.genres || []).join(" ")} ${app.description}`.toLowerCase();
  const match = clusterRules.find((rule) => rule.terms.some((term) => text.includes(term)));
  if (match) return match;

  const query = app.source_query && !["top-free", "top-paid", "top-grossing"].includes(app.source_query)
    ? app.source_query
    : app.primary_genre || "Public app scan";
  return {
    cluster: titleize(query),
    terms: [],
    buildability: 6,
    novelty: 5,
    defaultWedges: [
      "Narrow the audience and user job before promoting this public scan cluster.",
    ],
  };
}

function titleize(value) {
  return String(value || "Public app scan")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

const complaintPatterns = [
  { key: "pricing_subscription", terms: ["price", "paid", "subscription", "trial", "charge", "expensive", "cancel", "paywall"] },
  { key: "accuracy_quality", terms: ["wrong", "inaccurate", "accuracy", "incorrect", "bad answer", "quality", "mistake"] },
  { key: "ads_upsell", terms: ["ad", "ads", "upsell", "premium"] },
  { key: "usability", terms: ["confusing", "hard", "slow", "crash", "bug", "login"] },
  { key: "missing_depth", terms: ["missing", "wish", "need", "doesn't have", "not enough", "limited"] },
];

function countPattern(text, pattern) {
  const normalized = text.toLowerCase();
  return pattern.terms.reduce((count, term) => count + (normalized.includes(term) ? 1 : 0), 0);
}

function analyzeReviews(reviewSets) {
  const allReviews = reviewSets.flatMap((set) => set.reviews.map((review) => ({ ...review, app_id: set.app_id, app_name: set.app_name })));
  const lowReviews = allReviews.filter((review) => review.rating > 0 && review.rating <= 3);
  const themes = complaintPatterns.map((pattern) => {
    const matches = lowReviews.filter((review) => countPattern(`${review.title}\n${review.content}`, pattern) > 0);
    return {
      theme: pattern.key,
      count: matches.length,
      examples: matches.slice(0, 3).map((review) => ({
        app_name: review.app_name,
        rating: review.rating,
        title: review.title,
      })),
    };
  }).sort((left, right) => right.count - left.count);

  return {
    review_count: allReviews.length,
    low_review_count: lowReviews.length,
    themes,
  };
}

function appSignal(app, context) {
  return compactObject({
    schema_version: 1,
    source_id: app.source_id,
    provider: "apple",
    report_type: app.source_id?.startsWith("apple-chart") ? "public-top-chart" : "public-search",
    signal_type: "app_metric",
    captured_at: context.generatedAt,
    category: app.primary_genre || context.category,
    market: context.market,
    platform: context.platform,
    cluster: classifyCluster(app).cluster,
    app_name: app.app_name,
    app_id: app.app_id,
    publisher: app.publisher,
    bundle_id: app.bundle_id,
    keyword: app.source_query,
    rank: app.source_rank,
    rating: app.average_rating,
    rating_count: app.rating_count,
    price: app.price,
    url: app.url,
    note: app.source_id?.startsWith("apple-chart")
      ? `Public Apple chart result for ${app.source_query}.`
      : `Public iTunes Search result for ${app.source_query}.`,
    directional_score: appDirectionalScore(app),
  });
}

function reviewSignal(review, reviewSet, context) {
  const themes = complaintPatterns
    .filter((pattern) => countPattern(`${review.title}\n${review.content}`, pattern) > 0)
    .map((pattern) => pattern.key);
  return compactObject({
    schema_version: 1,
    source_id: reviewSet.source.id,
    provider: "apple",
    report_type: "public-review-rss",
    signal_type: "market_note",
    captured_at: context.generatedAt,
    category: context.category,
    market: context.market,
    platform: context.platform,
    app_name: reviewSet.app_name,
    app_id: reviewSet.app_id,
    note: review.title || "Public low-rating review",
    evidence: themes.length > 0 ? `Low-rating review themes: ${themes.join(", ")}` : "Low-rating public review.",
    rating: review.rating,
    directional_score: review.rating <= 2 ? 75 : 62,
  });
}

function appDirectionalScore(app) {
  let score = 20;
  if (app.rating_count) score += Math.min(35, Math.log1p(Math.max(0, app.rating_count)) * 4);
  if (app.average_rating >= 4.5) score += 8;
  if (app.average_rating > 0 && app.average_rating < 4) score += 8;
  if (Number.isFinite(Number(app.source_rank)) && Number(app.source_rank) > 0) score += Math.max(0, 25 - Number(app.source_rank));
  if (app.price > 0) score += 4;
  return Math.round(Math.max(1, Math.min(100, score)));
}

function aggregateClusters(apps, reviewAnalysis) {
  const clusters = new Map();
  for (const app of apps) {
    const rule = classifyCluster(app);
    const current = clusters.get(rule.cluster) || {
      cluster: rule.cluster,
      app_count: 0,
      rating_count: 0,
      average_rating_weighted_sum: 0,
      best_rank_sum: 0,
      ranked_apps: 0,
      top_apps: [],
      source_ids: new Set(),
      rule,
    };

    current.app_count += 1;
    current.rating_count += app.rating_count || 0;
    current.average_rating_weighted_sum += (app.average_rating || 0) * Math.max(1, app.rating_count || 1);
    if (Number.isFinite(Number(app.best_source_rank))) {
      current.best_rank_sum += Number(app.best_source_rank);
      current.ranked_apps += 1;
    }
    for (const sourceId of app.source_ids || []) current.source_ids.add(sourceId);
    current.top_apps.push(app);
    clusters.set(rule.cluster, current);
  }

  const maxRatingCount = Math.max(...[...clusters.values()].map((cluster) => cluster.rating_count), 1);
  return [...clusters.values()].map((cluster) => {
    const demand = scoreFromPositive(cluster.rating_count, maxRatingCount);
    const rankSignal = cluster.ranked_apps > 0 ? Math.max(1, Math.min(10, Math.round(11 - (cluster.best_rank_sum / cluster.ranked_apps)))) : 3;
    const reviewPain = Math.min(10, Math.max(1, 1 + reviewAnalysis.low_review_count));
    const competitionGap = competitionGapScore(cluster.app_count);
    const risk = riskScore(cluster.cluster);
    const weighted =
      demand * 1.4 +
      rankSignal * 1.2 +
      reviewPain * 1.1 +
      competitionGap * 1.1 +
      cluster.rule.buildability * 1.4 +
      cluster.rule.novelty * 1.0 +
      (11 - risk) * 0.8;

    return {
      cluster: cluster.cluster,
      app_count: cluster.app_count,
      rating_count: cluster.rating_count,
      average_rating: cluster.rating_count > 0 ? round(cluster.average_rating_weighted_sum / cluster.rating_count, 2) : 0,
      best_average_rank: cluster.ranked_apps > 0 ? round(cluster.best_rank_sum / cluster.ranked_apps, 2) : null,
      top_apps: cluster.top_apps
        .slice()
        .sort((left, right) => (right.rating_count || 0) - (left.rating_count || 0))
        .slice(0, 8)
        .map((app) => ({
          app_name: app.app_name,
          publisher: app.publisher,
          rating_count: app.rating_count,
          average_rating: app.average_rating,
          best_source_rank: app.best_source_rank,
          source_queries: app.source_queries,
        })),
      source_ids: [...cluster.source_ids],
      scores: {
        demand,
        revenue_signal: 1,
        growth_signal: 1,
        engagement_signal: demand,
        competition_gap: competitionGap,
        buildability: cluster.rule.buildability,
        novelty: cluster.rule.novelty,
        review_pain: reviewPain,
        risk,
        total: Math.round((weighted / 80) * 100),
      },
      interpretation: "Public-only signal from App Store search/chart visibility, ratings, and review probes. Pair with stronger metric or keyword evidence before backlog readiness.",
      wedge_hypotheses: cluster.rule.defaultWedges,
    };
  }).sort((left, right) => right.scores.total - left.scores.total);
}

function scoreFromPositive(value, maxValue) {
  if (maxValue <= 0) return 1;
  const score = 1 + (9 * Math.log1p(Math.max(0, value))) / Math.log1p(maxValue);
  return Math.max(1, Math.min(10, Math.round(score)));
}

function competitionGapScore(appCount) {
  if (appCount <= 3) return 8;
  if (appCount <= 8) return 7;
  if (appCount <= 15) return 5;
  if (appCount <= 25) return 4;
  return 3;
}

function riskScore(cluster) {
  const normalized = cluster.toLowerCase();
  if (normalized.includes("kids")) return 7;
  if (normalized.includes("homework")) return 7;
  if (normalized.includes("finance") || normalized.includes("health")) return 8;
  return 4;
}

function buildOpportunities(clusters, context) {
  return clusters.map((cluster, index) => ({
    rank: index + 1,
    cluster: cluster.cluster,
    category: context.category,
    market: context.market,
    platform: context.platform,
    metric_snapshot: {
      app_count: cluster.app_count,
      revenue: 0,
      revenue_growth: 0,
      downloads: 0,
      download_growth: 0,
      dau: 0,
      dau_growth: 0,
      rating_count: cluster.rating_count,
      average_rating: cluster.average_rating,
      best_average_rank: cluster.best_average_rank,
    },
    public_scan: {
      source: "research-public-app-scan",
      rating_count: cluster.rating_count,
      average_rating: cluster.average_rating,
      best_average_rank: cluster.best_average_rank,
      top_apps: cluster.top_apps.slice(0, 5),
    },
    scores: cluster.scores,
    top_apps: cluster.top_apps.slice(0, 5),
    wedge_hypotheses: cluster.wedge_hypotheses,
    evidence_sources: cluster.source_ids,
    status: cluster.scores.total >= 58 ? "promising" : "watchlist",
    next_research: "Run gap research for this cluster, inspect public reviews, and add imported keyword/metric evidence before promoting a backlog candidate.",
  }));
}

function mergeSourceInventory(researchDir, sources) {
  const filePath = path.join(researchDir, "source-inventory.json");
  const inventory = fs.existsSync(filePath)
    ? readJson(filePath)
    : { schema_version: 1, sources: [] };
  const byId = new Map((inventory.sources || []).map((source) => [source.id, source]));
  for (const source of sources) byId.set(source.id, source);

  writeJson(filePath, {
    ...inventory,
    generated_at: nowIso(),
    sources: [...byId.values()],
  });
}

function mergeMarketSignals(researchDir, signals) {
  const filePath = path.join(researchDir, "market-signals.jsonl");
  const incomingSourceIds = new Set(signals.map((signal) => signal.source_id).filter(Boolean));
  const retained = readJsonl(filePath).filter((signal) => !incomingSourceIds.has(signal.source_id));
  writeJsonl(filePath, [...retained, ...signals]);
}

function mergeNormalizedApps(researchDir, apps) {
  const filePath = path.join(researchDir, "normalized-apps.jsonl");
  const retained = readJsonl(filePath).filter((app) => app.source !== "public-app-scan");
  const rows = apps.map((app) => compactObject({
    source: "public-app-scan",
    app_name: app.app_name,
    app_id: app.app_id,
    publisher: app.publisher,
    platform: "App Store",
    category: app.primary_genre,
    market: null,
    cluster: classifyCluster(app).cluster,
    source_id: app.source_ids?.join(","),
    rating_count: app.rating_count,
    average_rating: app.average_rating,
    best_source_rank: app.best_source_rank,
    source_queries: app.source_queries,
    url: app.url,
  }));
  writeJsonl(filePath, [...retained, ...rows]);
}

function writeClusters(researchDir, context, clusters) {
  const publicClusters = {
    schema_version: 1,
    generated_at: context.generatedAt,
    category: context.category,
    market: context.market,
    source: "public-app-scan",
    clusters,
  };
  writeJson(path.join(researchDir, "public-scan-clusters.json"), publicClusters);

  const canonicalPath = path.join(researchDir, "clusters.json");
  if (!fs.existsSync(canonicalPath)) {
    writeJson(canonicalPath, publicClusters);
  }
}

function mergeOpportunities(researchDir, context, opportunities) {
  const filePath = path.join(researchDir, "opportunities.json");
  const existing = fs.existsSync(filePath)
    ? readJson(filePath)
    : { schema_version: 1, generated_at: context.generatedAt, category: context.category, market: context.market, opportunities: [] };

  const byCluster = new Map((existing.opportunities || []).map((opportunity) => [opportunity.cluster, opportunity]));
  for (const opportunity of opportunities) {
    const current = byCluster.get(opportunity.cluster);
    if (!current) {
      byCluster.set(opportunity.cluster, opportunity);
      continue;
    }

    byCluster.set(opportunity.cluster, {
      ...current,
      evidence_sources: [...new Set([...(current.evidence_sources || []), ...(opportunity.evidence_sources || [])])],
      public_scan: opportunity.public_scan,
      top_apps: current.top_apps?.length ? current.top_apps : opportunity.top_apps,
      wedge_hypotheses: current.wedge_hypotheses?.length ? current.wedge_hypotheses : opportunity.wedge_hypotheses,
      next_research: current.next_research || opportunity.next_research,
    });
  }

  const merged = [...byCluster.values()].sort((left, right) => {
    const leftRank = Number.isFinite(Number(left.rank)) ? Number(left.rank) : Number.MAX_SAFE_INTEGER;
    const rightRank = Number.isFinite(Number(right.rank)) ? Number(right.rank) : Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return (right.scores?.total || 0) - (left.scores?.total || 0);
  });

  merged.forEach((opportunity, index) => {
    opportunity.rank = index + 1;
  });

  writeJson(filePath, {
    ...existing,
    generated_at: context.generatedAt,
    category: existing.category || context.category,
    market: existing.market || context.market,
    opportunities: merged,
  });
}

function ensureBacklogCandidates(researchDir, context) {
  const filePath = path.join(researchDir, "backlog-candidates.json");
  if (fs.existsSync(filePath)) return;
  writeJson(filePath, {
    schema_version: 1,
    generated_at: context.generatedAt,
    candidates: [],
    notes: "Public scan does not emit ready candidates by itself. Run gap research and review candidates before backlog upsert.",
  });
}

function renderSummaryMarkdown({ context, queries, sources, apps, clusters, reviewAnalysis, outputDir }) {
  const topClusters = clusters.slice(0, 6);
  const lines = [
    `# Public App Scan: ${context.category} / ${context.market}`,
    "",
    "## Scope",
    "",
    `- Queries: ${queries.length ? queries.join(", ") : "none"}`,
    `- Sources: ${sources.length}`,
    `- Apps: ${apps.length}`,
    `- Reviews fetched: ${reviewAnalysis.review_count}`,
    "",
    "## Source Notes",
    "",
    "This is public-only evidence from Apple public endpoints. Treat it as a discovery pass, not proof of revenue, downloads, or market size.",
    "",
    "## Top Clusters",
    "",
    "| Rank | Cluster | Apps | Rating Count | Avg Rating | Best Avg Rank | Score |",
    "|---:|---|---:|---:|---:|---:|---:|",
    ...topClusters.map((cluster, index) => `| ${index + 1} | ${escapePipe(cluster.cluster)} | ${cluster.app_count} | ${integer(cluster.rating_count)} | ${cluster.average_rating} | ${cluster.best_average_rank ?? ""} | ${cluster.scores.total} |`),
    "",
    "## Review Theme Probe",
    "",
    `Fetched ${reviewAnalysis.review_count} public review entries; ${reviewAnalysis.low_review_count} were rating <= 3.`,
    "",
    ...reviewAnalysis.themes.slice(0, 5).map((theme) => `- ${theme.theme}: ${theme.count} low-rating mentions`),
    "",
    "## Recommended Follow-Up",
    "",
    ...topClusters.flatMap((cluster, index) => [
      `### ${index + 1}. ${cluster.cluster}`,
      "",
      `Signal: ${cluster.interpretation}`,
      "",
      "Possible wedges:",
      ...cluster.wedge_hypotheses.map((wedge) => `- ${wedge}`),
      "",
      "Visible apps:",
      ...cluster.top_apps.slice(0, 3).map((app) => `- ${app.app_name}: ratings ${integer(app.rating_count)}, avg ${round(app.average_rating, 2)}, rank ${app.best_source_rank ?? ""}`),
      "",
    ]),
    "## Output Files",
    "",
    `- ${path.join(outputDir, "source-inventory.json")}`,
    `- ${path.join(outputDir, "market-signals.jsonl")}`,
    `- ${path.join(outputDir, "public-scan-summary.json")}`,
    `- ${path.join(outputDir, "public-scan-summary.md")}`,
  ];

  return `${lines.join("\n")}\n`;
}

function writeDecisionIfMissing(researchDir, context, clusters) {
  const filePath = path.join(researchDir, "decision.md");
  if (fs.existsSync(filePath)) return;
  const top = clusters[0];
  const lines = [
    `# App Opportunity Research: ${context.category} / ${context.market}`,
    "",
    "## Executive Takeaway",
    "",
    top
      ? `Public scan found ${top.cluster} as the highest directional cluster with score ${top.scores.total}. This is not enough for backlog readiness without gap research and stronger source evidence.`
      : "Public scan did not find enough app evidence.",
    "",
    "## Backlog Handoff",
    "",
    "Run `scripts/research-app-store-gap.mjs` for the most relevant cluster before upserting candidates into `ideas/backlog.json`.",
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function defaultQueries(theme) {
  const normalized = String(theme || "").toLowerCase();
  if (normalized.includes("education") || normalized.includes("learning")) {
    return [
      "ielts speaking",
      "pronunciation coach",
      "vocabulary builder",
      "ai study planner",
      "dmv practice test",
      "kids reading practice",
    ];
  }
  if (normalized.includes("language")) {
    return ["ielts speaking", "english pronunciation", "vocabulary builder", "speaking practice"];
  }
  if (normalized.includes("b2c")) {
    return ["habit tracker", "budget planner", "home inventory", "meal planner", "study planner"];
  }
  return [];
}

function parseQueries(args) {
  const explicit = args.queries
    ? String(args.queries).split(",").map((query) => query.trim()).filter(Boolean)
    : [];
  const defaults = defaultQueries(args.theme);
  return [...new Set([...explicit, ...defaults])];
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/research-public-app-scan.mjs \\
    --output-dir /path/to/research-runs/YYYY-MM-DD/education-us \\
    --theme education \\
    --market US \\
    [--queries "ielts speaking,pronunciation coach"] \\
    [--include-top-chart]

Purpose:
  Start or enrich an app opportunity research pack using only public Apple
  endpoints: iTunes Search API, public review RSS, and optional Apple public
  top chart RSS.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const outputDir = path.resolve(requireValue("--output-dir", args["output-dir"]));
  const market = args.market || "US";
  const country = countryFromMarket(market);
  const category = args.category || (args.theme ? titleize(args.theme) : "Unknown");
  const platform = args.platform || "App Store";
  const generatedAt = nowIso();
  const queries = parseQueries(args);
  const includeTopChart = boolValue(args["include-top-chart"], false);

  if (queries.length === 0 && !includeTopChart) {
    throw new Error("Provide --queries, --theme, or --include-top-chart");
  }

  const context = {
    category,
    market,
    platform,
    generatedAt,
  };

  fs.mkdirSync(outputDir, { recursive: true });

  const searchSets = [];
  for (const query of queries) {
    searchSets.push(await searchApps(query, country, Number(args.limit || 10)));
  }

  if (includeTopChart) {
    searchSets.push(await fetchTopChart(country, args["chart-type"] || "top-free", Number(args["chart-limit"] || 25)));
  }

  const flatApps = searchSets.flatMap((set) => set.results);
  const apps = dedupeApps(flatApps).slice(0, Number(args["max-apps"] || 80));
  const reviewSets = [];
  for (const app of apps.slice(0, Number(args["review-apps"] ?? 5))) {
    const reviewResult = await fetchReviews(app.app_id, country, Number(args["review-limit"] || 20));
    reviewSets.push({
      app_id: app.app_id,
      app_name: app.app_name,
      ...reviewResult,
    });
  }

  const reviewAnalysis = analyzeReviews(reviewSets);
  const appSignals = flatApps.map((app) => appSignal(app, context));
  const reviewSignals = reviewSets.flatMap((set) => set.reviews
    .filter((review) => review.rating > 0 && review.rating <= 3)
    .slice(0, Number(args["review-signal-limit"] || 20))
    .map((review) => reviewSignal(review, set, context)));
  const signals = [...appSignals, ...reviewSignals];
  const sources = [
    ...searchSets.map((set) => set.source),
    ...reviewSets.map((set) => set.source),
  ];
  const clusters = aggregateClusters(apps, reviewAnalysis);
  const opportunities = buildOpportunities(clusters, context);
  const summary = {
    schema_version: 1,
    generated_at: generatedAt,
    category,
    market,
    platform,
    queries,
    sources,
    app_count: apps.length,
    signal_count: signals.length,
    review_analysis: reviewAnalysis,
    clusters,
    opportunities,
  };

  mergeSourceInventory(outputDir, sources);
  mergeMarketSignals(outputDir, signals);
  mergeNormalizedApps(outputDir, apps);
  writeClusters(outputDir, context, clusters);
  mergeOpportunities(outputDir, context, opportunities);
  ensureBacklogCandidates(outputDir, context);
  writeJson(path.join(outputDir, "public-scan-summary.json"), summary);
  fs.writeFileSync(
    path.join(outputDir, "public-scan-summary.md"),
    renderSummaryMarkdown({ context, queries, sources, apps, clusters, reviewAnalysis, outputDir }),
  );
  writeDecisionIfMissing(outputDir, context, clusters);

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "complete",
        output_dir: outputDir,
        query_count: queries.length,
        source_count: sources.length,
        app_count: apps.length,
        signal_count: signals.length,
        review_count: reviewAnalysis.review_count,
        top_clusters: opportunities.slice(0, 5).map((opportunity) => ({
          cluster: opportunity.cluster,
          score: opportunity.scores.total,
          rating_count: opportunity.metric_snapshot.rating_count,
          app_count: opportunity.metric_snapshot.app_count,
        })),
        output: path.join(outputDir, "public-scan-summary.md"),
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
