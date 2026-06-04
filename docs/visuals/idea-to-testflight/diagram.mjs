const STYLE = `
  <defs>
    <filter id="panelShadow" x="-10%" y="-15%" width="120%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.10"/>
    </filter>
    <filter id="nodeShadow" x="-18%" y="-22%" width="136%" height="144%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8.5" refY="5" orient="auto" markerUnits="strokeWidth">
      <path d="M1.5,1.5 L8.5,5 L1.5,8.5 Z" fill="#263244"/>
    </marker>
    <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="8.5" refY="5" orient="auto" markerUnits="strokeWidth">
      <path d="M1.5,1.5 L8.5,5 L1.5,8.5 Z" fill="#059669"/>
    </marker>
    <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="8.5" refY="5" orient="auto" markerUnits="strokeWidth">
      <path d="M1.5,1.5 L8.5,5 L1.5,8.5 Z" fill="#e11d48"/>
    </marker>
    <linearGradient id="page" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbfcff"/>
      <stop offset="1" stop-color="#eef3f8"/>
    </linearGradient>
    <linearGradient id="bluePanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ecfeff"/>
      <stop offset="1" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="orangePanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7ed"/>
      <stop offset="1" stop-color="#ffedd5"/>
    </linearGradient>
    <linearGradient id="purplePanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef2ff"/>
      <stop offset="1" stop-color="#f3e8ff"/>
    </linearGradient>
    <linearGradient id="greenPanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ecfdf5"/>
      <stop offset="1" stop-color="#dcfce7"/>
    </linearGradient>
    <style>
      .title { font: 800 42px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #101827; letter-spacing: 0; }
      .subtitle { font: 600 17px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #475569; letter-spacing: 0; }
      .badgeText { font: 800 15px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #fff; letter-spacing: 0.4px; }
      .sectionTitle { font: 800 25px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #111827; letter-spacing: 0; }
      .sectionCopy { font: 600 14px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #475569; letter-spacing: 0; }
      .laneTitle { font: 800 13px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #4338ca; letter-spacing: 0.4px; }
      .nodeTitle { font: 800 16px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #111827; letter-spacing: 0; }
      .nodeCopy { font: 600 12px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #475569; letter-spacing: 0; }
      .small { font: 700 11.5px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #64748b; letter-spacing: 0; }
      .mono { font: 700 11.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; fill: #334155; letter-spacing: 0; }
      .line { fill: none; stroke: #263244; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; marker-end: url(#arrow); }
      .greenLine { fill: none; stroke: #059669; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; marker-end: url(#arrowGreen); }
      .redLine { fill: none; stroke: #e11d48; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 7 7; marker-end: url(#arrowRed); }
      .plainLine { fill: none; stroke: #263244; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
      .dashLine { fill: none; stroke: #64748b; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 8 8; marker-end: url(#arrow); }
    </style>
  </defs>
`;

function textLines(lines, x, y, className = "nodeCopy", lineHeight = 17, anchor = "middle") {
  return lines.map((line, index) => (
    `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" class="${className}">${line}</text>`
  )).join("");
}

function panel({ x, y, w, h, fill, stroke }) {
  return `
    <g filter="url(#panelShadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    </g>
  `;
}

function badge(x, y, label, fill) {
  return `
    <rect x="${x}" y="${y}" width="96" height="30" rx="15" fill="${fill}"/>
    <text x="${x + 48}" y="${y + 21}" text-anchor="middle" class="badgeText">${label}</text>
  `;
}

function node({ x, y, w, h, title, lines = [], stroke = "#cbd5e1", fill = "#fff", rx = 16 }) {
  return `
    <g filter="url(#nodeShadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    </g>
    <text x="${x + w / 2}" y="${y + 26}" text-anchor="middle" class="nodeTitle">${title}</text>
    ${textLines(lines, x + w / 2, y + 45)}
  `;
}

