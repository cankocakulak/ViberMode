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

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function researchRunRef(researchDir) {
  const parts = path.resolve(researchDir).split(path.sep);
  const researchRunsIndex = parts.lastIndexOf("research-runs");
  if (researchRunsIndex >= 0) {
    return parts.slice(researchRunsIndex).join("/");
  }
  return path.basename(researchDir);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function nowIso() {
  return new Date().toISOString();
}

function countryFromMarket(market) {
  return String(market || "US").toLowerCase();
}

function appStoreUrl(appId, country) {
  return `https://apps.apple.com/${country}/app/id${appId}`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ViberModeAppResearch/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.json();
}

async function searchApps(query, country, limit) {
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
      url: url.toString(),
      captured_at: nowIso(),
      query,
      country,
    },
    results: body.results || [],
  };
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

function loadOpportunity(researchDir, clusterName) {
  const opportunitiesPath = path.join(researchDir, "opportunities.json");
  const opportunities = readJson(opportunitiesPath).opportunities || [];
  const normalized = String(clusterName || "").toLowerCase();
  const opportunity = opportunities.find((item) => item.cluster.toLowerCase() === normalized)
    || opportunities.find((item) => slugify(item.cluster) === slugify(clusterName))
    || opportunities[0];

  if (!opportunity) {
    throw new Error(`No opportunities found in ${opportunitiesPath}`);
  }

  return opportunity;
}

function clusterTerms(clusterName) {
  const normalized = String(clusterName || "").toLowerCase();
  const terms = new Set(
    normalized
      .split(/[^a-z0-9]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 4),
  );

  if (normalized.includes("language")) {
    ["english", "speaking", "pronunciation", "vocabulary", "ielts", "language"].forEach((term) => terms.add(term));
  }
  if (normalized.includes("test prep") || normalized.includes("driving")) {
    ["test", "prep", "exam", "practice", "dmv", "permit", "driving"].forEach((term) => terms.add(term));
  }
  if (normalized.includes("kids")) {
    ["kids", "child", "reading", "school", "parent", "early"].forEach((term) => terms.add(term));
  }
  if (normalized.includes("music") || normalized.includes("creative")) {
    ["music", "piano", "guitar", "drawing", "practice", "creative"].forEach((term) => terms.add(term));
  }
  if (normalized.includes("plant") || normalized.includes("nature")) {
    ["plant", "care", "scanner", "identifier", "pet", "toxic"].forEach((term) => terms.add(term));
  }

  return [...terms];
}

