#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { parseHandoff } = require('../core/fleet/parse-handoff');
const { compressDiscovery, logCompressionStat } = require('../core/fleet/compress-discovery');

const sample = [
  'Implemented src/auth.ts middleware and updated src/routes.ts.',
  'Decision: chose jose for token verification.',
  'Blocked briefly by failing test in test/auth.spec.ts.',
  '',
  '--- HANDOFF ---',
  '- Built JWT middleware',
  '- Wired auth routes',
  '- Remaining: fix flaky auth test',
  '---',
].join('\n');

const parsed = parseHandoff(sample);
assert.equal(parsed.found, true, 'handoff should be detected');
assert.deepEqual(parsed.items, ['Built JWT middleware', 'Wired auth routes', 'Remaining: fix flaky auth test']);

const brief = compressDiscovery(sample, 'wave1-builder', null);
assert(brief.includes('## Agent: wave1-builder'), 'brief should include agent heading');
assert(brief.includes('**Built:** Built JWT middleware. Wired auth routes'), 'brief should include built summary from handoff');
assert(brief.includes('**Remaining:** Remaining: fix flaky auth test'), 'brief should include remaining items');
assert(brief.includes('**Decisions:**'), 'brief should include decisions section');
assert(brief.includes('src/auth.ts'), 'brief should include extracted files');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-discovery-'));
try {
  const statsFile = logCompressionStat(tempRoot, {
    timestamp: '2026-03-30T22:00:00.000Z',
    agent: 'wave1-builder',
    inputChars: sample.length,
    outputChars: brief.length,
    ratio: Number((brief.length / sample.length).toFixed(3)),
  });
  const content = fs.readFileSync(statsFile, 'utf8').trim();
  assert(content.includes('"agent":"wave1-builder"'), 'compression stat should be written');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('discovery core tests passed');
