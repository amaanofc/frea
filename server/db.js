// ─────────────────────────────────────────────
// frea — Backend Database & Dynamic Scheduling Engine
// ─────────────────────────────────────────────

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_FILE, SEED_FILE } from './paths.js';
import {
  normaliseSchedule,
  toCanonicalDate,
  toCanonicalTime,
  toDisplayDate,
  toDisplayTime,
  isCanonicalDate,
  isPastDate,
  isSlotPast,
  toDisplayTimeRange,
  dayIndexFor,
  ukTimezoneLabel,
  DAY_SHORT,
  MONTH_SHORT
} from './time.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Paths come from paths.js so a deployed volume can hold them.

// Default initial mentors with recurring weekly schedule rules
const INITIAL_MENTORS = [
  {
    id: 1,
    name: "Aanya Sharma",
    year: "4th year (MEng)",
    major: "Computer Science",
    university: "Imperial College London",
    bio: "founded a dev tools startup in 2nd year that got backed by Y Combinator (S23). incoming software engineer at Stripe London. happy to roast your tech CV, do mock technical screens, or talk about launching a side project at uni.",
    topTip: "don't grind 500 leetcodes. pick 2 projects you can passionately defend for 20 mins.",
    topTipColor: "yellow",
    achievements: ["yc-alumni", "stripe-offer", "hackathon-winner"],
    helpsWith: ["tech interviews", "spring weeks", "side projects", "leetcoding"],
    rating: 4.9,
    callsCompleted: 47,
    // Recurring days: 1=Mon, 3=Wed, 5=Fri
    weeklySchedule: {
      1: ["10:00 AM", "2:30 PM", "4:30 PM"],
      3: ["11:00 AM", "3:00 PM"],
      5: ["9:30 AM", "1:00 PM", "5:00 PM"]
    },
    color: "blue"
  },
  {
    id: 2,
    name: "Callum Davies",
    year: "3rd year (BSc)",
    major: "Economics & Finance",
    university: "LSE",
    bio: "landed Spring Weeks at Goldman Sachs and Morgan Stanley, converting into an investment banking summer analyst offer. non-target school before transferring to LSE. let's talk cold emailing, commercial awareness, and passing numerical tests.",
    topTip: "first year counts 0% towards your degree, but 100% for Spring Weeks. start applications in September.",
    topTipColor: "mint",
    achievements: ["goldman-intern", "spring-week-alum", "first-class-honours"],
    helpsWith: ["spring weeks", "investment banking", "cv roast", "assessment centres"],
    rating: 4.8,
    callsCompleted: 62,
    // Recurring days: 2=Tue, 4=Thu, 6=Sat
    weeklySchedule: {
      2: ["10:30 AM", "12:00 PM"],
      4: ["2:00 PM", "4:30 PM", "6:00 PM"],
      6: ["11:00 AM", "1:30 PM"]
    },
    color: "orange"
  },
  {
    id: 3,
    name: "Priya Nair",
    year: "recent grad (MSc)",
    major: "Human-Computer Interaction",
    university: "UCL",
    bio: "switched from Psychology into UX Research, now at Google's King's Cross office. built my portfolio through student societies and voluntary design sprints. let's break down how to transition into tech without a traditional CS degree.",
    topTip: "your design portfolio doesn't need 20 case studies. it needs 2 projects where you clearly articulate trade-offs.",
    topTipColor: "blush",
    achievements: ["google-offer", "published-researcher", "society-president"],
    helpsWith: ["ux research", "career switching", "portfolio review", "tech transition"],
    rating: 5.0,
    callsCompleted: 31,
    // Recurring days: 1=Mon, 3=Wed, 0=Sun
    weeklySchedule: {
      1: ["5:30 PM", "6:30 PM"],
      3: ["6:00 PM", "7:00 PM"],
      0: ["10:00 AM", "11:30 AM", "1:00 PM"]
    },
    color: "pink"
  },
  {
    id: 4,
    name: "Noah Adebayo",
    year: "4th year (MEng)",
    major: "Mechanical Engineering",
    university: "University of Bristol",
    bio: "failed my 1st year thermofluids exam with a 38%, panicked, overhauled my study system with active recall and finished 2nd year with an 81% 1st. now incoming on Dyson's graduate scheme. let me share what actually worked.",
    topTip: "rereading lecture slides is a trap. do past papers from week 3, even if you have to cheat on the mark scheme at first.",
    topTipColor: "sky",
    achievements: ["first-class-honours", "dyson-grad-scheme", "formula-student-lead"],
    helpsWith: ["gpa comeback", "revision systems", "engineering careers", "exam technique"],
    rating: 4.9,
    callsCompleted: 55,
    // Recurring days: 2=Tue, 4=Thu, 6=Sat
    weeklySchedule: {
      2: ["9:30 AM", "11:00 AM"],
      4: ["3:00 PM", "5:00 PM"],
      6: ["10:00 AM", "2:00 PM"]
    },
    color: "green"
  },
  {
    id: 5,
    name: "Oliver Zhang",
    year: "3rd year (BA)",
    major: "Law (Jurisprudence)",
    university: "University of Oxford",
    bio: "president of the Oxford Law Society and incoming vacation scheme student at Clifford Chance. happy to review training contract applications, discuss Watson Glaser prep, or share how to tackle weekly tutorial essays under pressure.",
    topTip: "for law essays: never just summarize the statute. take a bold stance in your first paragraph and defend it ruthlessly.",
    topTipColor: "yellow",
    achievements: ["magic-circle-offer", "society-president", "first-class-honours"],
    helpsWith: ["vacation schemes", "commercial law", "watson glaser", "essay technique"],
    rating: 4.8,
    callsCompleted: 38,
    // Recurring days: 1=Mon, 3=Wed, 5=Fri
    weeklySchedule: {
      1: ["4:00 PM", "5:30 PM"],
      3: ["2:00 PM", "3:30 PM"],
      5: ["11:00 AM", "1:00 PM"]
    },
    color: "orange"
  },
  {
    id: 6,
    name: "Maya Patel",
    year: "recent grad (BSc)",
    major: "Product Design Engineering",
    university: "University of Bath",
    bio: "spent my placement year designing aerodynamic components at McLaren Racing, then won the national James Dyson Award. let's talk landing placement years, engineering portfolios, and converting internships into grad roles.",
    topTip: "engineering recruiters skim in 15 seconds. lead with physical CAD renders and hardware you actually built and tested.",
    topTipColor: "mint",
    achievements: ["mclaren-placement", "design-award", "patent-filed"],
    helpsWith: ["placement years", "cad portfolio", "formula student", "aerospace"],
    rating: 5.0,
    callsCompleted: 44,
    // Recurring days: 2=Tue, 5=Fri, 0=Sun
    weeklySchedule: {
      2: ["1:00 PM", "3:00 PM"],
      5: ["10:00 AM", "12:30 PM"],
      0: ["3:00 PM", "4:30 PM"]
    },
    color: "blue"
  },
  {
    id: 7,
    name: "Dr. Tariq Al-Mansoor",
    year: "recent grad (MBChB)",
    major: "Medicine",
    university: "University of Cambridge",
    bio: "finished clinical medical school at Cambridge, published 3 papers in undergraduate neurology, now a junior doctor in London. happy to guide pre-meds on UCAT prep, clinical electives, or medical research as an undergrad.",
    topTip: "for medical research: email junior registrars, not the department head. they actually need someone to do the data analysis.",
    topTipColor: "blush",
    achievements: ["top-of-cohort", "published-researcher", "first-class-honours"],
    helpsWith: ["medicine admissions", "ucat prep", "medical research", "clinical years"],
    rating: 4.9,
    callsCompleted: 73,
    weeklySchedule: {
      3: ["6:00 PM", "7:30 PM"],
      6: ["9:00 AM", "10:30 AM", "12:00 PM"]
    },
    color: "pink"
  },
  {
    id: 8,
    name: "Sophie Lindqvist",
    year: "4th year (MMath)",
    major: "Mathematics & Statistics",
    university: "University of Warwick",
    bio: "incoming quantitative trading intern at Jane Street London. passed 12 rounds of mental math, probability, and market making brainteasers. let's do mock probability screens or talk about non-finance backgrounds breaking into quant.",
    topTip: "quant interviews are 80% expected value calculations. practice mental arithmetic until you calculate poker odds in your sleep.",
    topTipColor: "sky",
    achievements: ["quant-intern", "top-of-cohort", "hackathon-winner"],
    helpsWith: ["quant finance", "probability prep", "maths careers", "jane street screens"],
    rating: 4.9,
    callsCompleted: 51,
    weeklySchedule: {
      1: ["1:30 PM", "3:30 PM"],
      4: ["11:00 AM", "2:00 PM", "4:00 PM"]
    },
    color: "purple"
  },
  {
    id: 9,
    name: "Femi Balogun",
    year: "3rd year (BA)",
    major: "History & Politics",
    university: "University of Manchester",
    bio: "landed the Civil Service Fast Stream and an internship at Chatham House. active in student politics, debate union president, and passionate about social mobility. let's talk civil service tests, policy careers, and persuasive writing.",
    topTip: "civil service situational judgment tests follow very specific behavior frameworks. learn the Civil Service Code inside out.",
    topTipColor: "yellow",
    achievements: ["civil-service-offer", "society-president", "peer-mentor"],
    helpsWith: ["fast stream", "policy careers", "civil service tests", "humanities cv"],
    rating: 4.7,
    callsCompleted: 29,
    weeklySchedule: {
      2: ["4:00 PM", "5:30 PM"],
      4: ["3:00 PM", "4:30 PM"]
    },
    color: "orange"
  },
  {
    id: 10,
    name: "Arjun Mehta",
    year: "recent grad (MSc)",
    major: "Data Science & AI",
    university: "University of Edinburgh",
    bio: "DeepMind scholarship recipient, conducted thesis research on reinforcement learning at The Alan Turing Institute. incoming machine learning engineer. happy to critique ML resumes, research proposals, or guide PhD applications.",
    topTip: "don't just link your GitHub repo. write a 3-bullet README explaining the problem, your architecture, and a 1-click Colab demo.",
    topTipColor: "mint",
    achievements: ["deepmind-scholar", "open-source", "funded-phd"],
    helpsWith: ["machine learning", "phd applications", "research proposals", "deepmind scholarship"],
    rating: 5.0,
    callsCompleted: 40,
    weeklySchedule: {
      1: ["10:00 AM", "12:00 PM"],
      5: ["2:00 PM", "4:00 PM", "6:00 PM"]
    },
    color: "green"
  },
  {
    id: 11,
    name: "Chloe Tremblay",
    year: "4th year (MEng)",
    major: "Electrical Engineering",
    university: "Durham University",
    bio: "designed embedded battery management systems for solar vehicle teams, with internship offers from ARM and Rolls-Royce. let me help you prep for technical hardware interviews and show how to make your university projects stand out.",
    topTip: "bring a physical breadboard or PCB prototype to in-person interviews. engineers instantly respect tactile makers.",
    topTipColor: "sky",
    achievements: ["first-class-honours", "open-source", "patent-filed"],
    helpsWith: ["hardware interviews", "embedded systems", "arm interviews", "durham engineering"],
    rating: 4.8,
    callsCompleted: 35,
    weeklySchedule: {
      2: ["11:00 AM", "1:00 PM"],
      4: ["10:30 AM", "3:30 PM"]
    },
    color: "blue"
  },
  {
    id: 12,
    name: "Hamza Farooq",
    year: "recent grad (BSc)",
    major: "Biochemistry",
    university: "University of St Andrews",
    bio: "first-class degree, completed a summer research fellowship at the Francis Crick Institute in London. incoming fully funded PhD student. let's talk lab placements, cold emailing professors for research spots, and viva prep.",
    topTip: "when cold emailing PIs for summer lab spots, cite their 2025 paper and propose 1 specific assay you want to run for them.",
    topTipColor: "blush",
    achievements: ["crick-institute-alum", "first-class-honours", "funded-phd"],
    helpsWith: ["lab placements", "phd funding", "crick institute", "scientific writing"],
    rating: 4.9,
    callsCompleted: 42,
    weeklySchedule: {
      3: ["2:00 PM", "4:00 PM"],
      0: ["4:00 PM", "5:30 PM"]
    },
    color: "pink"
  }
];

