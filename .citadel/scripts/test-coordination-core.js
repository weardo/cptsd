#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { getCoordinationPaths, readJson, STALE_INSTANCE_MS } = require('../core/coordination/io');
const { registerInstance, heartbeatInstance, unregisterInstance, getCoordinationStatus } = require('../core/coordination/instances');
const { claimScope, findOverlap, getClaimStatus, releaseClaim, scopesOverlap } = require('../core/coordination/claims');
const { sweepStaleInstances } = require('../core/coordination/sweep');

function withTempProject(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-coordination-'));
  try {
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

withTempProject((projectRoot) => {
  const nowMs = Date.now();
  const freshStart = new Date(nowMs - 5 * 60 * 1000).toISOString();
  const freshHeartbeat = new Date(nowMs - 60 * 1000).toISOString();
  const staleSeen = new Date(nowMs - STALE_INSTANCE_MS - 60 * 1000).toISOString();

  assert.equal(scopesOverlap(['src/app'], ['src']), true, 'parent-child scopes should overlap');
  assert.equal(scopesOverlap(['src(read-only)'], ['src']), false, 'read-only scope should not block');

  const instance = registerInstance('agent-a', { projectRoot, now: freshStart, pid: process.pid });
  assert.equal(instance.instanceId, 'agent-a');

  const afterHeartbeat = heartbeatInstance('agent-a', { projectRoot, now: freshHeartbeat });
  assert.equal(afterHeartbeat.lastSeen, freshHeartbeat);

  const claim = claimScope('agent-a', ['src/core'], 'build', 'Implement core extraction', {
    projectRoot,
    now: freshHeartbeat,
  });
  assert.equal(claim.type, 'build');
  assert(findOverlap(['src'], { projectRoot }), 'broader scope should overlap with existing claim');

  registerInstance('agent-b', { projectRoot, now: staleSeen, pid: 999999 });
  let overlapError = null;
  try {
    claimScope('agent-b', ['src'], 'review', 'Try conflicting scope', { projectRoot });
  } catch (error) {
    overlapError = error;
  }
  assert(overlapError, 'overlapping claim should throw');
  assert.equal(overlapError.code, 'SCOPE_OVERLAP');

  claimScope('agent-b', ['docs'], 'review', 'Non-conflicting scope', { projectRoot });
  const status = {
    ...getCoordinationStatus({ projectRoot }),
    ...getClaimStatus({ projectRoot }),
  };
  assert.equal(status.instances.length, 2, 'two instances should be registered');
  assert.equal(status.claims.length, 2, 'two claims should be present');

  const paths = getCoordinationPaths(projectRoot);
  const staleRecord = readJson(path.join(paths.instancesDir, 'agent-b.json'));
  staleRecord.lastSeen = staleSeen;
  fs.writeFileSync(path.join(paths.instancesDir, 'agent-b.json'), JSON.stringify(staleRecord, null, 2));

  const sweep = sweepStaleInstances({ projectRoot, nowMs });
  assert.equal(sweep.cleaned, 1, 'one stale instance should be swept');
  assert.equal(sweep.swept[0].instanceId, 'agent-b');

  const released = releaseClaim('agent-a', { projectRoot });
  assert.equal(released.instanceId, 'agent-a', 'release should return the removed claim');
  unregisterInstance('agent-a', { projectRoot });

  const finalStatus = {
    ...getCoordinationStatus({ projectRoot }),
    ...getClaimStatus({ projectRoot }),
  };
  assert.equal(finalStatus.instances.length, 0, 'all instances should be removed by the end');
  assert.equal(finalStatus.claims.length, 0, 'all claims should be removed by the end');
});

console.log('coordination core tests passed');
