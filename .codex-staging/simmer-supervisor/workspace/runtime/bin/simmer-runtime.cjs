#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');
const { execFileSync } = require('child_process');
const { URL } = require('url');

const runtimeDir = path.resolve(__dirname, '..');
const workspaceDir = path.resolve(runtimeDir, '..');
const bindingPath = path.join(runtimeDir, 'config', 'simmer-binding.json');
const strategyProfilesPath = path.join(workspaceDir, 'config', 'strategy-profiles.yaml');
const trackingSchemaPath = path.join(workspaceDir, 'config', 'tracking-schema.yaml');
const envCandidates = [
  path.join(os.homedir(), '.openclaw', '.env'),
  path.join(runtimeDir, 'env', 'simmer.env'),
];

function parseArgs(argv) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        result[key] = next;
        i += 1;
      } else {
        result[key] = true;
      }
    } else {
      result._.push(arg);
    }
  }
  return result;
}

function parseDotEnv(text) {
  const vars = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function readEnvFiles() {
  const vars = {};
  const found = [];
  const sources = {};
  for (const candidate of envCandidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    const parsed = parseDotEnv(fs.readFileSync(candidate, 'utf8'));
    Object.assign(vars, parsed);
    Object.keys(parsed).forEach((key) => {
      sources[key] = candidate;
    });
    found.push(candidate);
  }
  return { vars, found, sources };
}

const fileEnv = readEnvFiles();

function envValue(key, fallback = '') {
  if (Object.prototype.hasOwnProperty.call(process.env, key) && process.env[key] !== '') {
    return process.env[key];
  }
  if (Object.prototype.hasOwnProperty.call(fileEnv.vars, key) && fileEnv.vars[key] !== '') {
    return fileEnv.vars[key];
  }
  return fallback;
}

function envValueWithSource(key, fallback = '') {
  if (Object.prototype.hasOwnProperty.call(process.env, key) && process.env[key] !== '') {
    return { value: process.env[key], source: 'process-env' };
  }
  if (Object.prototype.hasOwnProperty.call(fileEnv.vars, key) && fileEnv.vars[key] !== '') {
    return { value: fileEnv.vars[key], source: fileEnv.sources[key] || 'env-file' };
  }
  return { value: fallback, source: fallback === '' ? '' : 'binding-config-default' };
}

function readMacKeychainSecret(service, account) {
  if (!service || !account) {
    return '';
  }
  try {
    return execFileSync(
      'security',
      ['find-generic-password', '-w', '-s', service, '-a', account],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
  } catch (_error) {
    return '';
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function extractQuotedValue(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*"([^"]+)"`));
  return match ? match[1] : '';
}

function extractBoolValue(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*(true|false)`));
  return match ? match[1] === 'true' : false;
}

function extractNumberValue(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*([0-9]+(?:\\.[0-9]+)?)`));
  return match ? Number(match[1]) : null;
}

function parseStrategyProfile() {
  const yaml = fs.readFileSync(strategyProfilesPath, 'utf8');
  const activeProfileIdMatch = yaml.match(/active_profile_id:\s*"([^"]+)"/);
  const activeProfileId = activeProfileIdMatch ? activeProfileIdMatch[1] : 'crypto_momentum_v1';
  const profileBlocks = yaml.match(/  - id:[\s\S]*?(?=\n  - id: |\nrollout_policy:|$)/g) || [];
  const activeBlock = profileBlocks.find((block) => block.includes(`id: "${activeProfileId}"`)) || profileBlocks[0] || '';

  return {
    id: extractQuotedValue(activeBlock, 'id') || 'crypto_momentum_v1',
    status: extractQuotedValue(activeBlock, 'status') || 'active',
    domain: extractQuotedValue(activeBlock, 'domain') || 'crypto_event_markets',
    policyVersion: extractQuotedValue(activeBlock, 'policy_version') || 'v1',
    positionSizingMode: extractQuotedValue(activeBlock, 'position_sizing_mode') || 'percent_of_balance',
    maxPositionPctOfBalance: extractNumberValue(activeBlock, 'max_position_pct_of_balance') || 0.10,
    maxTotalExposurePctOfBalance: extractNumberValue(activeBlock, 'max_total_exposure_pct_of_balance') || 0.20,
    maxTradeNotionalForSim: extractNumberValue(activeBlock, 'max_trade_notional_for_sim') || 500,
    maxNewTradesPerHeartbeat: extractNumberValue(activeBlock, 'max_new_trades_per_heartbeat') || 1,
    maxOpenPositions: extractNumberValue(activeBlock, 'max_open_positions') || 3,
    minimumConfidence: extractNumberValue(activeBlock, 'minimum_confidence') || 0.68,
    minimumActionableMinutesToResolution: extractNumberValue(activeBlock, 'minimum_actionable_minutes_to_resolution') || 60,
    freshContextRequired: extractBoolValue(activeBlock, 'fresh_context_required'),
    allowAveragingDown: extractBoolValue(activeBlock, 'allow_averaging_down'),
  };
}

function extractYamlList(filePath, listName) {
  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(new RegExp(`${listName}:\\n((?:  - .*\\n)+)`));
  if (!match) {
    return [];
  }
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).replace(/^"|"$/g, ''));
}

function parseTrackingSchema() {
  return {
    requiredFields: extractYamlList(trackingSchemaPath, 'required_fields'),
    minimumJournalRecord: extractYamlList(trackingSchemaPath, 'minimum_journal_record'),
    reviewGroupings: extractYamlList(trackingSchemaPath, 'review_groupings'),
  };
}

function resolveBinding() {
  const binding = readJson(bindingPath);
  const apiBaseUrl = envValueWithSource(binding.apiBaseUrlEnv, binding.defaultApiBaseUrl || '');
  const apiKeyEnv = envValueWithSource(binding.apiKeyEnv, '');
  const keychainApiKey = apiKeyEnv.value === ''
    ? readMacKeychainSecret(binding.apiKeyKeychainService, binding.apiKeyKeychainAccount)
    : '';
  return {
    raw: binding,
    apiBaseUrl: apiBaseUrl.value,
    apiBaseUrlSource: apiBaseUrl.source,
    apiKey: apiKeyEnv.value || keychainApiKey,
    apiKeySource: apiKeyEnv.value ? apiKeyEnv.source : (keychainApiKey ? 'macos-keychain' : ''),
    authHeader: envValue('SIMMER_AUTH_HEADER', binding.authHeader || 'Authorization'),
    authScheme: envValue('SIMMER_AUTH_SCHEME', binding.authScheme || 'Bearer'),
    timeoutMs: Number(envValue('SIMMER_TIMEOUT_MS', String(binding.timeoutMs || 15000))),
    venue: binding.venue || 'sim',
    domain: binding.domain || 'crypto_event_markets',
    envSources: fileEnv.found,
  };
}

function resolveEndpoint(binding, name) {
  const endpointKeyMap = {
    health: 'HEALTH',
    briefing: 'BRIEFING',
    getMarket: 'GET_MARKET',
    searchMarkets: 'SEARCH_MARKETS',
    positions: 'POSITIONS',
    trades: 'TRADES',
    context: 'CONTEXT',
    dryRun: 'DRY_RUN',
    execute: 'EXECUTE',
  };
  const endpoint = binding.raw.endpoints[name];
  const envPrefix = endpointKeyMap[name];
  const explicitUrl = envValue(`SIMMER_${envPrefix}_URL`, '');
  const explicitPath = envValue(`SIMMER_${envPrefix}_PATH`, '');
  const explicitMethod = envValue(`SIMMER_${envPrefix}_METHOD`, '');
  const method = (explicitMethod || endpoint.method || 'GET').toUpperCase();
  if (explicitUrl) {
    return { method, url: explicitUrl, pathTemplate: explicitUrl };
  }
  if (!binding.apiBaseUrl) {
    throw new Error(`Missing ${binding.raw.apiBaseUrlEnv}; cannot resolve ${name} endpoint.`);
  }
  const endpointPath = explicitPath || endpoint.path;
  return {
    method,
    url: new URL(endpointPath, binding.apiBaseUrl).toString(),
    pathTemplate: endpointPath,
  };
}

