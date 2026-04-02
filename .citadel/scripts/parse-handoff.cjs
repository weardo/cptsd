#!/usr/bin/env node

/**
 * parse-handoff.cjs — Extract HANDOFF blocks from agent output.
 *
 * Parses the structured handoff format that agents produce at the end
 * of their work. Used by orchestrators (Archon, Fleet) to update
 * campaign ledgers and fleet session files.
 *
 * Usage:
 *   node scripts/parse-handoff.cjs --input agent-output.md
 *   echo "agent output..." | node scripts/parse-handoff.cjs
 *
 * Output: JSON with { items: string[], raw: string }
 */

'use strict';

const fs = require('fs');
const { parseHandoff } = require('../core/fleet/parse-handoff');

function main() {
  const args = process.argv.slice(2);
  let inputFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputFile = args[i + 1];
      i++;
    }
  }

  const text = inputFile
    ? fs.readFileSync(inputFile, 'utf8')
    : fs.readFileSync(0, 'utf8');

  process.stdout.write(JSON.stringify(parseHandoff(text), null, 2));
}

main();
