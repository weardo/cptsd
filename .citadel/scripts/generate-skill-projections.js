#!/usr/bin/env node

'use strict';

const path = require('path');
const { projectCodexSkills } = require(path.join(__dirname, '..', 'runtimes', 'codex', 'generators', 'project-skills'));

const CITADEL_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  return {
    projectRoot: argv.find((arg, index) => argv[index - 1] === '--project-root')
      ? path.resolve(argv[argv.indexOf('--project-root') + 1])
      : process.cwd(),
    skillName: argv.find((arg, index) => argv[index - 1] === '--skill') || null,
    dryRun: argv.includes('--dry-run'),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = projectCodexSkills({
    citadelRoot: CITADEL_ROOT,
    projectRoot: args.projectRoot,
    skillName: args.skillName,
    dryRun: args.dryRun,
  });

  for (const result of results) {
    const verb = args.dryRun ? 'would project' : 'projected';
    console.log(`[${verb}] ${result.skillName}`);
  }
}

main();