function applyPathParams(template, pathParams = {}) {
  let resolved = template;
  Object.entries(pathParams).forEach(([key, value]) => {
    resolved = resolved.replaceAll(`{${key}}`, encodeURIComponent(String(value)));
  });
  return resolved;
}

function resolveEndpointUrl(binding, name, pathParams = {}) {
  const endpoint = resolveEndpoint(binding, name);
  const template = endpoint.pathTemplate || endpoint.url;
  if (/^https?:\/\//.test(template)) {
    return {
      method: endpoint.method,
      url: applyPathParams(template, pathParams),
    };
  }
  return {
    method: endpoint.method,
    url: new URL(applyPathParams(template, pathParams), binding.apiBaseUrl).toString(),
  };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeSegment(value, fallback) {
  return String(value || fallback).replace(/[^A-Za-z0-9._-]+/g, '-');
}

function formatIsoDateParts(timestamp) {
  const date = new Date(timestamp);
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return { yyyy, mm, dd };
}

function getIsoWeekParts(timestamp) {
  const date = new Date(timestamp);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return {
    year: String(utc.getUTCFullYear()),
    week: `W${String(week).padStart(2, '0')}`,
  };
}

function yamlScalar(value) {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  const text = String(value);
  if (text === '') {
    return '""';
  }
  if (/^[A-Za-z0-9._/@:-]+$/.test(text)) {
    return text;
  }
  return JSON.stringify(text);
}

function toYaml(value, indent = 0) {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${pad}[]`;
    }
    return value.map((item) => {
      if (item && typeof item === 'object') {
        const nested = toYaml(item, indent + 1);
        return `${pad}-\n${nested}`;
      }
      return `${pad}- ${yamlScalar(item)}`;
    }).join('\n');
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return `${pad}{}`;
    }
    return entries.map(([key, item]) => {
      if (item && typeof item === 'object') {
        return `${pad}${key}:\n${toYaml(item, indent + 1)}`;
      }
      return `${pad}${key}: ${yamlScalar(item)}`;
    }).join('\n');
  }
  return `${pad}${yamlScalar(value)}`;
}

function writeYamlFile(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${toYaml(payload)}\n`, 'utf8');
}

async function readStdin() {
  if (process.stdin.isTTY) {
    return '';
  }
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

async function readPayload(args) {
  if (args['payload-file']) {
    return JSON.parse(fs.readFileSync(args['payload-file'], 'utf8'));
  }
  if (args.payload) {
    return JSON.parse(args.payload);
  }
  const stdin = await readStdin();
  if (stdin.trim()) {
    return JSON.parse(stdin);
  }
  throw new Error('Missing JSON payload. Provide --payload-file, --payload, or JSON on stdin.');
}

function buildPortfolioConstraints(policy, sizingSnapshot = {}) {
  return {
    venue: 'sim',
    domain: policy.domain,
    strategy_profile_id: policy.id,
    policy_version: policy.policyVersion,
    position_sizing_mode: policy.positionSizingMode,
    max_position_pct_of_balance: policy.maxPositionPctOfBalance,
    max_total_exposure_pct_of_balance: policy.maxTotalExposurePctOfBalance,
    max_trade_notional_for_sim: policy.maxTradeNotionalForSim,
    max_new_trades_per_heartbeat: policy.maxNewTradesPerHeartbeat,
    max_open_positions: policy.maxOpenPositions,
    minimum_confidence: policy.minimumConfidence,
    minimum_actionable_minutes_to_resolution: policy.minimumActionableMinutesToResolution,
    fresh_context_required: policy.freshContextRequired,
    allow_averaging_down: policy.allowAveragingDown,
    balance_basis: sizingSnapshot.balance_basis ?? null,
    balance_basis_field: sizingSnapshot.balance_basis_field || '',
    max_position_notional: sizingSnapshot.max_position_notional ?? null,
    max_total_exposure_notional: sizingSnapshot.max_total_exposure_notional ?? null,
    current_open_exposure: sizingSnapshot.current_open_exposure ?? null,
    remaining_new_exposure_capacity: sizingSnapshot.remaining_new_exposure_capacity ?? null,
    venue_cap_notional: sizingSnapshot.venue_cap_notional ?? null,
    final_proposed_size_cap: sizingSnapshot.final_proposed_size_cap ?? null,
  };
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined || value === '') {
    return [];
  }
  return [value];
}

function minutesUntil(timestamp) {
  if (!timestamp) {
    return null;
  }
  const millis = new Date(timestamp).getTime() - Date.now();
  if (Number.isNaN(millis)) {
    return null;
  }
  return Math.floor(millis / 60000);
}

