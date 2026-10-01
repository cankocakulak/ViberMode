#!/usr/bin/env node
import { resolve } from 'node:path';
import { checkInstalledSkills, installSkills } from './lib/skill-install.mjs';
try {
  const [mode, ...argv] = process.argv.slice(2), options = {};
  if (!['install', 'check'].includes(mode)) throw new Error('Usage: skill-install-state.mjs install|check --source-root <repo> --skills-root <directory> --runtime codex|claude');
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--source-root', '--skills-root', '--runtime'].includes(argv[i]) || !argv[i + 1]) throw new Error('Invalid options.');
    options[argv[i].slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[i + 1];
  }
  if (!options.sourceRoot || !options.skillsRoot || !options.runtime) throw new Error('All three options are required.');
  options.sourceRoot = resolve(options.sourceRoot); options.skillsRoot = resolve(options.skillsRoot);
  const result = mode === 'install' ? installSkills(options) : checkInstalledSkills(options);
  console.log(JSON.stringify(mode === 'install' ? { installed: result.managedDirectories.length - 1, sourceCommit: result.sourceCommit, contentHash: result.contentHash } : result, null, 2));
  if (mode === 'check' && !result.ok) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
