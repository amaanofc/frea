// ─────────────────────────────────────────────
// frea — Frontend API client
// ─────────────────────────────────────────────
//
// Every authenticated call carries the session token issued when the student
// or mentor signed in — through their university the first time, by a code to
// their own inbox after that. Access decisions live on the server; this file
// only asks.

import { MENTORS } from './data.js';

const API_BASE = '/api';
const SESSION_KEY = 'frea_session';

// ─── Session ────────────────────────────────────────────

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch (e) {
    return null;
  }
}

export function setSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('[api] could not persist session', e);
  }
}

export function getSessionToken() {
  return getSession()?.sessionToken || null;
}

export function clearSession() {
  setSession(null);
}

/** Core fetch wrapper: attaches the token, unwraps { success, data }. */
async function request(path, { method = 'GET', body, raw = false, formData } = {}) {
  const headers = {};
  const token = getSessionToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined)
  });

  if (raw) return res;

  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error(`The server returned an unexpected response (${res.status}).`);
  }

  if (!res.ok || json.success === false) {
    const err = new Error(json.error || `Request failed (${res.status})`);
    err.status = res.status;
    // Flags the UI branches on.
    if (json.needsVerification) err.needsVerification = true;
    if (json.requiresPurchase) err.requiresPurchase = true;
    if (json.notRegistered) err.notRegistered = true;
    // A dead session should not leave the UI looking signed in.
    if (res.status === 401 && token) clearSession();
    throw err;
  }

  return json;
}

// ─── Auth ───────────────────────────────────────────────

export async function sendEmailVerification(email, universityName = '') {
  return request('/auth/send-verification', { method: 'POST', body: { email, universityName } });
}

export async function verifyEmailCode(email, code) {
  const json = await request('/auth/verify-code', { method: 'POST', body: { email, code } });
  setSession({
    email: json.email,
    sessionToken: json.sessionToken,
    isMentor: json.isMentor,
    isAdmin: json.isAdmin,
    mentorId: json.mentor?.id || null,
    name: json.mentor?.name || null,
    university: json.mentor?.university || null
  });
  return json;
}

export async function verifyEmailToken(token) {
  const json = await request(`/auth/verify?token=${encodeURIComponent(token)}`);
  setSession({
    email: json.email,
    sessionToken: json.sessionToken,
    isMentor: json.isMentor,
    isAdmin: json.isAdmin,
    mentorId: json.mentor?.id || null,
    name: json.mentor?.name || null,
    university: json.mentor?.university || null
  });
  return json;
}

/** Re-checks the stored session against the server. Null if it has expired. */
export async function fetchMe() {
  if (!getSessionToken()) return null;
  try {
    const json = await request('/auth/me');
    if (!json.session) {
      clearSession();
      return null;
    }
    const current = getSession() || {};
    setSession({
      ...current,
      email: json.session.email,
      isMentor: json.session.isMentor,
      isAdmin: json.session.isAdmin,
      mentorId: json.session.mentorId,
      name: json.mentor?.name || current.name || null,
      university: json.mentor?.university || current.university || null
    });
    return json;
  } catch (e) {
    return null;
  }
}

export async function signOut() {
  try {
    await request('/auth/signout', { method: 'POST' });
  } catch (e) {
    /* the local session is cleared regardless */
  }
  clearSession();
}

// ─── Mentors ────────────────────────────────────────────

export async function fetchMentors(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.university) params.set('university', filters.university);
    if (filters.subject) params.set('subject', filters.subject);
    const json = await request(`/mentors?${params.toString()}`);
    return json.data || MENTORS;
  } catch (err) {
    console.warn('[api] fetchMentors — falling back to bundled data', err.message);
    return MENTORS;
  }
}

export async function fetchMentor(id) {
  try {
    const json = await request(`/mentors/${id}`);
    return json.data;
  } catch (err) {
    return MENTORS.find(m => m.id === parseInt(id)) || null;
  }
}

export async function updateMentorProfile(id, profileData) {
  const json = await request(`/mentors/${id}`, { method: 'PUT', body: profileData });
  return json.data;
}

export async function updateMentorSchedule(id, weeklySchedule) {
  const json = await request(`/mentors/${id}/schedule`, { method: 'PUT', body: { weeklySchedule } });
  return json.data;
}

