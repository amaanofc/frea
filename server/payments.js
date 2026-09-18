// ─────────────────────────────────────────────
// frea — Stripe Checkout
// ─────────────────────────────────────────────
//
// Deliberately the simplest thing that is actually correct:
//
//   1. create a pending order        (our record)
//   2. create a Stripe Checkout Session and send the student to it
//   3. Stripe's webhook tells us it was paid  -> mark paid, grant access, email
//
// Access is never granted from the browser's return trip, only from the webhook
// or a direct server-side session lookup. A student cannot unlock a playbook by
// editing a URL or replaying a redirect.
//
// frea's cut is taken out of the mentor's payout, not added to the student's
// price: the student is charged exactly the listed price.

import Stripe from 'stripe';

let client = null;

// Pinned deliberately: an unpinned version means Stripe can change behaviour
// under a running deployment.
const STRIPE_API_VERSION = '2026-08-26.dahlia';

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!stripeConfigured()) {
    throw new Error('Card payments are not configured on this server yet.');
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
  }
  return client;
}

/**
 * Builds the Checkout Session for one pending order.
 *
 * @param {object} [client] Stripe client override; tests inject a stub so the
 *                          real parameter construction is what gets asserted.
 * @returns {Promise<{id: string, url: string}>}
 */
export async function createCheckoutSession({ order, resource, baseUrl, client, destinationAccount }) {
  const stripe = client || getStripe();

  // Destination charge: frea is merchant of record, Stripe moves the mentor's
  // share to their connected account and keeps frea's fee behind as the
  // application fee. Without a connected account we cannot pay the mentor, so
  // the caller refuses the sale rather than taking money we cannot forward.
  const paymentIntentData = destinationAccount ? {
    application_fee_amount: Math.round(order.freaFee * 100),
    transfer_data: { destination: destinationAccount },
    metadata: { orderId: order.id, mentorId: String(order.mentorId) }
  } : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: order.buyerEmail,
    client_reference_id: order.id,
    ...(paymentIntentData ? { payment_intent_data: paymentIntentData } : {}),
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'gbp',
        // Charge exactly the listed price. frea's fee is settled against the
        // mentor's payout downstream, so the student never sees a surcharge.
        unit_amount: Math.round(order.totalAmount * 100),
        product_data: {
          name: resource.title,
          description: `${resource.format} · by ${order.mentorName} (${resource.mentorUniversity || 'UK university'})`,
        },
      },
    }],
    metadata: {
      orderId: order.id,
      resourceId: order.resourceId,
      mentorId: String(order.mentorId),
      mentorPayout: order.mentorPayout.toFixed(2),
      freaFee: order.freaFee.toFixed(2),
    },
    success_url: `${baseUrl}/checkout-complete?order=${order.id}&status=success`,
    cancel_url: `${baseUrl}/checkout-complete?order=${order.id}&status=cancelled`,
  });

  return { id: session.id, url: session.url };
}

/** Verifies the webhook signature and returns the parsed event. */
export function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set — refusing to trust this webhook.');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

/**
 * Server-side confirmation for the browser's return trip. We ask Stripe
 * directly rather than believing the query string.
 */
export async function isSessionPaid(stripeSessionId) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
  return {
    paid: session.payment_status === 'paid',
    orderId: session.metadata?.orderId || session.client_reference_id || null,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
  };
}

// ─── Connect: paying mentors for real ───────────────────
//
// Accounts v2. Stripe deprecated the v1 `type: 'express'` archetype and the
// API now refuses it for new integrations, so accounts are configured along
// three independent dimensions instead.
//
// frea is a marketplace: students buy from frea, and frea pays the mentor.
// That maps to dashboard `express` (mentors get a lightweight earnings view),
// with the platform owning both fees and losses — which Express also requires.
//
// Money moves by destination charge: the student is charged the listed price
// on frea's account, Stripe routes the mentor's share to their connected
// account, and frea's 5% arrives as an application fee. The split happens at
// Stripe rather than in a ledger we maintain by hand.

/**
 * Creates a connected account for a mentor.
 *
 * Note `configuration.recipient` rather than `merchant`: mentors only ever
 * receive transfers, they never act as merchant of record. Requesting merchant
 * capabilities would put them through a much longer onboarding for nothing.
 */
export async function createConnectAccount({ email, displayName, country = 'gb' }) {
  const stripe = getStripe();
  const account = await stripe.v2.core.accounts.create({
    contact_email: email,
    display_name: displayName || email,
    dashboard: 'express',
    identity: {
      country: String(country).toLowerCase(),
      entity_type: 'individual'
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: { stripe_transfers: { requested: true } }
        }
      }
    },
    defaults: {
      currency: 'gbp',
      // Express dashboard requires the platform to own both.
      responsibilities: {
        fees_collector: 'application',
        losses_collector: 'application'
      }
    },
    metadata: { platform: 'frea' }
  });
  return account.id;
}

/**
 * A single-use Stripe-hosted onboarding link. Hosted rather than custom, so
 * bank details and identity documents never touch frea's servers.
 * These expire quickly, so mint a fresh one each time instead of storing it.
 */
export async function createAccountLink({ accountId, baseUrl }) {
  const stripe = getStripe();
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['recipient'],
        refresh_url: `${baseUrl}/mentor-dashboard?payouts=refresh`,
        return_url: `${baseUrl}/mentor-dashboard?payouts=done`
      }
    }
  });
  return link.url;
}

/** Whether this account can actually be paid out yet. */
export async function getAccountStatus(accountId) {
  const stripe = getStripe();
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ['configuration.recipient', 'requirements']
  });

  const transfers = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  const status = transfers?.status || 'unrequested';

  // `active` is the only state in which money can actually reach them.
  const payoutsEnabled = status === 'active';

  const outstanding = (account.requirements?.entries || [])
    .filter(e => e.awaiting_requirement || (e.impact && !e.impact.restrictions_resolved))
    .map(e => e.description || e.requirement)
    .filter(Boolean);

  return {
    accountId: account.id,
    payoutsEnabled,
    chargesEnabled: payoutsEnabled,
    transfersStatus: status,
    detailsSubmitted: status !== 'unrequested',
    currentlyDue: outstanding.slice(0, 6)
  };
}

