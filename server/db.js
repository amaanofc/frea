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
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[db] Failed reading data.json, initializing fresh db', err);
  }

  const initialDb = {
    mentors: INITIAL_MENTORS,
    bookings: [],
    mentorApplications: [],
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
    pendingApplications: db.mentorApplications.length,
    averageRating: db.stats.averageRating
  };
}
