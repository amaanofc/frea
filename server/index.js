// ─────────────────────────────────────────────
// frea — Express API server
// ─────────────────────────────────────────────

import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

import { UPLOADS_DIR, VIDEO_DIR, DIST_DIR, DATA_DIR, DB_FILE, ensureDataDirs } from './paths.js';

import {
  loadDb,
  getAllMentors,
  getMentorById,
  findMentorByEmail,
  findMentorByAuthIdentifier,
  findIdentityByContactEmail,
  getMonthlySlotsForMentor,
  createBooking,
  cancelBooking,
  getBookingById,
  getBookingsForMentor,
  getBookingsForStudent,
  createMentorApplication,
  getStats,
  saveVerificationToken,
  verifyEmailCode,
  verifyEmailToken,
  isEmailVerified,
  getMentorApplications,
  updateMentorProfile,
  updateMentorSchedule,
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  grantEntitlement,
  hasEntitlement,
  getEntitlementsForEmail,
  recordDownload,
  createPendingOrder,
  attachStripeSession,
  markOrderPaid,
  getOrderById,
  getOrdersForMentor,
  createSuggestion,
  getSuggestions,
  setMentorPayoutAccount,
  findMentorByStripeAccount,
  canMentorSell,
  createReport,
  getReports,
  resolveReport,
  splitPrice,
  feeRate,
  toggleStar,
  getStarCounts,
  hasStarred,
  markEmailVerified,
  saveStudidState,
  consumeStudidState,
  findStudentIdentity,
  upsertStudentIdentity,
  contactEmailTakenBy,
  mailHandoffStats,
  recentMailHandoffs
} from './db.js';

import {
  startVerification,
  completeVerification
} from './studid.js';

import {
  attachSession,
  createSession,
  destroySession,
  requireVerified,
  requireMentor,
  requireSelfOrAdmin,
  requireAdmin,
  isAdminEmail
} from './auth.js';

import {
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendMentorBookingNotification,
  sendCancellationEmail,
  sendPurchaseReceiptEmail,
  sendSaleNotificationEmail,
  mailStatus,
  probeSmtp,
  baseUrl
} from './email.js';

import { generateICSContent, calendarLinks } from './ics.js';
import { startBackupSchedule, listBackups, takeBackup, BACKUP_DIR } from './backup.js';
import {
  stripeConfigured,
  createCheckoutSession,
  constructWebhookEvent,
  isSessionPaid,
  accountIdFromEvent,
  createConnectAccount,
  createAccountLink,
  getAccountStatus
} from './payments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.use(cors());

// ─── Security headers ───────────────────────────────────
//
// Hand-rolled rather than pulled from helmet: the set is small, every value
// here is one we actually reasoned about, and a dependency that rewrites
// headers is worth avoiding on a server that also serves the SPA.
//
// The CSP is deliberately strict. The front end loads nothing from a CDN —
// Google Fonts is the only third party, and Checkout is a server-side redirect
// rather than an embedded Stripe.js, so no script origin needs allowing.
app.use((req, res, next) => {
  // HSTS only once we are actually on TLS. Sending it over plain http is
  // meaningless, and in local dev it would pin localhost to https for months.
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    // 'unsafe-inline' is load-bearing, not laziness: the front end renders its
    // markup as HTML strings and wires behaviour with onclick= attributes —
    // 177 of them across src/main.js. Dropping it blanks the whole app. It
    // costs most of CSP's XSS protection, so moving those to addEventListener
    // and tightening this to 'self' is worth doing. Everything else here is
    // already at full strength and does not depend on that work.
    "script-src 'self' 'unsafe-inline'",
    // React sets style attributes, and the Google Fonts stylesheet is remote.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Mentor avatars and og images are local; data: covers inline SVG icons.
    "img-src 'self' data: blob:",
    // Pitch videos are served from our own /uploads/pitch_videos.
    "media-src 'self'",
    "connect-src 'self'",
    // Checkout is reached by navigation, so Stripe needs no frame or form entry.
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  next();
});

// Stripe needs the raw body to verify its signature, so this route is mounted
// with a raw parser *before* express.json() claims everything.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json({ limit: '2mb' }));
app.use(attachSession);

// Creates the writable tree and fails fast if the volume is not writable —
// better at boot than when the first student tries to sign up.
ensureDataDirs();

// Pitch videos ARE public: they sit on mentor profiles for any visitor to
// watch, so gating them behind a session would break the browse experience.
// Served read-only with a long cache, since filenames are content-unique.
app.use('/uploads/pitch_videos', express.static(VIDEO_DIR, {
  maxAge: '30d',
  immutable: true,
  index: false,
  dotfiles: 'deny'
}));

// Digital products are NOT public. Every download goes through
// /api/resources/:id/download, which checks entitlement first. This guard sits
// above the SPA fallback so the old public path is an explicit dead end rather
// than quietly returning index.html with a 200.
app.use('/uploads', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Resource files are not publicly accessible. Use /api/resources/:id/download.'
  });
});

// ─── Upload configuration ───────────────────────────────

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.md', '.tex', '.pptx']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/markdown',
  'text/plain',
  'application/x-tex',
  'text/x-tex',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    // The owner is part of the name so the server can later tell whose file
    // this is. Without it, a mentor could publish a resource pointing at
    // someone else's upload and download it through their own entitlement.
    cb(null, `doc-${req.session?.mentorId || 'x'}-${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`File type rejected. Only PDF, Markdown (.md), LaTeX (.tex) and PowerPoint (.pptx) are permitted. You uploaded: ${ext}`));
    }
    const mime = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime) && ext !== '.md' && ext !== '.tex') {
      return cb(new Error(`Security policy rejected MIME type: ${file.mimetype}`));
    }
    cb(null, true);
  }
});

// ─── Pitch video uploads ────────────────────────────────
//
// Two sources, one endpoint: a take recorded in the browser (webm, already
// constrained to 720p at capture) or a file the mentor chose (mp4/webm/mov).

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const VIDEO_MIME_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'
]);
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEO_DIR),
  filename: (req, file, cb) => {
    // Recorded blobs arrive without a usable name; derive from the MIME type.
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!VIDEO_EXTENSIONS.has(ext)) {
      ext = (file.mimetype || '').includes('mp4') ? '.mp4'
        : (file.mimetype || '').includes('quicktime') ? '.mov'
        : '.webm';
    }
    const mentorId = req.session?.mentorId || 'x';
    cb(null, `pitch-${mentorId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: MAX_VIDEO_BYTES },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
    const ext = path.extname(file.originalname || '').toLowerCase();

    // The declared MIME cannot be trusted here for two reasons. It is
    // client-supplied and therefore spoofable, and MediaRecorder produces
    // "video/webm;codecs=vp9,opus" — an unquoted comma in a parameter, which
    // busboy cannot parse, so it silently reports "text/plain" instead.
    // So accept on either signal here and verify the real bytes after write.
    if (VIDEO_MIME_TYPES.has(mime) || mime.startsWith('video/') || VIDEO_EXTENSIONS.has(ext)) {
      return cb(null, true);
    }
    cb(new Error('That file is not a supported video. Use MP4, WebM or MOV — or record one here instead.'));
  }
});