function marketSignalMatchScore(signal, terms) {
  const keywordText = `${signal.keyword || ""} ${signal.app_name || ""}`.toLowerCase();
  const bodyText = `${signal.cluster || ""} ${signal.category || ""} ${signal.note || ""} ${signal.evidence || ""}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (keywordText.includes(term)) score += 2;
    if (bodyText.includes(term)) score += 1;
  }
  return score;
}

function loadMarketSignals(researchDir, clusterName) {
  const signalPath = path.join(researchDir, "market-signals.jsonl");
  const signals = readJsonl(signalPath);
  if (signals.length === 0) return [];

  const terms = clusterTerms(clusterName);
  const scored = signals
    .map((signal) => ({
      ...signal,
      match_score: marketSignalMatchScore(signal, terms),
    }))
    .filter((signal) => signal.match_score > 0);

  const pool = scored.length > 0 ? scored : signals;
  return pool
    .sort((left, right) => {
      const matchDiff = (right.match_score || 0) - (left.match_score || 0);
      if (matchDiff !== 0) return matchDiff;
      return (right.directional_score || 0) - (left.directional_score || 0);
    })
    .slice(0, 30);
}

function defaultQueriesForCluster(opportunity) {
  const cluster = opportunity.cluster.toLowerCase();
  if (cluster.includes("plant") || cluster.includes("nature")) {
    return ["plant identifier", "plant care", "plant disease", "pet safe plants", "plant scanner"];
  }
  if (cluster.includes("music") || cluster.includes("creative")) {
    return ["learn piano", "learn guitar", "drawing lessons", "music practice"];
  }
  if (cluster.includes("language")) {
    return ["language learning", "english speaking", "vocabulary builder", "pronunciation coach"];
  }
  if (cluster.includes("driving") || cluster.includes("test prep")) {
    return ["dmv practice test", "permit test", "driving test prep"];
  }
  if (cluster.includes("kids")) {
    return ["kids learning", "early reading", "school parent", "learning games kids"];
  }
  return [opportunity.cluster];
}

function compactApp(app, query, country) {
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
    url: app.trackViewUrl || appStoreUrl(app.trackId, country),
    source_query: query,
  };
}

function dedupeApps(searchSets) {
  const byId = new Map();
  for (const searchSet of searchSets) {
    for (const app of searchSet.results) {
      const appId = String(app.trackId || "");
      if (!appId) continue;
      const current = byId.get(appId);
      if (!current) {
        byId.set(appId, compactApp(app, searchSet.source.query, searchSet.source.country));
      } else {
        current.source_query = `${current.source_query}, ${searchSet.source.query}`;
      }
    }
  }
  return [...byId.values()].sort((left, right) => {
    const ratingDiff = (right.rating_count || 0) - (left.rating_count || 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (right.average_rating || 0) - (left.average_rating || 0);
  });
}

const positioningPatterns = [
  { key: "identifier", terms: ["identify", "identifier", "scanner", "scan", "recognition"] },
  { key: "care", terms: ["care", "watering", "water", "light", "reminder", "diagnosis"] },
  { key: "disease", terms: ["disease", "sick", "diagnose", "diagnosis", "doctor", "health"] },
  { key: "community", terms: ["community", "expert", "botanist", "ask"] },
  { key: "pet_safety", terms: ["pet", "cat", "dog", "toxic", "poison", "safe"] },
  { key: "kids_family", terms: ["kid", "child", "family", "parent"] },
  { key: "offline_local", terms: ["offline", "private", "local"] },
];

const complaintPatterns = [
  { key: "pricing_subscription", terms: ["price", "paid", "subscription", "trial", "charge", "expensive", "cancel"] },
  { key: "accuracy", terms: ["wrong", "inaccurate", "accuracy", "incorrect", "misidentified", "identify"] },
  { key: "ads_upsell", terms: ["ad", "ads", "paywall", "upsell"] },
  { key: "usability", terms: ["confusing", "hard", "slow", "crash", "bug"] },
  { key: "missing_specific_job", terms: ["pet", "toxic", "safe", "reminder", "disease", "care"] },
];

function countPattern(text, pattern) {
  const normalized = text.toLowerCase();
  return pattern.terms.reduce((count, term) => count + (normalized.includes(term) ? 1 : 0), 0);
}

function analyzePositioning(apps) {
  const coverage = Object.fromEntries(positioningPatterns.map((pattern) => [pattern.key, 0]));
  const examples = Object.fromEntries(positioningPatterns.map((pattern) => [pattern.key, []]));

  for (const app of apps) {
    const text = `${app.app_name}\n${app.description}`;
    for (const pattern of positioningPatterns) {
      if (countPattern(text, pattern) > 0) {
        coverage[pattern.key] += 1;
        if (examples[pattern.key].length < 5) examples[pattern.key].push(app.app_name);
      }
    }
  }

  return { coverage, examples };
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

function buildCandidates({ opportunity, apps, positioning, reviews, sources, marketSignals = [] }) {
  const cluster = opportunity.cluster;
  const metricSnapshot = opportunity.metric_snapshot;
  const competitors = apps.slice(0, 5).map((app) => app.app_name).filter(Boolean);
  const marketSignalSources = marketSignals.map((signal) => signal.source_id).filter(Boolean);
  const evidenceSources = [...new Set([...(opportunity.evidence_sources || []), ...sources.map((source) => source.id), ...marketSignalSources])];
  const now = nowIso();

  if (cluster.toLowerCase().includes("plant")) {
    const petCoverage = positioning.coverage.pet_safety || 0;
    const careCoverage = positioning.coverage.care || 0;
    const offlineCoverage = positioning.coverage.offline_local || 0;
    const pricingComplaints = reviews.themes.find((theme) => theme.theme === "pricing_subscription")?.count || 0;
    const accuracyComplaints = reviews.themes.find((theme) => theme.theme === "accuracy")?.count || 0;
    const petCoverageRatio = apps.length ? petCoverage / apps.length : 1;
    const offlineCoverageRatio = apps.length ? offlineCoverage / apps.length : 1;

    if (petCoverageRatio <= 0.35) {
      return [
        {
          id: "pet-safe-plant-scanner",
          rank: 1,
          status: "ready",
          title: "Pet-Safe Plant Scanner",
          app_name: "Pet-Safe Plants",
          repo_slug: "pet-safe-plants",
          bundle_id_slug: "petsafeplants",
          platform: "ios",
          stack: "SwiftUI",
          category: opportunity.category,
          cluster,
          summary: "A narrow plant scanner/search app focused on whether houseplants are safe for cats and dogs.",
          target_user: "Pet owners who buy, receive, or identify houseplants and need a quick safety decision.",
          specific_gap: `The cluster shows strong revenue and growth, but pet-safety positioning appeared in only ${petCoverage} of ${apps.length} searched apps while broad care appeared in ${careCoverage}.`,
          mvp_wedge: "Search or scan a plant, show cat/dog toxicity status, save a pet-safe home list, and add care reminders only after the safety decision.",
          why_now: `Structured source shows ${cluster} with revenue ${money(metricSnapshot.revenue)} and revenue growth ${money(metricSnapshot.revenue_growth)}; live search confirms active competitors but weak pet-safety positioning.`,
          product_idea:
            "Build a SwiftUI iOS app called Pet-Safe Plants. The MVP should let users search or add a plant, mark whether it is safe or toxic for cats and dogs, save plants into a home list, show a clear safety status, add a simple care reminder, persist data locally, and include empty states plus unit tests for the plant safety list view model.",
          scores: {
            total: Math.min(92, opportunity.scores.total + 5 + (pricingComplaints > 0 ? 2 : 0)),
            demand: opportunity.scores.demand,
            revenue_signal: opportunity.scores.revenue_signal,
            growth_signal: opportunity.scores.growth_signal,
            engagement_signal: opportunity.scores.engagement_signal,
            competition_gap: 8,
            buildability: 8,
            novelty: 8,
            monetization: 6,
            risk: 4,
          },
          evidence_sources: evidenceSources,
          competitors,
          metric_snapshot: metricSnapshot,
          research: {
            updated_at: now,
            research_run: null,
            signals: [
              {
                type: "structured-metrics",
                summary: `${cluster} scored ${opportunity.scores.total} with positive revenue/download growth.`,
                confidence: "medium",
              },
              {
                type: "live-search-positioning",
                summary: `Pet-safety positioning is under-covered in live competitor descriptions.`,
                confidence: "medium",
              },
            ],
          },
          factory: {
            status: "queued",
          },
        },
      ];
    }

    if (offlineCoverageRatio <= 0.35 && (pricingComplaints > 0 || accuracyComplaints > 0)) {
      return [
        {
          id: "local-plant-care-log",
          rank: 1,
          status: "ready",
          title: "Local Plant Care Log",
          app_name: "Plant Routine",
          repo_slug: "plant-routine",
          bundle_id_slug: "plantroutine",
          platform: "ios",
          stack: "SwiftUI",
          category: opportunity.category,
          cluster,
          summary: "A no-account plant care log for people who already own plants and want routines without scanner subscriptions.",
          target_user: "Houseplant owners who know their plants but need a simple local routine and care history.",
          specific_gap: `Live competitor descriptions already mention pet safety in ${petCoverage} of ${apps.length} apps, so that is not a clean wedge. Offline/local-first positioning appeared in only ${offlineCoverage} apps, while low-rating reviews surfaced ${pricingComplaints} pricing/subscription and ${accuracyComplaints} accuracy complaints.`,
          mvp_wedge: "Create plants manually, set watering/light/fertilizer routines, log care history locally, and avoid account, scanner, or subscription dependency.",
          why_now: `Structured source shows ${cluster} with revenue ${money(metricSnapshot.revenue)} and revenue growth ${money(metricSnapshot.revenue_growth)}; live reviews point to subscription and accuracy friction in broad plant ID apps.`,
          product_idea:
            "Build a SwiftUI iOS app called Plant Routine. The MVP should let users add houseplants manually, choose basic watering/light/fertilizer routines, log completed care, view overdue plants, keep all data locally with no account, include clear empty states, and add unit tests for the plant routine view model.",
          scores: {
            total: Math.min(91, opportunity.scores.total + 5),
            demand: opportunity.scores.demand,
            revenue_signal: opportunity.scores.revenue_signal,
            growth_signal: opportunity.scores.growth_signal,
            engagement_signal: opportunity.scores.engagement_signal,
            competition_gap: 8,
            buildability: 9,
            novelty: 7,
            monetization: 5,
            risk: 3,
          },
          evidence_sources: evidenceSources,
          competitors,
          metric_snapshot: metricSnapshot,
          research: {
            updated_at: now,
            research_run: null,
            signals: [
              {
                type: "structured-metrics",
                summary: `${cluster} scored ${opportunity.scores.total} with positive revenue/download growth.`,
                confidence: "medium",
              },
              {
                type: "over-covered-hypothesis",
                summary: `Pet-safe plant positioning appeared in ${petCoverage} of ${apps.length} apps, so it should not be promoted as the primary gap.`,
                confidence: "medium",
              },
              {
                type: "review-friction",
                summary: `Low-rating review probe found pricing/subscription and accuracy complaints; a local-first routine app avoids both dependencies.`,
                confidence: "medium",
              },
            ],
          },
          factory: {
            status: "queued",
          },
        },
      ];
    }

    return [
      {
        id: "plant-care-gap-needs-review",
        rank: 1,
        status: "researching",
        title: "Plant Care Gap Needs Review",
        app_name: "Plant Care Focus",
        repo_slug: "plant-care-focus",
        bundle_id_slug: "plantcarefocus",
        platform: "ios",
        stack: "SwiftUI",
        category: opportunity.category,
        cluster,
        summary: "Plant/nature ID has strong metric signals, but this pass did not find a clean narrow wedge.",
        target_user: "Houseplant owners.",
        specific_gap: `Needs manual review. Pet-safety coverage was ${petCoverage}/${apps.length}, care coverage was ${careCoverage}/${apps.length}, and offline/local coverage was ${offlineCoverage}/${apps.length}.`,
        mvp_wedge: "Needs a narrower validated wedge before factory use.",
        why_now: `Structured source shows ${cluster} with revenue ${money(metricSnapshot.revenue)} and revenue growth ${money(metricSnapshot.revenue_growth)}, but live positioning did not validate a ready wedge.`,
        product_idea: "Do not run product-to-code until a narrower wedge is validated.",
        scores: {
          total: opportunity.scores.total,
          demand: opportunity.scores.demand,
          revenue_signal: opportunity.scores.revenue_signal,
          growth_signal: opportunity.scores.growth_signal,
          engagement_signal: opportunity.scores.engagement_signal,
          competition_gap: 4,
          buildability: 7,
          novelty: 4,
          monetization: 5,
          risk: 4,
        },
        evidence_sources: evidenceSources,
        competitors,
        metric_snapshot: metricSnapshot,
        research: {
          updated_at: now,
          research_run: null,
          signals: [
            {
              type: "structured-metrics",
              summary: `${cluster} scored ${opportunity.scores.total} with positive revenue/download growth.`,
              confidence: "medium",
            },
            {
              type: "live-search-positioning",
              summary: "No low-coverage wedge passed the ready gate in this automated pass.",
              confidence: "medium",
            },
          ],
        },
        factory: {
          status: "queued",
        },
      },
    ];
  }

  return [
    {
      id: `${slugify(cluster)}-focused-tool`,
      rank: 1,
      status: "researching",
      title: `${cluster} Focused Tool`,
      app_name: `${cluster} Focus`,
      repo_slug: `${slugify(cluster)}-focus`,
      bundle_id_slug: `${slugify(cluster).replace(/-/g, "")}focus`,
      platform: "ios",
      stack: "SwiftUI",
      category: opportunity.category,
      cluster,
      summary: `Focused candidate for ${cluster}.`,
      specific_gap: "Needs manual gap research before ready status.",
      mvp_wedge: "Needs a narrower validated wedge.",
      why_now: `Structured source scored this cluster ${opportunity.scores.total}.`,
      product_idea: `Build a SwiftUI iOS MVP for a narrow ${cluster} wedge after manual gap validation.`,
      scores: {
        ...opportunity.scores,
        monetization: 5,
      },
      evidence_sources: evidenceSources,
      competitors,
      metric_snapshot: metricSnapshot,
      research: {
        updated_at: now,
        research_run: null,
        signals: [],
      },
      factory: {
        status: "queued",
      },
    },
  ];
}

function isEducationCandidate(candidate) {
  const text = `${candidate.category || ""} ${candidate.cluster || ""} ${candidate.title || ""}`.toLowerCase();
  return [
    "education",
    "language",
    "study",
    "homework",
    "test prep",
    "ielts",
    "pronunciation",
    "vocabulary",
    "kids learning",
  ].some((term) => text.includes(term));
}

function explicitlyDefersAi(candidate) {
  const text = `${candidate.product_idea || ""} ${candidate.mvp_wedge || ""}`.toLowerCase();
  return [
    "do not add ai",
    "no ai",
    "without ai",
    "no backend ai",
    "no ai dependency",
  ].some((term) => text.includes(term));
}

function strategicAiBackendStrategy(candidate) {
  const education = isEducationCandidate(candidate);
  const defersAi = explicitlyDefersAi(candidate);

  if (education && !defersAi) {
    return {
      mode: "ai-plus-backend",
      recommended_for_mvp: true,
      direct_app_allowed: false,
      backend_shape: "thin-proxy",
      reason: "B2C education products can be materially stronger when AI improves feedback, explanation, scenario generation, adaptive review, or assessment.",
      backend_trigger: "Provider-hosted AI feedback or generation requires a server boundary for API key protection, abuse/rate limiting, and cost controls.",
      ai_service_trigger: "Generate practice prompts, critique learner input, explain mistakes, and plan review sessions.",
      fallback_without_ai: "Ship static prompt banks, self-check rubrics, local recording or notes, and deterministic review queues.",
      cost_or_risk: "AI feedback quality, child/education safety posture, hallucinated instruction, latency, and per-user inference cost.",
    };
  }

  return {
    mode: defersAi ? "deferred" : "none",
    recommended_for_mvp: false,
    direct_app_allowed: true,
    backend_shape: "none",
    reason: defersAi
      ? "The MVP deliberately avoids AI so it can validate the workflow before adding model cost or complexity."
      : "The current wedge can be validated as a local B2C utility without AI or backend.",
    backend_trigger: "none",
    ai_service_trigger: "none",
    fallback_without_ai: "The full MVP remains usable with local data, static content, deterministic calculations, reminders, or export.",
    cost_or_risk: "Main risk is shallow differentiation if the local workflow does not create enough retention or willingness to pay.",
  };
}

function buildMarketThesis(candidate) {
  return {
    user_pain_intensity: candidate.target_user
      ? `${candidate.target_user} has a repeated, concrete job: ${candidate.mvp_wedge}`
      : `The pain is grounded in this gap: ${candidate.specific_gap}`,
    distribution_angle: `${candidate.cluster} App Store search, competitor review pain, and long-tail problem keywords should be validated before factory promotion.`,
    willingness_to_pay: candidate.scores?.monetization
      ? `Monetization confidence is ${candidate.scores.monetization}/10; verify against competitor IAP, subscription, or paid app posture.`
      : "Willingness to pay needs validation through competitor pricing, keyword intent, and review urgency.",
    incumbent_weakness: candidate.specific_gap,
    why_now: candidate.why_now,
  };
}

function buildDifferentiationThesis(candidate) {
  const education = isEducationCandidate(candidate);
  return {
    why_not_generic: candidate.specific_gap,
    ten_x_narrower_or_better: candidate.mvp_wedge,
    hard_to_copy_detail: education
      ? "A narrow learning loop with domain-specific prompts, feedback criteria, review cadence, and learner progress is harder to copy than a generic AI tutor shell."
      : "A focused workflow, honest scope, and problem-specific capture/export loop should beat a broad CRUD clone.",
  };
}

function buildLearningThesis(candidate) {
  return {
    learner_action: "The learner completes a narrow practice action such as answering, recording, sorting, recalling, or correcting within the app.",
    feedback_loop: "Feedback should identify what was good, what was weak, and the next concrete improvement; AI may provide this when recommended.",
    repetition_loop: "Weak prompts, missed items, or low-confidence attempts return through a review queue or sprint plan.",
    progress_signal: "Progress should be visible through streaks, completed drills, confidence changes, weak-area reduction, or readiness milestones.",
    content_strategy: "Use bundled high-quality seed content first, then AI-generated or AI-varied content only where it improves range and personalization.",
    ai_role: candidate.ai_backend_strategy?.recommended_for_mvp
      ? "AI should critique, personalize, generate variations, or explain mistakes; it should not be a vague chatbot."
      : "AI is deferred; the MVP must still teach through static content, rubrics, and deterministic review.",
  };
}

function buildLaunchAppeal(candidate) {
  const education = isEducationCandidate(candidate);
  if (education) {
    return {
      hook: `${candidate.app_name || candidate.title} should feel like a focused sprint, not a broad course catalog.`,
      first_value_moment: "Within the first minute, the learner starts a real practice attempt, sees a prompt or drill, and gets a clear next action.",
      signature_interaction: "A tactile practice card, timer, swipe/draw motion, or progress sprint interaction that is specific to the learning loop.",
      visual_direction: "Confident, modern learning-tool UI with strong hierarchy, warm progress feedback, and no generic school-dashboard look.",
      storefront_angle: "Show the narrow outcome in screenshots: timed practice, weak-area review, sprint progress, and visible improvement.",
      testflight_demo_path: "Onboarding -> start sprint/practice -> complete one attempt -> see progress/weak area -> open upgrade shell.",
      anti_generic_rule: "Do not ship a plain list of lessons, a generic chatbot, or a form-heavy tracker as the primary experience.",
    };
  }

  return {
    hook: `${candidate.app_name || candidate.title} should communicate its narrow job in the first screen without explanation text.`,
    first_value_moment: "The user completes the core job once in the first session and sees saved progress or a useful result.",
    signature_interaction: "Use one product-specific interaction rather than a generic CRUD list.",
    visual_direction: "Quiet, polished, purpose-built UI with crisp states and restrained motion.",
    storefront_angle: "Screenshots should show the exact problem, the core action, and the outcome.",
    testflight_demo_path: "Onboarding -> first value -> core loop repeat -> saved state -> upgrade shell.",
    anti_generic_rule: "Do not ship a plain settings/form/list wrapper as the main product.",
  };
}

function applyStrategicResearchGate(candidate) {
  candidate.market_thesis = candidate.market_thesis || buildMarketThesis(candidate);
  candidate.ai_backend_strategy = candidate.ai_backend_strategy || strategicAiBackendStrategy(candidate);
  candidate.differentiation_thesis = candidate.differentiation_thesis || buildDifferentiationThesis(candidate);
  candidate.launch_appeal = candidate.launch_appeal || buildLaunchAppeal(candidate);

  if (isEducationCandidate(candidate)) {
    candidate.learning_thesis = candidate.learning_thesis || buildLearningThesis(candidate);
  }

  candidate.research = candidate.research || {};
  candidate.research.quality_gate = "strategic-research-v3";
  candidate.research.signals = Array.isArray(candidate.research.signals) ? candidate.research.signals : [];
  if (!candidate.research.signals.some((signal) => signal.type === "strategic-thesis")) {
    candidate.research.signals.push({
      type: "strategic-thesis",
      summary: `Market, AI/backend, and differentiation theses were generated for ${candidate.title}.`,
      confidence: "medium",
    });
  }

  return candidate;
}

function summarizeMarketSignals(marketSignals) {
  const sourceIds = [...new Set(marketSignals.map((signal) => signal.source_id).filter(Boolean))];
  const keywords = marketSignals
    .filter((signal) => signal.keyword)
    .slice()
    .sort((left, right) => (right.directional_score || 0) - (left.directional_score || 0))
    .slice(0, 5)
    .map((signal) => signal.keyword);
  const apps = marketSignals
    .filter((signal) => signal.app_name)
    .slice()
    .sort((left, right) => (right.directional_score || 0) - (left.directional_score || 0))
    .slice(0, 5)
    .map((signal) => signal.app_name);

  return {
    sourceIds,
    keywords: [...new Set(keywords)],
    apps: [...new Set(apps)],
  };
}

function attachMarketSignalResearch(candidate, marketSignals) {
  if (marketSignals.length === 0) return candidate;

  candidate.research = candidate.research || {};
  candidate.research.signals = Array.isArray(candidate.research.signals) ? candidate.research.signals : [];
  const summary = summarizeMarketSignals(marketSignals);
  candidate.research.market_signal_sources = summary.sourceIds;

  if (!candidate.research.signals.some((signal) => signal.type === "imported-market-source")) {
    candidate.research.signals.push({
      type: "imported-market-source",
      summary: `${marketSignals.length} imported market signals were considered${summary.keywords.length ? `; top keywords include ${summary.keywords.slice(0, 3).join(", ")}` : ""}.`,
      confidence: "medium",
    });
  }

  return candidate;
}

function money(value) {
  return `$${Math.round(value || 0).toLocaleString("en-US")}`;
}

function renderMarkdown({ opportunity, apps, positioning, reviewAnalysis, marketSignals, candidates, sources, outputDir }) {
  const lines = [
    `# Gap Research: ${opportunity.cluster}`,
    "",
    "## Summary",
    "",
    `Cluster score: ${opportunity.scores.total}. Structured snapshot: revenue ${money(opportunity.metric_snapshot.revenue)}, revenue growth ${money(opportunity.metric_snapshot.revenue_growth)}, downloads ${Math.round(opportunity.metric_snapshot.downloads).toLocaleString("en-US")}, download growth ${Math.round(opportunity.metric_snapshot.download_growth).toLocaleString("en-US")}.`,
    "",
    "This gap pass uses live App Store/iTunes Search API data as a positioning check. It is still not a full substitute for manual App Store page and keyword review.",
    "",
    "## Sources",
    "",
    ...sources.map((source) => `- ${source.id}: ${source.url}`),
    "",
    "## Live Competitors",
    "",
    "| App | Publisher | Rating Count | Avg Rating | Price | Source Query |",
    "|---|---|---:|---:|---|---|",
    ...apps.slice(0, 12).map((app) => `| ${escapePipe(app.app_name)} | ${escapePipe(app.publisher)} | ${Math.round(app.rating_count).toLocaleString("en-US")} | ${round(app.average_rating, 2)} | ${escapePipe(app.formatted_price || String(app.price))} | ${escapePipe(app.source_query)} |`),
    "",
    "## Positioning Coverage",
    "",
    ...Object.entries(positioning.coverage).map(([key, count]) => `- ${key}: ${count}/${apps.length} apps${positioning.examples[key]?.length ? ` (${positioning.examples[key].slice(0, 3).join(", ")})` : ""}`),
    "",
    "## Review Theme Probe",
    "",
    `Fetched ${reviewAnalysis.review_count} public review entries across top competitors; ${reviewAnalysis.low_review_count} were rating <= 3.`,
    "",
    ...reviewAnalysis.themes.slice(0, 5).map((theme) => `- ${theme.theme}: ${theme.count} low-rating mentions`),
    "",
    "## Imported Market Signals",
    "",
    marketSignals.length > 0
      ? `Loaded ${marketSignals.length} relevant rows from market-signals.jsonl for this cluster.`
      : "No imported market signals were found for this cluster.",
    "",
    ...(marketSignals.length > 0
      ? [
        "| Type | Source | Keyword/App | Rank | Volume | Score |",
        "|---|---|---|---:|---:|---:|",
        ...marketSignals.slice(0, 12).map((signal) => {
          const label = signal.keyword || signal.app_name || signal.note || signal.evidence || "signal";
          return `| ${escapePipe(signal.signal_type)} | ${escapePipe(signal.source_id)} | ${escapePipe(label)} | ${signal.rank ?? ""} | ${signal.search_volume ?? ""} | ${signal.directional_score ?? ""} |`;
        }),
        "",
      ]
      : []),
    "## Backlog Candidates",
    "",
    ...candidates.map((candidate) => [
      `### ${candidate.title}`,
      "",
      `Status: ${candidate.status}`,
      "",
      `Specific gap: ${candidate.specific_gap}`,
      "",
      `MVP wedge: ${candidate.mvp_wedge}`,
      "",
      `Why now: ${candidate.why_now}`,
      "",
    ].join("\n")),
    "## Output Files",
    "",
    `- ${path.join(outputDir, `gap-research-${slugify(opportunity.cluster)}.json`)}`,
    `- ${path.join(outputDir, "backlog-candidates.json")}`,
  ];

  return `${lines.join("\n")}\n`;
}

