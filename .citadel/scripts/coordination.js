#!/usr/bin/env node

/**
 * coordination.js — Multi-instance coordination CLI
 *
 * File-based coordination for multiple Archon/Fleet instances running simultaneously.
 * Prevents scope collisions when parallel agents edit the same files.
 *
 * Usage:
 *   node scripts/coordination.js <command> [options]
 *
 * Commands:
 *   generate-id                          Generate a unique instance ID
 *   register   --id <id>                 Register an active instance
 *   unregister --id <id>                 Remove instance registration
 *   heartbeat  --id <id>                 Update lastSeen timestamp
 *   claim      --id <id> --scope <dirs>  Claim a work scope (comma-separated dirs)
 *              --type <type> --desc <d>  Campaign type and description
 *   release    --id <id>                 Release an instance's claim
 *   check-overlap --scope <dirs>         Check if scope overlaps with active claims
 *   sweep                                Recovery sweep: release claims from dead instances
 *   status                               Show all active instances and claims
 */

'use strict';

const { generateInstanceId } = require('../core/coordination/io');
const { registerInstance, unregisterInstance, heartbeatInstance, getCoordinationStatus } = require('../core/coordination/instances');
const { claimScope, findOverlap, getClaimStatus, releaseClaim } = require('../core/coordination/claims');
const { sweepStaleInstances } = require('../core/coordination/sweep');

function generateId() {
  const id = generateInstanceId();
  console.log(id);
  return id;
}

function register(id) {
  registerInstance(id);
  console.log(`Registered instance: ${id}`);
}

function unregister(id) {
  unregisterInstance(id);
  console.log(`Unregistered instance: ${id}`);
}

function heartbeat(id) {
  try {
    heartbeatInstance(id);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

function claim(id, scope, type, desc) {
  try {
    claimScope(id, scope, type, desc);
    console.log(`Claimed scope: ${scope.join(', ')}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

function release(id) {
  const removed = releaseClaim(id);
  if (removed) {
    console.log(`Released claim for: ${id}`);
  } else {
    console.log(`No claim found for: ${id}`);
  }
}

function checkOverlap(scope) {
  const overlap = findOverlap(scope);
  if (overlap) {
    console.log(`OVERLAP with ${overlap.instanceId}: ${(overlap.scope || []).join(', ')}`);
    process.exit(1);
  }
  console.log('No overlap detected');
}

function sweep() {
  const result = sweepStaleInstances();
  for (const entry of result.swept) {
    console.log(`Swept: ${entry.instanceId} (${entry.reason})`);
  }
  console.log(`Sweep complete. Cleaned ${result.cleaned} instance(s).`);
}

function status() {
  const instances = getCoordinationStatus().instances;
  const claims = getClaimStatus().claims;

  console.log('\n=== Active Instances ===');
  if (instances.length === 0) {
    console.log('  (none)');
  } else {
    for (const instance of instances) {
      console.log(`  ${instance.instanceId} | status: ${instance.status} | since: ${instance.startedAt}`);
    }
  }

  console.log('\n=== Active Claims ===');
  if (claims.length === 0) {
    console.log('  (none)');
  } else {
    for (const claimEntry of claims) {
      console.log(`  ${claimEntry.instanceId} | scope: ${(claimEntry.scope || []).join(', ')} | type: ${claimEntry.type}`);
    }
  }
  console.log('');
}

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  args.command = argv[0];

  for (let i = 1; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--id') { args.id = val; i++; }
    else if (key === '--scope') { args.scope = val.split(',').map(part => part.trim()); i++; }
    else if (key === '--type') { args.type = val; i++; }
    else if (key === '--desc') { args.desc = val; i++; }
  }
  return args;
}

const args = parseArgs();

switch (args.command) {
  case 'generate-id': generateId(); break;
  case 'register': register(args.id); break;
  case 'unregister': unregister(args.id); break;
  case 'heartbeat': heartbeat(args.id); break;
  case 'claim': claim(args.id, args.scope || [], args.type, args.desc); break;
  case 'release': release(args.id); break;
  case 'check-overlap': checkOverlap(args.scope || []); break;
  case 'sweep': sweep(); break;
  case 'status': status(); break;
  default:
    console.log('Usage: node scripts/coordination.js <command> [options]');
    console.log('Commands: generate-id, register, unregister, heartbeat, claim, release, check-overlap, sweep, status');
    process.exit(1);
}
