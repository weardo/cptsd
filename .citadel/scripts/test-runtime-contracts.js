#!/usr/bin/env node

'use strict';

const path = require('path');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function main() {
  const contracts = require(path.join(__dirname, '..', 'core', 'contracts'));
  const runtimeModule = contracts.runtime;

  if (!contracts.events || !contracts.capabilities || !contracts.projectSpec) {
    fail('core/contracts index is missing required contract exports');
  }

  if (!Array.isArray(runtimeModule.RUNTIME_IDS) || runtimeModule.RUNTIME_IDS.length === 0) {
    fail('runtime contract must export a non-empty RUNTIME_IDS array');
  }

  const skeleton = runtimeModule.createRuntimeContractSkeleton('codex');
  const errors = runtimeModule.validateRuntimeContract(skeleton);
  if (errors.length > 0) {
    fail(`runtime contract skeleton is invalid: ${errors.join('; ')}`);
  }

  if (!contracts.events.isKnownCitadelEvent('session_start')) {
    fail('session_start must be recognized as a canonical Citadel event');
  }

  if (!contracts.capabilities.isSupportLevel('full')) {
    fail('full must be recognized as a valid support level');
  }

  console.log('Runtime contract tests pass.');
}

main();
