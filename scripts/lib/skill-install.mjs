import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const manifestName = 'viber-mode/install-manifest.json';
const privateEntry = name => name.includes('.local.') || ['.git', '.DS_Store', 'node_modules'].includes(name);
function hashFiles(root, names) {
  const files = {};
  function visit(path, key) {
    if (key === manifestName) return;
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Symlink is not supported in a skill snapshot: ${key}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) if (!privateEntry(name)) visit(join(path, name), `${key}/${name}`);
    } else if (stat.isFile()) files[key] = { sha256: createHash('sha256').update(readFileSync(path)).digest('hex'), executable: Boolean(stat.mode & 0o111) };
    else throw new Error(`Unsupported snapshot entry: ${key}`);
  }
  for (const name of [...names].sort()) {
    if (!existsSync(join(root, name))) throw new Error(`Missing installed snapshot directory: ${name}`);
    visit(join(root, name), name);
  }
  return files;
}
function differences(expected, actual) {
  return [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort().filter(key => JSON.stringify(expected[key]) !== JSON.stringify(actual[key]));
}
function sourceCommit(sourceRoot) {
  const result = spawnSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}
function prepare(sourceRoot, stage, runtime) {
  const source = join(sourceRoot, 'adapters/codex/skills');
  const names = readdirSync(source).filter(name => !privateEntry(name) && lstatSync(join(source, name)).isDirectory()).sort();
  if (!names.length || names.includes('viber-mode')) throw new Error('Invalid or empty skill source.');
  const copy = (from, to) => cpSync(join(sourceRoot, from), join(stage, to), {
    recursive: true, filter: path => !privateEntry(path.split('/').at(-1))
  });
  for (const name of names) copy(`adapters/codex/skills/${name}`, name);
  for (const path of ['packs/vibermode', 'docs/reference', 'scripts', 'README.md', 'AGENTS.md', 'package.json']) copy(path, `viber-mode/${path}`);
  for (const path of ['docs/operations', 'docs/architecture', 'docs/use-cases']) if (existsSync(join(sourceRoot, path))) copy(path, `viber-mode/${path}`);
  const managedDirectories = [...names, 'viber-mode'];
  const files = hashFiles(stage, managedDirectories);
  const manifest = { schemaVersion: 1, runtime, sourceCommit: sourceCommit(sourceRoot),
    contentHash: createHash('sha256').update(JSON.stringify(files)).digest('hex'), managedDirectories, files };
  writeFileSync(join(stage, manifestName), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
function canonicalPath(path) {
  path = resolve(path);
  if (existsSync(path)) return realpathSync(path);
  return join(canonicalPath(dirname(path)), basename(path));
}
function assertRoots(sourceRoot, skillsRoot) {
  if (!['codex', 'claude'].includes(sourceRoot.runtime)) throw new Error('Runtime must be codex or claude.');
  const source = realpathSync(sourceRoot.path), target = canonicalPath(skillsRoot);
  // Installing into the source tree or into one of its ancestors corrupts source.
  const overlap = (a, b) => { const rel = relative(a, b); return !rel || (!rel.startsWith('../') && rel !== '..'); };
  if (overlap(source, target) || overlap(target, source)) throw new Error('Source and skill destination must not overlap.');
  return source;
}
export function installSkills({ sourceRoot, skillsRoot, runtime }, { rename = renameSync } = {}) {
  sourceRoot = assertRoots({ path: sourceRoot, runtime }, skillsRoot);
  mkdirSync(skillsRoot, { recursive: true });
  skillsRoot = realpathSync(skillsRoot);
  const lock = join(skillsRoot, '.vibermode-install.lock');
  mkdirSync(lock); // Existing lock blocks concurrent installs; never remove someone else's lock.
  let stage;
  const moved = [], published = [];
  try {
    stage = mkdtempSync(join(skillsRoot, '.vibermode-stage-'));
    const manifest = prepare(sourceRoot, stage, runtime);
    const previousPath = join(skillsRoot, manifestName);
    let previous = [];
    if (existsSync(previousPath)) {
      const old = JSON.parse(readFileSync(previousPath, 'utf8'));
      if (old.schemaVersion !== 1 || !Array.isArray(old.managedDirectories)) throw new Error('Invalid previous installation manifest.');
      previous = old.managedDirectories;
    }
    const directories = [...new Set([...manifest.managedDirectories, ...previous, 'game-new-prototype', 'game-signature-prototype', 'game-night-loop'])];
    if (directories.some(name => typeof name !== 'string' || !/^[a-z][a-z0-9-]*$/.test(name))) throw new Error('Invalid managed directory name.');
    const backup = join(stage, '.backup'); mkdirSync(backup);
    for (const name of directories) {
      const target = join(skillsRoot, name);
      if (existsSync(target)) { rename(target, join(backup, name)); moved.push(name); }
      if (manifest.managedDirectories.includes(name)) { rename(join(stage, name), target); published.push(name); }
    }
    return manifest;
  } catch (error) {
    // Per-directory publication is transactional on ordinary failures, not a
    // global atomic switch. Keep backups if rollback itself cannot finish.
    try {
      for (const name of published.reverse()) rmSync(join(skillsRoot, name), { recursive: true, force: true });
      for (const name of moved.reverse()) renameSync(join(stage, '.backup', name), join(skillsRoot, name));
    } catch (rollbackError) {
      const recovery = stage; stage = null;
      throw new Error(`Install failed: ${error.message}; rollback failed: ${rollbackError.message}. Recover backups at ${recovery}`);
    }
    throw error;
  } finally {
    if (stage) rmSync(stage, { recursive: true, force: true });
    rmSync(lock, { recursive: true });
  }
}
export function checkInstalledSkills({ sourceRoot, skillsRoot, runtime }) {
  sourceRoot = assertRoots({ path: sourceRoot, runtime }, skillsRoot);
  const path = join(skillsRoot, manifestName);
  if (!existsSync(path)) return { ok: false, message: 'Installation manifest is missing; reinstall to establish a versioned snapshot.' };
  const installed = JSON.parse(readFileSync(path, 'utf8'));
  if (installed.schemaVersion !== 1 || installed.runtime !== runtime || !Array.isArray(installed.managedDirectories) || installed.managedDirectories.some(name => typeof name !== 'string' || !/^[a-z][a-z0-9-]*$/.test(name))) throw new Error('Invalid installed manifest.');
  let actual;
  try { actual = hashFiles(skillsRoot, installed.managedDirectories); }
  catch (error) { return { ok: false, message: error.message }; }
  // Read-only check: compare source entries directly, without staging/writes.
  const expected = {};
  const wrapperRoot = join(sourceRoot, 'adapters/codex/skills');
  const names = readdirSync(wrapperRoot).filter(n => !privateEntry(n) && lstatSync(join(wrapperRoot, n)).isDirectory()).sort();
  Object.assign(expected, hashFiles(wrapperRoot, names));
  const support = ['packs/vibermode', 'docs/reference', 'scripts', 'README.md', 'AGENTS.md', 'package.json',
    ...['docs/operations', 'docs/architecture', 'docs/use-cases'].filter(p => existsSync(join(sourceRoot, p)))];
  for (const [key, value] of Object.entries(hashFiles(sourceRoot, support))) expected[`viber-mode/${key}`] = value;
  const installedDrift = differences(installed.files ?? {}, actual);
  const sourceDrift = differences(expected, actual);
  const commit = sourceCommit(sourceRoot);
  const metadataDrift = installed.sourceCommit !== commit || installed.contentHash !== createHash('sha256').update(JSON.stringify(installed.files)).digest('hex');
  return { ok: !installedDrift.length && !sourceDrift.length && !metadataDrift,
    sourceCommit: commit, installedCommit: installed.sourceCommit, installedDrift, sourceDrift, metadataDrift };
}
