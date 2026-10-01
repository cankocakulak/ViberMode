#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { declaredVerdict, requireScope, sourceFingerprint } from './lib/release-evidence.mjs';

function parseArgs(argv) {
  const args = {
    forbidDirty: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      if (key === 'help') {
        args.help = true;
        continue;
      }
      throw new Error(`Missing value for --${key}`);
    }

    index += 1;
    if (key === 'forbid-dirty') {
      args.forbidDirty.push(next);
    } else {
      args[key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = next;
    }
  }

  return args;
}

function usage() {
  return `Usage:
  node scripts/change-release-gate-check.mjs --status /path/to/change-release-status.json [options]

Options:
  --artifact-root <path>     Artifact directory. Defaults to the status file directory.
  --release-target <target>  Expected release target, for example ios-testflight.
  --forbid-dirty <path>      Fail when this git worktree has any tracked or untracked changes. May repeat.
`;
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not parse JSON at ${filePath}: ${error.message}`);
  }
}

function readTextIfExists(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, 'utf8');
}

function stage(status, name) {
  return status.stages && typeof status.stages === 'object'
    ? status.stages[name]
    : undefined;
}

function normalized(value) {
  return String(value ?? '').trim().toUpperCase();
}

function isComplete(value) {
  return normalized(value) === 'COMPLETE';
}

function gitStatusShort(repoPath) {
  const result = spawnSync('git', ['-C', repoPath, 'status', '--short'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`Could not inspect git status for ${repoPath}: ${result.stderr.trim() || result.stdout.trim()}`);
  }
  return result.stdout.trim();
}

function fail(errors) {
  console.error('Change-to-release gate failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  if (!args.status) {
    throw new Error('--status is required');
  }

  const statusPath = resolve(args.status);
  const artifactRoot = resolve(args.artifactRoot ?? dirname(statusPath));
  const status = readJson(statusPath);
  const errors = [];

  if (status.workflow !== 'change-to-release') {
    errors.push(`Expected workflow "change-to-release", got "${status.workflow ?? 'missing'}".`);
  }

  if (args.releaseTarget && status.releaseTarget !== args.releaseTarget) {
    errors.push(`Expected releaseTarget "${args.releaseTarget}", got "${status.releaseTarget ?? 'missing'}".`);
  }

  if (!['RUNNING', 'COMPLETE'].includes(status.status)) errors.push('Workflow status must be RUNNING or COMPLETE; unresolved incomplete states block release.');

  const repoChange = stage(status, 'repo-change');
  if (!repoChange || !isComplete(repoChange.status)) {
    errors.push('repo-change stage must be COMPLETE before release.');
  }

  const experience = stage(status, 'experience-hardening');
  const finalReview = stage(status, 'final-review');
  if (typeof status.userFacing !== 'boolean') errors.push('status.userFacing must explicitly be true or false.');
  const experienceVerdicts = status.userFacing === false ? ['APPROVED', 'SKIPPED_NOT_APPLICABLE'] : ['APPROVED'];
  if (!experience || !isComplete(experience.status) || !experienceVerdicts.includes(experience.verdict)) {
    errors.push('experience-hardening requires COMPLETE and an exact applicable verdict.');
  }
  if (!finalReview || !isComplete(finalReview.status) || finalReview.verdict !== 'APPROVED') {
    errors.push('final-review requires COMPLETE and exact APPROVED verdict.');
  }
  for (const [file, expected] of [
    ['review.md', ['APPROVED']],
    ['experience-review.md', experienceVerdicts],
    ['validation-report.md', ['PASS']]
  ]) {
    const text = readTextIfExists(resolve(artifactRoot, file));
    const verdict = text && declaredVerdict(text);
    if (!expected.includes(verdict)) errors.push(`${file} needs an explicit, unambiguous ${expected.join('/')} verdict.`);
    if (file === 'experience-review.md' && verdict !== experience?.verdict) errors.push('Experience report and stage verdict disagree.');
  }
  if (!Array.isArray(status.blockers) || status.blockers.length) errors.push('status.blockers must be an explicit empty array.');
  try {
    const repo = requireScope(status);
    const evidence = readJson(resolve(artifactRoot, 'validation-result.json'));
    const current = sourceFingerprint(repo, artifactRoot);
    if (evidence.schemaVersion !== 1 || evidence.verdict !== 'PASS' || evidence.sourceUnchangedDuringValidation !== true) throw new Error('Executed validation must record PASS with unchanged source.');
    if (evidence.targetRepo !== repo || evidence.scopeId !== status.scopeId || resolve(evidence.artifactRoot ?? '') !== artifactRoot) throw new Error('Validation target, artifact root or scope does not match.');
    if (evidence.sourceFingerprint?.kind !== current.kind || evidence.sourceFingerprint?.sha256 !== current.sha256) throw new Error('Source changed since validation; run validation again.');
    for (const [name, review] of [['final-review', finalReview], ['experience-hardening', experience]]) {
      if (review?.scopeId !== status.scopeId || review?.sourceFingerprint !== current.sha256) throw new Error(`${name} must bind its review to the current validated source and scope.`);
    }
    if (!Array.isArray(status.validationCommands) || !status.validationCommands.length || JSON.stringify(evidence.commands?.map(c => c.command)) !== JSON.stringify(status.validationCommands)) throw new Error('Executed commands must match the required validation plan.');
    if (!Array.isArray(evidence.commands) || !evidence.commands.length || evidence.commands.some(c => typeof c.command !== 'string' || !c.command.trim() || c.exitCode !== 0 || c.signal)) throw new Error('Every required validation command must have exit code 0.');
  } catch (error) { errors.push(`Validation evidence: ${error.message}`); }

  for (const repoPath of args.forbidDirty) {
    const shortStatus = gitStatusShort(resolve(repoPath));
    if (shortStatus) {
      errors.push(`Forbidden dirty worktree at ${resolve(repoPath)}:\n${shortStatus}`);
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }

  console.log(`Change-to-release gate passed for ${status.releaseTarget ?? 'release'} using ${statusPath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  console.error(usage());
  process.exit(1);
}