/**
 * Checks the actual file header. This is the real gate: a renamed executable
 * passes every MIME and extension check but fails here.
 */
function looksLikeVideo(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const head = Buffer.alloc(16);
    const read = fs.readSync(fd, head, 0, 16, 0);
    if (read < 12) return false;

    // Matroska / WebM
    if (head.slice(0, 4).toString('hex') === '1a45dfa3') return true;

    // ISO base media (MP4, M4V, MOV): a box type at offset 4
    const boxType = head.slice(4, 8).toString('latin1');
    if (['ftyp', 'moov', 'mdat', 'free', 'skip', 'wide'].includes(boxType)) return true;

    return false;
  } catch (err) {
    return false;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (e) { /* already closed */ }
    }
  }
}

const FORMAT_BY_EXT = { '.pdf': 'PDF', '.md': 'Markdown', '.tex': 'LaTeX', '.pptx': 'PowerPoint' };
const MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.tex': 'application/x-tex',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

/** Wraps an async handler so a rejected promise reaches the error middleware. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── Basic in-memory rate limiting ──────────────────────
//
// Enough to stop someone hammering the OTP endpoints from one address.

const hits = new Map();

/**
 * Keying matters here. UK universities NAT thousands of students behind a
 * handful of addresses, so limiting the OTP and booking routes per IP would
 * lock out a whole campus the moment a few people signed in at once. Those
 * routes key on the email being acted upon instead; only anonymous routes
 * fall back to the address.
 */
const byEmail = (req) =>
  (req.body?.email || req.session?.email || req.ip || 'anon').toString().trim().toLowerCase();

function rateLimit({ windowMs = 60_000, max = 10, key = req => req.ip } = {}) {
  return (req, res, next) => {
    const id = `${req.path}:${key(req)}`;
    const now = Date.now();
    const record = hits.get(id);

    if (!record || now > record.resetAt) {
      hits.set(id, { count: 1, resetAt: now + windowMs });
      return next();
    }
    record.count += 1;
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: 'Too many attempts. Please wait a minute and try again.'
      });
    }
    next();
  };
}

// Keep the map from growing without bound.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
}, 60_000).unref();

// ─── Health ─────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'frea-api',
    payments: stripeConfigured() ? 'stripe' : 'not-configured',
    // Mail fails silently by design in dev — surface it so a deploy that is
    // quietly posting into a throwaway inbox is visible without reading logs.
    mail: mailStatus(),
    time: new Date().toISOString()
  });
});

// ─── Email verification & sessions ──────────────────────