// Initialize database
/**
 * Brings any record written by an older build up to the current shape.
 * Runs on every read, so a legacy data.json heals itself in place rather than
 * silently producing mismatched dates and empty calendars.
 */
const RESOURCE_SCHEMA_VERSION = 4;

function resourceVersionId(resourceId, versionNumber) {
  return `${resourceId}-v${versionNumber}`;
}

function makeResourceVersion(resource, versionNumber = 1, fileName = resource.fileName || '') {
  return {
    id: resourceVersionId(resource.id, versionNumber),
    resourceId: resource.id,
    versionNumber,
    fileName,
    format: resource.format || 'PDF',
    pages: resource.pages || 'Self-contained document',
    createdAt: resource.createdAt || new Date().toISOString()
  };
}

function migrate(db) {
  db.mentors = db.mentors || INITIAL_MENTORS;
  db.bookings = db.bookings || [];
  db.mentorApplications = db.mentorApplications || [];
  db.verifiedEmails = db.verifiedEmails || [];
  db.verificationTokens = db.verificationTokens || [];
  db.resources = Array.isArray(db.resources) ? db.resources : [];
  db.resourceVersions = Array.isArray(db.resourceVersions) ? db.resourceVersions : [];
  db.orders = db.orders || [];
  db.entitlements = db.entitlements || [];
  db.sessions = db.sessions || [];
  db.suggestions = db.suggestions || [];
  db.reports = db.reports || [];
  db.mailLog = Array.isArray(db.mailLog) ? db.mailLog : [];
  db.oauthStates = Array.isArray(db.oauthStates) ? db.oauthStates : [];
  db.studidStates = Array.isArray(db.studidStates) ? db.studidStates : [];
  db.pendingBindings = Array.isArray(db.pendingBindings) ? db.pendingBindings : [];
  db.studentIdentities = Array.isArray(db.studentIdentities) ? db.studentIdentities : [];
  db.stats = db.stats || {};
  if (typeof db.stats.totalBookings !== 'number') db.stats.totalBookings = 0;
  if (typeof db.stats.averageRating !== 'number') db.stats.averageRating = 4.9;

  db.mentors.forEach(m => {
    m.weeklySchedule = normaliseSchedule(m.weeklySchedule);
    delete m.schedule;

    if (!Array.isArray(m.links)) {
      const links = [];
      if (m.linkedin) links.push({ label: 'LinkedIn', url: m.linkedin });
      if (m.website) links.push({ label: 'Website', url: m.website });
      m.links = links;
    }
    if (typeof m.callsCompleted !== 'number') m.callsCompleted = 0;
    if (typeof m.payoutsEnabled !== 'boolean') m.payoutsEnabled = false;
  });

  // Older builds stored every resource twice: once in resources and once in
  // mentor.docs. Promote the legacy copy into the canonical collection once,
  // then remove the mirror. Reads derive mentor.docs again as a view.
  const legacyDocs = [];
  db.mentors.forEach(m => {
    if (Array.isArray(m.docs)) m.docs.forEach(doc => legacyDocs.push({ mentor: m, doc }));
    delete m.docs;
  });

  for (const { mentor, doc } of legacyDocs) {
    if (!doc || !doc.id) continue;
    let resource = db.resources.find(r => r.id === doc.id);
    if (!resource) {
      resource = {
        ...doc,
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorUniversity: mentor.university,
        mentorMajor: mentor.major
      };
      db.resources.push(resource);
    } else {
      if (resource.mentorId == null) resource.mentorId = mentor.id;
      for (const key of ['mentorName', 'mentorUniversity', 'mentorMajor', 'title', 'subtitle', 'type', 'price', 'format', 'fileName', 'pages', 'category', 'previewBullets']) {
        if ((resource[key] == null || resource[key] === '') && doc[key] != null) resource[key] = doc[key];
      }
    }
  }

  // Every existing product becomes immutable version one. New products use the
  // same shape, so public listings and My Space share one storage model.
  db.resources.forEach(resource => {
    resource.status = resource.status || 'published';
    resource.type = resource.type === 'paid' ? 'paid' : 'free';
    if (resource.type === 'free') resource.price = 0;

    if (!resource.currentVersionId) resource.currentVersionId = resourceVersionId(resource.id, 1);
    let current = db.resourceVersions.find(v => v.id === resource.currentVersionId);
    if (!current) {
      current = makeResourceVersion(resource, 1);
      db.resourceVersions.push(current);
    } else {
      if (!current.resourceId) current.resourceId = resource.id;
      if (!current.versionNumber) current.versionNumber = 1;
      if (!current.fileName && resource.fileName) current.fileName = resource.fileName;
      if (!current.format && resource.format) current.format = resource.format;
      if (!current.pages && resource.pages) current.pages = resource.pages;
    }
    resource.currentVersionId = current.id;
    // The version row is the sole owner of the file handle. Keep legacy data
    // readable during migration, then remove the denormalized copy.
    delete resource.fileName;
  });

  // Backfill the canonical identity onto old records where the contact email
  // can be resolved. Unmatched legacy rows are intentionally left intact for
  // the compatibility lookup rather than being discarded.
  const identityForEmail = (email) => {
    const clean = String(email || '').trim().toLowerCase();
    return db.studentIdentities.find(i => i.contactEmail === clean) || null;
  };
  db.mentors.forEach(mentor => {
    if (!mentor.authIdentifier) {
      const identity = identityForEmail(mentor.email);
      if (identity) mentor.authIdentifier = identity.authIdentifier;
    }
  });
  db.bookings.forEach(booking => {
    if (!booking.studentAuthIdentifier) {
      const identity = identityForEmail(booking.studentEmail);
      if (identity) booking.studentAuthIdentifier = identity.authIdentifier;
    }
  });
  db.orders.forEach(order => {
    if (!order.buyerAuthIdentifier) {
      const identity = identityForEmail(order.buyerEmail);
      if (identity) order.buyerAuthIdentifier = identity.authIdentifier;
    }
    if (!order.purchasedVersionId) {
      const resource = db.resources.find(r => r.id === order.resourceId);
      if (resource) order.purchasedVersionId = resource.currentVersionId;
    }
  });
  db.entitlements.forEach(entitlement => {
    if (!entitlement.authIdentifier) {
      const identity = identityForEmail(entitlement.email);
      if (identity) entitlement.authIdentifier = identity.authIdentifier;
    }
    if (!entitlement.versionId) {
      const resource = db.resources.find(r => r.id === entitlement.resourceId);
      if (resource) entitlement.versionId = resource.currentVersionId;
    }
  });
  const uniqueEntitlements = new Map();
  db.entitlements.forEach(entitlement => {
    const identityKey = entitlement.authIdentifier
      ? `id:${entitlement.authIdentifier}`
      : `email:${entitlement.email || ''}`;
    const key = `${entitlement.resourceId}|${identityKey}`;
    const existing = uniqueEntitlements.get(key);
    if (!existing) {
      uniqueEntitlements.set(key, entitlement);
      return;
    }
    if (!existing.versionId && entitlement.versionId) existing.versionId = entitlement.versionId;
    if (!existing.authIdentifier && entitlement.authIdentifier) existing.authIdentifier = entitlement.authIdentifier;
    if (!existing.email && entitlement.email) existing.email = entitlement.email;
  });
  db.entitlements = [...uniqueEntitlements.values()];
  db.orders.forEach(order => {
    if (order.status !== 'paid') return;
    const resource = db.resources.find(r => r.id === order.resourceId);
    if (!resource) return;
    const alreadyOwned = db.entitlements.some(entitlement => {
      if (entitlement.resourceId !== order.resourceId) return false;
      if (order.buyerAuthIdentifier && entitlement.authIdentifier) {
        return entitlement.authIdentifier === order.buyerAuthIdentifier;
      }
      return Boolean(order.buyerEmail && entitlement.email === order.buyerEmail);
    });
    if (alreadyOwned) return;
    db.entitlements.push({
      id: `ent-migrated-${order.id}`,
      authIdentifier: order.buyerAuthIdentifier || null,
      email: order.buyerEmail || null,
      resourceId: order.resourceId,
      versionId: order.purchasedVersionId || resource.currentVersionId,
      orderId: order.id,
      reason: 'purchase',
      grantedAt: order.paidAt || order.createdAt || new Date().toISOString()
    });
  });
  db.sessions.forEach(session => {
    if (!session.authIdentifier) {
      const identity = identityForEmail(session.email);
      if (identity) session.authIdentifier = identity.authIdentifier;
    }
  });
  // A non-mentor email-only session cannot be trusted for student actions after
  // the identity-key migration. Remove it so the client is sent back through
  // university sign-in instead of carrying a token that only yields 403s.
  db.sessions = db.sessions.filter(session =>
    session.authIdentifier || session.mentorId || session.isAdmin === true
  );
  db.stars = Array.isArray(db.stars) ? db.stars : [];
  db.stars.forEach(star => {
    if (!star.authIdentifier) {
      const identity = identityForEmail(star.email);
      if (identity) star.authIdentifier = identity.authIdentifier;
    }
  });

  db.resourceSchemaVersion = RESOURCE_SCHEMA_VERSION;
  return db;
}



export function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      const needsMigration = parsed.resourceSchemaVersion !== RESOURCE_SCHEMA_VERSION;
      const migrated = migrate(parsed);
      if (needsMigration) saveDb(migrated);
      return migrated;
    }
  } catch (err) {
    console.warn('[db] Failed reading data.json, initializing fresh db', err);
  }

  // First boot (or a fresh deploy): seed from the checked-in catalogue of
  // mentors and resources. data.json itself is runtime state and untracked.
  try {
    if (fs.existsSync(SEED_FILE)) {
      const seeded = migrate(JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')));
      saveDb(seeded);
      console.log('[db] Seeded a fresh data.json from data.seed.json');
      return seeded;
    }
  } catch (err) {
    console.warn('[db] Could not read data.seed.json', err);
  }

  const initialDb = migrate({
    mentors: INITIAL_MENTORS,
    stats: { totalBookings: 0, verifiedMentors: INITIAL_MENTORS.length, averageRating: 4.9 }
  });

  saveDb(initialDb);
  return initialDb;
}

/**
 * Writes the whole document atomically: serialise to a temp file in the same
 * directory, then rename over the target. A crash mid-write can no longer
 * truncate data.json, and concurrent writers cannot interleave partial JSON.
 */
