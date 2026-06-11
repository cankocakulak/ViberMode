#!/usr/bin/env node

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";

const args = parseArgs(process.argv.slice(2));
const envInfo = loadEnvFile(args.envFile || process.env.META_ENV_FILE || ".vibermode-automation.env");
const keychainPrefix = args.keychainPrefix || process.env.META_KEYCHAIN_PREFIX || "viberboyz-meta";
const keychainAccount = args.keychainAccount || process.env.META_KEYCHAIN_ACCOUNT || process.env.USER || os.userInfo().username;
const keychainServices = {
  accessToken: args.accessTokenService || process.env.META_ACCESS_TOKEN_KEYCHAIN_SERVICE || keychainService("access-token"),
  adAccountId: args.adAccountIdService || process.env.META_AD_ACCOUNT_ID_KEYCHAIN_SERVICE || keychainService("ad-account-id"),
  appId: args.appIdService || process.env.META_APP_ID_KEYCHAIN_SERVICE || keychainService("app-id"),
  appSecret: args.appSecretService || process.env.META_APP_SECRET_KEYCHAIN_SERVICE || keychainService("app-secret"),
};

if (args.checkKeychain) {
  console.log(JSON.stringify({
    env_file: envInfo,
    keychain_account: keychainAccount,
    keychain_prefix: keychainPrefix,
    env: {
      META_ACCESS_TOKEN: Boolean(process.env.META_ACCESS_TOKEN),
      META_AD_ACCOUNT_ID: Boolean(process.env.META_AD_ACCOUNT_ID),
      META_API_VERSION: Boolean(process.env.META_API_VERSION),
      META_APP_ID: Boolean(process.env.META_APP_ID),
      META_APP_SECRET: Boolean(process.env.META_APP_SECRET),
    },
    keychain: {
      META_ACCESS_TOKEN: { service: keychainServices.accessToken, present: hasKeychainValue(keychainServices.accessToken) },
      META_AD_ACCOUNT_ID: { service: keychainServices.adAccountId, present: hasKeychainValue(keychainServices.adAccountId) },
      META_APP_ID: { service: keychainServices.appId, present: hasKeychainValue(keychainServices.appId) },
      META_APP_SECRET: { service: keychainServices.appSecret, present: hasKeychainValue(keychainServices.appSecret) },
    },
  }, null, 2));
  process.exit(0);
}

const token = process.env.META_ACCESS_TOKEN || keychainRead(keychainServices.accessToken);
const accountId = args.account || process.env.META_AD_ACCOUNT_ID || keychainRead(keychainServices.adAccountId);
const apiVersion = args.apiVersion || process.env.META_API_VERSION || "v21.0";
const minSpend = Number(args.minSpend ?? 100);
const outputFormat = args.format || "json";
const outputLimit = Number(args.limit ?? 10);

if (!token) fail("META_ACCESS_TOKEN is required");
if (!accountId) fail("META_AD_ACCOUNT_ID or --account is required");