function pill(x, y, w, label, fill = "#f8fafc", stroke = "#d8e0eb") {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="32" rx="16" fill="${fill}" stroke="${stroke}"/>
    <text x="${x + w / 2}" y="${y + 21}" text-anchor="middle" class="mono">${label}</text>
  `;
}

function verticalArrow(x, y1, y2) {
  return `<path d="M${x} ${y1} V${y2}" class="line"/>`;
}

export function renderDetailedSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1460" role="img" aria-labelledby="title desc">
  <title id="title">Idea to TestFlight vertical factory flow</title>
  <desc id="desc">A top-down ViberMode iOS app factory diagram with detailed Product-to-Code stages.</desc>
  ${STYLE}
  <rect width="1200" height="1460" fill="url(#page)"/>
  <rect x="82" y="34" width="1036" height="1392" rx="30" fill="#fff" stroke="#d8e0eb" opacity="0.9"/>

  <text x="600" y="78" text-anchor="middle" class="title">Idea to TestFlight</text>
  <text x="600" y="108" text-anchor="middle" class="subtitle">top-down factory flow for generated iOS apps</text>

  ${panel({ x: 130, y: 142, w: 940, h: 190, fill: "url(#bluePanel)", stroke: "#38bdf8" })}
  ${badge(158, 166, "STAGE 1", "#0284c7")}
  <text x="282" y="188" class="sectionTitle">App To Idea</text>
  <text x="282" y="216" class="sectionCopy">A small research loop creates and gates ideas. It stops before repo creation.</text>
  ${node({ x: 190, y: 250, w: 150, h: 58, title: "Signals", lines: ["store data", "themes"], stroke: "#bae6fd" })}
  ${node({ x: 412, y: 250, w: 174, h: 58, title: "Research Loop", lines: ["app-researcher"], stroke: "#bae6fd" })}
  ${node({ x: 660, y: 250, w: 132, h: 58, title: "Gate", lines: ["ready?"], stroke: "#bae6fd" })}
  ${node({ x: 875, y: 250, w: 140, h: 58, title: "Ready Idea", lines: ["backlog"], stroke: "#bae6fd" })}
  <path d="M340 279 H412 M586 279 H660 M792 279 H875" class="line"/>
  <path d="M726 250 C716 222 510 222 499 250" class="redLine"/>

  ${verticalArrow(600, 332, 368)}

  ${panel({ x: 130, y: 368, w: 940, h: 172, fill: "url(#orangePanel)", stroke: "#fb923c" })}
  ${badge(158, 392, "STAGE 2", "#ea580c")}
  <text x="282" y="414" class="sectionTitle">Bootstrap</text>
  <text x="282" y="442" class="sectionCopy">Prepare a private generated repo from the iOS template and prove the baseline is runnable.</text>
  ${node({ x: 202, y: 468, w: 128, h: 48, title: "Reserve", lines: ["run"], stroke: "#fed7aa" })}
  ${node({ x: 402, y: 468, w: 142, h: 48, title: "Template", lines: ["create repo"], stroke: "#fed7aa" })}
  ${node({ x: 616, y: 468, w: 120, h: 48, title: "Clone", lines: ["workspace"], stroke: "#fed7aa" })}
  ${node({ x: 808, y: 468, w: 140, h: 48, title: "Baseline", lines: ["build path"], stroke: "#fed7aa" })}
  <path d="M330 492 H402 M544 492 H616 M736 492 H808" class="line"/>

  ${verticalArrow(600, 540, 576)}

  ${panel({ x: 82, y: 576, w: 1036, h: 560, fill: "url(#purplePanel)", stroke: "#818cf8" })}
  ${badge(112, 602, "STAGE 3", "#4f46e5")}
  <text x="236" y="624" class="sectionTitle">Product To Code</text>
  <text x="236" y="652" class="sectionCopy">This is the main build loop: specs become tasks, tasks become code, validation/review route fixes.</text>

  <text x="138" y="700" class="laneTitle">SPECIFICATION</text>
  ${node({ x: 138, y: 718, w: 132, h: 58, title: "Brainstormer", lines: ["options"], stroke: "#c7d2fe" })}
  ${node({ x: 318, y: 718, w: 110, h: 58, title: "PRD", lines: ["scope"], stroke: "#c7d2fe" })}
  ${node({ x: 476, y: 718, w: 140, h: 58, title: "UX Designer", lines: ["flows"], stroke: "#c7d2fe" })}
  ${node({ x: 664, y: 718, w: 142, h: 58, title: "Stories", lines: ["AC"], stroke: "#c7d2fe" })}
  ${node({ x: 854, y: 718, w: 150, h: 58, title: "Spec Review", lines: ["approve"], stroke: "#c7d2fe" })}
  <path d="M270 747 H318 M428 747 H476 M616 747 H664 M806 747 H854" class="line"/>

  <text x="138" y="828" class="laneTitle">IMPLEMENTATION</text>
  ${node({ x: 138, y: 846, w: 150, h: 58, title: "Task Planner", lines: ["tasks.json"], stroke: "#c7d2fe" })}
  ${node({ x: 352, y: 846, w: 190, h: 58, title: "Implementation", lines: ["one task/run"], stroke: "#c7d2fe" })}
  ${node({ x: 606, y: 846, w: 164, h: 58, title: "Runtime", lines: ["build + smoke"], stroke: "#c7d2fe" })}
  ${node({ x: 834, y: 846, w: 170, h: 58, title: "Experience", lines: ["UX gate"], stroke: "#c7d2fe" })}
  <path d="M288 875 H352 M542 875 H606 M770 875 H834" class="line"/>
  <path d="M929 904 V948" class="line"/>

  <text x="138" y="958" class="laneTitle">REVIEW + ROUTING</text>
  ${node({ x: 138, y: 976, w: 174, h: 58, title: "Remediation", lines: ["route fixes"], stroke: "#c7d2fe" })}
  ${node({ x: 448, y: 976, w: 156, h: 58, title: "Reviewer", lines: ["final gate"], stroke: "#c7d2fe" })}
  <g filter="url(#nodeShadow)">
    <rect x="770" y="976" width="200" height="58" rx="29" fill="#312e81"/>
  </g>
  <text x="870" y="1012" text-anchor="middle" class="badgeText">Build Ready</text>
  <path d="M929 948 C894 940 684 940 526 976" class="redLine"/>
  <text x="744" y="942" text-anchor="middle" class="small">validation or review fails</text>
  <path d="M312 1005 C360 1005 352 875 352 875" class="dashLine"/>
  <path d="M604 1005 H770" class="greenLine"/>
  <text x="682" y="990" text-anchor="middle" class="small">approved</text>

  ${pill(160, 1082, 150, "product-to-spec", "#fff", "#c7d2fe")}
  ${pill(338, 1082, 122, "spec-to-code", "#fff", "#c7d2fe")}
  ${pill(488, 1082, 178, "experience-hardening", "#fff", "#c7d2fe")}
  ${pill(694, 1082, 174, "remediation-routing", "#fff", "#c7d2fe")}

  ${verticalArrow(870, 1136, 1172)}

  ${panel({ x: 130, y: 1172, w: 940, h: 178, fill: "url(#greenPanel)", stroke: "#34d399" })}
  ${badge(158, 1196, "STAGE 4", "#059669")}
  <text x="282" y="1218" class="sectionTitle">TestFlight</text>
  <text x="282" y="1246" class="sectionCopy">Run release gates, sign and upload the app, then write delivery evidence.</text>
  ${node({ x: 198, y: 1274, w: 132, h: 48, title: "Preflight", lines: ["gates"], stroke: "#bbf7d0" })}
  ${node({ x: 402, y: 1274, w: 140, h: 48, title: "Build + Sign", lines: ["archive"], stroke: "#bbf7d0" })}
  ${node({ x: 614, y: 1274, w: 154, h: 48, title: "Upload", lines: ["internal"], stroke: "#bbf7d0" })}
  ${node({ x: 840, y: 1274, w: 140, h: 48, title: "Evidence", lines: ["state + git"], stroke: "#bbf7d0" })}
  <path d="M330 1298 H402 M542 1298 H614 M768 1298 H840" class="greenLine"/>
  ${pill(344, 1338, 160, "ios-submitter", "#fff", "#bbf7d0")}
  ${pill(520, 1338, 196, "ios-submit-testflight", "#fff", "#bbf7d0")}
  ${pill(732, 1338, 174, "Fastlane / Apple", "#fff", "#bbf7d0")}

  <text x="600" y="1400" text-anchor="middle" class="small">ViberMode: app-opportunity-research -> daily-ios-app-pipeline -> bootstrap -> product-to-code -> ios-submit-testflight</text>
</svg>`;
}