/** Issues a one-time code. The code is emailed; it is never returned here. */
// Two limits, because they stop different things. By email: a single address
// cannot be mail-bombed. By IP: one caller cannot walk a list of addresses,
// which the per-email limit does nothing about and which costs real money at
// the mail provider.
//
// The IP window is deliberately generous. Every user of this platform is at a
// university, and universities put thousands of students behind a handful of
// NAT addresses — during freshers week a single campus egress IP could
// legitimately send hundreds of codes an hour. A tight cap here does not stop
// an attacker, who can rotate addresses; it locks out a whole institution.
// This is sized to stop a scripted walk through an address list while leaving
// real campus traffic alone, and the per-email limit does the precise work.
app.post('/api/auth/send-verification',
  rateLimit({ max: 100, windowMs: 10 * 60_000, key: req => `ip:${req.ip}` }),
  rateLimit({ max: 5, windowMs: 60_000, key: byEmail }), wrap(async (req, res) => {
  // `universityName` used to be sent in the body and interpolated into the
  // verification email. It came from the client, went into the HTML without
  // escaping, and left our domain with valid SPF and DKIM — an injection
  // straight into mail that receivers trust. The plain template no longer
  // mentions the institution at all, so the field is simply ignored.
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  // Students must prove a .ac.uk address — that rule is the whole basis of the
  // platform. Administrators are the one exception: they are named explicitly
  // in ADMIN_EMAILS, which is server-side config, so the address is already
  // trusted and need not be a university one.
  /**
   * A code goes only to an address we already know.
   *
   * The university proves who someone is once, at registration. Every sign-in
   * after that only has to prove they still hold the inbox they nominated —
   * and a code to a personal inbox is a perfectly good proof of that, because
   * the thing that was broken was .ac.uk filtering, not email. Codes to
   * personal addresses have been arriving throughout.
   *
   * Sending to an address we do not recognise would be worse than useless: it
   * would mail a stranger a code for an account that does not exist, and turn
   * this endpoint into a way to spray mail at arbitrary addresses. So an
   * unknown address is told, without a code and without leaking whether it is
   * registered elsewhere, to go and verify with their university.
   */
  const identity = findIdentityByContactEmail(cleanEmail);
  if (!cleanEmail || (!identity && !isAdminEmail(cleanEmail))) {
    return res.status(404).json({
      success: false,
      needsRegistration: true,
      error: 'We do not recognise that email. Verify with your university to get set up.'
    });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  saveVerificationToken({ email: cleanEmail, token, code, expiresAt });

  let emailResult = null;
  try {
    emailResult = await sendVerificationEmail({ email: cleanEmail, code });
  } catch (mailErr) {
    console.error('[auth] Verification email failed:', mailErr.message);
    return res.status(502).json({
      success: false,
      error: 'We could not send your verification email just now. Please try again in a moment.'
    });
  }

  res.json({
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    email: cleanEmail,
    // Ethereal preview link in dev only — never the code itself.
    previewUrl: emailResult?.previewUrl || null
  });
}));

// ─── Student verification via university SSO ────────────

/** Step one: send the student to their university's login. */
/**
 * Step one: send the student to their university's login.
 *
 * The cap is deliberately generous, for the reason spelled out above
 * send-verification: universities put thousands of students behind a handful
 * of NAT addresses, so a per-IP limit is really a per-campus limit. Twenty in
 * ten minutes would have given an entire university twenty registrations in
 * ten minutes — during freshers week that locks out the institution, and it
 * stops no attacker, who can rotate addresses freely.
 *
 * What this is actually for is not letting us hammer Studid, who run the
 * federation gateway for nothing.
 */
app.get('/api/auth/studid/start', rateLimit({ max: 100, windowMs: 10 * 60_000, key: req => `ip:${req.ip}` }), wrap(async (req, res) => {
  const { url } = await startVerification();
  res.redirect(url);
}));

/**
 * Step two: they come back from their university.
 *
 * Runs in a popup, so it answers with a page that posts the outcome to the
 * opener and closes. A full-page redirect would take the booking modal and
 * the slot they had chosen down with it.
 *
 * A returning student is signed straight in. A new one gets a short-lived
 * ticket instead of a session, because we still need somewhere to send their
 * calendar invites and have not asked yet.
 */
app.get('/api/auth/studid/callback', wrap(async (req, res) => {
  const origin = (process.env.PUBLIC_BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');

  const reply = (payload) => {
    res.type('html').send(`<!doctype html>
<meta charset="utf-8">
<title>Signing you in…</title>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; color: #334155;">
<p>${payload.ok ? 'Verified — you can close this window.' : 'Sign-in did not complete. You can close this window.'}</p>
<script>
  var payload = ${JSON.stringify(payload).replace(/</g, '\\u003c')};
  try { if (window.opener) window.opener.postMessage({ source: 'frea-studid-auth', ...payload }, ${JSON.stringify(origin)}); } catch (e) {}
  window.close();
</script>
</body>`);
  };

  let result;
  try {
    result = await completeVerification(req.query.state);
  } catch (err) {
    return reply({ ok: false, error: err.message });
  }

  const known = findStudentIdentity(result.authIdentifier);

  if (known && known.contactEmail) {
    // Seen before: refresh what the university told us and sign them in.
    upsertStudentIdentity({
      authIdentifier: result.authIdentifier,
      entityId: result.entityId,
      affiliations: result.affiliations,
      contactEmail: known.contactEmail
    });
    // By pseudonym, not address: the contact address is theirs to change.
    const mentor = findMentorByAuthIdentifier(result.authIdentifier);
    const session = createSession({ email: known.contactEmail, mentorId: mentor?.id || null, authIdentifier: result.authIdentifier });
    console.log(`[studid] returning student from ${result.scope || result.entityId}`);
    return reply({
      ok: true, needsEmail: false,
      email: known.contactEmail,
      sessionToken: session.token,
      isMentor: Boolean(mentor),
      isAdmin: session.isAdmin,
      institution: result.scope
    });
  }

  // First time: hold the proof against a ticket until they give us an address.
  const ticket = crypto.randomBytes(24).toString('hex');
  saveStudidState({
    state: `pending:${ticket}`,
    verificationId: `verified:${result.authIdentifier}`,
    secretToken: JSON.stringify({
      authIdentifier: result.authIdentifier,
      entityId: result.entityId,
      affiliations: result.affiliations
    }),
    expiresAt: Date.now() + 30 * 60 * 1000
  });

  console.log(`[studid] new student from ${result.scope || result.entityId}`);
  reply({ ok: true, needsEmail: true, ticket, institution: result.scope });
}));

/**
 * Step three, for a new student: bind a contact address and open the session.
 *
 * Any provider. This address is not proof of anything — the university
 * already vouched for them — it is only where invites and confirmations go,
 * and a personal mailbox is precisely the point, because it does not sit
 * behind the filtering that made .ac.uk mail unusable.
 */
app.post('/api/auth/studid/complete', rateLimit({ max: 100, windowMs: 10 * 60_000, key: req => `ip:${req.ip}` }), wrap(async (req, res) => {
  const { ticket, email } = req.body || {};
  const clean = (email || '').trim().toLowerCase();

  if (!clean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  /**
   * A university address is refused here, deliberately.
   *
   * This is the address we will send every invite, confirmation and sign-in
   * code to — and .ac.uk mail is exactly what does not arrive. Manchester's
   * gateway accepted ours and delivered it nowhere reachable. Accepting one
   * would hand the student an account whose sign-in codes vanish, which is
   * the original failure wearing a different hat and far harder to diagnose
   * once they are already registered.
   *
   * Their university identity is already proven; this field is only about
   * reaching them.
   */
  if (clean.endsWith('.ac.uk')) {
    return res.status(400).json({
      success: false,
      error: 'Please use a personal email address — Gmail, Outlook, anything you read outside university. University addresses filter our mail, so codes and invites often never arrive.'
    });
  }

  const row = consumeStudidState(`pending:${ticket}`);
  if (!row) {
    return res.status(400).json({ success: false, error: 'That verification expired. Please verify with your university again.' });
  }

  let proof;
  try {
    proof = JSON.parse(row.secretToken);
  } catch (_) {
    return res.status(400).json({ success: false, error: 'That verification could not be read. Please try again.' });
  }

  const clash = contactEmailTakenBy(clean, proof.authIdentifier);
  if (clash) {
    return res.status(409).json({
      success: false,
      error: 'That email address is already in use by another student. Please use a different one.'
    });
  }

  upsertStudentIdentity({
    authIdentifier: proof.authIdentifier,
    entityId: proof.entityId,
    affiliations: proof.affiliations,
    contactEmail: clean
  });
  markEmailVerified(clean);

  const mentor = findMentorByAuthIdentifier(proof.authIdentifier);
  const session = createSession({ email: clean, mentorId: mentor?.id || null, authIdentifier: proof.authIdentifier });

  res.json({
    success: true,
    email: clean,
    sessionToken: session.token,
    isMentor: Boolean(mentor),
    isAdmin: session.isAdmin
  });
}));

/** Proves a code and opens a session. */
app.post('/api/auth/verify-code', rateLimit({ max: 10, windowMs: 60_000, key: byEmail }), wrap(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
  }

  const result = verifyEmailCode(email, code);

  // The code proves possession of the inbox; the identity behind it is what
  // the university vouched for at registration. Carrying the pseudonym onto
  // the session is what lets a returning student keep their mentor profile —
  // matching on the address instead would hand that profile to whoever
  // happened to hold the address next.
  const identity = findIdentityByContactEmail(result.email);
  const mentor = identity
    ? findMentorByAuthIdentifier(identity.authIdentifier)
    : findMentorByEmail(result.email);

  const session = createSession({
    email: result.email,
    mentorId: mentor?.id || null,
    authIdentifier: identity?.authIdentifier || null
  });

  res.json({
    success: true,
    verified: true,
    email: result.email,
    sessionToken: session.token,
    isMentor: Boolean(mentor),
    isAdmin: session.isAdmin,
    mentor: mentor ? publicMentor(mentor) : null
  });
}));

/** One-click link from the email. */
app.get('/api/auth/verify', wrap(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing verification token.' });
  }

  const result = verifyEmailToken(token);
  const mentor = findMentorByEmail(result.email);
  const session = createSession({ email: result.email, mentorId: mentor?.id || null });

  res.json({
    success: true,
    verified: true,
    email: result.email,
    sessionToken: session.token,
    isMentor: Boolean(mentor),
    isAdmin: session.isAdmin,
    mentor: mentor ? publicMentor(mentor) : null
  });
}));

/** Who am I? Lets the SPA restore state on load without trusting localStorage. */
app.get('/api/auth/me', (req, res) => {
  if (!req.session) return res.json({ success: true, session: null });

  const mentor = req.session.mentorId ? getMentorById(req.session.mentorId) : null;
  res.json({
    success: true,
    session: {
      email: req.session.email,
      isMentor: Boolean(mentor),
      isAdmin: req.session.isAdmin,
      mentorId: mentor?.id || null
    },
    mentor: mentor ? publicMentor(mentor) : null,
    entitlements: getEntitlementsForEmail(req.session.email)
  });
});

