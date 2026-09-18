// ─────────────────────────────────────────────
// frea — Stripe Connect payouts, against the live test API
// ─────────────────────────────────────────────
//
// Hits Stripe's real test environment: creates a connected account, drives
// onboarding, and confirms the money rules. Skips cleanly when no test key is
// configured, so it never blocks a free-only deployment.
//
// Requires:  npm run server   (with STRIPE_SECRET_KEY set to an sk_test_ key)

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:3001/api';
const DB = path.join(__dirname, '..', 'server', 'data.json');

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}  ${detail}`); }
};

const readDb = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const codeFor = (e) => readDb().verificationTokens.find(t => t.email === e.toLowerCase())?.code || null;

async function call(method, p, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

async function verify(email) {
  await call('POST', '/auth/send-verification', { body: { email } });
  const r = await call('POST', '/auth/verify-code', { body: { email, code: codeFor(email) } });
  return r.json.sessionToken;
}

const key = process.env.STRIPE_SECRET_KEY || '';
if (!key) {
  console.log('\nSTRIPE CONNECT — skipped (no STRIPE_SECRET_KEY configured)\n');
  process.exit(0);
}
if (!key.startsWith('sk_test_')) {
  console.error('\nRefusing to run: STRIPE_SECRET_KEY is not a test key. Never run this against live.\n');
  process.exit(1);
}

console.log('\nSTRIPE CONNECT (Stripe test mode)');

const stamp = Date.now();
const email = `connect.mentor.${stamp}@ed.ac.uk`;
const studentToken = await verify(email);

const applied = await call('POST', '/mentors/apply', {
  token: studentToken,
  body: { name: 'Connect Test Mentor', university: 'University of Exeter', major: 'BSc Economics', year: '3rd year' }
});
const token = applied.json.sessionToken;
const mentorId = applied.json.mentor.id;
ok('mentor created', applied.status === 201);

// ── A brand-new mentor cannot sell yet ───────────────────────────────────
{
  const status = await call('GET', '/connect/status', { token });
  ok('payments are configured on this server', status.json.data.configured === true);
  ok('new mentor has not started onboarding', status.json.data.started === false);
  ok('new mentor cannot receive payouts', status.json.data.payoutsEnabled === false);

  const form = new FormData();
  form.append('document', new Blob(['# Connect test doc'], { type: 'text/markdown' }), 'connect.md');
  const up = await (await fetch(`${API}/upload/document`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  })).json();
  globalThis.FILE = up.fileName;

  const paid = await call('POST', '/resources', {
    token,
    body: { title: 'Connect Paid Test', type: 'paid', price: 10, fileName: up.fileName, format: up.format }
  });
  ok('pricing is blocked before payout setup', paid.status === 409 && paid.json.payoutsRequired === true,
    JSON.stringify(paid.json).slice(0, 140));

  const free = await call('POST', '/resources', {
    token,
    body: { title: 'Connect Free Test', type: 'free', fileName: up.fileName, format: up.format }
  });
  ok('free publishing still works immediately', free.status === 201);
  globalThis.FREE_ID = free.json.data.id;
}

// ── Onboarding ───────────────────────────────────────────────────────────
{
  const onboard = await call('POST', '/connect/onboard', { token });
  ok('onboarding link created', onboard.json.success === true, JSON.stringify(onboard.json).slice(0, 160));

  const url = onboard.json.data?.url || '';
  ok('link points at Stripe-hosted onboarding', url.startsWith('https://connect.stripe.com/'),
    url.slice(0, 60));

  const mentor = readDb().mentors.find(m => m.id === mentorId);
  ok('connected account id stored', String(mentor.stripeAccountId || '').startsWith('acct_'),
    mentor.stripeAccountId);
  ok('payouts still disabled until Stripe verifies', mentor.payoutsEnabled === false);

  // A second call must reuse the account rather than minting another.
  const again = await call('POST', '/connect/onboard', { token });
  const mentorAfter = readDb().mentors.find(m => m.id === mentorId);
  ok('repeat onboarding reuses the same account',
    mentorAfter.stripeAccountId === mentor.stripeAccountId, mentorAfter.stripeAccountId);
  ok('a fresh link is minted each time', again.json.data.url !== url);

  globalThis.ACCOUNT_ID = mentor.stripeAccountId;
}

// ── Status reflects Stripe ───────────────────────────────────────────────
{
  const status = await call('GET', '/connect/status', { token });
  ok('status reports onboarding started', status.json.data.started === true);
  ok('status lists what Stripe still needs',
    Array.isArray(status.json.data.currentlyDue) && status.json.data.currentlyDue.length > 0,
    JSON.stringify(status.json.data.currentlyDue));
}

// ── Buying refused while the mentor cannot be paid ───────────────────────
{
  // Force a paid resource into the catalogue directly, bypassing the publish
  // gate, to prove checkout independently refuses rather than relying on it.
  const db = readDb();
  const res = db.resources.find(r => r.id === globalThis.FREE_ID);
  res.type = 'paid';
  res.price = 10;
  db.mentors.forEach(m => (m.docs || []).forEach(d => {
    if (d.id === globalThis.FREE_ID) { d.type = 'paid'; d.price = 10; }
  }));
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));

  const buyer = await verify(`connect.buyer.${stamp}@ed.ac.uk`);
  const checkout = await call('POST', '/checkout', {
    token: buyer, body: { resourceId: globalThis.FREE_ID }
  });
  ok('checkout refuses when the mentor cannot be paid',
    checkout.status === 409 && checkout.json.payoutsPending === true,
    JSON.stringify(checkout.json).slice(0, 160));
}

// ── The money rules ──────────────────────────────────────────────────────
{
  const { splitPrice } = await import('../server/db.js');
  const s = splitPrice(10);
  ok('£10 → student pays £10.00', s.total === 10);
  ok('£10 → mentor receives £9.50', s.mentorPayout === 9.5);
  ok('£10 → frea application fee £0.50', s.freaFee === 0.5);

  // The fee must be sent to Stripe in pence, as an application fee on a
  // destination charge — this is what actually splits the money.
  const payments = await import('../server/payments.js');
  let captured = null;
  const stub = {
    checkout: { sessions: { create: async (p) => { captured = p; return { id: 'cs_x', url: 'https://checkout.stripe.com/x' }; } } }
  };
  await payments.createCheckoutSession({
    order: { id: 'o1', resourceId: 'r1', buyerEmail: 'b@ed.ac.uk', mentorId: 1, mentorName: 'M',
             totalAmount: 10, freaFee: 0.5, mentorPayout: 9.5 },
    resource: { title: 'T', format: 'PDF', mentorUniversity: 'U' },
    baseUrl: 'http://localhost:5173',
    client: stub,
    destinationAccount: 'acct_test_destination'
  });

  ok('charge is for the listed price, in pence',
    captured.line_items[0].price_data.unit_amount === 1000,
    String(captured.line_items[0].price_data.unit_amount));
  ok('application fee is frea\'s 5%, in pence',
    captured.payment_intent_data.application_fee_amount === 50,
    String(captured.payment_intent_data.application_fee_amount));
  ok('funds are routed to the mentor\'s connected account',
    captured.payment_intent_data.transfer_data.destination === 'acct_test_destination',
    JSON.stringify(captured.payment_intent_data.transfer_data));
  ok('student is never charged the fee on top',
    captured.line_items[0].price_data.unit_amount
      === captured.payment_intent_data.application_fee_amount + 950);
}

console.log(`\n═══ ${pass} passed, ${fail} failed ═══`);
console.log(`(test-mode connected account ${globalThis.ACCOUNT_ID} left in your Stripe test dashboard)\n`);
process.exit(fail > 0 ? 1 : 0);
