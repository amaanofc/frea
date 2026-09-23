// ─────────────────────────────────────────────
// frea — Student verification via university SSO (Studid)
// ─────────────────────────────────────────────
//
// This replaces the emailed six-digit code as the way a student proves they
// belong to a UK university.
//
// The code never worked well. Roughly four in five .ac.uk addresses are
// filtered by Microsoft or a security gateway in front of it; Manchester's
// Proofpoint accepted our mail, reported it delivered, and put it in no
// inbox, no junk folder and no quarantine the student could reach. Nothing in
// our control fixed that: the domain is on no blocklist, the sending IPs are
// clean, SPF/DKIM/DMARC all pass, and the same message arrives fine at a
// personal address. The receiving institution simply decided not to deliver
// it, and only its IT department can change that.
//
// Studid brokers the UK Access Management Federation (and 70+ others, via
// eduGAIN). The student authenticates on their own university's login page —
// their password goes to the university, never to us or to Studid — and the
// university's identity provider asserts who they are.
//
// That is a STRONGER claim than the code ever made. A six-digit code proved
// somebody could read one inbox. This is Manchester's own IdP asserting, over
// a federation it is a member of, that this person is a current student.
//
// The university address is no longer collected at all. It was only ever a
// proxy for "is a student", and it is now a worse one than what we have. The
// email we ask for afterwards is a contact address — any provider — used for
// calendar invites and confirmations, which is also why it finally arrives:
// there is no Proofpoint in front of a personal mailbox.
//
// One caveat worth remembering: Studid is operated by one person in Germany,
// free, with no SLA. If it is unavailable nobody can verify. Mentor and admin
// sign-in deliberately still run on their own email codes, so an outage
// cannot lock the platform's operators out of it.

import crypto from 'crypto';
import { saveStudidState, consumeStudidState } from './db.js';

const API = 'https://api.studid.io/v2/auth/verification';
const STATE_TTL_MS = 30 * 60 * 1000;

function publicBase() {
  return (process.env.PUBLIC_BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');
}

/**
 * Starts a verification and returns where to send the student.
 *
 * `secretToken` is minted by us, handed to Studid on creation, and presented
 * as the bearer when reading the result back. It is the only thing protecting
 * that result, so it is per-verification and never leaves the server.
 */
export async function startVerification() {
  const state = crypto.randomBytes(24).toString('hex');
  const secretToken = crypto.randomBytes(32).toString('hex');

  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secretToken,
      redirectUrl: `${publicBase()}/api/auth/studid/callback?state=${state}`,
      serviceName: 'frea'
    }),
    signal: AbortSignal.timeout(15_000)
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.id || !body.link) {
    console.error('[studid] create failed:', res.status, JSON.stringify(body).slice(0, 200));
    throw new Error('University sign-in is unavailable right now. Please try again shortly.');
  }

  saveStudidState({
    state,
    verificationId: body.id,
    secretToken,
    expiresAt: Date.now() + STATE_TTL_MS
  });

  return { url: body.link, state };
}

/**
 * Reads back what the university asserted, and decides whether it is enough.
 *
 * Everything here is checked because skipping it breaks something specific:
 * `test` marks a run against Studid's practice identity provider and must
 * never open a real session; `entityId` is the institution and is the claim
 * the whole platform rests on; `authIdentifier` is the stable per-student
 * pseudonym and is what stops one person holding unlimited accounts.
 */
export async function completeVerification(state) {
  const row = consumeStudidState(state);
  if (!row) throw new Error('This sign-in attempt expired or was already used. Please start again.');

  const res = await fetch(`${API}/${encodeURIComponent(row.verificationId)}`, {
    headers: { Authorization: `Bearer ${row.secretToken}` },
    signal: AbortSignal.timeout(15_000)
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[studid] poll failed:', res.status, JSON.stringify(body).slice(0, 200));
    throw new Error('We could not confirm your university sign-in. Please try again.');
  }

  const session = body.session;
  if (!session) throw new Error('University sign-in was not completed.');

  // A verification against the practice IdP proves nothing about a real
  // person. Studid flags it; honouring the flag is the whole point of it.
  if (session.test === true) {
    throw new Error('That was a test sign-in. Please sign in with your real university account.');
  }

  const entityId = String(session.entityId || '').trim();
  if (!entityId) throw new Error('Your university did not identify itself. Please try again.');

  const authIdentifier = String(session.authIdentifier || '').trim();
  if (!authIdentifier) {
    // Some identity providers release no persistent pseudonym. Without one we
    // cannot recognise a returning student or stop one person opening
    // unlimited accounts, so this is refused rather than half-honoured.
    throw new Error('Your university did not release a stable identifier, so we cannot complete sign-in. Please contact hello@joinfrea.com.');
  }

  const affiliations = Array.isArray(session.affiliations)
    ? session.affiliations.map(a => String(a).toLowerCase())
    : [];

  /**
   * Affiliation is checked only when the institution releases it.
   *
   * Many identity providers release nothing here, and refusing those students
   * would lock out whole universities to enforce a distinction the old
   * .ac.uk rule never made either — a staff address ends in .ac.uk too. So:
   * when we are told, we honour it; when we are not, membership of the
   * institution stands, exactly as an address did before.
   */
  if (affiliations.length && !affiliations.includes('student')) {
    throw new Error('frea is for current students. Your university account is not registered as a student one.');
  }

  return {
    authIdentifier,
    entityId,
    affiliations,
    // The pairwise id is scoped as `opaque@institution.ac.uk`; the scope is a
    // readable institution name and corroborates entityId.
    scope: authIdentifier.includes('@') ? authIdentifier.split('@').pop() : null,
    institutionName: await resolveInstitutionName(entityId)
  };
}

/**
 * The institution's own name for itself, from the federation's metadata.
 *
 * This is what makes "verified" mean anything on a mentor profile. The
 * university used to be typed into the signup form and taken on trust, which
 * was survivable only while the .ac.uk address in the same form corroborated
 * it. Now that the address is a personal one, nothing in the form relates to
 * the institution at all — a Manchester student could pick Oxford from the
 * dropdown and carry a "university verified" badge saying so.
 *
 * So it is read from the identity provider that actually vouched for them,
 * and the form no longer asks.
 *
 * Deliberately non-fatal. This is cosmetic next to the entityId, which is the
 * real claim and is already in hand; a directory lookup failing should not
 * cost somebody their registration. The caller falls back to the scope, which
 * is accurate if less pretty, and it is resolved once and stored rather than
 * on every sign-in.
 */
async function resolveInstitutionName(entityId) {
  try {
    // Searching the host rather than the whole URL: the metadata is indexed on
    // names and hostnames, and a full entityId with its scheme and path scores
    // poorly.
    const host = new URL(entityId).hostname;
    const res = await fetch(`https://api.studid.io/v2/search?q=${encodeURIComponent(host)}`, {
      signal: AbortSignal.timeout(8_000)
    });
    if (!res.ok) return null;

    const body = await res.json().catch(() => ({}));
    // Match on entityId, never on the search ranking — the first hit for
    // "manchester" is not necessarily the tenant that just vouched for them.
    const hit = (body.hits || []).find(h => h.entityId === entityId);
    return hit?.displayName ? String(hit.displayName).slice(0, 100) : null;
  } catch (err) {
    console.warn('[studid] could not resolve institution name:', err.message);
    return null;
  }
}
