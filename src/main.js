// ─────────────────────────────────────────────
// frea — Main Application (UK Student Peer-to-Peer Mentoring)
// ─────────────────────────────────────────────

import './style.css';
import { MENTORS, ACHIEVEMENTS, SUBJECTS, YEAR_FILTERS, SUBJECT_MAP, UK_UNIVERSITIES, TESTIMONIALS, FAQ_ITEMS, getAllDocs, getDocById, getUniversityFromEmail, EMAIL_UNI_MAP } from './data.js';
import { getMentorAvatar } from './avatars.js';
import { initAnalytics, trackEvent } from './analytics.js';
import {
  fetchMentors,
  fetchMentor,
  fetchMonthlySlots,
  submitBooking,
  fetchMyBookings,
  fetchMentorBookings,
  cancelBooking,
  downloadBookingIcs,
  submitMentorApplication,
  fetchStats,
  uploadDocument,
  sendEmailVerification,
  verifyEmailCode,
  verifyEmailToken,
  fetchAdminApplications,
  fetchAdminSuggestions,
  updateMentorProfile,
  updateMentorSchedule,
  fetchResources,
  createResource,
  updateResource,
  deleteResource,
  claimResource,
  downloadResource,
  fetchPaymentConfig,
  startCheckout,
  fetchCheckoutStatus,
  fetchMentorOrders,
  startPayoutOnboarding,
  fetchPayoutStatus,
  submitSuggestion,
  submitReport,
  fetchAdminReports,
  resolveReport,
  getSession,
  setSession,
  clearSession,
  fetchMe,
  signOut,
  starMentor,
  startSignIn,
  verifyWithUniversity,
  completeUniversitySignIn,
} from './api.js';
import { ICONS } from './icons.js';
import { applyRouteMeta } from './seo.js';

// ─── Canonical time helpers (mirror of server/time.js) ─────
//
// The server stores "HH:MM" and "YYYY-MM-DD". The UI shows "2:30 PM" and
// "Mon 21 Sep". These convert at the edge so the two never get mixed up again.

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toCanonicalTime(input) {
  if (input == null) return null;
  const raw = String(input).trim().toLowerCase();
  const m = raw.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  if (Number.isNaN(hour) || minute > 59) return null;
  if (m[3] === 'am' && hour === 12) hour = 0;
  if (m[3] === 'pm' && hour !== 12) hour += 12;
  if (hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function toDisplayTime(canonical) {
  const t = toCanonicalTime(canonical);
  if (!t) return String(canonical || '');
  const [h, min] = t.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function toDisplayDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return String(iso || '');
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DAY_SHORT[dt.getUTCDay()]} ${d} ${MONTH_SHORT[m - 1]}`;
}

function toLongDisplayDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return String(iso || '');
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const longMonths = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${DAY_NAMES[dt.getUTCDay()]} ${d} ${longMonths[m - 1]} ${y}`;
}

/**
 * A value destined for a JS string literal inside an HTML attribute, e.g.
 * onclick="fn(${jsArg(name)})". Both escapes are required and the order
 * matters — escapeHtml on its own renders ' as &#39;, which the HTML parser
 * decodes back to ' before the JS is parsed, reopening the literal.
 * Returns its own quotes; do not add more.
 */
function jsArg(value) {
  return escapeHtml(JSON.stringify(String(value == null ? '' : value)));
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;
window.jsArg = jsArg;

// ─── Live Questions Ticker (100% Authentic UK Student Queries) ─────

const LIVE_QUESTIONS = [
  { q: "can someone roast my CV before Friday's spring week deadline?", tag: "Finance @ LSE" },
  { q: "how do i recover from a 2:2 in 1st year exams?", tag: "Mech Eng @ Imperial" },
  { q: "how did you land a Y Combinator interview as a student?", tag: "CS @ Imperial" },
  { q: "what actually goes on a 1st year tech CV with zero experience?", tag: "Computing @ UCL" },
  { q: "switching from Psychology to UX Research — where do i start?", tag: "HCI @ UCL" },
  { q: "how to prep for Watson Glaser and magic circle vacation schemes?", tag: "Law @ Oxford" },
  { q: "how to survive organic chemistry lab reports?", tag: "Biochem @ Imperial" },
  { q: "how do assessment centres actually test commercial awareness?", tag: "Economics @ LSE" },
];

// ─── Goal / Intent Filters for Browse ─────

const GOAL_FILTERS = [
  { id: "all", label: "all goals" },
  { id: "academics", label: "Academics" },
  { id: "research", label: "Research" },
  { id: "internships", label: "Internships & Grad roles" },
  { id: "entrepreneurship", label: "Entrepreneurship" },
  { id: "personal-dev", label: "Personal development" },
  { id: "switching-degrees", label: "Switching degrees" },
  { id: "managing-uni", label: "Managing uni life" }
];

const GOAL_KEYWORD_MAP = {
  "academics": ["exam", "revision", "active recall", "first-class", "recovery", "module", "study", "anki", "tutorial", "essay", "marks", "dissertation", "past papers", "gpa", "lecture", "gpa comeback", "reading lists"],
  "research": ["research", "paper", "dissertation", "phd", "crick", "thesis", "lab", "deepmind", "scholar", "bmj", "audit", "pi", "published researcher", "published-researcher"],
  "internships": ["intern", "internship", "spring week", "grad", "graduate", "analyst", "assessment centre", "cv", "resume", "dyson", "goldman", "stripe", "vacation scheme", "clifford chance", "fast stream", "civil service", "placement", "mclaren", "quant", "jane street", "citadel"],
  "entrepreneurship": ["startup", "founder", "yc", "y combinator", "grant", "venture", "hackathon", "side project", "building", "clean-tech", "patent", "projects"],
  "personal-dev": ["portfolio", "career", "confidence", "habit", "cold email", "leadership", "president", "society", "society-president", "mentor", "personal development", "growth", "networking", "peer mentor", "creative careers"],
  "switching-degrees": ["switch", "switching", "transition", "non-cs", "non-target", "transfer", "psychology", "non-traditional", "career switching"],
  "managing-uni": ["survival", "freshers", "balance", "1st year", "pressure", "managing", "uni life", "time management", "societies", "burnout", "year abroad", "med school survival"]
};

// ─── SVG Sticker Icons ─────────────────────

const STICKER_SVGS = {
  lightning: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M15.5 3L7 16h6l-1 9 8.5-13h-6l1-9z" fill="#3b82f6" stroke="#171717" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  star: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M14 3l3.09 6.26L24 10.27l-5 4.87 1.18 6.88L14 18.77l-6.18 3.25L9 15.14l-5-4.87 6.91-1.01L14 3z" fill="#ff6f1e" stroke="#171717" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  heart: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M14 24s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.9A4.5 4.5 0 0 1 22 13c0 5.5-8 11-8 11z" fill="#ff66cf" stroke="#171717" stroke-width="1.8"/><circle cx="11" cy="12" r="1" fill="#171717"/><circle cx="17" cy="12" r="1" fill="#171717"/></svg>`,
  sparkle: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M14 3c0 6.075-4.925 11-11 11 6.075 0 11 4.925 11 11 0-6.075 4.925-11 11-11-6.075 0-11-4.925-11-11z" fill="#ff6f1e" stroke="#171717" stroke-width="1.8"/></svg>`,
  coffee: `<svg width="44" height="44" viewBox="0 0 44 44" fill="none"><rect x="8" y="16" width="22" height="18" rx="4" fill="#f7efe9" stroke="#171717" stroke-width="2.2"/><path d="M30 20h4a4 4 0 010 8h-4" stroke="#171717" stroke-width="2.2"/><path d="M14 11c0-2 2-4 2-4s2 2 2 4M20 11c0-2 2-4 2-4s2 2 2 4" stroke="#ff6f1e" stroke-width="2" stroke-linecap="round"/><path d="M8 38h22" stroke="#171717" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  book: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M4 4h8c2 0 2 0 2 2v18c0-2-2-2-2-2H4V4z" fill="#ff66cf" stroke="#171717" stroke-width="1.8"/><path d="M24 4h-8c-2 0-2 0-2 2v18c0-2 2-2 2-2h8V4z" fill="#ff66cf" stroke="#171717" stroke-width="1.8"/></svg>`,
  rocket: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M14 3c-3 4-5 9-5 14l3 3h4l3-3c0-5-2-10-5-14z" fill="#ff6f1e" stroke="#171717" stroke-width="1.8"/><circle cx="14" cy="13" r="2" fill="#fdfbf9" stroke="#171717" stroke-width="1"/><path d="M9 17l-3 4 5-1M19 17l3 4-5-1" stroke="#171717" stroke-width="1.8"/><path d="M12 20h4v4l-2 1-2-1v-4z" fill="#3b82f6" stroke="#171717" stroke-width="1.2"/></svg>`,
  trophy: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M9 4h10v8c0 3-2 5-5 5s-5-2-5-5V4z" fill="#ff6f1e" stroke="#171717" stroke-width="1.8"/><path d="M9 7H5c0 3 2 5 4 5M19 7h4c0 3-2 5-4 5" stroke="#171717" stroke-width="1.8"/><path d="M12 17v3M16 17v3" stroke="#171717" stroke-width="1.8"/><rect x="9" y="20" width="10" height="3" rx="1.5" fill="#f7efe9" stroke="#171717" stroke-width="1.8"/></svg>`,
  code: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M10 8L4 14l6 6M18 8l6 6-6 6" stroke="#22c55e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 5l-4 18" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  flag: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M6 4v20" stroke="#171717" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4h14l-3 5 3 5H6" fill="#22c55e" stroke="#171717" stroke-width="1.8"/></svg>`,
  briefcase: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><rect x="3" y="10" width="22" height="13" rx="2" fill="#3b82f6" stroke="#171717" stroke-width="1.8"/><path d="M10 10V7a2 2 0 012-2h4a2 2 0 012 2v3" stroke="#171717" stroke-width="1.8"/><path d="M3 16h22" stroke="#171717" stroke-width="1.8"/><circle cx="14" cy="16" r="2" fill="#fdfbf9" stroke="#171717" stroke-width="1"/></svg>`,
  medal: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="18" r="6" fill="#ff6f1e" stroke="#171717" stroke-width="1.8"/><path d="M10 4l-2 10M18 4l2 10" stroke="#171717" stroke-width="1.8"/><path d="M10 4h8" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><path d="M14 15v6M11 18h6" stroke="#fdfbf9" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  lightbulb: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M14 3a7 7 0 00-4 12.7V19a2 2 0 002 2h4a2 2 0 002-2v-3.3A7 7 0 0014 3z" fill="#ff6f1e" stroke="#171717" stroke-width="1.8"/><path d="M11 23h6M12 25h4" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><path d="M14 8v3M11 10l1 2M17 10l-1 2" stroke="#fdfbf9" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  microscope: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M12 4h4M14 4v7M10 11h8" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><path d="M7 23h14M14 18v5M8 15a6 6 0 1010-3" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/><circle cx="14" cy="18" r="2" fill="#ec4899"/></svg>`,
  mortarboard: `<svg width="22" height="22" viewBox="0 0 28 28" fill="none"><path d="M3 10l11-5 11 5-11 5-11-5z" fill="#ff6f1e" stroke="#171717" stroke-width="1.8"/><path d="M7 12v6c0 2 3.5 4 7 4s7-2 7-4v-6" stroke="#171717" stroke-width="1.8"/><path d="M25 10v8" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/></svg>`,
};

// ─── Sticker Decoration SVGs (for scattered placement) ─────

function stickerDecoration(type, size = 36) {
  const svgs = {
    lightning: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none"><path d="M15.5 3L7 16h6l-1 9 8.5-13h-6l1-9z" fill="#3b82f6" stroke="#171717" stroke-width="2" stroke-linejoin="round"/></svg>`,
    heart: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none"><path d="M14 24s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.9A4.5 4.5 0 0 1 22 13c0 5.5-8 11-8 11z" fill="#ff66cf" stroke="#171717" stroke-width="2"/><circle cx="11" cy="12" r="1.2" fill="#171717"/><circle cx="17" cy="12" r="1.2" fill="#171717"/></svg>`,
    star: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none"><path d="M14 3l3.09 6.26L24 10.27l-5 4.87 1.18 6.88L14 18.77l-6.18 3.25L9 15.14l-5-4.87 6.91-1.01L14 3z" fill="#ff6f1e" stroke="#171717" stroke-width="2" stroke-linejoin="round"/></svg>`,
    sparkle: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none"><path d="M14 3c0 6.075-4.925 11-11 11 6.075 0 11 4.925 11 11 0-6.075 4.925-11 11-11-6.075 0-11-4.925-11-11z" fill="#ff6f1e" stroke="#171717" stroke-width="2"/></svg>`,
  };
  return svgs[type] || svgs.sparkle;
}

// ─── Standardized Achievement Sticker Component ─────

function achievementSticker(key) {
  if (!key) return '';
  const ach = ACHIEVEMENTS[key];
  if (ach) {
    const icon = STICKER_SVGS[ach.icon] || STICKER_SVGS.star;
    return `<span class="achievement-sticker achievement-sticker--${ach.color}">
      <span class="sticker-svg">${icon}</span>
      ${ach.label}
    </span>`;
  }
  // Custom user-entered achievement string
  return `<span class="achievement-sticker achievement-sticker--sky">
    <span class="sticker-svg">${STICKER_SVGS.star}</span>
    ${escapeHtml(key)}
  </span>`;
}

// ─── Star Rating (Iconsax Vector Icon) ─────

function starRating(rating) {
  return `<span class="star-rating-svg" style="display: inline-flex; align-items: center; gap: 3px; color: #f59e0b; vertical-align: middle;">${ICONS.star}</span>`;
}

// ─── Pitch Video Embed Helper ─────

function renderPitchVideoEmbed(url) {
  if (!url) return '';

  // A video the mentor recorded or uploaded here: play it natively, no iframe.
  if (url.startsWith('/uploads/pitch_videos/')) {
    return `
      <div class="video-embed-wrap video-embed-wrap--native">
        <video src="${escapeHtml(url)}" controls playsinline preload="metadata"
               style="width: 100%; height: 100%; border-radius: inherit; background: #000; object-fit: cover;"></video>
      </div>
    `;
  }

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `
      <div class="video-embed-wrap">
        <iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}" title="Mentor 2-minute pitch" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    `;
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch && loomMatch[1]) {
    return `
      <div class="video-embed-wrap">
        <iframe src="https://www.loom.com/embed/${loomMatch[1]}" title="Mentor intro on Loom" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
      </div>
    `;
  }

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `
      <div class="video-embed-wrap">
        <iframe src="https://drive.google.com/file/d/${driveMatch[1]}/preview" title="Mentor intro video" frameborder="0" allow="autoplay" allowfullscreen></iframe>
      </div>
    `;
  }

  // External Video Fallback
  return `
    <div class="video-embed-fallback">
      <span style="display: inline-flex; align-items: center; gap: 6px;">${ICONS.video} Mentor submitted external video pitch:</span>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-btn--small">watch 2-min intro ↗</a>
    </div>
  `;
}

// ─── Mentor Card Component with Top-Tip Post-It Note ─────

function mentorCard(mentor) {
  return `
    <div class="mentor-card" data-mentor-id="${mentor.id}" onclick="window.navigateTo('/mentor/${mentor.id}')">
      <div class="mentor-card__tape"></div>
      <div class="mentor-card__header">
        <div class="mentor-card__avatar">
          ${getMentorAvatar(mentor, 52)}
        </div>
        <div class="mentor-card__identity">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <div class="mentor-card__name"><a href="/mentor/${mentor.id}" class="mentor-card__name-link">${escapeHtml(mentor.name)}</a></div>
            ${mentor.linkedin ? `
              <a href="${escapeHtml(mentor.linkedin)}" target="_blank" rel="noopener noreferrer" class="mentor-card__linkedin" onclick="event.stopPropagation()" title="View verified LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.64 1.64 0 0 0-1.66 1.64 1.63 1.63 0 0 0 1.66 1.63 1.63 1.63 0 0 0 1.65-1.63A1.64 1.64 0 0 0 7.83 6.2Z"/></svg>
              </a>
            ` : ''}
          </div>
          <div class="mentor-card__meta">
            <span>${escapeHtml(mentor.year)}</span>
            <span class="mentor-card__meta-divider">·</span>
            <span>${escapeHtml(mentor.major)}</span>
          </div>
          <div style="font-size: 11.5px; opacity: 0.7; margin-top: 2px; font-weight: 600; color: var(--color-cocoa-ink);">${escapeHtml(mentor.university)}</div>
        </div>
      </div>

      <!-- Senior's Top Tip Post-It Sticky Note -->
      <div class="mentor-card__postit mentor-card__postit--${escapeHtml(mentor.topTipColor || 'yellow')}">
        <span class="mentor-card__postit-pin"></span>
        <div class="mentor-card__postit-header">
          <span class="mentor-card__postit-label">senior tip</span>
        </div>
        <p class="mentor-card__postit-quote">${escapeHtml(mentor.topTip)}</p>
      </div>

      <div class="mentor-card__achievements">
        ${mentor.achievements.slice(0, 3).map(a => achievementSticker(a)).join('')}
      </div>
      <div class="mentor-card__bio">“${escapeHtml(mentor.bio)}”</div>
      <div class="mentor-card__footer">
        <div class="mentor-card__stats">
          <span style="display: inline-flex; align-items: center; gap: 3px; color: #f59e0b; font-weight: 700;" title="Students who starred this mentor">${ICONS.star} ${mentor.stars || 0}</span>
          <span style="opacity: 0.65; margin: 0 2px;">·</span>
          <span>${mentor.callsCompleted} chats</span>
        </div>
        <button class="pill-btn pill-btn--small" onclick="event.stopPropagation(); window.navigateTo('/mentor/${mentor.id}')">book a chat</button>
      </div>
    </div>
  `;
}

// ─── Sleek Modern Curved Vector Connector Arrow ─────

function handArrow() {
  return `<div class="how-arrow" aria-hidden="true">
    <svg width="76" height="34" viewBox="0 0 76 34" fill="none" class="flow-connector-arrow">
      <path d="M 6 22 C 24 7, 46 7, 61 17.5" stroke="#171717" stroke-width="2.2" stroke-linecap="round"/>
      <g transform="translate(61, 17.5) rotate(35)">
        <path d="M 7 0 L -5 -4.5 L -3 0 L -5 4.5 Z" fill="#171717" stroke="#171717" stroke-width="0.5" stroke-linejoin="round"/>
      </g>
    </svg>
  </div>`;
}

// ─── How It Works Step ─────

function howStep(number, label, desc, iconSvg) {
  return `<div class="how-step reveal">
    <div class="how-step__number">${number}</div>
    <div class="how-step__icon">${iconSvg}</div>
    <div class="how-step__label">${label}</div>
    <div class="how-step__desc">${desc}</div>
  </div>`;
}

// ─── PAGE: Landing ─────