function escapePipe(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value || 0) * factor) / factor;
}

function mergeBacklogCandidates(researchDir, nextCandidates) {
  const filePath = path.join(researchDir, "backlog-candidates.json");
  const existing = fs.existsSync(filePath)
    ? readJson(filePath)
    : { schema_version: 1, candidates: [] };
  const targetClusters = new Set(nextCandidates.map((candidate) => candidate.cluster).filter(Boolean));
  const retainedCandidates = (existing.candidates || [])
    .filter((candidate) => !targetClusters.has(candidate.cluster));
  const byId = new Map(retainedCandidates.map((candidate) => [candidate.id, candidate]));
  for (const candidate of nextCandidates) {
    byId.set(candidate.id, candidate);
  }
  const merged = {
    ...existing,
    generated_at: nowIso(),
    candidates: [...byId.values()].sort((left, right) => {
      const leftRank = Number.isFinite(Number(left.rank)) ? Number(left.rank) : Number.MAX_SAFE_INTEGER;
      const rightRank = Number.isFinite(Number(right.rank)) ? Number(right.rank) : Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank;
    }),
    notes: "Candidates here are research outputs. Upsert to ideas/backlog.json only after reviewing the gap report.",
  };
  writeJson(filePath, merged);
  return merged;
}

function updateSourceInventory(researchDir, sources) {
  const filePath = path.join(researchDir, "source-inventory.json");
  const inventory = fs.existsSync(filePath)
    ? readJson(filePath)
    : { schema_version: 1, sources: [] };
  const byId = new Map((inventory.sources || []).map((source) => [source.id, source]));
  for (const source of sources) {
    byId.set(source.id, source);
  }
  const updated = {
    ...inventory,
    generated_at: nowIso(),
    sources: [...byId.values()],
  };
  writeJson(filePath, updated);
}