app.post('/api/auth/signout', (req, res) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) destroySession(header.slice(7).trim());
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  const email = req.query.email;
  res.json({ success: true, verified: email ? isEmailVerified(email) : false });
});

/** Mentor sign-in step 1. Same OTP machinery, but checks a mentor exists. */
// ─── Mentors ────────────────────────────────────────────

/** Strips fields that should never reach other people's browsers. */
/**
 * `rating` is a seeded constant that nothing ever writes to, so it is not sent
 * to the client any more — a mentor with no sessions was being shown as 5.0.
 * `stars` replaces it: a real count of verified students who vouched for them,
 * starting at zero for everyone.
 */
function withStars(mentor, counts, viewerEmail) {
  const { rating, ...rest } = mentor;
  return {
    ...rest,
    stars: counts[mentor.id] || 0,
    youStarred: viewerEmail ? hasStarred(mentor.id, viewerEmail) : false
  };
}

function publicMentor(mentor, viewerEmail) {
  const counts = getStarCounts();
  const { email, ...rest } = withStars(mentor, counts, viewerEmail);
  return { ...rest, email, hasEmail: Boolean(email) };
}

function listedMentor(mentor, counts, viewerEmail) {
  // Public listings omit the mentor's email address entirely.
  const { email, ...rest } = withStars(mentor, counts || getStarCounts(), viewerEmail);
  return rest;
}

app.get('/api/mentors', (req, res) => {
  const mentors = getAllMentors({
    search: req.query.search,
    university: req.query.university,
    subject: req.query.subject
  });
  // Counts are read once for the whole listing rather than per mentor.
  const counts = getStarCounts();
  const viewer = req.session?.email || null;
  res.json({
    success: true,
    count: mentors.length,
    data: mentors.map(m => listedMentor(m, counts, viewer))
  });
});

app.get('/api/mentors/:id', (req, res) => {
  const mentor = getMentorById(req.params.id);
  if (!mentor) return res.status(404).json({ success: false, error: 'Mentor not found' });
  res.json({ success: true, data: listedMentor(mentor, null, req.session?.email || null) });
});

app.put('/api/mentors/:id', requireSelfOrAdmin, (req, res) => {
  const updated = updateMentorProfile(req.params.id, req.body);
  res.json({ success: true, data: publicMentor(updated) });
});

app.put('/api/mentors/:id/schedule', requireSelfOrAdmin, (req, res) => {
  const updated = updateMentorSchedule(req.params.id, req.body.weeklySchedule);
  res.json({ success: true, data: publicMentor(updated) });
});

app.get('/api/mentors/:id/slots', (req, res) => {
  let year = req.query.year;
  let month = req.query.month;

  if (month && String(month).includes('-')) {
    const [y, m] = String(month).split('-');
    year = parseInt(y);
    month = parseInt(m);
  } else {
    year = parseInt(year) || new Date().getFullYear();
    month = parseInt(month) || (new Date().getMonth() + 1);
  }

  if (!(year >= 2020 && year <= 2100) || !(month >= 1 && month <= 12)) {
    return res.status(400).json({ success: false, error: 'Invalid year or month.' });
  }

  const calendarData = getMonthlySlotsForMentor(req.params.id, year, month);
  if (!calendarData) return res.status(404).json({ success: false, error: 'Mentor not found' });

  res.json({ success: true, data: calendarData });
});

/** A mentor's own booking diary. */
app.get('/api/mentors/:id/bookings', requireSelfOrAdmin, (req, res) => {
  res.json({ success: true, data: getBookingsForMentor(req.params.id) });
});

/** A mentor's sales and payouts. */
app.get('/api/mentors/:id/orders', requireSelfOrAdmin, (req, res) => {
  res.json({ success: true, data: getOrdersForMentor(req.params.id) });
});

// ─── Bookings ───────────────────────────────────────────

/**
 * Star a mentor, or take it back. One per verified student per mentor.
 */
app.post('/api/mentors/:id/star', requireVerified, (req, res) => {
  try {
    const result = toggleStar({ mentorId: req.params.id, email: req.session.email });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/bookings', requireVerified, rateLimit({ max: 10, windowMs: 60_000, key: byEmail }), wrap(async (req, res) => {
  const { mentorId, date, time } = req.body;

  // The booking is always made for the signed-in, verified student. The
  // client cannot book on behalf of an address it has not proven.
  const studentEmail = req.session.email;

  if (!mentorId || !date || !time) {
    return res.status(400).json({
      success: false,
      error: 'Missing required booking fields: mentorId, date, time'
    });
  }

  const booking = createBooking({ mentorId, studentEmail, date, time });
  const mentor = getMentorById(mentorId);

  let icsContent = '';
  try {
    icsContent = generateICSContent({ booking, mentor });
    booking.icsDownloadUrl = `/api/bookings/${booking.id}/ics`;
  } catch (icsErr) {
    console.warn('[calendar] Could not generate .ics:', icsErr.message);
  }

  // Both parties get the invite. Neither email blocks the response.
  sendBookingConfirmationEmail({ booking, mentor, icsContent })
    .catch(err => console.warn('[email] student confirmation failed:', err.message));
  sendMentorBookingNotification({ booking, mentor, icsContent })
    .catch(err => console.warn('[email] mentor notification failed:', err.message));

  res.status(201).json({
    success: true,
    message: 'Booking confirmed',
    data: { ...booking, calendarLinks: calendarLinks({ booking, mentor }) }
  });
}));

app.get('/api/bookings/mine', requireVerified, (req, res) => {
  res.json({ success: true, data: getBookingsForStudent(req.session.email) });
});

