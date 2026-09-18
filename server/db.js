// ─────────────────────────────────────────────
// frea — Backend Database & Dynamic Scheduling Engine
// ─────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

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
export function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      parsed.mentors = parsed.mentors || INITIAL_MENTORS;
      parsed.bookings = parsed.bookings || [];
      parsed.mentorApplications = parsed.mentorApplications || [];
      parsed.verifiedEmails = parsed.verifiedEmails || [];
      parsed.verificationTokens = parsed.verificationTokens || [];
      parsed.resources = parsed.resources || [];
      parsed.stats = parsed.stats || { totalBookings: 12048, verifiedMentors: parsed.mentors.length, averageRating: 4.9 };
      return parsed;
    }
  } catch (err) {
    console.warn('[db] Failed reading data.json, initializing fresh db', err);
  }

  const initialDb = {
    mentors: INITIAL_MENTORS,
    bookings: [],
    mentorApplications: [],
    verifiedEmails: [],
    verificationTokens: [],
    resources: [],
    stats: {
      totalBookings: 12048,
      verifiedMentors: 500,
      averageRating: 4.9
    }
  };

  saveDb(initialDb);
  return initialDb;
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[db] Error saving data.json', err);
  }
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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = monthNames[targetMonth - 1];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(targetYear, targetMonth - 1, day);
    const dayOfWeekIdx = dateObj.getDay(); // 0 = Sun, 1 = Mon, ...
    const dayOfWeekStr = dayNames[dayOfWeekIdx];

    // Check if mentor has weekly slots for this weekday
    const recurringSlots = schedule[dayOfWeekIdx] || [];

    // Format ISO date string YYYY-MM-DD
    const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const displayDate = `${dayOfWeekStr} ${day} ${monthName}`;

    // Filter out already booked slots
    const availableSlots = recurringSlots.filter(slot => {
      const isBooked = bookings.some(b => b.date === dateStr && b.time === slot && b.status !== 'cancelled');
      return !isBooked;
    });

    const dayData = {
      date: dateStr,
      dayNumber: day,
      dayOfWeek: dayOfWeekStr,
      dayOfWeekIdx,
      displayDate,
      slots: availableSlots,
      hasSlots: availableSlots.length > 0,
      slotCount: availableSlots.length
    };

    daysResult.push(dayData);

    // Add to flattened list
    availableSlots.forEach(slot => {
      allOpenSlots.push({
        date: dateStr,
        displayDate,
        dayOfWeek: dayOfWeekStr,
        dayNumber: day,
        time: slot,
        slotBadge: "20-min Google Meet"
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

  const mentor = getMentorById(mentorId);
  if (!mentor) {
    throw new Error('Mentor not found');
  }

  const db = loadDb();

  // Check double-booking
  const exists = db.bookings.some(b =>
    b.mentorId === parseInt(mentorId) &&
    b.date === date &&
    b.time === time &&
    b.status !== 'cancelled'
  );

  if (exists) {
    throw new Error('This time slot has already been booked by another student. Please select another slot.');
  }

  // Generate Google Meet link code
  const code1 = Math.random().toString(36).substring(2, 5);
  const code2 = Math.random().toString(36).substring(2, 6);
  const code3 = Math.random().toString(36).substring(2, 5);
  const googleMeetUrl = `https://meet.google.com/${code1}-${code2}-${code3}`;

  const booking = {
    id: `frea-bk-${Date.now()}`,
    mentorId: mentor.id,
    mentorName: mentor.name,
    studentEmail: email,
    date,
    time,
    timezone: 'BST (UK London Time)',
    googleMeetUrl,
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

// ─── Create Mentor Application ──────────────

export function createMentorApplication(appData) {
  const email = (appData.email || '').trim().toLowerCase();
  if (!email || !email.endsWith('.ac.uk')) {
    throw new Error('Application verification failed: A genuine UK student email ending in ".ac.uk" is required.');
  }

  const db = loadDb();

  const application = {
    id: `frea-app-${Date.now()}`,
    name: appData.name,
    university: appData.university,
    major: appData.major,
    year: appData.year,
    email,
    achievements: appData.achievements || [],
    topTip: appData.topTip,
    postitColor: appData.postitColor || 'yellow',
    status: 'pending_verification',
    submittedAt: new Date().toISOString()
  };

  db.mentorApplications.push(application);
  saveDb(db);

  return application;
}

// ─── Stats ──────────────────────────────────

export function getStats() {
  const db = loadDb();
  return {
    totalBookings: db.stats.totalBookings,
    verifiedMentors: db.mentors.length,
    pendingApplications: db.mentorApplications.filter(a => a.status === 'pending_verification' || a.status === 'pending_review').length,
    averageRating: db.stats.averageRating
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

  const record = db.verificationTokens.find(t => t.email === cleanEmail && t.code === cleanCode);
  if (!record) {
    // Also check master/dev code for testing ease
    if (cleanCode === '123456') {
      if (!db.verifiedEmails.includes(cleanEmail)) {
        db.verifiedEmails.push(cleanEmail);
        saveDb(db);
      }
      return { success: true, email: cleanEmail };
    }
    throw new Error('Invalid verification code. Please check your email or request a new code.');
  }

  if (Date.now() > record.expiresAt) {
    throw new Error('Verification code has expired. Please request a new code.');
  }

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

export function approveMentorApplication(appId) {
  const db = loadDb();
  const app = db.mentorApplications.find(a => a.id === appId);
  if (!app) {
    throw new Error('Mentor application not found');
  }

  // Create mentor in database
  const nextId = db.mentors.length > 0 ? Math.max(...db.mentors.map(m => m.id)) + 1 : 1;
  const newMentor = {
    id: nextId,
    name: app.name,
    year: app.year || '3rd year (BSc)',
    major: app.major || 'Undergraduate',
    university: app.university,
    bio: app.bio || `Senior peer mentor at ${app.university}. Happy to help with coursework, applications, and student life.`,
    topTip: app.topTip || 'Always ask questions and start projects early!',
    topTipColor: app.postitColor || 'yellow',
    achievements: app.achievements && app.achievements.length > 0 ? app.achievements : ['first-class-honours'],
    helpsWith: [app.major, 'university survival', 'cv roast', 'applications'],
    rating: 5.0,
    callsCompleted: 0,
    weeklySchedule: {
      1: ["10:00 AM", "2:00 PM"],
      3: ["11:00 AM", "3:30 PM"],
      5: ["1:00 PM", "4:30 PM"]
    },
    color: app.postitColor === 'mint' ? 'green' : (app.postitColor === 'blush' ? 'pink' : 'blue'),
    docs: []
  };

  db.mentors.push(newMentor);
  app.status = 'approved';
  app.approvedAt = new Date().toISOString();
  app.mentorId = nextId;

  db.stats.verifiedMentors = db.mentors.length;
  saveDb(db);

  return { application: app, mentor: newMentor };
}

export function rejectMentorApplication(appId) {
  const db = loadDb();
  const app = db.mentorApplications.find(a => a.id === appId);
  if (!app) {
    throw new Error('Mentor application not found');
  }
  app.status = 'rejected';
  app.rejectedAt = new Date().toISOString();
  saveDb(db);
  return app;
}

// ─── Mentor Portal Profile & Schedule CRUD ─────────

export function updateMentorProfile(id, updates) {
  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(id));
  if (!mentor) {
    throw new Error('Mentor not found');
  }

  if (updates.name) mentor.name = updates.name.trim();
  if (updates.year) mentor.year = updates.year.trim();
  if (updates.major) mentor.major = updates.major.trim();
  if (updates.university) mentor.university = updates.university.trim();
  if (updates.bio) mentor.bio = updates.bio.trim();
  if (updates.topTip) mentor.topTip = updates.topTip.trim();
  if (updates.topTipColor) mentor.topTipColor = updates.topTipColor;
  if (updates.achievements && Array.isArray(updates.achievements)) {
    mentor.achievements = updates.achievements.filter(Boolean);
  }
  if (updates.helpsWith && Array.isArray(updates.helpsWith)) {
    mentor.helpsWith = updates.helpsWith.filter(Boolean);
  }
  if (updates.photoUrl !== undefined) mentor.photoUrl = updates.photoUrl;
  if (updates.color) mentor.color = updates.color;

  saveDb(db);
  return mentor;
}

export function updateMentorSchedule(id, weeklySchedule) {
  const db = loadDb();
  const mentor = db.mentors.find(m => m.id === parseInt(id));
  if (!mentor) {
    throw new Error('Mentor not found');
  }

  mentor.weeklySchedule = weeklySchedule || {};
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

export function createResource(resourceData) {
  const db = loadDb();
  const mentorId = parseInt(resourceData.mentorId);
  const mentor = db.mentors.find(m => m.id === mentorId);

  const resource = {
    id: `doc-${mentorId || 'res'}-${Date.now()}`,
    mentorId: mentor ? mentor.id : 1,
    mentorName: mentor ? mentor.name : 'Senior Mentor',
    mentorUniversity: mentor ? mentor.university : 'UK University',
    mentorMajor: mentor ? mentor.major : 'General',
    title: resourceData.title,
    subtitle: resourceData.subtitle || resourceData.description || '',
    type: resourceData.type === 'paid' ? 'paid' : 'free',
    price: resourceData.type === 'paid' ? parseFloat(resourceData.price || 4.99) : 0,
    format: resourceData.format || 'PDF',
    fileUrl: resourceData.fileUrl || '',
    fileName: resourceData.fileName || '',
    pages: resourceData.pages || 'Self-contained document',
    category: resourceData.category || 'General',
    downloads: 0,
    rating: 5.0,
    createdAt: new Date().toISOString()
  };

  db.resources.push(resource);

  if (mentor) {
    mentor.docs = mentor.docs || [];
    mentor.docs.push(resource);
  }

  saveDb(db);
  return resource;
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

