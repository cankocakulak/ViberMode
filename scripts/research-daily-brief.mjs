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

function readJsonOptional(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readTextOptional(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`);
}

function nowIso() {
  return new Date().toISOString();
}

function escapePipe(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function researchRunRef(researchDir) {
  const parts = path.resolve(researchDir).split(path.sep);
  const researchRunsIndex = parts.lastIndexOf("research-runs");
  if (researchRunsIndex >= 0) {
    return parts.slice(researchRunsIndex).join("/");
  }
  return path.basename(researchDir);
}

function titleFromDecision(decisionText, fallback) {
  const heading = decisionText.split(/\r?\n/).find((line) => line.startsWith("# "));
  return heading ? heading.replace(/^#\s+/, "").trim() : fallback;
}

function statusCounts(candidates) {
  const counts = {};
  for (const candidate of candidates) {
    const status = candidate.status || "unknown";
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
}

function compactStatus(counts) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return "aday yok";
  return entries.map(([status, count]) => `${count} ${status}`).join(", ");
}

function topCandidates(candidates) {
  return candidates
    .slice()
    .sort((left, right) => {
      const leftRank = Number.isFinite(Number(left.rank)) ? Number(left.rank) : Number.MAX_SAFE_INTEGER;
      const rightRank = Number.isFinite(Number(right.rank)) ? Number(right.rank) : Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return (right.scores?.total || 0) - (left.scores?.total || 0);
    })
    .slice(0, 5);
}

function topOpportunities(opportunities) {
  return opportunities
    .slice()
    .sort((left, right) => {
      const leftRank = Number.isFinite(Number(left.rank)) ? Number(left.rank) : Number.MAX_SAFE_INTEGER;
      const rightRank = Number.isFinite(Number(right.rank)) ? Number(right.rank) : Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return (right.scores?.total || 0) - (left.scores?.total || 0);
    })
    .slice(0, 5);
}

function sourceMix(sources) {
  const counts = new Map();
  for (const source of sources) {
    const key = source.provider || source.type || "source";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => `${key}: ${count}`);
}

function selectionSummary(candidate) {
  const rationale = candidate.selection_rationale || {};
  return {
    why: rationale.chosen_because || candidate.specific_gap || "Açık seçim gerekçesi kaydedilmedi.",
    evidence: rationale.evidence_summary || candidate.why_now || "Kanıt özeti kaydedilmedi.",
    tradeoffs: rationale.tradeoffs || "Riskler ve ödünler kaydedilmedi.",
    followUps: Array.isArray(rationale.follow_up_questions) ? rationale.follow_up_questions : [],
  };
}

function renderBrief({ title, researchDir, sources, opportunities, candidates, rejected }) {
  const counts = statusCounts(candidates);
  const selectedCandidates = topCandidates(candidates);
  const selectedOpportunities = topOpportunities(opportunities);
  const sourceSummary = sourceMix(sources);
  const runRef = researchRunRef(researchDir);

  const lines = [
    `# Günlük Uygulama Araştırma Özeti: ${title}`,
    "",
    `Oluşturulma: ${nowIso()}`,
    `Araştırma paketi: ${runRef}`,
    "",
    "## Sonuç",
    "",
    `- Aday durumu: ${compactStatus(counts)}`,
    `- İncelenen fırsat: ${opportunities.length}`,
    `- Kaydedilen reddedilmiş yön: ${rejected.length}`,
    "",
    "## Kaynak Dağılımı",
    "",
    ...(sourceSummary.length > 0 ? sourceSummary.map((item) => `- ${item}`) : ["- Kaynak envanteri kaydedilmedi"]),
    "",
    "## Öne Çıkan Fırsatlar",
    "",
    "Puanlar araştırma önceliği içindir; ticari başarı olasılığı değildir. Ticari karar için güncel stable ledger değerlendirmesini kullanın.",
    "",
    "| Sıra | Küme | Durum | Araştırma önceliği | Sonraki Araştırma |",
    "|---:|---|---|---:|---|",
    ...selectedOpportunities.map((opportunity) => `| ${opportunity.rank ?? ""} | ${escapePipe(opportunity.cluster)} | ${escapePipe(opportunity.status || "")} | ${opportunity.scores?.total ?? ""} | ${escapePipe(opportunity.next_research || "")} |`),
    "",
    "## Aday Kararları",
    "",
    ...(selectedCandidates.length > 0
      ? selectedCandidates.flatMap((candidate) => {
        const summary = selectionSummary(candidate);
        return [
          `### ${candidate.title}`,
          "",
          `- Durum: ${candidate.status || "bilinmiyor"}`,
          `- Araştırma önceliği puanı: ${candidate.scores?.total ?? "hesaplanmadı"} (ticari doğrulama değildir)`,
          `- Neden seçildi: ${summary.why}`,
          `- Kanıt: ${summary.evidence}`,
          `- Riskler ve ödünler: ${summary.tradeoffs}`,
          `- Sonraki kontroller: ${summary.followUps.length ? summary.followUps.join("; ") : "kaydedilmedi"}`,
          "",
        ];
      })
      : ["Aday kararı kaydedilmedi.", ""]),
    "## Slack Notu",
    "",
    "`cofounder-slack-report.md` özel araştırma artefaktıdır. Yalnızca açıkça istenen çapraz-fikir Slack özeti için kullanın.",
  ];

  return `${lines.join("\n")}\n`;
}