export async function submitMentorApplication(appData) {
  const json = await request('/mentors/apply', { method: 'POST', body: appData });
  if (json.sessionToken) {
    setSession({
      email: json.mentor.email,
      sessionToken: json.sessionToken,
      isMentor: true,
      isAdmin: false,
      mentorId: json.mentor.id,
      name: json.mentor.name,
      university: json.mentor.university
    });
  }
  return json.data;
}

// ─── Calendar & bookings ────────────────────────────────

export async function fetchMonthlySlots(mentorId, year, month) {
  const json = await request(`/mentors/${mentorId}/slots?year=${year}&month=${month}`);
  return json.data;
}

export async function submitBooking({ mentorId, date, time }) {
  const json = await request('/bookings', { method: 'POST', body: { mentorId, date, time } });
  return json.data;
}

export async function fetchMyBookings() {
  try {
    const json = await request('/bookings/mine');
    return json.data;
  } catch (e) {
    return { upcoming: [], past: [] };
  }
}

export async function fetchMentorBookings(mentorId) {
  try {
    const json = await request(`/mentors/${mentorId}/bookings`);
    return json.data;
  } catch (e) {
    console.warn('[api] fetchMentorBookings', e.message);
    return { upcoming: [], past: [], cancelled: [], total: 0 };
  }
}

export async function cancelBooking(bookingId, cancelToken = null) {
  const json = await request(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: { cancelToken }
  });
  return json.data;
}

/** Authenticated .ics download, delivered as a blob so the token can be sent. */
export async function downloadBookingIcs(bookingId, title = 'frea-session') {
  const res = await request(`/bookings/${bookingId}/ics`, { raw: true });
  if (!res.ok) throw new Error('Could not download the calendar invite.');
  const blob = await res.blob();
  triggerBlobDownload(blob, `${title}.ics`);
}

// ─── Resources ──────────────────────────────────────────

export async function fetchResources() {
  try {
    const json = await request('/resources');
    return { resources: json.data || [], entitlements: json.entitlements || [] };
  } catch (e) {
    console.warn('[api] fetchResources', e.message);
    return { resources: [], entitlements: [] };
  }
}

export async function createResource(resourceData) {
  const json = await request('/resources', { method: 'POST', body: resourceData });
  return json.data;
}

export async function updateResource(id, updates) {
  const json = await request(`/resources/${id}`, { method: 'PUT', body: updates });
  return json.data;
}

export async function deleteResource(id) {
  return request(`/resources/${id}`, { method: 'DELETE' });
}

/** Claims a freabie so it shows as unlocked everywhere, on any device. */
export async function claimResource(id) {
  const json = await request(`/resources/${id}/claim`, { method: 'POST' });
  return json.data;
}

/**
 * Streams a resource file through the authorised endpoint and saves it.
 * Throws with `requiresPurchase` if the student does not own a paid playbook.
 */