export function saveDb(data) {
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  const payload = JSON.stringify(data, null, 2);

  try {
    fs.writeFileSync(tmp, payload, 'utf8');

    // On Windows a rename over an existing file fails with EPERM/EBUSY while
    // any other handle is open on the target — a reader mid-request, or a virus
    // scanner. These are transient, so retry briefly before giving up.
    let lastErr = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        fs.renameSync(tmp, DB_FILE);
        return;
      } catch (err) {
        lastErr = err;
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err;
        sleepSync(15);
      }
    }

    // Still contended: write in place rather than lose the data. Less atomic,
    // but the alternative is dropping a booking or a paid order on the floor.
    console.warn('[db] rename contended, writing in place:', lastErr?.code);
    fs.writeFileSync(DB_FILE, payload, 'utf8');
  } catch (err) {
    console.error('[db] Error saving data.json', err);
    throw err;
  } finally {
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) { /* best effort */ }
  }
}

/** Blocking pause without pulling in a dependency; only used on write contention. */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// ─── Database Operations ─────────────────────

export function getAllMentors(filters = {}) {
  const db = loadDb();
  let list = db.mentors;

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.university.toLowerCase().includes(q) ||
      m.major.toLowerCase().includes(q) ||
      m.bio.toLowerCase().includes(q) ||
      m.topTip.toLowerCase().includes(q)
    );
  }

  if (filters.university && filters.university !== 'all') {
    list = list.filter(m => m.university.toLowerCase().includes(filters.university.toLowerCase()));
  }

  if (filters.subject && filters.subject !== 'all') {
    list = list.filter(m => m.major.toLowerCase().includes(filters.subject.toLowerCase()));
  }

  return list.map(mentor => withMentorResources(mentor, db));
}


export function findMentorByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const db = loadDb();
  return db.mentors.find(m => m.email && m.email.toLowerCase() === cleanEmail) || null;
}

/**
 * The lookup that decides whether a signed-in student is also a mentor.
 *
 * By pseudonym rather than address, because the address is now contact
 * information the mentor can change at will. Matching on it would mean a
 * mentor who switched to a different mailbox silently lost their profile,
 * their schedule and their payouts — and, worse, that whoever later verified
 * with that address would inherit them.
 */
export function findMentorByAuthIdentifier(authIdentifier) {
  if (!authIdentifier) return null;
  const db = loadDb();
  return db.mentors.find(m => m.authIdentifier === authIdentifier) || null;
}

export function getMentorById(id) {
  const db = loadDb();
  return db.mentors.find(m => m.id === parseInt(id)) || null;
}

export function getMentorViewById(id, { includeArchived = false } = {}) {
  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(id));
  return mentor ? withMentorResources(mentor, db, { includeArchived }) : null;
}

// ─── Dynamic Monthly Calendar Slot Calculation ─────

export function getMonthlySlotsForMentor(mentorId, year, month) {
  const mentor = getMentorById(mentorId);
  if (!mentor) return null;

  const db = loadDb();
  const bookings = db.bookings.filter(b => b.mentorId === parseInt(mentorId));

  const targetYear = parseInt(year);
  const targetMonth = parseInt(month); // 1-indexed: 1 = Jan, 9 = Sep, 10 = Oct, etc.

  // Total days in target month
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const schedule = mentor.weeklySchedule || {};

  const daysResult = [];
  const allOpenSlots = [];
  const monthName = MONTH_SHORT[targetMonth - 1];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeekIdx = dayIndexFor(dateStr);
    const dayOfWeekStr = DAY_SHORT[dayOfWeekIdx];
    const displayDate = `${dayOfWeekStr} ${day} ${monthName}`;

    // Recurring availability for this weekday, canonical "HH:MM"
    const recurringSlots = schedule[String(dayOfWeekIdx)] || [];

    // A day in the past is never bookable, however the mentor's rota reads.
    const past = isPastDate(dateStr);

    /**
     * Every slot on the rota, with the reason it cannot be taken.
     *
     * Previously only the bookable ones came back, so a day that was fully
     * booked and a day the mentor never offered looked identical — an empty
     * list — and today's elapsed slots were not filtered at all, because the
     * only check was on the calendar date. A student could book 2pm at 5pm.
     *
     * Returning the whole rota with `booked` / `passed` lets the calendar grey
     * out what has gone rather than silently dropping it, which is the
     * difference between "nothing here" and "you have just missed these".
     */
    const slotDetail = recurringSlots.map(slot => {
      const booked = bookings.some(
        b => b.date === dateStr && b.time === slot && b.status !== 'cancelled'
      );
      const passed = past || isSlotPast(dateStr, slot);
      return {
        time: slot,
        display: toDisplayTime(slot),
        range: toDisplayTimeRange(slot),
        booked,
        passed,
        bookable: !booked && !passed
      };
    });

    const availableSlots = slotDetail.filter(s => s.bookable).map(s => s.time);

    daysResult.push({
      date: dateStr,
      dayNumber: day,
      dayOfWeek: dayOfWeekStr,
      dayOfWeekIdx,
      displayDate,
      isPast: past,
      slots: availableSlots,
      slotsDisplay: availableSlots.map(toDisplayTime),
      slotDetail,
      hasSlots: availableSlots.length > 0,
      slotCount: availableSlots.length,
      // Distinguishes "the mentor works today but it has all gone" from "the
      // mentor does not work today at all".
      rotaCount: slotDetail.length
    });

    slotDetail.filter(s => s.bookable).forEach(s => {
      allOpenSlots.push({
        date: dateStr,
        displayDate,
        dayOfWeek: dayOfWeekStr,
        dayNumber: day,
        time: s.time,
        timeDisplay: s.display,
        timeRange: s.range,
        slotBadge: '20-min video call'
      });
    });
  }

  // Calculate starting weekday offset for a Monday-first calendar grid (0=Mon, 1=Tue, ..., 6=Sun)
  const firstDayObj = new Date(targetYear, targetMonth - 1, 1);
  let firstWeekdayOffset = (firstDayObj.getDay() + 6) % 7; // Convert Sun(0)->6, Mon(1)->0

  return {
    mentorId: mentor.id,
    mentorName: mentor.name,
    university: mentor.university,
    year: targetYear,
    month: targetMonth,
    monthName,
    daysInMonth,
    firstWeekdayOffset,
    days: daysResult,
    allOpenSlots,
    totalOpenSlots: allOpenSlots.length
  };
}

// ─── Create Booking ─────────────────────────

export function createBooking({ mentorId, studentEmail, studentAuthIdentifier, date, time }) {
  const email = (studentEmail || '').trim().toLowerCase();
  const authIdentifier = (studentAuthIdentifier || '').trim();
  if (!authIdentifier || !email || !isEmailVerified(email)) {
    throw new Error('Verification failed: please verify with your university before booking.');
  }

  // Accept either canonical or legacy display input, then work canonically.
  const canonicalDate = toCanonicalDate(date);
  const canonicalTime = toCanonicalTime(time);

  if (!canonicalDate || !isCanonicalDate(canonicalDate)) {
    throw new Error('That date could not be understood. Please pick a day from the calendar.');
  }
  if (!canonicalTime) {
    throw new Error('That time could not be understood. Please pick a slot from the calendar.');
  }
  if (isPastDate(canonicalDate)) {
    throw new Error('That date has already passed. Please choose an upcoming slot.');
  }

  // The date check alone let a stale calendar book a slot that had already
  // started — open the page at nine, book the two o'clock at five, and the
  // server agreed. A page left open for hours is the normal case, not the
  // exotic one, so this has to be enforced here rather than only in the UI.
  if (isSlotPast(canonicalDate, canonicalTime)) {
    throw new Error('That slot has already started. Please choose a later one.');
  }

  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(mentorId));
  if (!mentor) {
    throw new Error('Mentor not found');
  }

  // The requested slot must actually exist in this mentor's weekly rota.
  const dayIdx = String(dayIndexFor(canonicalDate));
  const rota = (mentor.weeklySchedule || {})[dayIdx] || [];
  if (!rota.includes(canonicalTime)) {
    throw new Error(
      `${mentor.name} is not available at ${toDisplayTime(canonicalTime)} on ${toDisplayDate(canonicalDate)}. Please choose an open slot.`
    );
  }

  // Double-booking check, now comparing like with like.
  const exists = db.bookings.some(b =>
    b.mentorId === mentor.id &&
    b.date === canonicalDate &&
    b.time === canonicalTime &&
    b.status !== 'cancelled'
  );
  if (exists) {
    throw new Error('This time slot has just been booked by another student. Please select another slot.');
  }

  // One student cannot hold two live bookings with the same mentor.
  const duplicate = db.bookings.some(b =>
    b.mentorId === mentor.id &&
    (b.studentAuthIdentifier === authIdentifier || (!b.studentAuthIdentifier && b.studentEmail === email)) &&
    b.status !== 'cancelled' &&
    !isPastDate(b.date)
  );
  if (duplicate) {
    throw new Error(`You already have an upcoming session booked with ${mentor.name}.`);
  }

  const id = `frea-bk-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const booking = {
    id,
    mentorId: mentor.id,
    mentorName: mentor.name,
    mentorEmail: mentor.email || '',
    studentEmail: email,
    studentAuthIdentifier: authIdentifier,
    date: canonicalDate,
    time: canonicalTime,
    displayDate: toDisplayDate(canonicalDate),
    displayTime: toDisplayTime(canonicalTime),
    timezone: ukTimezoneLabel(canonicalDate),
    meetingUrl: meetingUrlFor(id),
    cancelToken: crypto.randomBytes(16).toString('hex'),
    topTip: mentor.topTip,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  db.bookings.push(booking);
  db.stats.totalBookings += 1;
  mentor.callsCompleted += 1;

  saveDb(db);

  return booking;
}

/**
 * A real, working video room that needs no account on either side.
 * Jitsi rooms are created on first join, so the URL in the invite is live the
 * moment it is sent — unlike the random meet.google.com codes this used to mint,
 * which pointed at nothing.
 */
function meetingUrlFor(bookingId) {
  const room = `frea-${bookingId.replace(/[^a-zA-Z0-9]/g, '')}`;
  return `https://meet.jit.si/${room}`;
}

/** Cancel a booking. Either party may cancel; the token proves it's theirs. */
export function cancelBooking({ bookingId, email, authIdentifier = null, mentorId = null, cancelToken, isAdmin = false }) {
  const db = loadDb();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) throw new Error('Booking not found.');

  const clean = (email || '').trim().toLowerCase();
  const cleanAuthIdentifier = (authIdentifier || '').trim();
  const isStudent = booking.studentAuthIdentifier && cleanAuthIdentifier
    ? booking.studentAuthIdentifier === cleanAuthIdentifier
    : !booking.studentAuthIdentifier && Boolean(clean && booking.studentEmail === clean);
  const isMentor = mentorId != null && parseInt(mentorId, 10) === parseInt(booking.mentorId, 10);
  const allowed = isAdmin
    || (cancelToken && cancelToken === booking.cancelToken)
    || isStudent
    || isMentor;

  if (!allowed) {
    throw new Error('You do not have permission to cancel this booking.');
  }
  if (booking.status === 'cancelled') return booking;

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  booking.cancelledBy = isAdmin ? 'admin' : (isMentor ? 'mentor' : 'student');

  const mentor = db.mentors.find(m => m.id === booking.mentorId);
  if (mentor && mentor.callsCompleted > 0) mentor.callsCompleted -= 1;
  if (db.stats.totalBookings > 0) db.stats.totalBookings -= 1;

  saveDb(db);
  return booking;
}

