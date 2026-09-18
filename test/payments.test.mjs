// ─────────────────────────────────────────────
// frea — payment split & checkout construction
// ─────────────────────────────────────────────
//
// The money rule frea commits to: the student is charged exactly the listed
// price, and frea's fee is deducted from the mentor's payout. These tests pin
// that down, including the Stripe line item, so a refactor cannot quietly start
// charging students a surcharge.
//
//   node --test test/payments.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitPrice, feeRate } from '../server/db.js';

test('fee rate defaults to 5%', () => {
  assert.equal(feeRate(), 0.05);
});

test('a £10 playbook splits £9.50 / £0.50', () => {
  const s = splitPrice(10);
  assert.equal(s.total, 10.00, 'student pays the listed price');
  assert.equal(s.freaFee, 0.50, 'frea takes 5%');
  assert.equal(s.mentorPayout, 9.50, 'mentor keeps 95%');
});

test('the fee never increases what the student pays', () => {
  for (const price of [1, 2.99, 4.99, 7.5, 10, 19.99, 42.42, 100]) {
    const s = splitPrice(price);
    assert.equal(s.total, Math.round(price * 100) / 100,
      `student should pay exactly £${price}, not £${s.total}`);
    assert.ok(s.mentorPayout < s.total, 'the fee comes out of the mentor share');
  }
});

test('the split always reconciles to the penny', () => {
  for (const price of [1, 2.99, 3.33, 4.99, 6.66, 9.99, 19.95, 33.33, 100]) {
    const s = splitPrice(price);
    const pennies = Math.round(s.freaFee * 100) + Math.round(s.mentorPayout * 100);
    assert.equal(pennies, Math.round(s.total * 100),
      `£${price}: fee ${s.freaFee} + payout ${s.mentorPayout} != total ${s.total}`);
  }
});

test('FREA_FEE_RATE is honoured, and nonsense values fall back to 5%', () => {
  const original = process.env.FREA_FEE_RATE;
  try {
    process.env.FREA_FEE_RATE = '0.10';
    assert.equal(feeRate(), 0.10);
    assert.equal(splitPrice(10).mentorPayout, 9.00);

    for (const bad of ['-1', '1.5', 'abc', '']) {
      process.env.FREA_FEE_RATE = bad;
      assert.equal(feeRate(), 0.05, `"${bad}" should fall back to 5%`);
    }
  } finally {
    if (original === undefined) delete process.env.FREA_FEE_RATE;
    else process.env.FREA_FEE_RATE = original;
  }
});

test('the Stripe line item charges the listed price, with the split in metadata', async () => {
  const payments = await import('../server/payments.js');

  // Stub the Stripe client so the REAL createCheckoutSession runs and we can
  // inspect exactly what it would send.
  let captured = null;
  const stub = {
    checkout: {
      sessions: {
        create: async (params) => {
          captured = params;
          return { id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/cs_test_123' };
        }
      }
    }
  };

  const order = {
    id: 'ord-test-1',
    resourceId: 'doc-1',
    buyerEmail: 'student@ed.ac.uk',
    mentorId: 3,
    mentorName: 'Priya Nair',
    totalAmount: 10,
    freaFee: 0.5,
    mentorPayout: 9.5
  };
  const resource = { title: 'Test Playbook', format: 'PDF', mentorUniversity: 'UCL' };

  const session = await payments.createCheckoutSession({
    order, resource, baseUrl: 'http://localhost:5173', client: stub
  });

  assert.ok(session.url.startsWith('https://checkout.stripe.com/'));
  assert.equal(captured.line_items[0].price_data.unit_amount, 1000,
    'Stripe must charge 1000 pence — the listed £10.00, with no fee added on top');
  assert.equal(captured.line_items[0].price_data.currency, 'gbp');
  assert.equal(captured.customer_email, 'student@ed.ac.uk');
  assert.equal(captured.metadata.freaFee, '0.50');
  assert.equal(captured.metadata.mentorPayout, '9.50');
  assert.equal(captured.client_reference_id, order.id,
    'the order id must travel with the session so the webhook can find it');
  assert.match(captured.success_url, /checkout-complete\?order=ord-test-1/);
  assert.match(captured.cancel_url, /status=cancelled/);
});

test('a webhook without a configured secret is refused, not trusted', async () => {
  const payments = await import('../server/payments.js');
  const original = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_SECRET_KEY = 'sk_test_stub';
  delete process.env.STRIPE_WEBHOOK_SECRET;

  assert.throws(
    () => payments.constructWebhookEvent('{}', 'sig'),
    /STRIPE_WEBHOOK_SECRET/,
    'an unsigned webhook must never be accepted'
  );

  if (original !== undefined) process.env.STRIPE_WEBHOOK_SECRET = original;
  delete process.env.STRIPE_SECRET_KEY;
});
