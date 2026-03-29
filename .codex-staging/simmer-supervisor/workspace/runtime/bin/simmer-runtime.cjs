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
    maxNewTradesPerHeartbeat: extractNumberValue(activeBlock, 'max_new_trades_per_heartbeat') || 1,
    maxOpenPositions: extractNumberValue(activeBlock, 'max_open_positions') || 3,
    minimumConfidence: extractNumberValue(activeBlock, 'minimum_confidence') || 0.68,
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

function buildPortfolioConstraints(policy) {
  return {
    venue: 'sim',
    domain: policy.domain,
    strategy_profile_id: policy.id,
    policy_version: policy.policyVersion,
    max_new_trades_per_heartbeat: policy.maxNewTradesPerHeartbeat,
    max_open_positions: policy.maxOpenPositions,
    minimum_confidence: policy.minimumConfidence,
    fresh_context_required: policy.freshContextRequired,
    allow_averaging_down: policy.allowAveragingDown,
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

function buildFallbackContext({ marketId, marketRaw, positionsRaw, tradesRaw, args, policy, nativeContextError }) {
  const market = marketRaw.market || marketRaw;
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
  if (nativeContextError?.responseBody?.detail) {
    riskNotes.push(`native_context_error:${nativeContextError.responseBody.detail}`);
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
    context_freshness: nativeContextError ? 'fallback_live_market_snapshot' : 'market_snapshot_live',
    lookup_mode: 'fallback_market_positions_trades',
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
  return {
    timestamp: source.timestamp || source.generated_at || source.as_of || new Date().toISOString(),
    strategy_profile_id: args['strategy-profile-id'] || policy.id,
    policy_version: args['policy-version'] || policy.policyVersion,
    run_id: args['run-id'] || '',
    positions: asArray(source.positions || source.open_positions),
    open_orders: asArray(source.open_orders || source.orders),
    risk_alerts: asArray(source.risk_alerts || source.alerts),
    opportunities,
    performance: source.performance || source.portfolio_performance || {},
    portfolio_constraints: source.portfolio_constraints || buildPortfolioConstraints(policy),
  };
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
  return {
    market_id: args['market-id'],
    strategy_profile_id: args['strategy-profile-id'] || policy.id,
    policy_version: args['policy-version'] || policy.policyVersion,
    run_id: args['run-id'],
    estimated_cost: Number(tradeSource.estimated_cost ?? tradeSource.estimatedCost ?? tradeSource.cost ?? 0),
    estimated_shares: Number(tradeSource.estimated_shares ?? tradeSource.estimatedShares ?? tradeSource.shares ?? 0),
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
  };
}

function normalizeExecutionResponse(raw, args, policy) {
  const source = (raw.execution && typeof raw.execution === 'object')
    ? raw.execution
    : ((raw.data && typeof raw.data === 'object')
      ? raw.data
      : ((raw.result && typeof raw.result === 'object') ? raw.result : raw));
  return {
    trade_id: source.trade_id || source.tradeId || source.id || '',
    market_id: args['market-id'],
    strategy_profile_id: args['strategy-profile-id'] || policy.id,
    policy_version: args['policy-version'] || policy.policyVersion,
    run_id: args['run-id'],
    status: source.status || 'submitted',
    filled_size: Number(source.filled_size ?? source.filledSize ?? args.size ?? 0),
    average_price: Number(source.average_price ?? source.averagePrice ?? 0),
    exposure_after_trade: source.exposure_after_trade || source.exposureAfterTrade || {},
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
    const payload = {
      since: args.since || '',
    };
    const metadata = {
      venue: args.venue,
      domain: args.domain || policy.domain,
      strategy_profile_id: args['strategy-profile-id'] || policy.id,
      policy_version: args['policy-version'] || policy.policyVersion,
      run_id: args['run-id'] || '',
    };
    validateActiveProfile(metadata.strategy_profile_id);
    const raw = await requestJson({ method: endpoint.method, url: endpoint.url, payload, binding });
    if (args['debug-raw']) {
      console.error(JSON.stringify(raw, null, 2));
    }
    const normalized = normalizeBriefingResponse(raw, args, policy);
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
      context.context_freshness = 'native_context_live';
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
      context.context_freshness = nativeContextRaw.context_freshness || nativeContextRaw.freshness || context.context_freshness;
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
    const normalized = normalizeExecutionResponse(raw, args, policy);
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
