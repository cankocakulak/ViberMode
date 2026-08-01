import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { editDistance, normalizeText, resolveRoxContext } from "../scripts/slack-rox-context.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(repoRoot, "scripts", "slack-rox-context.mjs");
const configPath = path.join(repoRoot, "config", "slack-rox-intents.json");

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rox-context-"));
  const policyPath = path.join(directory, "policy.yml");
  const contextPath = path.join(directory, "context.json");
  fs.writeFileSync(policyPath, `channel_contexts:
  - channel_id: CSTUDY
    channel_name: project-studybud
    app: StudyBud
    aliases:
      - studybud
      - study bud
    repo: /tmp/studybud
    repo_ios: /tmp/studybud/ios
    repo_android: /tmp/studybud/android
    platforms: ["ios", "android"]
    default_workflow: app-autopilot
  - channel_id: COTTO
    channel_name: project-otto
    app: Project Otto
    aliases:
      - project otto
      - sinav oyunlari
      - exam games
    repo: /tmp/otto
    platforms: ["ios", "android"]
    default_workflow: app-autopilot
  - channel_id: CIDEAS
    channel_name: product-ideas
    app: Product Ideas
    aliases:
      - product ideas
      - app ideas
      - fikirler
    repo: /tmp/vibermode
    platforms: ["ios"]
    default_workflow: app-opportunity-research
    state_root: /tmp/app-factory-state
    research_channel: product-ideas
    research_mode: evidence-ledger
`);
  return { directory, policyPath, contextPath };
}

test("normalizes Turkish characters, mentions, punctuation, and spacing", () => {
  assert.equal(normalizeText("<@U123> Şunu TestFlight'a GÖNDERİR misin?"), "sunu testflight a gonderir misin");
  assert.equal(editDistance("gonder", "gondre"), 1);
});