function renderLanding() {
  const tickerItems = [...LIVE_QUESTIONS, ...LIVE_QUESTIONS];

  return `
    <div class="page-view">
      <!-- Hero -->
      <section class="hero page-container">
        <div class="hero__grid">
          <div class="hero__content">
            <span class="hero__caption">psst... stop stressing over cold emails</span>
            <h1 class="hero__title">the senior advice<br>you actually need.</h1>
            <p class="hero__body">
              connect with elder students who landed top grad roles, survived brutal modules, and cracked the unwritten rules of university. book a 20-min call — <span class="marker-highlight">100% free</span>, zero corporate cringe.
            </p>
            <div class="hero__cta-group">
              <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                <button class="pill-btn pill-btn--animated" onclick="window.navigateTo('/browse')">
                  <span class="pill-btn__inner">
                    <span>find your senior mentor</span>
                    <span class="pill-btn__arrow">→</span>
                  </span>
                </button>
                <button class="pill-btn pill-btn--subtle pill-btn--animated-subtle" onclick="window.navigateTo('/become-a-mentor')">
                  <span class="pill-btn__inner">
                    <span>become a mentor</span>
                    <span style="display: inline-flex; align-items: center;">${ICONS.teacher}</span>
                  </span>
                </button>
              </div>
              <span class="hero__quiet-caption">20-min Google Meets · no sign-up fees · always free for UK students</span>
            </div>
          </div>

          <!-- Hero Visual — Authentic Senior Desk Composition -->
          <div class="hero__visual">
            <div class="hero__visual-desk">
              <!-- Decorative Stickers (Safely inside container margins) -->
              <div class="sticker sticker--2">${stickerDecoration('heart', 30)}</div>
              <div class="sticker sticker--3">${stickerDecoration('sparkle', 28)}</div>
              <div class="sticker sticker--4">${stickerDecoration('star', 32)}</div>

              <!-- Senior Student ID Badge Card -->
              <div class="hero__senior-pass">
                <!-- Washi Tape (Cleanly pinned to top-left of the card) -->
                <div class="washi-tape" style="top: -12px; left: 24%;"></div>

                <div class="hero__pass-header">
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span class="hero__pass-verified" style="display: inline-flex; align-items: center; gap: 4px;">${ICONS.shieldTick} verified peer mentor</span>
                  </div>
                </div>
                <div class="hero__pass-body">
                  <div class="hero__pass-avatar">
                    ${getMentorAvatar(1, 72)}
                  </div>
                  <div class="hero__pass-info">
                    <div class="hero__pass-name">Aanya Sharma</div>
                    <div class="hero__pass-uni">4th Year (MEng) · CS @ Imperial</div>
                    <div class="hero__pass-tags">
                      <span class="hero__pass-tag hero__pass-tag--orange" style="display: inline-flex; align-items: center; gap: 4px;">${ICONS.rocket} YC S23 Alumni</span>
                      <span class="hero__pass-tag hero__pass-tag--blue" style="display: inline-flex; align-items: center; gap: 4px;">${ICONS.flash} Stripe Offer</span>
                    </div>
                  </div>
                </div>
                <div class="hero__pass-quote">
                  “happy to roast your tech CV, do mock technical screens, or chat about getting into YC as an undergrad.”
                </div>
                <div class="hero__pass-footer">
                  <span style="color: var(--color-marker-orange); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">${ICONS.star} 4.9 (47 chats)</span>
                  <span style="opacity: 0.75; font-size: 12px; font-weight: 600; color: #16a34a; display: inline-flex; align-items: center; gap: 4px;">${ICONS.tickCircle} 100% free sessions</span>
                </div>
              </div>

              <!-- Yellow Sticky Note pinned to desk (Top-right, clean clearance) -->
              <div class="hero__sticky-note">
                <div class="hero__sticky-pin"></div>
                <div class="hero__sticky-text">“don't grind 500 leetcodes. pick 2 projects you can passionately defend for 20 mins.”</div>
                <span class="hero__sticky-author">— aanya @ google meet</span>
              </div>

              <!-- Floating Live Booking Toast -->
              <div class="hero__live-pill">
                <span class="hero__live-dot"></span>
                <span>2 free slots left this week · 20-min meet</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Original Live Questions Ticker (Top Ribbon) -->
      <div class="questions-ticker">
        <div class="questions-ticker__inner">
          <div class="questions-ticker__badge"><span style="display: inline-flex; align-items: center; gap: 5px;">${ICONS.flash} freshers are asking:</span></div>
          <div class="questions-ticker__track">
            ${tickerItems.map(item => `
              <div class="ticker-item">
                <span>“${item.q}”</span>
                <span class="ticker-item__tag">${item.tag}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- How It Works -->
      <section class="section page-container">
        <div class="how-it-works reveal">
          <div style="text-align: center; margin-bottom: 8px;">
            <span class="handwritten handwritten--rotated">no awkward networking, ever</span>
          </div>
          <h2 class="section__title" style="text-align: center;">how it works</h2>
          <div class="how-it-works__steps">
            ${howStep('01', 'find your senior', 'filter by your university, degree, or challenge (like recovering from a 1st year 2:2 or landing a Spring Week).',
    `<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="28" cy="28" r="16" stroke="#171717" stroke-width="2.5" fill="#f7efe9"/><path d="M40 40l12 12" stroke="#171717" stroke-width="2.5" stroke-linecap="round"/><circle cx="28" cy="28" r="6" stroke="#ff6f1e" stroke-width="1.8" fill="none"/></svg>`
  )}
            ${handArrow()}
            ${howStep('02', 'steal their playbook', 'read their unfiltered story — their study systems, interview frameworks, and their sticky-note top tip.',
    `<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="16" y="12" width="32" height="40" rx="4" fill="#f7efe9" stroke="#171717" stroke-width="2.5"/><line x1="24" y1="22" x2="40" y2="22" stroke="#171717" stroke-width="2" stroke-linecap="round"/><line x1="24" y1="30" x2="36" y2="30" stroke="#171717" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="38" r="5" fill="#ff6f1e"/></svg>`
  )}
            ${handArrow()}
            ${howStep('03', 'book a 20-min call', 'pick a date on their interactive calendar. jump on Google Meet with your .ac.uk email, 100% free.',
    STICKER_SVGS.coffee || `<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="14" y="20" width="28" height="24" rx="4" fill="#f7efe9" stroke="#171717" stroke-width="2.5"/><path d="M42 26h6a5 5 0 010 10h-6" stroke="#171717" stroke-width="2.5"/><path d="M22 16c0-3 3-5 3-5s3 3 3 5M30 16c0-3 3-5 3-5s3 3 3 5" stroke="#ff6f1e" stroke-width="2" stroke-linecap="round"/></svg>`
  )}
          </div>
        </div>
      </section>

      <!-- Featured Mentors -->
      <section class="section page-container">
        <span class="section__caption reveal">they've actually been in your shoes</span>
        <h2 class="section__title reveal">meet your seniors</h2>
        <div class="mentor-grid" style="margin-top: 32px;">
          ${MENTORS.slice(0, 6).map(m => mentorCard(m)).join('')}
        </div>
        <div style="text-align: center; margin-top: 48px;" class="reveal">
          <button class="pill-btn pill-btn--animated" onclick="window.navigateTo('/browse')">
            <span class="pill-btn__inner">
              <span>explore all 12 seniors</span>
              <span class="pill-btn__arrow">→</span>
            </span>
          </button>
        </div>
      </section>

      <!-- Mission Section (Replaces Stats & Testimonials) -->
      <section class="section page-container">
        <div class="mission-section reveal">
          <div class="washi-tape" style="top: -12px; left: 36px;"></div>
          <div class="mission-section__badge">
            <span class="handwritten handwritten--rotated" style="font-size: 24px; color: var(--color-marker-orange);">why we built this</span>
          </div>
          <h2 class="mission-section__quote">
            “every student deserves a senior<br>who actually gives a damn.”
          </h2>
          <div class="mission-section__body">
            <p class="mission-section__lead">
              frea exists because the best university advice doesn't come from corporate career fairs or glossy company brochures — it comes from the student who survived that exact module, landed that exact role, and remembers exactly how confusing week 1 was.
            </p>
            <p class="mission-section__sub">
              we connect younger students with elder peers who've been in their shoes. no £150/hr coaching fees. no corporate cringe. just honest, caffeinated 20-minute conversations.
            </p>
          </div>
          <div class="mission-section__grid">
            <div class="mission-card">
              <div class="mission-card__icon">${STICKER_SVGS.coffee}</div>
              <h3 class="mission-card__title">honest peer talk</h3>
              <p class="mission-card__desc">unfiltered truth about course modules, revision methods, and how assessment centres actually work.</p>
            </div>
            <div class="mission-card">
              <div class="mission-card__icon">${ICONS.gift}</div>
              <h3 class="mission-card__title">100% free, always</h3>
              <p class="mission-card__desc">zero hidden fees or subscription traps. built by UK students, for UK students with an active .ac.uk email.</p>
            </div>
            <div class="mission-card">
              <div class="mission-card__icon">${ICONS.shieldTick}</div>
              <h3 class="mission-card__title">verified seniors</h3>
              <p class="mission-card__desc">every mentor confirms a real .ac.uk address before their profile goes live, and links their LinkedIn so you can check who you're talking to.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Horizontal Scroll Velocity Ribbon (Pure Peer Mission, Grounded & Authentic) -->
      <section class="velocity-strip-section">
        <div class="velocity-band">
          <div class="velocity-band__track">
            <span class="velocity-word velocity-word--highlight">built by students, for students</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">100% free peer mentoring</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">the unwritten rules of university</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">honest course & module advice</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">exam playbooks & revision systems</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">internships, spring weeks & grad roles</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">zero corporate cringe</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">20-minute caffeinated chats</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word velocity-word--highlight">elder peers who actually give a damn</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">from freshers week to graduation</span>
            <span class="velocity-sep">✦</span>
            <!-- Seamless Loop Clone -->
            <span class="velocity-word velocity-word--highlight">built by students, for students</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">100% free peer mentoring</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">the unwritten rules of university</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">honest course & module advice</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">exam playbooks & revision systems</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">internships, spring weeks & grad roles</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">zero corporate cringe</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">20-minute caffeinated chats</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word velocity-word--highlight">elder peers who actually give a damn</span>
            <span class="velocity-sep">✦</span>
            <span class="velocity-word">from freshers week to graduation</span>
            <span class="velocity-sep">✦</span>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="section page-container">
        <h2 class="section__title reveal" style="text-align: center;">questions you might have</h2>
        <div class="faq__list" style="margin-top: 40px;">
          ${FAQ_ITEMS.map((item, i) => `
            <div class="faq-item reveal" data-faq="${i}">
              <div class="faq-item__question" onclick="toggleFaq(${i})">
                <span>${item.question}</span>
                <span class="faq-item__icon">+</span>
              </div>
              <div class="faq-item__answer">${item.answer}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Footer -->
      ${renderFooter()}
    </div>
  `;
}

// ─── PAGE: Browse Mentors (With Sleek Filter Hub) ─────

function renderBrowse() {
  trackEvent('browse_page_view');

  return `
    <div class="page-view">
      <div class="page-container browse-header">
        <span class="section__caption">find someone who walked the path you want</span>
        <h1 class="section__title" style="font-size: clamp(36px, 5vw, 56px);">find your senior mentor</h1>

        <!-- Sleek Filter Hub Card -->
        <div class="filter-hub">
          <!-- Top Row: Search + University Dropdown + Live Count -->
          <div class="filter-hub__top-bar">
            <div class="filter-hub__search-box">
              <svg class="filter-hub__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="filter-hub__search-input" id="mentor-search" placeholder="search by name, company, degree, or keyword..." oninput="filterMentors()">
            </div>

            <select class="filter-hub__uni-select" id="uni-filter-select" onchange="setFilter('university', this.value)">
              ${UK_UNIVERSITIES.map(u => `
                <option value="${u === 'All UK Universities' ? 'all' : u}" ${activeUniversity === (u === 'All UK Universities' ? 'all' : u) ? 'selected' : ''}>${u}</option>
              `).join('')}
            </select>

            <div class="filter-hub__count-badge" id="match-count-badge">
              ${MENTORS.length} verified seniors
            </div>
          </div>

          <!-- Goals / Challenges Strip -->
          <div class="filter-hub__row">
            <div class="filter-hub__label-bar">
              <span class="filter-hub__label">I need help with:</span>
              <button class="filter-hub__clear-btn" onclick="clearAllFilters()">reset filters</button>
            </div>
            <div class="filter-hub__pills" id="goal-filters">
              ${GOAL_FILTERS.map(g => `
                <span class="filter-pill ${g.id === 'all' ? 'active' : ''}" data-filter="goal" data-value="${g.id}" onclick="setFilter('goal', '${g.id}')">${g.label}</span>
              `).join('')}
            </div>
          </div>

          <!-- Academic Fields Strip -->
          <div class="filter-hub__row">
            <div class="filter-hub__label-bar">
              <span class="filter-hub__label">Academic discipline:</span>
            </div>
            <div class="filter-hub__pills" id="subject-filters">
              ${SUBJECTS.map(s => `
                <span class="filter-pill filter-pill--compact ${s === 'all' ? 'active' : ''}" data-filter="subject" data-value="${s}" onclick="setFilter('subject', '${s}')">${s}</span>
              `).join('')}
            </div>
          </div>

          <!-- Year of Study Strip -->
          <div class="filter-hub__row">
            <div class="filter-hub__label-bar">
              <span class="filter-hub__label">Year of study:</span>
            </div>
            <div class="filter-hub__pills" id="year-filters">
              ${YEAR_FILTERS.map(y => `
                <span class="filter-pill filter-pill--compact ${y === 'all years' ? 'active' : ''}" data-filter="year" data-value="${y}" onclick="setFilter('year', '${y}')">${y}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="page-container">
        <div class="mentor-grid" id="mentor-grid">
          ${MENTORS.map(m => mentorCard(m)).join('')}
        </div>
        <div id="empty-state" style="display: none;">
          <div class="empty-state">
            <div class="empty-state__icon">${ICONS.searchNormal}</div>
            <div class="empty-state__text">no seniors match that specific combination</div>
            <div class="empty-state__hint">try resetting your university or goal filter</div>
            <div style="margin-top: 18px;">
              <button class="pill-btn pill-btn--small" onclick="clearAllFilters()">reset all filters</button>
            </div>
          </div>
        </div>
      </div>

      ${renderFooter()}
    </div>
  `;
}

// ─── Docs & freabies: entitlement state ─────
//
// What a student owns is decided by the server and keyed to their verified
// email, so it follows them between browsers and devices. This array is only a
// render cache of the last answer the server gave us.

let unlockedDocIds = [];

function getUnlockedDocIds() {
  return unlockedDocIds;
}

function isDocUnlocked(docId) {
  return unlockedDocIds.includes(docId);
}

/** Records a grant locally after the server has confirmed it. */
function markDocUnlocked(docId) {
  if (!unlockedDocIds.includes(docId)) unlockedDocIds.push(docId);
}

function setUnlockedDocIds(ids) {
  unlockedDocIds = Array.isArray(ids) ? [...ids] : [];
}

window.isDocUnlocked = isDocUnlocked;

// ─── Render Doc Card Component (Notebook Style) ─────

function renderDocCard(doc, mentor = null, showAuthor = false) {
  const isUnlocked = isDocUnlocked(doc.id);
  const isPaid = doc.type === 'paid';

  let typeBadgeHtml = '';
  if (isUnlocked && isPaid) {
    typeBadgeHtml = `<span class="doc-badge doc-badge--unlocked">${ICONS.tickCircle} unlocked</span>`;
  } else if (isPaid) {
    typeBadgeHtml = `<span class="doc-badge doc-badge--paid">${ICONS.lock} £${doc.price.toFixed(2)}</span>`;
  } else {
    typeBadgeHtml = `<span class="doc-badge doc-badge--free">${ICONS.gift} freabie</span>`;
  }

  const authorName = doc.mentorName || (mentor ? mentor.name : 'Senior Mentor');
  const authorUni = doc.mentorUniversity || (mentor ? mentor.university : '');
  const authorMajor = doc.mentorMajor || (mentor ? mentor.major : '');
  const mentorId = doc.mentorId || (mentor ? mentor.id : 1);
  const tapeRotation = ((parseInt(String(doc.id).replace(/\D/g, '')) || 1) % 5) - 2;

  let actionBtnHtml = '';
  if (isUnlocked) {
    actionBtnHtml = `
      <button type="button" class="doc-btn doc-btn--unlocked" onclick="window.downloadDoc('${doc.id}')" title="Download to device" aria-label="Download guide">
        ${ICONS.download}
        <span>download</span>
      </button>
    `;
  } else if (!isPaid) {
    actionBtnHtml = `
      <button type="button" class="doc-btn doc-btn--free" onclick="window.downloadDoc('${doc.id}')" title="Get free freabie" aria-label="Get freabie">
        ${ICONS.documentDownload}
        <span>get freabie</span>
      </button>
    `;
  } else {
    actionBtnHtml = `
      <button type="button" class="doc-btn doc-btn--paid" onclick="window.openDocCheckoutModal('${doc.id}')" title="Unlock full playbook" aria-label="Unlock for £${doc.price.toFixed(2)}">
        ${ICONS.unlock}
        <span>unlock £${doc.price.toFixed(2)}</span>
      </button>
    `;
  }

  return `
    <div class="doc-card ${isPaid ? 'doc-card--paid' : 'doc-card--free'} ${isUnlocked ? 'doc-card--unlocked' : ''}" id="doc-card-${doc.id}">
      <div class="doc-card__tape" style="transform: translateX(-50%) rotate(${tapeRotation}deg);"></div>
      
      <div class="doc-card__top">
        <div class="doc-card__badges">
          ${typeBadgeHtml}
          <span class="doc-format-badge">${escapeHtml(doc.format)}</span>
        </div>
        <span class="doc-category-badge">${escapeHtml(doc.category || 'Academic')}</span>
      </div>

      <div class="doc-card__main">
        <h4 class="doc-card__title" onclick="window.openDocPreviewModal('${doc.id}')">${escapeHtml(doc.title)}</h4>
        <p class="doc-card__subtitle">${escapeHtml(doc.subtitle)}</p>

        ${showAuthor ? `
          <div class="doc-card__author" onclick="window.navigateTo('/mentor/${mentorId}')" title="View ${escapeHtml(authorName)}'s full profile">
            <div class="doc-card__author-avatar">
              ${getMentorAvatar(mentorId, 32)}
            </div>
            <div class="doc-card__author-info">
              <span class="doc-card__author-name">${escapeHtml(authorName)}</span>
              <span class="doc-card__author-uni">${escapeHtml(authorUni)} · ${escapeHtml(authorMajor)}</span>
            </div>
          </div>
        ` : ''}

        <div class="doc-card__highlights">
          ${(doc.previewBullets || []).slice(0, 2).map(bullet => `
            <div class="doc-card__highlight-item">
              <span class="doc-card__check">${ICONS.tickCircle}</span>
              <span>${escapeHtml(bullet)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="doc-card__footer">
        <div class="doc-card__stats">
          <span class="doc-card__rating">${ICONS.star} ${doc.rating.toFixed(1)}</span>
          <span class="doc-card__downloads">(${doc.downloads} downloads)</span>
          <span class="doc-card__pages">· ${escapeHtml(doc.pages)}</span>
        </div>
        <div class="doc-card__actions">
          <button type="button" class="doc-btn doc-btn--preview" onclick="window.openDocPreviewModal('${doc.id}')" aria-label="Preview document ${escapeHtml(doc.title)}">
            ${ICONS.eye}
            <span>preview</span>
          </button>
          ${actionBtnHtml}
        </div>
      </div>
    </div>
  `;
}
window.renderDocCard = renderDocCard;

// ─── PAGE: Mentor Profile (With Interactive Week Calendar) ─────

/** Renders a mentor's links row. Falls back to legacy single fields. */
function profileLinksFor(mentor) {
  const links = Array.isArray(mentor.links) && mentor.links.length
    ? mentor.links
    : [
      mentor.linkedin ? { label: 'LinkedIn', url: mentor.linkedin } : null,
      mentor.website ? { label: 'Website', url: mentor.website } : null
    ].filter(Boolean);

  if (!links.length) return '';

  return `
    <div class="profile__websites-row">
      ${links.map(site => `
        <a href="${escapeHtml(site.url)}" target="_blank" rel="noopener noreferrer" class="profile__website-chip">
          <span>${ICONS.link}</span>
          <span>${escapeHtml(site.label || 'Link')}</span>
          <span style="font-size: 11px; opacity: 0.6;">↗</span>
        </a>
      `).join('')}
    </div>
  `;
}

function renderProfile(mentorId) {
  const mentor = MENTORS.find(m => m.id === parseInt(mentorId));
  if (!mentor) {
    return `<div class="page-view page-container" style="padding-top: 120px; text-align: center;">
      <h2 class="section__title">mentor not found</h2>
      <p style="margin-top: 12px;">
        <a class="profile-back" onclick="window.navigateTo('/browse')">← back to mentors</a>
      </p>
    </div>`;
  }

  trackEvent('mentor_profile_view', { mentorId: mentor.id, mentorName: mentor.name });

  // `availability` was a pre-API shape that only the bundled seed mentors ever
  // had. Any mentor created through the API lacks it, so reading [0] crashed
  // their whole profile — including the calendar. Selection now comes from the
  // live calendar data instead.
  window.__activeDayIndex = 0;
  window.__selectedDay = '';
  window.__selectedSlot = '';

  return `
    <div class="page-view">
      <div class="page-container profile-page">
        <a class="profile-back" onclick="window.navigateTo('/browse')">← back to all mentors</a>

        <div class="profile__header">
          <div class="profile__avatar-frame" style="position: relative; overflow: hidden; box-shadow: 4px 6px 0px var(--color-charcoal); width: 180px; height: 180px; border-radius: 16px; border: 2.5px solid var(--color-charcoal);">
            ${getMentorAvatar(mentor, 180)}
            <div class="sticker" style="position: absolute; top: -14px; right: -14px; transform: rotate(12deg);">${stickerDecoration('sparkle', 28)}</div>
            <div class="sticker" style="position: absolute; bottom: -10px; left: -10px; transform: rotate(-10deg);">${stickerDecoration('star', 24)}</div>
          </div>

          <div>
            <div class="profile__info-label">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <span class="hero__pass-verified">${ICONS.shieldTick} verified mentor</span>
                ${mentor.linkedin ? `
                  <a href="${escapeHtml(mentor.linkedin)}" target="_blank" rel="noopener noreferrer" class="profile__linkedin-badge" title="Verified LinkedIn Profile">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.64 1.64 0 0 0-1.66 1.64 1.63 1.63 0 0 0 1.66 1.63 1.63 1.63 0 0 0 1.65-1.63A1.64 1.64 0 0 0 7.83 6.2Z"/></svg>
                    <span>LinkedIn verified</span>
                  </a>
                ` : ''}
              </div>
              <div class="profile__name">${escapeHtml(mentor.name)}</div>
              <div class="profile__meta">
                <span>${escapeHtml(mentor.year)}</span>
                <span class="mentor-card__meta-divider">·</span>
                <span>${escapeHtml(mentor.major)}</span>
                <span class="mentor-card__meta-divider">·</span>
                <span>${escapeHtml(mentor.university)}</span>
              </div>
            </div>

            <!-- Every link this mentor has added: LinkedIn, GitHub, portfolio, anything -->
            ${profileLinksFor(mentor)}

            <div class="profile__achievements">
              ${mentor.achievements.map(a => achievementSticker(a)).join('')}
            </div>
            <div class="profile__rating">
              <button type="button" id="mentor-star-btn"
                      class="mentor-star-btn${mentor.youStarred ? ' mentor-star-btn--on' : ''}"
                      onclick="window.toggleMentorStar(${Number(mentor.id)})"
                      title="${mentor.youStarred ? 'Remove your star' : 'Star this mentor'}">
                ${ICONS.star}
                <span id="mentor-star-count">${mentor.stars || 0}</span>
              </button>
              <span>${mentor.callsCompleted} chats completed</span>
              ${reportLink('mentor', mentor.id, mentor.name)}
            </div>
          </div>
        </div>

        <!-- Featured Top Tip Sticky Note -->
        <div style="max-width: 680px; margin-bottom: 40px;">
          <div class="mentor-card__postit mentor-card__postit--${escapeHtml(mentor.topTipColor || 'yellow')}" style="padding: 18px 22px; transform: rotate(-0.8deg); box-shadow: 3px 8px 20px rgba(0,0,0,0.06);">
            <span class="mentor-card__postit-pin" style="left: 28px; width: 14px; height: 14px;"></span>
            <div class="mentor-card__postit-header" style="margin-bottom: 6px;">
              <span class="mentor-card__postit-label" style="font-size: 15px;">senior tip for freshers</span>
            </div>
            <p class="mentor-card__postit-quote" style="font-size: 21px; line-height: 1.3;">${escapeHtml(mentor.topTip)}</p>
          </div>
        </div>

        <div class="profile__section">
          <h3 class="profile__section-title">about my journey</h3>
          <p class="profile__bio" style="font-size: 19px; line-height: 1.65; color: var(--color-cocoa-ink);">“${escapeHtml(mentor.bio)}”</p>
        </div>

        <!-- 2-Minute Pitch Video Embed (YouTube, Loom, Google Drive) -->
        ${mentor.pitchVideoUrl ? `
          <div class="profile__section">
            <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
              <h3 class="profile__section-title" style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 8px;">${ICONS.video} 2-min mentor pitch</h3>
              <span class="handwritten" style="font-size: 19px; color: var(--color-marker-orange);">hear directly from ${escapeHtml(mentor.name.split(' ')[0])}</span>
            </div>
            <div class="profile__video-card">
              ${renderPitchVideoEmbed(mentor.pitchVideoUrl)}
            </div>
          </div>
        ` : ''}

        <div class="profile__section">
          <h3 class="profile__section-title">what you can ask me about</h3>
          <div class="profile__tags">
            ${mentor.helpsWith.map(t => `<span class="profile__tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>

        <!-- Mentor's Curated Docs & Freabies Section -->
        <div class="profile__section profile__docs-section" id="mentor-docs-section">
          <div class="profile__docs-header">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h3 class="profile__section-title" style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 8px;">${ICONS.book} docs & freabies</h3>
                <span class="pill-tag pill-tag--small" style="background: var(--color-dew-drop); font-weight: 700;">${(mentor.docs || []).length} resources</span>
              </div>
              <span class="handwritten" style="font-size: 19px; color: var(--color-marker-orange); display: block; margin-top: 4px;">
                revision bibles, templates & free notes curated by ${escapeHtml(mentor.name.split(' ')[0])}
              </span>
            </div>

            <!-- Filter tabs: All, Free Freabies, Paid Playbooks -->
            <div class="doc-filter-group" id="profile-doc-filters">
              <button class="doc-filter-btn active" data-filter="all" onclick="window.filterProfileDocs('all', ${mentor.id})">all (${(mentor.docs || []).length})</button>
              <button class="doc-filter-btn" data-filter="free" onclick="window.filterProfileDocs('free', ${mentor.id})"><span style="display:inline-flex;align-items:center;gap:5px;">${ICONS.gift} freabies (${(mentor.docs || []).filter(d => d.type === 'free').length})</span></button>
              <button class="doc-filter-btn" data-filter="paid" onclick="window.filterProfileDocs('paid', ${mentor.id})"><span style="display:inline-flex;align-items:center;gap:5px;">${ICONS.flash} playbooks (${(mentor.docs || []).filter(d => d.type === 'paid').length})</span></button>
            </div>
          </div>

          <div class="docs-grid" id="profile-docs-grid">
            ${(mentor.docs && mentor.docs.length > 0)
      ? mentor.docs.map(doc => renderDocCard(doc, mentor, false)).join('')
      : `<div class="docs-empty-state"><p>No docs published yet by this mentor. Check out the calendar below to book a free chat!</p></div>`
    }
          </div>
        </div>

        <!-- Interactive Clean Vanilla Month Calendar -->
        <div class="profile__section">
          <h3 class="profile__section-title">pick a date & time</h3>
          <span class="handwritten" style="font-size: 20px; display: block; margin-bottom: 16px;">all sessions are 20-min Google Meets · 100% free · select an orange day, then choose your time</span>

          <div id="profile-calendar-root" class="frea-cal-root">
            <div style="text-align: center; padding: 40px 20px; opacity: 0.7;">
              <span style="display: inline-flex; align-items: center;">${ICONS.calendar}</span>
              <p style="margin-top: 8px; font-weight: 600;">loading calendar...</p>
            </div>
          </div>
        </div>
      </div>

      ${renderFooter()}
    </div>
  `;
}

// ─── PAGE: Become a Mentor ─────

function renderBecomeMentor() {
  trackEvent('become_mentor_page_view');

  return `
    <div class="page-view page-container become-mentor">
      <a class="profile-back" onclick="window.navigateTo('/')">← back to home</a>

      <div class="become-mentor__header">
        <h1 class="become-mentor__title">become a senior mentor</h1>
        <p class="become-mentor__lead">
          remember how confusing first year was? pay it forward to younger students. give 20–40 mins a week on your terms. zero corporate cringe, 100% impact.
        </p>
        <div class="become-mentor__verification-banner">
          <span>${ICONS.shieldTick}</span>
          <span>Open to all 2nd+ years, master's students & recent grads with an active <strong>.ac.uk</strong> email</span>
        </div>
      </div>

      <div class="mentor-form-card">
        <form id="become-mentor-form" onsubmit="handleBecomeMentorSubmit(event)">
          <div class="mentor-form-row">
            <div class="mentor-form-group">
              <label class="mentor-form-label">Full Name <span>*</span></label>
              <input type="text" class="mentor-form-input" id="bm-name" required placeholder="e.g. Alex Morgan">
            </div>

            <div class="mentor-form-group">
              <label class="mentor-form-label">UK University <span>*</span></label>
              <select class="mentor-form-select" id="bm-uni" required>
                ${UK_UNIVERSITIES.filter(u => u !== 'All UK Universities').map(u => `
                  <option value="${u}">${u}</option>
                `).join('')}
                <option value="Other UK University">Other UK University</option>
              </select>
            </div>
          </div>

          <div class="mentor-form-row">
            <div class="mentor-form-group">
              <label class="mentor-form-label">Degree / Course <span>*</span></label>
              <input type="text" class="mentor-form-input" id="bm-major" required placeholder="e.g. MEng Computing or BSc Economics">
            </div>

            <div class="mentor-form-group">
              <label class="mentor-form-label">Year of Study <span>*</span></label>
              <select class="mentor-form-select" id="bm-year" required>
                <option value="1st year">1st year</option>
                <option value="2nd year" selected>2nd year</option>
                <option value="3rd year">3rd year</option>
                <option value="4th year (MEng)">4th year (MEng / MSci)</option>
                <option value="master's student">Master's student</option>
                <option value="recent grad">Recent graduate</option>
              </select>
            </div>
          </div>

          <!-- Profile Picture / Illustrated Avatar Selection -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">Profile Picture <span>(choose an illustrated avatar or upload your own photo)</span></label>
            <div class="profile-pic-selector">
              <div class="profile-pic-preview-wrap">
                <div class="profile-pic-preview" id="bm-photo-preview">
                  ${getMentorAvatar(1, 72)}
                </div>
                <div class="profile-pic-preview-meta">
                  <span id="bm-avatar-status" style="font-weight: 700; font-size: 14px; color: var(--color-charcoal); display: block;">Illustrated Avatar #1</span>
                  <span style="font-size: 12.5px; opacity: 0.65; display: block; margin-top: 2px;">Appears on your mentor card, profile & calendar</span>
                </div>
              </div>

              <div class="profile-pic-controls">
                <div class="profile-pic-upload-action">
                  <label class="pill-btn pill-btn--small" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                    <span>${ICONS.camera}</span>
                    <span>Upload your own photo</span>
                    <input type="file" id="bm-photo-input" accept="image/*" style="display: none;" onchange="handleMentorPhotoUpload(event)">
                  </label>
                  <button type="button" id="bm-remove-photo-btn" class="pill-btn pill-btn--small" style="display: none; background: #fee2e2; border-color: #ef4444; color: #b91c1c;" onclick="removeMentorUploadedPhoto()">${ICONS.close} Remove custom photo</button>
                </div>

                <div style="margin-top: 14px;">
                  <span style="font-size: 12.5px; font-weight: 700; color: var(--color-charcoal); opacity: 0.75; display: block; margin-bottom: 8px;">Or pick from our handcrafted avatars (both genders):</span>
                  <div class="avatar-preset-grid" id="bm-avatar-presets">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(id => `
                      <button type="button" class="avatar-preset-btn ${id === 1 ? 'active' : ''}" data-avatar-id="${id}" onclick="selectMentorPresetAvatar(${id})" title="Avatar ${id}">
                        ${getMentorAvatar(id, 40)}
                      </button>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
            <input type="hidden" id="bm-selected-avatar-id" value="1">
            <input type="hidden" id="bm-photo-data" value="">
          </div>

          <div class="mentor-form-group">
            <label class="mentor-form-label">Where should we send booking notices? <span>*</span></label>
            <input type="email" class="mentor-form-input" id="bm-email" required placeholder="e.g. you@gmail.com" oninput="window.handleMentorEmailInput(this.value)">
            <div id="bm-uni-detect-badge" style="display: none;"></div>
            <span style="font-size: 12px; opacity: 0.6; display: block; margin-top: 4px;">Your university already verified you, so this can be any inbox you actually read — a personal one usually arrives faster than a university address.</span>
          </div>

          <!-- LinkedIn Verification URL -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">LinkedIn Profile URL <span>(strongly encouraged · unlocks verified badge)</span></label>
            <input type="url" class="mentor-form-input" id="bm-linkedin" placeholder="https://www.linkedin.com/in/yourprofile">
            <span style="font-size: 12px; opacity: 0.6; display: block; margin-top: 4px;">Adding your LinkedIn profile unlocks the "LinkedIn verified" trust badge on your profile.</span>
          </div>

          <!-- Any number of further links -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">Your Other Links <span>(optional · portfolio, GitHub, Substack — add as many as you like)</span></label>
            <div id="bm-links-container"></div>
            <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 12.5px; padding: 6px 14px; margin-top: 8px;" onclick="window.addSignupLink()">
              ${ICONS.plus} add a link
            </button>
          </div>

          <!-- 90-second pitch video: record in-app or upload -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">90-Second Pitch Video <span>(optional · record here or upload a file)</span></label>
            <span style="font-size: 12.5px; opacity: 0.65; display: block; margin-bottom: 10px; line-height: 1.5;">
              Profiles with a pitch get booked more. Say who you are, what you study, and what you can help with.
              You can always add this later from your portal.
            </span>
            <div id="signup-pitch-container"></div>
          </div>

          <!-- Instant Onboarding Notice (No Interview Required) -->
          <div class="mentor-form-group">
            <div style="background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 12px; padding: 14px 18px; display: flex; gap: 12px; align-items: flex-start;">
              <span style="color: #16a34a; display: inline-flex; align-items: center; margin-top: 2px;">${ICONS.shieldTick}</span>
              <div style="font-size: 13.5px; line-height: 1.5; color: #15803d;">
                <strong>Instant Onboarding · Zero Interviews:</strong> We don't require gatekept committee interviews. Simply verify your official .ac.uk student email with LinkedIn confirmation, and your profile & booking calendar go live immediately across the platform!
              </div>
            </div>
          </div>

          <!-- Achievements Selection (Top 3 Free-Text Inputs) -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">Your Top 3 Achievements <span>* (what are you most proud of? e.g. internships, offers, awards, ranks)</span></label>
            <span style="font-size: 12px; opacity: 0.65; display: block; margin-bottom: 8px;">These appear as badges directly on your mentor profile card.</span>
            <div class="mentor-achievements-inputs" id="bm-achievements">
              <div class="mentor-achieve-field">
                <span class="mentor-achieve-num">1</span>
                <input type="text" class="mentor-form-input" id="bm-achieve-1" required placeholder="e.g. Incoming Software Engineer @ Stripe London" maxlength="75" oninput="window.updateLiveAchievements()">
              </div>
              <div class="mentor-achieve-field">
                <span class="mentor-achieve-num">2</span>
                <input type="text" class="mentor-form-input" id="bm-achieve-2" placeholder="e.g. Founded YC S23 backed dev tools startup" maxlength="75" oninput="window.updateLiveAchievements()">
              </div>
              <div class="mentor-achieve-field">
                <span class="mentor-achieve-num">3</span>
                <input type="text" class="mentor-form-input" id="bm-achieve-3" placeholder="e.g. 1st Class Honours (Rank 1 / Dean's List)" maxlength="75" oninput="window.updateLiveAchievements()">
              </div>
            </div>
          </div>

          <!-- Live Post-It Note Preview -->
          <div class="mentor-form-group">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
              <label class="mentor-form-label" style="margin-bottom: 0;">Your Top Tip for Freshers <span>* (appears on your post-it note!)</span></label>
              <span id="bm-tip-counter" style="font-size: 12px; font-weight: 600; color: var(--color-cocoa-ink); opacity: 0.6;">0 / 140</span>
            </div>
            <div class="live-postit-preview-wrap">
              <div>
                <textarea class="mentor-form-textarea" id="bm-toptip" rows="3" required maxlength="140" placeholder="e.g. Give your best tip here..." oninput="updateLivePostit(this.value)"></textarea>
                <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 13px; font-weight: 600;">Post-It Color:</span>
                  <label><input type="radio" name="postit-color" value="yellow" checked onchange="setLivePostitColor('yellow')"> Yellow</label>
                  <label><input type="radio" name="postit-color" value="mint" onchange="setLivePostitColor('mint')"> Mint</label>
                  <label><input type="radio" name="postit-color" value="blush" onchange="setLivePostitColor('blush')"> Blush</label>
                  <label><input type="radio" name="postit-color" value="sky" onchange="setLivePostitColor('sky')"> Sky</label>
                </div>
              </div>

              <!-- Real-time Live Preview -->
              <div>
                <div class="live-postit-preview" id="live-postit-card">
                  <div class="live-postit-preview__pin"></div>
                  <div class="live-postit-preview__text" id="live-postit-text">
                    “Give your best tip here...”
                  </div>
                  <span class="live-postit-preview__author" id="live-postit-author">— you @ google meet</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Optional First Resource / Freabie Publication -->
          <div class="mentor-form-group">
            <div style="background: var(--color-warm-card); border: 1.5px solid rgba(23, 23, 23, 0.15); border-radius: 12px; padding: 22px 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <label class="mentor-form-label" style="margin-bottom: 0;">Publish your first Freabie or Playbook <span>(optional)</span></label>
                <span class="doc-badge doc-badge--free">${feeBadgeText()}</span>
              </div>
              <span style="font-size: 13px; opacity: 0.75; display: block; margin-bottom: 14px; line-height: 1.5;">Share your revision bibles, interview cheat sheets, or templates. Keep it free as a "freabie", or set a price — students pay exactly what you list, and frea's ${feePercent()}% comes out of your share, never theirs.</span>

              <div class="academic-integrity-callout">
                <span style="font-size: 18px; flex-shrink: 0;">⚠️</span>
                <div>
                  <strong>Academic Integrity Warning:</strong> Please ensure all uploaded documents comply with UK university academic integrity regulations. Upload only original student-created notes, guides, or templates (no exam leaks, unauthorized coursework, or plagiarism).
                </div>
              </div>

              <!-- Title & Type Selection -->
              <div class="mentor-form-row" style="margin-bottom: 12px;">
                <div class="mentor-form-group" style="flex: 2; margin-bottom: 0;">
                  <label class="mentor-form-label" style="font-size: 12.5px;">Resource Title</label>
                  <input type="text" class="mentor-form-input" id="bm-doc-title" placeholder="e.g. 1st Year Exam Survival Bible or Tech CV Template">
                </div>
                <div class="mentor-form-group" style="flex: 1; margin-bottom: 0;">
                  <label class="mentor-form-label" style="font-size: 12.5px;">Pricing Model</label>
                  <select class="mentor-form-select" id="bm-doc-type" onchange="window.toggleDocPriceField(this.value, 'bm-doc-price-wrap')">
                    <option value="free">Freabie (Free)</option>
                    <option value="paid">Playbook (Paid)</option>
                  </select>
                </div>
              </div>

              <!-- Dynamic Price & Category Row -->
              <div class="mentor-form-row" style="margin-bottom: 12px;">
                <div class="mentor-form-group" style="flex: 1; margin-bottom: 0;">
                  <label class="mentor-form-label" style="font-size: 12.5px;">Category Tag</label>
                  <select class="mentor-form-select" id="bm-doc-category">
                    <option value="Tech & Coding">Tech & Coding</option>
                    <option value="Economics & Finance">Economics & Finance</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Law">Law</option>
                    <option value="Medicine & Life Sciences">Medicine & Life Sciences</option>
                    <option value="Maths & Statistics">Maths & Statistics</option>
                    <option value="Interview Prep & CVs">Interview Prep & CVs</option>
                    <option value="Exam Bibles & Revision">Exam Bibles & Revision</option>
                    <option value="Productivity & Systems">Productivity & Systems</option>
                    <option value="General">General / Other</option>
                  </select>
                </div>
                <div class="mentor-form-group" id="bm-doc-price-wrap" style="flex: 1; display: none; margin-bottom: 0;">
                  <label class="mentor-form-label" style="font-size: 12.5px;">Price (£ GBP)</label>
                  <div style="position: relative; display: flex; align-items: center;">
                    <span style="position: absolute; left: 12px; font-weight: 800; color: var(--color-charcoal);">£</span>
                    <input type="number" class="mentor-form-input" id="bm-doc-price" min="1" max="100" step="0.01" value="4.99" disabled style="padding-left: 26px;" oninput="window.updatePayoutPreview('bm-doc-price', 'bm-doc-payout')">
                  </div>
                  <div id="bm-doc-payout" style="font-size: 12.5px; margin-top: 6px; line-height: 1.5;"></div>
                </div>
              </div>

              <!-- Description Subtitle -->
              <div class="mentor-form-group" style="margin-bottom: 14px;">
                <label class="mentor-form-label" style="font-size: 12.5px;">Short Subtitle / Key Takeaways</label>
                <input type="text" class="mentor-form-input" id="bm-doc-desc" placeholder="e.g. Annotated lecture walkthroughs & past exam pitfalls solved">
              </div>

              <!-- Real File Upload Area -->
              <div class="mentor-form-group" style="margin-bottom: 0;">
                <label class="mentor-form-label" style="font-size: 12.5px;">Upload Document <span>(PDF, Markdown .md, LaTeX .tex, or PowerPoint .pptx · Max 10MB)</span></label>
                <div class="file-dropzone" id="bm-doc-dropzone">
                  <input type="file" id="bm-doc-file" accept=".pdf,.md,.tex,.pptx" onchange="window.handleDocumentFileSelect(event, 'bm-doc-preview', 'bm-doc-uploaded-file')">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    <span style="color: var(--color-marker-orange);">${ICONS.documentDownload}</span>
                    <div style="font-size: 13.5px; font-weight: 700; color: var(--color-charcoal);">Click to browse or drop your document here</div>
                    <span style="font-size: 11.5px; opacity: 0.65;">Accepts PDF, Markdown, LaTeX, PowerPoint (up to 10MB)</span>
                  </div>
                </div>
                <div id="bm-doc-preview" style="display: none;"></div>
                <input type="hidden" id="bm-doc-uploaded-file" value="">
                <input type="hidden" id="bm-doc-uploaded-format" value="">
              </div>
            </div>
          </div>

          <div id="bm-form-error" role="alert" style="display: none; margin-top: 24px; padding: 12px 16px; border-radius: 10px; background: #fef2f2; border: 1.5px solid #fecaca; color: #b91c1c; font-size: 14px; font-weight: 600; text-align: center;"></div>

          <div style="margin-top: 36px; text-align: center;">
            <button type="submit" class="pill-btn pill-btn--animated" style="padding: 14px 44px; font-size: 17px;">
              <span class="pill-btn__inner">
                <span>submit mentor application</span>
                <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
              </span>
            </button>
            <div style="font-size: 13px; opacity: 0.65; margin-top: 10px;">no interviews · instant activation upon .ac.uk email verification</div>
          </div>
        </form>
      </div>
    </div>

    ${renderFooter()}
  `;
}

// Live Post-It Preview Handlers
// ─── Signup: unlimited profile links ─────

let signupLinksData = [];

function renderSignupLinks() {
  const container = document.getElementById('bm-links-container');
  if (!container) return;

  container.innerHTML = signupLinksData.length === 0
    ? '<div style="font-size: 12.5px; opacity: 0.55;">No extra links yet.</div>'
    : signupLinksData.map((link, i) => `
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap;">
          <input type="text" class="mentor-form-input" style="width: 140px; padding: 8px 12px; font-size: 13px;"
                 value="${escapeHtml(link.label || '')}" placeholder="Label"
                 oninput="window.updateSignupLink(${i}, 'label', this.value)">
          <input type="url" class="mentor-form-input" style="flex: 1; min-width: 200px; padding: 8px 12px; font-size: 13px;"
                 value="${escapeHtml(link.url || '')}" placeholder="https://…"
                 oninput="window.updateSignupLink(${i}, 'url', this.value)">
          <button type="button" class="schedule-slot-remove" style="font-size: 18px;" title="Remove"
                  onclick="window.removeSignupLink(${i})">×</button>
        </div>
      `).join('');
}

function addSignupLink() {
  signupLinksData.push({ label: '', url: '' });
  renderSignupLinks();
}
window.addSignupLink = addSignupLink;

function updateSignupLink(index, field, value) {
  if (signupLinksData[index]) signupLinksData[index][field] = value;
}
window.updateSignupLink = updateSignupLink;

function removeSignupLink(index) {
  signupLinksData.splice(index, 1);
  renderSignupLinks();
}
window.removeSignupLink = removeSignupLink;

// ─── Payouts ─────
//
// Mentors can publish free freabies from the moment they join. Pricing a
// playbook needs somewhere for the money to land, so this card explains the
// one extra step and hands them to Stripe's hosted onboarding — bank details
// and ID never touch frea.

let payoutStatusCache = null;

async function loadPayoutStatus(force = false) {
  const card = document.getElementById('portal-payouts-card');
  if (!card) return;

  if (!payoutStatusCache || force) {
    payoutStatusCache = await fetchPayoutStatus();
  }
  renderPayoutCard(payoutStatusCache);
  return payoutStatusCache;
}
window.loadPayoutStatus = loadPayoutStatus;

function renderPayoutCard(status) {
  const card = document.getElementById('portal-payouts-card');
  if (!card) return;

  // Payments switched off entirely: say so plainly rather than showing a
  // button that cannot work.
  if (!status.configured) {
    card.innerHTML = `
      <div class="payout-card payout-card--muted">
        <div class="payout-card__head">
          <span class="payout-card__icon">${ICONS.lock}</span>
          <div>
            <div class="payout-card__title">Paid playbooks aren't live yet</div>
            <div class="payout-card__sub">
              frea hasn't switched on card payments. Everything else works —
              publish freabies and take free calls as normal.
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (status.payoutsEnabled) {
    card.innerHTML = `
      <div class="payout-card payout-card--ready">
        <div class="payout-card__head">
          <span class="payout-card__icon" style="color: #16a34a;">${ICONS.tickCircle}</span>
          <div>
            <div class="payout-card__title">Payouts are set up</div>
            <div class="payout-card__sub">
              You can price playbooks. Earnings land in your bank weekly, with
              frea's ${feePercent()}% already deducted — students always pay the listed price.
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const started = status.started;
  const outstanding = status.currentlyDue || [];

  card.innerHTML = `
    <div class="payout-card">
      <div class="payout-card__head">
        <span class="payout-card__icon">${ICONS.card || ICONS.lock}</span>
        <div>
          <div class="payout-card__title">
            ${started ? 'Finish setting up payouts' : 'Want to sell playbooks?'}
          </div>
          <div class="payout-card__sub">
            ${started
              ? 'Stripe still needs a few details before money can reach you.'
              : `Set up payouts to price your work. Takes a couple of minutes, and you keep ${payoutPercent()}% of every sale.`}
          </div>
        </div>
      </div>

      ${outstanding.length ? `
        <ul class="payout-card__todo">
          ${outstanding.map(item => `<li>${escapeHtml(humaniseRequirement(item))}</li>`).join('')}
        </ul>
      ` : ''}

      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 12px;">
        <button type="button" class="pill-btn pill-btn--animated" id="payout-start-btn" onclick="window.beginPayoutOnboarding()">
          <span class="pill-btn__inner">
            <span>${started ? 'continue setup' : 'set up payouts'}</span>
            <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
          </span>
        </button>
        ${started ? `
          <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 12.5px; padding: 6px 14px;" onclick="window.loadPayoutStatus(true)">
            refresh status
          </button>` : ''}
      </div>

      <p class="payout-card__fine">
        ${ICONS.shieldTick} Handled by Stripe. Your bank details and ID go to them, never to frea.
        You can skip this entirely and keep sharing free freabies.
      </p>
      <div id="payout-error" style="display: none; color: #ef4444; font-size: 13px; font-weight: 600; margin-top: 8px;"></div>
    </div>
  `;
}

/** Stripe's requirement ids are machine-readable; students are not. */
function humaniseRequirement(raw) {
  const key = String(raw).toLowerCase();
  if (key.includes('external_account')) return 'Your bank account details';
  if (key.includes('terms_of_service')) return "Accept Stripe's terms";
  if (key.includes('address')) return 'Your home address';
  if (key.includes('dob') || key.includes('date_of_birth')) return 'Your date of birth';
  if (key.includes('business_url') || key.includes('profile')) return 'A short description of what you sell';
  if (key.includes('document') || key.includes('verification')) return 'A photo of your ID';
  if (key.includes('name')) return 'Your legal name';
  if (key.includes('phone')) return 'A phone number';
  return raw;
}

async function beginPayoutOnboarding() {
  const btn = document.getElementById('payout-start-btn');
  const errorEl = document.getElementById('payout-error');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span>opening Stripe…</span>'; }
  if (errorEl) errorEl.style.display = 'none';

  try {
    const { url } = await startPayoutOnboarding();
    trackEvent('payout_onboarding_started', {});
    window.location.href = url;
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="pill-btn__inner"><span>set up payouts</span><span class="pill-btn__arrow">${ICONS.arrowRight}</span></span>`;
    }
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = err.message || 'Could not open Stripe. Please try again.';
    }
  }
}
window.beginPayoutOnboarding = beginPayoutOnboarding;

/**
 * Returning from Stripe's hosted flow. Verification is not instant, so this
 * reports honestly rather than claiming success on arrival.
 */
async function handlePayoutReturn(route) {
  const params = new URLSearchParams((route.split('?')[1]) || '');
  const state = params.get('payouts');
  if (!state) return;

  if (state === 'refresh') {
    showToast('That setup link expired — starting a fresh one.');
    setTimeout(beginPayoutOnboarding, 400);
    return;
  }

  if (state === 'done') {
    const status = await loadPayoutStatus(true);
    if (status?.payoutsEnabled) {
      showToast('Payouts are set up — you can price playbooks now.');
    } else {
      showToast('Details received. Stripe is still verifying — this can take a few minutes.');
    }
  }
}
window.handlePayoutReturn = handlePayoutReturn;

// ─── Reporting ─────
//
// Publishing is instant and unreviewed, so students need an in-product way to
// flag something rather than having to find an email address. A report is a
// signal for the team, not an automatic takedown.

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate or offensive' },
  { value: 'misleading', label: 'Misleading or false claims' },
  { value: 'copyright', label: "Someone else's work" },
  { value: 'not-a-student', label: 'Not a genuine student' },
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'other', label: 'Something else' }
];

function openReportModal(targetType, targetId, label = '') {
  requireVerifiedSession({
    email: verifiedEmail(),
    actionName: 'report this',
    onVerified: () => renderReportModal(targetType, targetId, label)
  });
}
window.openReportModal = openReportModal;

function renderReportModal(targetType, targetId, label) {
  const modal = document.getElementById('modal-content');
  if (!modal) return;

  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <div style="padding: 24px 20px; max-width: 460px; margin: 0 auto;">
      <h2 style="font-size: 22px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">
        Report ${targetType === 'mentor' ? 'this mentor' : 'this resource'}
      </h2>
      ${label ? `<p style="font-size: 13.5px; opacity: 0.7; margin-bottom: 16px;">${escapeHtml(label)}</p>` : ''}
      <p style="font-size: 13.5px; opacity: 0.8; line-height: 1.55; margin-bottom: 18px;">
        Anyone with a UK student email can publish here, which is what keeps frea fast and free.
        Telling us when something is wrong is how we keep it trustworthy.
      </p>

      <form id="report-form" onsubmit="window.handleReportSubmit(event, '${escapeHtml(targetType)}', '${escapeHtml(String(targetId))}')">
        <div class="mentor-form-group" style="margin-bottom: 14px;">
          <label class="mentor-form-label" style="font-size: 13px;">What's the problem?</label>
          <select id="report-reason" class="mentor-form-select" style="width: 100%;">
            ${REPORT_REASONS.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
          </select>
        </div>

        <div class="mentor-form-group" style="margin-bottom: 16px;">
          <label class="mentor-form-label" style="font-size: 13px;">Anything else? <span>(optional)</span></label>
          <textarea id="report-detail" class="mentor-form-textarea" rows="3" maxlength="800"
                    placeholder="A sentence or two helps us act on it quickly."></textarea>
        </div>

        <div id="report-error" style="display: none; color: #ef4444; font-size: 13px; font-weight: 600; margin-bottom: 10px;"></div>

        <div style="display: flex; gap: 10px;">
          <button type="button" class="pill-btn pill-btn--subtle" onclick="closeModal()">cancel</button>
          <button type="submit" id="report-submit-btn" class="pill-btn pill-btn--animated" style="flex: 1;">
            <span class="pill-btn__inner" style="justify-content: center;">
              <span>send report</span>
              <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  `;

  openOverlay();
}

async function handleReportSubmit(e, targetType, targetId) {
  e.preventDefault();
  const btn = document.getElementById('report-submit-btn');
  const errorEl = document.getElementById('report-error');

  if (btn) { btn.disabled = true; btn.innerHTML = '<span>sending…</span>'; }

  try {
    await submitReport({
      targetType,
      targetId,
      reason: document.getElementById('report-reason')?.value,
      detail: document.getElementById('report-detail')?.value
    });
    closeModal();
    showToast('Report sent — thank you. The frea team will take a look.');
    trackEvent('report_submitted', { targetType });
  } catch (err) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = err.message || 'Could not send that report. Please try again.';
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="pill-btn__inner" style="justify-content: center;"><span>send report</span><span class="pill-btn__arrow">${ICONS.arrowRight}</span></span>`;
    }
  }
}
window.handleReportSubmit = handleReportSubmit;

/** Small, unobtrusive trigger — present but never competing with the content. */
function reportLink(targetType, targetId, label = '') {
  return `
    <button type="button" class="report-link"
            onclick="window.openReportModal(${jsArg(targetType)}, ${jsArg(targetId)}, ${jsArg(label)})"
            title="Report this to the frea team">
      report
    </button>
  `;
}
window.reportLink = reportLink;

// ─── Pitch video: record in-app or upload a file ─────
//
// Recording is the lead path because it costs nothing to compress: the camera
// is constrained to 720p at capture, so a 90-second take lands around 11MB
// with no processing wait. Uploading a file previews instantly from a local
// object URL, before any network activity.

const PITCH_MAX_SECONDS = 90;
const PITCH_MAX_BYTES = 100 * 1024 * 1024;

let pitchRecorder = null;
let pitchStream = null;
let pitchChunks = [];
let pitchTimer = null;
let pitchBlobUrl = null;
let pitchPendingBlob = null;

/** Renders the whole control into `containerId`. */
function renderPitchVideoControl(containerId, currentUrl = '') {
  const el = document.getElementById(containerId);
  if (!el) return;

  const hasVideo = Boolean(currentUrl);
  const supportsRecording = Boolean(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder
  );

  el.innerHTML = `
    <div class="pitch-video" id="pitch-video-root">
      ${hasVideo ? `
        <div class="pitch-video__current" id="pitch-current">
          <video src="${escapeHtml(currentUrl)}" controls playsinline preload="metadata"
                 style="width: 100%; max-width: 420px; border-radius: 12px; border: 1.5px solid var(--color-charcoal); background: #000; display: block;"></video>
          <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
            <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 12.5px; padding: 6px 14px;" onclick="window.replacePitchVideo()">
              replace video
            </button>
            <button type="button" class="admin-btn admin-btn--reject" style="font-size: 12.5px; padding: 6px 14px;" onclick="window.removePitchVideo()">
              remove
            </button>
          </div>
        </div>
      ` : ''}

      <div id="pitch-chooser" ${hasVideo ? 'hidden' : ''}>
        <div class="pitch-video__tabs" role="tablist">
          <button type="button" class="pitch-tab ${supportsRecording ? 'active' : ''}" id="pitch-tab-record"
                  onclick="window.switchPitchTab('record')" ${supportsRecording ? '' : 'disabled'}>
            ${ICONS.video} Record now
          </button>
          <button type="button" class="pitch-tab ${supportsRecording ? '' : 'active'}" id="pitch-tab-upload"
                  onclick="window.switchPitchTab('upload')">
            ${ICONS.documentUpload || '↑'} Upload a file
          </button>
        </div>

        <!-- Record -->
        <div class="pitch-panel ${supportsRecording ? '' : 'hidden'}" id="pitch-panel-record">
          ${supportsRecording ? `
            <div class="pitch-video__stage">
              <video id="pitch-live" muted playsinline autoplay
                     style="width: 100%; max-width: 420px; aspect-ratio: 16/9; border-radius: 12px; border: 1.5px solid var(--color-charcoal); background: #111; object-fit: cover; display: block;"></video>
              <div class="pitch-video__timer" id="pitch-timer" hidden>
                <span class="pitch-video__dot"></span><span id="pitch-timer-text">0:00</span>
                <span style="opacity: 0.7;"> / 1:30</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; align-items: center;">
              <button type="button" class="pill-btn pill-btn--animated" id="pitch-start-btn" onclick="window.startPitchRecording()">
                <span class="pill-btn__inner"><span>start camera</span><span class="pill-btn__arrow">${ICONS.video}</span></span>
              </button>
              <button type="button" class="pill-btn pill-btn--dark" id="pitch-record-btn" onclick="window.togglePitchRecording()" hidden>record</button>
              <button type="button" class="pill-btn pill-btn--subtle" id="pitch-retake-btn" onclick="window.retakePitch()" hidden>retake</button>
            </div>
            <p style="font-size: 12.5px; opacity: 0.65; margin: 10px 0 0; line-height: 1.5;">
              Up to 90 seconds. Recorded at 720p so it stays small and uploads in seconds —
              say who you are, what you're studying, and what you can help with.
            </p>
          ` : `
            <p style="font-size: 13px; opacity: 0.75;">
              This browser can't record video. Upload a file instead.
            </p>
          `}
        </div>

        <!-- Upload -->
        <div class="pitch-panel ${supportsRecording ? 'hidden' : ''}" id="pitch-panel-upload">
          <label class="pitch-drop" for="pitch-file">
            <span style="font-size: 26px;">${ICONS.video}</span>
            <span style="font-weight: 700; color: var(--color-charcoal);">Choose a video</span>
            <span style="font-size: 12.5px; opacity: 0.65;">MP4, WebM or MOV · up to 100MB</span>
          </label>
          <input type="file" id="pitch-file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                 style="display: none;" onchange="window.handlePitchFile(event)">
        </div>

        <!-- Shared preview + confirm -->
        <div id="pitch-preview" hidden style="margin-top: 14px;">
          <div style="font-size: 12.5px; font-weight: 700; color: var(--color-charcoal); margin-bottom: 6px;">
            Preview — happy with this one?
          </div>
          <video id="pitch-preview-video" controls playsinline
                 style="width: 100%; max-width: 420px; border-radius: 12px; border: 1.5px solid var(--color-charcoal); background: #000; display: block;"></video>
          <div id="pitch-meta" style="font-size: 12px; opacity: 0.65; margin-top: 6px;"></div>
          <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
            <button type="button" class="pill-btn pill-btn--animated" id="pitch-save-btn" onclick="window.savePitchVideo()">
              <span class="pill-btn__inner"><span>use this video</span><span class="pill-btn__arrow">${ICONS.arrowRight}</span></span>
            </button>
            <button type="button" class="pill-btn pill-btn--subtle" onclick="window.discardPitchTake()">start over</button>
          </div>
          <div id="pitch-progress" hidden style="margin-top: 10px;">
            <div style="height: 6px; background: rgba(23,23,23,0.1); border-radius: 999px; overflow: hidden;">
              <div id="pitch-progress-bar" style="height: 100%; width: 0%; background: var(--color-marker-orange); transition: width 0.2s;"></div>
            </div>
            <div id="pitch-progress-text" style="font-size: 12px; opacity: 0.7; margin-top: 5px;">uploading…</div>
          </div>
        </div>

        <div id="pitch-error" style="display: none; color: #ef4444; font-size: 13px; font-weight: 600; margin-top: 10px;"></div>
      </div>
    </div>
  `;
}
window.renderPitchVideoControl = renderPitchVideoControl;

function switchPitchTab(which) {
  ['record', 'upload'].forEach(t => {
    document.getElementById(`pitch-tab-${t}`)?.classList.toggle('active', t === which);
    document.getElementById(`pitch-panel-${t}`)?.classList.toggle('hidden', t !== which);
  });
  if (which === 'upload') stopPitchStream();
}
window.switchPitchTab = switchPitchTab;

function pitchError(message) {
  const el = document.getElementById('pitch-error');
  if (el) {
    el.style.display = message ? 'block' : 'none';
    el.innerText = message || '';
  }
}

// ─── Recording ─────

async function startPitchRecording() {
  pitchError('');
  const startBtn = document.getElementById('pitch-start-btn');
  if (startBtn) { startBtn.disabled = true; startBtn.innerHTML = '<span>starting camera…</span>'; }

  try {
    // 720p at capture is the whole compression story — no re-encode needed.
    pitchStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: { echoCancellation: true, noiseSuppression: true }
    });
  } catch (err) {
    if (startBtn) { startBtn.disabled = false; startBtn.innerHTML = '<span class="pill-btn__inner"><span>start camera</span></span>'; }
    pitchError(
      err.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow it in your browser settings, or upload a file instead.'
        : `Could not start the camera: ${err.message}. You can upload a file instead.`
    );
    return;
  }

  const live = document.getElementById('pitch-live');
  if (live) {
    live.srcObject = pitchStream;
    live.muted = true;
    await live.play().catch(() => {});
  }

  if (startBtn) startBtn.hidden = true;
  const recBtn = document.getElementById('pitch-record-btn');
  if (recBtn) { recBtn.hidden = false; recBtn.innerText = 'record'; }
}
window.startPitchRecording = startPitchRecording;

function preferredMimeType() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';
}

function togglePitchRecording() {
  if (pitchRecorder && pitchRecorder.state === 'recording') {
    stopPitchRecording();
    return;
  }
  if (!pitchStream) return;

  pitchChunks = [];
  const mimeType = preferredMimeType();

  try {
    pitchRecorder = new MediaRecorder(pitchStream, mimeType ? { mimeType, videoBitsPerSecond: 1_200_000 } : undefined);
  } catch (err) {
    pitchError(`Could not start recording: ${err.message}`);
    return;
  }

  pitchRecorder.ondataavailable = (e) => { if (e.data && e.data.size) pitchChunks.push(e.data); };
  pitchRecorder.onstop = () => {
    // Strip the codec parameter before upload. MediaRecorder reports types
    // like "video/webm;codecs=vp9,opus", and the unquoted comma makes the
    // multipart Content-Type unparseable server-side.
    const baseType = (pitchRecorder.mimeType || 'video/webm').split(';')[0].trim();
    const blob = new Blob(pitchChunks, { type: baseType });
    stopPitchStream();
    showPitchPreview(blob, 'recording');
  };

  pitchRecorder.start(250);

  const recBtn = document.getElementById('pitch-record-btn');
  if (recBtn) recBtn.innerText = 'stop';

  // Countdown, with a hard stop at the cap so nobody records past the limit.
  const timerWrap = document.getElementById('pitch-timer');
  const timerText = document.getElementById('pitch-timer-text');
  if (timerWrap) timerWrap.hidden = false;

  let elapsed = 0;
  clearInterval(pitchTimer);
  pitchTimer = setInterval(() => {
    elapsed += 1;
    if (timerText) {
      timerText.innerText = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
    }
    if (elapsed >= PITCH_MAX_SECONDS) stopPitchRecording();
  }, 1000);
}
window.togglePitchRecording = togglePitchRecording;

function stopPitchRecording() {
  clearInterval(pitchTimer);
  const timerWrap = document.getElementById('pitch-timer');
  if (timerWrap) timerWrap.hidden = true;
  if (pitchRecorder && pitchRecorder.state !== 'inactive') pitchRecorder.stop();
}

function stopPitchStream() {
  if (pitchStream) {
    pitchStream.getTracks().forEach(t => t.stop());
    pitchStream = null;
  }
  const live = document.getElementById('pitch-live');
  if (live) live.srcObject = null;
}

function retakePitch() {
  discardPitchTake();
  startPitchRecording();
}
window.retakePitch = retakePitch;

// ─── File upload ─────

function handlePitchFile(event) {
  pitchError('');
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > PITCH_MAX_BYTES) {
    pitchError(
      `That file is ${(file.size / 1024 / 1024).toFixed(0)}MB — the limit is 100MB. `
      + 'Recording here instead keeps it small automatically, or trim the file first.'
    );
    event.target.value = '';
    return;
  }

  // Preview straight from the local file: no upload happens until they confirm.
  showPitchPreview(file, 'file');
}
window.handlePitchFile = handlePitchFile;

// ─── Shared preview ─────

function showPitchPreview(blob, source) {
  pitchPendingBlob = blob;

  if (pitchBlobUrl) URL.revokeObjectURL(pitchBlobUrl);
  pitchBlobUrl = URL.createObjectURL(blob);

  const wrap = document.getElementById('pitch-preview');
  const video = document.getElementById('pitch-preview-video');
  const meta = document.getElementById('pitch-meta');

  if (video) {
    video.src = pitchBlobUrl;
    video.onloadedmetadata = () => {
      if (!meta) return;
      const secs = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
      const size = `${(blob.size / 1024 / 1024).toFixed(1)}MB`;

      if (secs && secs > PITCH_MAX_SECONDS + 2 && source === 'file') {
        meta.innerHTML = `<span style="color: #b45309;">${secs}s · ${size} — that's over the 90-second guide. It will still upload, but shorter pitches get watched to the end.</span>`;
      } else {
        meta.innerText = `${secs ? secs + 's · ' : ''}${size}`;
      }
    };
  }

  if (wrap) wrap.hidden = false;
  document.getElementById('pitch-retake-btn')?.removeAttribute('hidden');
  const recBtn = document.getElementById('pitch-record-btn');
  if (recBtn) recBtn.hidden = true;

  wrap?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function discardPitchTake() {
  pitchPendingBlob = null;
  if (pitchBlobUrl) {
    URL.revokeObjectURL(pitchBlobUrl);
    pitchBlobUrl = null;
  }
  const wrap = document.getElementById('pitch-preview');
  if (wrap) wrap.hidden = true;

  const fileInput = document.getElementById('pitch-file');
  if (fileInput) fileInput.value = '';

  document.getElementById('pitch-retake-btn')?.setAttribute('hidden', '');
  const startBtn = document.getElementById('pitch-start-btn');
  if (startBtn) {
    startBtn.hidden = false;
    startBtn.disabled = false;
    startBtn.innerHTML = `<span class="pill-btn__inner"><span>start camera</span><span class="pill-btn__arrow">${ICONS.video}</span></span>`;
  }
  const recBtn = document.getElementById('pitch-record-btn');
  if (recBtn) recBtn.hidden = true;
  pitchError('');
}
window.discardPitchTake = discardPitchTake;

// ─── Save ─────

/**
 * Uploads the pending take with real progress. XHR rather than fetch, because
 * fetch still cannot report upload progress.
 */
function savePitchVideo() {
  if (!pitchPendingBlob) return;

  const saveBtn = document.getElementById('pitch-save-btn');
  const progress = document.getElementById('pitch-progress');
  const bar = document.getElementById('pitch-progress-bar');
  const text = document.getElementById('pitch-progress-text');

  if (saveBtn) saveBtn.disabled = true;
  if (progress) progress.hidden = false;
  pitchError('');

  const form = new FormData();
  const ext = (pitchPendingBlob.type || '').includes('mp4') ? 'mp4' : 'webm';
  const name = pitchPendingBlob.name || `pitch-${Date.now()}.${ext}`;
  form.append('video', pitchPendingBlob, name);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload/pitch-video');

  const token = getSessionToken();
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  xhr.upload.onprogress = (e) => {
    if (!e.lengthComputable) return;
    const pct = Math.round((e.loaded / e.total) * 100);
    if (bar) bar.style.width = `${pct}%`;
    if (text) text.innerText = pct < 100 ? `uploading… ${pct}%` : 'processing…';
  };

  xhr.onload = () => {
    let json = {};
    try { json = JSON.parse(xhr.responseText); } catch (e) { /* handled below */ }

    if (xhr.status >= 200 && xhr.status < 300 && json.success) {
      if (bar) bar.style.width = '100%';
      showToast('Pitch video saved to your profile.');
      trackEvent('pitch_video_uploaded', { size: pitchPendingBlob.size });

      // Reflect it immediately in the in-memory mentor so the profile preview
      // updates without a reload.
      const mentor = resolveSessionMentor();
      if (mentor) mentor.pitchVideoUrl = json.videoUrl;

      discardPitchTake();
      renderPitchVideoControl('portal-pitch-container', json.videoUrl);
    } else {
      if (progress) progress.hidden = true;
      if (saveBtn) saveBtn.disabled = false;
      pitchError(json.error || `Upload failed (${xhr.status}).`);
    }
  };

  xhr.onerror = () => {
    if (progress) progress.hidden = true;
    if (saveBtn) saveBtn.disabled = false;
    pitchError('Upload failed — check your connection and try again.');
  };

  xhr.send(form);
}
window.savePitchVideo = savePitchVideo;

function replacePitchVideo() {
  const current = document.getElementById('pitch-current');
  const chooser = document.getElementById('pitch-chooser');
  if (current) current.hidden = true;
  if (chooser) chooser.hidden = false;
}
window.replacePitchVideo = replacePitchVideo;

async function removePitchVideo() {
  if (!confirm('Remove your pitch video? Your profile will show your bio instead.')) return;
  try {
    const res = await fetch('/api/upload/pitch-video', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getSessionToken()}` }
    });
    if (!res.ok) throw new Error('Could not remove the video.');

    const mentor = resolveSessionMentor();
    if (mentor) mentor.pitchVideoUrl = '';

    renderPitchVideoControl('portal-pitch-container', '');
    showToast('Pitch video removed.');
  } catch (err) {
    showToast(err.message || 'Could not remove the video.');
  }
}
window.removePitchVideo = removePitchVideo;

// ─── Fee presentation ─────
//
// The rate lives on the server and arrives via /api/payments/config. Every
// piece of fee copy derives from it, so the UI can never contradict what a
// mentor is actually charged (it used to say 1% in three places while the
// real rate was 5%).

function feePercent() {
  return window.__paymentConfig?.feeRatePercent ?? 5;
}

function payoutPercent() {
  return 100 - feePercent();
}

/** "you keep 95% · frea 5%" */
function feeBadgeText() {
  return `you keep ${payoutPercent()}% · frea ${feePercent()}%`;
}

/** Splits a price the same way the server does, for live preview. */
function splitForDisplay(price) {
  const total = Math.round(Number(price || 0) * 100) / 100;
  const fee = Math.round(total * (feePercent() / 100) * 100) / 100;
  return { total, fee, payout: Math.round((total - fee) * 100) / 100 };
}
window.splitForDisplay = splitForDisplay;

function updateLivePostit(val) {
  const textEl = document.getElementById('live-postit-text');
  const counterEl = document.getElementById('bm-tip-counter');
  if (counterEl) {
    const len = val.length;
    counterEl.innerText = `${len} / 140`;
    if (len >= 130) {
      counterEl.style.color = 'var(--color-marker-orange)';
      counterEl.style.fontWeight = '700';
      counterEl.style.opacity = '1';
    } else {
      counterEl.style.color = 'var(--color-cocoa-ink)';
      counterEl.style.fontWeight = '600';
      counterEl.style.opacity = '0.6';
    }
  }
  if (textEl) {
    textEl.innerText = val.trim() ? `“${val.trim()}”` : `“Give your best tip here...”`;
  }
}
window.updateLivePostit = updateLivePostit;

function setLivePostitColor(color) {
  const card = document.getElementById('live-postit-card');
  if (!card) return;
  const colors = {
    yellow: { bg: '#fef9c3', border: '#facc15', text: '#713f12' },
    mint: { bg: '#dcfce7', border: '#86efac', text: '#14532d' },
    blush: { bg: '#fce7f3', border: '#f472b6', text: '#831843' },
    sky: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0c4a6e' }
  };
  const theme = colors[color] || colors.yellow;
  card.style.background = theme.bg;
  card.style.borderColor = theme.border;
  card.style.color = theme.text;
}
window.setLivePostitColor = setLivePostitColor;

// ─── University Email Auto-Match & Live Achievements ───

function handleMentorEmailInput(email) {
  const badgeEl = document.getElementById('bm-uni-detect-badge');
  const uniSelect = document.getElementById('bm-uni');
  if (!email) {
    if (badgeEl) badgeEl.style.display = 'none';
    return;
  }
  const detectedUni = getUniversityFromEmail(email);
  if (detectedUni && uniSelect) {
    let matched = false;
    for (let i = 0; i < uniSelect.options.length; i++) {
      if (uniSelect.options[i].value === detectedUni) {
        uniSelect.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const opt = document.createElement('option');
      opt.value = detectedUni;
      opt.innerText = detectedUni;
      opt.selected = true;
      uniSelect.appendChild(opt);
    }
    if (badgeEl) {
      badgeEl.style.display = 'block';
      badgeEl.innerHTML = `<span class="uni-detect-badge">${ICONS.tickCircle} Auto-matched campus: <strong>${detectedUni}</strong></span>`;
    }
  } else {
    if (badgeEl) badgeEl.style.display = 'none';
  }
}
window.handleMentorEmailInput = handleMentorEmailInput;

function updateLiveAchievements() {
  const a1 = document.getElementById('bm-achieve-1')?.value.trim();
  const a2 = document.getElementById('bm-achieve-2')?.value.trim();
  const a3 = document.getElementById('bm-achieve-3')?.value.trim();
  const list = [a1, a2, a3].filter(Boolean);
  // Renders into the preview if the page provides one. The signup form does
  // not currently include the container, so this is a no-op there rather than
  // an error — the stickers still appear on the live profile.
  const previewWrap = document.getElementById('bm-live-achievements-preview');
  if (previewWrap) {
    previewWrap.innerHTML = list.length > 0
      ? list.map(a => achievementSticker(a)).join('')
      : '<span style="font-size: 12px; opacity: 0.5;">Enter achievements above to preview stickers</span>';
  }
}
window.updateLiveAchievements = updateLiveAchievements;

// ─── Mentor Profile Photo & Avatar Handlers ─────

function handleMentorPhotoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('That image is over 5MB. Please choose a smaller one.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (evt) {
    const dataUrl = evt.target.result;
    const photoDataEl = document.getElementById('bm-photo-data');
    const previewEl = document.getElementById('bm-photo-preview');
    const statusEl = document.getElementById('bm-avatar-status');
    const removeBtn = document.getElementById('bm-remove-photo-btn');

    if (photoDataEl) photoDataEl.value = dataUrl;
    if (previewEl) {
      previewEl.innerHTML = `<img src="${dataUrl}" alt="Preview" class="mentor-avatar-img">`;
    }
    if (statusEl) {
      statusEl.innerText = 'Custom Photo Uploaded';
    }
    if (removeBtn) {
      removeBtn.style.display = 'inline-flex';
    }

    // Deselect avatar buttons
    document.querySelectorAll('.avatar-preset-btn').forEach(b => b.classList.remove('active'));
  };
  reader.readAsDataURL(file);
}
window.handleMentorPhotoUpload = handleMentorPhotoUpload;

function removeMentorUploadedPhoto() {
  const photoDataEl = document.getElementById('bm-photo-data');
  const fileInput = document.getElementById('bm-photo-input');
  const removeBtn = document.getElementById('bm-remove-photo-btn');
  const avatarIdEl = document.getElementById('bm-selected-avatar-id');

  if (photoDataEl) photoDataEl.value = '';
  if (fileInput) fileInput.value = '';
  if (removeBtn) removeBtn.style.display = 'none';

  const avatarId = avatarIdEl ? parseInt(avatarIdEl.value) || 1 : 1;
  selectMentorPresetAvatar(avatarId);
}
window.removeMentorUploadedPhoto = removeMentorUploadedPhoto;

function selectMentorPresetAvatar(id) {
  const avatarIdEl = document.getElementById('bm-selected-avatar-id');
  const photoDataEl = document.getElementById('bm-photo-data');
  const fileInput = document.getElementById('bm-photo-input');
  const previewEl = document.getElementById('bm-photo-preview');
  const statusEl = document.getElementById('bm-avatar-status');
  const removeBtn = document.getElementById('bm-remove-photo-btn');

  if (avatarIdEl) avatarIdEl.value = id;
  if (photoDataEl) photoDataEl.value = '';
  if (fileInput) fileInput.value = '';
  if (removeBtn) removeBtn.style.display = 'none';

  if (previewEl) {
    previewEl.innerHTML = getMentorAvatar(id, 72);
  }
  if (statusEl) {
    statusEl.innerText = `Illustrated Avatar #${id}`;
  }

  document.querySelectorAll('.avatar-preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.avatarId) === id);
  });
}
window.selectMentorPresetAvatar = selectMentorPresetAvatar;

// ─── Digital Product Form & File Upload Handlers ─────

/** Live "you receive £X" under a price field, driven off the server's fee rate. */
function updatePayoutPreview(inputId, targetId) {
  const input = document.getElementById(inputId);
  const target = document.getElementById(targetId);
  if (!input || !target) return;

  const raw = parseFloat(input.value);
  if (!Number.isFinite(raw) || raw <= 0) {
    target.innerHTML = '';
    return;
  }
  if (raw < 1 || raw > 100) {
    target.innerHTML = `<span style="color: #b45309;">Playbooks must be priced between £1.00 and £100.00.</span>`;
    return;
  }

  const { total, fee, payout } = splitForDisplay(raw);
  target.innerHTML = `
    <span style="color: #16a34a; font-weight: 800;">You receive £${payout.toFixed(2)}</span>
    <span style="opacity: 0.7;"> per sale · frea keeps £${fee.toFixed(2)} (${feePercent()}%)</span>
    <br><span style="opacity: 0.6; font-size: 12px;">The student pays £${total.toFixed(2)} — your fee never comes out of their pocket.</span>
  `;
}
window.updatePayoutPreview = updatePayoutPreview;

function toggleDocPriceField(type, elId) {
  const el = document.getElementById(elId);
  if (!el) return;

  const paid = type === 'paid';
  el.style.display = paid ? 'block' : 'none';

  // Disable while hidden. A hidden control that fails constraint validation
  // blocks form submission, and the browser cannot focus it to explain why —
  // "An invalid form control with name='' is not focusable" — so the submit
  // button simply does nothing. Disabled controls are skipped by validation.
  const input = el.querySelector('input[type="number"]');
  if (input) {
    input.disabled = !paid;
    if (paid) updatePayoutPreview(input.id, input.id.replace('-price', '-payout'));
  }
}
window.toggleDocPriceField = toggleDocPriceField;

async function handleDocumentFileSelect(event, previewId, hiddenInputId) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const previewEl = document.getElementById(previewId);
  const hiddenInput = document.getElementById(hiddenInputId);

  // Whitelist extensions strictly: .pdf, .md, .tex, .pptx
  const allowedExts = ['.pdf', '.md', '.tex', '.pptx'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExts.includes(ext)) {
    showToast(`We cannot accept ${ext} files — please upload a .pdf, .md, .tex or .pptx.`);
    event.target.value = '';
    return;
  }

  // 10MB file limit
  if (file.size > 10 * 1024 * 1024) {
    showToast('That file is over the 10MB limit. Please upload a smaller document.');
    event.target.value = '';
    return;
  }

  if (previewEl) {
    previewEl.style.display = 'block';
    previewEl.innerHTML = `
      <div style="margin-top: 10px; padding: 12px 14px; background: var(--color-dew-drop); border: 1.5px solid rgba(23, 23, 23, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 800; font-size: 11px; padding: 3px 6px; background: var(--color-charcoal); color: #fff; border-radius: 4px; text-transform: uppercase;">${ext.replace('.', '')}</span>
          <span style="font-size: 13.5px; font-weight: 600;">${escapeHtml(file.name)}</span>
          <span style="font-size: 12px; opacity: 0.6;">(${(file.size / 1024).toFixed(0)} KB)</span>
        </div>
        <span style="font-size: 12px; color: var(--color-marker-orange); font-weight: 700;">Uploading...</span>
      </div>
    `;
  }

  try {
    const result = await uploadDocument(file);
    // The server returns an opaque handle, not a public URL: resource files are
    // only ever served through the authorised download route.
    if (hiddenInput) hiddenInput.value = result.fileName;
    const formatInput = document.getElementById(hiddenInputId.replace('-file', '-format'));
    if (formatInput) formatInput.value = result.format;
    if (previewEl) {
      previewEl.innerHTML = `
        <div style="margin-top: 10px; padding: 12px 14px; background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; font-size: 11px; padding: 3px 6px; background: #059669; color: #fff; border-radius: 4px; text-transform: uppercase;">${ext.replace('.', '')}</span>
            <span style="font-size: 13.5px; font-weight: 600; color: #065f46;">${file.name}</span>
            <span style="font-size: 12px; color: #047857;">(${(file.size / 1024).toFixed(0)} KB)</span>
          </div>
          <span style="font-size: 12px; color: #059669; font-weight: 700; display: flex; align-items: center; gap: 4px;">
            ${ICONS.tickCircle} Ready to publish
          </span>
        </div>
      `;
    }
  } catch (err) {
    showToast(`Could not upload: ${err.message || 'please check your connection.'}`);
    if (previewEl) previewEl.style.display = 'none';
    event.target.value = '';
  }
}
window.handleDocumentFileSelect = handleDocumentFileSelect;




// ─── Sign in ────────────────────────────────────────────
//
// One flow, rendered into whatever container asks for it — the booking gate,
// the shared action gate, the mentor sign-in page.
//
// Email first, always. The university proves who someone is exactly once, at
// registration; every sign-in after that only has to prove they still hold the
// inbox they nominated, and a code to a personal address does that perfectly
// well. The thing that was broken was .ac.uk filtering, not email.
//
// It also keeps graduates. University SSO stops working the day they leave,
// and mentors here are often recent graduates, so an account that outlives the
// degree is a requirement rather than a nicety.

/**
 * Renders the whole sign-in flow into `host` and calls `onSignedIn` once a
 * session exists, by whichever route.
 *
 *   known address    -> code to that inbox -> session
 *   unknown address  -> university sign-in -> nominate an inbox -> session
 */
function renderAuthFlow({ host, actionName = 'continue', onSignedIn }) {
  if (!host) return;

  const finish = async () => {
    await refreshEntitlements();
    updateNavbarMentorStatus();
    if (typeof onSignedIn === 'function') onSignedIn();
  };

  const showError = (message) => {
    const el = host.querySelector('.auth-flow__error');
    if (!el) { showToast(message); return; }
    el.style.display = 'block';
    el.innerText = message;
  };

  // ── Step 1: who are you?
  const renderEmailStep = () => {
    host.innerHTML = `
      <label class="auth-flow__label">Your email</label>
      <div class="modal__input-row">
        <input type="email" class="modal__input" id="auth-email" placeholder="e.g. you@gmail.com" autocomplete="email">
        <button id="auth-continue" class="pill-btn pill-btn--dark">continue</button>
      </div>
      <div id="auth-flow-error" class="auth-flow__error"></div>
      <div class="auth-flow__hint">
        New to frea? We'll verify you with your university — it takes a few seconds.
      </div>
    `;

    const input = host.querySelector('#auth-email');
    const btn = host.querySelector('#auth-continue');

    const submit = async () => {
      const email = (input.value || '').trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return showError('Please enter a valid email address.');
      }

      btn.disabled = true;
      btn.innerText = 'checking…';
      try {
        const { known } = await startSignIn(email);
        if (known) renderCodeStep(email);
        else renderRegisterStep(email);
      } catch (err) {
        btn.disabled = false;
        btn.innerText = 'continue';
        showError(err.message);
      }
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    input.focus();
  };

  // ── Step 2a: we know you — prove you still hold the inbox.
  const renderCodeStep = (email) => {
    host.innerHTML = `
      <div class="auth-flow__sent">
        We've sent a 6-digit code to <strong>${escapeHtml(email)}</strong>
      </div>
      <div class="modal__input-row">
        <input type="text" inputmode="numeric" maxlength="6" class="modal__input auth-flow__code" id="auth-code" placeholder="••••••" autocomplete="one-time-code">
        <button id="auth-verify" class="pill-btn pill-btn--dark">sign in</button>
      </div>
      <div id="auth-flow-error" class="auth-flow__error"></div>
      <div class="auth-flow__hint">
        <button type="button" class="auth-flow__link" id="auth-back">use a different email</button>
      </div>
    `;

    const input = host.querySelector('#auth-code');
    const btn = host.querySelector('#auth-verify');

    const submit = async () => {
      const code = (input.value || '').trim();
      if (code.length < 6) return showError('Please enter the 6-digit code.');

      btn.disabled = true;
      btn.innerText = 'signing in…';
      try {
        await verifyEmailCode(email, code);
        trackEvent('signin_code_success', {});
        showToast('Signed in.');
        await finish();
      } catch (err) {
        btn.disabled = false;
        btn.innerText = 'sign in';
        showError(err.message);
      }
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    host.querySelector('#auth-back').addEventListener('click', renderEmailStep);
    input.focus();
  };

  // ── Step 2b: we don't know you — the university vouches, then you
  // nominate an inbox for next time.
  const renderRegisterStep = (email) => {
    host.innerHTML = `
      <div class="auth-flow__sent">
        We don't recognise <strong>${escapeHtml(email)}</strong> yet — let's get you set up.
      </div>
      <button type="button" id="auth-studid" class="uni-signin-btn">
        <span>${ICONS.shieldTick}</span>
        <span>verify with your university</span>
      </button>
      <div class="uni-signin-note">
        You'll sign in on your own university's login page. Your password never reaches frea.
      </div>
      <div id="auth-flow-error" class="auth-flow__error"></div>
      <div class="auth-flow__hint">
        <button type="button" class="auth-flow__link" id="auth-back">use a different email</button>
      </div>
    `;

    const btn = host.querySelector('#auth-studid');
    host.querySelector('#auth-back').addEventListener('click', renderEmailStep);

    btn.addEventListener('click', () => {
      startUniversityVerification({
        trigger: btn,
        errorElId: 'auth-flow-error',
        onVerified: finish,
        renderEmailStep: (result) => {
          // Verified, but they have not told us where mail should go. Offer
          // the address they already typed rather than asking twice.
          host.innerHTML = contactEmailStepHtml({ institution: result.institution });
          const field = host.querySelector('#contact-email');
          if (field) field.value = email;
          wireContactEmailStep({ ticket: result.ticket, onVerified: finish });
        }
      });
    });
  };

  renderEmailStep();
}

// ─── University verification ────────────────────────────
//
// The emailed code is gone from the student path. Roughly four in five .ac.uk
// addresses are filtered by Microsoft or a security gateway in front of it,
// and Manchester's accepted our mail then delivered it nowhere reachable — no
// inbox, no junk, no quarantine. Nothing on our side was wrong; the receiving
// institution simply declined.
//
// So the university vouches for the student directly, over the federation its
// own IdP belongs to, and the address we ask for afterwards is only where
// invites go. A personal mailbox has no gateway in front of it, which is why
// confirmations now arrive at all.

/**
 * Runs verification, then either finishes or asks where to send invites.
 *
 * `onVerified` runs once a session exists — after the contact address for a
 * first-time student, immediately for a returning one.
 */
async function startUniversityVerification({ trigger, errorElId, onVerified, renderEmailStep }) {
  const errorEl = errorElId ? document.getElementById(errorElId) : null;
  if (errorEl) errorEl.style.display = 'none';

  const original = trigger ? trigger.innerHTML : null;
  if (trigger) {
    trigger.disabled = true;
    trigger.innerHTML = '<span>opening your university sign-in…</span>';
  }

  const fail = (message) => {
    if (trigger) {
      trigger.disabled = false;
      trigger.innerHTML = original;
    }
    // Closing the window is an ordinary cancel, not worth shouting about.
    if (/closed before it finished/i.test(message)) return;
    trackEvent('studid_verify_failed', { reason: message });
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = message;
    } else {
      showToast(message);
    }
  };

  let result;
  try {
    // Called synchronously from the click: browsers only allow window.open
    // while a user gesture is being handled.
    result = await verifyWithUniversity();
  } catch (err) {
    return fail(err.message);
  }

  trackEvent('studid_verify_success', { institution: result.institution || null, returning: !result.needsEmail });

  if (result.needsEmail) {
    // Verified, but we have nowhere to send the calendar invite yet.
    renderEmailStep(result);
    return;
  }

  await refreshEntitlements();
  updateNavbarMentorStatus();
  showToast('Verified with your university.');
  if (typeof onVerified === 'function') onVerified(result);
}

/**
 * The contact-address step, shown once the university has already vouched.
 *
 * Any provider, and deliberately so: this address proves nothing — the
 * institution already did that — it is only where invites and confirmations
 * go. A personal one is the point, because it is not behind the filtering
 * that made university mail unusable.
 */
function contactEmailStepHtml({ institution }) {
  return `
    <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; font-size: 13.5px; color: #15803d; display: flex; align-items: center; gap: 8px;">
      <span>${ICONS.shieldTick}</span>
      <span>Verified${institution ? ` with <strong>${escapeHtml(institution)}</strong>` : ''}</span>
    </div>
    <label style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 6px;">Your personal email</label>
    <div class="modal__input-row">
      <input type="email" class="modal__input" id="contact-email" placeholder="e.g. you@gmail.com" autocomplete="email">
      <button id="contact-email-btn" class="pill-btn pill-btn--dark">continue</button>
    </div>
    <div id="booking-error-msg" style="color: var(--color-marker-orange); font-size: 13px; margin-top: 6px; display: none;"></div>
    <div style="font-size: 12px; opacity: 0.6; margin-top: 8px;">
      Not your university address — those filter our mail, so codes and invites often never arrive. Use Gmail, Outlook, or whatever you actually read.
    </div>
  `;
}

/** Wires the contact-address step and opens the session on submit. */
function wireContactEmailStep({ ticket, onVerified }) {
  const btn = document.getElementById('contact-email-btn');
  const input = document.getElementById('contact-email');
  const errorEl = document.getElementById('booking-error-msg');
  if (!btn || !input) return;

  const submit = async () => {
    const email = input.value.trim().toLowerCase();
    const fail = (message) => {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerText = message;
      }
    };

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return fail('Please enter a valid email address.');
    }

    // The server refuses these too, before consuming the ticket, so a student
    // who types their university address can simply retype without verifying
    // again. Catching it here explains it the moment they typed it.
    //
    // This is the address every sign-in code and invite goes to, and .ac.uk
    // mail is precisely what does not arrive — accepting one would hand them
    // an account whose codes vanish, which is the original failure wearing a
    // different hat and far harder to diagnose once they are registered.
    if (email.endsWith('.ac.uk')) {
      return fail('Please use a personal email — university addresses filter our mail, so codes and invites often never arrive.');
    }

    btn.disabled = true;
    btn.innerText = 'saving…';
    try {
      await completeUniversitySignIn(ticket, email);
      await refreshEntitlements();
      updateNavbarMentorStatus();
      showToast('Verified — you are all set.');
      if (typeof onVerified === 'function') onVerified();
    } catch (err) {
      btn.disabled = false;
      btn.innerText = 'continue';
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerText = err.message;
      }
    }
  };

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  input.focus();
}

