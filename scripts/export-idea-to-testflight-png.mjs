import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const exports = [
  {
    source: "docs/assets/idea-to-testflight-flow.svg",
    target: "docs/assets/idea-to-testflight-flow.png",
    size: "2400",
  },
  {
    source: "docs/assets/idea-to-testflight-compact.svg",
    target: "docs/assets/idea-to-testflight-compact.png",
    size: "2000",
  },
];

const tempDir = await mkdtemp(join(tmpdir(), "vibermode-idea-to-testflight-"));

try {
  for (const item of exports) {
    const source = resolve(item.source);
    const target = resolve(item.target);
    await mkdir(dirname(target), { recursive: true });
    await execFileAsync("qlmanage", ["-t", "-s", item.size, "-o", tempDir, source]);
    await copyFile(join(tempDir, `${basename(source)}.png`), target);
    console.log(`wrote ${item.target}`);
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
