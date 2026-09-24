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
  getBookingsForMentor,
  updateResource,
  deleteResource,
  grantEntitlement,
  getMySpace,
  getResourceById,
  createPendingOrder,
  markOrderPaid,
  upsertStudentIdentity,
  issueLegacyClaim,
  claimLegacyOwnership,
  getLegacyClaimSummary,
  createMentorApplication
} = await import('../server/db.js?space-test');

const { UPLOADS_DIR } = await import('../server/paths.js?space-uploads');
const DB = path.join(root, 'data.json');
const TEST_UPLOADS = [
  'doc-1-systems-v1.md', 'doc-1-playbook-v1.pdf', 'doc-1-playbook-v2.pdf',
  'doc-1-free-v1.pdf', 'doc-1-legacy-owned-v1.pdf', 'doc-1-career-v1.pdf',
  'doc-1-career-v2.pdf', 'doc-1-paid-v1.pdf', 'doc-1-retained-v1.pdf',
  'doc-1-retained-v2.pdf', 'doc-1-archive-v1.pdf', 'doc-1-archive-v2.pdf'
];

function writeDb(overrides = {}) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  for (const fileName of TEST_UPLOADS) {
    const fullPath = path.join(UPLOADS_DIR, fileName);
    if (!fs.existsSync(fullPath)) fs.writeFileSync(fullPath, 'test upload');
  }
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

test('signup never binds a legacy mentor by contact email; an explicit claim does', () => {
  writeDb({
    studentIdentities: [],
    verifiedEmails: ['legacy-contact@example.com'],
    mentors: [{
      id: 1,
      name: 'Legacy Mentor',
      email: 'legacy-contact@example.com',
      university: 'University of Leeds',
      major: 'Computer Science'
    }]
  });

  upsertStudentIdentity({
    authIdentifier: 'student@test.ac.uk',
    entityId: 'https://idp.test.ac.uk',
    affiliations: ['student'],
    contactEmail: 'legacy-contact@example.com',
    institutionName: 'University of Leeds'
  });
  assert.equal(readDb().mentors[0].authIdentifier, undefined);

  const request = issueLegacyClaim({
    email: 'legacy-contact@example.com',
    authIdentifier: 'student@test.ac.uk'
  });
  const claimed = claimLegacyOwnership({
    email: 'legacy-contact@example.com',
    authIdentifier: 'student@test.ac.uk',
    code: request.code
  });
  assert.equal(claimed.mentorId, 1);
  assert.equal(readDb().mentors[0].authIdentifier, 'student@test.ac.uk');
  assert.equal(getLegacyClaimSummary('legacy-contact@example.com').total, 0);
});

test('a canonical signup cannot create a duplicate beside an unbound legacy mentor', () => {
  writeDb({
    mentors: [{
      id: 1,
      name: 'Legacy Mentor',
      email: 'student@example.com',
      university: 'University of Leeds',
      major: 'Computer Science'
    }]
  });

  assert.throws(() => createMentorApplication({
    email: 'student@example.com',
    authIdentifier: 'student@test.ac.uk',
    name: 'New Name'
  }), /claim|older mentor/i);
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

test('migration normalizes legacy booking dates and times before slot comparisons', () => {
  writeDb({
    bookings: [{
      id: 'legacy-display-booking',
      mentorId: 1,
      studentEmail: 'student@example.com',
      date: 'Wed 2 Sep',
      time: '2:00 PM',
      createdAt: '2027-01-01T00:00:00.000Z'
    }]
  });

  const result = getBookingsForMentor(1);
  const booking = result.upcoming[0];
  assert.equal(booking.date, '2027-09-02');
  assert.equal(booking.time, '14:00');
  assert.equal(booking.status, 'confirmed');
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
      { id: 'old-1', authIdentifier: 'student@test.ac.uk', email: 'student@example.com', resourceId: 'product-1', grantedAt: '2024-01-01' },
      { id: 'old-2', authIdentifier: 'student@test.ac.uk', email: 'student@example.com', resourceId: 'product-1', grantedAt: '2024-02-01' }
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
  assert.equal(migrated.sessions.some(s => s.token === 'legacy-known'), false);
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

test('resource publication rejects a fabricated or missing upload handle', () => {
  writeDb();
  assert.throws(() => createResource({
    title: 'Missing file',
    type: 'free',
    fileName: 'doc-1-does-not-exist.pdf',
    format: 'PDF'
  }, 1), /upload|missing|uploaded/i);
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

test('canonical identity reads an email-keyed legacy booking only after an explicit claim', () => {
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
  assert.equal(sessions.upcoming.length, 0, 'canonical sessions must not inherit an unbound legacy row');

  const claim = issueLegacyClaim({ email: 'student@example.com', authIdentifier: 'student@test.ac.uk' });
  claimLegacyOwnership({
    email: 'student@example.com',
    authIdentifier: 'student@test.ac.uk',
    code: claim.code
  });
  const claimedSessions = getBookingsForStudent({
    authIdentifier: 'student@test.ac.uk',
    email: 'student@example.com'
  });
  assert.equal(claimedSessions.upcoming[0].id, 'legacy-booking');
});

test('unbound legacy entitlements fail closed until explicitly claimed', () => {
  writeDb();
  const product = createResource({
    title: 'Legacy-owned guide',
    type: 'free',
    fileName: 'doc-1-legacy-owned-v1.pdf',
    format: 'PDF'
  }, 1);
  const db = readDb();
  db.entitlements.push({
    id: 'legacy-unbound',
    email: 'student@example.com',
    resourceId: product.id,
    versionId: product.currentVersionId
  });
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));

  const before = getMySpace({ authIdentifier: 'student@test.ac.uk', email: 'student@example.com' });
  assert.equal(before.products.length, 0);
  assert.throws(() => grantEntitlement({
    authIdentifier: 'student@test.ac.uk',
    email: 'student@example.com',
    resourceId: product.id,
    reason: 'free'
  }), /claim/i);

  const claim = issueLegacyClaim({ email: 'student@example.com', authIdentifier: 'student@test.ac.uk' });
  claimLegacyOwnership({
    email: 'student@example.com',
    authIdentifier: 'student@test.ac.uk',
    code: claim.code
  });
  const after = getMySpace({ authIdentifier: 'student@test.ac.uk', email: 'student@example.com' });
  assert.equal(after.products[0].resourceId, product.id);
});

test('mentor booking views omit internal identity and cancellation secrets', () => {
  writeDb({
    bookings: [{
      id: 'mentor-view-booking',
      mentorId: 1,
      studentEmail: 'student@example.com',
      studentAuthIdentifier: 'student@test.ac.uk',
      cancelToken: 'private-cancel-token',
      date: '2099-01-02',
      time: '10:00',
      status: 'confirmed'
    }]
  });

  const booking = getBookingsForMentor(1).upcoming[0];
  assert.equal(booking.id, 'mentor-view-booking');
  assert.equal(booking.studentAuthIdentifier, undefined);
  assert.equal(booking.cancelToken, undefined);
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