// ─── Email verification & session ─────
//
// Verifying an .ac.uk address opens a server session. That session is what
// authorises booking, claiming freabies, buying playbooks and downloading —
// the browser no longer decides any of it for itself.

function getSessionToken() {
  return getSession()?.sessionToken || null;
}

function verifiedEmail() {
  return getSession()?.email || null;
}

function isVerified() {
  return Boolean(getSessionToken());
}
window.isVerified = isVerified;

/**
 * Ensures there is a live verified session, prompting for a code if not, then
 * runs `onVerified`. Every gated action funnels through here.
 */
async function requireVerifiedSession({ email, universityName, actionName, onVerified }) {
  const wanted = (email || '').trim().toLowerCase();
  const current = (verifiedEmail() || '').trim().toLowerCase();

  // An existing session is only good enough if it belongs to the address this
  // action is for. The server binds a mentor profile to the session email, so
  // someone signed in as one address and filling the form with another would
  // have had the profile created against the wrong one — or, for an admin on a
  // non-.ac.uk address, rejected with an error naming a rule they had followed.
  if (isVerified() && (!wanted || wanted === current)) {
    if (typeof onVerified === 'function') onVerified();
    return;
  }

  return openVerificationModal({ email, universityName, actionName, onVerified });
}
window.requireVerifiedSession = requireVerifiedSession;

