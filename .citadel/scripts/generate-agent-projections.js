#!/usr/bin/env node

'use strict';

const path = require('path');
const { projectCodexAgents } = require(path.join(__dirname, '..', 'runtimes', 'codex', 'generators', 'project-agents'));

const CITADEL_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  return {
    projectRoot: argv.find((arg, index) => argv[index - 1] === '--project-root')
      ? path.resolve(argv[argv.indexOf('--project-root') + 1])
      : process.cwd(),
    agentName: argv.find((arg, index) => argv[index - 1] === '--agent') || null,
    dryRun: argv.includes('--dry-run'),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = projectCodexAgents({
    citadelRoot: CITADEL_ROOT,
    projectRoot: args.projectRoot,
    agentName: args.agentName,
    dryRun: args.dryRun,
  });

  for (const result of results) {
    const verb = args.dryRun ? 'would project' : 'projected';
    console.log(`[${verb}] ${result.parsedAgent.frontmatter.name || result.parsedAgent.name}`);
  }
}

main();
