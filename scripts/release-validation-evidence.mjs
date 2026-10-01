#!/usr/bin/env node
// Execute the approved local validation commands and bind their results to source.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readJson, requireScope, sourceFingerprint } from './lib/release-evidence.mjs';

try {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) {
    console.log('Usage: node scripts/release-validation-evidence.mjs --status <file> --commands <JSON file of command strings>');
  } else {
    const options = {};
    for (let i = 0; i < argv.length; i += 2) {
      if (!['--status', '--commands'].includes(argv[i]) || !argv[i + 1]) throw new Error('Expected --status and --commands.');
      options[argv[i].slice(2)] = argv[i + 1];
    }
    if (!options.status || !options.commands) throw new Error('--status and --commands are required.');
    const statusPath = resolve(options.status), artifacts = dirname(statusPath);
    const status = readJson(statusPath), repo = requireScope(status);
    const commands = readJson(resolve(options.commands));
    if (!Array.isArray(commands) || !commands.length || commands.some(c => typeof c !== 'string' || !c.trim())) throw new Error('Commands must be a nonempty JSON array of approved local validation command strings.');
    if (JSON.stringify(commands) !== JSON.stringify(status.validationCommands)) throw new Error('Commands must match the required status.validationCommands plan.');
    const before = sourceFingerprint(repo, artifacts);
    const outcomes = [];
    for (const command of commands) {
      console.log(`Validating: ${command}`);
      const result = spawnSync(command, { cwd: repo, shell: true, stdio: 'inherit' });
      outcomes.push({ command, exitCode: result.status, signal: result.signal ?? null });
      if (result.status !== 0) break;
    }
    const after = sourceFingerprint(repo, artifacts);
    const passed = outcomes.length === commands.length && outcomes.every(c => c.exitCode === 0) && before.sha256 === after.sha256;
    mkdirSync(artifacts, { recursive: true });
    writeFileSync(resolve(artifacts, 'validation-result.json'), JSON.stringify({
      schemaVersion: 1, verdict: passed ? 'PASS' : 'FAIL', targetRepo: repo,
      scopeId: status.scopeId, artifactRoot: artifacts, validatedAt: new Date().toISOString(),
      sourceFingerprint: after, sourceUnchangedDuringValidation: before.sha256 === after.sha256, commands: outcomes
    }, null, 2) + '\n');
    if (!passed) throw new Error('Validation failed or changed source; release evidence records FAIL.');
    console.log('Validation evidence saved. Runtime report and explicit review verdicts are still required.');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
