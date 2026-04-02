#!/usr/bin/env node

/**
 * compress-discovery.cjs — Extract structured discovery briefs from agent outputs.
 *
 * Takes raw agent output (markdown) and produces a compressed discovery brief
 * targeted under 500 tokens (~2000 chars). Used by Fleet Commander between waves
 * to auto-inject context into the next wave's agents.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  compressDiscovery,
  logCompressionStat,
  parseArgs,
} = require('../core/fleet/compress-discovery');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function main() {
  const args = parseArgs(process.argv);
  const rawText = args.input
    ? fs.readFileSync(args.input, 'utf8')
    : fs.readFileSync(0, 'utf8');

  const brief = compressDiscovery(rawText, args.agent, args.status);

  try {
    logCompressionStat(PROJECT_ROOT, {
      timestamp: new Date().toISOString(),
      agent: args.agent || 'unknown',
      inputChars: rawText.length,
      outputChars: brief.length,
      ratio: Number((brief.length / rawText.length).toFixed(3)),
    });
  } catch {
    // non-critical
  }

  if (args.output) {
    const outDir = path.dirname(args.output);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(args.output, brief);
    console.log(`Brief written to ${args.output} (${brief.length} chars)`);
  } else {
    process.stdout.write(brief);
  }
}

main();