app.get('/api/bookings/:id/ics', (req, res) => {
  const booking = getBookingById(req.params.id);
  if (!booking) return res.status(404).send('Booking not found');

  // A booking id alone is not enough; you must hold the session or the token.
  const token = req.query.token;
  const owns = req.session && (
    req.session.email === booking.studentEmail ||
    req.session.mentorId === booking.mentorId ||
    req.session.isAdmin
  );
  if (!owns && token !== booking.cancelToken) {
    return res.status(403).send('Not authorised to download this invite.');
  }

  const mentor = getMentorById(booking.mentorId) || { name: booking.mentorName };
  const icsContent = generateICSContent({
    booking, mentor, method: booking.status === 'cancelled' ? 'CANCEL' : 'REQUEST'
  });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="frea-session-${booking.id}.ics"`);
  res.send(icsContent);
});

app.post('/api/bookings/:id/cancel', wrap(async (req, res) => {
  const booking = getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

  const cancelled = cancelBooking({
    bookingId: req.params.id,
    email: req.session?.email,
    cancelToken: req.body.cancelToken || req.query.token,
    isAdmin: Boolean(req.session?.isAdmin)
  });

  const mentor = getMentorById(cancelled.mentorId) || { name: cancelled.mentorName };
  let icsContent = '';
  try {
    icsContent = generateICSContent({ booking: cancelled, mentor, method: 'CANCEL' });
  } catch (_) { /* the emails still work without an attachment */ }

  // Tell whichever side did not press the button.
  const notify = cancelled.cancelledBy === 'mentor' ? cancelled.studentEmail : cancelled.mentorEmail;
  sendCancellationEmail({ booking: cancelled, mentor, icsContent, to: notify })
    .catch(err => console.warn('[email] cancellation notice failed:', err.message));

  res.json({ success: true, data: cancelled });
}));

// ─── Mentor applications ────────────────────────────────

app.post('/api/mentors/apply', requireVerified, wrap(async (req, res) => {
  const appData = req.body;

  // Apply as yourself. The profile is owned by the university's pseudonym,
  // not the address — the address is only where mail goes, and a mentor
  // changing it must not hand their profile and payouts to whoever verifies
  // with it next.
  const email = req.session.email;
  const authIdentifier = req.session.authIdentifier;

  if (!authIdentifier) {
    return res.status(403).json({
      success: false,
      error: 'Mentor profiles require university sign-in. Please verify with your university first.'
    });
  }

  if (!appData.name || !appData.university) {
    return res.status(400).json({
      success: false,
      error: 'Missing required application fields: name, university'
    });
  }

  const result = createMentorApplication({ ...appData, email, authIdentifier });
  const session = createSession({ email, mentorId: result.mentor.id, authIdentifier });

  res.status(201).json({
    success: true,
    message: 'Your mentor profile is live.',
    data: publicMentor(result.mentor),
    mentor: publicMentor(result.mentor),
    sessionToken: session.token
  });
}));

app.get('/api/admin/applications', requireAdmin, (req, res) => {
  const applications = getMentorApplications();
  res.json({ success: true, count: applications.length, data: applications });
});

// There is no approval step: mentors activate the moment their .ac.uk address
// is verified. The old approve endpoint minted a *second* mentor record for an
// already-live mentor, producing duplicate cards in browse.

app.get('/api/admin/suggestions', requireAdmin, (req, res) => {
  res.json({ success: true, data: getSuggestions() });
});

// ─── Uploads ────────────────────────────────────────────

/**
 * Pitch video upload. Accepts an in-browser recording or a chosen file, and
 * returns a public URL — these play on profiles for every visitor.
 */
/**
 * Resolves a mentor's stored pitchVideoUrl to a file we are allowed to delete.
 *
 * The field is writable by the mentor through PUT /api/mentors/:id, so it is
 * untrusted input even though it lives in our own record. basename() keeps the
 * path inside VIDEO_DIR, but VIDEO_DIR holds every mentor's video and the
 * filenames are public — so confinement alone would let one mentor delete
 * another's take. The filename must also be one THIS mentor's upload produced.
 */
function ownPitchVideoPath(mentorId, url) {
  const name = path.basename(String(url || ''));
  const ext = path.extname(name).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(ext)) return null;

  // Filenames are minted as pitch-<mentorId>-<timestamp>-<8 hex><ext>.
  const parts = name.slice(0, -ext.length).split('-');
  if (parts.length !== 4) return null;
  if (parts[0] !== 'pitch') return null;
  if (parts[1] !== String(Number(mentorId))) return null;
  if (!/^[0-9]+$/.test(parts[2])) return null;
  if (!/^[0-9a-f]{8}$/.test(parts[3])) return null;

  const full = path.join(VIDEO_DIR, name);
  return full.startsWith(VIDEO_DIR) ? full : null;
}

app.post('/api/upload/pitch-video', requireMentor,
  rateLimit({ max: 6, windowMs: 60_000, key: byEmail }), (req, res) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'That video is over 100MB. Record one here instead — it compresses as it records — or trim the file first.',
          tooLarge: true
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'No video was uploaded.' });

    // Verify the bytes, not the label, and bin anything that is not a video.
    if (!looksLikeVideo(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* best effort */ }
      return res.status(400).json({
        success: false,
        error: 'That file is not a readable video. Use MP4, WebM or MOV — or record one here instead.'
      });
    }

    const videoUrl = `/uploads/pitch_videos/${req.file.filename}`;

    // Reclaim the take this one replaces. Without it every re-record left a
    // file behind, and the volume this fills is the same one data.json is
    // written to — so it ends as an outage, not just wasted disk.
    const previous = getMentorById(req.session.mentorId)?.pitchVideoUrl;
    if (previous && previous !== videoUrl) {
      const stale = ownPitchVideoPath(req.session.mentorId, previous);
      if (stale && fs.existsSync(stale)) {
        try { fs.unlinkSync(stale); } catch (e) { /* best effort */ }
      }
    }

    // Attach it to the mentor straight away: a video that uploaded but was
    // never saved to the profile is the most annoying way to lose a take.
    let mentor = null;
    try {
      mentor = updateMentorProfile(req.session.mentorId, { pitchVideoUrl: videoUrl });
    } catch (e) {
      console.warn('[upload] could not attach pitch video:', e.message);
    }

    res.json({
      success: true,
      videoUrl,
      fileName: req.file.filename,
      size: req.file.size,
      attached: Boolean(mentor)
    });
  });
});

/** Removes a mentor's pitch video, file and all. */
app.delete('/api/upload/pitch-video', requireMentor,
  rateLimit({ max: 12, windowMs: 60_000, key: byEmail }), (req, res) => {
  const mentor = getMentorById(req.session.mentorId);
  const current = mentor?.pitchVideoUrl || '';

  const filePath = ownPitchVideoPath(req.session.mentorId, current);
  if (filePath) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('[upload] could not delete pitch video file:', e.message);
    }
  }

  updateMentorProfile(req.session.mentorId, { pitchVideoUrl: '' });
  res.json({ success: true });
});

app.post('/api/upload/document', requireMentor,
  rateLimit({ max: 12, windowMs: 60_000, key: byEmail }), (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size exceeds the 10MB limit.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file was uploaded.' });

    const ext = path.extname(req.file.originalname).toLowerCase();

    res.json({
      success: true,
      // Opaque handle. There is no public URL for this file.
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      format: FORMAT_BY_EXT[ext] || 'PDF'
    });
  });
});

// ─── Resources ──────────────────────────────────────────

/** Listings never include fileName, so the storage path is not discoverable. */
function listedResource(r) {
  const { fileName, fileUrl, ...rest } = r;
  return rest;
}

app.get('/api/resources', (req, res) => {
  const resources = getAllResources();
  const owned = req.session ? getEntitlementsForEmail(req.session.email) : [];
  res.json({
    success: true,
    count: resources.length,
    data: resources.map(r => ({ ...listedResource(r), unlocked: r.type !== 'paid' ? false : owned.includes(r.id) })),
    entitlements: owned
  });
});

app.post('/api/resources', requireMentor, (req, res) => {
  // Freabies can go live immediately; a price requires somewhere to send the
  // money, otherwise a student could pay for a playbook nobody can be paid for.
  if (req.body.type === 'paid' && !canMentorSell(req.session.mentorId)) {
    return res.status(409).json({
      success: false,
      error: 'Set up payouts before pricing a playbook — otherwise we have nowhere to send your earnings. You can publish it as a free freabie now and add a price later.',
      payoutsRequired: true
    });
  }

  // A mentor publishes to their own account, whatever the body claims.
  const resource = createResource(req.body, req.session.mentorId);
  res.status(201).json({ success: true, data: listedResource(resource) });
});

app.put('/api/resources/:id', requireMentor, (req, res) => {
  const resource = getResourceById(req.params.id);
  if (!resource) return res.status(404).json({ success: false, error: 'Resource not found.' });
  if (resource.mentorId !== req.session.mentorId && !req.session.isAdmin) {
    return res.status(403).json({ success: false, error: 'You can only edit your own resources.' });
  }
  if (req.body.type === 'paid' && !canMentorSell(req.session.mentorId)) {
    return res.status(409).json({
      success: false,
      error: 'Set up payouts before pricing a playbook — otherwise we have nowhere to send your earnings.',
      payoutsRequired: true
    });
  }
  res.json({ success: true, data: listedResource(updateResource(req.params.id, req.body)) });
});

app.delete('/api/resources/:id', requireMentor, (req, res) => {
  const resource = getResourceById(req.params.id);
  if (!resource) return res.status(404).json({ success: false, error: 'Resource not found.' });
  if (resource.mentorId !== req.session.mentorId && !req.session.isAdmin) {
    return res.status(403).json({ success: false, error: 'You can only delete your own resources.' });
  }

  // Drop the record first, then the bytes: if the unlink fails the resource is
  // still gone, and the sweep below reclaims the file later.
  const result = deleteResource(req.params.id);

  if (resource.fileName) {
    const filePath = path.join(UPLOADS_DIR, path.basename(resource.fileName));
    if (filePath.startsWith(UPLOADS_DIR)) {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('[resources] could not delete file:', e.message);
      }
    }
  }

  res.json({ success: true, data: result });
});

/** Claim a freabie. Verified students only, so downloads stay attributable. */
app.post('/api/resources/:id/claim', requireVerified, (req, res) => {
  const resource = getResourceById(req.params.id);
  if (!resource) return res.status(404).json({ success: false, error: 'Resource not found.' });
  if (resource.type === 'paid') {
    return res.status(402).json({ success: false, error: 'This playbook needs to be purchased first.' });
  }

  grantEntitlement({ email: req.session.email, resourceId: resource.id, reason: 'free' });
  res.json({ success: true, data: { resourceId: resource.id, unlocked: true } });
});

/**
 * The only way to get a resource file. Streams from disk after checking that
 * this verified email actually holds an entitlement.
 */
app.get('/api/resources/:id/download', requireVerified, (req, res) => {
  const resource = getResourceById(req.params.id);
  if (!resource) return res.status(404).json({ success: false, error: 'Resource not found.' });

  const isOwner = req.session.mentorId === resource.mentorId;
  const entitled = isOwner || req.session.isAdmin || hasEntitlement(req.session.email, resource.id);

  if (!entitled) {
    if (resource.type === 'paid') {
      return res.status(402).json({
        success: false,
        error: 'Purchase this playbook to download it.',
        requiresPurchase: true
      });
    }
    // Free resource the student has not claimed yet — grant on the spot.
    grantEntitlement({ email: req.session.email, resourceId: resource.id, reason: 'free' });
  }

  if (!resource.fileName) {
    return res.status(404).json({ success: false, error: 'This resource has no file attached.' });
  }

  // basename() defends against any traversal that reached the record.
  const filePath = path.join(UPLOADS_DIR, path.basename(resource.fileName));
  if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'The file for this resource is missing.' });
  }

  recordDownload(resource.id);

  const ext = path.extname(filePath).toLowerCase();
  const safeTitle = resource.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  res.setHeader('Content-Type', MIME_BY_EXT[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle || 'frea-resource'}${ext}"`);
  fs.createReadStream(filePath).pipe(res);
});

