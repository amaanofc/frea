import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frea-seed-'));
process.env.DATA_DIR = root;
const DB = path.join(root, 'data.json');
const { seedDemoResources } = await import(`../scripts/seed-resources.mjs?seed-test=${Date.now()}`);

test('first-boot demo seeding writes canonical immutable product versions', async () => {
  fs.writeFileSync(DB, JSON.stringify({
    mentors: [
      { id: 1, name: 'One', email: 'one@example.com', university: 'U1', major: 'M1' },
      { id: 2, name: 'Two', email: 'two@example.com', university: 'U2', major: 'M2' },
      { id: 4, name: 'Four', email: 'four@example.com', university: 'U4', major: 'M4' },
      { id: 8, name: 'Eight', email: 'eight@example.com', university: 'U8', major: 'M8' }
    ],
    resources: [],
    resourceVersions: [],
    entitlements: [],
    stats: {}
  }, null, 2));

  await seedDemoResources({ quiet: true });
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));

  assert.equal(db.resources.length, 4);
  assert.equal(db.resourceVersions.length, 4);
  assert.ok(db.mentors.every(mentor => mentor.docs === undefined));
  assert.ok(db.resources.every(resource => resource.fileName === undefined));
  assert.ok(db.resources.every(resource =>
    db.resourceVersions.some(version =>
      version.id === resource.currentVersionId
      && version.resourceId === resource.id
      && version.versionNumber === 1
      && typeof version.fileName === 'string'
      && version.fileName.length > 0
    )
  ));
});

process.on('exit', () => {
  try { fs.rmSync(root, { recursive: true, force: true }); } catch (_) { /* best effort */ }
});