function marketMatchesDomain(market, domain) {
  if (domain !== 'crypto_event_markets') {
    return true;
  }
  const haystack = [
    market.question,
    market.headline_summary,
    market.event_name,
    market.market_source,
    ...(Array.isArray(market.tags) ? market.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /\b(bitcoin|btc|ethereum|eth|solana|sol|dogecoin|doge|xrp|ripple|crypto|cryptocurrency|altcoin|memecoin)\b/.test(haystack);
}

function normalizeTags(value) {
  return asArray(value).flatMap((item) => {
    if (!item) {
      return [];
    }
    if (typeof item === 'string') {
      return [item];
    }
    if (typeof item === 'object') {
      return [item.name || item.label || item.slug || item.id].filter(Boolean);
    }
    return [];
  });
}

function normalizeOpportunity(market, policy) {
  const marketId = String(market.market_id || market.id || market.marketId || market.uuid || '').trim();
  const status = String(market.status || market.market_status || '').trim().toLowerCase();
  const externalPriceYes = (
    market.external_price_yes !== undefined && market.external_price_yes !== null
      ? Number(market.external_price_yes)
      : null
  );
  const resolvesAt = market.resolves_at || market.resolve_time || market.end_time || '';
  const minutesToResolution = (
    typeof market.minutes_to_resolution === 'number'
      ? market.minutes_to_resolution
      : minutesUntil(resolvesAt)
  );
  const closedOrResolved = Boolean(
    market.closed === true
    || market.resolved === true
    || ['closed', 'resolved', 'settled', 'inactive', 'expired', 'finalized'].includes(status)
  );
  const deterministicOutcome = Boolean(externalPriceYes !== null && externalPriceYes >= 0.99);
  const domainMatch = marketMatchesDomain(market, policy.domain);
  const stateActionable = !closedOrResolved && !deterministicOutcome;
  const timingActionable = (
    stateActionable
    && (
      minutesToResolution === null
      || minutesToResolution >= policy.minimumActionableMinutesToResolution
    )
  );
  const opportunityScore = Number(market.opportunity_score ?? market.score ?? market.rank ?? 0);
  return {
    ...market,
    market_id: marketId,
    market_status: status || 'unknown',
    external_price_yes: externalPriceYes,
    domain_match: domainMatch,
    state_actionable: stateActionable,
    timing_actionable: timingActionable,
    effective_tradable: domainMatch && stateActionable && timingActionable,
    minutes_to_resolution: minutesToResolution,
    closed_or_resolved: closedOrResolved,
    deterministic_outcome: deterministicOutcome,
    opportunity_score: opportunityScore,
    opportunity_score_informative: opportunityScore > 0,
    market_id_integrity_ok: market.market_id_integrity_ok !== false,
    opportunity_blockers: [
      ...(domainMatch ? [] : [`domain_mismatch:${policy.domain}`]),
      ...(closedOrResolved ? [`market_closed_or_resolved:${status || 'closed'}`] : []),
      ...(deterministicOutcome ? [`external_price_yes_at_or_above_0.99:${externalPriceYes}`] : []),
      ...(
        stateActionable && !timingActionable
          ? [`timing_window_too_short:${minutesToResolution}m_remaining_below_${policy.minimumActionableMinutesToResolution}m_minimum`]
          : []
      ),
      ...(
        !stateActionable
        && minutesToResolution !== null
        && minutesToResolution >= policy.minimumActionableMinutesToResolution
          ? [`market_state_overrides_timing:${minutesToResolution}m_remaining`]
          : []
      ),
      ...(market.market_id_integrity_ok === false ? [`market_id_mismatch:${market.source_market_id || 'unknown'}`] : []),
      ...(opportunityScore > 0 ? [] : ['opportunity_score_uninformative']),
    ],
  };
}

function countEligibleOpportunities(markets) {
  return asArray(markets).filter((market) => market.effective_tradable).length;
}

function extractMarketsArray(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  const source = (raw && typeof raw === 'object')
    ? (raw.data || raw.result || raw)
    : {};
  if (Array.isArray(source)) {
    return source;
  }
  return asArray(
    source.markets
    || source.results
    || source.items
    || source.data
  );
}

function normalizeSearchMarket(market, query, policy) {
  const marketId = market.market_id || market.id || market.marketId || market.uuid || '';
  return normalizeOpportunity({
    market_id: marketId,
    question: market.question || market.title || market.name || market.headline_summary || market.slug || marketId,
    url: market.url || (marketId ? `https://simmer.markets/${marketId}` : ''),
    resolves_at: (
      market.resolves_at
      || market.resolve_time
      || market.resolution_time
      || market.ends_at
      || market.expiration_time
      || market.end_date
      || market.close_time
      || ''
    ),
    market_source: market.market_source || market.source || 'markets_search',
    opportunity_score: Number(market.opportunity_score ?? market.score ?? market.rank ?? 0),
    tags: normalizeTags(market.tags || market.categories || market.topics),
    discovery_query: query,
  }, policy);
}

function fallbackDiscoveryConfig(binding, policy) {
  const configured = ((binding.raw || {}).fallbackDiscovery || {})[policy.domain] || {};
  return {
    queries: Array.isArray(configured.queries) && configured.queries.length > 0
      ? configured.queries
      : ['bitcoin', 'ethereum', 'solana', 'dogecoin'],
    limit: Number(configured.limit || 8),
  };
}

async function discoverFallbackOpportunities(binding, policy) {
  const config = fallbackDiscoveryConfig(binding, policy);
  const endpoint = resolveEndpoint(binding, 'searchMarkets');
  const seen = new Map();
  for (const query of config.queries) {
    const raw = await requestJson({
      method: endpoint.method,
      url: endpoint.url,
      payload: { q: query, limit: config.limit },
      binding,
    });
    for (const market of extractMarketsArray(raw)) {
      const normalized = normalizeSearchMarket(market, query, policy);
      if (!normalized.market_id || seen.has(normalized.market_id)) {
        continue;
      }
      seen.set(normalized.market_id, normalized);
    }
  }
  return {
    queries: config.queries,
    candidates: Array.from(seen.values())
      .filter((market) => market.domain_match && market.timing_actionable),
  };
}

async function enrichOpportunitiesWithLiveState(binding, markets, policy) {
  const enriched = await Promise.all(asArray(markets).map(async (market) => {
    if (!market.market_id) {
      return normalizeOpportunity({
        ...market,
        market_id_integrity_ok: false,
        source_market_id: '',
      }, policy);
    }
    try {
      const endpoint = resolveEndpointUrl(binding, 'getMarket', { market_id: market.market_id });
      const raw = await requestJson({ method: endpoint.method, url: endpoint.url, payload: {}, binding });
      const source = raw.market || raw.data || raw.result || raw;
      const sourceMarketId = String(source.market_id || source.id || source.marketId || source.uuid || '').trim();
      return normalizeOpportunity({
        ...market,
        ...source,
        market_id: market.market_id,
        source_market_id: sourceMarketId || market.market_id,
        market_id_integrity_ok: !sourceMarketId || sourceMarketId === market.market_id,
      }, policy);
    } catch (error) {
      return normalizeOpportunity({
        ...market,
        live_state_error: error.message,
      }, policy);
    }
  }));
  return enriched;
}

function maybeWriteEvent({ workflowName, runId, stepName, payload }) {
  if (!workflowName || !runId || !stepName) {
    return null;
  }
  const eventPath = path.join(
    runtimeDir,
    'runs',
    sanitizeSegment(workflowName, 'unknown-workflow'),
    sanitizeSegment(runId, 'missing-run-id'),
    'events',
    `${sanitizeSegment(stepName, 'event')}.yaml`
  );
  writeYamlFile(eventPath, payload);
  return eventPath;
}

function requestJson({ method, url, payload, binding }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const headers = { Accept: 'application/json' };
    const body = method === 'GET' ? null : JSON.stringify(payload);
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    if (binding.apiKey) {
      const token = binding.authScheme ? `${binding.authScheme} ${binding.apiKey}` : binding.apiKey;
      headers[binding.authHeader] = token;
    }
    let requestPath = `${parsed.pathname}${parsed.search || ''}`;
    if (method === 'GET' && payload && Object.keys(payload).length > 0) {
      const params = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null || typeof value === 'object') {
          return;
        }
        params.set(key, String(value));
      });
      const qs = params.toString();
      if (qs) {
        requestPath = `${parsed.pathname}?${qs}`;
      }
    }
    const req = lib.request(
      {
        method,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: requestPath,
        headers,
        timeout: binding.timeoutMs,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const text = data.trim();
          const isJson = (res.headers['content-type'] || '').includes('application/json');
          const parsedBody = isJson && text ? JSON.parse(text) : (text ? { raw: text } : {});
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedBody);
            return;
          }
          const error = new Error(`Simmer request failed (${res.statusCode}): ${text.slice(0, 500)}`);
          error.statusCode = res.statusCode;
          error.responseText = text;
          error.responseBody = parsedBody;
          reject(error);
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error(`Simmer request timed out after ${binding.timeoutMs}ms`));
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function isNotFoundError(error) {
  return Boolean(error && error.statusCode === 404);
}

function summarizeResolutionTiming(resolvesAt) {
  if (!resolvesAt) {
    return 'Resolution timing unavailable.';
  }
  const now = Date.now();
  const ts = Date.parse(resolvesAt);
  if (Number.isNaN(ts)) {
    return `Resolution scheduled at ${resolvesAt}.`;
  }
  const hours = Math.max(0, (ts - now) / 3600000);
  if (hours < 1) {
    return `Resolves in under 1 hour at ${resolvesAt}.`;
  }
  if (hours < 24) {
    return `Resolves in about ${hours.toFixed(1)} hours at ${resolvesAt}.`;
  }
  return `Resolves in about ${(hours / 24).toFixed(1)} days at ${resolvesAt}.`;
}

function minutesUntil(timestamp) {
  if (!timestamp) {
    return null;
  }
  const ts = Date.parse(timestamp);
  if (Number.isNaN(ts)) {
    return null;
  }
  return Math.max(0, Math.round((ts - Date.now()) / 60000));
}

