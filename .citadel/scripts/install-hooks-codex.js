#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { installCodexHooks } = require('../runtimes/codex/generators/install-hooks');

const CITADEL_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = process.argv[2] || process.cwd();

function main() {
  try {
    const hooksTemplatePath = path.join(CITADEL_ROOT, 'hooks', 'hooks-template.json');
    const hooksTemplate = JSON.parse(fs.readFileSync(hooksTemplatePath, 'utf8'));
    const adapterScriptPath = path.join(CITADEL_ROOT, 'hooks_src', 'codex-adapter.js');
    const outputPath = path.join(PROJECT_ROOT, '.codex', 'hooks.json');
    const existingHooks = fs.existsSync(outputPath)
      ? (JSON.parse(fs.readFileSync(outputPath, 'utf8')).hooks || {})
      : {};

    const result = installCodexHooks({
      hooksTemplate,
      adapterScriptPath,
      existingHooks,
      outputPath,
    });

    console.log(`Citadel Codex hooks installed to ${outputPath}`);
    console.log(`  ${result.installed.length} Citadel hooks translated for Codex`);
    if (result.skipped.length > 0) {
      console.log(`  ${result.skipped.length} hook mappings skipped due to missing Codex lifecycle equivalents`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
