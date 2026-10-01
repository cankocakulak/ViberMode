import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const gate = resolve('scripts/change-release-gate-check.mjs');
test('release refuses a failed validation even with approved reviews', () => {
  const root = mkdtempSync(join(tmpdir(), 'viber-gate-'));
  try {
    mkdirSync(join(root, 'proof'));
    const artifacts = join(root, 'proof');
    writeFileSync(join(artifacts, 'change-release-status.json'), JSON.stringify({
      workflow: 'change-to-release', targetRepo: root, releaseTarget: 'ios-testflight', blockers: [],
      stages: { 'repo-change': { status: 'COMPLETE' },
        'experience-hardening': { status: 'COMPLETE', verdict: 'APPROVED' },
        'final-review': { status: 'COMPLETE', verdict: 'APPROVED' } }
    }));
    writeFileSync(join(artifacts, 'review.md'), 'Verdict: APPROVED\n');
    writeFileSync(join(artifacts, 'experience-review.md'), 'Verdict: APPROVED\n');
    writeFileSync(join(artifacts, 'validation-report.md'), 'Verdict: FAIL\nnpm test exited 1\n');
    const result = spawnSync(process.execPath, [gate, '--status', join(artifacts, 'change-release-status.json')]);
    assert.equal(result.status, 1, 'failed validation must block release');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

import { chmodSync, readFileSync, symlinkSync, unlinkSync } from 'node:fs';
import { declaredVerdict } from '../scripts/lib/release-evidence.mjs';
const runner = resolve('scripts/release-validation-evidence.mjs');
function fixture(t, { userFacing = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'viber-release-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const artifacts = join(root, 'proof'); mkdirSync(artifacts);
  spawnSync('git', ['init', '-q', root]);
  writeFileSync(join(root, 'app.js'), 'const ok = 1;\n');
  spawnSync('git', ['-C', root, 'add', 'app.js']);
  const commands = ['node --check app.js'];
  const status = { workflow: 'change-to-release', status: 'RUNNING', targetRepo: root, scopeId: 'fix-123',
    releaseTarget: 'ios-testflight', userFacing, validationCommands: commands, blockers: [],
    stages: { 'repo-change': { status: 'COMPLETE' },
      'experience-hardening': { status: 'COMPLETE', verdict: userFacing ? 'APPROVED' : 'SKIPPED_NOT_APPLICABLE' },
      'final-review': { status: 'COMPLETE', verdict: 'APPROVED' } } };
  const path = join(artifacts, 'change-release-status.json');
  const save = () => writeFileSync(path, JSON.stringify(status)); save();
  writeFileSync(join(artifacts, 'commands.json'), JSON.stringify(commands));
  writeFileSync(join(artifacts, 'validation-report.md'), 'Verdict: PASS\n');
  writeFileSync(join(artifacts, 'experience-review.md'), `Verdict: ${status.stages['experience-hardening'].verdict}\n`);
  writeFileSync(join(artifacts, 'review.md'), '## Verdict\n**APPROVED**\nPrevious failure was repaired.\n');
  const validate = () => spawnSync(process.execPath, [runner, '--status', path, '--commands', join(artifacts, 'commands.json')], { encoding: 'utf8' });
  assert.equal(validate().status, 0);
  const evidence = JSON.parse(readFileSync(join(artifacts, 'validation-result.json')));
  for (const name of ['final-review', 'experience-hardening']) Object.assign(status.stages[name], { scopeId: status.scopeId, sourceFingerprint: evidence.sourceFingerprint.sha256 });
  save();
  const check = () => spawnSync(process.execPath, [gate, '--status', path], { encoding: 'utf8' });
  return { root, artifacts, status, path, save, check, validate };
}
test('valid executed evidence passes and artifact changes do not stale source', t => {
  const f = fixture(t); assert.equal(f.check().status, 0);
  writeFileSync(join(f.artifacts, 'notes.md'), 'Review notes'); assert.equal(f.check().status, 0);
});
test('backend-only explicit experience skip passes', t => {
  const f = fixture(t, { userFacing: false }); assert.equal(f.check().status, 0);
});
for (const [name, mutate] of [
  ['missing validation', f => unlinkSync(join(f.artifacts, 'validation-result.json'))],
  ['failed runtime report', f => writeFileSync(join(f.artifacts, 'validation-report.md'), 'Verdict: FAIL\n')],
  ['missing final stage', f => { delete f.status.stages['final-review']; f.save(); }],
  ['missing experience stage', f => { delete f.status.stages['experience-hardening']; f.save(); }],
  ['substring approval', f => writeFileSync(join(f.artifacts, 'review.md'), 'Verdict: NOT_APPROVED\n')],
  ['conflicting verdicts', f => writeFileSync(join(f.artifacts, 'review.md'), 'Verdict: APPROVED\nVerdict: BLOCKED\n')],
  ['missing blockers', f => { delete f.status.blockers; f.save(); }],
  ['known blockers', f => { f.status.blockers = ['pending']; f.save(); }],
  ['incomplete workflow', f => { f.status.status = 'INCOMPLETE_VALIDATION_FAILED'; f.save(); }],
  ['wrong scope', f => { f.status.scopeId = 'other'; f.save(); }],
  ['changed source', f => writeFileSync(join(f.root, 'app.js'), 'const changed = 2;')],
  ['deleted tracked source', f => unlinkSync(join(f.root, 'app.js'))],
  ['new untracked source', f => writeFileSync(join(f.root, 'new.js'), 'const newCode = 1;')],
  ['changed executable bit', f => chmodSync(join(f.root, 'app.js'), 0o755)],
  ['new symlink', f => symlinkSync('app.js', join(f.root, 'link.js'))],
  ['changed validation plan', f => { f.status.validationCommands = ['true']; f.save(); }],
  ['UI experience skip', f => { f.status.stages['experience-hardening'].verdict = 'SKIPPED_NOT_APPLICABLE'; f.save(); writeFileSync(join(f.artifacts, 'experience-review.md'), 'Verdict: SKIPPED_NOT_APPLICABLE\n'); }],
  ['nonzero exit', f => { const p = join(f.artifacts, 'validation-result.json'); const e = JSON.parse(readFileSync(p)); e.commands[0].exitCode = 1; writeFileSync(p, JSON.stringify(e)); }],
  ['empty executed commands', f => { const p = join(f.artifacts, 'validation-result.json'); const e = JSON.parse(readFileSync(p)); e.commands = []; writeFileSync(p, JSON.stringify(e)); }],
  ['wrong evidence target', f => { const p = join(f.artifacts, 'validation-result.json'); const e = JSON.parse(readFileSync(p)); e.targetRepo = '/wrong'; writeFileSync(p, JSON.stringify(e)); }]
]) test(`release refuses ${name}`, t => { const f = fixture(t); mutate(f); assert.equal(f.check().status, 1); });
test('runner records FAIL when a command fails', t => {
  const f = fixture(t); f.status.validationCommands = ['node -e "process.exit(2)"']; f.save();
  writeFileSync(join(f.artifacts, 'commands.json'), JSON.stringify(f.status.validationCommands));
  assert.equal(f.validate().status, 1); assert.equal(f.check().status, 1);
});
test('runner records FAIL when validation modifies source', t => {
  const f = fixture(t); f.status.validationCommands = ['node -e "require(\'fs\').writeFileSync(\'app.js\',\'changed\')"']; f.save();
  writeFileSync(join(f.artifacts, 'commands.json'), JSON.stringify(f.status.validationCommands));
  assert.equal(f.validate().status, 1); assert.equal(f.check().status, 1);
});
test('declared verdict parser accepts normal Markdown without approving prose', () => {
  for (const text of ['Verdict: **APPROVED**.\n', '## Verdict\n`APPROVED`\n', '**Verdict**: APPROVED\n', '## Verdict\nVerdict: APPROVED\n']) assert.equal(declaredVerdict(text), 'APPROVED');
  assert.equal(declaredVerdict('This is APPROVED in my opinion.'), null);
});

test('revalidating changed source does not make old reviews current', t => {
  const f = fixture(t); writeFileSync(join(f.root, 'app.js'), 'const anotherChange = 3;');
  assert.equal(f.validate().status, 0); assert.equal(f.check().status, 1);
});
test('verdict parser rejects malformed conflicting declarations and ignores examples', () => {
  assert.equal(declaredVerdict('Verdict: APPROVED\nVerdict: FAIL (pending issue)\n'), null);
  assert.equal(declaredVerdict('Verdict: APPROVED\n```text\nVerdict: BLOCKED\n```\n'), 'APPROVED');
});
