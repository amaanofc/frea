// ─────────────────────────────────────────────
// frea — starring a mentor
// ─────────────────────────────────────────────
//
//   npm run test:stars          # needs the API running on :3001
//
// A star is a count of verified students who vouched for a mentor. Not a
// rating: no score, no average, no denominator. Everyone starts at zero.

const API = (process.argv[2] || 'http://localhost:3001') + '/api';

import { localOnly } from './_local-only.mjs';
localOnly(API, { suite: 'stars.e2e.mjs' });

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}${detail ? '  — ' + detail : ''}`); }
};
const group = (n) => console.log(`\n${n}`);

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* non-JSON */ }
  return { status: res.status, json };
}

/** Verified session for an arbitrary .ac.uk address. */
async function sessionFor(email) {
  await call('POST', '/auth/send-verification', { body: { email } });
  const dbRes = await fetch(`${API}/health`);        // keep the server warm
  await dbRes.text();

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { DB_FILE } = await import('../server/paths.js');
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const rec = (db.verificationTokens || []).find(t => t.email === email.toLowerCase());
  if (!rec) throw new Error(`no verification code issued for ${email}`);

  const verified = await call('POST', '/auth/verify-code', { body: { email, code: rec.code } });
  const token = verified.json?.sessionToken || verified.json?.data?.sessionToken;
  if (!token) throw new Error(`could not verify ${email}: ${JSON.stringify(verified.json).slice(0, 120)}`);
  return token;
}

console.log(`\nfrea stars → ${API}`);

const mentors = (await call('GET', '/mentors')).json.data;
if (!mentors.length) { console.log('no mentors seeded — run npm run reset:dev'); process.exit(1); }
const target = mentors[0];

group('SHAPE');
{
  ok('mentors expose a star count', typeof target.stars === 'number', `got ${typeof target.stars}`);
  ok('no rating is published any more', target.rating === undefined,
    target.rating !== undefined ? `rating still present: ${target.rating}` : '');
  ok('viewer star state is present', 'youStarred' in target);
}

group('STARRING');
const alice = await sessionFor('star.alice@ed.ac.uk');
const bob = await sessionFor('star.bob@ed.ac.uk');
{
  const before = (await call('GET', `/mentors/${target.id}`)).json.data.stars;

  const anon = await call('POST', `/mentors/${target.id}/star`);
  ok('an unverified visitor cannot star', anon.status === 401, `status ${anon.status}`);

  const first = await call('POST', `/mentors/${target.id}/star`, { token: alice });
  ok('a verified student can star', first.status === 200 && first.json.data.starred === true);
  ok('the count goes up by one', first.json.data.stars === before + 1,
    `${before} -> ${first.json.data.stars}`);

  const again = await call('POST', `/mentors/${target.id}/star`, { token: alice });
  ok('starring twice does not double-count', again.json.data.stars === before,
    `expected ${before}, got ${again.json.data.stars}`);
  ok('pressing again removes the star', again.json.data.starred === false);

  await call('POST', `/mentors/${target.id}/star`, { token: alice });
  const second = await call('POST', `/mentors/${target.id}/star`, { token: bob });
  ok('a second student adds another', second.json.data.stars === before + 2,
    `expected ${before + 2}, got ${second.json.data.stars}`);

  const listed = (await call('GET', '/mentors')).json.data.find(m => m.id === target.id);
  ok('the listing reflects the count', listed.stars === before + 2,
    `listing says ${listed.stars}`);

  const asBob = (await call('GET', `/mentors/${target.id}`, { token: bob })).json.data;
  ok('a viewer sees their own star', asBob.youStarred === true);
}

group('SELF-STARRING');
{
  const mentorEmail = 'star.mentor@ed.ac.uk';
  const mtoken = await sessionFor(mentorEmail);
  const created = await call('POST', '/mentors/apply', {
    token: mtoken,
    body: { name: 'Star Test Mentor', university: 'University of Leeds', major: 'History', year: '3rd year' }
  });
  const mid = created.json?.data?.id;
  ok('mentor created for the self-star check', Boolean(mid), JSON.stringify(created.json).slice(0, 80));

  if (mid) {
    const selfToken = created.json.sessionToken || mtoken;
    const self = await call('POST', `/mentors/${mid}/star`, { token: selfToken });
    ok('a mentor cannot star themselves', self.status === 400, `status ${self.status}`);
    ok('new mentors start at zero stars', (await call('GET', `/mentors/${mid}`)).json.data.stars === 0);
  }
}

console.log(`\n${'─'.repeat(52)}`);
console.log(`═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail ? 1 : 0);