/** Bookings for one mentor, newest first, with upcoming/past split. */
export function getBookingsForMentor(mentorId) {
  const db = loadDb();
  const mId = parseInt(mentorId);
  const all = db.bookings
    .filter(b => b.mentorId === mId)
    .map(b => ({
      ...b,
      displayDate: b.displayDate || toDisplayDate(b.date),
      displayTime: b.displayTime || toDisplayTime(b.time)
    }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const live = all.filter(b => b.status !== 'cancelled');
  return {
    upcoming: live.filter(b => !isPastDate(b.date)),
    past: live.filter(b => isPastDate(b.date)).reverse(),
    cancelled: all.filter(b => b.status === 'cancelled').reverse(),
    total: live.length
  };
}

/** Bookings for one student, by canonical identity with legacy email fallback. */
export function getBookingsForStudent(owner) {
  const db = loadDb();
  const key = ownerKey(owner);
  const all = db.bookings
    .filter(b => b.status !== 'cancelled')
    .filter(b => {
      if (b.studentAuthIdentifier) {
        return Boolean(key.authIdentifier && b.studentAuthIdentifier === key.authIdentifier);
      }
      return Boolean(key.email && b.studentEmail === key.email);
    })
    .map(b => ({
      ...b,
      displayDate: b.displayDate || toDisplayDate(b.date),
      displayTime: b.displayTime || toDisplayTime(b.time)
    }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return {
    upcoming: all.filter(b => !isPastDate(b.date)),
    past: all.filter(b => isPastDate(b.date)).reverse()
  };
}

export function getBookingById(bookingId) {
  const db = loadDb();
  return db.bookings.find(b => b.id === bookingId) || null;
}

// ─── Create Mentor Application ──────────────

export function createMentorApplication(appData) {
  const email = (appData.email || '').trim().toLowerCase();
  const authIdentifier = (appData.authIdentifier || '').trim();

  // Studenthood is proven by the university's identity provider before this
  // is ever called, so the address is no longer asked to carry it — it is a
  // contact address, usually personal, because .ac.uk mail was being filtered
  // away unseen and a mentor who cannot receive a booking notice is no use to
  // anyone.
  if (!email || !isEmailVerified(email)) {
    throw new Error('Please verify with your university before creating a mentor profile.');
  }
  if (!authIdentifier) {
    throw new Error('Your university sign-in could not be read. Please verify again.');
  }
  if (appData.attachedDoc) {
    throw new Error('Publish products from the mentor dashboard after your profile is created.');
  }

  /**
   * The institution comes from whoever vouched for them, never from the form.
   *
   * It used to be a dropdown, which was survivable only while the .ac.uk
   * address beside it corroborated the answer. Now that the address is a
   * personal one, nothing in the form relates to the institution at all — so a
   * Manchester student could select Oxford and wear a "university verified"
   * badge saying so, on a platform whose entire premise is verified peers.
   *
   * `institutionName` is the federation's own name for the tenant. The scope
   * (`manchester.ac.uk`) is the fallback when that lookup failed: less pretty,
   * still true, and never the applicant's opinion.
   */
  const identity = findStudentIdentity(authIdentifier);
  const verifiedUniversity = identity?.institutionName || identity?.scope || null;
  if (!verifiedUniversity) {
    throw new Error('We could not confirm which university you signed in with. Please verify again.');
  }

  const db = loadDb();

  // Matched on the university's pseudonym, not the address. A mentor may
  // change where they want their mail; they cannot change who their
  // institution says they are, which is what should own the profile — and the
  // payouts attached to it.
  let mentor = db.mentors.find(m => m.authIdentifier && m.authIdentifier === authIdentifier);

  if (mentor) {
    // Update existing mentor profile
    if (appData.name) mentor.name = cleanText(appData.name, 80);
    mentor.university = verifiedUniversity;
    if (appData.major || appData.degree) mentor.major = cleanText(appData.major || appData.degree, 80);
    if (appData.year) mentor.year = cleanText(appData.year, 40);
    if (appData.topTip) mentor.topTip = cleanText(appData.topTip, 140);
    if (appData.topTipColor || appData.postitColor) mentor.topTipColor = safePostitColor(appData.topTipColor || appData.postitColor);
    if (appData.achievements) mentor.achievements = appData.achievements;
    if (appData.photoUrl) mentor.photoUrl = appData.photoUrl;
    if (appData.avatarId) mentor.avatarId = appData.avatarId;
    if (appData.pitchVideoUrl) mentor.pitchVideoUrl = safeVideoUrl(appData.pitchVideoUrl);
    if (appData.linkedin) mentor.linkedin = sanitiseUrl(appData.linkedin) || '';
    if (appData.links) mentor.links = sanitiseLinks(appData.links);
    if (appData.weeklySchedule) mentor.weeklySchedule = normaliseSchedule(appData.weeklySchedule);
  } else {
    // Instant Activation: No interview required to scale seamlessly
    const nextId = db.mentors.length > 0 ? Math.max(...db.mentors.map(m => m.id)) + 1 : 1;
    const postitColor = appData.postitColor || appData.topTipColor || 'yellow';
    const colorMap = { yellow: 'orange', mint: 'green', blush: 'pink', sky: 'blue' };

    mentor = {
      id: nextId,
      name: cleanText(appData.name, 80),
      email,
      // The university's pseudonym for this person. It is what owns the
      // profile from here on; `email` is only where their mail goes.
      authIdentifier,
      year: cleanText(appData.year, 40) || '2nd year',
      major: cleanText(appData.major || appData.degree, 80) || 'Undergraduate',
      university: verifiedUniversity,
      bio: cleanText(appData.bio, 1200) || ('Senior student at ' + verifiedUniversity + '. Happy to chat about course survival, applications, and student life.'),
      topTip: cleanText(appData.topTip, 140) || 'Reach out to older students early and test your revision methods!',
      topTipColor: safePostitColor(postitColor),
      achievements: appData.achievements && appData.achievements.length > 0 ? appData.achievements : ['verified-mentor'],
      helpsWith: [cleanText(appData.major || appData.degree, 40) || 'academics', 'exam tips', 'cv roast', 'applications'],
      rating: 5.0,
      callsCompleted: 0,
      linkedin: sanitiseUrl(appData.linkedin) || '',
      links: sanitiseLinks(
        appData.links && appData.links.length
          ? appData.links
          : [appData.linkedin, appData.website].filter(Boolean)
      ),
      pitchVideoUrl: safeVideoUrl(appData.pitchVideoUrl),
      photoUrl: appData.photoUrl || '',
      avatarId: appData.avatarId || 1,
      interviewRequired: false,
      status: 'active',
      weeklySchedule: normaliseSchedule(
        appData.weeklySchedule || { 1: ['10:00', '14:00'], 3: ['11:00', '15:30'], 5: ['13:00', '16:30'] }
      ),
      color: colorMap[postitColor] || 'blue'
    };

    db.mentors.unshift(mentor);
  }

  // Application record for audit
  const application = {
    id: 'frea-app-' + Date.now(),
    name: appData.name,
    university: verifiedUniversity,
    major: appData.major || appData.degree,
    year: appData.year,
    email,
    achievements: appData.achievements || [],
    topTip: appData.topTip,
    postitColor: appData.postitColor || 'yellow',
    interviewRequired: false,
    status: 'active',
    mentorId: mentor.id,
    approvedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString()
  };

  db.mentorApplications.unshift(application);
  if (!db.verifiedEmails.includes(email)) db.verifiedEmails.push(email);
  db.stats.verifiedMentors = db.mentors.length;

  saveDb(db);

  return {
    application,
    mentor,
    success: true,
    message: 'Mentor profile activated immediately! No interview required.'
  };
}

// ─── Stats ──────────────────────────────────

export function getStats() {
  const db = loadDb();
  const resources = getAllResources();
  const ratings = db.mentors.map(m => m.rating).filter(r => typeof r === 'number' && r > 0);
  const avg = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : db.stats.averageRating;

  const liveBookings = db.bookings.filter(b => b.status !== 'cancelled');

  return {
    verifiedMentors: db.mentors.length,
    universities: new Set(db.mentors.map(m => m.university)).size,
    totalResources: resources.length,
    freeResources: resources.filter(r => r.type !== 'paid').length,
    totalBookings: liveBookings.length,
    upcomingBookings: liveBookings.filter(b => !isPastDate(b.date)).length,
    pendingApplications: db.mentorApplications.filter(
      a => a.status === 'pending_verification' || a.status === 'pending_review'
    ).length,
    averageRating: avg
  };
}

// ─── Email Verification Storage & Handlers ─────────

export function saveVerificationToken({ email, token, code, expiresAt }) {
  const db = loadDb();
  const cleanEmail = (email || '').trim().toLowerCase();
  // Tokens are no longer deleted the moment they are used, so expired ones are
  // swept here rather than accumulating for the life of the platform.
  const now = Date.now();
  db.verificationTokens = db.verificationTokens
    .filter(t => t.email !== cleanEmail)
    .filter(t => (t.expiresAt || 0) > now);
  db.verificationTokens.push({
    email: cleanEmail,
    token,
    code: String(code).trim(),
    expiresAt: expiresAt || (Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date().toISOString()
  });
  saveDb(db);
}

export function verifyEmailCode(email, code) {
  const db = loadDb();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanCode = String(code || '').trim();

  const record = db.verificationTokens.find(t => t.email === cleanEmail);

  if (!record) {
    throw new Error('No verification code is pending for this email. Please request a new code.');
  }

  if (Date.now() > record.expiresAt) {
    throw new Error('Verification code has expired. Please request a new code.');
  }

  // Rate-limit guessing: five wrong attempts burns the code.
  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    db.verificationTokens = db.verificationTokens.filter(t => t.email !== cleanEmail);
    saveDb(db);
    throw new Error('Too many incorrect attempts. Please request a new code.');
  }

  // Constant-time compare so the code cannot be probed a character at a time.
  const expected = Buffer.from(String(record.code));
  const supplied = Buffer.from(cleanCode);
  const matches = expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);

  if (!matches) {
    saveDb(db);
    throw new Error('Invalid verification code. Please check your email or request a new code.');
  }

  // Single-use: consume the code now that it has been proven.
  db.verificationTokens = db.verificationTokens.filter(t => t.email !== cleanEmail);

  // Mark verified
  if (!db.verifiedEmails.includes(cleanEmail)) {
    db.verifiedEmails.push(cleanEmail);
  }

  // If there are mentor applications with this email, mark them verified
  db.mentorApplications.forEach(app => {
    if (app.email.toLowerCase() === cleanEmail) {
      app.emailVerified = true;
      if (app.status === 'pending_verification') {
        app.status = 'pending_review';
      }
    }
  });

  saveDb(db);
  return { success: true, email: cleanEmail };
}

/**
 * How long a verification link keeps working after its first use.
 *
 * Long enough to cover a mail scanner fetching it seconds before the student
 * clicks; short enough that the link is not a reusable credential.
 */
const TOKEN_REUSE_GRACE_MS = 15 * 60 * 1000;

export function verifyEmailToken(token) {
  const db = loadDb();
  const record = db.verificationTokens.find(t => t.token === token);
  if (!record) {
    throw new Error('Invalid or expired verification link.');
  }

  if (Date.now() > record.expiresAt) {
    throw new Error('Verification link has expired. Please request a new verification email.');
  }

  const cleanEmail = record.email;

  // Not strictly single-use, for a short grace period after the first hit.
  //
  // Mail providers fetch the links inside a message before the recipient ever
  // sees it — Microsoft Defender Safe Links does exactly this, and Outlook is
  // where most .ac.uk addresses live. That scan consumed the token, and the
  // student's own click then failed with "invalid or expired" on a link they
  // had never used. It is the most confusing failure the product can produce:
  // the email arrived, the link was real, and it still did not work.
  //
  // A grace window rather than unlimited reuse. Anyone holding the link can
  // already sign in once, so accepting it again for a few minutes changes
  // little; leaving it live for its full 24 hours would turn a forwarded email
  // into a standing key.
  const now = Date.now();
  if (record.usedAt && now - record.usedAt > TOKEN_REUSE_GRACE_MS) {
    throw new Error('That verification link has already been used. Please request a new one.');
  }

  if (record.usedAt) {
    // A repeat inside the window: hand back a session without re-consuming.
    record.usedCount = (record.usedCount || 1) + 1;
  } else {
    record.usedAt = now;
    record.usedCount = 1;
  }

  if (!db.verifiedEmails.includes(cleanEmail)) {
    db.verifiedEmails.push(cleanEmail);
  }

  db.mentorApplications.forEach(app => {
    if (app.email.toLowerCase() === cleanEmail) {
      app.emailVerified = true;
      if (app.status === 'pending_verification') {
        app.status = 'pending_review';
      }
    }
  });

  saveDb(db);
  return { success: true, email: cleanEmail };
}

/**
 * Records an address as verified without an emailed code.
 *
 * The code path reaches the same list via verifyEmailCode / verifyEmailToken.
 * Microsoft sign-in proves the address a different way — the tenant owns the
 * domain and vouches for the user — so it lands here instead, and everything
 * downstream that asks "is this address verified" keeps working unchanged.
 */
export function markEmailVerified(email) {
  const db = loadDb();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return { success: false };
  if (!db.verifiedEmails.includes(cleanEmail)) {
    db.verifiedEmails.push(cleanEmail);
    saveDb(db);
  }
  return { success: true, email: cleanEmail };
}

export function isEmailVerified(email) {
  const db = loadDb();
  const cleanEmail = (email || '').trim().toLowerCase();
  return db.verifiedEmails.includes(cleanEmail);
}

// ─── Admin Applications Operations ─────────────────

export function getMentorApplications() {
  const db = loadDb();
  return db.mentorApplications;
}

// approveMentorApplication / rejectMentorApplication were removed deliberately.
// Mentors activate on email verification, so there is nothing to approve —
// and the old approve path created a duplicate mentor record for someone who
// was already live. The application list survives purely as an audit trail.

export function cleanText(value, maxLength = 500) {
  if (value == null) return '';
  return String(value)
    // Strip C0/C1 control characters and zero-width marks. Built from char
    // codes so no literal control bytes ever sit in this source file.
    .replace(CONTROL_CHARS, '')
    .trim()
    .slice(0, maxLength);
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp(
  '[' +
  '\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F' + // C0 controls and DEL
  '\\u200B\\u200C\\u200D\\uFEFF' +                             // zero-width / BOM
  ']', 'g'
);

export function updateMentorProfile(id, updates) {
  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(id));
  if (!mentor) {
    throw new Error('Mentor not found');
  }

  if (updates.name) mentor.name = cleanText(updates.name, 80);
  if (updates.year) mentor.year = cleanText(updates.year, 40);
  if (updates.major) mentor.major = cleanText(updates.major, 80);
  // `university` is deliberately absent. It is derived from whoever vouched
  // for the mentor at sign-in, and createMentorApplication refuses to invent
  // one — but this route was still honouring it from the request body, so a
  // mentor could apply honestly and then PUT their own record to any
  // institution they liked and wear the verified badge beside it. Editing
  // your own profile is the obvious place that gets exercised.
  if (updates.bio) mentor.bio = cleanText(updates.bio, 1200);
  if (updates.topTip) mentor.topTip = cleanText(updates.topTip, 140);
  if (updates.topTipColor) mentor.topTipColor = safePostitColor(updates.topTipColor);
  if (updates.achievements && Array.isArray(updates.achievements)) {
    mentor.achievements = updates.achievements
      .map(a => cleanText(a, 75)).filter(Boolean).slice(0, 3);
  }
  if (updates.helpsWith && Array.isArray(updates.helpsWith)) {
    mentor.helpsWith = updates.helpsWith
      .map(h => cleanText(h, 40)).filter(Boolean).slice(0, 12);
  }
  if (updates.photoUrl !== undefined) mentor.photoUrl = updates.photoUrl;
  if (updates.avatarId !== undefined) mentor.avatarId = parseInt(updates.avatarId) || 1;
  if (updates.color) mentor.color = updates.color;
  if (updates.pitchVideoUrl !== undefined) mentor.pitchVideoUrl = safeVideoUrl(updates.pitchVideoUrl);

  // Mentors may attach as many links as they like. Keep LinkedIn as its own
  // first-class field for the verification badge, and mirror it into links.
  if (updates.links !== undefined) {
    mentor.links = sanitiseLinks(updates.links);
  }
  if (updates.linkedin !== undefined) {
    mentor.linkedin = sanitiseUrl(updates.linkedin) || '';
  }

  saveDb(db);
  return mentor;
}

/** Keeps only well-formed http(s) links, capped and labelled. */
export function sanitiseLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map(l => {
      const url = sanitiseUrl(typeof l === 'string' ? l : l && l.url);
      if (!url) return null;
      const rawLabel = (typeof l === 'object' && l && l.label ? String(l.label) : '').trim();
      return { label: (rawLabel || labelForUrl(url)).slice(0, 40), url };
    })
    .filter(Boolean)
    .filter((l, i, arr) => arr.findIndex(x => x.url === l.url) === i)
    .slice(0, 20);
}

/**
 * The post-it colour is interpolated straight into a class attribute on the
 * mentor card, so it is a CSS-class token, not free text. cleanText only
 * trimmed it, which left `" onclick=...` inside the 20-character budget.
 */
const POSTIT_COLORS = new Set(['yellow', 'mint', 'blush', 'sky']);
function safePostitColor(value) {
  const v = (value == null ? '' : String(value)).trim().toLowerCase();
  return POSTIT_COLORS.has(v) ? v : 'yellow';
}

/**
 * A pitch video is either a take uploaded here or a link the mentor pasted
 * (YouTube and the like), so both shapes stay valid. The point of this is only
 * that the stored value is a URL and not an attribute-breakout payload — it is
 * interpolated into href/src on the mentor card.
 *
 * It deliberately does NOT decide what may be deleted from disk. That is
 * ownPitchVideoPath() in server/index.js, which additionally requires the
 * filename to be one this mentor's own upload minted; an external URL simply
 * never resolves to a path there.
 */
function safeVideoUrl(value) {
  const raw = (value == null ? '' : String(value)).trim();
  if (!raw) return '';
  if (/^\/uploads\/pitch_videos\/pitch-\d+-\d+-[0-9a-f]{8}\.(mp4|webm|mov|m4v)$/i.test(raw)) {
    return raw;
  }
  return sanitiseUrl(raw) || '';
}

function sanitiseUrl(value) {
  const raw = (value == null ? '' : String(value)).trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch (_) {
    return null;
  }
}

/** Guesses a friendly label from the host, so mentors needn't type one. */
function labelForUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const known = {
      'linkedin.com': 'LinkedIn', 'github.com': 'GitHub', 'x.com': 'X',
      'twitter.com': 'X', 'medium.com': 'Medium', 'substack.com': 'Substack',
      'notion.so': 'Notion', 'youtube.com': 'YouTube', 'instagram.com': 'Instagram',
      'behance.net': 'Behance', 'dribbble.com': 'Dribbble', 'scholar.google.com': 'Google Scholar'
    };
    const match = Object.keys(known).find(k => host === k || host.endsWith(`.${k}`));
    return match ? known[match] : host;
  } catch (_) {
    return 'Link';
  }
}