function renderSlackReport({ title, researchDir, opportunities, candidates, rejected }) {
  const counts = statusCounts(candidates);
  const selected = topCandidates(candidates)[0];
  const runRef = researchRunRef(researchDir);
  const lines = [
    `*Uygulama araştırma özeti - ${title}*`,
    `Araştırma paketi: \`${runRef}\``,
    `Durum: ${compactStatus(counts)}; ${opportunities.length} fırsat incelendi; ${rejected.length} yön reddedildi.`,
  ];

  if (selected) {
    const summary = selectionSummary(selected);
    lines.push(
      "",
      `*Öne çıkan aday:* ${selected.title} (${selected.status || "bilinmiyor"}, araştırma önceliği ${selected.scores?.total ?? "yok"}; ticari doğrulama değildir)`,
      `*Neden:* ${summary.why}`,
      `*Kanıt:* ${summary.evidence}`,
      `*Riskler / takip:* ${summary.tradeoffs}`,
    );

    if (summary.followUps.length > 0) {
      lines.push(`*Sonraki kontroller:* ${summary.followUps.slice(0, 3).join("; ")}`);
    }
  } else {
    lines.push("", "Bugün hiçbir aday ilerletilmedi; çalışma yalnızca kanıt ekledi veya mevcut kanıtı kontrol etti.");
  }

  return `${lines.join("\n")}\n`;
}

function printUsage() {
  process.stdout.write(`Usage:
  npm run research:daily-brief -- \\
    --research-dir /path/to/research-runs/YYYY-MM-DD/category-theme

Options:
  --output <path>         Brief markdown path. Defaults to daily-brief.md in research dir.
  --slack-output <path>   Slack-ready report path. Defaults to cofounder-slack-report.md in research dir.

Purpose:
  Summarize a completed research pack and produce a reviewed co-founder report body.
  This script does not send Slack messages.
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const researchDir = path.resolve(requireValue("--research-dir", args["research-dir"]));
  const sourceInventory = readJsonOptional(path.join(researchDir, "source-inventory.json"), { sources: [] });
  const opportunitiesFile = readJsonOptional(path.join(researchDir, "opportunities.json"), { opportunities: [] });
  const backlogCandidates = readJsonOptional(path.join(researchDir, "backlog-candidates.json"), { candidates: [] });
  const rejectedFile = readJsonOptional(path.join(researchDir, "rejected.json"), { rejected: [] });
  const decisionText = readTextOptional(path.join(researchDir, "decision.md"));
  const fallbackTitle = `${opportunitiesFile.category || "App Opportunity Research"} / ${opportunitiesFile.market || "market"}`;
  const title = titleFromDecision(decisionText, fallbackTitle);
  const outputPath = path.resolve(args.output || path.join(researchDir, "daily-brief.md"));
  const slackOutputPath = path.resolve(args["slack-output"] || path.join(researchDir, "cofounder-slack-report.md"));

  const payload = {
    title,
    researchDir,
    sources: sourceInventory.sources || [],
    opportunities: opportunitiesFile.opportunities || [],
    candidates: backlogCandidates.candidates || [],
    rejected: rejectedFile.rejected || [],
  };

  writeText(outputPath, renderBrief(payload));
  writeText(slackOutputPath, renderSlackReport(payload));

  process.stdout.write(`${JSON.stringify({
    status: "complete",
    research_dir: researchDir,
    daily_brief: outputPath,
    slack_report: slackOutputPath,
    candidate_count: payload.candidates.length,
    opportunity_count: payload.opportunities.length,
  }, null, 2)}\n`);
}

main();
