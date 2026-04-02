#!/usr/bin/env node

/**
 * telemetry-report.cjs — Generate human-readable telemetry summaries.
 *
 * Usage:
 *   node scripts/telemetry-report.cjs                  Full summary
 *   node scripts/telemetry-report.cjs --last 10        Last N runs
 *   node scripts/telemetry-report.cjs --hooks          Hook timing summary
 *   node scripts/telemetry-report.cjs --compression    Discovery compression stats
 *   node scripts/telemetry-report.cjs --tokens         Token economics section
 */

const {
  buildAgentReport,
  buildCompressionReport,
  buildHookReport,
  formatAgentReport,
  formatCompressionReport,
  formatHookReport,
} = require('../core/telemetry/report');
const { readTokenEconomics } = require('./telemetry-stats.js');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function agentReport(limit) {
  process.stdout.write(formatAgentReport(buildAgentReport(PROJECT_ROOT, { limit })));
}

function hookReport() {
  process.stdout.write(formatHookReport(buildHookReport(PROJECT_ROOT)));
}

function compressionReport() {
  process.stdout.write(formatCompressionReport(buildCompressionReport(PROJECT_ROOT)));
}

function tokenReport() {
  const econ = readTokenEconomics();
  const LINE = '\u2500'.repeat(30);

  console.log('\nToken Economics (Estimates)');
  console.log(LINE);

  const routing = econ.routing_savings_estimate;
  if (routing) {
    const resolutions = routing.tier0_resolutions + routing.tier1_resolutions + routing.tier2_resolutions;
    const tokens = routing.tokens_saved_estimate;
    console.log(`Routing savings     ~${tokens.toLocaleString()} tokens (${resolutions} Tier 0-2 resolutions)`);
  } else {
    console.log('Routing savings     N/A (tier data not yet tracked in agent-runs.jsonl)');
  }

  const cb = econ.circuit_breaker_saves;
  console.log(`Circuit breaker     ~${cb.tokens_saved_estimate.toLocaleString()} tokens (${cb.total_trips} trips averted)`);

  const qg = econ.quality_gate_saves;
  console.log(`Quality gates       ~${qg.tokens_saved_estimate.toLocaleString()} tokens (${qg.violations_caught} violation${qg.violations_caught !== 1 ? 's' : ''} caught)`);

  console.log(LINE);
  console.log(`Estimated total     ~${econ.total_estimated_savings.toLocaleString()} tokens saved`);
  console.log('* Estimates. Methodology: docs/token-economics-methodology.md');
  console.log('');
}

const args = process.argv.slice(2);

if (args.includes('--hooks')) {
  hookReport();
} else if (args.includes('--compression')) {
  compressionReport();
} else if (args.includes('--tokens')) {
  tokenReport();
} else {
  const lastIdx = args.indexOf('--last');
  const limit = lastIdx >= 0 ? parseInt(args[lastIdx + 1], 10) : null;
  agentReport(limit);
  if (args.includes('--tokens')) tokenReport();
}
