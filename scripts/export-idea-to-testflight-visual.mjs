import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { renderCompactSvg, renderDetailedSvg } from "../docs/visuals/idea-to-testflight/diagram.mjs";

const outputs = [
  ["docs/assets/idea-to-testflight-flow.svg", renderDetailedSvg()],
  ["docs/assets/idea-to-testflight-compact.svg", renderCompactSvg()],
];

for (const [path, svg] of outputs) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${svg}\n`, "utf8");
  console.log(`wrote ${path}`);
}