// ─── Checkout ───────────────────────────────────────────

app.get('/api/payments/config', (req, res) => {
  res.json({
    success: true,
    data: { enabled: stripeConfigured(), feeRatePercent: Math.round(feeRate() * 100), currency: 'GBP' }
  });
});

/**
 * Starts or resumes Stripe-hosted payout onboarding. Bank details and identity
 * documents go straight to Stripe — they never reach frea.
 */
app.post('/api/connect/onboard', requireMentor, wrap(async (req, res) => {
  if (!stripeConfigured()) {
    return res.status(503).json({ success: false, error: 'Payments are not switched on for this server yet.' });
  }

  const mentor = getMentorById(req.session.mentorId);
  if (!mentor) return res.status(404).json({ success: false, error: 'Mentor not found.' });

  let accountId = mentor.stripeAccountId;
  if (!accountId) {
    accountId = await createConnectAccount({
      email: mentor.email || req.session.email,
      displayName: mentor.name
    });
    setMentorPayoutAccount(mentor.id, { accountId, payoutsEnabled: false });
  }

  const url = await createAccountLink({ accountId, baseUrl: baseUrl() });
  res.json({ success: true, data: { url } });
}));

/** Current payout readiness, refreshed from Stripe. */
app.get('/api/connect/status', requireMentor, wrap(async (req, res) => {
  const mentor = getMentorById(req.session.mentorId);
  if (!mentor) return res.status(404).json({ success: false, error: 'Mentor not found.' });

  if (!stripeConfigured() || !mentor.stripeAccountId) {
    return res.json({
      success: true,
      data: {
        configured: stripeConfigured(),
        started: false,
        payoutsEnabled: false,
        currentlyDue: []
      }
    });
  }

  const status = await getAccountStatus(mentor.stripeAccountId);
  setMentorPayoutAccount(mentor.id, {
    payoutsEnabled: status.payoutsEnabled,
    currentlyDue: status.currentlyDue
  });

  res.json({
    success: true,
    data: {
      configured: true,
      started: true,
      payoutsEnabled: status.payoutsEnabled,
      currentlyDue: status.currentlyDue,
      transfersStatus: status.transfersStatus
    }
  });
}));

/** Opens a Stripe Checkout Session for one playbook. */
app.post('/api/checkout', requireVerified, wrap(async (req, res) => {
  const { resourceId } = req.body;
  if (!resourceId) {
    return res.status(400).json({ success: false, error: 'resourceId is required.' });
  }
  if (!stripeConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Card payments are not switched on for this server yet.'
    });
  }

  const resource = getResourceById(resourceId);
  if (!resource) return res.status(404).json({ success: false, error: 'Playbook not found.' });

  // Never take money we cannot forward. If the mentor has not finished payout
  // onboarding, the sale is refused rather than held in limbo.
  const mentor = getMentorById(resource.mentorId);
  if (!mentor?.stripeAccountId || !mentor.payoutsEnabled) {
    return res.status(409).json({
      success: false,
      error: `${mentor?.name || 'This mentor'} hasn't finished setting up payouts yet, so this playbook can't be bought right now. Their free resources are still available.`,
      payoutsPending: true
    });
  }

  const order = createPendingOrder({ resourceId, buyerEmail: req.session.email });
  const session = await createCheckoutSession({
    order, resource, baseUrl: baseUrl(), destinationAccount: mentor.stripeAccountId
  });
  attachStripeSession(order.id, session.id);

  res.json({
    success: true,
    data: {
      orderId: order.id,
      checkoutUrl: session.url,
      totalAmount: order.totalAmount,
      mentorPayout: order.mentorPayout,
      freaFee: order.freaFee
    }
  });
}));

