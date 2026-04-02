#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const codexRuntime = require(path.join(__dirname, '..', 'runtimes', 'codex'));

assert.equal(codexRuntime.runtime.id, 'codex', 'runtime id should be codex');
assert.equal(codexRuntime.guidance.target.filePath, 'AGENTS.md', 'Codex runtime guidance should target AGENTS.md');
assert.equal(typeof codexRuntime.installCodexHooks, 'function', 'Codex runtime should expose hook installer');
assert.equal(typeof codexRuntime.projectCodexSkills, 'function', 'Codex runtime should expose skill projection');
assert.equal(typeof codexRuntime.projectCodexAgents, 'function', 'Codex runtime should expose agent projection');

const adapterPath = path.join(__dirname, '..', 'hooks_src', 'codex-adapter.js');
const payload = {
  hook_event_name: 'PreToolUse',
  tool_name: 'Read',
  tool_input: { file_path: '.env' },
};
const result = spawnSync(process.execPath, [adapterPath, 'protect-files'], {
  cwd: path.join(__dirname, '..'),
  input: JSON.stringify(payload),
  encoding: 'utf8',
});

assert.equal(result.status, 2, 'Codex adapter should propagate hook exit status');
assert(result.stdout.includes('.env'), 'Codex adapter should surface underlying hook output');

const tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-codex-runtime-'));
try {
  const skills = codexRuntime.projectCodexSkills({ projectRoot: tmpProject, skillName: 'review', dryRun: true });
  const agents = codexRuntime.projectCodexAgents({ projectRoot: tmpProject, agentName: 'archon', dryRun: true });
  assert.equal(skills.length, 1, 'Codex runtime should dry-run one projected skill');
  assert.equal(agents.length, 1, 'Codex runtime should dry-run one projected agent');
} finally {
  fs.rmSync(tmpProject, { recursive: true, force: true });
}

console.log('codex runtime tests passed');
