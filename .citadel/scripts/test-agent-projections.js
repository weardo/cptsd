#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadAgent } = require(path.join(__dirname, '..', 'core', 'agents', 'parse-agent'));
const { renderCodexToml, projectAgentToCodex } = require(path.join(__dirname, '..', 'core', 'agents', 'project-agent'));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function main() {
  const agentPath = path.join(__dirname, '..', 'agents', 'archon.md');
  const parsed = loadAgent(agentPath);
  if (parsed.errors.length > 0) {
    fail(`Parsed agent has validation errors: ${parsed.errors.join('; ')}`);
  }

  const toml = renderCodexToml(parsed);
  if (!toml.includes('name = "archon"')) {
    fail('Generated TOML is missing the expected agent name');
  }
  if (!toml.includes('model = "gpt-5.4"')) {
    fail('Generated TOML is missing the expected model mapping');
  }

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-agent-proj-'));
  const targetBase = path.join(tmpRoot, '.codex', 'agents');
  const result = projectAgentToCodex(agentPath, targetBase);

  if (!fs.existsSync(result.output.tomlPath)) {
    fail('Projected agent TOML was not written');
  }

  const projectedToml = fs.readFileSync(result.output.tomlPath, 'utf8');
  if (!projectedToml.includes('developer_instructions = """')) {
    fail('Projected TOML is missing developer instructions');
  }

  fs.rmSync(tmpRoot, { recursive: true, force: true });
  console.log('Agent projection tests pass.');
}

main();