/**
 * The browser's return trip. Asks Stripe directly rather than trusting the
 * query string, so this is safe even if the webhook has not landed yet.
 */
app.get('/api/checkout/:orderId/status', requireVerified, wrap(async (req, res) => {
  const order = getOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });
  if (order.buyerEmail !== req.session.email && !req.session.isAdmin) {
    return res.status(403).json({ success: false, error: 'This is not your order.' });
  }

  if (order.status !== 'paid' && order.stripeSessionId && stripeConfigured()) {
    try {
      const { paid, paymentIntentId } = await isSessionPaid(order.stripeSessionId);
      if (paid) await finalisePaidOrder(order.id, paymentIntentId);
    } catch (err) {
      console.warn('[checkout] status lookup failed:', err.message);
    }
  }

  const fresh = getOrderById(req.params.orderId);
  res.json({
    success: true,
    data: {
      orderId: fresh.id,
      status: fresh.status,
      resourceId: fresh.resourceId,
      resourceTitle: fresh.resourceTitle,
      totalAmount: fresh.totalAmount,
      unlocked: fresh.status === 'paid'
    }
  });
}));

/** Marks paid, grants access and sends both emails. Safe to call twice. */
async function finalisePaidOrder(orderId, paymentIntentId = null) {
  const before = getOrderById(orderId);
  if (!before || before.status === 'paid') return before;

  const order = markOrderPaid(orderId, { stripePaymentIntentId: paymentIntentId });
  const resource = getResourceById(order.resourceId);
  const mentor = getMentorById(order.mentorId);

  if (resource) {
    sendPurchaseReceiptEmail({ order, resource })
      .catch(err => console.warn('[email] receipt failed:', err.message));
  }
  if (mentor) {
    sendSaleNotificationEmail({ order, mentor })
      .catch(err => console.warn('[email] sale notification failed:', err.message));
  }
  return order;
}

async function handleStripeWebhook(req, res) {
  let event;
  try {
    event = constructWebhookEvent(req.body, req.headers['stripe-signature']);
  } catch (err) {
    console.error('[stripe] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (orderId && session.payment_status === 'paid') {
        await finalisePaidOrder(
          orderId,
          typeof session.payment_intent === 'string' ? session.payment_intent : null
        );
      }
    }

    // Payout readiness changes on Stripe's schedule, not ours — a mentor can
    // be verified (or restricted) hours after they finish onboarding. Without
    // this, they would stay blocked from pricing until they happened to reload.
    // Accounts v2 emits several event names as an account progresses through
    // verification (and Stripe adds more over time). Rather than enumerate
    // them, react to anything account-shaped and re-fetch the real status —
    // the status call is the source of truth, the event is only a nudge.
    const isAccountEvent = event.type === 'account.updated'
      || event.type.startsWith('v2.core.account');

    if (isAccountEvent) {
      // Works for both payload styles: Accounts v2 sends thin events that carry
      // only a reference, so the full object is fetched from the status call
      // below rather than read off the event.
      const accountId = accountIdFromEvent(event);
      const mentor = accountId ? findMentorByStripeAccount(accountId) : null;

      if (mentor) {
        try {
          const status = await getAccountStatus(accountId);
          setMentorPayoutAccount(mentor.id, {
            payoutsEnabled: status.payoutsEnabled,
            currentlyDue: status.currentlyDue
          });
          console.log(`[stripe] payouts ${status.payoutsEnabled ? 'enabled' : 'pending'} for mentor ${mentor.id}`);
        } catch (statusErr) {
          console.warn('[stripe] could not refresh account status:', statusErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[stripe] Webhook handling failed:', err.message);
    // 500 asks Stripe to retry, which is what we want for a transient failure.
    return res.status(500).json({ received: false });
  }

  res.json({ received: true });
}

// ─── Suggestions ────────────────────────────────────────

app.post('/api/suggestions', rateLimit({ max: 5, windowMs: 60_000 }), (req, res) => {
  const suggestion = createSuggestion({
    type: req.body.type,
    university: req.body.university,
    course: req.body.course,
    text: req.body.text,
    email: req.body.email || req.session?.email || ''
  });
  res.status(201).json({ success: true, data: suggestion });
});

// ─── Reports ────────────────────────────────────────────

app.post('/api/reports', requireVerified, rateLimit({ max: 10, windowMs: 60_000, key: byEmail }), (req, res) => {
  const report = createReport({
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    reason: req.body.reason,
    detail: req.body.detail,
    reporterEmail: req.session.email
  });
  res.status(201).json({
    success: true,
    message: 'Thanks — the frea team will take a look.',
    data: { id: report.id }
  });
});

// ─── Backups ────────────────────────────────────────────
//
// Rotation on the volume covers a bad logical write. It does not cover losing
// the volume, and nothing on the box can — that needs a copy pulled off it,
// which is what the download route is for. Point a scheduled job at it:
//
//   curl -fsS -H "Authorization: Bearer $FREA_ADMIN_TOKEN" //        https://joinfrea.com/api/admin/backup -o frea-$(date +%F).json

/**
 * Mail hand-off diagnostics.
 *
 * Admin-only because it lists recipient domains and provider message ids.
 * Neither identifies a student on its own, but together they map who has been
 * signing up from where, which is not something to serve anonymously.
 *
 * This survives deploys, unlike the in-memory `lastSend` on /api/health, so a
 * report of slow mail can be checked after the fact rather than only while the
 * sending process is still alive.
 */
app.get('/api/admin/mail-log', requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 500);
  res.json({
    success: true,
    data: {
      status: mailStatus(),
      handoff: mailHandoffStats(),
      recent: recentMailHandoffs(limit)
    }
  });
});

app.get('/api/admin/backups', requireAdmin, (req, res) => {
  res.json({ success: true, data: { directory: BACKUP_DIR, snapshots: listBackups() } });
});

app.post('/api/admin/backups', requireAdmin, (req, res) => {
  try {
    res.json({ success: true, data: takeBackup({ force: true }) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * The live database, as a file.
 *
 * It contains everything, session tokens included, so it is admin-only and
 * must be treated as a credential once downloaded.
 */
app.get('/api/admin/backup', requireAdmin, (req, res) => {
  if (!fs.existsSync(DB_FILE)) {
    return res.status(404).json({ success: false, error: 'No database file yet.' });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="frea-backup-${stamp}.json"`);
  fs.createReadStream(DB_FILE).pipe(res);
});

app.get('/api/admin/reports', requireAdmin, (req, res) => {
  res.json({ success: true, data: getReports() });
});

app.post('/api/admin/reports/:id/resolve', requireAdmin, (req, res) => {
  res.json({ success: true, data: resolveReport(req.params.id) });
});

// ─── Crawlers ───────────────────────────────────────────
//
// Served from the API so the sitemap reflects live data — every mentor and
// every resource gets a real, discoverable URL. Personal and transactional
// pages are excluded rather than merely unlinked.

app.get('/robots.txt', (req, res) => {
  const origin = baseUrl();
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    '',
    '# Personal, transactional or admin-only — nothing here belongs in an index',
    'Disallow: /my-sessions',
    'Disallow: /mentor-dashboard',
    'Disallow: /admin',
    'Disallow: /verify',
    'Disallow: /cancel',
    'Disallow: /checkout-complete',
    'Disallow: /api/',
    'Disallow: /uploads/digital_products/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    ''
  ].join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
  const origin = baseUrl();
  const db = loadDb();
  const today = new Date().toISOString().slice(0, 10);

  const escapeXml = (value) => String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/browse', priority: '0.9', changefreq: 'daily' },
    { loc: '/resources', priority: '0.9', changefreq: 'daily' },
    { loc: '/become-a-mentor', priority: '0.7', changefreq: 'weekly' }
  ];

  // One URL per mentor. This is the long tail — a student searching a course
  // or a company should be able to land directly on the person who did it.
  db.mentors.forEach(m => {
    urls.push({
      loc: `/mentor/${m.id}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: (m.payoutUpdatedAt || '').slice(0, 10) || today
    });
  });

  const body = urls.map(u => [
    '  <url>',
    `    <loc>${escapeXml(origin + u.loc)}</loc>`,
    `    <lastmod>${u.lastmod || today}</lastmod>`,
    `    <changefreq>${u.changefreq}</changefreq>`,
    `    <priority>${u.priority}</priority>`,
    '  </url>'
  ].join('\n')).join('\n');

  res.type('application/xml').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + `${body}\n`
    + '</urlset>\n'
  );
});

// ─── Stats ──────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  res.json({ success: true, data: getStats() });
});

