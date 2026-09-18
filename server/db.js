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
function migrate(db) {
  db.mentors = db.mentors || INITIAL_MENTORS;
  db.bookings = db.bookings || [];
  db.mentorApplications = db.mentorApplications || [];
  db.verifiedEmails = db.verifiedEmails || [];
  db.verificationTokens = db.verificationTokens || [];
  db.resources = db.resources || [];
  db.orders = db.orders || [];
  db.entitlements = db.entitlements || [];
  db.sessions = db.sessions || [];
  db.suggestions = db.suggestions || [];
  db.reports = db.reports || [];
  db.stats = db.stats || {};
  if (typeof db.stats.totalBookings !== 'number') db.stats.totalBookings = 0;
  if (typeof db.stats.averageRating !== 'number') db.stats.averageRating = 4.9;

  db.mentors.forEach(m => {
    // Schedules were once keyed by day name and/or held 12-hour times.
    m.weeklySchedule = normaliseSchedule(m.weeklySchedule);
    delete m.schedule; // a stale duplicate the old portal wrote

    // Mentors may now attach any number of links; fold the old single fields in.
    if (!Array.isArray(m.links)) {
      const links = [];
      if (m.linkedin) links.push({ label: 'LinkedIn', url: m.linkedin });
      if (m.website) links.push({ label: 'Website', url: m.website });
      m.links = links;
    }
    if (!Array.isArray(m.docs)) m.docs = [];
    if (typeof m.callsCompleted !== 'number') m.callsCompleted = 0;
    if (typeof m.payoutsEnabled !== 'boolean') m.payoutsEnabled = false;
  });

  // Bookings were once stored with display dates ("Wed 2 Sep") and 12-hour
  // times, which never matched the ISO dates the slot engine compares against.
  db.bookings.forEach(b => {
    const year = b.createdAt ? new Date(b.createdAt).getUTCFullYear() : new Date().getFullYear();
    const canonicalDate = toCanonicalDate(b.date, year);
    if (canonicalDate) b.date = canonicalDate;
    const canonicalTime = toCanonicalTime(b.time);
    if (canonicalTime) b.time = canonicalTime;
    if (!b.status) b.status = 'confirmed';
  });

  return db;
}



export function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return migrate(JSON.parse(raw));
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

  return list;
}


export function findMentorByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const db = loadDb();
  return db.mentors.find(m => m.email && m.email.toLowerCase() === cleanEmail) || null;
}