const base = `https://graph.facebook.com/${apiVersion}`;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function fail(message) {
  console.error(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return { loaded: false, path: filePath || null };
  const text = fs.readFileSync(filePath, "utf8");
  let loadedKeys = 0;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = stripQuotes(rawValue.replace(/\s+#.*$/, ""));
    loadedKeys++;
  }
  return { loaded: true, path: filePath, loaded_keys: loadedKeys };
}

function keychainService(name) {
  return `${keychainPrefix}-${name}`;
}

function keychainRead(service) {
  try {
    return execFileSync("security", [
      "find-generic-password",
      "-a",
      keychainAccount,
      "-s",
      service,
      "-w",
    ], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function hasKeychainValue(service) {
  return Boolean(keychainRead(service));
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, places = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(places));
}

function actionValue(actions, types) {
  if (!Array.isArray(actions)) return 0;
  return actions
    .filter((item) => types.includes(item.action_type))
    .reduce((sum, item) => sum + num(item.value), 0);
}

function firstCpa(costs, types) {
  if (!Array.isArray(costs)) return null;
  for (const type of types) {
    const found = costs.find((item) => item.action_type === type);
    if (found) return num(found.value);
  }
  return null;
}

function roas(row) {
  for (const key of ["purchase_roas", "website_purchase_roas", "mobile_app_purchase_roas"]) {
    const group = row[key];
    if (!Array.isArray(group)) continue;
    const values = group.map((item) => num(item.value)).filter((value) => value > 0);
    if (values.length) return Math.max(...values);
  }
  return null;
}

function creativeType(creative) {
  const assetFeed = creative?.asset_feed_spec || {};
  const story = creative?.object_story_spec || {};
  if (assetFeed.videos?.length || story.video_data || creative?.video_id) return "video";
  if (assetFeed.images?.length || story.photo_data || creative?.image_url || creative?.thumbnail_url) return "image";
  if (story.link_data) return "link/post";
  return "unknown";
}

function creativeText(creative) {
  const assetFeed = creative?.asset_feed_spec || {};
  const story = creative?.object_story_spec || {};
  const link = story.link_data || {};
  const video = story.video_data || {};
  return {
    title: link.name || video.title || assetFeed.titles?.[0]?.text || creative?.title || "",
    body: (link.message || video.message || assetFeed.bodies?.[0]?.text || creative?.body || "")
      .replace(/\s+/g, " ")
      .slice(0, 180),
    cta: link.call_to_action?.type || video.call_to_action?.type || assetFeed.call_to_types?.[0] || "",
  };
}

async function graph(path, params = {}) {
  const normalizedPath = path ? `/${path}` : "/";
  const url = new URL(`${base}${normalizedPath}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  url.searchParams.set("access_token", token);

  const response = await fetch(url);
  const json = await response.json();
  if (json.error) {
    throw new Error(`${json.error.message} (${json.error.type || "error"} ${json.error.code || ""})`);
  }
  return json;
}

async function graphAll(path, params = {}, maxPages = 50) {
  const data = [];
  let after = null;
  for (let page = 0; page < maxPages; page++) {
    const json = await graph(path, { ...params, after });
    if (Array.isArray(json.data)) data.push(...json.data);
    after = json.paging?.cursors?.after;
    if (!json.paging?.next || !after) break;
  }
  return data;
}

function insightParams(fields) {
  const params = { fields, level: "ad", limit: 500 };
  if (args.since && args.until) {
    params.time_range = JSON.stringify({ since: args.since, until: args.until });
  } else {
    params.date_preset = args.datePreset || "last_30d";
  }
  return params;
}

function summarizeRows(rows) {
  return rows.map((row) => ({
    ad: row.ad_name,
    campaign: row.campaign_name,
    status: row.ad_status,
    type: row.creative_type,
    spend: round(row.spend),
    impressions: row.impressions,
    clicks: row.clicks,
    link_clicks: row.link_clicks,
    ctr: round(row.ctr),
    cpc: round(row.cpc),
    cpm: round(row.cpm),
    frequency: round(row.frequency),
    landing_page_views: row.landing_page_views,
    leads: row.leads,
    purchases: row.purchases,
    roas: row.roas ? round(row.roas) : null,
    cpl: row.cpl ? round(row.cpl) : null,
    cpp: row.cpp ? round(row.cpp) : null,
    title: row.title || null,
    body: row.body || null,
    cta: row.cta || null,
    ad_id: row.ad_id,
    creative_id: row.creative_id,
  }));
}

function mdCell(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function mdNumber(value, suffix = "") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "-";
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}${suffix}`;
}

function markdownTable(headers, rows) {
  const header = `| ${headers.map(mdCell).join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(mdCell).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function renderMarkdown(report) {
  const lines = [];
  const scope = report.scope.since && report.scope.until
    ? `${report.scope.since} to ${report.scope.until}`
    : report.scope.date_preset;

  lines.push(`# Meta Ads Performance Report`);
  lines.push("");
  lines.push(`Scope: ${scope} | Account: ${report.account.name} | Currency: ${report.account.currency}`);
  lines.push("");
  lines.push(`## Totals`);
  lines.push(markdownTable(
    ["Spend", "Impressions", "Clicks", "CTR", "CPC", "Link CPC", "LPV", "Leads", "Purchases", "ROAS"],
    [[
      mdNumber(report.totals.spend),
      mdNumber(report.totals.impressions),
      mdNumber(report.totals.clicks),
      mdNumber(report.totals.ctr, "%"),
      mdNumber(report.totals.cpc),
      mdNumber(report.totals.link_cpc),
      mdNumber(report.totals.landing_page_views),
      mdNumber(report.totals.leads),
      mdNumber(report.totals.purchases),
      mdNumber(report.totals.roas),
    ]],
  ));
  lines.push("");

  lines.push(`## Campaigns`);
  lines.push(markdownTable(
    ["Campaign", "Status", "Ads", "Spend", "Impr.", "Clicks", "CTR", "CPC", "LPV", "Leads", "Purch.", "ROAS"],
    report.campaign_rollup.slice(0, outputLimit).map((item) => [
      item.campaign,
      item.status,
      item.ads,
      mdNumber(item.spend),
      mdNumber(item.impressions),
      mdNumber(item.clicks),
      mdNumber(item.ctr, "%"),
      mdNumber(item.cpc),
      mdNumber(item.landing_page_views),
      mdNumber(item.leads),
      mdNumber(item.purchases),
      mdNumber(item.roas),
    ]),
  ));
  lines.push("");

  lines.push(`## Creative Winners`);
  lines.push(markdownTable(
    ["Ad", "Campaign", "Type", "Spend", "CTR", "CPC", "LPV", "Leads", "Purch.", "ROAS", "Message"],
    report.creative_rankings.best_ctr_min_spend.slice(0, outputLimit).map((item) => [
      item.ad,
      item.campaign,
      item.type,
      mdNumber(item.spend),
      mdNumber(item.ctr, "%"),
      mdNumber(item.cpc),
      mdNumber(item.landing_page_views),
      mdNumber(item.leads),
      mdNumber(item.purchases),
      mdNumber(item.roas),
      item.title || item.body || "-",
    ]),
  ));
  lines.push("");

  const conversionRows = [
    ...report.creative_rankings.roas_rows,
    ...report.creative_rankings.lead_rows,
  ].filter((item, index, list) => list.findIndex((candidate) => candidate.ad_id === item.ad_id) === index);

  lines.push(`## Lead And Sales Signals`);
  if (conversionRows.length) {
    lines.push(markdownTable(
      ["Ad", "Campaign", "Spend", "Leads", "CPL", "Purch.", "CPP", "ROAS", "Message"],
      conversionRows.slice(0, outputLimit).map((item) => [
        item.ad,
        item.campaign,
        mdNumber(item.spend),
        mdNumber(item.leads),
        mdNumber(item.cpl),
        mdNumber(item.purchases),
        mdNumber(item.cpp),
        mdNumber(item.roas),
        item.title || item.body || "-",
      ]),
    ));
  } else {
    lines.push("No lead, purchase, or ROAS rows were returned for this scope.");
  }
  lines.push("");

  lines.push(`## Waste And Risk Watchlist`);
  lines.push(markdownTable(
    ["Ad", "Campaign", "Status", "Spend", "CTR", "CPC", "Leads", "Purch.", "Issue"],
    report.creative_rankings.most_expensive_cpc_min_spend.slice(0, outputLimit).map((item) => [
      item.ad,
      item.campaign,
      item.status,
      mdNumber(item.spend),
      mdNumber(item.ctr, "%"),
      mdNumber(item.cpc),
      mdNumber(item.leads),
      mdNumber(item.purchases),
      item.roas ? "High CPC but conversion signal exists" : "High CPC or weak conversion signal",
    ]),
  ));
  lines.push("");

  lines.push(`## Placements`);
  lines.push(markdownTable(
    ["Placement", "Spend", "Impr.", "Clicks", "CTR", "CPC", "CPM", "Leads"],
    report.placements.slice(0, outputLimit).map((item) => [
      item.placement || item.error,
      mdNumber(item.spend),
      mdNumber(item.impressions),
      mdNumber(item.clicks),
      mdNumber(item.ctr, "%"),
      mdNumber(item.cpc),
      mdNumber(item.cpm),
      mdNumber(item.leads),
    ]),
  ));
  lines.push("");

  lines.push(`## Notes`);
  lines.push(`- Interpret creative winners by objective. Traffic winners are not automatically sales winners.`);
  lines.push(`- If conversion rows are sparse, prioritize measurement fixes before ROI claims.`);
  lines.push(`- Do not make write changes from this report without a separate approved action plan.`);

  return lines.join("\n");
}

const insightFields = [
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "impressions",
  "reach",
  "frequency",
  "spend",
  "clicks",
  "inline_link_clicks",
  "ctr",
  "cpc",
  "cpm",
  "actions",
  "action_values",
  "cost_per_action_type",
  "purchase_roas",
  "website_purchase_roas",
  "mobile_app_purchase_roas",
].join(",");

const account = await graph(accountId, {
  fields: "name,account_id,currency,timezone_name,account_status,amount_spent,balance",
});
const campaigns = await graphAll(`${accountId}/campaigns`, {
  fields: "id,name,status,effective_status,objective,buying_type,created_time,updated_time",
  limit: 500,
});
const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
const insights = await graphAll(`${accountId}/insights`, insightParams(insightFields));
const adIds = [...new Set(insights.map((row) => row.ad_id).filter(Boolean))];

const ads = [];
for (let index = 0; index < adIds.length; index += 50) {
  const ids = adIds.slice(index, index + 50).join(",");
  const batch = await graph("", {
    ids,
    fields:
      "id,name,status,effective_status,campaign_id,adset_id,creative{id,name,thumbnail_url,image_url,title,body,object_story_spec,asset_feed_spec,video_id}",
  });
  ads.push(...Object.values(batch).filter(Boolean));
}

const adMap = new Map(ads.map((ad) => [ad.id, ad]));
const rows = insights
  .map((row) => {
    const ad = adMap.get(row.ad_id) || {};
    const creative = ad.creative || {};
    const text = creativeText(creative);
    const spend = num(row.spend);
    const leads = actionValue(row.actions, ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"]);
    const purchases = actionValue(row.actions, ["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"]);
    return {
      ad_id: row.ad_id,
      ad_name: row.ad_name,
      ad_status: ad.effective_status || ad.status || null,
      adset_id: row.adset_id,
      adset_name: row.adset_name,
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
      campaign_status: campaignMap.get(row.campaign_id)?.effective_status || null,
      creative_id: creative.id || null,
      creative_name: creative.name || null,
      creative_type: creativeType(creative),
      title: text.title.slice(0, 120),
      body: text.body,
      cta: text.cta,
      spend,
      impressions: num(row.impressions),
      reach: num(row.reach),
      frequency: num(row.frequency),
      clicks: num(row.clicks),
      link_clicks: num(row.inline_link_clicks),
      ctr: num(row.ctr),
      cpc: num(row.cpc),
      cpm: num(row.cpm),
      landing_page_views: actionValue(row.actions, ["landing_page_view"]),
      leads,
      purchases,
      conversion_value: actionValue(row.action_values, [
        "purchase",
        "omni_purchase",
        "offsite_conversion.fb_pixel_purchase",
      ]),
      roas: roas(row),
      cpl:
        leads > 0
          ? spend / leads
          : firstCpa(row.cost_per_action_type, ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"]),
      cpp:
        purchases > 0
          ? spend / purchases
          : firstCpa(row.cost_per_action_type, ["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"]),
    };
  })
  .sort((a, b) => b.spend - a.spend);

function rollupByCampaign() {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.campaign_id)) {
      map.set(row.campaign_id, {
        campaign: row.campaign_name,
        status: row.campaign_status,
        ads: 0,
        spend: 0,
        impressions: 0,
        clicks: 0,
        link_clicks: 0,
        landing_page_views: 0,
        leads: 0,
        purchases: 0,
        conversion_value: 0,
      });
    }
    const item = map.get(row.campaign_id);
    item.ads++;
    item.spend += row.spend;
    item.impressions += row.impressions;
    item.clicks += row.clicks;
    item.link_clicks += row.link_clicks;
    item.landing_page_views += row.landing_page_views;
    item.leads += row.leads;
    item.purchases += row.purchases;
    item.conversion_value += row.conversion_value;
  }
  return [...map.values()]
    .map((item) => ({
      ...item,
      spend: round(item.spend),
      ctr: round(item.impressions ? (item.clicks / item.impressions) * 100 : 0),
      cpc: item.clicks ? round(item.spend / item.clicks) : null,
      roas: item.spend && item.conversion_value ? round(item.conversion_value / item.spend) : null,
    }))
    .sort((a, b) => b.spend - a.spend);
}

async function placementBreakdown() {
  try {
    const placementRows = await graphAll(
      `${accountId}/insights`,
      {
        ...insightParams("impressions,spend,clicks,inline_link_clicks,actions"),
        breakdowns: "publisher_platform,platform_position",
      },
      50,
    );
    const map = new Map();
    for (const row of placementRows) {
      const key = `${row.publisher_platform || "unknown"} / ${row.platform_position || "unknown"}`;
      if (!map.has(key)) {
        map.set(key, { placement: key, spend: 0, impressions: 0, clicks: 0, link_clicks: 0, leads: 0 });
      }
      const item = map.get(key);
      item.spend += num(row.spend);
      item.impressions += num(row.impressions);
      item.clicks += num(row.clicks);
      item.link_clicks += num(row.inline_link_clicks);
      item.leads += actionValue(row.actions, ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"]);
    }
    return [...map.values()]
      .map((item) => ({
        ...item,
        spend: round(item.spend),
        ctr: round(item.impressions ? (item.clicks / item.impressions) * 100 : 0),
        cpc: item.clicks ? round(item.spend / item.clicks) : null,
        cpm: round(item.impressions ? (item.spend / item.impressions) * 1000 : 0),
      }))
      .sort((a, b) => b.spend - a.spend);
  } catch (error) {
    return [{ error: error.message }];
  }
}

const totals = rows.reduce(
  (acc, row) => {
    acc.spend += row.spend;
    acc.impressions += row.impressions;
    acc.clicks += row.clicks;
    acc.link_clicks += row.link_clicks;
    acc.landing_page_views += row.landing_page_views;
    acc.leads += row.leads;
    acc.purchases += row.purchases;
    acc.conversion_value += row.conversion_value;
    return acc;
  },
  { spend: 0, impressions: 0, clicks: 0, link_clicks: 0, landing_page_views: 0, leads: 0, purchases: 0, conversion_value: 0 },
);

const eligible = rows.filter((row) => row.spend >= minSpend);
const activeNoInsight = campaigns
  .filter((campaign) => campaign.effective_status === "ACTIVE" && !rows.some((row) => row.campaign_id === campaign.id))
  .map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    objective: campaign.objective,
    status: campaign.effective_status,
  }));

const report = {
  account: {
    name: account.name,
    account_id: account.account_id,
    currency: account.currency,
    timezone: account.timezone_name,
    account_status: account.account_status,
  },
  scope: {
    api_version: apiVersion,
    date_preset: args.since && args.until ? null : args.datePreset || "last_30d",
    since: args.since || null,
    until: args.until || null,
    min_spend: minSpend,
    insight_rows: rows.length,
    ads_with_spend: rows.filter((row) => row.spend > 0).length,
    campaigns_total: campaigns.length,
    active_campaigns: campaigns.filter((campaign) => campaign.effective_status === "ACTIVE").length,
    active_campaigns_without_insight: activeNoInsight.length,
  },
  totals: {
    spend: round(totals.spend),
    impressions: totals.impressions,
    clicks: totals.clicks,
    link_clicks: totals.link_clicks,
    landing_page_views: totals.landing_page_views,
    leads: totals.leads,
    purchases: totals.purchases,
    conversion_value: round(totals.conversion_value),
    ctr: round(totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0),
    cpc: totals.clicks ? round(totals.spend / totals.clicks) : null,
    link_cpc: totals.link_clicks ? round(totals.spend / totals.link_clicks) : null,
    roas: totals.spend && totals.conversion_value ? round(totals.conversion_value / totals.spend) : null,
  },
  campaign_rollup: rollupByCampaign().slice(0, 20),
  creative_rankings: {
    top_spend: summarizeRows(rows.slice(0, 15)),
    best_ctr_min_spend: summarizeRows([...eligible].sort((a, b) => b.ctr - a.ctr).slice(0, 10)),
    worst_ctr_min_spend: summarizeRows([...eligible].sort((a, b) => a.ctr - b.ctr).slice(0, 10)),
    cheapest_cpc_min_spend: summarizeRows([...eligible].filter((row) => row.cpc > 0).sort((a, b) => a.cpc - b.cpc).slice(0, 10)),
    most_expensive_cpc_min_spend: summarizeRows([...eligible].filter((row) => row.cpc > 0).sort((a, b) => b.cpc - a.cpc).slice(0, 10)),
    roas_rows: summarizeRows(rows.filter((row) => row.roas).sort((a, b) => b.roas - a.roas)),
    lead_rows: summarizeRows(rows.filter((row) => row.leads > 0).sort((a, b) => (a.cpl || Infinity) - (b.cpl || Infinity))),
  },
  placements: await placementBreakdown(),
  active_campaigns_without_insight: activeNoInsight,
};

if (outputFormat === "markdown" || outputFormat === "md") {
  console.log(renderMarkdown(report));
} else if (outputFormat === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  fail(`Unsupported --format: ${outputFormat}`);
}