export function renderCompactSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 980" role="img" aria-labelledby="title desc">
  <title id="title">Idea to TestFlight compact stack</title>
  <desc id="desc">A compact stacked stage diagram for the ViberMode idea to TestFlight flow.</desc>
  ${STYLE}
  <rect width="1200" height="980" fill="#f8fbff"/>
  <rect x="92" y="34" width="1016" height="910" rx="30" fill="#fff" stroke="#d8e0eb"/>
  <text x="600" y="78" text-anchor="middle" class="title">Idea to TestFlight</text>
  <text x="600" y="108" text-anchor="middle" class="subtitle">compact stage map for generated iOS app delivery</text>

  ${panel({ x: 140, y: 136, w: 920, h: 134, fill: "url(#bluePanel)", stroke: "#38bdf8" })}
  ${badge(168, 160, "STAGE 1", "#0284c7")}
  <text x="288" y="183" class="sectionTitle">App To Idea</text>
  <text x="288" y="214" class="nodeCopy">Signals -> Research Loop -> Gate -> Ready Backlog Idea</text>
  ${node({ x: 210, y: 238, w: 150, h: 58, title: "Signals", lines: ["market input"], stroke: "#bae6fd" })}
  ${node({ x: 430, y: 238, w: 170, h: 58, title: "Research", lines: ["score ideas"], stroke: "#bae6fd" })}
  ${node({ x: 670, y: 238, w: 130, h: 58, title: "Gate", lines: ["ready?"], stroke: "#bae6fd" })}
  ${node({ x: 870, y: 238, w: 140, h: 58, title: "Ready Idea", lines: ["backlog"], stroke: "#bae6fd" })}
  <path d="M360 267 H430 M600 267 H670 M800 267 H870" class="line"/>

  ${panel({ x: 140, y: 318, w: 920, h: 134, fill: "url(#orangePanel)", stroke: "#fb923c" })}
  ${badge(168, 342, "STAGE 2", "#ea580c")}
  <text x="288" y="365" class="sectionTitle">Bootstrap</text>
  <text x="288" y="396" class="nodeCopy">Reserve run -> Template repo -> Clone workspace -> Baseline</text>
  ${node({ x: 230, y: 416, w: 130, h: 46, title: "Reserve", stroke: "#fed7aa" })}
  ${node({ x: 430, y: 416, w: 140, h: 46, title: "Template", stroke: "#fed7aa" })}
  ${node({ x: 640, y: 416, w: 120, h: 46, title: "Clone", stroke: "#fed7aa" })}
  ${node({ x: 830, y: 416, w: 130, h: 46, title: "Baseline", stroke: "#fed7aa" })}
  <path d="M360 439 H430 M570 439 H640 M760 439 H830" class="line"/>

  ${panel({ x: 140, y: 500, w: 920, h: 214, fill: "url(#purplePanel)", stroke: "#818cf8" })}
  ${badge(168, 524, "STAGE 3", "#4f46e5")}
  <text x="288" y="547" class="sectionTitle">Product To Code</text>
  <text x="288" y="578" class="nodeCopy">Brainstorm -> PRD -> UX -> Stories -> Tasks -> Implement -> Validate -> Review</text>
  ${node({ x: 160, y: 610, w: 124, h: 50, title: "Brainstorm", stroke: "#c7d2fe" })}
  ${node({ x: 318, y: 610, w: 90, h: 50, title: "PRD", stroke: "#c7d2fe" })}
  ${node({ x: 442, y: 610, w: 90, h: 50, title: "UX", stroke: "#c7d2fe" })}
  ${node({ x: 566, y: 610, w: 106, h: 50, title: "Stories", stroke: "#c7d2fe" })}
  ${node({ x: 706, y: 610, w: 96, h: 50, title: "Tasks", stroke: "#c7d2fe" })}
  ${node({ x: 836, y: 610, w: 124, h: 50, title: "Implement", stroke: "#c7d2fe" })}
  <path d="M284 635 H318 M408 635 H442 M532 635 H566 M672 635 H706 M802 635 H836" class="line"/>
  <rect x="500" y="684" width="200" height="46" rx="23" fill="#312e81"/>
  <text x="600" y="713" text-anchor="middle" class="badgeText">Build Ready</text>
  <path d="M898 660 C872 706 776 706 700 706" class="greenLine"/>

  ${panel({ x: 140, y: 762, w: 920, h: 134, fill: "url(#greenPanel)", stroke: "#34d399" })}
  ${badge(168, 786, "STAGE 4", "#059669")}
  <text x="288" y="809" class="sectionTitle">TestFlight</text>
  <text x="288" y="840" class="nodeCopy">Preflight -> Build + Sign -> Internal TestFlight -> Evidence</text>
  ${node({ x: 250, y: 864, w: 132, h: 42, title: "Preflight", stroke: "#bbf7d0" })}
  ${node({ x: 448, y: 864, w: 138, h: 42, title: "Build + Sign", stroke: "#bbf7d0" })}
  ${node({ x: 652, y: 864, w: 148, h: 42, title: "Internal", stroke: "#bbf7d0" })}
  ${node({ x: 866, y: 864, w: 118, h: 42, title: "Evidence", stroke: "#bbf7d0" })}
  <path d="M382 885 H448 M586 885 H652 M800 885 H866" class="greenLine"/>
</svg>`;
}