export function updateMentorSchedule(id, weeklySchedule) {
  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(id));
  if (!mentor) {
    throw new Error('Mentor not found');
  }

  // Normalise whatever the client sent into the canonical form, so the editor
  // and the booking engine can never disagree about what a slot is.
  const normalised = normaliseSchedule(weeklySchedule);
  const slotCount = Object.values(normalised).reduce((n, arr) => n + arr.length, 0);
  if (slotCount > 70) {
    throw new Error('That is more than 70 slots a week — please trim your availability.');
  }

  mentor.weeklySchedule = normalised;
  saveDb(db);
  return mentor;
}

// ─── Resources / Freabies CRUD ─────────────────────

function currentVersionFor(resource, db) {
  return (db.resourceVersions || []).find(v => v.id === resource.currentVersionId) || null;
}

function resourceView(resource, db) {
  const current = currentVersionFor(resource, db);
  const { fileName, fileUrl, ...rest } = resource;
  return {
    ...rest,
    currentVersionId: current?.id || resource.currentVersionId || null,
    versionNumber: current?.versionNumber || 1
  };
}

function resourcesForMentor(db, mentorId, { includeArchived = false } = {}) {
  return (db.resources || [])
    .filter(r => r.mentorId === parseInt(mentorId, 10))
    .filter(r => includeArchived || r.status !== 'archived')
    .map(r => resourceView(r, db));
}

function withMentorResources(mentor, db, options = {}) {
  if (!mentor) return null;
  return {
    ...mentor,
    docs: resourcesForMentor(db, mentor.id, options)
  };
}

export function getAllResources({ includeArchived = false } = {}) {
  const db = loadDb();
  return (db.resources || [])
    .filter(r => includeArchived || r.status !== 'archived')
    .map(r => resourceView(r, db));
}

/** Look one canonical product up. Archived products remain resolvable for owners. */
export function getResourceById(id) {
  const db = loadDb();
  const direct = (db.resources || []).find(r => r.id === id);
  if (direct) return direct;
  // Defensive fallback for an un-migrated in-memory record.
  for (const m of db.mentors) {
    const d = (m.docs || []).find(doc => doc.id === id);
    if (d) return { ...d, mentorId: m.id, mentorName: m.name, mentorUniversity: m.university };
  }
  return null;
}

export function getResourceVersions(resourceId) {
  const db = loadDb();
  return (db.resourceVersions || [])
    .filter(v => v.resourceId === resourceId)
    .sort((a, b) => a.versionNumber - b.versionNumber);
}

/** Every on-disk product file referenced by a version, including archived rows. */
export function getReferencedUploadNames() {
  const db = loadDb();
  const values = [
    ...(db.resourceVersions || []).map(version => version.fileName),
    ...(db.resources || []).map(resource => resource.fileName),
    ...db.mentors.flatMap(mentor => (mentor.docs || [])
      .flatMap(doc => [doc.fileName, doc.fileUrl]))
  ];
  return [...new Set(values
    .filter(Boolean)
    .map(value => path.basename(String(value).replace(/\\/g, '/')))
    .filter(Boolean))];
}

function assertOwnedUpload(mentorId, fileName) {
  const handle = String(fileName || '');
  if (!handle || handle !== path.basename(handle) || !handle.startsWith(`doc-${mentorId}-`)) {
    throw new Error('That file was not uploaded by this account.');
  }
  return handle;
}

