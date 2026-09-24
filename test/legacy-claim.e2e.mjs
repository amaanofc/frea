import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS_DIR } from '../server/paths.js?legacy-claim-paths';
import { makePdf } from '../scripts/lib/make-files.mjs';
import { seedIdentity } from './_identity.mjs';
import { localOnly } from './_local-only.mjs';

const API = 'http://localhost:3001/api';
localOnly(API, { suite: 'legacy-claim.e2e.mjs' });
const DB = new URL('../server/data.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

let pass = 0;
let fail = 0;
const ok = (label, condition, detail = '') => {
  if (condition) { pass += 1; console.log(`   ✓ ${label}`); }
  else { fail += 1; console.log(`   ✗ ${label}${detail ? `  — ${detail}` : ''}`); }
};

async function call(method, path, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await response.json(); } catch (_) { /* non-JSON response */ }
  return { status: response.status, json };
}

const fixtureId = Date.now();
const mentorId = 900000 + (fixtureId % 100000);
const email = `legacy.claim.${fixtureId}@ed.ac.uk`;
const bookingId = `legacy-claim-booking-${fixtureId}`;
const entitlementId = `legacy-claim-entitlement-${fixtureId}`;
const resourceId = `legacy-resource-${fixtureId}`;
const versionId = `${resourceId}-v1`;
seedIdentity(email);
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
db.mentors.push({
  id: mentorId,
  name: 'Legacy Claim Mentor',
  email,
  university: 'University of Leeds',
  major: 'Computer Science',
  weeklySchedule: {},
  callsCompleted: 0
});
db.bookings.push({
  id: bookingId,
  mentorId,
  mentorName: 'Legacy Claim Mentor',
  mentorEmail: email,
  studentEmail: email,
  date: '2099-01-02',
  time: '10:00',
  status: 'confirmed',
  createdAt: new Date().toISOString()
});
db.entitlements.push({
  id: entitlementId,
  email,
  resourceId,
  versionId
});
db.resources.push({
  id: resourceId,
  mentorId,
  mentorName: 'Legacy Claim Mentor',
  mentorUniversity: 'University of Leeds',
  title: 'Legacy resource',
  subtitle: '',
  type: 'free',
  price: 0,
  downloads: 0,
  rating: 5,
  format: 'PDF',
  pages: 'Self-contained document',
  currentVersionId: versionId,
  status: 'published'
});
db.resourceVersions.push({
  id: versionId,
  resourceId,
  versionNumber: 1,
  fileName: `doc-${mentorId}-legacy.pdf`,
  format: 'PDF',
  pages: 'Self-contained document'
});
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.writeFileSync(path.join(UPLOADS_DIR, `doc-${mentorId}-legacy.pdf`), makePdf({
  title: 'Legacy resource',
  subtitle: 'A legacy fixture',
  author: 'Legacy Claim Mentor',
  university: 'University of Leeds',
  bullets: ['A valid downloadable fixture for the claim regression.']
}));
fs.writeFileSync(DB, JSON.stringify(db, null, 2));

const sent = await call('POST', '/auth/send-verification', { body: { email } });
ok('claim fixture can sign in with the legacy email', sent.status === 200);
const token = (await call('POST', '/auth/verify-code', {
  body: {
    email,
    code: JSON.parse(fs.readFileSync(DB, 'utf8')).verificationTokens.find(t => t.email === email)?.code
  }
})).json.sessionToken;

const before = await call('GET', '/auth/me', { token });
ok('unbound legacy rows are not auto-bound to a new identity', before.json.mentor === null);
const blocked = await call('GET', `/mentors/${mentorId}/bookings`, { token });
ok('an unbound legacy mentor cannot manage the profile', blocked.status === 403, JSON.stringify(blocked.json));

const request = await call('POST', '/auth/legacy-claim/request', { token, body: { email } });
ok('an authenticated identity can request an explicit legacy claim', request.status === 200);
const claim = JSON.parse(fs.readFileSync(DB, 'utf8')).legacyClaimTokens.find(t => t.email === email);
ok('the claim code is not returned by the API', !JSON.stringify(request.json).includes(claim?.code));

const verified = await call('POST', '/auth/legacy-claim/verify', {
  token,
  body: { email, code: claim?.code }
});
ok('the explicit claim binds the legacy mentor and records', verified.status === 200, JSON.stringify(verified.json));
const stored = JSON.parse(fs.readFileSync(DB, 'utf8'));
ok('the legacy mentor is now keyed to the canonical identity',
  stored.mentors.find(m => m.id === mentorId)?.authIdentifier === `e2e-${email}@test.ac.uk`);
ok('the legacy booking and entitlement are now canonical',
  stored.bookings.find(b => b.id === bookingId)?.studentAuthIdentifier === `e2e-${email}@test.ac.uk`
  && stored.entitlements.find(e => e.id === entitlementId)?.authIdentifier === `e2e-${email}@test.ac.uk`);

const claimedSession = verified.json.sessionToken;
const mentor = await call('GET', `/mentors/${mentorId}`, { token: claimedSession });
ok('the claimed mentor remains available through the public profile route', mentor.status === 200);

console.log(`\n═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail ? 1 : 0);
