#!/usr/bin/env node

'use strict';

const path = require('path');
const { detectRuntime } = require(path.join(__dirname, '..', 'core', 'runtime', 'detect-runtime'));

if (require.main === module) {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const projectRoot = args.find((arg) => !arg.startsWith('--'));
  const result = detectRuntime(projectRoot);

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.runtime);
  }
}

module.exports = { detectRuntime };
