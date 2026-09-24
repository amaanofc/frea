// ─────────────────────────────────────────────
// frea — Sessions, roles & route guards
// ─────────────────────────────────────────────
//
// One session table covers all three actors. A session is created only after a
// real one-time code has been proven against the email it was sent to.
//
//   student  university identity, no mentor record -> can book, buy, download
//   mentor   university identity + mentor record   -> can also edit own profile
//   admin    email listed in ADMIN_EMAILS          -> can also review applications

import crypto from 'crypto';
import { loadDb, saveDb } from './db.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isAdminEmail(email) {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return false;
  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(clean);
}

/**
 * `authIdentifier` is the university's stable pseudonym for this person, set
 * on every session opened through university sign-in.
 *
 * It rides on the session because it, not the email, is now the identity:
 * the address is contact information the student chooses and can change,
 * while the pseudonym is what the institution vouched for. Anything deciding
 * who someone *is* — which mentor profile is theirs, whether they are
 * blocked — should read this. Admin sessions, which still come from an email
 * code, carry null.
 */
export function createSession({ email, mentorId = null, authIdentifier = null, emailProven = false }) {
  const db = loadDb();
  const clean = (email || '').trim().toLowerCase();
  const token = crypto.randomBytes(32).toString('hex');

  db.sessions = db.sessions || [];
  // Prune this email's expired sessions so the table cannot grow without bound.
  const now = Date.now();
  db.sessions = db.sessions.filter(s => s.expiresAt > now);

  const session = {
    token,
    email: clean,
    mentorId: mentorId == null ? null : parseInt(mentorId, 10),
    authIdentifier: authIdentifier || null,
    // Administrator only ever on a session whose address was proven by a code
    // to that inbox. Deriving it from any address the caller supplied is how
    // nominating the admin's address during registration handed out admin.
    isAdmin: Boolean(emailProven) && isAdminEmail(clean),
    emailProven: Boolean(emailProven),
    createdAt: new Date().toISOString(),
    expiresAt: now + SESSION_TTL_MS
  };

  db.sessions.push(session);
  saveDb(db);
  return session;
}

export function getSession(token) {
  if (!token) return null;
  const db = loadDb();
  const session = (db.sessions || []).find(s => s.token === token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) return null;
  // Admin list is env-driven, so re-evaluate rather than trusting the stored
  // flag — but never promote a session whose address was never proven.
  return { ...session, isAdmin: Boolean(session.emailProven) && isAdminEmail(session.email) };
}

export function destroySession(token) {
  const db = loadDb();
  db.sessions = (db.sessions || []).filter(s => s.token !== token);
  saveDb(db);
  return { success: true };
}

function bearer(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Attaches req.session when a valid token is present. Never rejects. */
export function attachSession(req, res, next) {
  req.session = getSession(bearer(req));
  next();
}

/** A session backed by the university's stable Studid identity. */
export function requireVerified(req, res, next) {
  if (!req.session) {
    return res.status(401).json({
      success: false,
      error: 'Please verify with your university to continue.',
      needsVerification: true
    });
  }
  if (!req.session.authIdentifier) {
    return res.status(403).json({
      success: false,
      error: 'Please verify with your university before using this feature.',
      needsVerification: true,
      needsIdentity: true
    });
  }
  next();
}

function canonicalMentorForSession(session) {
  if (!session?.mentorId || !session.authIdentifier) return null;
  const db = loadDb();
  return db.mentors.find(mentor =>
    parseInt(mentor.id, 10) === parseInt(session.mentorId, 10)
    && mentor.authIdentifier === session.authIdentifier
  ) || null;
}

/** A signed-in mentor whose profile is owned by the same Studid identity. */
export function requireMentor(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ success: false, error: 'Please sign in to your mentor account.' });
  }
  if (!req.session.authIdentifier) {
    const hasUnboundMentor = Boolean(req.session.mentorId);
    return res.status(403).json({
      success: false,
      error: hasUnboundMentor
        ? 'Please claim your legacy mentor account with your university identity first.'
        : 'This action requires a mentor account.',
      needsIdentity: hasUnboundMentor,
      legacyClaimRequired: hasUnboundMentor
    });
  }
  if (!canonicalMentorForSession(req.session)) {
    return res.status(403).json({
      success: false,
      error: 'This action requires a university-backed mentor account.',
      needsIdentity: false,
      legacyClaimRequired: Boolean(req.session.mentorId)
    });
  }
  next();
}

/**
 * A mentor acting on their own record (or an admin acting on anyone's).
 * Use on every /api/mentors/:id mutation.
 */
export function requireSelfOrAdmin(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ success: false, error: 'Please sign in to your mentor account.' });
  }
  if (req.session.isAdmin) return next();
  const targetId = parseInt(req.params.id, 10);
  if (req.session.mentorId === targetId && canonicalMentorForSession(req.session)) return next();
  return res.status(403).json({
    success: false,
    error: 'You can only manage a university-backed mentor profile.',
    needsIdentity: !req.session.authIdentifier,
    legacyClaimRequired: !req.session.authIdentifier
  });
}

/** An admin on the ADMIN_EMAILS list. */
export function requireAdmin(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ success: false, error: 'Admin sign-in required.' });
  }
  if (!req.session.isAdmin) {
    return res.status(403).json({ success: false, error: 'This account is not an frea administrator.' });
  }
  next();
}

export { SESSION_TTL_MS };