// ─── Static SPA in production ───────────────────────────
//
// Serving the built front end from the same origin as the API is what makes
// authenticated downloads work without CORS gymnastics.

// DIST_DIR imported from paths.js
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log('[frea] Serving built SPA from /dist');
}

// ─── Errors ─────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, error: `No such endpoint: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  // Validation failures from the data layer are the caller's fault (400);
  // anything unexpected is ours (500) and gets logged in full.
  const isValidation = err instanceof Error && !err.status && err.message && err.message.length < 300;
  const status = err.status || (isValidation ? 400 : 500);

  if (status >= 500) console.error('[frea] Unhandled error:', err);
  else console.warn('[frea] Rejected request:', err.message);

  res.status(status).json({
    success: false,
    error: status >= 500 ? 'Something went wrong on our end. Please try again.' : err.message
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[frea] Unhandled promise rejection:', reason);
});

/**
 * Generates the demo documents on a genuinely first boot.
 *
 * The seed catalogue deliberately ships with no resources: a resource is only
 * useful if its file exists, and uploads live on the volume rather than in the
 * repo. So the files are produced here instead.
 *
 * Gated on the database not having existed before, not on the catalogue being
 * empty — otherwise `reset:launch` would be undone by the next restart.
 */
async function seedDemoContentOnFirstBoot(freshDatabase) {
  if (!freshDatabase) return;
  if (process.env.SEED_DEMO_CONTENT === 'false') return;

  try {
    const { seedDemoResources } = await import('../scripts/seed-resources.mjs');
    await seedDemoResources({ quiet: true });
    console.log('[frea] First boot — generated demo resources on the volume.');
    console.log('       Run `npm run reset:launch` to clear them before real users.');
  } catch (err) {
    console.warn('[frea] Could not generate demo resources:', err.message);
  }
}

// ─── Reclaiming abandoned uploads ───────────────────────
//
// A mentor can upload a document and never publish it — the file lands on the
// volume with nothing referencing it and nothing to remove it. The same volume
// holds data.json, so left alone this ends as a failed write, not just wasted
// disk. Anything unreferenced and older than the grace period goes.
//
// The grace period matters: a file uploaded seconds ago is mid-publish and has
// no resource pointing at it yet.
const UPLOAD_GRACE_MS = 24 * 60 * 60 * 1000;

function sweepOrphanedUploads() {
  try {
    const referenced = new Set(
      getAllResources().map(r => r.fileName).filter(Boolean).map(f => path.basename(f))
    );
    const now = Date.now();
    let removed = 0;

    for (const name of fs.readdirSync(UPLOADS_DIR)) {
      if (name.startsWith('.') || referenced.has(name)) continue;
      const full = path.join(UPLOADS_DIR, name);
      if (!full.startsWith(UPLOADS_DIR)) continue;
      try {
        const stat = fs.statSync(full);
        if (!stat.isFile() || now - stat.mtimeMs < UPLOAD_GRACE_MS) continue;
        fs.unlinkSync(full);
        removed += 1;
      } catch (_) { /* a file that vanished under us is already handled */ }
    }

    if (removed) console.log(`[uploads] reclaimed ${removed} unreferenced file(s)`);
  } catch (err) {
    console.warn('[uploads] sweep failed:', err.message);
  }
}

setInterval(sweepOrphanedUploads, 6 * 60 * 60 * 1000).unref();

const databaseExistedAtBoot = fs.existsSync(DB_FILE);

app.listen(PORT, async () => {
  console.log(`[frea backend] http://localhost:${PORT}`);
  console.log(`[frea backend] public base URL: ${baseUrl()}`);
  console.log(`[frea backend] data directory: ${DATA_DIR}`);
  if (!process.env.DATA_DIR && process.env.NODE_ENV === 'production') {
    console.log('[frea backend] WARNING: DATA_DIR is not set. On a hosted platform');
    console.log('               this writes into the app directory, which a deploy');
    console.log('               replaces — every booking and upload would be lost.');
  }
  if (!stripeConfigured()) {
    console.log('[frea backend] Stripe not configured — paid playbooks will be refused at checkout.');
  }
  if (!process.env.ADMIN_EMAILS) {
    console.log('[frea backend] ADMIN_EMAILS not set — the admin dashboard is closed to everyone.');
  }

  // Touch the database so it exists, then fill in demo content if this is the
  // very first boot on a fresh volume.
  loadDb();
  await seedDemoContentOnFirstBoot(!databaseExistedAtBoot);

  // After seeding, so the first snapshot is of a database worth restoring.
  startBackupSchedule();

  // One connection, so an unreachable mail server shows up in the logs and on
  // /api/health at boot rather than as a hung sign-up.
  probeSmtp();
});

export default app;
