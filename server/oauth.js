// ─────────────────────────────────────────────
// frea — "Sign in with Microsoft" (Entra ID)
// ─────────────────────────────────────────────
//
// Why this exists at all.
//
// Of 24 UK universities surveyed, 15 point MX straight at Microsoft and 4 more
// sit behind a filtering gateway that fronts Microsoft 365. So for roughly
// four in five students, the verification email we send is judged by Exchange
// Online — which defers unfamiliar low-volume senders and detonates links
// before releasing them. That is where the multi-minute codes come from, and
// none of it is ours to fix.
//
// Signing in through Entra skips the inbox entirely. It is also a STRONGER
// proof than the emailed code, not a convenience shortcut: Entra will not let
// a tenant issue user principal names on a domain it has not proven ownership
// of, so a UPN ending in .ac.uk is Microsoft asserting that this university
// controls that domain and that this user is theirs. The emailed code only
// ever proved that somebody could read one inbox.
//
// Email codes stay as the fallback. Three of the 24 self-host their mail
// (Edinburgh, Glasgow, St Andrews) and some tenants block third-party apps
// without admin consent, so this can never be the only door.

import crypto from 'crypto';
import { saveOAuthState, consumeOAuthState } from './db.js';

/**
 * `organizations`, deliberately, not `common`.
 *
 * `common` also admits personal Microsoft accounts — an outlook.com or
 * hotmail.com login — and anyone can create one of those with any display
 * name they like. Restricting to work/school accounts is what makes the
 * tenant's assertion about the domain mean anything.
 */
const AUTHORITY = 'https://login.microsoftonline.com/organizations';
const SCOPES = 'openid profile email';
const STATE_TTL_MS = 10 * 60 * 1000;

export function microsoftConfigured() {
  return Boolean(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
}

function publicBase() {
  return (process.env.PUBLIC_BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');
}

/**
 * Must match a redirect URI registered on the app, character for character —
 * Entra compares it as a string, and a trailing slash is enough to fail with
 * AADSTS50011.
 */
export function redirectUri() {
  return (process.env.MS_REDIRECT_URI || `${publicBase()}/api/auth/microsoft/callback`).trim();
}

const b64url = (buf) => buf.toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Builds the URL to send the browser to, and records what we will need to
 * check when it comes back.
 *
 * PKCE as well as a client secret. The secret alone would do for a server-side
 * flow, but PKCE costs nothing here and closes the window where an
 * authorization code leaked from a redirect (browser history, a referrer, a
 * shared machine) can be redeemed by anyone but us.
 */
export function buildAuthorizeUrl({ returnTo = null } = {}) {
  const state = b64url(crypto.randomBytes(32));
  const nonce = b64url(crypto.randomBytes(32));
  const codeVerifier = b64url(crypto.randomBytes(64));
  const codeChallenge = b64url(crypto.createHash('sha256').update(codeVerifier).digest());

  saveOAuthState({ state, nonce, codeVerifier, returnTo, expiresAt: Date.now() + STATE_TTL_MS });

  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    response_mode: 'query',
    scope: SCOPES,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  return { url: `${AUTHORITY}/oauth2/v2.0/authorize?${params}`, state };
}

/**
 * Reads an ID token's payload WITHOUT verifying its signature.
 *
 * That is sound here and only here. We are not accepting this token from the
 * browser; we fetched it ourselves, over TLS, from Microsoft's token endpoint,
 * authenticating with our client secret. OpenID Connect Core 3.1.3.7 allows
 * TLS server validation to stand in for signature validation on exactly this
 * path. A token arriving by any other route would have to have its signature
 * checked against the JWKS — so if this function ever gets reused, read that
 * sentence again first.
 */
function decodeIdToken(idToken) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed ID token.');
  return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
}

/**
 * Exchanges the code and returns the claims we trust.
 *
 * Everything checked here is checked because skipping it breaks something
 * specific: `state` stops a login being forged onto someone else's session,
 * `nonce` stops an ID token from an unrelated sign-in being replayed into
 * this one, `aud` stops a token minted for a different application being
 * accepted, and `iss` must be the tenant's own issuer — on a multi-tenant app
 * the issuer carries the tenant id, so a fixed string would be wrong.
 */
export async function completeMicrosoftLogin({ code, state }) {
  if (!microsoftConfigured()) throw new Error('Microsoft sign-in is not configured.');

  const row = consumeOAuthState(state);
  if (!row) throw new Error('This sign-in link has expired or was already used. Please try again.');

  const body = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    client_secret: process.env.MS_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: row.codeVerifier,
    scope: SCOPES
  });

  const res = await fetch(`${AUTHORITY}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15_000)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Microsoft's description names the actual misconfiguration (a stale
    // secret, an unregistered redirect URI). Worth logging; not worth showing
    // a student.
    console.error('[oauth] token exchange failed:', json.error, json.error_description);
    throw new Error('Microsoft sign-in failed. Please try again, or use your email instead.');
  }

  const claims = decodeIdToken(json.id_token);

  if (claims.nonce !== row.nonce) throw new Error('Sign-in could not be verified. Please try again.');
  if (claims.aud !== process.env.MS_CLIENT_ID) throw new Error('Sign-in could not be verified. Please try again.');

  const expectedIssuer = `https://login.microsoftonline.com/${claims.tid}/v2.0`;
  if (!claims.tid || claims.iss !== expectedIssuer) {
    throw new Error('Sign-in could not be verified. Please try again.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === 'number' && claims.exp < now - 60) {
    throw new Error('Sign-in expired in transit. Please try again.');
  }

  /**
   * The UPN is the claim that carries the guarantee.
   *
   * `email` is an editable directory attribute and a tenant admin can set it
   * to anything, including a domain they do not own. `preferred_username` is
   * the UPN, whose suffix Entra requires to be a domain the tenant has
   * verified. Only fall back to `email` when there is no UPN at all, which in
   * practice means a guest account we would reject on the .ac.uk rule anyway.
   */
  const upn = String(claims.preferred_username || claims.upn || claims.email || '')
    .trim().toLowerCase();

  if (!upn.includes('@')) throw new Error('Microsoft did not return a usable university address.');

  return { email: upn, tenantId: claims.tid, name: claims.name || null, returnTo: row.returnTo };
}
