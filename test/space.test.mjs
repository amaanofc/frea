import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frea-space-'));
process.env.DATA_DIR = root;

const {
  createResource,
  createResourceVersion,
  getAllResources,
  getReferencedUploadNames,
  getBookingsForStudent,
  updateResource,
  deleteResource,
  grantEntitlement,
  getMySpace,
  getResourceById,
  createPendingOrder,
  markOrderPaid
} = await import('../server/db.js?space-test');

const DB = path.join(root, 'data.json');

function writeDb(overrides = {}) {
  fs.writeFileSync(DB, JSON.stringify({
    mentors: [{
      id: 1,
      name: 'Aanya Sharma',
      email: 'mentor@example.com',
      authIdentifier: 'mentor@test.ac.uk',
      university: 'Imperial College London',
      major: 'Computer Science',
      weeklySchedule: {}
    }],
    bookings: [],
    resources: [],
    resourceVersions: [],
    orders: [],
    entitlements: [],
    sessions: [],
    studentIdentities: [{
      authIdentifier: 'student@test.ac.uk',
      entityId: 'https://idp.test.ac.uk',
      affiliations: ['student'],
      contactEmail: 'student@example.com',
      institutionName: 'University of Leeds'
    }],
    verifiedEmails: ['student@example.com'],
    stats: { totalBookings: 0 }
  , ...overrides }, null, 2));
}

function readDb() {
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}

test('migration binds a legacy mentor profile to its resolved Studid identity', () => {
  writeDb({
    mentors: [{
      id: 1,
      name: 'Legacy Mentor',
      email: 'student@example.com',
      university: 'University of Leeds',
      major: 'Computer Science'
    }]
  });

  getAllResources();
  assert.equal(readDb().mentors[0].authIdentifier, 'student@test.ac.uk');
});

test('migration promotes legacy mentor docs into canonical products once', () => {
  writeDb({
    resources: [],
    resourceVersions: [],
    mentors: [{
      id: 1,
      name: 'Aanya Sharma',
      email: 'mentor@example.com',
      university: 'Imperial College London',
      major: 'Computer Science',
      docs: [{
        id: 'legacy-doc',
        title: 'Legacy guide',
        type: 'free',
        price: 0,
        fileName: 'doc-1-legacy.md',
        format: 'Markdown'
      }]
    }]
  });

  const resources = getAllResources();
  const migrated = readDb();
  assert.equal(resources.length, 1);
  assert.equal(resources[0].id, 'legacy-doc');
  assert.equal(resources[0].versionNumber, 1);
  assert.equal(migrated.resourceVersions.length, 1);
  assert.equal(migrated.mentors[0].docs, undefined);
});

test('migration collapses duplicate email-keyed entitlements without losing version ownership', () => {
  writeDb({
    resources: [{
      id: 'product-1',
      mentorId: 1,
      mentorName: 'Aanya Sharma',
      mentorUniversity: 'Imperial College London',
      title: 'Product',
      type: 'paid',
      price: 4,
      fileName: 'doc-1-product-v1.pdf',
      format: 'PDF'
    }],
    entitlements: [
      { id: 'old-1', email: 'student@example.com', resourceId: 'product-1', grantedAt: '2024-01-01' },
      { id: 'old-2', email: 'student@example.com', resourceId: 'product-1', grantedAt: '2024-02-01' }
    ]
  });

  getAllResources();
  const migrated = readDb();
  assert.equal(migrated.entitlements.length, 1);
  assert.equal(migrated.entitlements[0].authIdentifier, 'student@test.ac.uk');
  assert.equal(migrated.entitlements[0].versionId, 'product-1-v1');
});

test('migration restores ownership from a paid order when an entitlement is missing', () => {
  writeDb({
    resources: [{
      id: 'paid-product',
      mentorId: 1,
      mentorName: 'Aanya Sharma',
      mentorUniversity: 'Imperial College London',
      title: 'Paid product',
      type: 'paid',
      price: 4,
      fileName: 'doc-1-paid-product-v1.pdf',
      format: 'PDF'
    }],
    orders: [{
      id: 'paid-order',
      resourceId: 'paid-product',
      buyerEmail: 'student@example.com',
      buyerAuthIdentifier: 'student@test.ac.uk',
      status: 'paid',
      createdAt: '2024-01-01T00:00:00.000Z',
      paidAt: '2024-01-01T00:01:00.000Z'
    }],
    entitlements: []
  });

  getAllResources();
  const migrated = readDb();
  assert.equal(migrated.entitlements.length, 1);
  assert.equal(migrated.entitlements[0].orderId, 'paid-order');
  assert.equal(migrated.entitlements[0].authIdentifier, 'student@test.ac.uk');
});