export function createResource(resourceData, mentorId) {
  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(mentorId));
  if (!mentor) throw new Error('Mentor not found.');

  const title = cleanText(resourceData.title, 120);
  if (!title) throw new Error('Give your resource a title.');

  const isPaid = resourceData.type === 'paid';
  let price = 0;
  if (isPaid) {
    price = Math.round(parseFloat(resourceData.price || 0) * 100) / 100;
    if (!(price >= 1) || price > 100) {
      throw new Error('Playbooks must be priced between £1.00 and £100.00.');
    }
  }

  if (!resourceData.fileName) throw new Error('Upload a document file before publishing.');
  const fileName = assertOwnedUpload(mentor.id, resourceData.fileName);

  const resource = {
    id: `doc-${mentor.id}-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    mentorId: mentor.id,
    mentorName: mentor.name,
    mentorUniversity: mentor.university,
    mentorMajor: mentor.major,
    title,
    subtitle: cleanText(resourceData.subtitle || resourceData.description, 300),
    type: isPaid ? 'paid' : 'free',
    price,
    format: resourceData.format || 'PDF',
    pages: resourceData.pages || 'Self-contained document',
    category: resourceData.category || 'General',
    previewBullets: Array.isArray(resourceData.previewBullets)
      ? resourceData.previewBullets.map(b => cleanText(b, 160)).filter(Boolean).slice(0, 5)
      : [],
    downloads: 0,
    rating: 5.0,
    status: 'published',
    currentVersionId: null,
    createdAt: new Date().toISOString()
  };

  const version = makeResourceVersion(resource, 1, fileName);
  resource.currentVersionId = version.id;
  db.resourceVersions.push(version);
  db.resources.unshift(resource);
  saveDb(db);
  return resource;
}

export function createResourceVersion({ resourceId, fileName, format, pages }) {
  const db = loadDb();
  const resource = db.resources.find(r => r.id === resourceId);
  if (!resource) throw new Error('Resource not found.');

  const mentor = db.mentors.find(m => m.id === resource.mentorId);
  if (!mentor) throw new Error('Mentor not found.');
  const handle = assertOwnedUpload(mentor.id, fileName);
  let versionNumber = Math.max(
    0,
    ...(db.resourceVersions || [])
      .filter(v => v.resourceId === resource.id)
      .map(v => Number(v.versionNumber) || 0)
  ) + 1;
  while ((db.resourceVersions || []).some(v => v.id === resourceVersionId(resource.id, versionNumber))) {
    versionNumber += 1;
  }

  const version = {
    id: resourceVersionId(resource.id, versionNumber),
    resourceId: resource.id,
    versionNumber,
    fileName: handle,
    format: format || resource.format || 'PDF',
    pages: pages || resource.pages || 'Self-contained document',
    createdAt: new Date().toISOString()
  };

  db.resourceVersions.push(version);
  resource.currentVersionId = version.id;
  resource.format = version.format;
  resource.pages = version.pages;
  resource.updatedAt = version.createdAt;
  saveDb(db);
  return version;
}

/** Update listing metadata. A product's free/paid type is immutable. */
export function updateResource(id, updates) {
  const db = loadDb();
  const resource = db.resources.find(r => r.id === id);
  if (!resource) throw new Error('Resource not found.');

  if (updates.type != null && updates.type !== resource.type) {
    throw new Error('A product cannot change between free and paid. Create a new product instead.');
  }
  if (updates.fileName != null || updates.fileUrl != null) {
    throw new Error('Publish a new version instead of replacing the existing file.');
  }
  if (updates.title != null && cleanText(updates.title, 120)) resource.title = cleanText(updates.title, 120);
  if (updates.subtitle != null) resource.subtitle = cleanText(updates.subtitle, 300);
  if (updates.category != null) resource.category = cleanText(updates.category, 80);
  if (resource.type === 'free') {
    resource.price = 0;
  } else if (updates.price != null) {
    const price = Math.round(parseFloat(updates.price || 0) * 100) / 100;
    if (!(price >= 1) || price > 100) {
      throw new Error('Playbooks must be priced between £1.00 and £100.00.');
    }
    resource.price = price;
  }

  saveDb(db);
  return resource;
}

export function deleteResource(id) {
  const db = loadDb();
  const resource = db.resources.find(r => r.id === id);
  if (!resource) throw new Error('Resource not found.');

  resource.status = 'archived';
  resource.archivedAt = new Date().toISOString();
  saveDb(db);
  return { success: true, id, status: resource.status };
}

// ─── Stars: a count of students who vouched for a mentor ───
//
// Not a rating. There is no score, no average and no denominator — just how
// many verified students pressed the button. Everyone starts at zero and it
// only goes up as real people arrive, so a new mentor looks new rather than
// looking like a five-star one.
//
// Keyed by the canonical Studid identity when available, with email retained
// for legacy rows and older sessions.

export function toggleStar({ mentorId, email, authIdentifier = null }) {
  const id = parseInt(mentorId, 10);
  const clean = (email || '').trim().toLowerCase();
  const cleanAuthIdentifier = (authIdentifier || '').trim();
  if (!clean && !cleanAuthIdentifier) throw new Error('Verify your student identity before starring a mentor.');

  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === id);
  if (!mentor) throw new Error('Mentor not found.');

  // Starring yourself would make the count meaningless.
  const sameIdentity = mentor.authIdentifier && cleanAuthIdentifier
    ? mentor.authIdentifier === cleanAuthIdentifier
    : (mentor.email || '').toLowerCase() === clean;
  if (sameIdentity) throw new Error('You cannot star your own profile.');

  db.stars = db.stars || [];
  const idx = db.stars.findIndex(s => {
    if (s.mentorId !== id) return false;
    if (s.authIdentifier && cleanAuthIdentifier) return s.authIdentifier === cleanAuthIdentifier;
    return Boolean(clean && s.email === clean);
  });

  let starred;
  if (idx >= 0) {
    db.stars.splice(idx, 1);
    starred = false;
  } else {
    db.stars.push({
      mentorId: id,
      authIdentifier: cleanAuthIdentifier || null,
      email: clean,
      at: new Date().toISOString()
    });
    starred = true;
  }

  saveDb(db);
  return { mentorId: id, stars: db.stars.filter(s => s.mentorId === id).length, starred };
}

/** How many students starred this mentor. */
export function getStarCount(mentorId) {
  const id = parseInt(mentorId, 10);
  const db = loadDb();
  return (db.stars || []).filter(s => s.mentorId === id).length;
}

/** Counts for every mentor at once, so a listing is one pass not N. */
export function getStarCounts() {
  const db = loadDb();
  const counts = {};
  for (const s of (db.stars || [])) counts[s.mentorId] = (counts[s.mentorId] || 0) + 1;
  return counts;
}

/** Whether this student has already starred this mentor. */
export function hasStarred(mentorId, email, authIdentifier = null) {
  const id = parseInt(mentorId, 10);
  const clean = (email || '').trim().toLowerCase();
  const cleanAuthIdentifier = (authIdentifier || '').trim();
  if (!clean && !cleanAuthIdentifier) return false;
  const db = loadDb();
  return (db.stars || []).some(s => {
    if (s.mentorId !== id) return false;
    if (s.authIdentifier && cleanAuthIdentifier) return s.authIdentifier === cleanAuthIdentifier;
    return Boolean(clean && s.email === clean);
  });
}

// ─── Entitlements: who may download what ───────────────
//
// New ownership is keyed to the Studid authIdentifier. Email is retained as a
// contact/compatibility field, not as the primary authorization key.

function ownerKey(owner) {
  const value = typeof owner === 'string' ? { email: owner } : (owner || {});
  return {
    authIdentifier: String(value.authIdentifier || '').trim() || null,
    email: String(value.email || '').trim().toLowerCase() || null
  };
}

function entitlementBelongsTo(entitlement, owner) {
  const key = ownerKey(owner);
  if (entitlement.authIdentifier) {
    return Boolean(key.authIdentifier && entitlement.authIdentifier === key.authIdentifier);
  }
  return Boolean(key.email && entitlement.email === key.email);
}

export function grantEntitlement({ email, authIdentifier = null, resourceId, versionId = null, orderId = null, reason = 'purchase' }) {
  const db = loadDb();
  const key = ownerKey({ email, authIdentifier });
  if (!key.authIdentifier && !key.email) throw new Error('A verified identity is required.');

  const resource = db.resources.find(r => r.id === resourceId);
  const resolvedVersionId = versionId || resource?.currentVersionId || null;
  const existing = db.entitlements.find(e => e.resourceId === resourceId && entitlementBelongsTo(e, key));
  if (existing) {
    if (key.authIdentifier && !existing.authIdentifier) existing.authIdentifier = key.authIdentifier;
    if (key.email && !existing.email) existing.email = key.email;
    if (!existing.versionId && resolvedVersionId) existing.versionId = resolvedVersionId;
    // Persist even when the row itself was already complete: a prior paid
    // order may have been backfilled in memory by the migration pass.
    saveDb(db);
    return existing;
  }

  const entitlement = {
    id: `ent-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    authIdentifier: key.authIdentifier,
    email: key.email,
    resourceId,
    versionId: resolvedVersionId,
    orderId,
    reason,
    grantedAt: new Date().toISOString()
  };
  db.entitlements.push(entitlement);
  saveDb(db);
  return entitlement;
}

export function hasEntitlement(owner, resourceId) {
  const db = loadDb();
  return db.entitlements.some(e => e.resourceId === resourceId && entitlementBelongsTo(e, owner));
}

/** Every resource id this identity may download. Drives the UI's unlocked state. */
export function getEntitlementsForEmail(email, authIdentifier = null) {
  const db = loadDb();
  return db.entitlements
    .filter(e => entitlementBelongsTo(e, { email, authIdentifier }))
    .map(e => e.resourceId);
}

export function getEntitlementsForOwner(owner) {
  const key = ownerKey(owner);
  return getEntitlementsForEmail(key.email, key.authIdentifier);
}