export async function downloadResource(id, title = 'frea-resource') {
  const res = await request(`/resources/${id}/download`, { raw: true });

  if (!res.ok) {
    let json = {};
    try { json = await res.json(); } catch (e) { /* non-JSON error body */ }
    const err = new Error(json.error || 'Could not download this resource.');
    err.status = res.status;
    if (json.requiresPurchase) err.requiresPurchase = true;
    if (res.status === 401) {
      err.needsVerification = true;
      clearSession();
    }
    throw err;
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match
    ? match[1]
    : `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.pdf`;

  triggerBlobDownload(blob, filename);
  return { filename };
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('document', file);
  return request('/upload/document', { method: 'POST', formData });
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so Safari has finished reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Payments ───────────────────────────────────────────

export async function fetchPaymentConfig() {
  try {
    const json = await request('/payments/config');
    return json.data;
  } catch (e) {
    return { enabled: false, feeRatePercent: 5, currency: 'GBP' };
  }
}

/** Opens Stripe Checkout for one playbook. Returns the hosted checkout URL. */
export async function startCheckout(resourceId) {
  const json = await request('/checkout', { method: 'POST', body: { resourceId } });
  return json.data;
}

export async function fetchCheckoutStatus(orderId) {
  const json = await request(`/checkout/${orderId}/status`);
  return json.data;
}

// ─── Mentor earnings ────────────────────────────────────

export async function fetchMentorOrders(mentorId) {
  try {
    const json = await request(`/mentors/${mentorId}/orders`);
    return json.data;
  } catch (err) {
    console.warn('[api] fetchMentorOrders', err.message);
    return {
      totalOrders: 0, totalGrossSales: 0, mentorPayout: 0,
      freaPlatformFee: 0, freeDownloads: 0, feeRatePercent: 5, orders: []
    };
  }
}

// ─── Admin ──────────────────────────────────────────────

export async function fetchAdminApplications() {
  const json = await request('/admin/applications');
  return json.data || [];
}

export async function fetchAdminSuggestions() {
  const json = await request('/admin/suggestions');
  return json.data || [];
}

// ─── Misc ───────────────────────────────────────────────

export async function fetchStats() {
  try {
    const json = await request('/stats');
    return json.data;
  } catch (err) {
    return null;
  }
}

export async function submitSuggestion(payload) {
  const json = await request('/suggestions', { method: 'POST', body: payload });
  return json.data;
}

// ─── Reports ────────────────────────────────────────────

export async function submitReport({ targetType, targetId, reason, detail }) {
  const json = await request('/reports', {
    method: 'POST',
    body: { targetType, targetId, reason, detail }
  });
  return json.data;
}

export async function fetchAdminReports() {
  const json = await request('/admin/reports');
  return json.data || [];
}

export async function resolveReport(id) {
  return request(`/admin/reports/${id}/resolve`, { method: 'POST' });
}

// ─── Connect payouts ────────────────────────────────────

export async function startPayoutOnboarding() {
  const json = await request('/connect/onboard', { method: 'POST' });
  return json.data;
}

export async function fetchPayoutStatus() {
  try {
    const json = await request('/connect/status');
    return json.data;
  } catch (e) {
    return { configured: false, started: false, payoutsEnabled: false, currentlyDue: [] };
  }
}

/** Star a mentor, or take the star back. Verified students only. */
export async function starMentor(mentorId) {
  const json = await request(`/mentors/${mentorId}/star`, { method: 'POST' });
  return json.data;
}

// ─── University sign-in (Studid) ────────────────────────

/**
 * Verifies the student through their own university's login, in a popup.
 *
 * Resolves either with a live session (a returning student) or with
 * `needsEmail` and a ticket — a first-time student whose university has
 * vouched for them but who has not yet told us where to send invites.
 *
 * Popup rather than redirect: this is called from inside the booking modal,
 * and a redirect would discard the slot they had picked.
 */
export function verifyWithUniversity() {
  return new Promise((resolve, reject) => {
    const w = 560, h = 700;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
    const popup = window.open(
      `${API_BASE}/auth/studid/start`,
      'frea-university-signin',
      `width=${w},height=${h},left=${left},top=${top}`
    );

    if (!popup) {
      reject(new Error('Your browser blocked the sign-in window. Please allow pop-ups for this site and try again.'));
      return;
    }

    let settled = false;
    let poll;
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearInterval(poll);
      fn(arg);
    };

    function onMessage(event) {
      // Origin stops another page posting a forged session in; the source tag
      // stops us reacting to unrelated traffic on our own origin.
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.source !== 'frea-studid-auth') return;

      if (!event.data.ok) {
        finish(reject, new Error(event.data.error || 'University sign-in failed.'));
        return;
      }

      if (!event.data.needsEmail) {
        setSession({
          email: event.data.email,
          sessionToken: event.data.sessionToken,
          isMentor: event.data.isMentor,
          isAdmin: event.data.isAdmin,
          mentorId: null, name: null, university: null
        });
      }
      finish(resolve, event.data);
    }

    window.addEventListener('message', onMessage);

    poll = setInterval(() => {
      if (popup.closed) finish(reject, new Error('Sign-in window was closed before it finished.'));
    }, 500);
  });
}

/** Binds a contact address to a freshly verified student and opens the session. */
export async function completeUniversitySignIn(ticket, email) {
  const json = await request('/auth/studid/complete', { method: 'POST', body: { ticket, email } });
  setSession({
    email: json.email,
    sessionToken: json.sessionToken,
    isMentor: json.isMentor,
    isAdmin: json.isAdmin,
    mentorId: null, name: null, university: null
  });
  return json;
}

/**
 * Step one of signing in: does this address belong to anyone?
 *
 * Resolves `{ known: true }` when a code has been sent, or `{ known: false }`
 * when the address is not registered and the caller should send them through
 * university verification instead. A rejected request is a real failure —
 * "not registered" is an answer, not an error.
 */
export async function startSignIn(email) {
  try {
    await request('/auth/send-verification', { method: 'POST', body: { email } });
    return { known: true };
  } catch (err) {
    if (err.status === 404) return { known: false };
    throw err;
  }
}