function evaluateRiskEnvelope(briefing, policy) {
  const riskAlerts = asArray(briefing.risk_alerts);
  const positions = asArray(briefing.positions);
  const openOrders = asArray(briefing.open_orders);
  const balanceSnapshot = briefing.balance_snapshot || {};
  const actions = [];
  let newEntriesAllowed = true;
  let portfolioNote = 'risk contained, no intervention required';

  if (riskAlerts.length > 0) {
    newEntriesAllowed = false;
    portfolioNote = 'entries blocked by unresolved alerts';
  } else if (!balanceSnapshot.sizing_basis_reliable) {
    newEntriesAllowed = false;
    portfolioNote = 'entries blocked by missing balance basis';
  } else if (
    balanceSnapshot.max_total_exposure_notional !== null
    && balanceSnapshot.current_open_exposure > balanceSnapshot.max_total_exposure_notional
  ) {
    newEntriesAllowed = false;
    portfolioNote = 'entries blocked by total exposure cap';
  } else if (positions.length >= policy.maxOpenPositions) {
    newEntriesAllowed = false;
    portfolioNote = 'entries blocked by active position count';
  } else if (openOrders.length > 0) {
    portfolioNote = 'open orders present; no new position-level intervention required';
  }

  positions.forEach((position) => {
    const marketId = position.market_id || position.id || position.market?.id || '';
    actions.push({
      market_id: marketId,
      decision: (
        riskAlerts.length > 0
        || (
          balanceSnapshot.max_total_exposure_notional !== null
          && balanceSnapshot.current_open_exposure > balanceSnapshot.max_total_exposure_notional
        )
      ) ? 'reduce' : 'hold',
      reason: riskAlerts.length > 0
        ? 'unresolved portfolio alert'
        : (
          balanceSnapshot.max_total_exposure_notional !== null
          && balanceSnapshot.current_open_exposure > balanceSnapshot.max_total_exposure_notional
        )
          ? 'total exposure exceeds percent-of-balance cap'
          : 'position within envelope',
      priority: (
        riskAlerts.length > 0
        || (
          balanceSnapshot.max_total_exposure_notional !== null
          && balanceSnapshot.current_open_exposure > balanceSnapshot.max_total_exposure_notional
        )
      ) ? 'high' : 'low',
    });
  });

  return {
    strategy_profile_id: briefing.strategy_profile_id || policy.id,
    policy_version: briefing.policy_version || policy.policyVersion,
    run_id: briefing.run_id || '',
    new_entries_allowed: newEntriesAllowed,
    actions,
    portfolio_note: portfolioNote,
  };
}

function buildFallbackContext({ marketId, marketRaw, positionsRaw, tradesRaw, args, policy, nativeContextError }) {
  const market = marketRaw.market || marketRaw;
  const sourceMarketId = String(market.market_id || market.id || market.marketId || market.uuid || '').trim();
  const marketIdIntegrityOk = !sourceMarketId || sourceMarketId === marketId;
  const minutesToResolution = minutesUntil(market.resolves_at);
  const status = String(market.status || market.market_status || '').trim().toLowerCase();
  const closedOrResolved = Boolean(
    market.closed === true
    || market.resolved === true
    || ['closed', 'resolved', 'settled', 'inactive', 'expired', 'finalized'].includes(status)
  );
  const externalPriceYes = (
    market.external_price_yes !== undefined && market.external_price_yes !== null
      ? Number(market.external_price_yes)
      : null
  );
  const deterministicOutcome = Boolean(externalPriceYes !== null && externalPriceYes >= 0.99);
  const positions = asArray(positionsRaw.positions);
  const relatedPosition = positions.find((position) => (
    position.market_id === marketId
    || position.id === marketId
    || position.market?.id === marketId
    || position.market_question === market.question
  )) || null;
  const recentTrades = asArray(tradesRaw.trades).filter((trade) => trade.market_id === marketId);
  const catalysts = [];
  if (market.import_source) {
    catalysts.push(`import_source:${market.import_source}`);
  }
  if (Array.isArray(market.tags)) {
    market.tags.slice(0, 5).forEach((tag) => catalysts.push(`tag:${tag}`));
  }
  if (market.opportunity_score !== undefined && market.opportunity_score !== null) {
    catalysts.push(`opportunity_score:${market.opportunity_score}`);
  }
  if (market.divergence !== undefined && market.divergence !== null) {
    catalysts.push(`divergence:${market.divergence}`);
  }
  if (market.external_price_yes !== undefined && market.external_price_yes !== null) {
    catalysts.push(`external_price_yes:${market.external_price_yes}`);
  }

  const liquidityBits = [];
  if (market.spread !== undefined && market.spread !== null) {
    liquidityBits.push(`spread=${market.spread}`);
  }
  if (market.volume_24h !== undefined && market.volume_24h !== null) {
    liquidityBits.push(`volume_24h=${market.volume_24h}`);
  } else {
    liquidityBits.push('volume_24h unavailable');
  }
  if (market.tick_size !== undefined && market.tick_size !== null) {
    liquidityBits.push(`tick_size=${market.tick_size}`);
  }
  if (market.fee_rate_bps !== undefined && market.fee_rate_bps !== null) {
    liquidityBits.push(`fee_rate_bps=${market.fee_rate_bps}`);
  }

  const riskNotes = [];
  if (nativeContextError) {
    riskNotes.push('Native Simmer context lookup returned 404 for this market_id; using fallback live synthesis from market, positions, and trades endpoints.');
  }
  if (market.status && market.status !== 'active') {
    riskNotes.push(`market_status:${market.status}`);
  }
  if (!marketIdIntegrityOk) {
    riskNotes.push(`market_id_mismatch:requested=${marketId};source=${sourceMarketId}`);
  }
  if (closedOrResolved) {
    riskNotes.push(`market_closed_or_resolved:${status || 'closed'}`);
  }
  if (deterministicOutcome) {
    riskNotes.push(`external_price_yes_at_or_above_0.99:${externalPriceYes}`);
  }
  if (relatedPosition) {
    riskNotes.push('Existing position history detected for this market.');
  }
  if (recentTrades.length > 0) {
    riskNotes.push(`recent_sim_trades:${recentTrades.length}`);
  }
  if (market.spread !== undefined && market.spread !== null && Number(market.spread) > 0.05) {
    riskNotes.push(`wide_spread:${market.spread}`);
  }
  if (market.volume_24h === null || market.volume_24h === undefined) {
    riskNotes.push('volume_24h unavailable; liquidity confidence is limited');
  }
  if (
    minutesToResolution !== null
    && minutesToResolution < policy.minimumActionableMinutesToResolution
  ) {
    riskNotes.push(`timing_window_too_short:${minutesToResolution}m_remaining_below_${policy.minimumActionableMinutesToResolution}m_minimum`);
  }
  if (nativeContextError?.responseBody?.detail) {
    riskNotes.push(`native_context_error:${nativeContextError.responseBody.detail}`);
  }
  if (
    (closedOrResolved || deterministicOutcome)
    && minutesToResolution !== null
    && minutesToResolution >= policy.minimumActionableMinutesToResolution
  ) {
    riskNotes.push(`market_state_overrides_timing:${minutesToResolution}m_remaining`);
  }

  return {
    market_id: marketId,
    strategy_profile_id: args['strategy-profile-id'] || policy.id,
    policy_version: args['policy-version'] || policy.policyVersion,
    run_id: args['run-id'] || '',
    headline_summary: market.question || market.event_name || marketId,
    catalysts,
    liquidity_notes: liquidityBits.join('; '),
    timing_notes: summarizeResolutionTiming(market.resolves_at),
    risk_notes: riskNotes,
    context_freshness: (
      !marketIdIntegrityOk
        ? 'market_id_mismatch'
        : (closedOrResolved || deterministicOutcome)
          ? 'market_not_tradable'
          : (
            minutesToResolution !== null
            && minutesToResolution < policy.minimumActionableMinutesToResolution
          )
            ? 'timing_window_too_short'
            : (nativeContextError ? 'fallback_live_market_snapshot' : 'market_snapshot_live')
    ),
    lookup_mode: 'fallback_market_positions_trades',
    market_id_integrity_ok: marketIdIntegrityOk,
    source_market_id: sourceMarketId || marketId,
  };
}