test("uses app channel context and tolerates informal typo-heavy release requests", () => {
  const { policyPath, contextPath } = fixture();
  const result = resolveRoxContext({
    text: "moruk sunu düzltip iki build al teste yollasana",
    channelId: "CSTUDY",
    channelName: "project-studybud",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(result.app.canonical, "StudyBud");
  assert.equal(result.app.source, "channel");
  assert.deepEqual(result.platforms.values.sort(), ["android", "ios"]);
  assert.ok(result.intents.some((intent) => intent.id === "internal-release"));
  assert.equal(result.interpretation_policy.exact_phrase_match_required, false);
});

test("excludes backend from channel defaults for mobile release intents", () => {
  const { policyPath, contextPath } = fixture();
  const policy = fs.readFileSync(policyPath, "utf8").replace('platforms: ["ios", "android"]', 'platforms: ["ios", "android", "backend"]');
  fs.writeFileSync(policyPath, policy);
  const result = resolveRoxContext({
    text: "teste yolla",
    channelId: "CSTUDY",
    channelName: "project-studybud",
    policyPath,
    configPath,
    contextPath,
  });
  assert.deepEqual(result.platforms.values.sort(), ["android", "ios"]);
});

test("routes attribution checks and resolves project aliases from free text", () => {
  const { policyPath, contextPath } = fixture();
  const result = resolveRoxContext({
    text: "project otto appsflyer saglk kontrlu yaparmısın ios android",
    channelId: "C08FC35G74J",
    channelName: "growth",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(result.app.canonical, "Project Otto");
  assert.equal(result.primary_intent.id, "attribution-health");
  assert.deepEqual(result.platforms.values.sort(), ["android", "ios"]);
});

test("recognizes heavily mistyped technical product names from surrounding intent", () => {
  const { policyPath, contextPath } = fixture();
  const result = resolveRoxContext({
    text: "appflsyr saglk kontrlu yap",
    channelId: "COTTO",
    channelName: "project-otto",
    policyPath,
    configPath,
    contextPath,
  });
  assert.ok(result.intents.some((intent) => intent.id === "attribution-health"));
});

test("routes Customer Success login requests without requiring exact wording", () => {
  const { policyPath, contextPath } = fixture();
  const result = resolveRoxContext({
    text: "kullancı tabletten girş yapamıyo bi bakarmısın",
    channelId: "C090F1TGQG5",
    channelName: "customer-success",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(result.primary_intent.id, "cs-login-auth");
  assert.equal(result.channel.domain, "customer-success");
});

test("flags an app named in the message when it conflicts with the app channel", () => {
  const { policyPath, contextPath } = fixture();
  const result = resolveRoxContext({
    text: "project otto buildini teste gonder",
    channelId: "CSTUDY",
    channelName: "project-studybud",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(result.app.canonical, "Project Otto");
  assert.equal(result.app.conflict, true);
  assert.ok(result.clarification.reasons.includes("message_app_conflicts_with_channel_app"));
});

test("inherits app context for short follow-up status messages", () => {
  const { policyPath, contextPath } = fixture();
  const result = resolveRoxContext({
    text: "e noldu bitti mi",
    channelId: "CSTUDY",
    channelName: "project-studybud",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(result.app.canonical, "StudyBud");
  assert.equal(result.primary_intent.id, "status");
});

test("marks cancellation as an authority check instead of trusting phrase matching", () => {
  const { policyPath, contextPath } = fixture();
  const result = resolveRoxContext({
    text: "rox bugun iptal ya :) saka bi yana devam",
    channelId: "CSTUDY",
    channelName: "project-studybud",
    policyPath,
    configPath,
    contextPath,
  });
  const cancel = result.intents.find((intent) => intent.id === "cancel");
  assert.ok(cancel);
  assert.deepEqual(result.authority_checks, ["requester_or_owner_must_clearly_confirm"]);
});

test("routes product idea validation from the dedicated research channel", () => {
  const { policyPath, contextPath } = fixture();
  const result = resolveRoxContext({
    text: "bu fikrin reddit kanitini derinlestir ve kitleyi arastir",
    channelId: "CIDEAS",
    channelName: "product-ideas",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(result.channel.domain, "product-research");
  assert.equal(result.primary_intent.id, "idea-validate");
  assert.equal(result.channel.app_context.state_root, "/tmp/app-factory-state");
  assert.equal(result.clarification.required, false);
});

test("routes explicit brainstorm and PRD promotions through their evidence gates", () => {
  const { policyPath, contextPath } = fixture();
  const brainstorm = resolveRoxContext({
    text: "bunu brainstorma hazirla",
    channelId: "CIDEAS",
    channelName: "product-ideas",
    policyPath,
    configPath,
    contextPath,
  });
  const prd = resolveRoxContext({
    text: "bunun prd sini hazirla",
    channelId: "CIDEAS",
    channelName: "product-ideas",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(brainstorm.primary_intent.id, "idea-promote-brainstorm");
  assert.equal(prd.primary_intent.id, "idea-promote-prd");
});

test("distinguishes parking and rejection decisions", () => {
  const { policyPath, contextPath } = fixture();
  const parked = resolveRoxContext({
    text: "bunu sonra bakmak uzere park et",
    channelId: "CIDEAS",
    channelName: "product-ideas",
    policyPath,
    configPath,
    contextPath,
  });
  const rejected = resolveRoxContext({
    text: "bu fikri reddet ve kapat",
    channelId: "CIDEAS",
    channelName: "product-ideas",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(parked.primary_intent.id, "idea-park");
  assert.equal(rejected.primary_intent.id, "idea-reject");
});

test("stores sourced provisional context and exposes it during resolution", () => {
  const { policyPath, contextPath } = fixture();
  execFileSync(process.execPath, [
    scriptPath,
    "remember",
    "--project", "StudyBud",
    "--key", "known_blocker",
    "--value", "Android run manifest is missing",
    "--source-url", "https://example.slack.com/archives/C123/p123",
    "--context-path", contextPath,
  ]);
  const result = resolveRoxContext({
    text: "durum ne",
    channelId: "CSTUDY",
    channelName: "project-studybud",
    policyPath,
    configPath,
    contextPath,
  });
  assert.equal(result.project_facts.known_blocker.value, "Android run manifest is missing");
  assert.equal(result.project_facts.known_blocker.status, "provisional");
  assert.equal(result.project_facts.known_blocker.verify_before_write, true);
});

test("requires owner approval for durable context and rejects personal data", () => {
  const { contextPath } = fixture();
  const durable = spawnSync(process.execPath, [
    scriptPath,
    "remember",
    "--project", "StudyBud",
    "--key", "repo",
    "--value", "/tmp/studybud",
    "--source-url", "https://example.slack.com/archives/C123/p123",
    "--status", "durable",
    "--context-path", contextPath,
  ], { encoding: "utf8" });
  assert.notEqual(durable.status, 0);
  assert.match(durable.stderr, /requires --owner-approved/);

  const sensitive = spawnSync(process.execPath, [
    scriptPath,
    "remember",
    "--project", "StudyBud",
    "--key", "customer",
    "--value", "student@example.com",
    "--source-url", "https://example.slack.com/archives/C123/p123",
    "--context-path", contextPath,
  ], { encoding: "utf8" });
  assert.notEqual(sensitive.status, 0);
  assert.match(sensitive.stderr, /secret or personal data/);
});
