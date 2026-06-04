#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

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

function isApprovedVerdict(value) {
  const verdict = normalized(value);
  if (!verdict) {
    return false;
  }
  if (/(BLOCKED|INCOMPLETE|FAILED|FAIL|CHANGES_REQUESTED|KNOWN_GAPS|OVERRIDDEN)/.test(verdict)) {
    return false;
  }
  return /(APPROVED|PASS|PASSED|READY|SKIPPED_NOT_APPLICABLE)/.test(verdict);
}

function reviewLooksApproved(text) {
  if (!text) {
    return false;
  }

  const upper = text.toUpperCase();
  if (/(RELEASED_WITH_KNOWN_GAPS|KNOWN_GAPS|CHANGES_REQUESTED|BLOCKED|INCOMPLETE|FAILED|FAIL)/.test(upper)) {
    return false;
  }
  return /(VERDICT\s*\n\s*`?(APPROVED|PASS|PASSED|READY_FOR_RELEASE)|NO ISSUES|APPROVED)/.test(upper);
}

function experienceLooksApproved(text) {
  if (!text) {
    return false;
  }

  const upper = text.toUpperCase();
  if (/(INCOMPLETE|CHANGES_REQUESTED|BLOCKED|KNOWN_GAPS|OVERRIDDEN|LAUNCH-ONLY|NOT REACHED|COULD NOT BE VISUALLY REVIEWED|NOT DIRECTLY REVIEWED)/.test(upper)) {
    return false;
  }
  return /(VERDICT\s*\n\s*`?(APPROVED|SKIPPED_NOT_APPLICABLE)|APPROVED|SKIPPED_NOT_APPLICABLE)/.test(upper);
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

  const repoChange = stage(status, 'repo-change');
  if (!repoChange || !isComplete(repoChange.status)) {
    errors.push('repo-change stage must be COMPLETE before release.');
  }

  const experience = stage(status, 'experience-hardening');
  if (experience) {
    if (!isComplete(experience.status)) {
      errors.push(`experience-hardening stage must be COMPLETE before release; got "${experience.status ?? 'missing'}".`);
    }
    if (!isApprovedVerdict(experience.verdict)) {
      errors.push(`experience-hardening verdict must be APPROVED or SKIPPED_NOT_APPLICABLE; got "${experience.verdict ?? 'missing'}".`);
    }
  }

  const experienceText = readTextIfExists(resolve(artifactRoot, 'experience-review.md'));
  if (experience && !experienceLooksApproved(experienceText)) {
    errors.push('experience-review.md does not contain an approved/skipped verdict with acceptable surface evidence.');
  }

  const finalReview = stage(status, 'final-review');
  if (finalReview) {
    if (!isComplete(finalReview.status)) {
      errors.push(`final-review stage must be COMPLETE before release; got "${finalReview.status ?? 'missing'}".`);
    }
    if (!isApprovedVerdict(finalReview.verdict)) {
      errors.push(`final-review verdict must be approved/pass; got "${finalReview.verdict ?? 'missing'}".`);
    }
  }

  const reviewText = readTextIfExists(resolve(artifactRoot, 'review.md'));
  if (!reviewLooksApproved(reviewText)) {
    errors.push('review.md does not contain an approved final-review verdict.');
  }

  if (Array.isArray(status.blockers) && status.blockers.length > 0) {
    errors.push(`status.blockers must be empty before release; found ${status.blockers.length}.`);
  }

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