function normalizeBriefingResponse(raw, args, policy) {
  const source = (raw.briefing && typeof raw.briefing === 'object')
    ? raw.briefing
    : ((raw.data && typeof raw.data === 'object')
      ? raw.data
      : ((raw.result && typeof raw.result === 'object') ? raw.result : raw));
  const opportunities = source.opportunities && typeof source.opportunities === 'object'
    ? source.opportunities
    : { new_markets: asArray(source.new_markets) };
  if (!Array.isArray(opportunities.new_markets)) {
    opportunities.new_markets = asArray(opportunities.new_markets);
  }
  opportunities.new_markets = opportunities.new_markets.map((market) => normalizeOpportunity(market, policy));
  const positions = extractPositionsFromBriefing(source);
  const balanceSnapshot = buildBalanceSnapshot(source, positions, policy);
  const performance = extractPerformanceFromBriefing(source, source.venues?.sim || {});
  return {
    timestamp: source.timestamp || source.generated_at || source.as_of || new Date().toISOString(),
    strategy_profile_id: args['strategy-profile-id'] || policy.id,
    policy_version: args['policy-version'] || policy.policyVersion,
    run_id: args['run-id'] || '',
    positions,
    open_orders: asArray(source.open_orders || source.orders),
    risk_alerts: asArray(source.risk_alerts || source.alerts),
    opportunities,
    performance,
    balance_snapshot: balanceSnapshot,
    portfolio_constraints: source.portfolio_constraints || buildPortfolioConstraints(policy, balanceSnapshot),
  };
}

function numberOrNull(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
}

function roundMetric(value, decimals = 4) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(decimals));
}

function summarizeResponseKeys(source) {
  return Object.keys(source || {});
}

function findPositionByMarketId(positionsRaw, marketId) {
  const source = (positionsRaw && typeof positionsRaw === 'object')
    ? (positionsRaw.positions || positionsRaw.data || positionsRaw.result || positionsRaw)
    : [];
  const positions = asArray(source);
  return positions.find((position) => (
    position.market_id === marketId
    || position.id === marketId
    || position.market?.id === marketId
  )) || null;
}

function normalizeExposurePosition(position, marketId) {
  if (!position) {
    return {};
  }
  return {
    market_id: marketId,
    shares: numberOrNull(position.shares, position.quantity, position.position_size, position.size, 0),
    avg_cost: numberOrNull(position.avg_cost, position.average_price, position.avgPrice, position.cost_basis, null),
    current_value: numberOrNull(position.current_value, position.market_value, position.value, null),
    pnl: numberOrNull(position.pnl, position.unrealized_pnl, position.profit_loss, null),
    status: position.status || 'active',
  };
}

function estimatePositionCurrentValue(position) {
  const explicitValue = numberOrNull(position.current_value, position.market_value, position.value, null);
  if (explicitValue !== null && explicitValue > 0) {
    return explicitValue;
  }
  const shares = numberOrNull(position.shares, position.quantity, position.position_size, position.size, 0);
  const currentPrice = numberOrNull(position.current_price, position.mark_price, position.price, null);
  const avgEntry = numberOrNull(position.avg_entry, position.avg_cost, position.average_price, null);
  const pnl = numberOrNull(position.pnl, position.unrealized_pnl, 0);
  const markToMarket = shares > 0 && currentPrice !== null ? shares * currentPrice : null;
  const costPlusPnl = shares > 0 && avgEntry !== null ? (shares * avgEntry) + pnl : null;
  const candidates = [markToMarket, costPlusPnl].filter((value) => value !== null && value > 0);
  return candidates.length > 0 ? Math.max(...candidates) : 0;
}

function normalizeBriefingPosition(position) {
  return {
    market_id: position.market_id || position.id || position.market?.id || '',
    question: position.question || position.market_question || position.market?.question || '',
    side: position.side || position.position_side || '',
    shares: numberOrNull(position.shares, position.quantity, position.position_size, position.size, 0),
    avg_entry: numberOrNull(position.avg_entry, position.avg_cost, position.average_price, null),
    current_price: numberOrNull(position.current_price, position.mark_price, position.price, null),
    pnl: numberOrNull(position.pnl, position.unrealized_pnl, 0),
    current_value: roundMetric(estimatePositionCurrentValue(position), 4),
    market_source: position.market_source || position.source || '',
    resolves_at: position.resolves_at || position.market?.resolves_at || '',
  };
}

function extractPositionsFromBriefing(source) {
  const direct = asArray(source.positions || source.open_positions);
  if (direct.length > 0) {
    return direct.map((position) => normalizeBriefingPosition(position));
  }
  const simVenue = source.venues?.sim || {};
  return asArray(simVenue.positions || simVenue.positions_needing_attention)
    .map((position) => normalizeBriefingPosition(position));
}

function extractPerformanceFromBriefing(source, simVenue = {}) {
  return source.performance
    || source.portfolio_performance
    || {
      total_pnl: numberOrNull(simVenue.pnl, null),
      pnl_percent: numberOrNull(source.performance?.pnl_percent, null),
      win_rate: numberOrNull(source.performance?.win_rate, null),
      rank: numberOrNull(source.performance?.rank, null),
      total_agents: numberOrNull(source.performance?.total_agents, null),
    };
}

function buildBalanceSnapshot(source, positions, policy) {
  const simVenue = source.venues?.sim || {};
  const balanceCandidates = [
    { field: 'venues.sim.balance', value: numberOrNull(simVenue.balance, null) },
    { field: 'portfolio_value', value: numberOrNull(source.portfolio_value, source.balance, null) },
    { field: 'positions.current_value_sum', value: roundMetric(positions.reduce((sum, position) => sum + numberOrNull(position.current_value, 0), 0), 4) },
  ];
  const selected = balanceCandidates.find((candidate) => candidate.value !== null && candidate.value > 0) || { field: '', value: null };
  const openExposure = roundMetric(
    positions.reduce((sum, position) => sum + numberOrNull(position.current_value, 0), 0),
    4
  );
  const basis = selected.value;
  const maxPositionNotional = basis !== null ? roundMetric(basis * policy.maxPositionPctOfBalance, 2) : null;
  const maxTotalExposureNotional = basis !== null ? roundMetric(basis * policy.maxTotalExposurePctOfBalance, 2) : null;
  const remainingNewExposureCapacity = (
    maxTotalExposureNotional !== null
      ? roundMetric(Math.max(0, maxTotalExposureNotional - openExposure), 2)
      : null
  );
  const venueCapNotional = policy.maxTradeNotionalForSim;
  const finalProposedSizeCap = [maxPositionNotional, venueCapNotional, remainingNewExposureCapacity]
    .filter((value) => value !== null && value !== undefined && Number.isFinite(value))
    .reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY);
  return {
    balance_basis: basis,
    balance_basis_field: selected.field,
    available_balance: basis,
    current_open_exposure: openExposure,
    current_open_exposure_pct_of_balance: basis && basis > 0 ? roundMetric(openExposure / basis, 4) : null,
    max_position_notional: maxPositionNotional,
    max_total_exposure_notional: maxTotalExposureNotional,
    remaining_new_exposure_capacity: remainingNewExposureCapacity,
    venue_cap_notional: venueCapNotional,
    final_proposed_size_cap: Number.isFinite(finalProposedSizeCap) ? roundMetric(finalProposedSizeCap, 2) : null,
    sizing_basis_reliable: basis !== null && basis > 0,
  };
}

function evaluateSizingPolicyGate(balanceSnapshot, proposedSize, policy) {
  if (!balanceSnapshot?.sizing_basis_reliable) {
    return { pass: false, reason: 'missing balance basis for sizing policy' };
  }
  if (policy.maxTradeNotionalForSim !== null && proposedSize > policy.maxTradeNotionalForSim) {
    return { pass: false, reason: 'proposed size exceeds sim venue operational cap' };
  }
  if (proposedSize > balanceSnapshot.max_position_notional) {
    return { pass: false, reason: 'proposed size exceeds max_position_pct_of_balance' };
  }
  if (balanceSnapshot.current_open_exposure >= balanceSnapshot.max_total_exposure_notional) {
    return { pass: false, reason: 'current open exposure already exceeds max_total_exposure_pct_of_balance' };
  }
  if ((balanceSnapshot.current_open_exposure + proposedSize) > balanceSnapshot.max_total_exposure_notional) {
    return { pass: false, reason: 'proposed size breaches max_total_exposure_pct_of_balance' };
  }
  return { pass: true, reason: '' };
}