function printUsage() {
  process.stdout.write(`Usage:
  node scripts/research-app-store-gap.mjs \\
    --research-dir /path/to/research-runs/YYYY-MM-DD/education-us \\
    --cluster "Plant / nature ID" \\
    [--queries "plant identifier,plant care,pet safe plants"] \\
    [--market US]

Purpose:
  Add live App Store/iTunes Search API positioning research to an existing
  research pack and emit backlog candidate drafts for review.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const researchDir = path.resolve(requireValue("--research-dir", args["research-dir"]));
  const opportunity = loadOpportunity(researchDir, args.cluster);
  const market = args.market || opportunity.market || "US";
  const country = countryFromMarket(market);
  const queries = args.queries
    ? String(args.queries).split(",").map((query) => query.trim()).filter(Boolean)
    : defaultQueriesForCluster(opportunity);
  const limit = Number(args.limit || 10);
  const reviewLimit = Number(args["review-limit"] || 20);

  const searchSets = [];
  for (const query of queries) {
    searchSets.push(await searchApps(query, country, limit));
  }

  const apps = dedupeApps(searchSets).slice(0, Number(args["max-apps"] || 30));
  const marketSignals = loadMarketSignals(researchDir, opportunity.cluster);
  const reviewSets = [];
  for (const app of apps.slice(0, Number(args["review-apps"] || 5))) {
    const reviewResult = await fetchReviews(app.app_id, country, reviewLimit);
    reviewSets.push({
      app_id: app.app_id,
      app_name: app.app_name,
      ...reviewResult,
    });
  }

  const positioning = analyzePositioning(apps);
  const reviewAnalysis = analyzeReviews(reviewSets);
  const sources = [
    ...searchSets.map((set) => set.source),
    ...reviewSets.map((set) => set.source),
  ];
  const candidates = buildCandidates({ opportunity, apps, positioning, reviews: reviewAnalysis, sources, marketSignals });
  for (const candidate of candidates) {
    applyStrategicResearchGate(candidate);
    attachMarketSignalResearch(candidate, marketSignals);
    candidate.research.research_run = researchRunRef(researchDir);
  }

  const outputBase = `gap-research-${slugify(opportunity.cluster)}`;
  const gapResearch = {
    schema_version: 1,
    generated_at: nowIso(),
    cluster: opportunity.cluster,
    category: opportunity.category,
    market,
    opportunity,
    queries,
    sources,
    market_signals: marketSignals,
    apps,
    positioning,
    review_analysis: reviewAnalysis,
    candidates,
  };

  writeJson(path.join(researchDir, `${outputBase}.json`), gapResearch);
  fs.writeFileSync(
    path.join(researchDir, `${outputBase}.md`),
    renderMarkdown({ opportunity, apps, positioning, reviewAnalysis, marketSignals, candidates, sources, outputDir: researchDir }),
  );
  mergeBacklogCandidates(researchDir, candidates);
  updateSourceInventory(researchDir, sources);

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "complete",
        research_dir: researchDir,
        cluster: opportunity.cluster,
        query_count: queries.length,
        app_count: apps.length,
        market_signal_count: marketSignals.length,
        review_count: reviewAnalysis.review_count,
        candidate_count: candidates.length,
        candidates: candidates.map((candidate) => ({
          id: candidate.id,
          status: candidate.status,
          title: candidate.title,
          score: candidate.scores.total,
        })),
        output: path.join(researchDir, `${outputBase}.md`),
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
