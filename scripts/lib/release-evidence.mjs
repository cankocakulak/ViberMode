import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export const fingerprintKind = 'git-visible-files-sha256-v1';
export function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
export function declaredVerdict(text) {
  const values = [];
  let fence = null;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const marker = line.match(/^(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const label = line.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '').match(/^Verdict(?:\s*:\s*(.*)|\s*)$/i);
    if (!label) continue;
    let value = label[1];
    if (!value) {
      while (i + 1 < lines.length && !lines[i + 1].trim()) i += 1;
      value = lines[++i]?.trim() ?? '';
    }
    value = value.replace(/\*\*/g, '').replace(/^Verdict\s*:\s*/i, '').replace(/^`|`\.?$/g, '').replace(/\.$/, '').trim().toUpperCase();
    if (!/^[A-Z_]+$/.test(value)) return null;
    values.push(value);
  }
  return values.length && new Set(values).size === 1 ? values[0] : null;
}
export function sourceFingerprint(targetRepo, artifactRoot) {
  const repo = realpathSync(targetRepo);
  const root = spawnSync('git', ['-C', repo, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (root.status !== 0 || realpathSync(root.stdout.trim()) !== repo) throw new Error('targetRepo must be the target git repository root.');
  const artifact = realpathSync(artifactRoot);
  const artifactRelative = relative(repo, artifact);
  if (!artifactRelative) throw new Error('Artifact root must not be the source repository root.');
  const result = spawnSync('git', ['-C', repo, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error('Cannot fingerprint target git repository.');
  const hash = createHash('sha256');
  for (const file of [...new Set(result.stdout.split('\0').filter(Boolean))].sort()) {
    if (!isAbsolute(artifactRelative) && !artifactRelative.startsWith('../') &&
        (file === artifactRelative || file.startsWith(`${artifactRelative}/`))) continue;
    let bytes = Buffer.alloc(0), kind = 'deleted';
    try {
      const stat = lstatSync(resolve(repo, file));
      if (stat.isSymbolicLink()) { kind = 'symlink'; bytes = Buffer.from(readlinkSync(resolve(repo, file))); }
      else if (stat.isFile()) { kind = stat.mode & 0o111 ? 'executable' : 'file'; bytes = readFileSync(resolve(repo, file)); }
      else throw new Error(`Unsupported source entry: ${file}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    // Length-delimited entries avoid ambiguity between names and bytes.
    hash.update(JSON.stringify([file, kind, bytes.length]) + '\0'); hash.update(bytes);
  }
  return { kind: fingerprintKind, sha256: hash.digest('hex') };
}
export function requireScope(status) {
  if (typeof status.scopeId !== 'string' || !status.scopeId.trim()) throw new Error('status.scopeId is required.');
  if (typeof status.targetRepo !== 'string' || !isAbsolute(status.targetRepo)) throw new Error('status.targetRepo must be absolute.');
  return realpathSync(status.targetRepo);
}