async function openVerificationModal({ email, universityName, actionName, onVerified }) {
  const modal = document.getElementById('modal-content');
  if (!modal) return;

  window.__currentOnVerified = onVerified;
  window.__verifyUniversity = universityName || '';
  window.__verifyAction = actionName || 'continue';

  // No email supplied by the caller: ask for one first.
  if (!email) {
    renderVerificationEmailStep(actionName);
    return;
  }
  await dispatchVerificationCode(email, universityName, actionName);
}
window.openVerificationModal = openVerificationModal;

function verificationShell(inner) {
  return `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <div class="verification-modal" style="padding: 24px 20px; text-align: center; max-width: 460px; margin: 0 auto;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #eff6ff; border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #2563eb;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      </div>
      ${inner}
    </div>
  `;
}

/**
 * The shared gate for every student-only action — starring, claiming a
 * resource, downloading, reporting, applying to mentor.
 *
 * Same university sign-in as the booking gate, for the same reason: the
 * emailed code was being filtered away before students ever saw it, and the
 * university vouching for them directly is both faster and a stronger claim.
 */
function renderVerificationEmailStep(actionName) {
  const modal = document.getElementById('modal-content');
  if (!modal) return;

  const finishIntent = () => {
    const fn = window.__currentOnVerified;
    window.__currentOnVerified = null;
    if (typeof fn === 'function') fn();
    else { closeModal(); renderPage(); }
  };

  modal.innerHTML = verificationShell(`
    <h2 style="font-size: 24px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">sign in to frea</h2>
    <p style="font-size: 14px; opacity: 0.8; line-height: 1.5; margin-bottom: 18px;">
      frea is free for verified UK students. Sign in to
      ${escapeHtml(actionName || 'continue')}.
    </p>
    <div id="verify-gate"></div>
  `);

  openOverlay();

  renderAuthFlow({
    host: document.getElementById('verify-gate'),
    actionName,
    onSignedIn: finishIntent
  });
}

async function submitVerificationEmail() {
  const input = document.getElementById('verify-email-input');
  const errorEl = document.getElementById('verify-email-error');
  const btn = document.getElementById('verify-email-btn');
  const email = input ? input.value.trim().toLowerCase() : '';

  // Shape only. Students need .ac.uk, administrators do not, and the server
  // holds that rule (ADMIN_EMAILS). Enforcing it here as well meant an admin
  // address was rejected in the browser and the request was never sent.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please enter a valid email address.';
    }
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<span>sending...</span>'; }
  await dispatchVerificationCode(email, getUniversityFromEmail(email), window.__verifyAction);
}
window.submitVerificationEmail = submitVerificationEmail;

async function dispatchVerificationCode(email, universityName, actionName) {
  const modal = document.getElementById('modal-content');
  if (!modal) return;

  modal.innerHTML = verificationShell(`
    <h2 style="font-size: 22px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">sending your code…</h2>
    <p style="font-size: 14px; opacity: 0.7;">to ${escapeHtml(email)}</p>
  `);
  openOverlay();

  let sendResult = null;
  try {
    sendResult = await sendEmailVerification(email, universityName || getUniversityFromEmail(email));
  } catch (err) {
    modal.innerHTML = verificationShell(`
      <h2 style="font-size: 22px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 8px;">couldn't send your code</h2>
      <p style="font-size: 14px; opacity: 0.8; line-height: 1.5; margin-bottom: 18px;">${escapeHtml(err.message)}</p>
      <button type="button" class="pill-btn pill-btn--subtle" onclick="window.openVerificationModal({ email: '' })">try a different email</button>
    `);
    return;
  }

  renderVerificationCodeStep(email, universityName, actionName, sendResult?.previewUrl);
}

function renderVerificationCodeStep(email, universityName, actionName, previewUrl) {
  const modal = document.getElementById('modal-content');
  if (!modal) return;

  modal.innerHTML = verificationShell(`
    <h2 style="font-size: 24px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">check your inbox</h2>
    <p style="font-size: 14px; opacity: 0.8; line-height: 1.5; margin-bottom: 20px;">
      We've sent a 6-digit code to <strong>${escapeHtml(email)}</strong>. Enter it below to
      ${escapeHtml(actionName || 'continue')}.
    </p>

    <div style="margin-bottom: 20px;">
      <input type="text" id="verification-otp-input" maxlength="6" inputmode="numeric" placeholder="• • • • • •" autocomplete="one-time-code" style="letter-spacing: 12px; font-size: 26px; font-weight: 800; font-family: monospace; text-align: center; width: 240px; padding: 10px 14px; border: 2px solid var(--color-charcoal); border-radius: 12px; background: #fff; outline: none;">
      <div id="verification-otp-error" style="color: #ef4444; font-size: 13px; font-weight: 600; margin-top: 8px; display: none;"></div>
    </div>

    ${previewUrl ? `
      <div style="background: #f0fdf4; border: 1.5px dashed #16a34a; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12.5px; color: #15803d; line-height: 1.5;">
        Dev mode — no SMTP configured, so this went to a test inbox.
        <a href="${escapeHtml(previewUrl)}" target="_blank" rel="noopener noreferrer" style="color: #15803d; font-weight: 700; text-decoration: underline;">Open it to read your code ↗</a>
      </div>` : ''}

    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button type="button" id="verify-otp-btn" class="pill-btn pill-btn--animated" style="width: 100%; padding: 12px;" onclick="window.submitVerificationCode(${jsArg(email)})">
        <span class="pill-btn__inner" style="justify-content: center;">
          <span>verify &amp; proceed</span>
          <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
        </span>
      </button>
      <div style="display: flex; justify-content: center; gap: 14px; margin-top: 6px; font-size: 13px;">
        <button type="button" style="background: none; border: none; color: var(--color-marker-orange); font-weight: 700; cursor: pointer; text-decoration: underline;" onclick="window.resendVerificationCode(${jsArg(email)}, ${jsArg(universityName || '')})">Resend code</button>
        <button type="button" style="background: none; border: none; opacity: 0.6; cursor: pointer;" onclick="closeModal()">Cancel</button>
      </div>

      <!-- Some universities hold mail from young domains in a quarantine the
           student cannot see, so "resend" achieves nothing and they are stuck
           with no way forward. This is the way forward: replying from the
           address itself proves control of it just as well as a code does. -->
      <details style="margin-top: 14px; text-align: left; font-size: 12.5px; line-height: 1.55;">
        <summary style="cursor: pointer; color: var(--color-marker-orange); font-weight: 700; text-align: center; list-style: none;">Didn't get the code?</summary>
        <div style="margin-top: 10px; padding: 12px 14px; background: #f8fafc; border: 1.5px solid rgba(23,23,23,0.12); border-radius: 10px; opacity: 0.85;">
          <p style="margin: 0 0 8px;">Try these first:</p>
          <ul style="margin: 0 0 10px; padding-left: 18px;">
            <li>Check your junk or spam folder.</li>
            <li>Give it two or three minutes — some universities hold new senders briefly.</li>
            <li>Make sure the address is right, then press <strong>Resend code</strong>.</li>
          </ul>
          <p style="margin: 0;">
            Still nothing? A few universities filter mail from new domains before it
            ever reaches you. Email
            <a href="mailto:hello@joinfrea.com?subject=Verify%20my%20student%20email" style="color: var(--color-marker-orange); font-weight: 700;">hello@joinfrea.com</a>
            <strong>from your university address</strong> and we'll verify you by hand —
            sending from it proves it's yours just as well as a code does.
          </p>
        </div>
      </details>
    </div>
  `);

  openOverlay();

  const otpInput = document.getElementById('verification-otp-input');
  if (otpInput) {
    otpInput.focus();
    otpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') window.submitVerificationCode(email);
    });
  }
}

async function submitVerificationCode(email) {
  const input = document.getElementById('verification-otp-input');
  const errorEl = document.getElementById('verification-otp-error');
  const btn = document.getElementById('verify-otp-btn');
  const code = input ? input.value.trim() : '';

  if (!code || code.length < 6) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please enter the 6-digit verification code.';
    }
    return;
  }

  if (btn) { btn.disabled = true; btn.innerText = 'verifying...'; }

  try {
    await verifyEmailCode(email, code);
    await refreshEntitlements();
    updateNavbarMentorStatus();
    showToast('Email verified.');

    if (typeof window.__currentOnVerified === 'function') {
      const modal = document.getElementById('modal-content');
      if (modal) {
        modal.innerHTML = `
          <div style="padding: 48px 24px; text-align: center;">
            <div style="width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top: 3px solid var(--color-marker-orange); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto;"></div>
            <h3 style="font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--color-charcoal); margin-bottom: 6px;">verified — one moment…</h3>
          </div>
        `;
      }
      const fn = window.__currentOnVerified;
      window.__currentOnVerified = null;
      fn();
    } else {
      closeModal();
      renderPage();
    }
  } catch (err) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = err.message || 'Verification failed. Please try again.';
    }
    if (btn) { btn.disabled = false; btn.innerText = 'verify & proceed'; }
  }
}
window.submitVerificationCode = submitVerificationCode;

async function resendVerificationCode(email, uni) {
  try {
    const res = await sendEmailVerification(email, uni);
    showToast(`New code sent to ${email}`);
    if (res.previewUrl) window.open(res.previewUrl, '_blank', 'noopener');
  } catch (e) {
    showToast(`Could not resend code: ${e.message}`);
  }
}
window.resendVerificationCode = resendVerificationCode;

/** Pulls the server's view of what this student owns into the render cache. */
async function refreshEntitlements() {
  if (!isVerified()) {
    setUnlockedDocIds([]);
    return;
  }
  const me = await fetchMe();
  setUnlockedDocIds(me?.entitlements || []);
}
window.refreshEntitlements = refreshEntitlements;

function openOverlay() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ─── Calendar integration ─────
//
// The server computes the event times from the booked slot and hands back
// ready-made Google/Outlook links, so these can never drift from the real
// booking the way locally-computed "now + 24h" times did.

function addBookingToCalendar(provider) {
  const links = window.__lastBookingCalendarLinks;
  if (!links || !links[provider]) {
    showToast('Calendar link unavailable — please use the .ics download.');
    return;
  }
  trackEvent('calendar_link_opened', { provider });
  window.open(links[provider], '_blank', 'noopener');
}
window.addBookingToCalendar = addBookingToCalendar;

/** Downloads the authoritative .ics generated by the server. */
async function downloadBookingInvite(bookingId) {
  try {
    await downloadBookingIcs(bookingId, `frea-session-${bookingId}`);
    showToast('Calendar invite downloaded.');
    trackEvent('ics_downloaded', { bookingId });
  } catch (err) {
    showToast(`Could not download the invite: ${err.message}`);
  }
}
window.downloadBookingInvite = downloadBookingInvite;

// ─── Mentor Application Submission Flow ─────

async function handleBecomeMentorSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('bm-name')?.value.trim();
  const uni = document.getElementById('bm-uni')?.value;
  const major = document.getElementById('bm-major')?.value.trim();
  const year = document.getElementById('bm-year')?.value;
  const email = document.getElementById('bm-email')?.value.trim().toLowerCase();
  const linkedin = document.getElementById('bm-linkedin')?.value.trim() || '';
  // LinkedIn plus however many extra links the mentor added.
  const links = [
    ...(linkedin ? [{ label: 'LinkedIn', url: linkedin }] : []),
    ...(signupLinksData || []).filter(l => l && l.url && l.url.trim())
  ];
  // The pitch video is uploaded through its own endpoint and attached there;
  // there is no URL field to read any more.
  const photoUrl = document.getElementById('bm-photo-data')?.value.trim() || '';
  const avatarId = parseInt(document.getElementById('bm-selected-avatar-id')?.value) || 1;
  const topTip = document.getElementById('bm-toptip')?.value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  clearFormError('bm-form-error');

  // Shape only. The university proved who this is before the form opened;
  // this address is just where booking notices go, and requiring .ac.uk
  // would send them straight back into the filtering that made mail
  // unusable in the first place.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    showFormError('bm-form-error', 'Please enter a valid email address we can send booking notices to.', 'bm-email');
    document.getElementById('bm-email')?.focus();
    return;
  }

  // Booking notices have to reach a mentor, and .ac.uk mail is what does
  // not arrive — a mentor who never sees a booking is worse than a student
  // who cannot make one.
  if (email.endsWith('.ac.uk')) {
    showFormError('bm-form-error', 'Please use a personal email — university addresses filter our mail, so booking notices often never arrive.', 'bm-email');
    document.getElementById('bm-email')?.focus();
    return;
  }

  // Top 3 achievements from the 3 text inputs
  const a1 = document.getElementById('bm-achieve-1')?.value.trim();
  const a2 = document.getElementById('bm-achieve-2')?.value.trim();
  const a3 = document.getElementById('bm-achieve-3')?.value.trim();
  const achievements = [a1, a2, a3].filter(Boolean);

  if (achievements.length === 0) {
    showFormError('bm-form-error', 'Add at least one achievement — an offer, internship, award or your degree classification.', 'bm-achieve-1');
    document.getElementById('bm-achieve-1')?.focus();
    return;
  }

  // Optional Doc info
  const docTitle = document.getElementById('bm-doc-title')?.value.trim();
  const docType = document.getElementById('bm-doc-type')?.value || 'free';
  const docCategory = document.getElementById('bm-doc-category')?.value || 'Tech & Coding';
  const docPrice = docType === 'paid' ? parseFloat(document.getElementById('bm-doc-price')?.value) || 3.99 : 0;
  const docDesc = document.getElementById('bm-doc-desc')?.value.trim();
  const docFileName = document.getElementById('bm-doc-uploaded-file')?.value.trim();
  const docFormat = document.getElementById('bm-doc-uploaded-format')?.value.trim() || 'PDF';

  const colorInput = document.querySelector('input[name="postit-color"]:checked');
  const topTipColor = colorInput ? colorInput.value : 'yellow';

  const proceedSubmission = async () => {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'submitting...';
    }

    try {
      const applicationData = {
        name,
        university: uni,
        degree: major,
        year,
        email,
        linkedin,
        photoUrl,
        avatarId,
        achievements,
        topTip,
        topTipColor,
        links
      };

      // Creating the mentor also opens their mentor session, which is what
      // authorises the resource publish immediately afterwards.
      await submitMentorApplication(applicationData);

      if (docTitle && docFileName) {
        try {
          await createResource({
            title: docTitle,
            subtitle: docDesc || `Shared by ${name} (${uni})`,
            type: docType,
            price: docPrice,
            category: docCategory,
            fileName: docFileName,
            format: docFormat
          });
        } catch (e) {
          console.warn('Could not publish the attached resource:', e);
          showToast(`Your profile is live, but the attached document could not be published: ${e.message}`);
        }
      }

      trackEvent('mentor_application_submitted', {
        name,
        university: uni,
        major,
        year,
        emailDomain: email.split('@')[1]
      });

      // Auto-login newly registered mentor and sync
      const registeredMentor = (result && (result.mentor || result.data)) || {
        id: Date.now(),
        name,
        email,
        university: uni,
        major,
        year,
        topTip,
        topTipColor,
        achievements,
        avatarId,
        weeklySchedule: { 1: ["10:00 AM", "2:00 PM"], 3: ["11:00 AM", "3:30 PM"], 5: ["1:00 PM", "4:30 PM"] },
        rating: 5.0,
        callsCompleted: 0
      };

      const session = {
        mentorId: registeredMentor.id,
        email: email,
        name: name,
        university: uni,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('frea_mentor_session', JSON.stringify(session));

      // Add to live mentors immediately
      const existingIdx = MENTORS.findIndex(m => m.id === registeredMentor.id);
      if (existingIdx >= 0) {
        MENTORS[existingIdx] = { ...MENTORS[existingIdx], ...registeredMentor };
      } else {
        MENTORS.unshift(registeredMentor);
      }

      updateNavbarMentorStatus();

      // Show confirmation modal with instant live activation (No interview)
      const modal = document.getElementById('modal-content');
      modal.innerHTML = `
        <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
        <div class="modal--confirmation" style="padding: 32px 24px; text-align: center;">
          <div class="modal__celebration" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${ICONS.tickCircle} <span style="font-weight: 800; font-size: 22px;">You're Live on frea!</span>
          </div>
          <h2 class="modal__title" style="font-size: 28px; margin: 8px 0 10px 0;">profile activated!</h2>
          <p class="modal__body" style="font-size: 15px; max-width: 480px; margin: 0 auto 16px auto; line-height: 1.5;">
            Welcome aboard, <strong>${name}</strong>! Your official <strong>${email}</strong> status is verified.
          </p>

          <div style="background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 12px; padding: 16px 20px; margin: 18px 0; text-align: left;">
            <div style="font-weight: 700; color: #15803d; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; font-size: 14.5px;">
              <span>${ICONS.lightning}</span> Instant Onboarding: Zero Interviews Required
            </div>
            <div style="font-size: 13.5px; color: #166534; line-height: 1.55;">
              Your senior mentor profile, achievements, and calendar are <strong>live right now</strong> in the directory. Younger UK students can book 20-min 1-on-1 mentoring sessions directly on your calendar, and your study resources are listed in the catalogue!
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 24px;">
            <button class="pill-btn pill-btn--animated" onclick="closeModal(); window.navigateTo('/mentor-dashboard')">
              <span class="pill-btn__inner">
                <span>open my mentor dashboard</span>
                <span class="pill-btn__arrow">→</span>
              </span>
            </button>
            <button class="pill-btn pill-btn--subtle" onclick="closeModal(); window.navigateTo('/mentor/' + registeredMentor.id)">
              <span>view my live profile</span>
            </button>
          </div>
        </div>
      `;

      const overlay = document.getElementById('modal-overlay');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      showFormError('bm-form-error', err.message || 'Could not submit your application. Please check your connection and try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'submit mentor application';
      }
    }
  };

  // Verification can interrupt this flow, so clear any error from a previous
  // attempt before it proceeds — otherwise it stays on screen behind the
  // success state.
  clearFormError('bm-form-error');

  // The mentor profile is created against the verified session email, so
  // verification has to happen first.
  requireVerifiedSession({
    email,
    universityName: uni,
    actionName: 'publish your mentor profile',
    onVerified: proceedSubmission
  });
}
window.handleBecomeMentorSubmit = handleBecomeMentorSubmit;


// ─── Filter Profile Docs (Freabies vs Paid) ─────

function filterProfileDocs(filterType, mentorId) {
  const mentor = MENTORS.find(m => m.id === parseInt(mentorId));
  if (!mentor || !mentor.docs) return;

  const container = document.getElementById('profile-doc-filters');
  if (container) {
    container.querySelectorAll('.doc-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
    });
  }

  let filtered = mentor.docs;
  if (filterType === 'free') {
    filtered = mentor.docs.filter(d => d.type === 'free');
  } else if (filterType === 'paid') {
    filtered = mentor.docs.filter(d => d.type === 'paid');
  }

  const grid = document.getElementById('profile-docs-grid');
  if (grid) {
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="docs-empty-state" style="grid-column: 1 / -1; padding: 28px; text-align: center;">
          <p style="font-size: 15px; opacity: 0.75;">No ${filterType === 'free' ? 'freabies' : 'paid playbooks'} currently listed for this mentor.</p>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(doc => renderDocCard(doc, mentor, false)).join('');
    }
  }

  trackEvent('profile_docs_filtered', { mentorId, filterType, count: filtered.length });
}
window.filterProfileDocs = filterProfileDocs;

// ─── PAGE: Resources & Freabies Hub ─────