export function getMentorById(id) {
  const db = loadDb();
  return db.mentors.find(m => m.id === parseInt(id)) || null;
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

    const availableSlots = past ? [] : recurringSlots.filter(slot => {
      const isBooked = bookings.some(
        b => b.date === dateStr && b.time === slot && b.status !== 'cancelled'
      );
      return !isBooked;
    });

    daysResult.push({
      date: dateStr,
      dayNumber: day,
      dayOfWeek: dayOfWeekStr,
      dayOfWeekIdx,
      displayDate,
      isPast: past,
      slots: availableSlots,
      slotsDisplay: availableSlots.map(toDisplayTime),
      hasSlots: availableSlots.length > 0,
      slotCount: availableSlots.length
    });

    availableSlots.forEach(slot => {
      allOpenSlots.push({
        date: dateStr,
        displayDate,
        dayOfWeek: dayOfWeekStr,
        dayNumber: day,
        time: slot,
        timeDisplay: toDisplayTime(slot),
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

export function createBooking({ mentorId, studentEmail, date, time }) {
  const email = (studentEmail || '').trim().toLowerCase();
  if (!email || !email.endsWith('.ac.uk')) {
    throw new Error('Verification failed: You must use an official UK university email ending in ".ac.uk"');
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
    b.studentEmail === email &&
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
export function cancelBooking({ bookingId, email, cancelToken, isAdmin = false }) {
  const db = loadDb();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) throw new Error('Booking not found.');

  const clean = (email || '').trim().toLowerCase();
  const allowed = isAdmin
    || (cancelToken && cancelToken === booking.cancelToken)
    || (clean && (clean === booking.studentEmail || clean === booking.mentorEmail));

  if (!allowed) {
    throw new Error('You do not have permission to cancel this booking.');
  }
  if (booking.status === 'cancelled') return booking;

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  booking.cancelledBy = isAdmin ? 'admin' : (clean === booking.mentorEmail ? 'mentor' : 'student');

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

/** Bookings for one student, by verified email. */
export function getBookingsForStudent(email) {
  const db = loadDb();
  const clean = (email || '').trim().toLowerCase();
  const all = db.bookings
    .filter(b => b.studentEmail === clean && b.status !== 'cancelled')
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

/** Bounds a submitted price the same way createResource does, so a bad value
 * cannot reach the UI and render as "£NaN". */
function clampPrice(value) {
  const parsed = Math.round(parseFloat(value) * 100) / 100;
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 1), 100);
}

export function createMentorApplication(appData) {
  const email = (appData.email || '').trim().toLowerCase();
  if (!email || !email.endsWith('.ac.uk')) {
    throw new Error('Application verification failed: A genuine UK student email ending in ".ac.uk" is required.');
  }

  const db = loadDb();

  // Check if mentor already exists by email
  let mentor = db.mentors.find(m => m.email && m.email.toLowerCase() === email);

  if (mentor) {
    // Update existing mentor profile
    if (appData.name) mentor.name = appData.name;
    if (appData.university) mentor.university = appData.university;
    if (appData.major || appData.degree) mentor.major = appData.major || appData.degree;
    if (appData.year) mentor.year = appData.year;
    if (appData.topTip) mentor.topTip = appData.topTip;
    if (appData.topTipColor || appData.postitColor) mentor.topTipColor = appData.topTipColor || appData.postitColor;
    if (appData.achievements) mentor.achievements = appData.achievements;
    if (appData.photoUrl) mentor.photoUrl = appData.photoUrl;
    if (appData.avatarId) mentor.avatarId = appData.avatarId;
    if (appData.pitchVideoUrl) mentor.pitchVideoUrl = appData.pitchVideoUrl;
    if (appData.linkedin) mentor.linkedin = appData.linkedin;
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
      year: cleanText(appData.year, 40) || '2nd year',
      major: cleanText(appData.major || appData.degree, 80) || 'Undergraduate',
      university: cleanText(appData.university, 100),
      bio: cleanText(appData.bio, 1200) || ('Senior student at ' + cleanText(appData.university, 100) + '. Happy to chat about course survival, applications, and student life.'),
      topTip: cleanText(appData.topTip, 140) || 'Reach out to older students early and test your revision methods!',
      topTipColor: postitColor,
      achievements: appData.achievements && appData.achievements.length > 0 ? appData.achievements : ['verified-mentor'],
      helpsWith: [appData.major || appData.degree || 'academics', 'exam tips', 'cv roast', 'applications'],
      rating: 5.0,
      callsCompleted: 0,
      linkedin: appData.linkedin || '',
      links: sanitiseLinks(
        appData.links && appData.links.length
          ? appData.links
          : [appData.linkedin, appData.website].filter(Boolean)
      ),
      pitchVideoUrl: appData.pitchVideoUrl || '',
      photoUrl: appData.photoUrl || '',
      avatarId: appData.avatarId || 1,
      interviewRequired: false,
      status: 'active',
      weeklySchedule: normaliseSchedule(
        appData.weeklySchedule || { 1: ['10:00', '14:00'], 3: ['11:00', '15:30'], 5: ['13:00', '16:30'] }
      ),
      color: colorMap[postitColor] || 'blue',
      docs: []
    };

    db.mentors.unshift(mentor);
  }

  // Handle optional first attached resource
  if (appData.attachedDoc && appData.attachedDoc.title) {
    const doc = appData.attachedDoc;
    const resource = {
      id: 'doc-' + mentor.id + '-' + Date.now(),
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorUniversity: mentor.university,
      mentorMajor: mentor.major,
      title: doc.title,
      subtitle: doc.description || ('Shared by ' + mentor.name),
      type: doc.type === 'paid' ? 'paid' : 'free',
      price: doc.type === 'paid' ? clampPrice(doc.price) : 0,
      format: doc.format || (doc.fileUrl && doc.fileUrl.endsWith('.pdf') ? 'PDF' : (doc.fileUrl && doc.fileUrl.endsWith('.pptx') ? 'PowerPoint' : 'Markdown')),
      fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || (doc.fileUrl ? doc.fileUrl.split('/').pop() : ''),
      pages: 'Self-contained study guide',
      category: doc.category || 'General',
      downloads: 0,
      rating: 5.0,
      createdAt: new Date().toISOString()
    };
    mentor.docs = mentor.docs || [];
    mentor.docs.push(resource);
    if (!db.resources) db.resources = [];
    db.resources.unshift(resource);
  }

  // Application record for audit
  const application = {
    id: 'frea-app-' + Date.now(),
    name: appData.name,
    university: appData.university,
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
  db.verificationTokens = db.verificationTokens.filter(t => t.email !== cleanEmail);
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
  // Single-use, same as the six-digit code.
  db.verificationTokens = db.verificationTokens.filter(t => t.token !== token);
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
  if (updates.university) mentor.university = cleanText(updates.university, 100);
  if (updates.bio) mentor.bio = cleanText(updates.bio, 1200);
  if (updates.topTip) mentor.topTip = cleanText(updates.topTip, 140);
  if (updates.topTipColor) mentor.topTipColor = cleanText(updates.topTipColor, 20);
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
  if (updates.pitchVideoUrl !== undefined) mentor.pitchVideoUrl = String(updates.pitchVideoUrl).trim();

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

export function getAllResources() {
  const db = loadDb();
  // Combine resources table with all mentor docs
  const list = [...(db.resources || [])];
  db.mentors.forEach(m => {
    if (m.docs && Array.isArray(m.docs)) {
      m.docs.forEach(d => {
        if (!list.some(r => r.id === d.id)) {
          list.push({
            ...d,
            mentorId: m.id,
            mentorName: m.name,
            mentorUniversity: m.university,
            mentorMajor: m.major
          });
        }
      });
    }
  });
  return list;
}

/** Look one resource up wherever it lives (top-level table or a mentor's docs). */
export function getResourceById(id) {
  const db = loadDb();
  const direct = (db.resources || []).find(r => r.id === id);
  if (direct) return direct;
  for (const m of db.mentors) {
    const d = (m.docs || []).find(doc => doc.id === id);
    if (d) return { ...d, mentorId: m.id, mentorName: m.name, mentorUniversity: m.university };
  }
  return null;
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

  // fileName is the on-disk handle returned by the upload endpoint. There is no
  // public URL by design — downloads are streamed through an authorised route.
  if (!resourceData.fileName) {
    throw new Error('Upload a document file before publishing.');
  }

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
    // fileName is the on-disk name; downloads are streamed through an
    // authenticated route, never linked to directly.
    fileName: resourceData.fileName,
    pages: resourceData.pages || 'Self-contained document',
    category: resourceData.category || 'General',
    previewBullets: Array.isArray(resourceData.previewBullets)
      ? resourceData.previewBullets.map(b => cleanText(b, 160)).filter(Boolean).slice(0, 5)
      : [],
    downloads: 0,
    rating: 5.0,
    createdAt: new Date().toISOString()
  };

  db.resources.unshift(resource);
  mentor.docs = mentor.docs || [];
  mentor.docs.unshift(resource);

  saveDb(db);
  return resource;
}

/** Update a resource's listing fields. Price/type editable; the file is not. */
export function updateResource(id, updates) {
  const db = loadDb();
  const apply = (r) => {
    if (updates.title != null && cleanText(updates.title, 120)) r.title = cleanText(updates.title, 120);
    if (updates.subtitle != null) r.subtitle = cleanText(updates.subtitle, 300);
    if (updates.category != null) r.category = updates.category;
    if (updates.type === 'free') {
      r.type = 'free';
      r.price = 0;
    } else if (updates.type === 'paid') {
      const price = Math.round(parseFloat(updates.price || r.price || 0) * 100) / 100;
      if (!(price >= 1) || price > 100) {
        throw new Error('Playbooks must be priced between £1.00 and £100.00.');
      }
      r.type = 'paid';
      r.price = price;
    }
    return r;
  };

  let found = null;
  db.resources.forEach(r => { if (r.id === id) found = apply(r); });
  db.mentors.forEach(m => (m.docs || []).forEach(d => { if (d.id === id) apply(d); }));

  if (!found) throw new Error('Resource not found.');
  saveDb(db);
  return found;
}

export function deleteResource(id) {
  const db = loadDb();
  db.resources = db.resources.filter(r => r.id !== id);
  db.mentors.forEach(m => {
    if (m.docs) {
      m.docs = m.docs.filter(d => d.id !== id);
    }
  });
  saveDb(db);
  return { success: true, id };
}

// ─── Entitlements: who may download what ───────────────
//
// Access lives on the server, keyed to a verified email. Clearing browser
// storage no longer grants or revokes anything.

export function grantEntitlement({ email, resourceId, orderId = null, reason = 'purchase' }) {
  const db = loadDb();
  const clean = (email || '').trim().toLowerCase();

  const existing = db.entitlements.find(e => e.email === clean && e.resourceId === resourceId);
  if (existing) return existing;

  const entitlement = {
    id: `ent-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    email: clean,
    resourceId,
    orderId,
    reason,
    grantedAt: new Date().toISOString()
  };
  db.entitlements.push(entitlement);
  saveDb(db);
  return entitlement;
}

export function hasEntitlement(email, resourceId) {
  const db = loadDb();
  const clean = (email || '').trim().toLowerCase();
  return db.entitlements.some(e => e.email === clean && e.resourceId === resourceId);
}

/** Every resource id this email may download. Drives the UI's unlocked state. */
export function getEntitlementsForEmail(email) {
  const db = loadDb();
  const clean = (email || '').trim().toLowerCase();
  return db.entitlements.filter(e => e.email === clean).map(e => e.resourceId);
}

export function recordDownload(resourceId) {
  const db = loadDb();
  const bump = r => { if (r.id === resourceId) r.downloads = (r.downloads || 0) + 1; };
  db.resources.forEach(bump);
  db.mentors.forEach(m => (m.docs || []).forEach(bump));
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

export function createPendingOrder({ resourceId, buyerEmail }) {
  const cleanEmail = (buyerEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.endsWith('.ac.uk')) {
    throw new Error('A genuine UK student email ending in .ac.uk is required for download access and receipts.');
  }

  const resource = getResourceById(resourceId);
  if (!resource) throw new Error('Digital product not found.');
  if (resource.type !== 'paid' || !(resource.price > 0)) {
    throw new Error('This resource is free — no payment is needed.');
  }
  if (hasEntitlement(cleanEmail, resourceId)) {
    throw new Error('You already own this playbook.');
  }

  const db = loadDb();
  const { total, freaFee, mentorPayout } = splitPrice(resource.price);

  const order = {
    id: `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    resourceId: resource.id,
    resourceTitle: resource.title,
    resourceFormat: resource.format || 'PDF',
    mentorId: resource.mentorId,
    mentorName: resource.mentorName,
    buyerEmail: cleanEmail,
    totalAmount: total,      // what the student pays
    freaFee,                 // frea's cut, deducted from the mentor
    mentorPayout,            // what the mentor actually receives
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

  if (order.status === 'paid') return order;

  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  if (stripePaymentIntentId) order.stripePaymentIntentId = stripePaymentIntentId;

  db.stats.totalProductSales = Math.round(((db.stats.totalProductSales || 0) + order.totalAmount) * 100) / 100;
  db.stats.freaPlatformRevenue = Math.round(((db.stats.freaPlatformRevenue || 0) + order.freaFee) * 100) / 100;
  db.stats.creatorPayouts = Math.round(((db.stats.creatorPayouts || 0) + order.mentorPayout) * 100) / 100;

  saveDb(db);

  grantEntitlement({
    email: order.buyerEmail,
    resourceId: order.resourceId,
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