export function getMySpace(owner) {
  const db = loadDb();
  const key = ownerKey(owner);
  const bookings = db.bookings
    .filter(b => entitlementBelongsTo({
      authIdentifier: b.studentAuthIdentifier,
      email: b.studentEmail
    }, key) && b.status !== 'cancelled')
    .map(b => ({
      ...b,
      displayDate: b.displayDate || toDisplayDate(b.date),
      displayTime: b.displayTime || toDisplayTime(b.time)
    }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const sessions = {
    upcoming: bookings.filter(b => !isPastDate(b.date)),
    past: bookings.filter(b => isPastDate(b.date)).reverse()
  };

  const products = db.entitlements
    .filter(e => entitlementBelongsTo(e, key))
    .map(entitlement => {
      const resource = db.resources.find(r => r.id === entitlement.resourceId);
      if (!resource) return null;
      const versions = (db.resourceVersions || [])
        .filter(v => v.resourceId === resource.id)
        .sort((a, b) => a.versionNumber - b.versionNumber);
      const current = versions.find(v => v.id === resource.currentVersionId) || versions[versions.length - 1] || null;
      const acquired = versions.find(v => v.id === entitlement.versionId) || current;
      const publicResource = resourceView(resource, db);
      return {
        resourceId: resource.id,
        title: resource.title,
        subtitle: resource.subtitle || '',
        type: resource.type,
        price: resource.price,
        status: resource.status || 'published',
        mentorId: resource.mentorId,
        mentorName: resource.mentorName,
        mentorUniversity: resource.mentorUniversity,
        format: resource.format,
        pages: resource.pages,
        downloads: resource.downloads || 0,
        rating: resource.rating || 0,
        acquiredAt: entitlement.grantedAt,
        acquiredVersion: acquired ? { id: acquired.id, versionNumber: acquired.versionNumber } : null,
        currentVersion: current ? { id: current.id, versionNumber: current.versionNumber } : null,
        versions: versions.map(v => ({ id: v.id, versionNumber: v.versionNumber, createdAt: v.createdAt })),
        // Keep the public projection available for compatibility with the
        // existing client card renderer without exposing a storage handle.
        ...publicResource
      };
    })
    .filter(Boolean);

  return { sessions, products };
}

export function recordDownload(resourceId) {
  const db = loadDb();
  const resource = db.resources.find(r => r.id === resourceId);
  if (resource) resource.downloads = (resource.downloads || 0) + 1;
  saveDb(db);
}


// ─── Digital Product Orders & 1% Cut ─────────────────────

// ─── Orders & payouts ───────────────────────────────────
//
// The student pays the listed price, nothing more. frea's cut comes out of the
// mentor's payout, not out of the buyer's pocket:
//
//   student pays   £10.00
//   frea fee (5%)  £0.50   <- deducted from the mentor
//   mentor payout  £9.50
//
// An order is created 'pending' before Stripe, and only becomes 'paid' when
// Stripe's webhook confirms it. Entitlement is granted at that moment.

export function feeRate() {
  const parsed = parseFloat(process.env.FREA_FEE_RATE);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed < 1) return parsed;
  return 0.05;
}

export function splitPrice(price) {
  const total = Math.round(Number(price || 0) * 100) / 100;
  const freaFee = Math.round(total * feeRate() * 100) / 100;
  const mentorPayout = Math.round((total - freaFee) * 100) / 100;
  return { total, freaFee, mentorPayout };
}

export function createPendingOrder({ resourceId, buyerEmail, buyerAuthIdentifier }) {
  const cleanEmail = (buyerEmail || '').trim().toLowerCase();
  const cleanAuthIdentifier = (buyerAuthIdentifier || '').trim();
  if (!cleanAuthIdentifier || !cleanEmail || !isEmailVerified(cleanEmail)) {
    throw new Error('Please verify with your university before purchasing.');
  }

  const resource = getResourceById(resourceId);
  if (!resource) throw new Error('Digital product not found.');
  if (resource.status === 'archived') throw new Error('This product is no longer available.');
  if (resource.type !== 'paid' || !(resource.price > 0)) {
    throw new Error('This resource is free — no payment is needed.');
  }
  if (hasEntitlement({ email: cleanEmail, authIdentifier: cleanAuthIdentifier }, resourceId)) {
    throw new Error('You already own this playbook.');
  }

  const db = loadDb();
  const { total, freaFee, mentorPayout } = splitPrice(resource.price);

  const order = {
    id: `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    resourceId: resource.id,
    resourceTitle: resource.title,
    resourceFormat: resource.format || 'PDF',
    purchasedVersionId: resource.currentVersionId,
    mentorId: resource.mentorId,
    mentorName: resource.mentorName,
    buyerEmail: cleanEmail,
    buyerAuthIdentifier: cleanAuthIdentifier,
    totalAmount: total,
    freaFee,
    mentorPayout,
    feeRate: feeRate(),
    currency: 'gbp',
    status: 'pending',
    stripeSessionId: null,
    createdAt: new Date().toISOString()
  };

  db.orders.push(order);
  saveDb(db);
  return order;
}

export function attachStripeSession(orderId, stripeSessionId) {
  const db = loadDb();
  const order = db.orders.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found.');
  order.stripeSessionId = stripeSessionId;
  saveDb(db);
  return order;
}

/**
 * Marks an order paid and grants download access. Idempotent: Stripe retries
 * webhooks, and a retry must not double-count revenue.
 */
export function markOrderPaid(orderId, { stripePaymentIntentId = null } = {}) {
  const db = loadDb();
  const order = db.orders.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found.');

  if (order.status === 'paid') {
    // A retry may arrive after the order write succeeded but before the
    // entitlement write. Reconcile the access row on every paid retry.
    grantEntitlement({
      email: order.buyerEmail,
      authIdentifier: order.buyerAuthIdentifier,
      resourceId: order.resourceId,
      versionId: order.purchasedVersionId || null,
      orderId: order.id,
      reason: 'purchase'
    });
    return order;
  }

  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  if (stripePaymentIntentId) order.stripePaymentIntentId = stripePaymentIntentId;

  db.stats.totalProductSales = Math.round(((db.stats.totalProductSales || 0) + order.totalAmount) * 100) / 100;
  db.stats.freaPlatformRevenue = Math.round(((db.stats.freaPlatformRevenue || 0) + order.freaFee) * 100) / 100;
  db.stats.creatorPayouts = Math.round(((db.stats.creatorPayouts || 0) + order.mentorPayout) * 100) / 100;

  saveDb(db);

  grantEntitlement({
    email: order.buyerEmail,
    authIdentifier: order.buyerAuthIdentifier,
    resourceId: order.resourceId,
    versionId: order.purchasedVersionId || null,
    orderId: order.id,
    reason: 'purchase'
  });

  return order;
}

export function getOrderById(orderId) {
  const db = loadDb();
  return db.orders.find(o => o.id === orderId) || null;
}

export function getOrderByStripeSession(stripeSessionId) {
  const db = loadDb();
  return db.orders.find(o => o.stripeSessionId === stripeSessionId) || null;
}

/** Sales and payout summary for one mentor. Paid orders only. */
export function getOrdersForMentor(mentorId) {
  const db = loadDb();
  const mId = parseInt(mentorId);
  const paid = db.orders.filter(o => o.mentorId === mId && o.status === 'paid');

  const round = n => Math.round(n * 100) / 100;
  const sum = (key) => round(paid.reduce((acc, o) => acc + (o[key] || 0), 0));

  const freeDownloads = db.entitlements.filter(e => {
    if (e.reason !== 'free') return false;
    const r = getResourceById(e.resourceId);
    return r && r.mentorId === mId;
  }).length;

  return {
    mentorId: mId,
    feeRatePercent: Math.round(feeRate() * 100),
    totalOrders: paid.length,
    totalGrossSales: sum('totalAmount'),
    mentorPayout: sum('mentorPayout'),
    freaPlatformFee: sum('freaFee'),
    freeDownloads,
    orders: paid
      .slice()
      .sort((a, b) => (b.paidAt || b.createdAt).localeCompare(a.paidAt || a.createdAt))
      .map(o => ({
        id: o.id,
        resourceTitle: o.resourceTitle,
        buyerEmail: o.buyerEmail,
        totalAmount: o.totalAmount,
        mentorPayout: o.mentorPayout,
        freaFee: o.freaFee,
        paidAt: o.paidAt || o.createdAt
      }))
  };
}

// ─── Student suggestions & resource requests ────────────

export function createSuggestion({ type, university, course, text, email }) {
  const body = (text || '').trim();
  if (!body) throw new Error('Please tell us what you need.');

  const db = loadDb();
  const suggestion = {
    id: `sug-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    type: type || 'resource',
    university: (university || '').trim(),
    course: (course || '').trim(),
    text: body.slice(0, 1000),
    email: (email || '').trim().toLowerCase(),
    status: 'new',
    createdAt: new Date().toISOString()
  };
  db.suggestions.unshift(suggestion);
  saveDb(db);
  return suggestion;
}

export function getSuggestions() {
  const db = loadDb();
  return db.suggestions;
}

// ─── Reports ────────────────────────────────────────────
//
// Publishing is instant and unreviewed by design, so this is the safety net:
// any verified student can flag a profile or resource, and it lands in the
// admin view. Nothing is auto-hidden — a report is a signal, not a verdict.

const REPORT_REASONS = new Set([
  'inappropriate', 'misleading', 'copyright', 'spam', 'not-a-student', 'other'
]);

export function createReport({ targetType, targetId, reason, detail, reporterEmail }) {
  const type = String(targetType || '').trim();
  if (type !== 'mentor' && type !== 'resource') {
    throw new Error('Reports must target a mentor or a resource.');
  }
  if (!targetId) throw new Error('Nothing was selected to report.');

  const cleanReason = REPORT_REASONS.has(reason) ? reason : 'other';
  const email = (reporterEmail || '').trim().toLowerCase();

  const db = loadDb();
  db.reports = db.reports || [];

  // One open report per person per target, so a single upset student cannot
  // flood the queue and drown out everyone else.
  const existing = db.reports.find(
    r => r.targetType === type && String(r.targetId) === String(targetId)
      && r.reporterEmail === email && r.status === 'open'
  );
  if (existing) {
    throw new Error('You have already reported this — our team is looking at it.');
  }

  let targetLabel = '';
  if (type === 'mentor') {
    const mentor = db.mentors.find(m => m.id === parseInt(targetId));
    targetLabel = mentor ? `${mentor.name} (${mentor.university})` : `mentor ${targetId}`;
  } else {
    const resource = getResourceById(targetId);
    targetLabel = resource ? `${resource.title} by ${resource.mentorName}` : `resource ${targetId}`;
  }

  const report = {
    id: `rep-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    targetType: type,
    targetId: String(targetId),
    targetLabel,
    reason: cleanReason,
    detail: cleanText(detail, 800),
    reporterEmail: email,
    status: 'open',
    createdAt: new Date().toISOString()
  };

  db.reports.push(report);
  saveDb(db);
  return report;
}

export function getReports() {
  const db = loadDb();
  return (db.reports || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function resolveReport(reportId) {
  const db = loadDb();
  const report = (db.reports || []).find(r => r.id === reportId);
  if (!report) throw new Error('Report not found.');
  report.status = 'resolved';
  report.resolvedAt = new Date().toISOString();
  saveDb(db);
  return report;
}

// ─── Connect payout accounts ────────────────────────────

/** Records the mentor's Stripe account id and its current payout readiness. */
export function setMentorPayoutAccount(mentorId, { accountId, payoutsEnabled, currentlyDue }) {
  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(mentorId));
  if (!mentor) throw new Error('Mentor not found');

  if (accountId) mentor.stripeAccountId = accountId;
  if (payoutsEnabled !== undefined) mentor.payoutsEnabled = Boolean(payoutsEnabled);
  if (currentlyDue !== undefined) mentor.payoutRequirements = currentlyDue;
  mentor.payoutUpdatedAt = new Date().toISOString();

  saveDb(db);
  return mentor;
}

export function findMentorByStripeAccount(accountId) {
  const db = loadDb();
  return db.mentors.find(m => m.stripeAccountId === accountId) || null;
}

/**
 * A mentor may only price a playbook once money can actually reach them.
 * Selling before that would take a student's payment with nowhere to send it.
 */
export function canMentorSell(mentorId) {
  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(mentorId));
  return Boolean(mentor && mentor.stripeAccountId && mentor.payoutsEnabled);
}

// ─── Mail hand-off log ──────────────────────────────────

/**
 * How many sends to keep. Each entry is a few dozen bytes and the whole
 * document is rewritten on every save, so this is a cap on write cost as much
 * as on disk.
 */
const MAIL_LOG_MAX = 500;

/**
 * Records one hand-off to the mail provider.
 *
 * This existed only in memory, which meant it was wiped by every deploy — and
 * a deploy is exactly what tends to follow someone reporting that mail was
 * slow. By the time anyone looked, the number was gone. Persisting it is what
 * makes "was it us?" answerable after the fact instead of only while the
 * process that sent it is still running.
 *
 * Recipient DOMAIN only, never the address. The question this answers is
 * whether a given university is slower than the rest, and the local part
 * cannot help with that while being the part that identifies a student.
 *
 * `messageId` is the provider's handle for the message. It was being thrown
 * away, which left "I never got my code" with nothing to look up.
 */
export function recordMailHandoff({ to, kind, ms, ok, messageId = null, error = null }) {
  try {
    const domain = String(to || '').split('@').pop().trim().toLowerCase() || 'unknown';
    const db = loadDb();
    db.mailLog = Array.isArray(db.mailLog) ? db.mailLog : [];
    db.mailLog.push({
      at: new Date().toISOString(),
      domain,
      kind: kind || 'unknown',
      ms,
      ok: Boolean(ok),
      messageId,
      // Provider text only: it names the rejection, not the recipient.
      ...(error ? { error: String(error).slice(0, 200) } : {})
    });
    if (db.mailLog.length > MAIL_LOG_MAX) {
      db.mailLog = db.mailLog.slice(-MAIL_LOG_MAX);
    }
    saveDb(db);
  } catch (err) {
    // Never let bookkeeping fail a send that already succeeded.
    console.warn('[db] could not record mail hand-off:', err.message);
  }
}

/**
 * Hand-off timings grouped by recipient domain, worst median first.
 *
 * Our hand-off is to the provider, not to the university, so an even spread
 * here is the expected result and is itself the finding: it places the delay
 * downstream of us. A single domain standing out means the provider is
 * rejecting or stalling on that domain specifically, which is the one part of
 * this we can act on directly.
 */
export function mailHandoffStats() {
  const db = loadDb();
  const log = Array.isArray(db.mailLog) ? db.mailLog : [];
  if (!log.length) return { sends: 0, domains: [] };

  const byDomain = new Map();
  for (const entry of log) {
    if (!byDomain.has(entry.domain)) byDomain.set(entry.domain, []);
    byDomain.get(entry.domain).push(entry);
  }

  const median = (nums) => {
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };

  const domains = [...byDomain.entries()].map(([domain, entries]) => {
    const times = entries.map(e => e.ms).filter(n => typeof n === 'number');
    return {
      domain,
      sends: entries.length,
      failed: entries.filter(e => !e.ok).length,
      medianMs: times.length ? median(times) : null,
      maxMs: times.length ? Math.max(...times) : null,
      lastAt: entries[entries.length - 1].at
    };
  }).sort((a, b) => (b.medianMs || 0) - (a.medianMs || 0));

  const allTimes = log.map(e => e.ms).filter(n => typeof n === 'number');
  return {
    sends: log.length,
    failed: log.filter(e => !e.ok).length,
    medianMs: allTimes.length ? median(allTimes) : null,
    since: log[0].at,
    domains
  };
}

/** Recent hand-offs, newest first — for tracing one report of a missing code. */
export function recentMailHandoffs(limit = 50) {
  const db = loadDb();
  const log = Array.isArray(db.mailLog) ? db.mailLog : [];
  return log.slice(-limit).reverse();
}

// ─── Microsoft sign-in, in-flight state ─────────────────

/**
 * One row per sign-in attempt, held between the redirect out to Microsoft and
 * the callback coming back.
 *
 * Persisted rather than kept in memory because a Railway restart mid-flow
 * would otherwise reject a perfectly good callback with "state not
 * recognised", which reads to the student as the login being broken. Rows are
 * single-use and short-lived, so the table stays tiny.
 */
export function saveOAuthState({ state, nonce, codeVerifier, returnTo = null, expiresAt }) {
  const db = loadDb();
  const now = Date.now();
  db.oauthStates = (Array.isArray(db.oauthStates) ? db.oauthStates : [])
    .filter(s => (s.expiresAt || 0) > now);
  db.oauthStates.push({
    state, nonce, codeVerifier, returnTo,
    expiresAt: expiresAt || (now + 10 * 60 * 1000),
    createdAt: new Date().toISOString()
  });
  saveDb(db);
}

/**
 * Reads a state row and deletes it in the same step.
 *
 * Single use is the point: a replayed callback is how an intercepted code gets
 * turned into a second session, so the row has to be gone before the code is
 * exchanged, not after.
 */
export function consumeOAuthState(state) {
  if (!state) return null;
  const db = loadDb();
  const now = Date.now();
  const all = Array.isArray(db.oauthStates) ? db.oauthStates : [];
  const row = all.find(s => s.state === state);
  db.oauthStates = all.filter(s => s.state !== state && (s.expiresAt || 0) > now);
  saveDb(db);
  if (!row) return null;
  if ((row.expiresAt || 0) <= now) return null;
  return row;
}

// ─── University sign-in (Studid) ────────────────────────

/** One row per sign-in attempt, held between leaving for the IdP and returning. */
export function saveStudidState({ state, verificationId, secretToken, expiresAt }) {
  const db = loadDb();
  const now = Date.now();
  db.studidStates = (Array.isArray(db.studidStates) ? db.studidStates : [])
    .filter(s => (s.expiresAt || 0) > now);
  db.studidStates.push({
    state, verificationId, secretToken,
    expiresAt: expiresAt || (now + 30 * 60 * 1000),
    createdAt: new Date().toISOString()
  });
  saveDb(db);
}

/**
 * Reads a state row and deletes it in the same step.
 *
 * Single use, because the row holds the secret that reads the verification
 * result back — a replayed callback would otherwise mint a second session
 * from one sign-in.
 */
export function consumeStudidState(state) {
  if (!state) return null;
  const db = loadDb();
  const now = Date.now();
  const all = Array.isArray(db.studidStates) ? db.studidStates : [];
  const row = all.find(s => s.state === state);
  db.studidStates = all.filter(s => s.state !== state && (s.expiresAt || 0) > now);
  saveDb(db);
  if (!row || (row.expiresAt || 0) <= now) return null;
  return row;
}

/**
 * The link between a university identity and the contact address we mail.
 *
 * `authIdentifier` is the university's stable pseudonym for this student, and
 * it is the real primary key now that no .ac.uk address is collected. The
 * contact email is whatever they asked us to write to — usually personal, and
 * deliberately not proof of anything.
 *
 * Keying on the pseudonym rather than the address is what stops one student
 * holding unlimited accounts by typing a different mailbox each time, and it
 * is what lets a returning student sign in without re-entering anything.
 */
export function findStudentIdentity(authIdentifier) {
  if (!authIdentifier) return null;
  const db = loadDb();
  return (db.studentIdentities || []).find(i => i.authIdentifier === authIdentifier) || null;
}

/** Records a first sign-in, or refreshes what the university last told us. */
export function upsertStudentIdentity({ authIdentifier, entityId, affiliations = [], contactEmail, institutionName = null, scope = null }) {
  const db = loadDb();
  db.studentIdentities = Array.isArray(db.studentIdentities) ? db.studentIdentities : [];

  const clean = (contactEmail || '').trim().toLowerCase();
  const existing = db.studentIdentities.find(i => i.authIdentifier === authIdentifier);

  if (existing) {
    existing.entityId = entityId;
    existing.affiliations = affiliations;
    if (institutionName) existing.institutionName = institutionName;
    if (scope) existing.scope = scope;
    if (clean) existing.contactEmail = clean;
    existing.lastSeenAt = new Date().toISOString();
  } else {
    db.studentIdentities.push({
      authIdentifier,
      entityId,
      affiliations,
      institutionName,
      scope,
      contactEmail: clean,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    });
  }

  // Bind any legacy rows that were waiting for this identity to appear.
  db.mentors.forEach(mentor => {
    if (!mentor.authIdentifier && clean && mentor.email === clean) {
      mentor.authIdentifier = authIdentifier;
    }
  });
  db.bookings.forEach(booking => {
    if (!booking.studentAuthIdentifier && clean && booking.studentEmail === clean) {
      booking.studentAuthIdentifier = authIdentifier;
    }
  });
  db.orders.forEach(order => {
    if (!order.buyerAuthIdentifier && clean && order.buyerEmail === clean) {
      order.buyerAuthIdentifier = authIdentifier;
    }
  });
  db.entitlements.forEach(entitlement => {
    if (!entitlement.authIdentifier && clean && entitlement.email === clean) {
      entitlement.authIdentifier = authIdentifier;
    }
  });
  db.stars = Array.isArray(db.stars) ? db.stars : [];
  db.stars.forEach(star => {
    if (!star.authIdentifier && clean && star.email === clean) {
      star.authIdentifier = authIdentifier;
    }
  });
  db.sessions.forEach(session => {
    if (!session.authIdentifier && clean && session.email === clean) {
      session.authIdentifier = authIdentifier;
    }
  });

  saveDb(db);
  return findStudentIdentity(authIdentifier);
}

/**
 * Whether a contact address already belongs to a different university
 * identity.
 *
 * The address is unverified now, so without this one student could type
 * another's address and receive their calendar invites and confirmations.
 * Two people cannot share one contact address; the same person returning is
 * fine, which is why the pseudonym is compared rather than just the address.
 */
export function contactEmailTakenBy(email, authIdentifier) {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return null;
  const db = loadDb();
  const clash = (db.studentIdentities || [])
    .find(i => i.contactEmail === clean && i.authIdentifier !== authIdentifier);
  return clash || null;
}

/**
 * The identity behind a contact address, for signing in.
 *
 * Registration proves who someone is through their university; every sign-in
 * afterwards only has to prove they still hold the inbox they nominated, and
 * this is the lookup that connects the two. It is also what keeps a graduate
 * in their account: university SSO stops working the day they leave, and
 * mentors are often recent graduates, so an account that outlives the degree
 * is a requirement rather than a convenience.
 */
export function findIdentityByContactEmail(email) {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return null;
  const db = loadDb();
  return (db.studentIdentities || []).find(i => i.contactEmail === clean) || null;
}

// ─── Contact address awaiting proof ─────────────────────

/**
 * A university identity and the address someone has asked us to bind to it,
 * held until a code proves they can read that inbox.
 *
 * Nothing here grants anything. It exists precisely so that nominating an
 * address does not, on its own, carry authority: the identity is not written
 * and no session is opened until the code comes back. Claiming someone else's
 * address therefore achieves nothing — the code is delivered to them, and the
 * claim expires unused.
 *
 * Keyed by address, so a second attempt simply replaces the first rather than
 * leaving a queue of stale claims on one inbox.
 */
export function savePendingBinding({ email, proof, expiresAt }) {
  const db = loadDb();
  const clean = (email || '').trim().toLowerCase();
  const now = Date.now();
  db.pendingBindings = (Array.isArray(db.pendingBindings) ? db.pendingBindings : [])
    .filter(b => b.email !== clean && (b.expiresAt || 0) > now);
  db.pendingBindings.push({
    email: clean,
    proof,
    expiresAt: expiresAt || (now + 24 * 60 * 60 * 1000),
    createdAt: new Date().toISOString()
  });
  saveDb(db);
}

/** Reads a pending binding and deletes it in the same step. */
export function consumePendingBinding(email) {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return null;
  const db = loadDb();
  const now = Date.now();
  const all = Array.isArray(db.pendingBindings) ? db.pendingBindings : [];
  const row = all.find(b => b.email === clean);
  db.pendingBindings = all.filter(b => b.email !== clean && (b.expiresAt || 0) > now);
  saveDb(db);
  if (!row || (row.expiresAt || 0) <= now) return null;
  return row;
}