// Student Campus & Subject Preferences
function getStudentPrefs() {
  try {
    const raw = localStorage.getItem('frea_student_prefs');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
window.getStudentPrefs = getStudentPrefs;

function setStudentPrefs(prefs) {
  try {
    localStorage.setItem('frea_student_prefs', JSON.stringify(prefs));
  } catch (e) {
    console.warn(e);
  }
}
window.setStudentPrefs = setStudentPrefs;

let activeResourcesUni = 'all';
let activeResourcesType = 'all'; // 'all' | 'free' | 'paid'
let activeResourcesSubject = 'all';
let activeResourcesSearch = '';

// Auto-initialize university filter from student preference if present
(function initResourcesUni() {
  const prefs = getStudentPrefs();
  if (prefs && prefs.university && prefs.university !== 'All UK Universities') {
    activeResourcesUni = prefs.university;
  }
})();

function getFilteredDocs() {
  const allDocs = getAllDocs();
  return allDocs.filter(doc => {
    // University filter (Tailored to student's campus)
    if (activeResourcesUni !== 'all') {
      const targetUni = activeResourcesUni.toLowerCase();
      const docUni = (doc.mentorUniversity || '').toLowerCase();
      if (!docUni.includes(targetUni) && !targetUni.includes(docUni)) return false;
    }

    // Type filter (Hick's Law: 3 distinct choices)
    if (activeResourcesType === 'free' && doc.type !== 'free') return false;
    if (activeResourcesType === 'paid' && doc.type !== 'paid') return false;

    // Subject filter
    if (activeResourcesSubject !== 'all') {
      const targetSubj = activeResourcesSubject.toLowerCase();
      const docCategory = (doc.category || '').toLowerCase();
      const mentorMajor = (doc.mentorMajor || '').toLowerCase();
      const mappedCategory = (SUBJECT_MAP[doc.mentorMajor] || '').toLowerCase();

      const matchesCategory = docCategory.includes(targetSubj) || targetSubj.includes(docCategory);
      const matchesMapped = mappedCategory.includes(targetSubj) || targetSubj.includes(mappedCategory);
      const matchesMajor = mentorMajor.includes(targetSubj) || targetSubj.includes(mentorMajor);
      if (!matchesCategory && !matchesMapped && !matchesMajor) return false;
    }

    // Search query filter
    if (activeResourcesSearch) {
      const q = activeResourcesSearch.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchSub = doc.subtitle.toLowerCase().includes(q);
      const matchAuthor = doc.mentorName.toLowerCase().includes(q);
      const matchUni = doc.mentorUniversity.toLowerCase().includes(q);
      const matchCategory = (doc.category || '').toLowerCase().includes(q);
      const matchBullets = (doc.previewBullets || []).some(b => b.toLowerCase().includes(q));
      if (!matchTitle && !matchSub && !matchAuthor && !matchUni && !matchCategory && !matchBullets) {
        return false;
      }
    }

    return true;
  });
}

function getFilteredDocsHtml() {
  const filtered = getFilteredDocs();
  if (filtered.length === 0) {
    const prefs = getStudentPrefs();
    return `
      <div class="docs-empty-state" style="grid-column: 1 / -1; padding: 48px 24px; text-align: center;">
        <span style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; color: var(--color-charcoal); opacity: 0.7;">${ICONS.searchNormal}</span>
        <h3 style="font-family: var(--font-display); font-size: 20px; color: var(--color-charcoal); margin-bottom: 6px;">no resources found for this filter</h3>
        <p style="font-size: 14.5px; opacity: 0.7; margin-bottom: 18px; max-width: 480px; margin-left: auto; margin-right: auto;">
          ${activeResourcesUni !== 'all' ? `There are currently no notes specifically for <strong>${activeResourcesUni}</strong> matching this subject. Explore notes from other Russell Group universities or request notes!` : 'Try clearing your search query or switching filters.'}
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          ${activeResourcesUni !== 'all' ? `<button class="pill-btn pill-btn--small" onclick="window.setResourcesUniFilter('all')">explore all UK universities</button>` : ''}
          <button class="pill-btn pill-btn--small pill-btn--subtle" onclick="window.openSuggestionModal()">request notes for your module</button>
          <button class="pill-btn pill-btn--small" onclick="window.resetResourcesFilters()">reset all filters</button>
        </div>
      </div>
    `;
  }
  return filtered.map(doc => renderDocCard(doc, null, true)).join('');
}

function renderResourcesHub() {
  trackEvent('resources_hub_view');
  const allDocs = getAllDocs();
  const freeCount = allDocs.filter(d => d.type === 'free').length;
  const paidCount = allDocs.filter(d => d.type === 'paid').length;
  const filtered = getFilteredDocs();
  const prefs = getStudentPrefs();

  return `
    <div class="page-view resources-page">
      <!-- Resources Hero Banner -->
      <section class="resources-hero">
        <div class="resources-hero__tape"></div>
        <div class="page-container" style="text-align: center; position: relative;">
          <div class="hero__badge" style="margin-bottom: 12px; display: inline-flex;">
            <span style="display: inline-flex; align-items: center; gap: 6px;">${ICONS.book} student knowledge marketplace</span>
            <span class="hero__badge-dot"></span>
            <span style="font-weight: 700; color: var(--color-marker-orange);">freabies + playbooks</span>
          </div>
          <h1 class="resources-hero__title">
            the UK student doc vault <span class="handwritten" style="color: var(--color-marker-orange); font-size: 0.9em;">& freabies</span>
          </h1>
          <p class="resources-hero__lead">
            battle-tested lecture summaries, ATS-crushing CV templates, interview cheat sheets, and exam bibles from senior high-achievers across the Russell Group.
          </p>

          <!-- Campus Personalisation Strip (Clean & Uncluttered) -->
          <div class="campus-tailored-strip">
            ${prefs && prefs.university && prefs.university !== 'All UK Universities' ? `
              <div class="campus-tailored-pill">
                <span>📍 Tailored for: <strong>${escapeHtml(prefs.university)}</strong> ${prefs.subject && prefs.subject !== 'all' ? `· ${prefs.subject}` : ''}</span>
                <button type="button" class="campus-switch-btn" onclick="window.openPreferencesModal(true)">change</button>
              </div>
            ` : `
              <button type="button" class="campus-tailored-pill" onclick="window.openPreferencesModal(true)" style="cursor: pointer;" title="Filter resources to your university">
                <span>${ICONS.book}</span>
                <span>personalise for your campus: <strong>set university & course</strong></span>
                <span style="color: var(--color-marker-orange); font-weight: 700;">→</span>
              </button>
            `}
          </div>

          <!-- Search Bar (Own Row) -->
          <div class="resources-search-row">
            <div class="resources-search-wrap">
              <span class="resources-search-icon">${ICONS.searchNormal}</span>
              <input 
                type="text" 
                id="resources-search-input" 
                class="resources-search-input" 
                placeholder="Search by module (e.g. COMP26120, Concurrency, Tort), keyword..."
                value="${activeResourcesSearch}"
                oninput="window.handleResourcesSearch(this.value)"
              >
              ${activeResourcesSearch ? `<button class="resources-search-clear" onclick="window.clearResourcesSearch()">${ICONS.close}</button>` : ''}
            </div>
          </div>

          <!-- Filter Controls: University Dropdown -->
          <div class="resources-filter-row">
            <select class="resources-uni-select" id="resources-uni-select" onchange="window.setResourcesUniFilter(this.value)">
              <option value="all" ${activeResourcesUni === 'all' ? 'selected' : ''}>All UK Universities</option>
              ${prefs && prefs.university && prefs.university !== 'All UK Universities' ? `
                <option value="${escapeHtml(prefs.university)}" ${activeResourcesUni === prefs.university ? 'selected' : ''}>📍 ${prefs.university} (My Campus)</option>
              ` : ''}
              ${UK_UNIVERSITIES.filter(u => u !== 'All UK Universities' && (!prefs || u !== prefs.university)).map(u => `
                <option value="${u}" ${activeResourcesUni === u ? 'selected' : ''}>${u}</option>
              `).join('')}
            </select>
          </div>

          <!-- Quick Filters: Type (Freabies vs Paid) and Subjects -->
          <div class="resources-filter-container">
            <!-- Type Pill Selector (Hick's Law: 3 primary options) -->
            <div class="resources-type-selector">
              <button class="resources-type-btn ${activeResourcesType === 'all' ? 'active' : ''}" onclick="window.setResourcesTypeFilter('all')">
                <span style="display: inline-flex; align-items: center; gap: 6px;">${ICONS.category} all resources (${allDocs.length})</span>
              </button>
              <button class="resources-type-btn ${activeResourcesType === 'free' ? 'active' : ''}" onclick="window.setResourcesTypeFilter('free')">
                <span style="display: inline-flex; align-items: center; gap: 6px;">${ICONS.gift} 100% freabies (${freeCount})</span>
              </button>
              <button class="resources-type-btn ${activeResourcesType === 'paid' ? 'active' : ''}" onclick="window.setResourcesTypeFilter('paid')">
                <span style="display: inline-flex; align-items: center; gap: 6px;">${ICONS.flash} student playbooks (${paidCount})</span>
              </button>
            </div>

            <!-- Subject Pills -->
            <div class="resources-subject-pills">
              ${SUBJECTS.map(subj => `
                <button class="filter-pill filter-pill--compact ${activeResourcesSubject === subj ? 'active' : ''}" onclick="window.setResourcesSubjectFilter('${subj}')">
                  ${subj === 'all' ? 'all subjects' : subj}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- Docs Grid Container -->
      <section class="page-container" style="padding-top: 36px; padding-bottom: 60px;">
        <div class="resources-count-bar">
          <span id="resources-count-badge" class="resources-count-badge">showing ${filtered.length} resource${filtered.length === 1 ? '' : 's'}</span>
          <span style="font-size: 13.5px; opacity: 0.7;">download instantly · lifetime access saved in browser</span>
        </div>

        <div class="docs-grid" id="resources-docs-grid">
          ${getFilteredDocsHtml()}
        </div>

        <!-- Creator Monetisation CTA Callout -->
        <div class="resources-creator-banner">
          <div class="resources-creator-banner__tape"></div>
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
            <div style="max-width: 620px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span>${ICONS.lampCharge}</span>
                <h3 style="font-family: var(--font-display); font-size: 22px; margin: 0; color: var(--color-charcoal);">Got a 1st class exam bible or interview roadmap?</h3>
              </div>
              <p style="font-size: 15px; opacity: 0.85; margin: 0; line-height: 1.5;">
                Join frea as a senior mentor. Publish free freabies to build your personal brand or set student-friendly prices (£2.99–£5.99) to earn directly from your hard work. Zero commission, 100% impact.
              </p>
            </div>
            <button class="pill-btn pill-btn--animated" onclick="window.navigateTo('/become-a-mentor')">
              <span class="pill-btn__inner">
                <span>become a mentor & author</span>
                <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      ${renderFooter()}
    </div>
  `;
}
window.renderResourcesHub = renderResourcesHub;

function updateResourcesGrid() {
  const grid = document.getElementById('resources-docs-grid');
  const badge = document.getElementById('resources-count-badge');
  const filtered = getFilteredDocs();

  if (badge) {
    badge.innerText = `showing ${filtered.length} resource${filtered.length === 1 ? '' : 's'}`;
  }

  if (grid) {
    grid.innerHTML = getFilteredDocsHtml();
  }
}

function handleResourcesSearch(query) {
  activeResourcesSearch = query;
  updateResourcesGrid();
  trackEvent('resources_searched', { query: activeResourcesSearch });
}
window.handleResourcesSearch = handleResourcesSearch;

function clearResourcesSearch() {
  activeResourcesSearch = '';
  const input = document.getElementById('resources-search-input');
  if (input) input.value = '';
  updateResourcesGrid();
}
window.clearResourcesSearch = clearResourcesSearch;

function setResourcesUniFilter(uni) {
  activeResourcesUni = uni;
  const select = document.getElementById('resources-uni-select');
  if (select && select.value !== uni) {
    select.value = uni;
  }
  updateResourcesGrid();
  trackEvent('resources_uni_filtered', { university: uni });
}
window.setResourcesUniFilter = setResourcesUniFilter;

function toggleShowAllUnis() {
  setResourcesUniFilter('all');
}
window.toggleShowAllUnis = toggleShowAllUnis;

function setResourcesTypeFilter(type) {
  activeResourcesType = type;
  document.querySelectorAll('.resources-type-btn').forEach(btn => {
    const text = btn.innerText.toLowerCase();
    const isTarget = (type === 'all' && text.includes('all')) ||
      (type === 'free' && text.includes('freabies')) ||
      (type === 'paid' && text.includes('playbooks'));
    btn.classList.toggle('active', isTarget);
  });
  updateResourcesGrid();
  trackEvent('resources_type_filtered', { type });
}
window.setResourcesTypeFilter = setResourcesTypeFilter;

function setResourcesSubjectFilter(subjectId) {
  activeResourcesSubject = subjectId;
  const pillsWrap = document.querySelector('.resources-subject-pills');
  if (pillsWrap) {
    pillsWrap.querySelectorAll('.filter-pill').forEach(btn => {
      const onClickStr = btn.getAttribute('onclick') || '';
      btn.classList.toggle('active', onClickStr.includes(`'${subjectId}'`));
    });
  }
  updateResourcesGrid();
  trackEvent('resources_subject_filtered', { subjectId });
}
window.setResourcesSubjectFilter = setResourcesSubjectFilter;

function resetResourcesFilters() {
  activeResourcesType = 'all';
  activeResourcesSubject = 'all';
  activeResourcesUni = 'all';
  activeResourcesSearch = '';
  const input = document.getElementById('resources-search-input');
  if (input) input.value = '';
  const select = document.getElementById('resources-uni-select');
  if (select) select.value = 'all';
  document.querySelectorAll('.resources-type-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === 0);
  });
  const pillsWrap = document.querySelector('.resources-subject-pills');
  if (pillsWrap) {
    pillsWrap.querySelectorAll('.filter-pill').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === 0);
    });
  }
  updateResourcesGrid();
}
window.resetResourcesFilters = resetResourcesFilters;

// ─── Campus Preferences & Onboarding Modal ─────

function openPreferencesModal(isManual = true) {
  const current = getStudentPrefs() || { university: 'University of Manchester', subject: 'all', course: '' };

  const modal = document.getElementById('modal-content');
  if (!modal) return;

  const subjectOptions = [
    'Tech',
    'Economics & Finance',
    'Engineering',
    'Medicine & Life Sciences',
    'Law',
    'Math',
    'Humanities & Politics',
    'Languages & Arts'
  ];

  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <div class="doc-modal" style="max-width: 520px; padding: 6px 4px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; background: rgba(255, 111, 30, 0.08); border: 1.5px dashed rgba(255, 111, 30, 0.35); border-radius: 999px; font-family: var(--font-handwritten); font-size: 19px; color: var(--color-marker-orange); margin-bottom: 10px;">
          ${ICONS.book} 1-time campus setup
        </div>
        <h2 style="font-family: var(--font-display); font-size: 26px; color: var(--color-charcoal); margin: 0 0 8px 0; line-height: 1.2;">
          what university & discipline are you in?
        </h2>
        <p style="font-size: 14px; opacity: 0.75; line-height: 1.5; margin: 0 auto; max-width: 440px;">
          we'll auto-tailor your notes, exam bibles, and verified senior mentors so you only see guidance relevant to your course.
        </p>
      </div>

      <form id="preferences-form" onsubmit="window.saveStudentPreferences(event)">
        <div class="mentor-form-group" style="margin-bottom: 16px;">
          <label class="mentor-form-label" style="font-size: 13.5px; font-weight: 700;">1. Which UK university do you attend?</label>
          <select id="pref-university" class="mentor-form-select" style="padding: 11px 14px; font-size: 14px;">
            ${UK_UNIVERSITIES.filter(u => u !== 'All UK Universities').map(u => `
              <option value="${u}" ${current.university === u ? 'selected' : ''}>${u}</option>
            `).join('')}
            <option value="All UK Universities" ${current.university === 'All UK Universities' ? 'selected' : ''}>Explore All UK Universities</option>
          </select>
        </div>

        <div class="mentor-form-group" style="margin-bottom: 16px;">
          <label class="mentor-form-label" style="font-size: 13.5px; font-weight: 700;">2. What field or broad discipline?</label>
          <div class="pref-subject-grid">
            ${subjectOptions.map(subj => `
              <div class="pref-subject-card ${(current.subject === subj || (current.subject === 'all' && subj === 'Tech')) ? 'active' : ''}" onclick="window.selectPrefSubject(this, '${subj}')">
                <span>${subj}</span>
              </div>
            `).join('')}
          </div>
          <input type="hidden" id="pref-subject-input" value="${current.subject === 'all' ? 'Tech' : current.subject}">
        </div>

        <div class="mentor-form-group" style="margin-bottom: 22px;">
          <label class="mentor-form-label" style="font-size: 13.5px; font-weight: 700;">3. Degree or Course name <span style="font-weight: 400; opacity: 0.6;">(optional)</span></label>
          <input type="text" id="pref-course" class="mentor-form-input" placeholder="e.g. BSc Computer Science, LLB Law, MBChB Medicine" value="${current.course || ''}" style="padding: 10px 14px; font-size: 13.5px;">
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <button type="button" class="pill-btn pill-btn--subtle" onclick="window.skipStudentPreferences()" style="flex: 1; justify-content: center; height: 42px;">
            explore all unis
          </button>
          <button type="submit" class="pill-btn pill-btn--animated" style="flex: 1.4; justify-content: center; height: 42px;">
            <span class="pill-btn__inner" style="justify-content: center;">
              <span>save & tailor vault</span>
              <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
window.openPreferencesModal = openPreferencesModal;

function selectPrefSubject(card, subj) {
  document.querySelectorAll('.pref-subject-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  const input = document.getElementById('pref-subject-input');
  if (input) input.value = subj;
}
window.selectPrefSubject = selectPrefSubject;

function saveStudentPreferences(e) {
  e.preventDefault();
  const uni = document.getElementById('pref-university')?.value || 'University of Manchester';
  const subj = document.getElementById('pref-subject-input')?.value || 'Tech';
  const course = document.getElementById('pref-course')?.value.trim() || '';

  const prefs = { university: uni, subject: subj, course, completed: true };
  setStudentPrefs(prefs);
  closeModal();

  if (uni !== 'All UK Universities') {
    activeResourcesUni = uni;
    activeResourcesSubject = subj;
  } else {
    activeResourcesUni = 'all';
    activeResourcesSubject = 'all';
  }

  showToast(`✓ Campus set to ${uni} · Filtered to your course`);
  renderPage();
  trackEvent('student_preferences_saved', prefs);
}
window.saveStudentPreferences = saveStudentPreferences;

function skipStudentPreferences() {
  setStudentPrefs({ university: 'All UK Universities', subject: 'all', course: '', completed: true });
  closeModal();
  activeResourcesUni = 'all';
  activeResourcesSubject = 'all';
  renderPage();
}
window.skipStudentPreferences = skipStudentPreferences;

// ─── Suggestion & Request Modal ─────

function openSuggestionModal() {
  const prefs = getStudentPrefs();
  const defaultUni = prefs?.university && prefs.university !== 'All UK Universities' ? prefs.university : 'University of Manchester';
  const defaultCourse = prefs?.course || '';

  const modal = document.getElementById('modal-content');
  if (!modal) return;

  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <div class="doc-modal" style="max-width: 520px; padding: 6px 4px;">
      <div style="text-align: center; margin-bottom: 18px;">
        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; background: rgba(255, 111, 30, 0.08); border: 1.5px dashed rgba(255, 111, 30, 0.35); border-radius: 999px; font-family: var(--font-handwritten); font-size: 19px; color: var(--color-marker-orange); margin-bottom: 8px;">
          ${ICONS.lampCharge} have a suggestion?
        </div>
        <h2 style="font-family: var(--font-display); font-size: 26px; color: var(--color-charcoal); margin: 0 0 6px 0;">
          tell us what you want on frea
        </h2>
        <p style="font-size: 14px; opacity: 0.75; line-height: 1.5; margin: 0 auto; max-width: 440px;">
          request a specific course exam pack, request a mentor from your faculty, or suggest a new feature.
        </p>
      </div>

      <form id="suggestion-form" onsubmit="window.handleSuggestionSubmit(event)">
        <div class="mentor-form-group" style="margin-bottom: 14px;">
          <label class="mentor-form-label" style="font-size: 13px; font-weight: 700;">Suggestion Type</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="filter-pill active" onclick="window.selectSuggestionType(this, 'resource')">Request Resource / Notes</button>
            <button type="button" class="filter-pill" onclick="window.selectSuggestionType(this, 'mentor')">Request a Senior Mentor</button>
            <button type="button" class="filter-pill" onclick="window.selectSuggestionType(this, 'feature')">Feature Idea</button>
          </div>
          <input type="hidden" id="suggestion-type-input" value="resource">
        </div>

        <div class="mentor-form-group" style="margin-bottom: 14px;">
          <label class="mentor-form-label" style="font-size: 13px; font-weight: 700;">Your University</label>
          <select id="suggestion-uni-select" class="mentor-form-input" style="padding: 10px 14px; font-size: 13.5px; width: 100%; border-radius: 10px; border: 1.5px solid var(--color-charcoal); background: #ffffff; cursor: pointer;">
            ${UK_UNIVERSITIES.filter(u => u !== 'All UK Universities').map(u => `
              <option value="${u}" ${defaultUni === u ? 'selected' : ''}>${u}</option>
            `).join('')}
            <option value="Other UK University">Other UK University</option>
          </select>
        </div>

        <div class="mentor-form-group" style="margin-bottom: 14px;">
          <label class="mentor-form-label" style="font-size: 13px; font-weight: 700;">Your Course / Degree / Module</label>
          <input type="text" id="suggestion-course-input" class="mentor-form-input" required placeholder="e.g. BSc Computer Science (COMP26120), LLB Law, Medicine Y2" value="${escapeHtml(defaultCourse)}" style="padding: 10px 14px; font-size: 13.5px;">
        </div>

        <div class="mentor-form-group" style="margin-bottom: 14px;">
          <label class="mentor-form-label" style="font-size: 13px; font-weight: 700;">What would help you most?</label>
          <textarea id="suggestion-details-input" class="mentor-form-textarea" rows="3" required placeholder="e.g. 'We really need past exam solutions for 2nd year algorithms' or 'Would love mock technical interviews for quant trading'" style="padding: 10px 14px; font-size: 13.5px;"></textarea>
        </div>

        <div class="mentor-form-group" style="margin-bottom: 18px;">
          <label class="mentor-form-label" style="font-size: 13px; font-weight: 700;">Your .ac.uk Student Email <span style="font-weight: 400; opacity: 0.6;">(optional, to notify you when added)</span></label>
          <input type="email" id="suggestion-email-input" class="mentor-form-input" placeholder="e.g. yourname@university.ac.uk" style="padding: 10px 14px; font-size: 13.5px;">
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="pill-btn pill-btn--subtle" onclick="closeModal()">cancel</button>
          <button type="submit" class="pill-btn pill-btn--animated" style="padding: 11px 24px;">
            <span class="pill-btn__inner">
              <span>submit suggestion</span>
              <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
window.openSuggestionModal = openSuggestionModal;

function selectSuggestionType(btn, type) {
  btn.parentElement.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const input = document.getElementById('suggestion-type-input');
  if (input) input.value = type;
}
window.selectSuggestionType = selectSuggestionType;

/** Sends a student request to the server, where the team can actually read it. */
async function handleSuggestionSubmit(e) {
  e.preventDefault();
  const type = document.getElementById('suggestion-type-input')?.value || 'resource';
  const university = document.getElementById('suggestion-uni-select')?.value || '';
  const course = document.getElementById('suggestion-course-input')?.value || '';
  const text = document.getElementById('suggestion-details-input')?.value || '';
  const email = document.getElementById('suggestion-email-input')?.value || verifiedEmail() || '';

  const btn = e.target?.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.innerText = 'sending...'; }

  try {
    await submitSuggestion({ type, university, course, text, email });
    closeModal();
    showToast('Thank you — your suggestion is with the frea student team.');
    trackEvent('student_suggestion_submitted', { type, university, course });
  } catch (err) {
    if (btn) { btn.disabled = false; btn.innerText = 'send suggestion'; }
    showToast(err.message || 'Could not send that just now. Please try again.');
  }
}
window.handleSuggestionSubmit = handleSuggestionSubmit;

// ─── Toast Notification (Peak-End Rule & Doherty Feedback) ─────

/**
 * An inline, non-blocking form error.
 *
 * These were alert() calls, which halt the renderer until dismissed, look
 * nothing like the rest of the product, and say nothing about which field is
 * at fault. The message lands next to the submit button and the offending
 * input takes focus.
 */
function showFormError(containerId, message, focusId) {
  const el = document.getElementById(containerId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } else {
    showToast(message);   // no slot on this form; better than swallowing it
  }
  if (focusId) document.getElementById(focusId)?.focus();
}
window.showFormError = showFormError;

function clearFormError(containerId) {
  const el = document.getElementById(containerId);
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}
window.clearFormError = clearFormError;

/**
 * Star a mentor, or take the star back.
 *
 * A count of students who vouched for someone, not a score out of anything.
 * Verification is required so one person cannot inflate it, and the count is
 * re-read from the response rather than incremented locally.
 */
async function toggleMentorStar(mentorId) {
  const act = async () => {
    try {
      const res = await starMentor(mentorId);
      const countEl = document.getElementById('mentor-star-count');
      const btn = document.getElementById('mentor-star-btn');
      if (countEl) countEl.textContent = String(res.stars);
      if (btn) {
        btn.classList.toggle('mentor-star-btn--on', res.starred);
        btn.title = res.starred ? 'Remove your star' : 'Star this mentor';
      }
      showToast(res.starred ? 'Starred — thanks for vouching for them.' : 'Star removed.');
    } catch (err) {
      showToast(err.message || 'Could not star this mentor just now.');
    }
  };

  requireVerifiedSession({ email: null, actionName: 'star a mentor', onVerified: act });
}
window.toggleMentorStar = toggleMentorStar;

function showToast(message) {
  let toast = document.getElementById('frea-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'frea-toast';
    toast.className = 'frea-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div class="frea-toast__inner">
      <span>${escapeHtml(message)}</span>
      <button class="frea-toast__close" onclick="this.closest('.frea-toast').classList.remove('show')">${ICONS.close}</button>
    </div>
  `;
  toast.classList.add('show');
  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}
window.showToast = showToast;

// ─── Modals: Preview & Instant Checkout ─────

function openDocPreviewModal(docId) {
  const doc = getDocById(docId);
  if (!doc) return;

  const isUnlocked = isDocUnlocked(doc.id);
  const isPaid = doc.type === 'paid';

  trackEvent('doc_preview_opened', { docId: doc.id, title: doc.title, isPaid, isUnlocked });

  const modal = document.getElementById('modal-content');
  if (!modal) return;

  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <div class="doc-modal">
      <div class="doc-modal__header">
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
          ${isUnlocked ? `<span class="doc-badge doc-badge--unlocked">${ICONS.tickCircle} unlocked</span>` : (isPaid ? `<span class="doc-badge doc-badge--paid">${ICONS.lock} £${doc.price.toFixed(2)}</span>` : `<span class="doc-badge doc-badge--free">${ICONS.gift} freabie</span>`)}
          <span class="doc-format-badge">${escapeHtml(doc.format)} · ${escapeHtml(doc.pages)}</span>
          <span class="doc-category-badge">${escapeHtml(doc.category || 'Study Resource')}</span>
          <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; opacity: 0.7; margin-left: auto;">${ICONS.star} ${doc.rating.toFixed(1)} (${doc.downloads} downloads)</span>
        </div>
        <h2 class="doc-modal__title">${escapeHtml(doc.title)}</h2>
        <p class="doc-modal__subtitle">${escapeHtml(doc.subtitle)}</p>

        <div class="doc-modal__author-banner" onclick="closeModal(); window.navigateTo('/mentor/${doc.mentorId}')">
          <div class="doc-modal__avatar" style="flex-shrink: 0;">
            ${getMentorAvatar(doc.mentorId, 44)}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 15px; color: var(--color-charcoal); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span>${escapeHtml(doc.mentorName)}</span>
              <span class="hero__pass-verified" style="font-size: 11px; padding: 2px 6px;">verified senior</span>
            </div>
            <div style="font-size: 13px; opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(doc.mentorYear)} · ${escapeHtml(doc.mentorMajor)} · ${escapeHtml(doc.mentorUniversity)}</div>
          </div>
          <span class="doc-modal__author-link" style="flex-shrink: 0;">view mentor profile →</span>
        </div>
      </div>

      <div class="doc-modal__body">
        ${(doc.previewBullets || []).length ? `
        <h4 style="font-family: var(--font-display); font-size: 17px; margin-bottom: 10px; color: var(--color-charcoal);">What's inside this resource:</h4>` : ''}
        <div class="doc-modal__outline-list">
          ${(doc.previewBullets || []).map((bullet, idx) => `
            <div class="doc-modal__outline-item" style="display: flex; gap: 10px; align-items: baseline; margin-bottom: 8px;">
              <span style="font-family: var(--font-display); font-weight: 800; color: var(--color-marker-orange); font-size: 13px;">0${idx + 1}</span>
              <span style="font-size: 14px; color: var(--color-cocoa-ink); line-height: 1.5;">${bullet}</span>
            </div>
          `).join('')}
        </div>

        <div class="doc-modal__callout">
          <span>${ICONS.shieldTick}</span>
          <div>
            <strong>frea student guarantee:</strong> every freabie and playbook is written by a verified senior
            student. You pay the listed price and nothing on top — frea's ${window.__paymentConfig?.feeRatePercent ?? 5}% fee comes out of
            the creator's share, not yours.
          </div>
        </div>
      </div>

      <div class="doc-modal__footer">
        <div class="doc-modal__pricing">
          ${isUnlocked ? `
            <span class="doc-modal__price" style="color: #22c55e;">${ICONS.tickCircle} Yours</span>
            <span class="doc-modal__price-sub">Lifetime access, tied to your student email</span>
          ` : (isPaid ? `
            <span class="doc-modal__price">£${doc.price.toFixed(2)}</span>
            <span class="doc-modal__price-sub">One-off payment · instant, permanent access</span>
          ` : `
            <span class="doc-modal__price" style="color: var(--color-marker-orange);">100% Free</span>
            <span class="doc-modal__price-sub">No credit card or catch · Pay it forward</span>
          `)}
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          ${reportLink('resource', doc.id, doc.title)}
          <button class="pill-btn pill-btn--subtle" onclick="closeModal()">close</button>
          ${isUnlocked || !isPaid ? `
            <button class="pill-btn pill-btn--animated" onclick="window.downloadDoc('${doc.id}')">
              <span class="pill-btn__inner">
                <span>download ${doc.format.split(' ')[0]}</span>
                <span class="pill-btn__arrow">${ICONS.download}</span>
              </span>
            </button>
          ` : `
            <button class="pill-btn pill-btn--animated" onclick="window.openDocCheckoutModal('${doc.id}')">
              <span class="pill-btn__inner">
                <span>unlock now (£${doc.price.toFixed(2)})</span>
                <span class="pill-btn__arrow">${ICONS.unlock}</span>
              </span>
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
window.openDocPreviewModal = openDocPreviewModal;

function openDocCheckoutModal(docId) {
  const doc = getDocById(docId);
  if (!doc) return;

  trackEvent('doc_checkout_opened', { docId: doc.id, title: doc.title, price: doc.price });

  const modal = document.getElementById('modal-content');
  if (!modal) return;

  const feePercent = window.__paymentConfig?.feeRatePercent ?? 5;
  const price = Number(doc.price || 0);
  const freaCut = Math.round(price * (feePercent / 100) * 100) / 100;
  const creatorCut = Math.round((price - freaCut) * 100) / 100;
  const paymentsEnabled = window.__paymentConfig?.enabled !== false;

  window.__activeCheckoutDocId = docId;

  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <div class="doc-modal">
      <div class="doc-modal__header" style="border-bottom: none; padding-bottom: 8px;">
        <span class="doc-badge doc-badge--paid" style="margin-bottom: 8px;">secure checkout</span>
        <h2 class="doc-modal__title" style="font-size: 24px;">unlock ${escapeHtml(doc.title)}</h2>
        <p class="doc-modal__subtitle" style="font-size: 14px;">by <strong>${escapeHtml(doc.mentorName)}</strong> (${escapeHtml(doc.mentorUniversity || '')})</p>
      </div>

      <div class="doc-modal__checkout-box">
        <div class="doc-checkout-summary">
          <div class="doc-checkout-row">
            <span>${escapeHtml(doc.format || 'PDF')} · ${escapeHtml(doc.pages || 'study guide')}</span>
            <span>£${price.toFixed(2)}</span>
          </div>
          <div class="doc-checkout-divider"></div>
          <div class="doc-checkout-row doc-checkout-row--total">
            <span>You pay</span>
            <span class="doc-checkout-total">£${price.toFixed(2)}</span>
          </div>
        </div>

        <!--
          The split is shown for transparency, but note the framing: frea's fee
          comes out of the mentor's share, not on top of the student's price.
        -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; margin: 14px 0; font-size: 12.5px; color: #15803d; line-height: 1.55; text-align: left;">
          <strong>Where your £${price.toFixed(2)} goes:</strong>
          £${creatorCut.toFixed(2)} to ${escapeHtml(doc.mentorName.split(' ')[0])}, and frea keeps
          £${freaCut.toFixed(2)} (${feePercent}%) out of their share to cover hosting.
          You are charged the listed price and nothing more — no booking fee, no surcharge.
        </div>

        ${paymentsEnabled ? `
          <div class="checkout-guarantee" style="margin-bottom: 16px;">
            <span>${ICONS.lock}</span>
            <span>Card payment handled by Stripe · frea never sees your card details</span>
          </div>

          <div id="checkout-error" style="display: none; color: #ef4444; font-size: 13px; font-weight: 600; margin-bottom: 12px; text-align: left;"></div>

          <div style="display: flex; gap: 10px;">
            <button type="button" class="pill-btn pill-btn--subtle" onclick="window.openDocPreviewModal('${escapeHtml(doc.id)}')">← back to preview</button>
            <button type="button" id="checkout-submit-btn" class="pill-btn pill-btn--animated" style="flex: 1; padding: 13px 20px;" onclick="window.processDocCheckout('${escapeHtml(doc.id)}')">
              <span class="pill-btn__inner" style="justify-content: center;">
                <span>pay £${price.toFixed(2)} with card</span>
                <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
              </span>
            </button>
          </div>
        ` : `
          <div style="background: #fff7ed; border: 1.5px solid #fdba74; border-radius: 10px; padding: 14px 16px; font-size: 13.5px; color: #9a3412; line-height: 1.55; text-align: left;">
            <strong>Card payments aren't switched on yet.</strong>
            Playbook checkout opens as soon as frea's Stripe account is live. In the
            meantime, every freabie on the platform is free to download, and
            ${escapeHtml(doc.mentorName.split(' ')[0])} offers free 20-minute calls.
          </div>
          <div style="display: flex; gap: 10px; margin-top: 16px;">
            <button type="button" class="pill-btn pill-btn--subtle" onclick="window.openDocPreviewModal('${escapeHtml(doc.id)}')">← back to preview</button>
            <button type="button" class="pill-btn" style="flex: 1;" onclick="closeModal(); window.navigateTo('/mentor/${doc.mentorId}');">
              book a free chat instead
            </button>
          </div>
        `}
      </div>
    </div>
  `;

  openOverlay();
}
window.openDocCheckoutModal = openDocCheckoutModal;

/**
 * Starts a Stripe Checkout Session and hands the student over to Stripe.
 * Nothing is unlocked here — access is granted only once Stripe confirms
 * payment, either by webhook or by the server re-checking on return.
 */
async function processDocCheckout(docId) {
  const doc = getDocById(docId);
  if (!doc) return;

  const submitBtn = document.getElementById('checkout-submit-btn');
  const errorEl = document.getElementById('checkout-error');

  const proceed = async () => {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>opening secure checkout…</span>';
    }
    if (errorEl) errorEl.style.display = 'none';

    try {
      const { checkoutUrl, orderId } = await startCheckout(doc.id);

      trackEvent('checkout_started', { docId: doc.id, title: doc.title, price: doc.price, orderId });

      // Remember what we were buying so the return trip can report on it.
      try {
        sessionStorage.setItem('frea_pending_order', JSON.stringify({ orderId, docId: doc.id }));
      } catch (e) { /* non-critical */ }

      window.location.href = checkoutUrl;
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="pill-btn__inner" style="justify-content: center;"><span>pay £${Number(doc.price).toFixed(2)} with card</span><span class="pill-btn__arrow">${ICONS.arrowRight}</span></span>`;
      }
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerText = err.message || 'Could not open checkout. Please try again.';
      } else {
        showToast(err.message || 'Could not open checkout.');
      }
    }
  };

  requireVerifiedSession({
    email: verifiedEmail(),
    universityName: doc.mentorUniversity,
    actionName: `buy "${escapeHtml(doc.title)}"`,
    onVerified: proceed
  });
}
window.processDocCheckout = processDocCheckout;

/** Landing page after Stripe, at #/checkout-complete. */
function renderCheckoutComplete(route) {
  const params = new URLSearchParams(route.split('?')[1] || '');
  const orderId = params.get('order');
  const status = params.get('status');

  setTimeout(async () => {
    const root = document.getElementById('checkout-result');
    if (!root) return;

    if (status === 'cancelled') {
      root.innerHTML = `
        <h1 style="font-size: 28px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 8px;">checkout cancelled</h1>
        <p style="font-size: 15px; opacity: 0.75; margin-bottom: 22px;">No payment was taken. The playbook is still there whenever you want it.</p>
        <button class="pill-btn pill-btn--animated" onclick="window.navigateTo('/resources')">back to freabies &amp; docs</button>
      `;
      return;
    }

    try {
      // Ask the server, which asks Stripe. The query string is not trusted.
      const result = await fetchCheckoutStatus(orderId);

      if (result.status === 'paid') {
        markDocUnlocked(result.resourceId);
        await refreshEntitlements();
        trackEvent('doc_purchased', { docId: result.resourceId, title: result.resourceTitle, price: result.totalAmount });

        root.innerHTML = `
          <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
          <h1 style="font-size: 28px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 8px;">playbook unlocked</h1>
          <p style="font-size: 15px; opacity: 0.75; margin-bottom: 8px; max-width: 460px; margin-left: auto; margin-right: auto;">
            <strong>${escapeHtml(result.resourceTitle)}</strong> is yours for good. A receipt and download
            link are on their way to your inbox.
          </p>
          <p style="font-size: 13px; opacity: 0.6; margin-bottom: 24px;">Order ${escapeHtml(result.orderId)}</p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="pill-btn pill-btn--animated" onclick="window.downloadDoc('${escapeHtml(result.resourceId)}')">
              <span class="pill-btn__inner"><span>download it now</span><span class="pill-btn__arrow">${ICONS.download}</span></span>
            </button>
            <button class="pill-btn pill-btn--subtle" onclick="window.navigateTo('/resources')">browse more</button>
          </div>
        `;
      } else {
        root.innerHTML = `
          <h1 style="font-size: 26px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 8px;">payment still processing</h1>
          <p style="font-size: 15px; opacity: 0.75; margin-bottom: 22px; max-width: 460px; margin-left: auto; margin-right: auto;">
            Your bank hasn't confirmed this one yet. It usually takes a few seconds —
            we'll email your download link the moment it clears.
          </p>
          <button class="pill-btn pill-btn--subtle" onclick="window.location.reload()">check again</button>
        `;
      }
    } catch (err) {
      root.innerHTML = `
        <h1 style="font-size: 26px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 8px;">couldn't confirm that order</h1>
        <p style="font-size: 15px; opacity: 0.75; margin-bottom: 22px;">${escapeHtml(err.message)}</p>
        <button class="pill-btn pill-btn--subtle" onclick="window.navigateTo('/resources')">back to freabies &amp; docs</button>
      `;
    }
  }, 50);

  return `
    <div class="page-container" style="min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 60px 20px;">
      <div id="checkout-result" style="text-align: center; max-width: 560px;">
        <div style="width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top: 3px solid var(--color-marker-orange); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto;"></div>
        <p style="font-size: 15px; opacity: 0.7;">confirming your payment…</p>
      </div>
    </div>
    ${renderFooter()}
  `;
}

/**
 * Downloads a resource through the authorised endpoint. Freabies are granted
 * on request to any verified student; playbooks require a completed purchase.
 */
async function downloadDoc(docId) {
  const doc = getDocById(docId);
  const title = doc ? doc.title : 'frea-resource';

  const proceedDownload = async () => {
    try {
      await downloadResource(docId, title);
      markDocUnlocked(docId);
      trackEvent('doc_downloaded', { docId, title, type: doc?.type });
      showToast(`Downloading "${title}".`);
      refreshDocCardsUI();
    } catch (err) {
      if (err.requiresPurchase) {
        showToast('That playbook needs to be purchased first.');
        openDocCheckoutModal(docId);
        return;
      }
      if (err.needsVerification) {
        openVerificationModal({
          email: null,
          actionName: `download "${title}"`,
          onVerified: () => downloadDoc(docId)
        });
        return;
      }
      showToast(err.message || 'Could not download this resource.');
    }
  };

  requireVerifiedSession({
    email: verifiedEmail(),
    universityName: doc?.mentorUniversity,
    actionName: `download "${title}"`,
    onVerified: proceedDownload
  });
}
window.downloadDoc = downloadDoc;

/** Claims a freabie without downloading, so it shows as unlocked. */
async function claimFreabie(docId) {
  const doc = getDocById(docId);
  requireVerifiedSession({
    email: verifiedEmail(),
    actionName: `unlock "${doc?.title || 'this freabie'}"`,
    onVerified: async () => {
      try {
        await claimResource(docId);
        markDocUnlocked(docId);
        refreshDocCardsUI();
        showToast('Added to your freabies.');
      } catch (err) {
        showToast(err.message || 'Could not unlock this resource.');
      }
    }
  });
}
window.claimFreabie = claimFreabie;

function refreshDocCardsUI() {
  const unlocked = getUnlockedDocIds();
  unlocked.forEach(docId => {
    const card = document.getElementById(`doc-card-${docId}`);
    if (card) {
      card.classList.add('doc-card--unlocked');
      const badge = card.querySelector('.doc-badge--paid');
      if (badge) {
        badge.outerHTML = `<span class="doc-badge doc-badge--unlocked">${ICONS.tickCircle} unlocked</span>`;
      }
      const actionBtn = card.querySelector('.doc-btn--paid');
      if (actionBtn) {
        actionBtn.outerHTML = `
          <button type="button" class="doc-btn doc-btn--unlocked" onclick="window.downloadDoc('${docId}')" title="Download to device" aria-label="Download guide">
            ${ICONS.download}
            <span>download</span>
          </button>
        `;
      }
    }
  });
}
window.refreshDocCardsUI = refreshDocCardsUI;

// ─── Footer Component ─────

function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer__inner">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <svg width="34" height="34" viewBox="0 0 42 42" fill="none">
              <rect x="7" y="6" width="28" height="30" rx="7" fill="#fdfbf9" stroke="#171717" stroke-width="2.5"/>
              <path d="M22 6v11l4-3.5 4 3.5V6" fill="#ff6f1e" stroke="#171717" stroke-width="1.8"/>
              <circle cx="19.5" cy="22.5" r="1.6" fill="#171717"/>
              <circle cx="28.5" cy="22.5" r="1.6" fill="#171717"/>
              <path d="M21 26.5c1.8 2.5 5.2 2.5 7 0" stroke="#171717" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <span class="footer__brand" style="margin-bottom: 0;">frea</span>
          </div>
          <div class="footer__tagline">the student mentoring platform that's actually free.</div>
        </div>
        <div class="footer__links">
          <a class="footer__link" href="/browse">browse seniors</a>
          <a class="footer__link" href="/resources">freabies &amp; docs</a>
          <a class="footer__link" href="/become-a-mentor">become a mentor</a>
          <a class="footer__link" href="/mentor-dashboard" rel="nofollow">mentor portal</a>
          <a class="footer__link" href="/my-sessions" rel="nofollow">my sessions</a>
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.scrollTo({top: document.querySelector('.faq__list')?.offsetTop - 100, behavior: 'smooth'})">faq</a>
        </div>
      </div>
      <div class="footer__bottom" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <span>© 2026 frea. built with care for UK university students who deserve honest guidance.</span>
        <span style="opacity: 0.85; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">${ICONS.shieldTick} .ac.uk verified · Jisc educational governance</span>
      </div>
    </footer>
  `;
}

// ─── Clean Vanilla Interactive Monthly Calendar ─────

const todayForCalendar = new Date();

let calendarState = {
  mentorId: 1,
  // Opens on the current month, always. This used to be pinned to Sep 2026,
  // which was correct for exactly one month.
  year: todayForCalendar.getFullYear(),
  month: todayForCalendar.getMonth() + 1,
  selectedDate: null,
  selectedSlot: null,
  selectedDisplayDate: '',
  data: null,
  loading: false
};

async function loadMentorCalendar(mentorId, year, month) {
  const now = new Date();
  const y = year || calendarState.year || now.getFullYear();
  const m = month || calendarState.month || (now.getMonth() + 1);
  calendarState.mentorId = parseInt(mentorId);
  calendarState.year = y;
  calendarState.month = m;
  calendarState.loading = true;

  const root = document.getElementById('profile-calendar-root');
  if (root && !calendarState.data) {
    root.innerHTML = `
      <div class="frea-cal frea-cal--loading">
        <span style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">${ICONS.calendar}</span>
        <p style="font-weight: 700; font-family: var(--font-display); color: var(--color-charcoal);">loading calendar...</p>
      </div>
    `;
  }

  try {
    const data = await fetchMonthlySlots(calendarState.mentorId, y, m);
    calendarState.data = data;
    calendarState.loading = false;

    // The server has already excluded booked and past slots, so the first day
    // it reports as open really is open — no local bookkeeping needed.
    const firstWithSlots = data.days.find(d => d.hasSlots);

    if (firstWithSlots && !calendarState.selectedDate) {
      calendarState.selectedDate = firstWithSlots.date;
      calendarState.selectedDisplayDate = firstWithSlots.displayDate;
    }

    renderCalendarDOM();
  } catch (err) {
    console.error('Failed to load monthly slots', err);
    calendarState.loading = false;
    if (root) {
      root.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--color-marker-orange);">Failed to load schedule. Please try refreshing.</div>`;
    }
  }
}
window.loadMentorCalendar = loadMentorCalendar;

function navigateMonth(delta) {
  let m = calendarState.month + delta;
  let y = calendarState.year;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  trackEvent('calendar_month_navigated', { year: y, month: m });
  calendarState.selectedDate = null;
  calendarState.selectedSlot = null;
  calendarState.selectedDisplayDate = '';
  loadMentorCalendar(calendarState.mentorId, y, m);
}
window.navigateMonth = navigateMonth;

function selectCalendarMonthCell(dateStr) {
  if (!calendarState.data) return;
  const day = calendarState.data.days.find(d => d.date === dateStr);
  if (!day) return;

  calendarState.selectedDate = dateStr;
  calendarState.selectedDisplayDate = day.displayDate;
  calendarState.selectedSlot = null;
  window.__selectedDay = day.displayDate;
  window.__selectedSlot = '';

  trackEvent('calendar_day_selected', { date: dateStr, displayDate: day.displayDate, hasSlots: day.hasSlots });
  renderCalendarDOM();
}
window.selectCalendarMonthCell = selectCalendarMonthCell;

function selectMonthSlotChip(time, dateStr, displayDate) {
  calendarState.selectedDate = dateStr;
  calendarState.selectedDisplayDate = displayDate;
  calendarState.selectedSlot = time;
  window.__selectedDay = displayDate;
  window.__selectedSlot = time;

  trackEvent('slot_selected', { date: dateStr, displayDate, slot: time });
  renderCalendarDOM();

  const bookBar = document.getElementById('book-bar');
  if (bookBar) {
    bookBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
window.selectMonthSlotChip = selectMonthSlotChip;

function renderCalendarDOM() {
  const container = document.getElementById('profile-calendar-root');
  if (!container || !calendarState.data) return;

  const data = calendarState.data;
  const monthNamesFull = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const fullMonthTitle = `${monthNamesFull[calendarState.month - 1]} ${calendarState.year}`;

  // The server has already removed booked and past slots, so what arrives is
  // what is genuinely available. (This used to subtract a localStorage cache
  // that nothing had written to since bookings moved server-side.)
  const processedDays = data.days;

  let selectedDayObj = processedDays.find(d => d.date === calendarState.selectedDate);
  if (!selectedDayObj) {
    selectedDayObj = processedDays.find(d => d.hasSlots) || processedDays[0];
    if (selectedDayObj) {
      calendarState.selectedDate = selectedDayObj.date;
      calendarState.selectedDisplayDate = selectedDayObj.displayDate;
    }
  }

  let contentHtml = `
    <div class="frea-cal">
      <!-- Calendar Header: Symmetrical, fixed buttons & clean month title -->
      <div class="frea-cal__header">
        <button class="frea-cal__nav-btn" onclick="window.navigateMonth(-1)" title="Previous month" aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div class="frea-cal__title">${fullMonthTitle}</div>
        <button class="frea-cal__nav-btn" onclick="window.navigateMonth(1)" title="Next month" aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <!-- Weekday Headers -->
      <div class="frea-cal__weekdays">
        <div class="frea-cal__weekday">Mon</div>
        <div class="frea-cal__weekday">Tue</div>
        <div class="frea-cal__weekday">Wed</div>
        <div class="frea-cal__weekday">Thu</div>
        <div class="frea-cal__weekday">Fri</div>
        <div class="frea-cal__weekday">Sat</div>
        <div class="frea-cal__weekday">Sun</div>
      </div>

      <!-- Clean 7-Column Days Grid -->
      <div class="frea-cal__grid">
  `;

  // Offset empty days before 1st of month
  for (let i = 0; i < data.firstWeekdayOffset; i++) {
    contentHtml += `<div class="frea-cal__cell frea-cal__cell--empty"></div>`;
  }

  // Days in month — detect past days & today
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1; // 1-indexed
  const todayYear = now.getFullYear();
  const isCurrentMonth = calendarState.month === todayMonth && calendarState.year === todayYear;
  const isPastMonth = (calendarState.year < todayYear) || (calendarState.year === todayYear && calendarState.month < todayMonth);

  processedDays.forEach(day => {
    const isSelected = selectedDayObj && selectedDayObj.date === day.date;
    const hasSlots = day.hasSlots;
    const dayNum = parseInt(day.dayNumber, 10);
    const isPast = isPastMonth || (isCurrentMonth && dayNum < todayDay);
    const isToday = isCurrentMonth && dayNum === todayDay;

    let cellClass = 'frea-cal__cell';
    if (isSelected) {
      cellClass += ' frea-cal__cell--selected';
    } else if (isPast) {
      cellClass += ' frea-cal__cell--past';
    } else if (hasSlots) {
      cellClass += ' frea-cal__cell--available';
    } else {
      cellClass += ' frea-cal__cell--unavailable';
    }
    if (isToday) {
      cellClass += ' frea-cal__cell--today';
    }

    contentHtml += `
      <div class="${cellClass}" onclick="${isPast ? '' : `window.selectCalendarMonthCell('${day.date}')`}" title="${isPast ? `${day.displayDate} (past)` : (hasSlots ? `${day.slotCount} open slot(s) on ${day.displayDate}` : `No availability on ${day.displayDate}`)}">
        <span class="frea-cal__num">${day.dayNumber}</span>
      </div>
    `;
  });

  contentHtml += `</div>`;

  // Slot Selection Section
  // The whole rota for the day, not just what is left. A slot that has been
  // taken or has already started is shown greyed rather than dropped, so the
  // student can see the day had five slots and they have missed three —
  // which reads very differently from an empty list.
  const rota = selectedDayObj?.slotDetail || [];
  if (selectedDayObj && rota.length) {
    contentHtml += `
      <div class="frea-cal__slots-wrap">
        <div class="frea-cal__slots-header">
          <div class="frea-cal__slots-title">
            Slots for ${escapeHtml(selectedDayObj.displayDate)}
          </div>
          <span class="frea-cal__slots-sub">${selectedDayObj.slotCount} of ${rota.length} still open · 20-min sessions (UK time)</span>
        </div>
        <div class="frea-cal__chips">
          ${rota.map(s => {
      const isSlotSelected = calendarState.selectedSlot === s.time && calendarState.selectedDate === selectedDayObj.date;
      // Unbookable chips stay in the list but are inert and labelled with
      // the reason, so "gone" and "never offered" cannot be confused.
      if (!s.bookable) {
        return `
              <span class="frea-cal__chip frea-cal__chip--gone" title="${s.booked ? 'Already booked' : 'This slot has already started'}">
                <span>${escapeHtml(s.range)}</span>
                <span class="frea-cal__chip-reason">${s.booked ? 'booked' : 'gone'}</span>
              </span>
            `;
      }
      return `
              <button class="frea-cal__chip ${isSlotSelected ? 'selected' : ''}" onclick="window.selectMonthSlotChip('${s.time}', '${selectedDayObj.date}', '${escapeHtml(selectedDayObj.displayDate)}')">
                <span>${escapeHtml(s.range)}</span>
              </button>
            `;
    }).join('')}
        </div>
      </div>
    `;
  } else if (selectedDayObj) {
    contentHtml += `
      <div class="frea-cal__no-slots">
        <div>
          <div style="font-weight: 600; color: var(--color-charcoal); font-size: 14.5px;">No open availability on ${selectedDayObj.displayDate}</div>
          <div style="font-size: 13px; opacity: 0.7; margin-top: 2px;">Please click any highlighted orange date on the calendar above to view open slots.</div>
        </div>
      </div>
    `;
  }

  // Booking Confirmation Bar
  const hasSelectedSlot = !!calendarState.selectedSlot;
  contentHtml += `
    <div class="profile__book-bar" id="book-bar" style="${hasSelectedSlot ? 'display: flex;' : 'display: none;'}">
      <div>
        <div class="profile__book-selected" id="book-selected-text">
          ${hasSelectedSlot ? `Selected: <span>${calendarState.selectedDisplayDate} at ${toDisplayTime(calendarState.selectedSlot)}</span> · 20-min call` : ''}
        </div>
        <div style="font-size: 13px; opacity: 0.65; margin-top: 3px;">instant video link · calendar invite to you and your mentor</div>
      </div>
      <button class="pill-btn pill-btn--animated" onclick="window.openBookingModal(${calendarState.mentorId})">
        <span class="pill-btn__inner">
          <span>confirm chat</span>
          <span class="pill-btn__arrow">→</span>
        </span>
      </button>
    </div>
  </div>`;

  container.innerHTML = contentHtml;
}

// ─── Booking Modal ─────

function openBookingModal(mentorId) {
  const mentor = MENTORS.find(m => m.id === parseInt(mentorId));
  if (!mentor) return;

  let selectedDay = window.__selectedDay || calendarState.selectedDisplayDate || '';
  let selectedSlot = window.__selectedSlot || calendarState.selectedSlot || '';

  // If no slot chosen yet, auto-select first open slot if available
  if (!selectedSlot) {
    if (calendarState.data && calendarState.data.allOpenSlots && calendarState.data.allOpenSlots.length > 0) {
      const first = calendarState.data.allOpenSlots[0];
      selectedDay = first.displayDate;
      selectedSlot = first.time;
      calendarState.selectedDate = first.date;
      calendarState.selectedDisplayDate = first.displayDate;
      calendarState.selectedSlot = first.time;
      window.__selectedDay = first.displayDate;
      window.__selectedSlot = first.time;
    } else {
      showToast('Pick a date and time slot first.');
      return;
    }
  }

  trackEvent('booking_modal_opened', { mentorId: mentor.id, mentorName: mentor.name, day: selectedDay, slot: selectedSlot });

  renderBookingModal({ mentor, selectedDay, selectedSlot });

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Paints the gate for the slot already chosen.
 *
 * Split out from `openBookingModal` so "not you?" can repaint it after ending
 * the session without re-running slot selection or counting a second
 * `booking_modal_opened`. The verified/unverified branch is decided here, on
 * every paint, from the live session — which is what makes the repaint enough
 * to move the student from "booking as ..." back to an empty email field.
 */
function renderBookingModal({ mentor, selectedDay, selectedSlot, focusEmail = false }) {
  // A student who has already verified skips straight to confirming.
  const alreadyVerified = isVerified();
  const sessionEmail = verifiedEmail() || '';

  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <h2 class="modal__title">book your free 20-min chat</h2>
    <p class="modal__body">you're booking with <strong>${escapeHtml(mentor.name)}</strong> (${escapeHtml(mentor.university)})</p>
    <ul class="modal__steps">
      <li class="modal__step">
        <span class="modal__step-icon">${ICONS.calendar}</span>
        <span><strong>${escapeHtml(selectedDay)}</strong> at <strong>${escapeHtml(toDisplayTime(selectedSlot))}</strong> (UK time)</span>
      </li>
      <li class="modal__step">
        <span class="modal__step-icon">${ICONS.mail}</span>
        <span>you and ${escapeHtml(mentor.name.split(' ')[0])} both get a calendar invite and video link</span>
      </li>
      <li class="modal__step">
        <span class="modal__step-icon">${ICONS.shieldTick}</span>
        <span>verified through your <strong>university login</strong> — no email code to wait for</span>
      </li>
    </ul>

    <div id="booking-gate" style="margin-top: 20px;">
      ${alreadyVerified ? `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 12px 16px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: #15803d; flex-wrap: wrap;">
            <span>${ICONS.shieldTick}</span>
            <span>Booking as <strong>${escapeHtml(sessionEmail)}</strong></span>
            <!-- Sessions last thirty days, so the signed-in address is often
                 not the one the person in front of the screen expects --
                 someone else's on a shared machine, or an old account of
                 their own. Say whose it is, and offer a way out of it. -->
            <button type="button" id="booking-not-you"
                    style="background: none; border: none; padding: 0; font-size: 12.5px; color: #15803d; text-decoration: underline; cursor: pointer; opacity: 0.85;">not you?</button>
          </div>
          <button id="confirm-booking-btn" class="pill-btn pill-btn--dark" onclick="confirmBooking(${mentor.id})">confirm chat</button>
        </div>
        <div id="booking-error-msg" style="color: var(--color-marker-orange); font-size: 13px; margin-top: 6px; display: none;"></div>
      ` : `
        <div id="booking-auth-flow"></div>
      `}
    </div>
  `;

  // Wired here rather than inline: every new on*= handler is another reason
  // the CSP still carries script-src 'unsafe-inline'.
  renderAuthFlow({
    host: document.getElementById('booking-auth-flow'),
    actionName: 'book this chat',
    // Repaint in place so the slot they picked survives signing in.
    onSignedIn: () => renderBookingModal({ mentor, selectedDay, selectedSlot })
  });

  const notYouBtn = document.getElementById('booking-not-you');
  if (notYouBtn) {
    notYouBtn.addEventListener('click', () => {
      forgetBookingAccount({ mentor, selectedDay, selectedSlot, trigger: notYouBtn });
    });
  }

  // `focusEmail` is a leftover from when this gate held an email field of its
  // own; the sign-in flow owns that focus now and manages it per step.
}

/**
 * "not you?" -- ends the session and hands the gate back empty.
 *
 * It has to do all three, because a student clicking this is telling us the
 * address on screen is the wrong one: end the session on the server (the token
 * is what authorises booking, so leaving it alive leaves the wrong person able
 * to book), drop it locally, and repaint the gate so the field is empty and
 * theirs to fill. It used to call studentSignOut, which navigates to the home
 * page -- the address did go away, but so did the modal and the slot they had
 * picked, which is not what the link offers.
 *
 * The chosen slot survives: they are changing who is booking, not what.
 */
async function forgetBookingAccount({ mentor, selectedDay, selectedSlot, trigger }) {
  if (trigger) {
    trigger.disabled = true;
    trigger.textContent = 'signing out...';
  }

  try {
    await signOut();
  } catch (_) {
    // The session is going regardless -- a failed call to the server should
    // not strand someone signed in on a machine they are trying to leave.
  }
  // signOut clears it too, but only on the path where its request resolved.
  setSession(null);

  trackEvent('booking_account_switched', { mentorId: mentor.id, day: selectedDay, slot: selectedSlot });

  updateNavbarMentorStatus();
  renderBookingModal({ mentor, selectedDay, selectedSlot, focusEmail: true });
  showToast('Signed out. Enter your university email to carry on.');
}

async function confirmBooking(mentorId) {
  const emailInput = document.getElementById('booking-email');
  const errorEl = document.getElementById('booking-error-msg');
  const confirmBtn = document.getElementById('confirm-booking-btn');

  // A verified session already tells us who this is; the field is only for
  // students who have not verified yet.
  const email = isVerified()
    ? verifiedEmail()
    : (emailInput ? emailInput.value.trim().toLowerCase() : '');

  if (!email || !email.includes('@')) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please enter a valid university email address.';
    }
    return;
  }

  // No .ac.uk check here any more. The session was opened by the student's
  // own university identity provider, and the address on it is the contact
  // one they chose — usually personal, which is the whole point, since
  // university mail was being filtered away unseen. Requiring .ac.uk here
  // would reject every student the new flow verifies.

  const mentor = MENTORS.find(m => m.id === parseInt(mentorId));

  // Canonical ISO date + 24-hour time. These are what the server stores and
  // compares against, so the slot we book is the slot that gets held.
  let selectedDate = calendarState.selectedDate;
  let selectedSlot = calendarState.selectedSlot;

  if (!selectedSlot && calendarState.data?.allOpenSlots?.length > 0) {
    const first = calendarState.data.allOpenSlots[0];
    selectedDate = first.date;
    selectedSlot = first.time;
  }

  if (!selectedDate || !selectedSlot) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please pick a day and a time slot from the calendar first.';
    }
    return;
  }

  const proceedBooking = async () => {
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerText = 'confirming...';
    }

    try {
      const booking = await submitBooking({
        mentorId: parseInt(mentorId),
        date: selectedDate,
        time: selectedSlot
      });

      window.__lastBookingCalendarLinks = booking.calendarLinks || null;

      trackEvent('booking_completed', {
        mentorId: mentor?.id,
        mentorName: mentor?.name,
        date: booking.date,
        slot: booking.time,
        emailDomain: email.split('@')[1],
        bookingId: booking.id
      });

      // Refresh availability so the slot we just took disappears.
      loadMentorCalendar(mentorId, calendarState.year, calendarState.month);

      const meetingUrl = booking.meetingUrl || booking.googleMeetUrl || '';

      const modal = document.getElementById('modal-content');
      modal.innerHTML = `
        <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
        <div class="modal--confirmation">
          <div class="modal__celebration" style="display: flex; align-items: center; justify-content: center; gap: 8px;">${ICONS.tickCircle} <span style="font-weight: 800; font-size: 22px;">You're booked in</span></div>
          <h2 class="modal__title">you're booked in!</h2>
          <p class="modal__body">
            A confirmation and calendar invite are on their way to <strong>${escapeHtml(email)}</strong> for
            <strong>${escapeHtml(toLongDisplayDate(booking.date))} at ${escapeHtml(booking.displayTime || toDisplayTime(booking.time))}</strong>
            (${escapeHtml(booking.timezone || 'UK time')}).
            ${mentor?.name ? `${escapeHtml(mentor.name.split(' ')[0])} has been sent the same invite.` : ''}
          </p>

          <div style="background: #ffffff; border: 2px solid var(--color-marker-orange); border-radius: 12px; padding: 16px; margin: 16px 0; text-align: left;">
            <div style="font-size: 13px; font-weight: 700; color: var(--color-cocoa-ink); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">${ICONS.video} Your video room:</div>
            <a href="${escapeHtml(meetingUrl)}" target="_blank" rel="noopener noreferrer" style="font-family: monospace; font-size: 14px; font-weight: 700; color: #2563eb; word-break: break-all; text-decoration: underline;">
              ${escapeHtml(meetingUrl)}
            </a>
            <div style="font-size: 11.5px; opacity: 0.65; margin-top: 6px;">
              Booking ref: <code>${escapeHtml(booking.id)}</code> · 20-min 1-on-1 · no sign-in needed, just click the link
            </div>
          </div>

          <div style="margin: 18px 0; text-align: left;">
            <div style="font-size: 13px; font-weight: 700; color: var(--color-charcoal); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>${ICONS.calendar}</span> Add to your calendar:
            </div>
            <div class="calendar-sync-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="cal-sync-btn cal-sync-btn--google" onclick="window.addBookingToCalendar('google')">
                <span>${ICONS.google}</span> Google Calendar
              </button>
              <button type="button" class="cal-sync-btn cal-sync-btn--outlook" onclick="window.addBookingToCalendar('outlook')">
                <span>${ICONS.outlook || ICONS.calendar}</span> Outlook
              </button>
              <button type="button" class="cal-sync-btn cal-sync-btn--ics" onclick="window.downloadBookingInvite('${escapeHtml(booking.id)}')">
                <span>${ICONS.documentDownload}</span> Apple / other (.ics)
              </button>
            </div>
            <div style="font-size: 11.5px; opacity: 0.6; margin-top: 6px;">
              Use any calendar you like — it doesn't have to be your university account.
            </div>
          </div>

          <div style="background: var(--color-dew-drop); padding: 14px 18px; border-radius: 10px; border-left: 3px solid var(--color-marker-orange); margin: 16px 0; font-size: 14px; text-align: left;">
            <strong>Tip from ${escapeHtml(mentor?.name || 'your mentor')}:</strong><br>
            <em>${escapeHtml(mentor?.topTip || 'Bring 2-3 specific questions so you get the most out of your 20 minutes.')}</em>
          </div>

          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="pill-btn" onclick="closeModal(); window.navigateTo('/browse')">browse more seniors</button>
            <button class="pill-btn pill-btn--subtle" onclick="closeModal(); window.navigateTo('/my-sessions')">my sessions</button>
          </div>
        </div>
      `;

      openOverlay();
    } catch (err) {
      console.error('Booking failed', err);

      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerText = 'confirm chat';
      }

      // A slot taken while the student was deciding: refresh and explain.
      if (/just been booked|not available/i.test(err.message || '')) {
        loadMentorCalendar(mentorId, calendarState.year, calendarState.month);
      }

      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerText = err.message || 'Could not complete booking. Please try again or choose another slot.';
      } else {
        const modal = document.getElementById('modal-content');
        openOverlay();
        if (modal) {
          modal.innerHTML = `
            <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
            <div style="padding: 24px; text-align: center;">
              <h3 style="color: #ef4444; margin-bottom: 8px;">Booking could not be completed</h3>
              <p style="font-size: 14px; opacity: 0.8; margin-bottom: 16px;">${escapeHtml(err.message || 'Something went wrong.')}</p>
              <button class="pill-btn" onclick="openBookingModal(${parseInt(mentorId)})">Try again</button>
            </div>
          `;
        }
      }
    }
  };

  requireVerifiedSession({
    email,
    universityName: mentor?.university,
    actionName: 'confirm this mentoring session',
    onVerified: proceedBooking
  });
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Filtering (Browse Page) ─────

let activeGoal = 'all';
let activeSubject = 'all';
let activeYear = 'all years';
let activeUniversity = 'all';

function setFilter(type, value) {
  if (type === 'goal') {
    activeGoal = value;
    document.querySelectorAll('[data-filter="goal"]').forEach(t => {
      t.classList.toggle('active', t.dataset.value === value);
    });
  } else if (type === 'subject') {
    activeSubject = value;
    document.querySelectorAll('[data-filter="subject"]').forEach(t => {
      t.classList.toggle('active', t.dataset.value === value);
    });
  } else if (type === 'year') {
    activeYear = value;
    document.querySelectorAll('[data-filter="year"]').forEach(t => {
      t.classList.toggle('active', t.dataset.value === value);
    });
  } else if (type === 'university') {
    activeUniversity = value;
  }

  trackEvent('filter_applied', { type, value });
  filterMentors();
}
window.setFilter = setFilter;

function clearAllFilters() {
  activeGoal = 'all';
  activeSubject = 'all';
  activeYear = 'all years';
  activeUniversity = 'all';

  const searchInput = document.getElementById('mentor-search');
  if (searchInput) searchInput.value = '';

  const uniSelect = document.getElementById('uni-filter-select');
  if (uniSelect) uniSelect.value = 'all';

  document.querySelectorAll('[data-filter="goal"]').forEach(t => t.classList.toggle('active', t.dataset.value === 'all'));
  document.querySelectorAll('[data-filter="subject"]').forEach(t => t.classList.toggle('active', t.dataset.value === 'all'));
  document.querySelectorAll('[data-filter="year"]').forEach(t => t.classList.toggle('active', t.dataset.value === 'all years'));

  filterMentors();
}
window.clearAllFilters = clearAllFilters;

function filterMentors() {
  const searchInput = document.getElementById('mentor-search');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = MENTORS.filter(m => {
    // Goal filter
    if (activeGoal !== 'all') {
      const keywords = GOAL_KEYWORD_MAP[activeGoal] || [];
      const mentorText = `${m.bio} ${m.helpsWith.join(' ')} ${m.achievements.join(' ')} ${m.topTip}`.toLowerCase();
      const matchesGoal = keywords.some(k => mentorText.includes(k));
      if (!matchesGoal) return false;
    }

    // Subject filter
    if (activeSubject !== 'all') {
      const category = SUBJECT_MAP[m.major];
      if (category !== activeSubject) return false;
    }

    // Year filter
    if (activeYear !== 'all years') {
      if (m.year !== activeYear) return false;
    }

    // University filter
    if (activeUniversity !== 'all') {
      if (!m.university.toLowerCase().includes(activeUniversity.toLowerCase())) return false;
    }

    // Search filter
    if (search) {
      const searchable = `${escapeHtml(m.name)} ${escapeHtml(m.major)} ${escapeHtml(m.university)} ${m.bio} ${m.topTip} ${m.helpsWith.join(' ')}`.toLowerCase();
      if (!searchable.includes(search)) return false;
    }

    return true;
  });

  const grid = document.getElementById('mentor-grid');
  const emptyState = document.getElementById('empty-state');
  const badge = document.getElementById('match-count-badge');

  if (badge) {
    badge.innerText = `${filtered.length} verified senior${filtered.length === 1 ? '' : 's'}`;
  }

  if (grid) {
    if (filtered.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
      grid.innerHTML = filtered.map(m => mentorCard(m)).join('');
    }
  }
}
window.filterMentors = filterMentors;

// ─── FAQ Toggle ─────

function toggleFaq(index) {
  const item = document.querySelector(`[data-faq="${index}"]`);
  if (item) {
    item.classList.toggle('open');
  }
}
window.toggleFaq = toggleFaq;

// ─── Admin Dashboard Component ─────

let adminApplicationsData = [];

async function initAdminDashboard() {
  const container = document.getElementById('admin-apps-list');
  if (!container) return;

  // Admin is gated server-side on the ADMIN_EMAILS list; this branch only
  // decides what to render, and a non-admin gets nothing either way.
  if (!isVerified()) {
    container.innerHTML = adminLockedCard(
      'Sign in to continue',
      'The review queue contains applicants&rsquo; personal details, so it needs an administrator sign-in.',
      `<button class="pill-btn pill-btn--animated" onclick="window.openVerificationModal({ email: null, actionName: 'sign in as an administrator' })">
         <span class="pill-btn__inner"><span>sign in</span><span class="pill-btn__arrow">→</span></span>
       </button>`
    );

    // The loaders below never run on this path, so their markup would sit on
    // "Loading…" for as long as the page is open — which reads as a broken
    // page rather than a locked one.
    for (const id of ['admin-reports-list', 'admin-suggestions-list']) {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.6; font-size: 13.5px;">Sign in as an administrator to view this.</div>';
      }
    }
    return;
  }

  try {
    adminApplicationsData = await fetchAdminApplications();
  } catch (err) {
    container.innerHTML = adminLockedCard(
      err.status === 403 ? 'Not an administrator' : 'Could not load the queue',
      err.status === 403
        ? `The account ${escapeHtml(verifiedEmail() || '')} is not on frea's administrator list.`
        : escapeHtml(err.message || 'Please try again.'),
      `<button class="pill-btn pill-btn--subtle" onclick="window.navigateTo('/')">back to frea</button>`
    );
    const countBadge = document.getElementById('admin-pending-count');
    if (countBadge) countBadge.innerText = '—';
    return;
  }

  renderAdminApplicationsList();
  loadAdminReports();
  loadAdminSuggestions();
}

function adminLockedCard(title, body, actions) {
  return `
    <div style="text-align: center; padding: 48px 20px; background: #fff; border-radius: 16px; border: 1.5px dashed rgba(23, 23, 23, 0.2);">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #fff7ed; color: var(--color-marker-orange); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
        ${ICONS.lock}
      </div>
      <h3 style="font-size: 19px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">${title}</h3>
      <p style="font-size: 14px; opacity: 0.7; max-width: 420px; margin: 0 auto 18px;">${body}</p>
      ${actions}
    </div>
  `;
}

/** Flagged profiles and resources, newest first. */
async function loadAdminReports() {
  const container = document.getElementById('admin-reports-list');
  if (!container) return;

  const REASON_LABELS = {
    inappropriate: 'Inappropriate', misleading: 'Misleading', copyright: "Someone else's work",
    spam: 'Spam', 'not-a-student': 'Not a student', other: 'Other'
  };

  try {
    const reports = await fetchAdminReports();
    const open = reports.filter(r => r.status === 'open');

    if (!reports.length) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.6; font-size: 13.5px;">Nothing reported. Good sign.</div>';
      return;
    }

    container.innerHTML = `
      ${open.length ? '' : '<div style="padding: 10px 0; opacity: 0.6; font-size: 13.5px;">No open reports.</div>'}
      ${reports.slice(0, 40).map(r => `
        <div class="portal-resource-row" style="align-items: flex-start; ${r.status === 'resolved' ? 'opacity: 0.5;' : ''}">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
              <span class="doc-badge ${r.status === 'open' ? 'doc-badge--paid' : 'doc-badge--free'}">
                ${escapeHtml(REASON_LABELS[r.reason] || r.reason)}
              </span>
              <span style="font-size: 12.5px; opacity: 0.7;">${escapeHtml(r.targetType)} · ${escapeHtml(r.targetLabel)}</span>
            </div>
            ${r.detail ? `<div style="font-size: 13.5px; color: var(--color-charcoal); line-height: 1.5;">${escapeHtml(r.detail)}</div>` : ''}
            <div style="font-size: 12px; opacity: 0.55; margin-top: 4px;">
              from ${escapeHtml(r.reporterEmail)} · ${escapeHtml(toDisplayDate((r.createdAt || '').slice(0, 10)))}
            </div>
          </div>
          ${r.status === 'open' ? `
            <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 11.5px; padding: 4px 12px;"
                    onclick="window.markReportResolved('${escapeHtml(r.id)}')">mark resolved</button>
          ` : '<span class="doc-badge doc-badge--free">resolved</span>'}
        </div>
      `).join('')}
    `;
  } catch (err) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; opacity: 0.6; font-size: 13.5px;">${escapeHtml(err.message)}</div>`;
  }
}

async function markReportResolved(id) {
  try {
    await resolveReport(id);
    loadAdminReports();
    showToast('Report marked resolved.');
  } catch (err) {
    showToast(err.message || 'Could not update that report.');
  }
}
window.markReportResolved = markReportResolved;

/** Student resource requests, so the team can see what's being asked for. */
async function loadAdminSuggestions() {
  const container = document.getElementById('admin-suggestions-list');
  if (!container) return;

  try {
    const suggestions = await fetchAdminSuggestions();
    if (!suggestions.length) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.6; font-size: 13.5px;">No student requests yet.</div>';
      return;
    }
    container.innerHTML = suggestions.slice(0, 25).map(sug => `
      <div class="portal-resource-row" style="align-items: flex-start;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
            <span class="doc-badge doc-badge--free">${escapeHtml(sug.type)}</span>
            <span style="font-size: 12.5px; opacity: 0.7;">${escapeHtml(sug.university || 'Any university')} · ${escapeHtml(sug.course || 'Any course')}</span>
          </div>
          <div style="font-size: 13.5px; color: var(--color-charcoal); line-height: 1.5;">${escapeHtml(sug.text)}</div>
          ${sug.email ? `<div style="font-size: 12px; opacity: 0.55; margin-top: 4px;">${escapeHtml(sug.email)}</div>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; opacity: 0.6; font-size: 13.5px;">${escapeHtml(err.message)}</div>`;
  }
}

async function renderAdminApplicationsList() {
  const container = document.getElementById('admin-apps-list');
  const countBadge = document.getElementById('admin-pending-count');
  if (countBadge) countBadge.textContent = String(adminApplicationsData.length);

  // Real platform counts rather than the static seed-array length.
  const stats = await fetchStats();
  if (stats) {
    const mentorEl = document.getElementById('admin-mentor-count');
    if (mentorEl) mentorEl.textContent = String(stats.verifiedMentors);
    const bookingEl = document.getElementById('admin-booking-count');
    if (bookingEl) bookingEl.textContent = String(stats.totalBookings);
  }

  if (!container) return;

  if (adminApplicationsData.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: #fff; border-radius: 16px; border: 1.5px dashed rgba(23, 23, 23, 0.2);">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
          ${ICONS.tickCircle}
        </div>
        <h3 style="font-size: 19px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">Nobody has joined yet</h3>
        <p style="font-size: 14px; opacity: 0.7; max-width: 420px; margin: 0 auto;">Mentors go live the moment they verify their university email — there is nothing to approve. Everyone who signs up is listed here, newest first.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = adminApplicationsData.map((app) => {
    const achievementsList = Array.isArray(app.achievements) ? app.achievements : [];
    // The record only ever stored these fields, so read exactly those. The old
    // card read photoUrl, degree, topTipColor, linkedin, website, pitchVideoUrl
    // and attachedDoc — none of which are persisted — and silently rendered
    // empty states that looked like real "nothing provided" answers.
    const postitColour = {
      mint: ['#dcfce7', '#86efac'],
      blush: ['#fce7f3', '#f472b6'],
      sky: ['#e0f2fe', '#7dd3fc']
    }[app.postitColor] || ['#fef9c3', '#facc15'];

    const mentor = MENTORS.find(m => m.id === app.mentorId);

    return `
      <div class="admin-app-card" id="admin-app-${escapeHtml(app.id)}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 56px; height: 56px; border-radius: 12px; overflow: hidden; background: #f3f4f6; border: 1.5px solid var(--color-charcoal); display: flex; align-items: center; justify-content: center;">
              ${getMentorAvatar(app.mentorId || 1, 56)}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h3 style="font-size: 19px; font-weight: 800; color: var(--color-charcoal); font-family: var(--font-display); margin: 0;">${escapeHtml(app.name)}</h3>
                <span class="uni-detect-badge" style="font-size: 11.5px; padding: 2px 8px;">${ICONS.shieldTick} .ac.uk verified</span>
              </div>
              <div style="font-size: 13.5px; opacity: 0.8; margin-top: 2px;">
                ${escapeHtml(app.year || 'Senior')} · ${escapeHtml(app.major || 'Undergraduate')} @ <strong>${escapeHtml(app.university)}</strong>
              </div>
              <div style="font-size: 12.5px; opacity: 0.6; margin-top: 2px;">
                <code>${escapeHtml(app.email)}</code> · joined ${escapeHtml(toDisplayDate((app.submittedAt || '').slice(0, 10)))}
              </div>
            </div>
          </div>

          <!-- Mentors activate on sign-up. There is nothing to approve, so the
               only action here is to look at what went live. -->
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="doc-badge doc-badge--free">${ICONS.tickCircle} live</span>
            ${app.mentorId ? `
              <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 12px; padding: 5px 12px;" onclick="window.navigateTo('/mentor/${app.mentorId}')">
                view profile →
              </button>` : ''}
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6; margin-bottom: 6px;">Achievements</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${achievementsList.length > 0
              ? achievementsList.map(a => achievementSticker(a)).join('')
              : '<span style="font-size: 13px; opacity: 0.6;">None specified</span>'}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; align-items: stretch;">
          <div class="live-postit-preview" style="background: ${postitColour[0]}; border-color: ${postitColour[1]}; color: #171717; min-height: 110px;">
            <div class="live-postit-preview__pin"></div>
            <div class="live-postit-preview__text">“${escapeHtml(app.topTip || 'Always ask questions!')}”</div>
            <span class="live-postit-preview__author">— ${escapeHtml(String(app.name).split(' ')[0])}</span>
          </div>

          <div style="background: var(--color-warm-card); border: 1.5px solid rgba(23, 23, 23, 0.12); border-radius: 12px; padding: 14px 16px; font-size: 13px;">
            <div style="font-weight: 700; margin-bottom: 8px; color: var(--color-charcoal);">Live profile</div>
            ${mentor ? `
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <div>${(mentor.links || []).length} link${(mentor.links || []).length === 1 ? '' : 's'} · ${(mentor.docs || []).length} resource${(mentor.docs || []).length === 1 ? '' : 's'}</div>
                <div>${Object.values(mentor.weeklySchedule || {}).reduce((n, a) => n + a.length, 0)} weekly slots · ${mentor.callsCompleted || 0} calls completed</div>
                ${mentor.pitchVideoUrl ? `<div style="color: #16a34a;">${ICONS.video} has a pitch video</div>` : '<div style="opacity: 0.55;">No pitch video yet</div>'}
                ${(mentor.links || []).map(l => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${escapeHtml(l.label)} ↗</a>`).join('')}
              </div>
            ` : '<span style="opacity: 0.55;">Profile not found — it may have been removed.</span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAdminDashboard() {
  return `
    <div class="admin-dashboard-page">
      <div class="admin-dashboard-header">
        <h1 style="font-size: 32px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">
          Admin
        </h1>
        <p style="font-size: 15px; opacity: 0.75; max-width: 680px; margin-bottom: 24px; line-height: 1.5;">
          Mentors activate instantly on sign-up, so nothing here is a queue to approve. This is the
          record of who has joined, what students have reported, and what they have asked for.
        </p>

        <!-- Admin Stats Bar -->
        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <div class="admin-stat-num" id="admin-pending-count">–</div>
            <div class="admin-stat-label">Joined via sign-up</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-num" id="admin-mentor-count">–</div>
            <div class="admin-stat-label">Live Mentors</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-num" id="admin-booking-count">–</div>
            <div class="admin-stat-label">Sessions Booked</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 22px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin: 0;">
            Who has joined
          </h2>
          <button type="button" class="pill-btn pill-btn--subtle" onclick="window.initAdminDashboard()">
            ↻ Refresh
          </button>
        </div>

        <div id="admin-apps-list">
          <div style="text-align: center; padding: 40px; opacity: 0.6;">Loading…</div>
        </div>
      </div>

      <div style="margin-top: 36px;">
        <h2 style="font-size: 22px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin: 0 0 16px;">
          Reports
        </h2>
        <div id="admin-reports-list" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="text-align: center; padding: 20px; opacity: 0.6;">Loading…</div>
        </div>
      </div>

      <div style="margin-top: 36px;">
        <h2 style="font-size: 22px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin: 0 0 16px;">
          Student Requests
        </h2>
        <div id="admin-suggestions-list" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="text-align: center; padding: 20px; opacity: 0.6;">Loading…</div>
        </div>
      </div>
    </div>

    ${renderFooter()}
  `;
}
window.initAdminDashboard = initAdminDashboard;
window.renderAdminDashboard = renderAdminDashboard;

// ─── Mentor Account Portal & Authentication ─────


// ─── Live Mentors Sync & Navbar Status ────────────────
async function syncLiveMentors() {
  try {
    const backendMentors = await fetchMentors();
    if (!Array.isArray(backendMentors)) return;

    // The server is the roster, not an addition to it.
    //
    // This used to merge server mentors into the bundled demo list and never
    // remove anything, and it skipped entirely when the server returned an
    // empty array. After reset:launch that left every fabricated mentor on
    // screen — names, ratings, LinkedIn links and all — with Book buttons
    // pointing at people who do not exist. Replacing the array means an empty
    // server means an empty site, which is the honest answer.
    //
    // Replaced in place because MENTORS is a const binding shared by every
    // render path.
    MENTORS.length = 0;
    MENTORS.push(...backendMentors);

    const path = window.location.hash.replace(/^#/, '') || '/';
    if (path === '/' || path === '/browse') {
      renderPage();
    }
  } catch (e) {
    // Only a failed request keeps the bundled list, so the page still has
    // something to show when the API is unreachable.
    console.warn('[main] live mentors sync failed; keeping bundled list', e);
  }
}
window.syncLiveMentors = syncLiveMentors;

/** Shows "my sessions" in the navbar once a student has verified. */
function updateNavbarSessionLink() {
  const btn = document.getElementById('nav-my-sessions');
  if (btn) btn.hidden = !isVerified();
}
window.updateNavbarSessionLink = updateNavbarSessionLink;

function updateNavbarMentorStatus() {
  updateNavbarSessionLink();

  const session = getMentorSession();
  // The mentor session is null for a student, but they still have a verified
  // one and still need a way out of it.
  const verified = getSession();
  const toggleBtn = document.getElementById('nav-mentors-btn');
  const menu = document.getElementById('nav-mentors-menu');
  if (!toggleBtn || !menu) return;

  if (session && session.mentorId) {
    const firstName = (session.name || 'Mentor').split(' ')[0];
    toggleBtn.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
        <span style="font-weight: 700;">${firstName}'s portal</span>
      </span>
      <svg class="dropdown-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    `;
    menu.innerHTML = `
      <a href="/mentor-dashboard" class="navbar__dropdown-item" onclick="window.closeMentorsDropdown(); window.navigateTo('/mentor-dashboard')">
        <span class="dropdown-item-icon">📊</span>
        <div>
          <div class="dropdown-item-title">mentor dashboard</div>
          <div class="dropdown-item-desc">manage availability slots & products</div>
        </div>
      </a>
      <a href="/mentor/${session.mentorId}" class="navbar__dropdown-item" onclick="window.closeMentorsDropdown(); window.navigateTo('/mentor/${session.mentorId}')">
        <span class="dropdown-item-icon">👤</span>
        <div>
          <div class="dropdown-item-title">view my live profile</div>
          <div class="dropdown-item-desc">see how freshers view your card</div>
        </div>
      </a>
      <a href="#" class="navbar__dropdown-item" onclick="event.preventDefault(); window.closeMentorsDropdown(); window.mentorSignOut()">
        <span class="dropdown-item-icon">🚪</span>
        <div>
          <div class="dropdown-item-title">sign out</div>
          <div class="dropdown-item-desc">${session.email || ''}</div>
        </div>
      </a>
    `;
  } else {
    toggleBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L2 8L12 13L22 8L12 3Z"/><path d="M6 10.5V16C6 17.5 8.69 19.5 12 19.5C15.31 19.5 18 17.5 18 16V10.5"/><path d="M22 8V15"/></svg>
      <span>for mentors</span>
      <svg class="dropdown-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    `;
    menu.innerHTML = `
      <a href="/become-a-mentor" class="navbar__dropdown-item" onclick="window.closeMentorsDropdown(); window.navigateTo('/become-a-mentor')">
        <span class="dropdown-item-icon">🎓</span>
        <div>
          <div class="dropdown-item-title">become a mentor</div>
          <div class="dropdown-item-desc">instant setup · no interviews needed</div>
        </div>
      </a>
      <a href="/mentor-dashboard" class="navbar__dropdown-item" onclick="window.closeMentorsDropdown(); window.navigateTo('/mentor-dashboard')">
        <span class="dropdown-item-icon">🔑</span>
        <div>
          <div class="dropdown-item-title">mentor sign in</div>
          <div class="dropdown-item-desc">access your availability & earnings</div>
        </div>
      </a>
      ${verified && verified.email ? `
        <a href="#" class="navbar__dropdown-item" onclick="event.preventDefault(); window.closeMentorsDropdown(); window.studentSignOut()">
          <span class="dropdown-item-icon">🚪</span>
          <div>
            <div class="dropdown-item-title">sign out</div>
            <div class="dropdown-item-desc">${escapeHtml(verified.email)}</div>
          </div>
        </a>` : ''}
    `;
  }
}

/**
 * Ends a verified session that does not own a mentor profile.
 *
 * Sign-out used to live only inside the mentor branch of this menu, so a
 * student had no way to end their session at all. Sessions last thirty days
 * and sit in localStorage, which on a shared university machine means the
 * next person to sit down can book calls and download paid resources as them.
 */
async function studentSignOut() {
  try {
    await signOut();
  } catch (_) {
    // The session is going regardless — a failed call to the server should
    // not strand someone signed in on a machine they are trying to leave.
  }
  setSession(null);
  updateNavbarMentorStatus();
  showToast('Signed out.');
  navigateTo('/');
}
window.studentSignOut = studentSignOut;
window.updateNavbarMentorStatus = updateNavbarMentorStatus;

/**
 * Mentors no longer have a separate session store. There is one verified
 * session; it simply carries a mentorId when that email owns a mentor profile.
 */
function getMentorSession() {
  const session = getSession();
  if (!session || !session.mentorId) return null;
  return {
    mentorId: session.mentorId,
    email: session.email,
    name: session.name,
    university: session.university
  };
}
window.getMentorSession = getMentorSession;

async function mentorSignOut() {
  await signOut();
  mentorScheduleData = null;
  mentorLinksData = null;
  setUnlockedDocIds([]);
  showToast('Signed out.');
  updateNavbarMentorStatus();
  navigateTo('/');
  renderPage();
}
window.mentorSignOut = mentorSignOut;

/**
 * Mentors sign in the same way students do: through their university.
 *
 * This page used to send a six-digit code to a .ac.uk address, which is
 * exactly the path that did not work — Proofpoint and its equivalents were
 * accepting those messages and delivering them nowhere. A mentor locked out
 * of their own calendar and earnings by a filter they cannot see is worse
 * than a student who cannot book.
 *
 * The university's pseudonym owns the profile, so signing in restores it
 * whatever address they have since chosen for their mail.
 */
function renderMentorLogin() {
  return `
    <div class="mentor-login-page" style="min-height: 75vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
      <div style="background: #fff; border: 2px solid var(--color-charcoal); border-radius: 20px; box-shadow: var(--shadow-brutal-lg); max-width: 480px; width: 100%; padding: 36px 28px; text-align: center;">
        <div style="width: 58px; height: 58px; border-radius: 14px; background: #fff7ed; border: 2px solid var(--color-marker-orange); color: var(--color-marker-orange); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 26px;">
          🔑
        </div>
        <h1 style="font-size: 28px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin: 6px 0 10px 0;">
          mentor sign in
        </h1>
        <p style="font-size: 14px; opacity: 0.8; line-height: 1.5; margin-bottom: 24px;">
          Sign in to reach your availability, bookings and earnings.
        </p>
        <div id="mentor-auth-flow" style="text-align: left;"></div>
        <p style="font-size: 12.5px; opacity: 0.6; margin-top: 20px; line-height: 1.5;">
          No mentor profile yet? <a href="/become-a-mentor" onclick="event.preventDefault(); window.navigateTo('/become-a-mentor')" style="color: var(--color-marker-orange); font-weight: 700;">become a mentor</a> — it takes a couple of minutes.
        </p>
      </div>
    </div>
    ${renderFooter()}
  `;
}

/** Hands the sign-in card to the shared auth flow once it is in the DOM. */
function initMentorLoginPage() {
  renderAuthFlow({
    host: document.getElementById('mentor-auth-flow'),
    actionName: 'reach your mentor dashboard',
    onSignedIn: () => { navigateTo('/mentor-dashboard'); }
  });
}
window.initMentorLoginPage = initMentorLoginPage;


let activeDashboardTab = 'schedule';
let mentorScheduleData = null;

function renderMentorDashboard() {
  const session = getMentorSession();
  if (!session) {
    return renderMentorLogin();
  }

  const currentMentor = MENTORS.find(m => m.id === parseInt(session.mentorId)) || {
    id: session.mentorId,
    name: session.name || 'Senior Mentor',
    university: session.university || 'UK University',
    major: 'Degree',
    bio: '',
    topTip: '',
    avatarId: 1
  };

  return `
    <div class="mentor-portal-page">
      <div class="mentor-portal-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
          <div>
            <span class="doc-badge doc-badge--free" style="margin-bottom: 8px;">Mentor Account Portal</span>
            <h1 style="font-size: 32px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">
              Manage Your frea Profile & Schedule
            </h1>
            <p style="font-size: 14.5px; opacity: 0.75; margin: 0;">
              Control your 1-on-1 call availability slots, edit your bio and top 3 achievements, and manage your freabies & playbooks.
            </p>
          </div>

          <!-- Authenticated Mentor Account Header -->
          <div style="background: #fff; border: 1.5px solid var(--color-charcoal); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 2px 2px 0 var(--color-charcoal);">
            <div style="width: 42px; height: 42px; border-radius: 8px; overflow: hidden; background: #f3f4f6; flex-shrink: 0;">
              ${getMentorAvatar(currentMentor.avatarId || currentMentor.id, 42)}
            </div>
            <div style="text-align: left;">
              <div style="font-size: 14px; font-weight: 800; color: var(--color-charcoal);">${escapeHtml(currentMentor.name)}</div>
              <div style="font-size: 11.5px; opacity: 0.65;">${escapeHtml(session.email)} · ${escapeHtml(currentMentor.university)}</div>
            </div>
            <button type="button" class="pill-btn pill-btn--subtle" style="padding: 4px 10px; font-size: 11.5px; margin-left: 6px;" onclick="window.mentorSignOut()" title="Sign out of your mentor portal">
              Sign Out
            </button>
          </div>
        </div>

        <!-- Portal Tabs Navigation -->
        <div class="mentor-portal-tabs">
          <button type="button" class="portal-tab-btn ${activeDashboardTab === 'schedule' ? 'active' : ''}" onclick="window.switchMentorPortalTab('schedule')">
            ${ICONS.calendar} 1. Availability
          </button>
          <button type="button" class="portal-tab-btn ${activeDashboardTab === 'profile' ? 'active' : ''}" onclick="window.switchMentorPortalTab('profile')">
            ${ICONS.edit} 2. Profile
          </button>
          <button type="button" class="portal-tab-btn ${activeDashboardTab === 'resources' ? 'active' : ''}" onclick="window.switchMentorPortalTab('resources')">
            ${ICONS.gift} 3. Resources
          </button>
        </div>
      </div>

      <!-- Tab 1: Availability Schedule CRUD -->
      <div id="portal-tab-schedule" style="display: ${activeDashboardTab === 'schedule' ? 'block' : 'none'}; margin-top: 28px;">
        <!-- Booked sessions -->
        <div class="portal-card" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">
                Your Booked Sessions
              </h2>
              <p style="font-size: 13.5px; opacity: 0.7; margin: 0;">
                Students who've booked you. Each one has the same video link and calendar invite you were emailed.
              </p>
            </div>
            <span class="doc-badge doc-badge--free"><span id="portal-upcoming-count">0</span> upcoming</span>
          </div>
          <div id="portal-bookings-list" style="display: flex; flex-direction: column; gap: 10px;">
            <div style="padding: 16px; text-align: center; opacity: 0.6; font-size: 13.5px;">loading your diary…</div>
          </div>
        </div>

        <div class="portal-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">
                Weekly Call Availability
              </h2>
              <p style="font-size: 13.5px; opacity: 0.7; margin: 0;">
                Add or remove 20-minute time slots for each day of the week. Freshers can only book during these designated times.
              </p>
            </div>
            <button type="button" id="save-schedule-btn" class="pill-btn pill-btn--animated" onclick="window.saveMentorSchedule()">
              <span class="pill-btn__inner">
                <span>save availability</span>
                <span class="pill-btn__arrow">✓</span>
              </span>
            </button>
          </div>

          <div id="portal-schedule-summary" style="font-size: 13px; font-weight: 700; color: var(--color-marker-orange); margin-bottom: 14px;"></div>

          <!-- Schedule Days Table -->
          <div id="portal-schedule-days-container" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <!-- Populated dynamically by initMentorDashboard -->
          </div>

          <!-- Add Slot Inline Row -->
          <div style="background: var(--color-dew-drop); border: 1.5px dashed rgba(23, 23, 23, 0.25); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="font-weight: 700; font-size: 13.5px; color: var(--color-charcoal);">${ICONS.plus} Add slot:</span>
            <select id="new-slot-day" class="mentor-form-select" style="width: 140px; padding: 8px 12px;">
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="0">Sunday</option>
            </select>
            <input type="text" id="new-slot-time" class="mentor-form-input" style="width: 120px; padding: 8px 12px; text-align: center;" placeholder="e.g. 17:30" value="18:00" onkeydown="if(event.key==='Enter'){event.preventDefault();window.addScheduleSlot();}">
            <button type="button" class="pill-btn pill-btn--subtle" onclick="window.addScheduleSlot()">
              + Add Slot
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: Profile & Top 3 Achievements CRUD -->
      <div id="portal-tab-profile" style="display: ${activeDashboardTab === 'profile' ? 'block' : 'none'}; margin-top: 28px;">
        <div class="portal-card">
          <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">
            Edit Profile & Top 3 Achievements
          </h2>
          <p style="font-size: 13.5px; opacity: 0.7; margin-bottom: 20px;">
            Keep your achievements and fresher advice up-to-date.
          </p>

          <form id="portal-profile-form" onsubmit="window.saveMentorProfile(event)">
            <div class="mentor-form-group">
              <label class="mentor-form-label">Bio / Profile Headline</label>
              <textarea class="mentor-form-textarea" id="mp-bio" rows="2" required>${currentMentor.bio || ''}</textarea>
            </div>

            <!-- Top 3 Achievements Inputs -->
            <div class="mentor-form-group">
              <label class="mentor-form-label">Your Top 3 Achievements <span>*</span></label>
              <span style="font-size: 12px; opacity: 0.65; display: block; margin-bottom: 8px;">These appear as badges directly on your mentor profile.</span>
              <div class="mentor-achievements-inputs">
                <div class="mentor-achieve-field">
                  <span class="mentor-achieve-num">1</span>
                  <input type="text" class="mentor-form-input" id="mp-achieve-1" value="${currentMentor.achievements?.[0] || ''}" required placeholder="e.g. Incoming Software Engineer @ Stripe" maxlength="75">
                </div>
                <div class="mentor-achieve-field">
                  <span class="mentor-achieve-num">2</span>
                  <input type="text" class="mentor-form-input" id="mp-achieve-2" value="${currentMentor.achievements?.[1] || ''}" placeholder="e.g. Founded YC backed startup" maxlength="75">
                </div>
                <div class="mentor-achieve-field">
                  <span class="mentor-achieve-num">3</span>
                  <input type="text" class="mentor-form-input" id="mp-achieve-3" value="${currentMentor.achievements?.[2] || ''}" placeholder="e.g. 1st Class Honours (Rank 1)" maxlength="75">
                </div>
              </div>
            </div>

            <!-- Top Tip & Post-it Color -->
            <div class="mentor-form-group">
              <label class="mentor-form-label">Top Tip for Freshers (Post-It Note)</label>
              <textarea class="mentor-form-textarea" id="mp-toptip" rows="2" maxlength="140" required>${currentMentor.topTip || ''}</textarea>
              <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 13px; font-weight: 600;">Post-It Color:</span>
                <label><input type="radio" name="mp-postit-color" value="yellow" ${currentMentor.topTipColor === 'yellow' || !currentMentor.topTipColor ? 'checked' : ''}> Yellow</label>
                <label><input type="radio" name="mp-postit-color" value="mint" ${currentMentor.topTipColor === 'mint' ? 'checked' : ''}> Mint</label>
                <label><input type="radio" name="mp-postit-color" value="blush" ${currentMentor.topTipColor === 'blush' ? 'checked' : ''}> Blush</label>
                <label><input type="radio" name="mp-postit-color" value="sky" ${currentMentor.topTipColor === 'sky' ? 'checked' : ''}> Sky</label>
              </div>
            </div>

            <div class="mentor-form-group">
              <label class="mentor-form-label">90-Second Pitch Video <span>(optional — record here or upload)</span></label>
              <div id="portal-pitch-container"></div>
            </div>

            <div class="mentor-form-group">
              <label class="mentor-form-label">Your Links <span>(LinkedIn, GitHub, portfolio, Substack — add as many as you like)</span></label>
              <div id="portal-links-container"></div>
            </div>

            <div style="margin-top: 24px;">
              <button type="submit" class="pill-btn pill-btn--animated">
                <span class="pill-btn__inner">
                  <span>save profile</span>
                  <span class="pill-btn__arrow">✓</span>
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tab 3: Freabies & Playbooks CRUD -->
      <div id="portal-tab-resources" style="display: ${activeDashboardTab === 'resources' ? 'block' : 'none'}; margin-top: 28px;">
        <div class="portal-card" style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">
            Your Published Resources
          </h2>
          <p style="font-size: 13.5px; opacity: 0.7; margin-bottom: 16px;">
            Manage existing study guides or publish a new freabie/playbook for UK students.
          </p>

          <div id="portal-resources-list" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Populated dynamically -->
          </div>
        </div>

        <!-- Sales & payouts -->
        <div id="portal-payouts-card" style="margin-bottom: 24px;"></div>

        <div class="portal-card" style="margin-bottom: 24px; background: #fafaf9;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">
                Playbook Sales & Payout Analytics
              </h2>
              <p style="font-size: 13.5px; opacity: 0.75; margin: 0;">
                Students pay your listed price. frea's 5% fee comes out of your share, not theirs —
                so a £10 playbook means £9.50 to you and 50p to frea for hosting.
              </p>
            </div>
            <span class="doc-badge doc-badge--free">you keep 95% · frea 5%</span>
          </div>

          <div id="portal-orders-summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <div style="background: #ffffff; border: 1.5px solid var(--color-charcoal); border-radius: 12px; padding: 14px 16px;">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Gross Sales</div>
              <div id="po-gross-sales" style="font-size: 24px; font-weight: 900; color: var(--color-charcoal); font-family: var(--font-display);">£0.00</div>
            </div>
            <div style="background: #ffffff; border: 1.5px solid #16a34a; border-radius: 12px; padding: 14px 16px;">
              <div id="po-payout-label" style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #16a34a; margin-bottom: 4px;">your payout (95%)</div>
              <div id="po-creator-profit" style="font-size: 24px; font-weight: 900; color: #16a34a; font-family: var(--font-display);">£0.00</div>
            </div>
            <div style="background: #ffffff; border: 1.5px solid var(--color-charcoal); border-radius: 12px; padding: 14px 16px;">
              <div id="po-fee-label" style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">frea fee (5%)</div>
              <div id="po-frea-cut" style="font-size: 24px; font-weight: 900; color: var(--color-charcoal); font-family: var(--font-display);">£0.00</div>
            </div>
            <div style="background: #ffffff; border: 1.5px solid var(--color-charcoal); border-radius: 12px; padding: 14px 16px;">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Total Orders</div>
              <div id="po-total-orders" style="font-size: 24px; font-weight: 900; color: var(--color-charcoal); font-family: var(--font-display);">0</div>
            </div>
          </div>

          <div id="portal-orders-table" style="font-size: 13px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Publish New Resource Form -->
        <div class="portal-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin: 0;">
              Publish New Freabie or Playbook
            </h2>
            <span class="doc-badge doc-badge--free">${feeBadgeText()}</span>
          </div>

          <div class="academic-integrity-callout">
            <span style="font-size: 18px; flex-shrink: 0;">⚠️</span>
            <div>
              <strong>Academic Integrity Notice:</strong> All uploads must strictly adhere to UK university academic conduct codes. Only upload original notes, walkthroughs, or templates (no unauthorized exam materials, solutions to live assignments, or plagiarized work).
            </div>
          </div>

          <form id="portal-new-resource-form" onsubmit="window.publishDashboardResource(event)">
            <div class="mentor-form-row" style="margin-bottom: 12px;">
              <div class="mentor-form-group" style="flex: 2; margin-bottom: 0;">
                <label class="mentor-form-label" style="font-size: 12.5px;">Resource Title *</label>
                <input type="text" class="mentor-form-input" id="pr-title" required placeholder="e.g. Organic Chemistry Mechanism Cheat Sheet or Spring Week Tracker">
              </div>
              <div class="mentor-form-group" style="flex: 1; margin-bottom: 0;">
                <label class="mentor-form-label" style="font-size: 12.5px;">Pricing Model</label>
                <select class="mentor-form-select" id="pr-type" onchange="window.toggleDocPriceField(this.value, 'pr-price-wrap')">
                  <option value="free">Freabie (Free)</option>
                  <option value="paid">Playbook (Paid)</option>
                </select>
              </div>
            </div>

            <div class="mentor-form-row" style="margin-bottom: 12px;">
              <div class="mentor-form-group" style="flex: 1; margin-bottom: 0;">
                <label class="mentor-form-label" style="font-size: 12.5px;">Category Tag</label>
                <select class="mentor-form-select" id="pr-category">
                  <option value="Tech & Coding">Tech & Coding</option>
                  <option value="Economics & Finance">Economics & Finance</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Law">Law</option>
                  <option value="Medicine & Life Sciences">Medicine & Life Sciences</option>
                  <option value="Maths & Statistics">Maths & Statistics</option>
                  <option value="Interview Prep & CVs">Interview Prep & CVs</option>
                  <option value="Exam Bibles & Revision">Exam Bibles & Revision</option>
                  <option value="Productivity & Systems">Productivity & Systems</option>
                  <option value="General">General / Other</option>
                </select>
              </div>
              <div class="mentor-form-group" id="pr-price-wrap" style="flex: 1; display: none; margin-bottom: 0;">
                <label class="mentor-form-label" style="font-size: 12.5px;">Price (£ GBP)</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <span style="position: absolute; left: 12px; font-weight: 800; color: var(--color-charcoal);">£</span>
                  <input type="number" class="mentor-form-input" id="pr-price" min="1" max="100" step="0.01" value="4.99" disabled style="padding-left: 26px;" oninput="window.updatePayoutPreview('pr-price', 'pr-payout')">
                </div>
                <div id="pr-payout" style="font-size: 12.5px; margin-top: 6px; line-height: 1.5;"></div>
                </div>
            </div>

            <div class="mentor-form-group" style="margin-bottom: 14px;">
              <label class="mentor-form-label" style="font-size: 12.5px;">Short Subtitle / Key Takeaway</label>
              <input type="text" class="mentor-form-input" id="pr-desc" placeholder="e.g. 15-page distilled breakdown with annotated exam past paper questions">
            </div>
            <div class="mentor-form-group" style="margin-bottom: 14px;">
              <label class="mentor-form-label" style="font-size: 12.5px;">What's Inside <span>(optional · up to 3 lines students see before downloading)</span></label>
              <input type="text" class="mentor-form-input" id="pr-bullet-1" maxlength="160" placeholder="e.g. The exact bullet formula that gets past ATS screens" style="margin-bottom: 6px;">
              <input type="text" class="mentor-form-input" id="pr-bullet-2" maxlength="160" placeholder="e.g. Six phrases recruiters skim past, and what to write instead" style="margin-bottom: 6px;">
              <input type="text" class="mentor-form-input" id="pr-bullet-3" maxlength="160" placeholder="e.g. A worked before-and-after on a real first-year CV">
            </div>

            <!-- Real Document Upload Dropzone -->
            <div class="mentor-form-group">
              <label class="mentor-form-label" style="font-size: 12.5px;">Upload Study Document * <span>(PDF, Markdown .md, LaTeX .tex, PowerPoint .pptx · Max 10MB)</span></label>
              <div class="file-dropzone" id="pr-dropzone">
                <input type="file" id="pr-file" accept=".pdf,.md,.tex,.pptx" required onchange="window.handleDocumentFileSelect(event, 'pr-file-preview', 'pr-uploaded-file')">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                  <span style="color: var(--color-marker-orange);">${ICONS.documentDownload}</span>
                  <div style="font-size: 13.5px; font-weight: 700; color: var(--color-charcoal);">Click to browse or drop your document here</div>
                  <span style="font-size: 11.5px; opacity: 0.65;">Accepts PDF, Markdown, LaTeX, PowerPoint (up to 10MB)</span>
                </div>
              </div>
              <div id="pr-file-preview" style="display: none;"></div>
              <input type="hidden" id="pr-uploaded-file" value="">
              <input type="hidden" id="pr-uploaded-format" value="">
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="pill-btn pill-btn--animated" id="pr-submit-btn">
                <span class="pill-btn__inner">
                  <span>upload & publish resource</span>
                  <span class="pill-btn__arrow">↑</span>
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      ${renderFooter()}
    </div>
  `;
}
window.renderMentorDashboard = renderMentorDashboard;

function switchMentorPortalTab(tab) {
  activeDashboardTab = tab;
  renderPage();
}
window.switchMentorPortalTab = switchMentorPortalTab;

function toggleMentorsDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('nav-mentors-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}
window.toggleMentorsDropdown = toggleMentorsDropdown;

function closeMentorsDropdown() {
  const dropdown = document.getElementById('nav-mentors-dropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
}
window.closeMentorsDropdown = closeMentorsDropdown;

// Availability is held in the canonical shape the server uses:
// { "0".."6": ["17:00", ...] }. The editor shows day names and friendly times,
// but never stores them — that mismatch is what used to wipe a mentor's
// calendar the moment they pressed save.
const DEFAULT_SCHEDULE = {
  '1': ['17:00', '18:00'],
  '2': ['18:00', '19:00'],
  '3': ['16:30', '17:30'],
  '4': ['18:00'],
  '5': ['17:00', '18:30']
};

/** Mirrors server/time.js normaliseSchedule for locally-edited rotas. */
function normaliseScheduleClient(schedule) {
  const out = {};
  if (!schedule || typeof schedule !== 'object') return out;

  for (const [key, value] of Object.entries(schedule)) {
    if (!Array.isArray(value)) continue;
    const k = String(key).trim();
    let idx = null;

    if (/^[0-6]$/.test(k)) idx = parseInt(k, 10);
    else {
      const lower = k.toLowerCase();
      const full = DAY_NAMES.findIndex(d => d.toLowerCase() === lower);
      idx = full !== -1 ? full : DAY_SHORT.findIndex(d => d.toLowerCase() === lower);
      if (idx === -1) idx = null;
    }
    if (idx === null) continue;

    const times = value.map(toCanonicalTime).filter(Boolean)
      .filter((t, i, arr) => arr.indexOf(t) === i).sort();
    if (times.length) out[String(idx)] = times;
  }
  return out;
}

/**
 * The signed-in mentor's own record. Never falls back to another mentor:
 * `|| MENTORS[0]` used to hand a mentor whose id was outside the bundled range
 * someone else's resources, and pointed profile saves at the wrong account.
 */
function resolveSessionMentor() {
  const session = getMentorSession();
  if (!session) return null;

  const found = MENTORS.find(m => m.id === parseInt(session.mentorId));
  if (found) return found;

  // Not synced yet — build a stub from the session and register it, so every
  // caller sees the same object and later syncs merge into it.
  const stub = {
    id: parseInt(session.mentorId),
    name: session.name || 'Senior Mentor',
    university: session.university || 'UK University',
    major: 'Degree',
    year: '',
    bio: '',
    topTip: '',
    topTipColor: 'yellow',
    achievements: [],
    helpsWith: [],
    links: [],
    weeklySchedule: {},
    docs: [],
    rating: 5.0,
    callsCompleted: 0,
    avatarId: 1
  };
  MENTORS.push(stub);
  return stub;
}
window.resolveSessionMentor = resolveSessionMentor;

function initMentorDashboard() {
  const session = getMentorSession();
  if (!session) return;

  const currentMentor = resolveSessionMentor();

  if (!mentorScheduleData) {
    const existing = currentMentor.weeklySchedule;
    mentorScheduleData = existing && Object.keys(existing).length
      ? normaliseScheduleClient(existing)
      : JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  }

  renderScheduleEditor();
  renderMentorLinksEditor(currentMentor);
  renderPitchVideoControl('portal-pitch-container', currentMentor.pitchVideoUrl || '');
  renderMentorResourceList(currentMentor);
  loadMentorEarnings(currentMentor.id);
  loadMentorDiary(currentMentor.id);
  loadPayoutStatus();
  handlePayoutReturn(getRoute());
}
window.initMentorDashboard = initMentorDashboard;

function renderScheduleEditor() {
  const container = document.getElementById('portal-schedule-days-container');
  if (!container) return;

  // Monday-first, which is how UK students think about a week.
  const order = [1, 2, 3, 4, 5, 6, 0];

  container.innerHTML = order.map(idx => {
    const slots = mentorScheduleData[String(idx)] || [];
    return `
      <div class="schedule-day-row">
        <div style="width: 120px; font-weight: 800; font-size: 14.5px; color: var(--color-charcoal);">${DAY_NAMES[idx]}</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; flex: 1; align-items: center;">
          ${slots.length > 0 ? slots.map(slot => `
            <span class="schedule-slot-chip">
              <span>${toDisplayTime(slot)}</span>
              <button type="button" class="schedule-slot-remove" onclick="window.removeScheduleSlot('${idx}', '${slot}')" title="Remove slot">×</button>
            </span>
          `).join('') : '<span style="font-size: 12.5px; opacity: 0.5;">No availability set</span>'}
        </div>
      </div>
    `;
  }).join('');

  const total = Object.values(mentorScheduleData).reduce((n, a) => n + a.length, 0);
  const summary = document.getElementById('portal-schedule-summary');
  if (summary) {
    summary.textContent = total === 0
      ? 'You have no slots set — students cannot book you yet.'
      : `${total} slot${total === 1 ? '' : 's'} a week, repeating. Students can book any of them.`;
  }
}

function removeScheduleSlot(dayIdx, slot) {
  const key = String(dayIdx);
  if (mentorScheduleData && mentorScheduleData[key]) {
    mentorScheduleData[key] = mentorScheduleData[key].filter(s => s !== slot);
    if (!mentorScheduleData[key].length) delete mentorScheduleData[key];
    renderScheduleEditor();
  }
}
window.removeScheduleSlot = removeScheduleSlot;

function addScheduleSlot() {
  const dayIdx = document.getElementById('new-slot-day')?.value;
  const timeInput = document.getElementById('new-slot-time');
  const raw = timeInput ? timeInput.value.trim() : '';

  const time = toCanonicalTime(raw);
  if (!time) {
    showToast('Enter a time like 17:30 or 5:30 PM.');
    return;
  }

  const key = String(dayIdx);
  if (!mentorScheduleData[key]) mentorScheduleData[key] = [];

  if (mentorScheduleData[key].includes(time)) {
    showToast(`${toDisplayTime(time)} is already set for ${DAY_NAMES[parseInt(key)]}.`);
    return;
  }

  mentorScheduleData[key].push(time);
  mentorScheduleData[key].sort();
  renderScheduleEditor();
  showToast(`Added ${toDisplayTime(time)} on ${DAY_NAMES[parseInt(key)]}.`);
}
window.addScheduleSlot = addScheduleSlot;

async function saveMentorSchedule() {
  const session = getMentorSession();
  if (!session) return;

  const btn = document.getElementById('save-schedule-btn');
  if (btn) { btn.disabled = true; btn.innerText = 'saving...'; }

  try {
    const updated = await updateMentorSchedule(session.mentorId, mentorScheduleData);

    // Keep the in-memory mentor in step so the profile preview matches.
    const mentor = MENTORS.find(m => m.id === parseInt(session.mentorId));
    if (mentor) mentor.weeklySchedule = updated.weeklySchedule;
    mentorScheduleData = normaliseScheduleClient(updated.weeklySchedule);

    renderScheduleEditor();
    showToast('Availability saved — students can book these slots now.');
  } catch (err) {
    showToast(err.message || 'Could not save your availability.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerText = 'save availability'; }
  }
}
window.saveMentorSchedule = saveMentorSchedule;

// ─── Links: mentors may add as many as they like ─────

let mentorLinksData = null;

function renderMentorLinksEditor(mentor) {
  const container = document.getElementById('portal-links-container');
  if (!container) return;

  if (!mentorLinksData) {
    mentorLinksData = Array.isArray(mentor.links) && mentor.links.length
      ? mentor.links.map(l => ({ ...l }))
      : [mentor.linkedin ? { label: 'LinkedIn', url: mentor.linkedin } : null].filter(Boolean);
  }

  container.innerHTML = `
    ${mentorLinksData.length === 0
      ? '<div style="font-size: 13px; opacity: 0.55; padding: 4px 0 10px;">No links yet. Add your LinkedIn, GitHub, portfolio, Substack — as many as you want.</div>'
      : mentorLinksData.map((link, i) => `
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap;">
          <input type="text" class="mentor-form-input" style="width: 150px; padding: 8px 12px; font-size: 13px;"
                 value="${escapeHtml(link.label || '')}" placeholder="Label"
                 oninput="window.updateMentorLink(${i}, 'label', this.value)">
          <input type="url" class="mentor-form-input" style="flex: 1; min-width: 220px; padding: 8px 12px; font-size: 13px;"
                 value="${escapeHtml(link.url || '')}" placeholder="https://…"
                 oninput="window.updateMentorLink(${i}, 'url', this.value)">
          <button type="button" class="schedule-slot-remove" style="font-size: 18px;" title="Remove link"
                  onclick="window.removeMentorLink(${i})">×</button>
        </div>
      `).join('')}
    <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 12.5px; padding: 6px 14px; margin-top: 4px;" onclick="window.addMentorLink()">
      ${ICONS.plus} add another link
    </button>
  `;
}

function addMentorLink() {
  if (!mentorLinksData) mentorLinksData = [];
  mentorLinksData.push({ label: '', url: '' });
  const mentor = resolveSessionMentor();
  if (mentor) renderMentorLinksEditor(mentor);
}
window.addMentorLink = addMentorLink;

function updateMentorLink(index, field, value) {
  if (mentorLinksData && mentorLinksData[index]) mentorLinksData[index][field] = value;
}
window.updateMentorLink = updateMentorLink;

function removeMentorLink(index) {
  if (!mentorLinksData) return;
  mentorLinksData.splice(index, 1);
  const mentor = resolveSessionMentor();
  if (mentor) renderMentorLinksEditor(mentor);
}
window.removeMentorLink = removeMentorLink;

// ─── Published resources ─────

function renderMentorResourceList(currentMentor) {
  const container = document.getElementById('portal-resources-list');
  if (!container) return;

  const mentorDocs = currentMentor.docs || [];
  if (mentorDocs.length === 0) {
    container.innerHTML = `<div style="padding: 16px; text-align: center; opacity: 0.6; font-size: 13.5px;">You haven't published anything yet. Add your first freabie or playbook below.</div>`;
    return;
  }

  container.innerHTML = mentorDocs.map(doc => `
    <div class="portal-resource-row">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="doc-badge ${doc.type === 'paid' ? 'doc-badge--paid' : 'doc-badge--free'}">
          ${doc.type === 'paid' ? `£${Number(doc.price).toFixed(2)}` : 'Freabie'}
        </span>
        <div>
          <div style="font-weight: 700; font-size: 14px; color: var(--color-charcoal);">${escapeHtml(doc.title)}</div>
          <div style="font-size: 12px; opacity: 0.6;">${escapeHtml(doc.format || 'Document')} · ${doc.downloads || 0} download${doc.downloads === 1 ? '' : 's'}</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        ${doc.type === 'paid' ? `
          <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 11px; padding: 4px 10px;" onclick="window.editResourcePrice('${escapeHtml(doc.id)}')">
            edit price
          </button>` : `
          <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 11px; padding: 4px 10px;" onclick="window.editResourcePrice('${escapeHtml(doc.id)}')">
            set a price
          </button>`}
        <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 11px; padding: 4px 10px;" onclick="window.downloadDoc('${escapeHtml(doc.id)}')">
          ${ICONS.download}
        </button>
        <button type="button" class="admin-btn admin-btn--reject" style="font-size: 11px; padding: 4px 10px;" onclick="window.deleteMentorResource('${escapeHtml(doc.id)}')">
          ${ICONS.trash || 'Delete'}
        </button>
      </div>
    </div>
  `).join('');
}

/** Switch a resource between freabie and priced playbook, in place. */
async function editResourcePrice(docId) {
  const session = getMentorSession();
  const mentor = MENTORS.find(m => m.id === parseInt(session?.mentorId));
  const doc = (mentor?.docs || []).find(d => d.id === docId);
  if (!doc) return;

  const raw = prompt(
    `Price for "${escapeHtml(doc.title)}" in pounds.\n\nEnter 0 to make it a free freabie, or £1.00–£100.00 to sell it.`,
    doc.type === 'paid' ? String(doc.price) : '0'
  );
  if (raw === null) return;

  const value = parseFloat(raw);
  if (Number.isNaN(value) || value < 0) {
    showToast('Enter a number, for example 4.99.');
    return;
  }

  try {
    const updated = await updateResource(docId, value === 0
      ? { type: 'free' }
      : { type: 'paid', price: value });

    Object.assign(doc, { type: updated.type, price: updated.price });
    renderMentorResourceList(mentor);
    showToast(value === 0
      ? `"${escapeHtml(doc.title)}" is now a free freabie.`
      : `"${escapeHtml(doc.title)}" is now £${Number(updated.price).toFixed(2)}.`);
  } catch (err) {
    showToast(err.message || 'Could not update the price.');
  }
}
window.editResourcePrice = editResourcePrice;

// ─── Earnings ─────

async function loadMentorEarnings(mentorId) {
  const grid = document.getElementById('portal-orders-summary-grid');
  if (!grid) return;

  const data = await fetchMentorOrders(mentorId);

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set('po-gross-sales', `£${Number(data.totalGrossSales || 0).toFixed(2)}`);
  set('po-creator-profit', `£${Number(data.mentorPayout || 0).toFixed(2)}`);
  set('po-frea-cut', `£${Number(data.freaPlatformFee || 0).toFixed(2)}`);
  set('po-total-orders', String(data.totalOrders || 0));

  const feeLabel = document.getElementById('po-fee-label');
  if (feeLabel) feeLabel.textContent = `frea fee (${data.feeRatePercent ?? 5}%)`;
  const payoutLabel = document.getElementById('po-payout-label');
  if (payoutLabel) payoutLabel.textContent = `your payout (${100 - (data.feeRatePercent ?? 5)}%)`;

  const table = document.getElementById('portal-orders-table');
  if (!table) return;

  if (!data.orders || data.orders.length === 0) {
    table.innerHTML = `
      <div style="padding: 20px; text-align: center; opacity: 0.6; font-size: 13.5px;">
        No sales yet.${data.freeDownloads ? ` Your freabies have been downloaded ${data.freeDownloads} time${data.freeDownloads === 1 ? '' : 's'} though.` : ''}
      </div>
    `;
    return;
  }

  table.innerHTML = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="text-align: left; border-bottom: 1.5px solid rgba(23,23,23,0.15);">
            <th style="padding: 8px 6px;">Playbook</th>
            <th style="padding: 8px 6px;">Buyer</th>
            <th style="padding: 8px 6px;">Date</th>
            <th style="padding: 8px 6px; text-align: right;">Sale</th>
            <th style="padding: 8px 6px; text-align: right; color: #16a34a;">You keep</th>
          </tr>
        </thead>
        <tbody>
          ${data.orders.map(o => `
            <tr style="border-bottom: 1px solid rgba(23,23,23,0.07);">
              <td style="padding: 8px 6px; font-weight: 600;">${escapeHtml(o.resourceTitle)}</td>
              <td style="padding: 8px 6px; opacity: 0.7;">${escapeHtml(o.buyerEmail)}</td>
              <td style="padding: 8px 6px; opacity: 0.7;">${escapeHtml(toDisplayDate((o.paidAt || '').slice(0, 10)))}</td>
              <td style="padding: 8px 6px; text-align: right;">£${Number(o.totalAmount).toFixed(2)}</td>
              <td style="padding: 8px 6px; text-align: right; color: #16a34a; font-weight: 700;">£${Number(o.mentorPayout).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ─── Booking diary ─────

async function loadMentorDiary(mentorId) {
  const container = document.getElementById('portal-bookings-list');
  if (!container) return;

  const data = await fetchMentorBookings(mentorId);
  const { upcoming = [], past = [] } = data;

  const countEl = document.getElementById('portal-upcoming-count');
  if (countEl) countEl.textContent = String(upcoming.length);

  if (!upcoming.length && !past.length) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; opacity: 0.6; font-size: 13.5px;">
        No sessions booked yet. Make sure you have availability set above — that's what students book against.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    ${upcoming.length ? upcoming.map(b => `
      <div class="portal-resource-row">
        <div>
          <div style="font-weight: 700; font-size: 14px; color: var(--color-charcoal);">
            ${escapeHtml(toLongDisplayDate(b.date))} · ${escapeHtml(b.displayTime || toDisplayTime(b.time))}
          </div>
          <div style="font-size: 12.5px; opacity: 0.7;">with ${escapeHtml(b.studentEmail)}</div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a href="${escapeHtml(b.meetingUrl || '')}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-btn--dark" style="text-decoration: none; font-size: 11.5px; padding: 4px 12px;">join</a>
          <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 11.5px; padding: 4px 12px;" onclick="window.downloadBookingInvite('${escapeHtml(b.id)}')">.ics</button>
          <button type="button" class="admin-btn admin-btn--reject" style="font-size: 11.5px; padding: 4px 12px;" onclick="window.mentorCancelBooking('${escapeHtml(b.id)}')">cancel</button>
        </div>
      </div>
    `).join('') : '<div style="padding: 14px; text-align: center; opacity: 0.6; font-size: 13.5px;">Nothing upcoming.</div>'}

    ${past.length ? `
      <div style="margin-top: 18px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.5;">Past sessions (${past.length})</div>
      ${past.slice(0, 5).map(b => `
        <div class="portal-resource-row" style="opacity: 0.6;">
          <div>
            <div style="font-weight: 700; font-size: 13.5px;">${escapeHtml(toLongDisplayDate(b.date))} · ${escapeHtml(b.displayTime || toDisplayTime(b.time))}</div>
            <div style="font-size: 12px; opacity: 0.7;">with ${escapeHtml(b.studentEmail)}</div>
          </div>
        </div>
      `).join('')}` : ''}
  `;
}

async function mentorCancelBooking(bookingId) {
  if (!confirm('Cancel this session? The student will be emailed and the slot reopens.')) return;
  try {
    await cancelBooking(bookingId);
    showToast('Session cancelled and the student notified.');
    const session = getMentorSession();
    loadMentorDiary(session.mentorId);
  } catch (err) {
    showToast(err.message || 'Could not cancel that session.');
  }
}
window.mentorCancelBooking = mentorCancelBooking;

async function saveMentorProfile(e) {
  e.preventDefault();
  const currentMentor = resolveSessionMentor();
  if (!currentMentor) {
    showToast('Please sign in to your mentor account first.');
    return;
  }
  const bio = document.getElementById('mp-bio')?.value.trim();
  const a1 = document.getElementById('mp-achieve-1')?.value.trim();
  const a2 = document.getElementById('mp-achieve-2')?.value.trim();
  const a3 = document.getElementById('mp-achieve-3')?.value.trim();
  const achievements = [a1, a2, a3].filter(Boolean);
  const topTip = document.getElementById('mp-toptip')?.value.trim();
  const colorInput = document.querySelector('input[name="mp-postit-color"]:checked');
  const topTipColor = colorInput ? colorInput.value : 'yellow';
  // Uploaded separately via /api/upload/pitch-video — never sent from this form,
  // or saving the profile would wipe a video the mentor just recorded.

  // Any number of links; the server validates and labels them.
  const links = (mentorLinksData || []).filter(l => l && l.url && l.url.trim());
  const linkedinLink = links.find(l => /linkedin\.com/i.test(l.url));

  const profileData = {
    bio,
    achievements,
    topTip,
    topTipColor,
    links,
    linkedin: linkedinLink ? linkedinLink.url : ''
  };

  const btn = e.target?.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.innerText = 'saving...'; }

  try {
    const updated = await updateMentorProfile(currentMentor.id, profileData);
    Object.assign(currentMentor, {
      bio: updated.bio,
      achievements: updated.achievements,
      topTip: updated.topTip,
      topTipColor: updated.topTipColor,
      pitchVideoUrl: updated.pitchVideoUrl,
      links: updated.links,
      linkedin: updated.linkedin
    });
    mentorLinksData = (updated.links || []).map(l => ({ ...l }));
    renderMentorLinksEditor(currentMentor);
    showToast('Profile saved and live on your public page.');
  } catch (err) {
    showToast(err.message || 'Could not save your profile.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerText = 'save profile'; }
  }
}
window.saveMentorProfile = saveMentorProfile;

async function publishDashboardResource(e) {
  e.preventDefault();
  const session = getMentorSession();
  if (!session) return;

  const currentMentor = resolveSessionMentor();
  const title = document.getElementById('pr-title')?.value.trim();
  const type = document.getElementById('pr-type')?.value || 'free';
  const category = document.getElementById('pr-category')?.value || 'Tech & Coding';
  const price = type === 'paid' ? parseFloat(document.getElementById('pr-price')?.value) || 0 : 0;
  const desc = document.getElementById('pr-desc')?.value.trim();
  const submitBtn = document.getElementById('pr-submit-btn');

  // The upload endpoint hands back an opaque fileName; there is no public URL.
  const fileName = document.getElementById('pr-uploaded-file')?.value.trim();
  const format = document.getElementById('pr-uploaded-format')?.value.trim() || 'PDF';

  if (!title) {
    showToast('Give your resource a title.');
    return;
  }
  if (!fileName) {
    showToast('Upload a document (.pdf, .md, .tex or .pptx) before publishing.');
    return;
  }
  if (type === 'paid' && !(price >= 1 && price <= 100)) {
    showToast('Playbooks must be priced between £1.00 and £100.00.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'publishing...';
  }

  try {
    const previewBullets = ['pr-bullet-1', 'pr-bullet-2', 'pr-bullet-3']
      .map(id => document.getElementById(id)?.value.trim())
      .filter(Boolean);

    const created = await createResource({
      title,
      subtitle: desc || `Shared by ${currentMentor.name}`,
      type,
      price,
      category,
      fileName,
      format,
      previewBullets,
      pages: 'Self-contained document'
    });

    if (!currentMentor.docs) currentMentor.docs = [];
    currentMentor.docs.unshift(created);

    showToast(type === 'paid'
      ? `Published "${title}" at £${Number(created.price).toFixed(2)}.`
      : `Published "${title}" as a free freabie.`);

    e.target.reset();
    const previewEl = document.getElementById('pr-file-preview');
    if (previewEl) previewEl.style.display = 'none';
    const hidden = document.getElementById('pr-uploaded-file');
    if (hidden) hidden.value = '';

    initMentorDashboard();
  } catch (err) {
    showToast(err.message || 'Could not publish that resource.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span class="pill-btn__inner">
          <span>upload &amp; publish resource</span>
          <span class="pill-btn__arrow">↑</span>
        </span>
      `;
    }
  }
}
window.publishDashboardResource = publishDashboardResource;

async function deleteMentorResource(docId) {
  if (!confirm('Delete this resource? Students who already own it keep their copy.')) return;

  const currentMentor = resolveSessionMentor();
  if (!currentMentor) return;

  try {
    await deleteResource(docId);
    if (currentMentor.docs) {
      currentMentor.docs = currentMentor.docs.filter(d => d.id !== docId);
    }
    initMentorDashboard();
    showToast('Resource removed.');
  } catch (err) {
    showToast(err.message || 'Could not delete that resource.');
  }
}
window.deleteMentorResource = deleteMentorResource;

// ─── Email verification landing route (#/verify?token=…) ─────

function renderEmailVerificationResult(route) {
  const params = new URLSearchParams((route.split('?')[1]) || '');
  const token = params.get('token');

  // Verify for real, then report what actually happened. This used to declare
  // success before the request had even been made.
  setTimeout(async () => {
    const root = document.getElementById('verify-result');
    if (!root) return;

    if (!token) {
      root.innerHTML = verifyResultCard({
        ok: false,
        title: 'That link is incomplete',
        body: 'The verification link is missing its token. Please open the most recent email we sent you, or request a new code.'
      });
      return;
    }

    try {
      await verifyEmailToken(token);
      await refreshEntitlements();
      updateNavbarMentorStatus();

      root.innerHTML = verifyResultCard({
        ok: true,
        title: 'Email verified',
        body: 'Your UK student status is confirmed. You can now book 1-on-1 calls, download freabies, and publish a mentor profile.',
        actions: `
          <button class="pill-btn pill-btn--animated" onclick="window.navigateTo('/browse')">
            <span class="pill-btn__inner"><span>find a senior mentor</span><span class="pill-btn__arrow">→</span></span>
          </button>
          <button class="pill-btn pill-btn--subtle" onclick="window.navigateTo('/resources')">
            <span>explore freabies &amp; docs</span>
          </button>
        `
      });
    } catch (err) {
      root.innerHTML = verifyResultCard({
        ok: false,
        title: 'That link didn\'t work',
        body: escapeHtml(err.message || 'The link may have expired or already been used.'),
        actions: `
          <button class="pill-btn pill-btn--animated" onclick="window.openVerificationModal({ email: null, actionName: 'verify your student email' })">
            <span class="pill-btn__inner"><span>send me a new code</span><span class="pill-btn__arrow">→</span></span>
          </button>
        `
      });
    }
  }, 30);

  return `
    <div style="min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
      <div id="verify-result" style="max-width: 520px; width: 100%;">
        <div style="background: #fff; border: 2px solid var(--color-charcoal); border-radius: 20px; box-shadow: var(--shadow-brutal-lg); padding: 36px 28px; text-align: center;">
          <div style="width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top: 3px solid var(--color-marker-orange); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto;"></div>
          <p style="font-size: 15px; opacity: 0.7; margin: 0;">verifying your email…</p>
        </div>
      </div>
    </div>
    ${renderFooter()}
  `;
}
window.renderEmailVerificationResult = renderEmailVerificationResult;

function verifyResultCard({ ok, title, body, actions = '' }) {
  return `
    <div style="background: #fff; border: 2px solid var(--color-charcoal); border-radius: 20px; box-shadow: var(--shadow-brutal-lg); padding: 36px 28px; text-align: center;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background: ${ok ? '#ecfdf5' : '#fef2f2'}; border: 2px solid ${ok ? '#10b981' : '#ef4444'}; color: ${ok ? '#059669' : '#dc2626'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
        ${ok ? ICONS.tickCircle : ICONS.close}
      </div>
      ${ok ? `<span class="uni-detect-badge" style="margin-bottom: 8px;">${ICONS.shieldTick} UK higher education verified</span>` : ''}
      <h1 style="font-size: 28px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin: 8px 0 10px 0;">${title}</h1>
      <p style="font-size: 15px; opacity: 0.8; line-height: 1.6; margin-bottom: 24px;">${body}</p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">${actions}</div>
    </div>
  `;
}

// ─── Booking cancellation route (#/cancel?booking=…&token=…) ─────

function renderCancelBooking(route) {
  const params = new URLSearchParams((route.split('?')[1]) || '');
  const bookingId = params.get('booking');
  const token = params.get('token');

  setTimeout(async () => {
    const root = document.getElementById('cancel-result');
    if (!root) return;

    if (!bookingId) {
      root.innerHTML = verifyResultCard({
        ok: false,
        title: 'Nothing to cancel',
        body: 'That link is missing its booking reference.'
      });
      return;
    }

    try {
      const booking = await cancelBooking(bookingId, token);
      root.innerHTML = verifyResultCard({
        ok: true,
        title: 'Session cancelled',
        body: `The session on <strong>${escapeHtml(toLongDisplayDate(booking.date))}</strong> at
               <strong>${escapeHtml(toDisplayTime(booking.time))}</strong> has been cancelled and the slot
               is open again. We've let the other person know.`,
        actions: `
          <button class="pill-btn pill-btn--animated" onclick="window.navigateTo('/mentor/${booking.mentorId}')">
            <span class="pill-btn__inner"><span>book another time</span><span class="pill-btn__arrow">→</span></span>
          </button>
        `
      });
    } catch (err) {
      root.innerHTML = verifyResultCard({
        ok: false,
        title: 'Could not cancel',
        body: escapeHtml(err.message || 'This booking may already have been cancelled.')
      });
    }
  }, 30);

  return `
    <div style="min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
      <div id="cancel-result" style="max-width: 520px; width: 100%;">
        <div style="background: #fff; border: 2px solid var(--color-charcoal); border-radius: 20px; box-shadow: var(--shadow-brutal-lg); padding: 36px 28px; text-align: center;">
          <div style="width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top: 3px solid var(--color-marker-orange); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto;"></div>
          <p style="font-size: 15px; opacity: 0.7; margin: 0;">cancelling your session…</p>
        </div>
      </div>
    </div>
    ${renderFooter()}
  `;
}
window.renderCancelBooking = renderCancelBooking;

// ─── My sessions (#/my-sessions) ─────

function renderMySessions() {
  if (!isVerified()) {
    setTimeout(() => openVerificationModal({
      email: null,
      actionName: 'see your booked sessions'
    }), 200);
  } else {
    setTimeout(loadMySessions, 30);
  }

  return `
    <div class="page-container" style="padding: 48px 20px 60px;">
      <span class="section__caption">your 1-on-1s</span>
      <h1 class="section__title" style="font-size: clamp(30px, 4vw, 44px); margin-bottom: 8px;">my sessions</h1>
      <p style="font-size: 15px; opacity: 0.75; margin-bottom: 28px;">
        Everything you've booked, with the video link and calendar invite for each one.
      </p>
      <div id="my-sessions-list">
        ${isVerified()
      ? '<div style="opacity: 0.6; padding: 30px 0;">loading your sessions…</div>'
      : `<div style="padding: 30px 0;">
           <p style="opacity: 0.7; margin-bottom: 16px;">Verify your student email to see your sessions.</p>
           <button class="pill-btn pill-btn--animated" onclick="window.openVerificationModal({ email: null, actionName: 'see your sessions' })">
             <span class="pill-btn__inner"><span>verify my email</span><span class="pill-btn__arrow">&rarr;</span></span>
           </button>
         </div>`}
      </div>
    </div>
    ${renderFooter()}
  `;
}
window.renderMySessions = renderMySessions;

async function loadMySessions() {
  const root = document.getElementById('my-sessions-list');
  if (!root) return;

  const data = await fetchMyBookings();
  const { upcoming = [], past = [] } = data;

  if (!upcoming.length && !past.length) {
    root.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: #fff; border-radius: 16px; border: 1.5px dashed rgba(23, 23, 23, 0.2);">
        <h3 style="font-size: 19px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">no sessions yet</h3>
        <p style="font-size: 14px; opacity: 0.7; max-width: 420px; margin: 0 auto 18px;">
          Find a senior who's walked the path you want and book a free 20 minutes with them.
        </p>
        <button class="pill-btn pill-btn--animated" onclick="window.navigateTo('/browse')">
          <span class="pill-btn__inner"><span>find a mentor</span><span class="pill-btn__arrow">→</span></span>
        </button>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    ${upcoming.length ? `
      <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin: 0 0 12px;">upcoming</h2>
      <div style="display: grid; gap: 12px; margin-bottom: 32px;">
        ${upcoming.map(b => sessionCard(b, true)).join('')}
      </div>` : ''}
    ${past.length ? `
      <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin: 0 0 12px;">past</h2>
      <div style="display: grid; gap: 12px;">
        ${past.map(b => sessionCard(b, false)).join('')}
      </div>` : ''}
  `;
}

function sessionCard(b, isUpcoming) {
  const meetingUrl = b.meetingUrl || b.googleMeetUrl || '';
  return `
    <div style="background: #fff; border: 1.5px solid var(--color-charcoal); border-radius: 14px; padding: 16px 18px; ${isUpcoming ? '' : 'opacity: 0.66;'}">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
        <div>
          <div style="font-size: 16px; font-weight: 800; color: var(--color-charcoal); margin-bottom: 2px;">
            ${escapeHtml(b.mentorName)}
          </div>
          <div style="font-size: 13.5px; opacity: 0.75;">
            ${escapeHtml(toLongDisplayDate(b.date))} · ${escapeHtml(b.displayTime || toDisplayTime(b.time))} (${escapeHtml(b.timezone || 'UK time')})
          </div>
        </div>
        ${isUpcoming ? `
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="${escapeHtml(meetingUrl)}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-btn--dark" style="text-decoration: none; font-size: 12.5px; padding: 6px 14px;">join call</a>
            <button class="pill-btn pill-btn--subtle" style="font-size: 12.5px; padding: 6px 14px;" onclick="window.downloadBookingInvite('${escapeHtml(b.id)}')">.ics</button>
            <button class="pill-btn pill-btn--subtle" style="font-size: 12.5px; padding: 6px 14px;" onclick="window.cancelMySession('${escapeHtml(b.id)}')">cancel</button>
          </div>` : ''}
      </div>
    </div>
  `;
}

async function cancelMySession(bookingId) {
  if (!confirm('Cancel this session? The slot will be released for another student.')) return;
  try {
    await cancelBooking(bookingId);
    showToast('Session cancelled.');
    loadMySessions();
  } catch (err) {
    showToast(err.message || 'Could not cancel that session.');
  }
}
window.cancelMySession = cancelMySession;

// ─── Router ─────

/**
 * The current route, from the real URL path.
 *
 * This used to read location.hash. Every route then collapsed to a single
 * indexable URL as far as search engines were concerned — a fragment is never
 * sent to a server — so the whole catalogue of mentors and resources was
 * invisible to search. History routing gives each one a real URL.
 *
 * Legacy #/ links are still honoured and rewritten, so anything already shared
 * keeps working.
 */
function getRoute() {
  if (window.location.hash.startsWith('#/')) {
    return window.location.hash.slice(1);
  }
  return (window.location.pathname || '/') + (window.location.search || '');
}

function renderPage() {
  const route = getRoute();
  const app = document.getElementById('app');
  if (!app) return;

  window.scrollTo(0, 0);

  // Reset filters (default to student's campus preference if set)
  activeGoal = 'all';
  activeSubject = 'all';
  activeYear = 'all years';
  const studentPrefs = getStudentPrefs();
  if (studentPrefs && studentPrefs.university && studentPrefs.university !== 'All UK Universities') {
    activeUniversity = studentPrefs.university;
    if (!activeResourcesUni) {
      activeResourcesUni = studentPrefs.university;
    }
  } else {
    activeUniversity = 'all';
  }

  // Strip any query string before matching, so '/resources?unlocked=x' still
  // resolves to the resources hub.
  const path = route.split('?')[0];

  if (path === '/' || path === '') {
    app.innerHTML = renderLanding();
  } else if (path === '/browse') {
    app.innerHTML = renderBrowse();
  } else if (path === '/resources' || path === '/docs' || path === '/freabies') {
    app.innerHTML = renderResourcesHub();
    hydrateResources();
  } else if (path === '/become-a-mentor') {
    app.innerHTML = renderBecomeMentor();
    renderSignupLinks();
    renderPitchVideoControl('signup-pitch-container', '');
  } else if (path === '/my-sessions') {
    app.innerHTML = renderMySessions();
  } else if (path === '/checkout-complete') {
    app.innerHTML = renderCheckoutComplete(route);
  } else if (path === '/cancel') {
    app.innerHTML = renderCancelBooking(route);
  } else if (path === '/admin') {
    app.innerHTML = renderAdminDashboard();
    initAdminDashboard();
  } else if (path === '/mentor-dashboard') {
    app.innerHTML = renderMentorDashboard();
    // renderMentorDashboard falls back to the sign-in page when there is no
    // mentor session, so wire whichever of the two actually rendered.
    if (document.getElementById('mentor-auth-flow')) initMentorLoginPage();
    else initMentorDashboard();
  } else if (path.startsWith('/verify')) {
    app.innerHTML = renderEmailVerificationResult(route);
  } else if (path.startsWith('/mentor/')) {
    const id = path.split('/')[2];
    app.innerHTML = renderProfile(id);
    // Calendar opens on the current month, not a date baked in at build time.
    calendarState.selectedDate = null;
    calendarState.selectedSlot = null;
    calendarState.data = null;
    const now = new Date();
    loadMentorCalendar(id, now.getFullYear(), now.getMonth() + 1);
  } else {
    app.innerHTML = renderLanding();
  }

  setupRevealObserver();
  setupNavLinks();

  // Title, description, canonical and structured data for this specific route.
  // Without it every page inherits the landing page's metadata, so search
  // results and social previews describe the wrong thing.
  const metaContext = {};
  if (path.startsWith('/mentor/')) {
    metaContext.mentor = MENTORS.find(m => m.id === parseInt(path.split('/')[2]));
  } else if (path === '/browse') {
    metaContext.mentors = MENTORS;
  } else if (path === '/resources' || path === '/docs' || path === '/freabies') {
    metaContext.docs = getAllDocs();
  }
  applyRouteMeta(path, metaContext);
}

function navigateTo(path, { replace = false } = {}) {
  // Release the camera if a recording is in progress — the light staying on
  // after you navigate away is alarming, and rightly so.
  try { stopPitchRecording(); stopPitchStream(); } catch (e) { /* not recording */ }

  const target = path.startsWith('/') ? path : `/${path}`;
  const current = window.location.pathname + window.location.search;

  if (target === current && !window.location.hash) return;

  if (replace) window.history.replaceState({}, '', target);
  else window.history.pushState({}, '', target);

  renderPage();
  updateNavbarMentorStatus();
}
window.navigateTo = navigateTo;

window.openBookingModal = openBookingModal;
window.confirmBooking = confirmBooking;
window.closeModal = closeModal;
window.loadMentorCalendar = loadMentorCalendar;
window.navigateMonth = navigateMonth;
window.selectCalendarMonthCell = selectCalendarMonthCell;
window.selectMonthSlotChip = selectMonthSlotChip;


// ─── Scroll Reveal Observer ─────

function setupRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

// ─── Navbar Scroll Effect ─────

function setupNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ─── Modal Background Dismiss ─────

function setupModalClose() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
  }
}

// ─── Navigation Click Handlers ─────

function setupNavLinks() {
  document.querySelectorAll('[data-navigate]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      closeMentorsDropdown();
      navigateTo(el.dataset.navigate);
    };
  });

  const mentorsBtn = document.getElementById('nav-mentors-btn');
  if (mentorsBtn && !mentorsBtn.__hasClickListener) {
    mentorsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMentorsDropdown(e);
    });
    mentorsBtn.__hasClickListener = true;
  }

  if (!window.__dropdownClickListenerAdded) {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#nav-mentors-dropdown')) {
        closeMentorsDropdown();
      }
    });
    window.__dropdownClickListenerAdded = true;
  }
}

// ─── frea Custom Fluid Cursor Component ─────

function setupCustomCursor() {
  // Only activate on devices with a fine pointer (desktop mouse/trackpad)
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }

  // Create cursor container if not present
  let cursor = document.getElementById('frea-cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = 'frea-cursor';
    cursor.className = 'frea-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = `
      <div class="frea-cursor__dot"></div>
      <div class="frea-cursor__ring"></div>
    `;
    document.body.appendChild(cursor);
  }

  const dot = cursor.querySelector('.frea-cursor__dot');
  const ring = cursor.querySelector('.frea-cursor__ring');

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isVisible = false;
  let isHovering = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isVisible) {
      isVisible = true;
      ringX = mouseX;
      ringY = mouseY;
      cursor.classList.add('visible');
    }

    if (dot) {
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    }

    // Dynamic contrast detection for footer / dark orange areas
    const isOverDark = !!e.target.closest('.footer, .footer *, .velocity-strip-section, .velocity-strip-section *');
    cursor.classList.toggle('on-dark', isOverDark);
  });

  window.addEventListener('mousedown', () => {
    cursor.classList.add('clicking');
  });

  window.addEventListener('mouseup', () => {
    cursor.classList.remove('clicking');
  });

  document.addEventListener('mouseleave', () => {
    isVisible = false;
    cursor.classList.remove('visible');
  });

  document.addEventListener('mouseenter', () => {
    isVisible = true;
    cursor.classList.add('visible');
  });

  // Interactive element hover detection via event delegation
  const INTERACTIVE_SELECTORS = 'a, button, [role="button"], input, select, textarea, .mentor-card, .faq-item, .frea-cal__cell--available, .frea-cal__nav-btn, .filter-pill, .pill-btn, .navbar__brand, .chip, [onclick]';

  document.addEventListener('mouseover', (e) => {
    const isOverDark = !!e.target.closest('.footer, .footer *, .velocity-strip-section, .velocity-strip-section *');
    cursor.classList.toggle('on-dark', isOverDark);

    const target = e.target.closest(INTERACTIVE_SELECTORS);
    if (target && !isHovering) {
      isHovering = true;
      cursor.classList.add('hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest(INTERACTIVE_SELECTORS);
    if (target && isHovering) {
      if (!e.relatedTarget || !e.relatedTarget.closest(INTERACTIVE_SELECTORS)) {
        isHovering = false;
        cursor.classList.remove('hovering');
      }
    }
  });

  // Smooth lerp loop for the trailing ring (runs on compositor thread via translate3d)
  function renderCursor() {
    if (isVisible) {
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;
      if (ring) {
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
    }
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);
}

// ─── Initialize ─────

// ─── Server-backed hydration ─────
//
// These endpoints existed all along but were never called, so the page showed
// fixed numbers and an empty resources hub. Each one fails quietly: if the API
// is unreachable, the bundled content stays on screen.


/** Merges server-published resources into the render list. */
async function hydrateResources() {
  const { resources, entitlements } = await fetchResources();
  setUnlockedDocIds(entitlements);

  if (resources && resources.length) {
    resources.forEach(r => {
      let mentor = MENTORS.find(m => m.id === r.mentorId);

      // A resource can belong to a mentor who joined after this bundle was
      // built — every mentor created through the API gets an id past the
      // seeded range. Dropping those made their work invisible platform-wide,
      // so synthesise a mentor from the fields the listing already carries.
      if (!mentor) {
        mentor = {
          id: r.mentorId,
          name: r.mentorName || 'Senior mentor',
          university: r.mentorUniversity || 'UK university',
          major: r.mentorMajor || '',
          year: r.mentorYear || '',
          rating: 5.0,
          callsCompleted: 0,
          achievements: [],
          helpsWith: [],
          weeklySchedule: {},
          links: [],
          docs: []
        };
        MENTORS.push(mentor);
      }

      mentor.docs = mentor.docs || [];
      const idx = mentor.docs.findIndex(d => d.id === r.id);
      if (idx >= 0) mentor.docs[idx] = { ...mentor.docs[idx], ...r };
      else mentor.docs.push(r);
    });
  }

  updateResourcesGrid();
  refreshDocCardsUI();

  // Arriving from a purchase receipt link: jump straight to the download.
  const params = new URLSearchParams((getRoute().split('?')[1]) || '');
  const unlocked = params.get('unlocked');
  if (unlocked && isDocUnlocked(unlocked)) {
    setTimeout(() => openDocPreviewModal(unlocked), 300);
  }
}

async function hydratePaymentConfig() {
  window.__paymentConfig = await fetchPaymentConfig();
}

/** Restores a session on load and drops it if the server has expired it. */
async function restoreSession() {
  if (!getSessionToken()) return;
  const me = await fetchMe();
  if (!me) {
    updateNavbarMentorStatus();
    return;
  }
  setUnlockedDocIds(me.entitlements || []);

  if (me.mentor) {
    const idx = MENTORS.findIndex(m => m.id === me.mentor.id);
    if (idx >= 0) MENTORS[idx] = { ...MENTORS[idx], ...me.mentor };
    else MENTORS.unshift(me.mentor);
  }
  updateNavbarMentorStatus();
  refreshDocCardsUI();
}

async function init() {
  initAnalytics();

  // An old #/ link landing here: rewrite to the real path before first paint,
  // so the canonical URL is right from the very first render.
  if (window.location.hash.startsWith('#/')) {
    window.history.replaceState({}, '', window.location.hash.slice(1));
  }

  // Paint immediately from bundled data so nothing waits on the network.
  renderPage();
  updateNavbarMentorStatus();
  setupNavbarScroll();
  setupModalClose();
  setupNavLinks();
  setupCustomCursor();

  // Then reconcile with the server, in a fixed order. Mentors and the session
  // must land before resources, or a resource whose mentor has not arrived yet
  // is attributed to a synthesised stub and the portal can misattribute.
  hydratePaymentConfig();
  await syncLiveMentors();
  await restoreSession();

  // Re-render only the routes whose content actually depends on that data, and
  // only if the visitor is still on the page they started on — re-rendering
  // blindly would wipe anything they had already begun interacting with.
  const settled = getRoute().split('?')[0];
  if (settled === '/mentor-dashboard' || settled === '/admin' || settled.startsWith('/mentor/')) {
    renderPage();
  } else if (settled === '/resources' || settled === '/docs' || settled === '/freabies') {
    hydrateResources();
  }

  // Back and forward buttons.
  window.addEventListener('popstate', () => {
    renderPage();
    updateNavbarMentorStatus();
  });

  // A legacy #/ link, from an old email or a shared URL. Rewrite it to the real
  // path once, so the address bar and any onward share are correct.
  window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#/')) {
      const path = window.location.hash.slice(1);
      window.history.replaceState({}, '', path);
    }
    renderPage();
    updateNavbarMentorStatus();
  });

  // Intercept in-app links so they navigate without a full page load, while
  // remaining real hrefs that a crawler can follow and a user can open in a
  // new tab.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="/"]');
    if (!link) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    navigateTo(link.getAttribute('href'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Prompt first-time visitors to set university preferences on resources or browse
  setTimeout(() => {
    const prefs = getStudentPrefs();
    const hash = window.location.hash || '';
    if (!prefs && (hash.includes('/resources') || hash.includes('/browse'))) {
      openPreferencesModal(false);
    }
  }, 650);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