test('migration backfills or retires legacy email-only sessions', () => {
  writeDb({
    sessions: [
      { token: 'legacy-known', email: 'student@example.com', expiresAt: Date.now() + 100000 },
      { token: 'legacy-unknown', email: 'unknown@example.com', expiresAt: Date.now() + 100000 },
      { token: 'admin', email: 'admin@example.com', isAdmin: true, expiresAt: Date.now() + 100000 }
    ]
  });

  getAllResources();
  const migrated = readDb();
  const known = migrated.sessions.find(s => s.token === 'legacy-known');
  assert.equal(known?.authIdentifier, 'student@test.ac.uk');
  assert.equal(migrated.sessions.some(s => s.token === 'legacy-unknown'), false);
  assert.equal(migrated.sessions.some(s => s.token === 'admin'), true);
});

test('creating a product creates an immutable version one record', () => {
  writeDb();
  const resource = createResource({
    title: 'Systems notes',
    type: 'free',
    fileName: 'doc-1-systems-v1.md',
    format: 'Markdown'
  }, 1);
  const db = readDb();
  const version = db.resourceVersions.find(v => v.id === resource.currentVersionId);

  assert.equal(resource.type, 'free');
  assert.equal(resource.currentVersionId, version.id);
  assert.equal(version.versionNumber, 1);
  assert.equal(version.fileName, 'doc-1-systems-v1.md');
  assert.equal(db.mentors[0].docs, undefined, 'product metadata is not mirrored onto mentors');
});

test('a product type cannot be changed and a new version is appended', () => {
  writeDb();
  const product = createResource({
    title: 'Paid playbook',
    type: 'paid',
    price: 5,
    fileName: 'doc-1-playbook-v1.pdf',
    format: 'PDF'
  }, 1);

  assert.throws(
    () => updateResource(product.id, { type: 'free' }),
    /cannot change|change between/i
  );

  const v2 = createResourceVersion({
    resourceId: product.id,
    fileName: 'doc-1-playbook-v2.pdf',
    format: 'PDF'
  });
  const stored = readDb();
  const versions = stored.resourceVersions.filter(v => v.resourceId === product.id);

  assert.equal(versions.length, 2);
  assert.deepEqual(versions.map(v => v.versionNumber), [1, 2]);
  assert.equal(v2.versionNumber, 2);
  assert.equal(getResourceById(product.id).currentVersionId, v2.id);
  assert.equal(stored.resources[0].type, 'paid');
});

test('an entitlement is keyed by authIdentifier and is idempotent', () => {
  writeDb();
  const product = createResource({
    title: 'Free guide',
    type: 'free',
    fileName: 'doc-1-free-v1.pdf',
    format: 'PDF'
  }, 1);

  grantEntitlement({
    authIdentifier: 'student@test.ac.uk',
    email: 'student@example.com',
    resourceId: product.id,
    versionId: product.currentVersionId,
    reason: 'free'
  });
  grantEntitlement({
    authIdentifier: 'student@test.ac.uk',
    email: 'student@example.com',
    resourceId: product.id,
    versionId: product.currentVersionId,
    reason: 'free'
  });

  const entitlements = readDb().entitlements;
  assert.equal(entitlements.length, 1);
  assert.equal(entitlements[0].authIdentifier, 'student@test.ac.uk');
  assert.equal(entitlements[0].versionId, product.currentVersionId);
});

test('canonical identity can read an email-keyed legacy booking', () => {
  writeDb({
    bookings: [{
      id: 'legacy-booking',
      mentorId: 1,
      studentEmail: 'student@example.com',
      date: '2099-01-02',
      time: '10:00',
      status: 'confirmed'
    }]
  });

  const sessions = getBookingsForStudent({
    authIdentifier: 'student@test.ac.uk',
    email: 'student@example.com'
  });
  assert.equal(sessions.upcoming[0].id, 'legacy-booking');
});