async function applyBriefingFallbackDiscovery(normalized, binding, policy) {
  const existingMarkets = await enrichOpportunitiesWithLiveState(
    binding,
    asArray(normalized.opportunities?.new_markets),
    policy
  );
  normalized.opportunities.new_markets = existingMarkets;
  const existingEligible = countEligibleOpportunities(existingMarkets);
  normalized.opportunities.discovery_metadata = {
    source: 'briefing',
    briefing_candidate_count: existingMarkets.length,
    briefing_eligible_count: existingEligible,
    fallback_used: false,
  };
  if (existingEligible > 0) {
    return normalized;
  }
  const fallback = await discoverFallbackOpportunities(binding, policy);
  const fallbackCandidates = await enrichOpportunitiesWithLiveState(binding, fallback.candidates, policy);
  normalized.opportunities.discovery_metadata = {
    source: fallbackCandidates.length > 0 ? 'markets_search_fallback' : 'briefing',
    briefing_candidate_count: existingMarkets.length,
    briefing_eligible_count: existingEligible,
    fallback_used: fallbackCandidates.length > 0,
    fallback_candidate_count: fallbackCandidates.length,
    fallback_queries: fallback.queries,
  };
  if (fallbackCandidates.length > 0) {
    normalized.opportunities.new_markets = fallbackCandidates;
  }
  return normalized;
}

function normalizeDryRunResponse(raw, args, policy) {
  const source = (raw.dry_run && typeof raw.dry_run === 'object')
    ? raw.dry_run
    : ((raw.data && typeof raw.data === 'object')
      ? raw.data
      : ((raw.result && typeof raw.result === 'object') ? raw.result : raw));
  const firstTrade = Array.isArray(source.trades)
    ? source.trades[0]
    : (Array.isArray(source.results) ? source.results[0] : null);
  const tradeSource = firstTrade || source;
  const policyPass = Boolean(
    source.policy_pass ??
    source.policyPass ??
    firstTrade?.policy_pass ??
    firstTrade?.policyPass ??
    firstTrade?.success ??
    true
  );
  const estimatedCost = numberOrNull(
    tradeSource.estimated_cost,
    tradeSource.estimatedCost,
    tradeSource.cost,
    source.total_cost,
    source.estimated_cost,
    0
  );
  const directShares = numberOrNull(
    tradeSource.estimated_shares,
    tradeSource.estimatedShares,
    tradeSource.shares,
    tradeSource.shares_bought,
    tradeSource.sharesBought,
    tradeSource.shares_sold,
    tradeSource.sharesSold,
    tradeSource.shares_requested,
    tradeSource.sharesRequested,
    null
  );
  const referencePrice = numberOrNull(
    tradeSource.price,
    tradeSource.reference_price,
    tradeSource.referencePrice,
    source.reference_price,
    source.referencePrice,
    null
  );
  let estimatedShares = directShares;
  let shareEstimationSource = directShares !== null && directShares > 0 ? 'api' : 'missing';
  if ((estimatedShares === null || estimatedShares === 0) && estimatedCost > 0 && referencePrice > 0) {
    estimatedShares = roundMetric(estimatedCost / referencePrice);
    shareEstimationSource = 'derived_cost_div_price';
  }
  return {
    market_id: args['market-id'],
    strategy_profile_id: args['strategy-profile-id'] || policy.id,
    policy_version: args['policy-version'] || policy.policyVersion,
    run_id: args['run-id'],
    estimated_cost: estimatedCost,
    estimated_shares: roundMetric(estimatedShares ?? 0),
    slippage_notes: tradeSource.slippage_notes ?? tradeSource.slippageNotes ?? asArray(source.warnings).join('; '),
    policy_pass: policyPass,
    policy_fail_reason: policyPass ? '' : (
      source.policy_fail_reason ??
      source.policyFailReason ??
      tradeSource.policy_fail_reason ??
      tradeSource.policyFailReason ??
      tradeSource.error ??
      'dry-run policy rejection'
    ),
    reference_price: referencePrice ?? 0,
    share_estimation_source: shareEstimationSource,
    raw_response_summary: {
      response_keys: summarizeResponseKeys(source),
      trade_keys: summarizeResponseKeys(tradeSource),
      has_price: referencePrice !== null,
      has_shares: directShares !== null,
    },
  };
}

function normalizeExecutionResponse(raw, args, policy, reconciliation = {}) {
  const source = (raw.execution && typeof raw.execution === 'object')
    ? raw.execution
    : ((raw.data && typeof raw.data === 'object')
      ? raw.data
      : ((raw.result && typeof raw.result === 'object') ? raw.result : raw));
  const filledSizeRaw = numberOrNull(
    source.filled_size,
    source.filledSize,
    source.shares_filled,
    source.sharesFilled,
    source.shares_bought,
    source.sharesBought,
    source.shares_sold,
    source.sharesSold,
    source.shares_requested,
    source.sharesRequested,
    null
  );
  const cost = numberOrNull(source.cost, source.total_cost, null);
  const averagePriceRaw = numberOrNull(source.average_price, source.averagePrice, null);
  const filledSize = roundMetric(filledSizeRaw ?? 0);
  const averagePrice = (
    averagePriceRaw !== null && averagePriceRaw > 0
      ? averagePriceRaw
      : ((cost !== null && filledSize > 0) ? roundMetric(cost / filledSize) : 0)
  );
  return {
    trade_id: source.trade_id || source.tradeId || source.id || '',
    market_id: args['market-id'],
    strategy_profile_id: args['strategy-profile-id'] || policy.id,
    policy_version: args['policy-version'] || policy.policyVersion,
    run_id: args['run-id'],
    status: source.status || source.order_status || (source.success === true ? 'confirmed' : 'submitted'),
    filled_size: filledSize,
    average_price: averagePrice,
    exposure_after_trade: reconciliation.exposure_after_trade || source.exposure_after_trade || source.exposureAfterTrade || {},
    raw_response_summary: {
      has_trade_id: Boolean(source.trade_id || source.tradeId || source.id),
      has_status: Boolean(source.status || source.order_status),
      has_average_price: averagePriceRaw !== null && averagePriceRaw > 0,
      response_keys: summarizeResponseKeys(source),
    },
    reconciliation_source: reconciliation.reconciliation_source || '',
    reconciliation_timestamp: reconciliation.reconciliation_timestamp || '',
  };
}

function validateVenue(value) {
  if (value !== 'sim') {
    throw new Error(`Venue must be sim. Received: ${value}`);
  }
}

function requireApiKey(binding, commandName) {
  if (!binding.apiKey) {
    throw new Error(`${commandName} requires SIMMER_API_KEY via process env, runtime/env/simmer.env, ~/.openclaw/.env, or macOS Keychain.`);
  }
}

function validateActiveProfile(value) {
  if (value !== 'crypto_momentum_v1') {
    throw new Error(`strategy_profile_id must be crypto_momentum_v1. Received: ${value}`);
  }
}

function validateJournalPayload(payload, tracking) {
  const required = ['run_id', 'workflow_name', 'strategy_profile_id', 'policy_version'];
  for (const field of required) {
    if (!payload[field]) {
      throw new Error(`Journal payload missing required attribution field: ${field}`);
    }
  }
  validateActiveProfile(payload.strategy_profile_id);
  for (const field of tracking.minimumJournalRecord) {
    if (!(field in payload)) {
      throw new Error(`Journal payload missing minimum field from tracking-schema.yaml: ${field}`);
    }
  }
}

function validateReviewPayload(payload) {
  const required = [
    'review_window',
    'workflow_name',
    'profiles_reviewed',
    'best_profiles',
    'weak_profiles',
    'good_patterns',
    'bad_patterns',
    'recommended_policy_changes',
    'changes_to_test_next',
    'do_not_change',
  ];
  for (const field of required) {
    if (!(field in payload)) {
      throw new Error(`Review payload missing required field: ${field}`);
    }
  }
}

