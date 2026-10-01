import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, renameSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installSkills, checkInstalledSkills } from '../scripts/lib/skill-install.mjs';
function setup(t, runtime = 'codex') {
  const root = mkdtempSync(join(tmpdir(), 'viber-install-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceRoot = join(root, 'source'), skillsRoot = join(root, 'installed');
  for (const path of ['adapters/codex/skills/scout', 'packs/vibermode', 'docs/reference', 'scripts']) mkdirSync(join(sourceRoot, path), { recursive: true });
  for (const path of ['README.md', 'AGENTS.md', 'package.json', 'adapters/codex/skills/scout/SKILL.md', 'packs/vibermode/role.md', 'docs/reference/map.md', 'scripts/test.mjs']) writeFileSync(join(sourceRoot, path), `original ${path}`);
  const options = { sourceRoot, skillsRoot, runtime };
  return { ...options, options };
}
for (const runtime of ['codex', 'claude']) test(`${runtime} snapshot is idempotent and preserves unrelated skills`, t => {
  const f = setup(t, runtime);
  mkdirSync(join(f.skillsRoot, 'custom'), { recursive: true }); writeFileSync(join(f.skillsRoot, 'custom/SKILL.md'), 'personal');
  const first = installSkills(f.options), second = installSkills(f.options);
  assert.deepEqual(first, second); assert.equal(checkInstalledSkills(f.options).ok, true);
  assert.equal(readFileSync(join(f.skillsRoot, 'custom/SKILL.md'), 'utf8'), 'personal');
});
test('read-only check reports source and installed drift', t => {
  const f = setup(t); installSkills(f.options);
  const path = join(f.skillsRoot, 'viber-mode/install-manifest.json'), before = readFileSync(path, 'utf8');
  writeFileSync(join(f.sourceRoot, 'packs/vibermode/role.md'), 'new source');
  writeFileSync(join(f.skillsRoot, 'scout/SKILL.md'), 'local drift');
  const result = checkInstalledSkills(f.options);
  assert.equal(result.ok, false); assert.deepEqual(result.installedDrift, ['scout/SKILL.md']);
  assert.deepEqual(result.sourceDrift, ['scout/SKILL.md', 'viber-mode/packs/vibermode/role.md']);
  assert.equal(readFileSync(path, 'utf8'), before);
});
test('failed staging preserves the previous complete snapshot', t => {
  const f = setup(t); installSkills(f.options);
  rmSync(join(f.sourceRoot, 'README.md'));
  assert.throws(() => installSkills(f.options));
  assert.equal(readFileSync(join(f.skillsRoot, 'viber-mode/README.md'), 'utf8'), 'original README.md');
  assert.equal(existsSync(join(f.skillsRoot, '.vibermode-install.lock')), false);
});
test('publication failure rolls back every replaced directory', t => {
  const f = setup(t); installSkills(f.options);
  const manifest = readFileSync(join(f.skillsRoot, 'viber-mode/install-manifest.json'), 'utf8');
  writeFileSync(join(f.sourceRoot, 'adapters/codex/skills/scout/SKILL.md'), 'new version');
  let calls = 0;
  assert.throws(() => installSkills(f.options, { rename: (...args) => { if (++calls === 4) throw new Error('simulated disk failure'); renameSync(...args); } }), /simulated disk failure/);
  assert.equal(readFileSync(join(f.skillsRoot, 'scout/SKILL.md'), 'utf8'), 'original adapters/codex/skills/scout/SKILL.md');
  assert.equal(readFileSync(join(f.skillsRoot, 'viber-mode/install-manifest.json'), 'utf8'), manifest);
});
test('concurrent install lock prevents mutation and remains owned by its creator', t => {
  const f = setup(t); installSkills(f.options); mkdirSync(join(f.skillsRoot, '.vibermode-install.lock'));
  assert.throws(() => installSkills(f.options));
  assert.equal(existsSync(join(f.skillsRoot, '.vibermode-install.lock')), true);
});
test('missing installed file is detected', t => {
  const f = setup(t); installSkills(f.options); rmSync(join(f.skillsRoot, 'scout/SKILL.md'));
  assert.equal(checkInstalledSkills(f.options).ok, false);
});
test('private local artifacts are not copied into a shared bundle', t => {
  const f = setup(t); writeFileSync(join(f.sourceRoot, 'docs/reference/private.local.notes.md'), 'private');
  installSkills(f.options); assert.equal(existsSync(join(f.skillsRoot, 'viber-mode/docs/reference/private.local.notes.md')), false);
});
test('a new skill is detected and installed on update', t => {
  const f = setup(t); installSkills(f.options);
  mkdirSync(join(f.sourceRoot, 'adapters/codex/skills/cost-reviewer')); writeFileSync(join(f.sourceRoot, 'adapters/codex/skills/cost-reviewer/SKILL.md'), 'new skill');
  assert.equal(checkInstalledSkills(f.options).ok, false); installSkills(f.options); assert.equal(checkInstalledSkills(f.options).ok, true);
});
test('a retired skill from the previous manifest is removed', t => {
  const f = setup(t); installSkills(f.options); rmSync(join(f.sourceRoot, 'adapters/codex/skills/scout'), { recursive: true });
  mkdirSync(join(f.sourceRoot, 'adapters/codex/skills/cost-reviewer')); writeFileSync(join(f.sourceRoot, 'adapters/codex/skills/cost-reviewer/SKILL.md'), 'new skill');
  installSkills(f.options); assert.equal(existsSync(join(f.skillsRoot, 'scout')), false); assert.equal(checkInstalledSkills(f.options).ok, true);
});
test('source and destination overlap is rejected', t => {
  const f = setup(t); assert.throws(() => installSkills({ ...f.options, skillsRoot: join(f.sourceRoot, 'skills') }), /overlap/);
});

test('symlink aliases cannot bypass source/destination overlap checks', t => {
  const f = setup(t); const alias = join(f.skillsRoot, '..', 'source-alias');
  symlinkSync(f.sourceRoot, alias);
  assert.throws(() => installSkills({ ...f.options, skillsRoot: join(alias, 'skills') }), /overlap/);
});