test('My Space joins sessions and canonical product versions without copying product data', () => {
  writeDb();
  const product = createResource({
    title: 'Career guide',
    type: 'paid',
    price: 8,
    fileName: 'doc-1-career-v1.pdf',
    format: 'PDF'
  }, 1);
  const v2 = createResourceVersion({
    resourceId: product.id,
    fileName: 'doc-1-career-v2.pdf',
    format: 'PDF'
  });
  grantEntitlement({
    authIdentifier: 'student@test.ac.uk',
    email: 'student@example.com',
    resourceId: product.id,
    versionId: product.currentVersionId,
    reason: 'purchase'
  });
  const db = readDb();
  db.bookings.push({
    id: 'frea-bk-space',
    mentorId: 1,
    studentAuthIdentifier: 'student@test.ac.uk',
    studentEmail: 'student@example.com',
    date: '2099-01-02',
    time: '10:00',
    status: 'confirmed'
  });
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));

  const space = getMySpace({
    authIdentifier: 'student@test.ac.uk',
    email: 'student@example.com'
  });
  const item = space.products.find(p => p.resourceId === product.id);

  assert.equal(space.sessions.upcoming[0].id, 'frea-bk-space');
  assert.equal(item.title, 'Career guide');
  assert.equal(item.acquiredVersion.versionNumber, 1);
  assert.equal(item.currentVersion.id, v2.id);
  assert.deepEqual(item.versions.map(v => v.versionNumber), [1, 2]);
  assert.equal(Object.prototype.hasOwnProperty.call(item, 'fileName'), false);
});

test('a paid order records the Studid identity and grants the purchased version', () => {
  writeDb();
  const product = createResource({
    title: 'Paid notes',
    type: 'paid',
    price: 4,
    fileName: 'doc-1-paid-v1.pdf',
    format: 'PDF'
  }, 1);
  const order = createPendingOrder({
    resourceId: product.id,
    buyerEmail: 'student@example.com',
    buyerAuthIdentifier: 'student@test.ac.uk'
  });
  markOrderPaid(order.id);

  const stored = readDb();
  assert.equal(stored.orders[0].buyerAuthIdentifier, 'student@test.ac.uk');
  assert.equal(stored.orders[0].purchasedVersionId, product.currentVersionId);
  assert.equal(stored.entitlements[0].authIdentifier, 'student@test.ac.uk');
  assert.equal(stored.entitlements[0].versionId, product.currentVersionId);

  // Simulate a crash between the paid-order write and the entitlement write;
  // the idempotent retry must repair access rather than return early.
  const withoutAccess = readDb();
  withoutAccess.entitlements = [];
  fs.writeFileSync(DB, JSON.stringify(withoutAccess, null, 2));
  markOrderPaid(order.id);
  assert.equal(readDb().entitlements.length, 1);
});

test('the orphan sweep reference set includes archived historical versions', () => {
  writeDb();
  const product = createResource({
    title: 'Retained versions',
    type: 'free',
    fileName: 'doc-1-retained-v1.pdf',
    format: 'PDF'
  }, 1);
  createResourceVersion({
    resourceId: product.id,
    fileName: 'doc-1-retained-v2.pdf',
    format: 'PDF'
  });
  deleteResource(product.id);

  const referenced = getReferencedUploadNames();
  assert.ok(referenced.includes('doc-1-retained-v1.pdf'));
  assert.ok(referenced.includes('doc-1-retained-v2.pdf'));
});

test('deleting a product archives it while preserving its versions', () => {
  writeDb();
  const product = createResource({
    title: 'Archived guide',
    type: 'free',
    fileName: 'doc-1-archive-v1.pdf',
    format: 'PDF'
  }, 1);
  deleteResource(product.id);
  createResourceVersion({
    resourceId: product.id,
    fileName: 'doc-1-archive-v2.pdf',
    format: 'PDF'
  });

  const stored = readDb();
  assert.equal(stored.resources[0].status, 'archived');
  assert.equal(stored.resourceVersions.length, 2);
  assert.equal(getAllResources().some(r => r.id === product.id), false,
    'adding a version must not silently restore an archived product');
});

process.on('exit', () => {
  try { fs.rmSync(root, { recursive: true, force: true }); } catch (_) { /* best effort */ }
});