function writeJournal(payload) {
  const timestamp = payload.decision_timestamp || new Date().toISOString();
  const { yyyy, mm, dd } = formatIsoDateParts(timestamp);
  const workflowName = sanitizeSegment(payload.workflow_name, 'unknown-workflow');
  const entryId = payload.entry_id || `${sanitizeSegment(payload.run_id, 'missing-run-id')}--${Date.now()}`;
  const fileName = `${sanitizeSegment(timestamp.replace(/[:]/g, '-'), 'decision')}--${sanitizeSegment(entryId, 'entry')}.yaml`;
  const journalPath = path.join(runtimeDir, 'journals', yyyy, mm, dd, workflowName, fileName);
  writeYamlFile(journalPath, payload);
  return {
    journal_path: journalPath,
    entry_id: entryId,
    strategy_profile_id: payload.strategy_profile_id,
    policy_version: payload.policy_version,
    run_id: payload.run_id,
    workflow_name: payload.workflow_name,
  };
}

function writeReview(payload, runId, requestedPath) {
  const windowEnd = payload.review_window?.end || new Date().toISOString();
  const targetPath = requestedPath && requestedPath !== ''
    ? requestedPath
    : path.join(
        runtimeDir,
        'reviews',
        getIsoWeekParts(windowEnd).year,
        getIsoWeekParts(windowEnd).week,
        `${sanitizeSegment(runId, 'missing-run-id')}-paper-strategy-review.yaml`
      );
  writeYamlFile(targetPath, payload);
  return { report_path: targetPath };
}

