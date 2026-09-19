// ─────────────────────────────────────────────
// frea — Stripe webhook payload styles
// ─────────────────────────────────────────────
//
// Stripe requires a separate destination, and therefore a separate signing
// secret, per payload style. frea subscribes to both:
//
//   snapshot  — checkout.session.*     (full object at data.object)
//   thin      — v2.core.account.*      (a reference at related_object)
//
// Reading data.object on a thin event throws, and Stripe then retries the
// delivery indefinitely. These tests pin both shapes and both secrets.
//
// Requires:  npm run server

import 'dotenv/config';
import crypto from 'crypto';

const URL = 'http://localhost:3001/api/stripe/webhook';

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}${detail ? '  — ' + detail : ''}`); }
};

function sign(payload, secret, ts = Math.floor(Date.now() / 1000)) {
  const mac = crypto.createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex');
  return `t=${ts},v1=${mac}`;
}

async function post(payload, signature) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signature },
    body: payload
  });
  return { status: res.status, body: (await res.text()).slice(0, 120) };
}

const secrets = (process.env.STRIPE_WEBHOOK_SECRET || '').split(',').map(s => s.trim()).filter(Boolean);
if (!secrets.length) {
  console.log('\nSTRIPE WEBHOOKS — skipped (no STRIPE_WEBHOOK_SECRET)\n');
  process.exit(0);
}

console.log('\nSTRIPE WEBHOOK PAYLOAD STYLES');
console.log(`   ${secrets.length} signing secret(s) configured\n`);

// ── Thin events: Accounts v2 ─────────────────────────────────────────────
{
  const thin = JSON.stringify({
    id: 'evt_thin_test',
    object: 'v2.core.event',
    type: 'v2.core.account.updated',
    created: new Date().toISOString(),
    // No data.object at all — this is the shape that used to throw.
    related_object: {
      id: 'acct_not_a_real_mentor',
      type: 'account',
      url: '/v2/core/accounts/acct_not_a_real_mentor'
    }
  });

  const r = await post(thin, sign(thin, secrets[0]));
  ok('thin v2.core.account.updated accepted', r.status === 200, `${r.status} ${r.body}`);

  for (const type of [
    'v2.core.account.created',
    'v2.core.account.closed',
    'v2.core.account[defaults].updated',
    'v2.core.account[configuration.recipient].capability_status_updated'
  ]) {
    const body = JSON.stringify({
      id: 'evt_x', object: 'v2.core.event', type,
      related_object: { id: 'acct_unknown', type: 'account' }
    });
    const res = await post(body, sign(body, secrets[0]));
    ok(`thin ${type}`, res.status === 200, `${res.status} ${res.body}`);
  }
}

// ── Snapshot events: Checkout ────────────────────────────────────────────
{
  const snapshot = JSON.stringify({
    id: 'evt_snapshot_test',
    object: 'event',
    type: 'checkout.session.completed',
    api_version: '2026-08-26.dahlia',
    data: {
      object: {
        id: 'cs_test_nonexistent',
        object: 'checkout.session',
        payment_status: 'unpaid',      // unpaid: must not grant anything
        client_reference_id: 'ord_does_not_exist',
        metadata: {}
      }
    }
  });

  const r = await post(snapshot, sign(snapshot, secrets[0]));
  ok('snapshot checkout.session.completed accepted', r.status === 200, `${r.status} ${r.body}`);
}

// ── Every configured secret must verify ──────────────────────────────────
{
  const body = JSON.stringify({
    id: 'evt_x', object: 'v2.core.event', type: 'v2.core.account.updated',
    related_object: { id: 'acct_unknown', type: 'account' }
  });

  for (let i = 0; i < secrets.length; i++) {
    const r = await post(body, sign(body, secrets[i]));
    ok(`secret #${i + 1} verifies`, r.status === 200, `${r.status} ${r.body}`);
  }
}

// ── Forgery and replay still rejected ────────────────────────────────────
{
  const body = JSON.stringify({ id: 'evt_x', type: 'v2.core.account.updated', related_object: { id: 'acct_x' } });

  ok('wrong secret rejected', (await post(body, sign(body, 'whsec_wrong_secret_entirely'))).status === 400);
  ok('missing signature rejected', (await post(body, '')).status === 400);
  ok('tampered body rejected',
    (await post(body.replace('acct_x', 'acct_y'), sign(body, secrets[0]))).status === 400);
  ok('replay outside tolerance rejected',
    (await post(body, sign(body, secrets[0], Math.floor(Date.now() / 1000) - 3600))).status === 400);
}

console.log(`\n═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail > 0 ? 1 : 0);
