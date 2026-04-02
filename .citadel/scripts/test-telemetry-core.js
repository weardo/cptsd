#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { logAgentRunEvent, resolveTelemetryPaths } = require('../core/telemetry/log');
const {
  buildAgentReport,
  buildCompressionReport,
  buildHookReport,
  formatAgentReport,
  formatCompressionReport,
  formatHookReport,
} = require('../core/telemetry/report');

function withTempProject(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-telemetry-'));
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function writeJsonl(file, lines) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

withTempProject((projectRoot) => {
  const first = logAgentRunEvent({
    event: 'agent-start',
    agent: 'archon',
    session: 'session-1',
    meta: { tier: 1 },
  }, { projectRoot, timestamp: '2026-03-30T12:00:00.000Z' });

  assert.equal(first.validation.valid, true, 'valid agent-start should pass validation');

  logAgentRunEvent({
    event: 'agent-complete',
    agent: 'archon',
    session: 'session-1',
    duration: 4200,
    status: 'success',
  }, { projectRoot, timestamp: '2026-03-30T12:00:04.200Z' });

  const paths = resolveTelemetryPaths(projectRoot);
  fs.appendFileSync(paths.agentRuns, '{"event":"broken"\n');

  writeJsonl(paths.hookTiming, [
    JSON.stringify({ timestamp: '2026-03-30T12:00:00.000Z', hook: 'quality-gate', duration_ms: 100, metric: 'violations' }),
    JSON.stringify({ timestamp: '2026-03-30T12:00:02.000Z', hook: 'quality-gate', duration_ms: 300 }),
    '{"timestamp":true}',
  ]);

  writeJsonl(paths.compression, [
    JSON.stringify({ agent: 'relay', inputChars: 1000, outputChars: 250, ratio: 0.25 }),
    JSON.stringify({ agent: 'relay', inputChars: 500, outputChars: 200 }),
    'not-json',
  ]);

  const agentReport = buildAgentReport(projectRoot);
  assert.equal(agentReport.totalEntries, 2, 'agent report should only include valid entries');
  assert.equal(agentReport.invalidCount, 1, 'agent report should count invalid lines');
  assert.equal(agentReport.averageDurationMs, 4200, 'agent report should compute average duration');

  const hookReport = buildHookReport(projectRoot);
  assert.equal(hookReport.totalEntries, 2, 'hook report should only include valid entries');
  assert.equal(hookReport.invalidCount, 1, 'hook report should count invalid hook lines');
  assert.equal(hookReport.hooks['quality-gate'].averageMs, 200, 'hook average should be computed');

  const compressionReport = buildCompressionReport(projectRoot);
  assert.equal(compressionReport.totalEntries, 2, 'compression report should include valid entries');
  assert.equal(compressionReport.invalidCount, 1, 'compression report should count invalid compression lines');
  assert.equal(compressionReport.totalInput, 1500, 'compression total input should sum valid entries');
  assert.equal(compressionReport.totalOutput, 450, 'compression total output should sum valid entries');

  const agentText = formatAgentReport(agentReport);
  const hookText = formatHookReport(hookReport);
  const compressionText = formatCompressionReport(compressionReport);

  assert(agentText.includes('Invalid lines: 1 invalid line skipped'), 'agent formatter should mention invalid lines');
  assert(hookText.includes('quality-gate: 2 events avg 200ms'), 'hook formatter should include average');
  assert(compressionText.includes('Average ratio: 30.0%'), 'compression formatter should include computed average');
});

console.log('telemetry core tests passed');