function usage() {
  console.log(`Simmer Runtime

Usage:
  node simmer-runtime.js health [--ping]
  node simmer-runtime.js briefing --venue sim [--domain DOMAIN] [--run-id RUN_ID] [--workflow-name WORKFLOW] [--step-name STEP]
  node simmer-runtime.js risk-review --payload-file FILE | --briefing-file FILE
  node simmer-runtime.js context --market-id ID --venue sim --domain DOMAIN --run-id RUN_ID --strategy-profile-id crypto_momentum_v1 --policy-version VERSION [--workflow-name WORKFLOW] [--step-name STEP]
  node simmer-runtime.js dry-run --market-id ID --side SIDE --size SIZE --venue sim --reasoning TEXT --source TEXT --strategy-profile-id crypto_momentum_v1 --policy-version VERSION --run-id RUN_ID [--workflow-name WORKFLOW] [--step-name STEP]
  node simmer-runtime.js execute --market-id ID --side SIDE --size SIZE --venue sim --reasoning TEXT --source TEXT --dry-run-ref-file FILE --strategy-profile-id crypto_momentum_v1 --policy-version VERSION --run-id RUN_ID [--workflow-name WORKFLOW] [--step-name STEP]
  node simmer-runtime.js write-journal --payload-file FILE
  node simmer-runtime.js write-review --payload-file FILE --run-id RUN_ID [--report-path FILE]
  node simmer-runtime.js write-event --workflow-name WORKFLOW --run-id RUN_ID --step-name STEP --payload-file FILE`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || command === 'help' || command === '--help') {
    usage();
    process.exit(0);
  }

  const binding = resolveBinding();
  const policy = parseStrategyProfile();
  const tracking = parseTrackingSchema();

  if (command === 'health') {
    const health = {
      status: binding.apiBaseUrl ? 'configured' : 'missing-env',
      transport: binding.raw.transport,
      api_base_url_present: Boolean(binding.apiBaseUrl),
      api_key_present: Boolean(binding.apiKey),
      api_base_url_source: binding.apiBaseUrlSource || '',
      api_key_source: binding.apiKeySource || '',
      venue: binding.venue,
      domain: binding.domain,
      active_profile_id: policy.id,
      policy_version: policy.policyVersion,
      env_sources: binding.envSources,
      storage: binding.raw.storage,
    };
    if (args.ping && binding.apiBaseUrl) {
      try {
        const endpoint = resolveEndpoint(binding, 'health');
        health.ping = await requestJson({ method: endpoint.method, url: endpoint.url, payload: {}, binding });
        health.status = 'ok';
      } catch (error) {
        health.status = 'ping-failed';
        health.error = error.message;
      }
    }
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  if (command === 'briefing') {
    validateVenue(args.venue);
    requireApiKey(binding, 'briefing');
    const endpoint = resolveEndpoint(binding, 'briefing');
    const strategyProfileId = args['strategy-profile-id'] || policy.id;
    const policyVersion = args['policy-version'] || policy.policyVersion;
    const domain = args.domain || policy.domain;
    const payload = {
      since: args.since || '',
      venue: args.venue,
      domain,
      strategy_profile_id: strategyProfileId,
      policy_version: policyVersion,
      run_id: args['run-id'] || '',
    };
    const metadata = {
      venue: args.venue,
      domain,
      strategy_profile_id: strategyProfileId,
      policy_version: policyVersion,
      run_id: args['run-id'] || '',
    };
    validateActiveProfile(metadata.strategy_profile_id);
    const raw = await requestJson({ method: endpoint.method, url: endpoint.url, payload, binding });
    if (args['debug-raw']) {
      console.error(JSON.stringify(raw, null, 2));
    }
    const normalized = await applyBriefingFallbackDiscovery(
      normalizeBriefingResponse(raw, args, policy),
      binding,
      policy
    );
    normalized.strategy_profile_id = metadata.strategy_profile_id;
    normalized.policy_version = metadata.policy_version;
    normalized.run_id = metadata.run_id;
    const eventPath = maybeWriteEvent({
      workflowName: args['workflow-name'],
      runId: args['run-id'],
      stepName: args['step-name'] || 'initial_briefing',
      payload: normalized,
    });
    if (eventPath) {
      normalized.event_path = eventPath;
    }
    console.log(JSON.stringify(normalized, null, 2));
    return;
  }

  if (command === 'risk-review') {
    const payload = args['briefing-file']
      ? JSON.parse(fs.readFileSync(args['briefing-file'], 'utf8'))
      : await readPayload(args);
    validateActiveProfile(payload.strategy_profile_id || policy.id);
    const evaluation = evaluateRiskEnvelope(payload, policy);
    const eventPath = maybeWriteEvent({
      workflowName: args['workflow-name'],
      runId: payload.run_id || args['run-id'],
      stepName: args['step-name'] || 'risk_review',
      payload: evaluation,
    });
    if (eventPath) {
      evaluation.event_path = eventPath;
    }
    console.log(JSON.stringify(evaluation, null, 2));
    return;
  }

  if (command === 'context') {
    validateVenue(args.venue);
    validateActiveProfile(args['strategy-profile-id'] || policy.id);
    requireApiKey(binding, 'context');
    const marketEndpoint = resolveEndpointUrl(binding, 'getMarket', { market_id: args['market-id'] });
    const positionsEndpoint = resolveEndpoint(binding, 'positions');
    const tradesEndpoint = resolveEndpoint(binding, 'trades');
    const [marketRaw, positionsRaw, tradesRaw] = await Promise.all([
      requestJson({ method: marketEndpoint.method, url: marketEndpoint.url, payload: {}, binding }),
      requestJson({ method: positionsEndpoint.method, url: positionsEndpoint.url, payload: {}, binding }),
      requestJson({ method: tradesEndpoint.method, url: tradesEndpoint.url, payload: { venue: 'sim', limit: 20 }, binding }),
    ]);

    let nativeContextRaw = null;
    let nativeContextError = null;
    try {
      const endpoint = resolveEndpointUrl(binding, 'context', { market_id: args['market-id'] });
      nativeContextRaw = await requestJson({ method: endpoint.method, url: endpoint.url, payload: {}, binding });
    } catch (error) {
      nativeContextError = error;
    }
    if (args['debug-raw']) {
      console.error(JSON.stringify({ nativeContextRaw, nativeContextError: nativeContextError?.responseBody || nativeContextError?.message || null, marketRaw, positionsRaw, tradesRaw }, null, 2));
    }
    const context = buildFallbackContext({
      marketId: args['market-id'],
      marketRaw,
      positionsRaw,
      tradesRaw,
      args,
      policy,
      nativeContextError,
    });
    if (nativeContextRaw) {
      context.lookup_mode = 'market_snapshot_plus_native_context';
      if (!['timing_window_too_short', 'market_not_tradable', 'market_id_mismatch'].includes(context.context_freshness)) {
        context.context_freshness = 'native_context_live';
      }
      context.catalysts = [
        ...context.catalysts,
        ...asArray(nativeContextRaw.catalysts || nativeContextRaw.drivers || nativeContextRaw.signals),
      ];
      context.liquidity_notes = nativeContextRaw.liquidity_notes || nativeContextRaw.liquidity || context.liquidity_notes;
      context.timing_notes = nativeContextRaw.timing_notes || nativeContextRaw.timing || nativeContextRaw.market?.time_to_resolution || context.timing_notes;
      context.risk_notes = [
        ...asArray(context.risk_notes),
        ...asArray(nativeContextRaw.risk_notes || nativeContextRaw.risks || nativeContextRaw.watchouts || nativeContextRaw.warnings),
      ];
      if (!['market_not_tradable', 'market_id_mismatch'].includes(context.context_freshness)) {
        context.context_freshness = nativeContextRaw.context_freshness || nativeContextRaw.freshness || context.context_freshness;
      }
    } else if (nativeContextError && !isNotFoundError(nativeContextError)) {
      context.risk_notes = [
        ...asArray(context.risk_notes),
        `native_context_error:${nativeContextError.message}`,
      ];
    }
    const eventPath = maybeWriteEvent({
      workflowName: args['workflow-name'],
      runId: args['run-id'],
      stepName: args['step-name'] || 'market_context',
      payload: context,
    });
    if (eventPath) {
      context.event_path = eventPath;
    }
    console.log(JSON.stringify(context, null, 2));
    return;
  }

  if (command === 'dry-run') {
    validateVenue(args.venue);
    validateActiveProfile(args['strategy-profile-id']);
    requireApiKey(binding, 'dry-run');
    const briefingEndpoint = resolveEndpoint(binding, 'briefing');
    const sizingBriefingRaw = await requestJson({
      method: briefingEndpoint.method,
      url: briefingEndpoint.url,
      payload: {
        venue: args.venue,
        domain: policy.domain,
        strategy_profile_id: args['strategy-profile-id'],
        policy_version: args['policy-version'],
        run_id: args['run-id'] || '',
      },
      binding,
    });
    const sizingBriefing = normalizeBriefingResponse(sizingBriefingRaw, args, policy);
    const sizingGate = evaluateSizingPolicyGate(sizingBriefing.balance_snapshot, Number(args.size), policy);
    const endpoint = resolveEndpoint(binding, 'dryRun');
    const payload = {
      venue: args.venue,
      source: args.source,
      dry_run: true,
      trades: [
        {
          market_id: args['market-id'],
          side: args.side,
          amount: Number(args.size),
          reasoning: args.reasoning,
        },
      ],
    };
    const raw = await requestJson({ method: endpoint.method, url: endpoint.url, payload, binding });
    if (args['debug-raw']) {
      console.error(JSON.stringify(raw, null, 2));
    }
    const normalized = normalizeDryRunResponse(raw, args, policy);
    normalized.balance_basis = sizingBriefing.balance_snapshot.balance_basis;
    normalized.balance_basis_field = sizingBriefing.balance_snapshot.balance_basis_field;
    normalized.current_open_exposure = sizingBriefing.balance_snapshot.current_open_exposure;
    normalized.max_position_notional = sizingBriefing.balance_snapshot.max_position_notional;
    normalized.max_total_exposure_notional = sizingBriefing.balance_snapshot.max_total_exposure_notional;
    normalized.remaining_new_exposure_capacity = sizingBriefing.balance_snapshot.remaining_new_exposure_capacity;
    normalized.venue_cap_notional = sizingBriefing.balance_snapshot.venue_cap_notional;
    normalized.final_proposed_size_cap = sizingBriefing.balance_snapshot.final_proposed_size_cap;
    normalized.proposed_size = Number(args.size);
    normalized.policy_pass = normalized.policy_pass && sizingGate.pass;
    if (!sizingGate.pass) {
      normalized.policy_fail_reason = normalized.policy_fail_reason || sizingGate.reason;
    }
    const eventPath = maybeWriteEvent({
      workflowName: args['workflow-name'],
      runId: args['run-id'],
      stepName: args['step-name'] || 'dry_run_result',
      payload: normalized,
    });
    if (eventPath) {
      normalized.event_path = eventPath;
    }
    console.log(JSON.stringify(normalized, null, 2));
    return;
  }

  if (command === 'execute') {
    validateVenue(args.venue);
    validateActiveProfile(args['strategy-profile-id']);
    requireApiKey(binding, 'execute');
    if (!args['dry-run-ref-file']) {
      throw new Error('execute requires --dry-run-ref-file');
    }
    const dryRunReference = JSON.parse(fs.readFileSync(args['dry-run-ref-file'], 'utf8'));
    if (dryRunReference.policy_pass !== true) {
      throw new Error('execute requires dry_run_reference.policy_pass === true');
    }
    const endpoint = resolveEndpoint(binding, 'execute');
    const payload = {
      market_id: args['market-id'],
      side: args.side,
      amount: Number(args.size),
      venue: args.venue,
      reasoning: args.reasoning,
      source: args.source,
    };
    const raw = await requestJson({ method: endpoint.method, url: endpoint.url, payload, binding });
    if (args['debug-raw']) {
      console.error(JSON.stringify(raw, null, 2));
    }
    let reconciliation = {};
    try {
      const positionsEndpoint = resolveEndpoint(binding, 'positions');
      const positionsRaw = await requestJson({ method: positionsEndpoint.method, url: positionsEndpoint.url, payload: {}, binding });
      reconciliation = {
        exposure_after_trade: normalizeExposurePosition(
          findPositionByMarketId(positionsRaw, args['market-id']),
          args['market-id']
        ),
        reconciliation_source: 'positions_endpoint',
        reconciliation_timestamp: new Date().toISOString(),
      };
    } catch (_error) {
      reconciliation = {};
    }
    const normalized = normalizeExecutionResponse(raw, args, policy, reconciliation);
    const eventPath = maybeWriteEvent({
      workflowName: args['workflow-name'],
      runId: args['run-id'],
      stepName: args['step-name'] || 'execution_result',
      payload: normalized,
    });
    if (eventPath) {
      normalized.event_path = eventPath;
    }
    console.log(JSON.stringify(normalized, null, 2));
    return;
  }

  if (command === 'write-journal') {
    const payload = await readPayload(args);
    validateJournalPayload(payload, tracking);
    const written = writeJournal(payload);
    console.log(JSON.stringify(written, null, 2));
    return;
  }

  if (command === 'write-review') {
    const payload = await readPayload(args);
    validateReviewPayload(payload);
    const written = writeReview(payload, args['run-id'] || payload.run_id || 'review', args['report-path'] || payload.report_path || '');
    console.log(JSON.stringify(written, null, 2));
    return;
  }

  if (command === 'write-event') {
    const payload = await readPayload(args);
    const eventPath = maybeWriteEvent({
      workflowName: args['workflow-name'],
      runId: args['run-id'],
      stepName: args['step-name'],
      payload,
    });
    if (!eventPath) {
      throw new Error('write-event requires --workflow-name, --run-id, and --step-name');
    }
    console.log(JSON.stringify({ event_path: eventPath }, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
