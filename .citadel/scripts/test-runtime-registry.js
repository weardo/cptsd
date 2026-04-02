#!/usr/bin/env node

'use strict';

const path = require('path');
const { getRuntimeDefinition, listRuntimeIds } = require(path.join(__dirname, '..', 'core', 'runtime', 'registry'));
const { detectRuntime, VALID_RUNTIMES } = require(path.join(__dirname, '..', 'core', 'runtime', 'detect-runtime'));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function main() {
  const runtimeIds = listRuntimeIds();
  if (!runtimeIds.includes('claude-code') || !runtimeIds.includes('codex') || !runtimeIds.includes('unknown')) {
    fail('Runtime registry missing one or more expected runtime ids');
  }

  if (!VALID_RUNTIMES.includes('codex')) {
    fail('Detect-runtime valid runtime list missing codex');
  }

  const claude = getRuntimeDefinition('claude-code');
  const codex = getRuntimeDefinition('codex');
  const unknown = getRuntimeDefinition('does-not-exist');

  if (claude.id !== 'claude-code') fail('Claude runtime definition mismatch');
  if (codex.id !== 'codex') fail('Codex runtime definition mismatch');
  if (unknown.id !== 'unknown') fail('Unknown runtime fallback mismatch');
  if (claude.capabilities.hooks.support !== 'full') fail('Claude runtime hooks capability mismatch');
  if (codex.capabilities.hooks.support === 'full') fail('Codex runtime hooks support should not be full');

  const origEnv = process.env.CITADEL_RUNTIME;
  process.env.CITADEL_RUNTIME = 'codex';
  const detected = detectRuntime('/nonexistent');
  if (detected.runtime !== 'codex' || detected.method !== 'env') {
    fail(`Runtime detection env override mismatch: ${detected.runtime}/${detected.method}`);
  }
  if (origEnv !== undefined) process.env.CITADEL_RUNTIME = origEnv;
  else delete process.env.CITADEL_RUNTIME;

  console.log('Runtime registry tests pass.');
}

main();
