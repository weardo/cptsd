#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { parseCampaignContent } = require('../core/campaigns/parse-campaign');
const { findActiveCampaign, getCampaignPaths, readCampaignStats } = require('../core/campaigns/load-campaign');
const { archiveCampaign, updateCampaignStatus } = require('../core/campaigns/update-campaign');

function withTempProject(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'citadel-campaign-'));
  try {
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function makeCampaign(name, status = 'active') {
  return [
    '---',
    'version: 1',
    `status: ${status}`,
    'phase_count: 3',
    'current_phase: 1',
    '---',
    '',
    `# Campaign: ${name}`,
    '',
    `Status: ${status}`,
    '',
    '## Claimed Scope',
    '- src/',
    '- docs/guide.md',
    '',
    '## Restricted Files',
    '- .env.production',
  ].join('\n');
}

const parsed = parseCampaignContent(makeCampaign('Parser Test'));
assert.equal(parsed.frontmatter.phase_count, 3, 'frontmatter numbers should parse as numbers');
assert.equal(parsed.bodyStatus, 'active', 'body status should be parsed');
assert.deepEqual(parsed.claimedScope, ['src/', 'docs/guide.md'], 'claimed scope should parse from bullets');
assert.deepEqual(parsed.restrictedFiles, ['.env.production'], 'restricted files should parse from bullets');

withTempProject((projectRoot) => {
  const paths = getCampaignPaths(projectRoot);
  fs.mkdirSync(paths.campaignsDir, { recursive: true });
  fs.mkdirSync(paths.completedDir, { recursive: true });

  const activeFile = path.join(paths.campaignsDir, 'alpha.md');
  const completedFile = path.join(paths.completedDir, 'beta.md');
  fs.writeFileSync(activeFile, makeCampaign('Alpha', 'active'));
  fs.writeFileSync(completedFile, makeCampaign('Beta', 'completed'));

  const active = findActiveCampaign(projectRoot);
  assert(active, 'active campaign should be found');
  assert.equal(active.slug, 'alpha', 'active campaign slug should be derived from filename');

  const updated = updateCampaignStatus(activeFile, 'completed');
  assert.equal(updated.frontmatter.status, 'completed', 'frontmatter status should update');
  assert.equal(updated.bodyStatus, 'completed', 'body status should update');

  const archived = archiveCampaign(activeFile, projectRoot);
  assert.equal(archived.slug, 'alpha', 'archived campaign slug should be preserved');
  assert(fs.existsSync(path.join(paths.completedDir, 'alpha.md')), 'archived file should move into completed/');

  const stats = readCampaignStats(projectRoot);
  assert.deepEqual(stats.active, [], 'no active campaigns should remain after archive');
  assert.equal(stats.completed_count, 2, 'completed count should include archived campaign');
});

console.log('campaign core tests passed');
