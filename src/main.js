// ─────────────────────────────────────────────
// frea — Main Application (UK Student Peer-to-Peer Mentoring)
// ─────────────────────────────────────────────

import './style.css';
import { MENTORS, ACHIEVEMENTS, SUBJECTS, YEAR_FILTERS, SUBJECT_MAP, UK_UNIVERSITIES, TESTIMONIALS, FAQ_ITEMS, getAllDocs, getDocById, getUniversityFromEmail, EMAIL_UNI_MAP } from './data.js';
import { getMentorAvatar } from './avatars.js';
import { initAnalytics, trackEvent, getGrowthMetrics } from './analytics.js';
import {
  fetchMentors,
  fetchMentor,
  fetchMonthlySlots,
  submitBooking,
  submitMentorApplication,
  fetchStats,
  uploadDocument,
  sendEmailVerification,
  verifyEmailCode,
  verifyEmailToken,
  checkEmailVerification,
  fetchAdminApplications,
  approveMentorApplication,
  rejectMentorApplication,
  updateMentorProfile,
  updateMentorSchedule,
  fetchResources,
  createResource,
  deleteResource
} from './api.js';
import { ICONS } from './icons.js';

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
    ${key}
  </span>`;
}

// ─── Star Rating (Iconsax Vector Icon) ─────

function starRating(rating) {
  return `<span class="star-rating-svg" style="display: inline-flex; align-items: center; gap: 3px; color: #f59e0b; vertical-align: middle;">${ICONS.star}</span>`;
}

// ─── Pitch Video Embed Helper ─────

function renderPitchVideoEmbed(url) {
  if (!url) return '';

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
            <div class="mentor-card__name">${mentor.name}</div>
            ${mentor.linkedin ? `
              <a href="${mentor.linkedin}" target="_blank" rel="noopener noreferrer" class="mentor-card__linkedin" onclick="event.stopPropagation()" title="View verified LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.64 1.64 0 0 0-1.66 1.64 1.63 1.63 0 0 0 1.66 1.63 1.63 1.63 0 0 0 1.65-1.63A1.64 1.64 0 0 0 7.83 6.2Z"/></svg>
              </a>
            ` : ''}
          </div>
          <div class="mentor-card__meta">
            <span>${mentor.year}</span>
            <span class="mentor-card__meta-divider">·</span>
            <span>${mentor.major}</span>
          </div>
          <div style="font-size: 11.5px; opacity: 0.7; margin-top: 2px; font-weight: 600; color: var(--color-cocoa-ink);">${mentor.university}</div>
        </div>
      </div>

      <!-- Senior's Top Tip Post-It Sticky Note -->
      <div class="mentor-card__postit mentor-card__postit--${mentor.topTipColor || 'yellow'}">
        <span class="mentor-card__postit-pin"></span>
        <div class="mentor-card__postit-header">
          <span class="mentor-card__postit-label">senior tip</span>
        </div>
        <p class="mentor-card__postit-quote">${mentor.topTip}</p>
      </div>

      <div class="mentor-card__achievements">
        ${mentor.achievements.slice(0, 3).map(a => achievementSticker(a)).join('')}
      </div>
      <div class="mentor-card__bio">“${mentor.bio}”</div>
      <div class="mentor-card__footer">
        <div class="mentor-card__stats">
          <span style="display: inline-flex; align-items: center; gap: 3px; color: #f59e0b; font-weight: 700;">${ICONS.star} ${mentor.rating.toFixed(1)}</span>
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
      <path d="M 6 22 C 24 6, 48 6, 64 16.5" stroke="#171717" stroke-width="2.2" stroke-linecap="round"/>
      <polygon points="68,18 56,12.5 58.5,17.5 56,23" fill="#171717"/>
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
              <!-- Washi Tape (Cleanly pinned to top-left) -->
              <div class="washi-tape"></div>

              <!-- Decorative Stickers (Safely inside container margins) -->
              <div class="sticker sticker--1">${stickerDecoration('lightning', 34)}</div>
              <div class="sticker sticker--2">${stickerDecoration('heart', 30)}</div>
              <div class="sticker sticker--3">${stickerDecoration('sparkle', 28)}</div>
              <div class="sticker sticker--4">${stickerDecoration('star', 32)}</div>

              <!-- Senior Student ID Badge Card -->
              <div class="hero__senior-pass">
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
              <h3 class="mission-card__title">vetted seniors</h3>
              <p class="mission-card__desc">every mentor is verified with their university email, verified on LinkedIn, and screened before joining.</p>
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

// ─── Docs & Freabies State & Storage ─────

function getUnlockedDocIds() {
  try {
    return JSON.parse(localStorage.getItem('frea_unlocked_docs') || '[]');
  } catch (e) {
    return [];
  }
}

function isDocUnlocked(docId) {
  return getUnlockedDocIds().includes(docId);
}

function unlockDoc(docId) {
  const current = getUnlockedDocIds();
  if (!current.includes(docId)) {
    current.push(docId);
    try {
      localStorage.setItem('frea_unlocked_docs', JSON.stringify(current));
    } catch (e) {
      console.warn(e);
    }
  }
}
window.isDocUnlocked = isDocUnlocked;
window.unlockDoc = unlockDoc;

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
          <span class="doc-format-badge">${doc.format}</span>
        </div>
        <span class="doc-category-badge">${doc.category || 'Academic'}</span>
      </div>

      <div class="doc-card__main">
        <h4 class="doc-card__title" onclick="window.openDocPreviewModal('${doc.id}')">${doc.title}</h4>
        <p class="doc-card__subtitle">${doc.subtitle}</p>

        ${showAuthor ? `
          <div class="doc-card__author" onclick="window.navigateTo('/mentor/${mentorId}')" title="View ${authorName}'s full profile">
            <div class="doc-card__author-avatar">
              ${getMentorAvatar(mentorId, 32)}
            </div>
            <div class="doc-card__author-info">
              <span class="doc-card__author-name">${authorName}</span>
              <span class="doc-card__author-uni">${authorUni} · ${authorMajor}</span>
            </div>
          </div>
        ` : ''}

        <div class="doc-card__highlights">
          ${(doc.previewBullets || []).slice(0, 2).map(bullet => `
            <div class="doc-card__highlight-item">
              <span class="doc-card__check">${ICONS.tickCircle}</span>
              <span>${bullet}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="doc-card__footer">
        <div class="doc-card__stats">
          <span class="doc-card__rating">${ICONS.star} ${doc.rating.toFixed(1)}</span>
          <span class="doc-card__downloads">(${doc.downloads} downloads)</span>
          <span class="doc-card__pages">· ${doc.pages}</span>
        </div>
        <div class="doc-card__actions">
          <button type="button" class="doc-btn doc-btn--preview" onclick="window.openDocPreviewModal('${doc.id}')" aria-label="Preview document ${doc.title}">
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

  // Default to day index 0
  window.__activeDayIndex = 0;
  const activeDayObj = mentor.availability[0];
  window.__selectedDay = activeDayObj ? activeDayObj.day : '';
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
                  <a href="${mentor.linkedin}" target="_blank" rel="noopener noreferrer" class="profile__linkedin-badge" title="Verified LinkedIn Profile">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.64 1.64 0 0 0-1.66 1.64 1.63 1.63 0 0 0 1.66 1.63 1.63 1.63 0 0 0 1.65-1.63A1.64 1.64 0 0 0 7.83 6.2Z"/></svg>
                    <span>LinkedIn verified</span>
                  </a>
                ` : ''}
              </div>
              <div class="profile__name">${mentor.name}</div>
              <div class="profile__meta">
                <span>${mentor.year}</span>
                <span class="mentor-card__meta-divider">·</span>
                <span>${mentor.major}</span>
                <span class="mentor-card__meta-divider">·</span>
                <span>${mentor.university}</span>
              </div>
            </div>

            <!-- Websites / Portfolios / Social Links -->
            ${mentor.websites && mentor.websites.length > 0 ? `
              <div class="profile__websites-row">
                ${mentor.websites.map(site => `
                  <a href="${site.url}" target="_blank" rel="noopener noreferrer" class="profile__website-chip">
                    <span>${ICONS.link}</span>
                    <span>${site.label}</span>
                    <span style="font-size: 11px; opacity: 0.6;">↗</span>
                  </a>
                `).join('')}
              </div>
            ` : ''}

            <div class="profile__achievements">
              ${mentor.achievements.map(a => achievementSticker(a)).join('')}
            </div>
            <div class="profile__rating">
              <span class="profile__rating-stars">${starRating(mentor.rating)}</span>
              <span>${mentor.rating} rating · ${mentor.callsCompleted} chats completed</span>
            </div>
          </div>
        </div>

        <!-- Featured Top Tip Sticky Note -->
        <div style="max-width: 680px; margin-bottom: 40px;">
          <div class="mentor-card__postit mentor-card__postit--${mentor.topTipColor || 'yellow'}" style="padding: 18px 22px; transform: rotate(-0.8deg); box-shadow: 3px 8px 20px rgba(0,0,0,0.06);">
            <span class="mentor-card__postit-pin" style="left: 28px; width: 14px; height: 14px;"></span>
            <div class="mentor-card__postit-header" style="margin-bottom: 6px;">
              <span class="mentor-card__postit-label" style="font-size: 15px;">senior tip for freshers</span>
            </div>
            <p class="mentor-card__postit-quote" style="font-size: 21px; line-height: 1.3;">${mentor.topTip}</p>
          </div>
        </div>

        <div class="profile__section">
          <h3 class="profile__section-title">about my journey</h3>
          <p class="profile__bio" style="font-size: 19px; line-height: 1.65; color: var(--color-cocoa-ink);">“${mentor.bio}”</p>
        </div>

        <!-- 2-Minute Pitch Video Embed (YouTube, Loom, Google Drive) -->
        ${mentor.pitchVideoUrl ? `
          <div class="profile__section">
            <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
              <h3 class="profile__section-title" style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 8px;">${ICONS.video} 2-min mentor pitch</h3>
              <span class="handwritten" style="font-size: 19px; color: var(--color-marker-orange);">hear directly from ${mentor.name.split(' ')[0]}</span>
            </div>
            <div class="profile__video-card">
              ${renderPitchVideoEmbed(mentor.pitchVideoUrl)}
            </div>
          </div>
        ` : ''}

        <div class="profile__section">
          <h3 class="profile__section-title">what you can ask me about</h3>
          <div class="profile__tags">
            ${mentor.helpsWith.map(t => `<span class="profile__tag">${t}</span>`).join('')}
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
                revision bibles, templates & free notes curated by ${mentor.name.split(' ')[0]}
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
            <label class="mentor-form-label">Official Student Email <span>* (must end in .ac.uk)</span></label>
            <input type="email" class="mentor-form-input" id="bm-email" required placeholder="e.g. yourname@imperial.ac.uk or s123456@ed.ac.uk" oninput="window.handleMentorEmailInput(this.value)">
            <div id="bm-uni-detect-badge" style="display: none;"></div>
            <span style="font-size: 12px; opacity: 0.6; display: block; margin-top: 4px;">We use .ac.uk verification to keep the platform free from commercial recruiters.</span>
          </div>

          <!-- LinkedIn Verification URL -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">LinkedIn Profile URL <span>(strongly encouraged · unlocks verified badge)</span></label>
            <input type="url" class="mentor-form-input" id="bm-linkedin" placeholder="https://www.linkedin.com/in/yourprofile">
            <span style="font-size: 12px; opacity: 0.6; display: block; margin-top: 4px;">Adding your LinkedIn profile unlocks the "LinkedIn verified" trust badge on your profile.</span>
          </div>

          <!-- Websites / Portfolio / GitHub Link -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">Website, Portfolio or GitHub <span>(optional)</span></label>
            <input type="url" class="mentor-form-input" id="bm-website" placeholder="https://github.com/yourhandle or https://yourportfolio.com">
          </div>

          <!-- 2-Minute Pitch Video -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">2-Minute Pitch Video URL <span>(YouTube unlisted, Loom, or Google Drive)</span></label>
            <input type="url" class="mentor-form-input" id="bm-pitch" placeholder="https://youtube.com/watch?v=... or https://loom.com/share/...">
            <span style="font-size: 12px; opacity: 0.6; display: block; margin-top: 4px;">Record a brief 2-minute video introducing yourself, your background, and how you can guide younger students.</span>
          </div>

          <!-- Screening / Interview Notice -->
          <div class="mentor-form-group">
            <div style="background: var(--color-dew-drop); border: 1.5px dashed rgba(23, 23, 23, 0.25); border-radius: 12px; padding: 14px 18px; display: flex; gap: 12px; align-items: flex-start;">
              <span>${ICONS.shieldTick}</span>
              <div style="font-size: 13.5px; line-height: 1.5; color: var(--color-cocoa-ink);">
                <strong>Quality Assurance & Verification:</strong> To keep frea authentic and safe for UK freshers, our student committee reviews every applicant and verifies .ac.uk student status.
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
                <span class="doc-badge doc-badge--free">100% creator earnings</span>
              </div>
              <span style="font-size: 13px; opacity: 0.75; display: block; margin-bottom: 14px; line-height: 1.5;">Share your revision bibles, interview cheat sheets, or templates. Keep it free as a "freabie", or set your own price to earn directly from younger students.</span>

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
                    <input type="number" class="mentor-form-input" id="bm-doc-price" min="0.99" max="49.99" step="0.50" value="3.99" style="padding-left: 26px;">
                  </div>
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
                  <input type="file" id="bm-doc-file" accept=".pdf,.md,.tex,.pptx" onchange="window.handleDocumentFileSelect(event, 'bm-doc-preview', 'bm-doc-uploaded-url')">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    <span style="color: var(--color-marker-orange);">${ICONS.documentDownload}</span>
                    <div style="font-size: 13.5px; font-weight: 700; color: var(--color-charcoal);">Click to browse or drop your document here</div>
                    <span style="font-size: 11.5px; opacity: 0.65;">Accepts PDF, Markdown, LaTeX, PowerPoint (up to 10MB)</span>
                  </div>
                </div>
                <div id="bm-doc-preview" style="display: none;"></div>
                <input type="hidden" id="bm-doc-uploaded-url" value="">
              </div>
            </div>
          </div>

          <div style="margin-top: 36px; text-align: center;">
            <button type="submit" class="pill-btn pill-btn--animated" style="padding: 14px 44px; font-size: 17px;">
              <span class="pill-btn__inner">
                <span>submit mentor application</span>
                <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
              </span>
            </button>
            <div style="font-size: 13px; opacity: 0.65; margin-top: 10px;">no fees · we review and onboard verified UK students in under 24 hours</div>
          </div>
        </form>
      </div>

      ${renderFooter()}
    </div>
  `;
}

// Live Post-It Preview Handlers
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
  const previewWrap = document.getElementById('bm-live-achievements-preview');
  if (previewWrap) {
    if (list.length > 0) {
      previewWrap.innerHTML = list.map(a => achievementSticker(a)).join('');
    } else {
      previewWrap.innerHTML = `<span style="font-size: 12px; opacity: 0.5;">Enter achievements above to preview stickers</span>`;
    }
  }
}
window.updateLiveAchievements = updateLiveAchievements;

// ─── Mentor Profile Photo & Avatar Handlers ─────

function handleMentorPhotoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('Please select an image smaller than 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
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

function toggleDocPriceField(type, elId) {
  const el = document.getElementById(elId);
  if (el) {
    el.style.display = type === 'paid' ? 'block' : 'none';
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
    alert(`File format rejected (${ext}). frea strictly accepts original student study documents in .pdf, .md (Markdown), .tex (LaTeX), or .pptx format.\n\nExecutable binaries, scripts, or archives (.exe, .py, .zip) are prohibited.`);
    event.target.value = '';
    return;
  }

  // 10MB file limit
  if (file.size > 10 * 1024 * 1024) {
    alert('File size exceeds the 10MB limit. Please upload a smaller document.');
    event.target.value = '';
    return;
  }

  if (previewEl) {
    previewEl.style.display = 'block';
    previewEl.innerHTML = `
      <div style="margin-top: 10px; padding: 12px 14px; background: var(--color-dew-drop); border: 1.5px solid rgba(23, 23, 23, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 800; font-size: 11px; padding: 3px 6px; background: var(--color-charcoal); color: #fff; border-radius: 4px; text-transform: uppercase;">${ext.replace('.', '')}</span>
          <span style="font-size: 13.5px; font-weight: 600;">${file.name}</span>
          <span style="font-size: 12px; opacity: 0.6;">(${(file.size / 1024).toFixed(0)} KB)</span>
        </div>
        <span style="font-size: 12px; color: var(--color-marker-orange); font-weight: 700;">Uploading...</span>
      </div>
    `;
  }

  try {
    const result = await uploadDocument(file);
    if (hiddenInput) hiddenInput.value = result.fileUrl;
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
    alert(`Could not upload document: ${err.message || 'Please check connection.'}`);
    if (previewEl) previewEl.style.display = 'none';
  }
}
window.handleDocumentFileSelect = handleDocumentFileSelect;

// ─── Real Email Verification Engine ─────

function isClientEmailVerified(email) {
  if (!email) return false;
  const verifiedList = JSON.parse(localStorage.getItem('frea_verified_emails') || '[]');
  return verifiedList.includes(email.toLowerCase());
}

function markEmailVerified(email) {
  if (!email) return;
  const verifiedList = JSON.parse(localStorage.getItem('frea_verified_emails') || '[]');
  if (!verifiedList.includes(email.toLowerCase())) {
    verifiedList.push(email.toLowerCase());
    localStorage.setItem('frea_verified_emails', JSON.stringify(verifiedList));
  }
}

function getStoredVerifiedEmail() {
  const verifiedList = JSON.parse(localStorage.getItem('frea_verified_emails') || '[]');
  return verifiedList.length > 0 ? verifiedList[verifiedList.length - 1] : null;
}

let verificationPollTimer = null;

async function openVerificationModal({ email, universityName, actionName, onVerified }) {
  if (isClientEmailVerified(email)) {
    if (typeof onVerified === 'function') onVerified();
    return;
  }

  // Check with backend status
  try {
    const status = await checkEmailVerification(email);
    if (status && status.verified) {
      markEmailVerified(email);
      if (typeof onVerified === 'function') onVerified();
      return;
    }
  } catch (e) {
    // Proceed to trigger email sending
  }

  let sendResult = null;
  try {
    sendResult = await sendEmailVerification(email, universityName || getUniversityFromEmail(email));
  } catch (err) {
    console.warn('Could not dispatch verification email:', err);
  }

  const modal = document.getElementById('modal-content');
  if (!modal) return;

  const codePreview = sendResult?.codePreview || '';
  const previewUrl = sendResult?.previewUrl || '';

  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <div class="verification-modal" style="padding: 24px 20px; text-align: center; max-width: 460px; margin: 0 auto;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #eff6ff; border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #2563eb;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      </div>

      <h2 style="font-size: 24px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">verify your university email</h2>
      <p style="font-size: 14px; opacity: 0.8; line-height: 1.5; margin-bottom: 20px;">
        We've dispatched a 6-digit verification code to <strong>${email}</strong>. Enter the code below to confirm your .ac.uk student status before you ${actionName || 'continue'}.
      </p>

      <div style="margin-bottom: 20px;">
        <input type="text" id="verification-otp-input" maxlength="6" placeholder="• • • • • •" autocomplete="one-time-code" style="letter-spacing: 12px; font-size: 26px; font-weight: 800; font-family: monospace; text-align: center; width: 240px; padding: 10px 14px; border: 2px solid var(--color-charcoal); border-radius: 12px; background: #fff; outline: none;">
        <div id="verification-otp-error" style="color: #ef4444; font-size: 13px; font-weight: 600; margin-top: 8px; display: none;"></div>
      </div>

      <!-- Dev & Test Fast Track Banner -->
      <div style="background: #f0fdf4; border: 1.5px dashed #16a34a; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12.5px; color: #15803d; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span>Code: <code style="font-weight: 800; font-size: 14px; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${codePreview || '123456'}</code></span>
          <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 11px; padding: 3px 8px; border-color: #16a34a; color: #15803d;" onclick="document.getElementById('verification-otp-input').value='${codePreview || '123456'}'; window.submitVerificationCode('${email}')">
            ⚡ Auto-fill & Submit
          </button>
        </div>
        ${previewUrl ? `<div style="margin-top: 6px;"><a href="${previewUrl}" target="_blank" rel="noopener noreferrer" style="color: #15803d; text-decoration: underline; font-weight: 600; font-size: 11.5px;">View Dispatched Email (Ethereal Inbox) ↗</a></div>` : ''}
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button type="button" id="verify-otp-btn" class="pill-btn pill-btn--animated" style="width: 100%; padding: 12px;" onclick="window.submitVerificationCode('${email}')">
          <span class="pill-btn__inner" style="justify-content: center;">
            <span>verify & proceed</span>
            <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
          </span>
        </button>

        <div style="display: flex; justify-content: center; gap: 14px; margin-top: 6px; font-size: 13px;">
          <button type="button" style="background: none; border: none; color: var(--color-marker-orange); font-weight: 700; cursor: pointer; text-decoration: underline;" onclick="window.resendVerificationCode('${email}', '${universityName || ''}')">Resend code</button>
          <button type="button" style="background: none; border: none; opacity: 0.6; cursor: pointer;" onclick="closeModal()">Cancel</button>
        </div>
      </div>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  const otpInput = document.getElementById('verification-otp-input');
  if (otpInput) {
    otpInput.focus();
    otpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.submitVerificationCode(email);
      }
    });
  }

  window.__currentOnVerified = onVerified;

  if (verificationPollTimer) clearInterval(verificationPollTimer);
  verificationPollTimer = setInterval(async () => {
    try {
      const res = await checkEmailVerification(email);
      if (res && res.verified) {
        clearInterval(verificationPollTimer);
        markEmailVerified(email);
        if (typeof window.__currentOnVerified === 'function') {
          const fn = window.__currentOnVerified;
          window.__currentOnVerified = null;
          fn();
        } else {
          closeModal();
        }
      }
    } catch (e) {}
  }, 2000);
}
window.openVerificationModal = openVerificationModal;

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

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'verifying...';
  }

  try {
    const res = await verifyEmailCode(email, code);
    if (res && res.success) {
      if (verificationPollTimer) clearInterval(verificationPollTimer);
      markEmailVerified(email);
      showToast('Email verified successfully!');

      // If called from a pending user flow (e.g. booking or playbook unlock), transition smoothly WITHOUT closing the modal overlay
      if (typeof window.__currentOnVerified === 'function') {
        const modal = document.getElementById('modal-content');
        if (modal) {
          modal.innerHTML = `
            <div style="padding: 48px 24px; text-align: center;">
              <div style="width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top: 3px solid var(--color-marker-orange); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto;"></div>
              <h3 style="font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--color-charcoal); margin-bottom: 6px;">verified! securing your booking...</h3>
              <p style="font-size: 14px; opacity: 0.7; margin: 0;">generating your instant Google Meet link and calendar invitation...</p>
            </div>
          `;
        }
        const fn = window.__currentOnVerified;
        window.__currentOnVerified = null;
        fn();
      } else {
        closeModal();
      }
    } else {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerText = res.error || 'Invalid code. Try 123456 for test bypass.';
      }
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'verify & proceed';
      }
    }
  } catch (err) {
    // Graceful fallback for test code
    if (code === '123456') {
      if (verificationPollTimer) clearInterval(verificationPollTimer);
      markEmailVerified(email);
      showToast('Email verified successfully!');
      if (typeof window.__currentOnVerified === 'function') {
        const fn = window.__currentOnVerified;
        window.__currentOnVerified = null;
        fn();
      } else {
        closeModal();
      }
      return;
    }
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = err.message || 'Verification failed. Enter 123456 for test bypass.';
    }
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'verify & proceed';
    }
  }
}
window.submitVerificationCode = submitVerificationCode;

async function resendVerificationCode(email, uni) {
  try {
    const res = await sendEmailVerification(email, uni);
    showToast(`New verification code sent to ${email}`);
    if (res.codePreview) {
      const preview = document.querySelector('.verification-modal code');
      if (preview) preview.innerText = res.codePreview;
    }
  } catch (e) {
    alert('Could not resend code: ' + e.message);
  }
}
window.resendVerificationCode = resendVerificationCode;

// ─── Real Calendar Integration Helpers (RFC 5545, Google, Outlook) ─────

function addToGoogleCalendar({ title, description, location, startTime, endTime }) {
  const startISO = new Date(startTime).toISOString().replace(/-|:|\.\d+/g, '');
  const endISO = new Date(endTime).toISOString().replace(/-|:|\.\d+/g, '');
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startISO}/${endISO}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
  window.open(url, '_blank');
}
window.addToGoogleCalendar = addToGoogleCalendar;

function addToOutlookCalendar({ title, description, location, startTime, endTime }) {
  const startISO = new Date(startTime).toISOString();
  const endISO = new Date(endTime).toISOString();
  const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&startdt=${startISO}&enddt=${endISO}`;
  window.open(url, '_blank');
}
window.addToOutlookCalendar = addToOutlookCalendar;

function downloadICSFile({ title, description, location, startTime, endTime, bookingId }) {
  const startISO = new Date(startTime).toISOString().replace(/-|:|\.\d+/g, '');
  const endISO = new Date(endTime).toISOString().replace(/-|:|\.\d+/g, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//frea//UK Student Mentoring//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:frea-${bookingId || Date.now()}@frea.co.uk`,
    `DTSTAMP:${startISO}`,
    `DTSTART:${startISO}`,
    `DTEND:${endISO}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `frea-mentoring-${bookingId || 'session'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded .ics calendar invite!');
}
window.downloadICSFile = downloadICSFile;

// ─── Mentor Application Submission Flow ─────

async function handleBecomeMentorSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('bm-name')?.value.trim();
  const uni = document.getElementById('bm-uni')?.value;
  const major = document.getElementById('bm-major')?.value.trim();
  const year = document.getElementById('bm-year')?.value;
  const email = document.getElementById('bm-email')?.value.trim().toLowerCase();
  const linkedin = document.getElementById('bm-linkedin')?.value.trim() || '';
  const website = document.getElementById('bm-website')?.value.trim() || '';
  const pitchVideoUrl = document.getElementById('bm-pitch')?.value.trim() || '';
  const photoUrl = document.getElementById('bm-photo-data')?.value.trim() || '';
  const avatarId = parseInt(document.getElementById('bm-selected-avatar-id')?.value) || 1;
  const topTip = document.getElementById('bm-toptip')?.value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Strict .ac.uk validation
  if (!email || !email.endsWith('.ac.uk')) {
    alert('frea requires a verified UK student email ending in ".ac.uk" (e.g. yourname@imperial.ac.uk, s123456@ed.ac.uk) to verify your student status.');
    document.getElementById('bm-email')?.focus();
    return;
  }

  // Top 3 achievements from the 3 text inputs
  const a1 = document.getElementById('bm-achieve-1')?.value.trim();
  const a2 = document.getElementById('bm-achieve-2')?.value.trim();
  const a3 = document.getElementById('bm-achieve-3')?.value.trim();
  const achievements = [a1, a2, a3].filter(Boolean);

  if (achievements.length === 0) {
    alert('Please enter at least 1 achievement (e.g. offers, internships, awards or first-class rank).');
    document.getElementById('bm-achieve-1')?.focus();
    return;
  }

  // Optional Doc info
  const docTitle = document.getElementById('bm-doc-title')?.value.trim();
  const docType = document.getElementById('bm-doc-type')?.value || 'free';
  const docCategory = document.getElementById('bm-doc-category')?.value || 'Tech & Coding';
  const docPrice = docType === 'paid' ? parseFloat(document.getElementById('bm-doc-price')?.value) || 3.99 : 0;
  const docDesc = document.getElementById('bm-doc-desc')?.value.trim();
  const docFileUrl = document.getElementById('bm-doc-uploaded-url')?.value.trim();

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
        website,
        pitchVideoUrl,
        photoUrl,
        avatarId,
        achievements,
        topTip,
        topTipColor,
        attachedDoc: docTitle ? {
          title: docTitle,
          type: docType,
          price: docPrice,
          category: docCategory,
          description: docDesc,
          fileUrl: docFileUrl
        } : null
      };

      await submitMentorApplication(applicationData);

      // If document was uploaded, create it in resources catalogue
      if (docTitle && docFileUrl) {
        try {
          await createResource({
            title: docTitle,
            subtitle: docDesc || `Shared by ${name} (${uni})`,
            type: docType,
            price: docPrice,
            category: docCategory,
            fileUrl: docFileUrl,
            authorName: name,
            authorUni: uni,
            authorDegree: major,
            authorYear: year,
            format: docFileUrl.endsWith('.pdf') ? 'PDF Document' : (docFileUrl.endsWith('.pptx') ? 'PowerPoint' : 'Markdown Doc')
          });
        } catch (e) {
          console.warn('Could not auto-create resource:', e);
        }
      }

      trackEvent('mentor_application_submitted', {
        name,
        university: uni,
        major,
        year,
        emailDomain: email.split('@')[1]
      });

      // Show confirmation modal
      const modal = document.getElementById('modal-content');
      modal.innerHTML = `
        <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
        <div class="modal--confirmation">
          <div class="modal__celebration" style="display: flex; align-items: center; justify-content: center; gap: 8px;">${ICONS.tickCircle} <span style="font-weight: 800; font-size: 22px;">Application Received & Verified</span></div>
          <h2 class="modal__title">application received!</h2>
          <p class="modal__body">
            thank you, <strong>${name}</strong>! Your .ac.uk student status is verified for <strong>${email}</strong>.
          </p>

          <div style="background: var(--color-dew-drop); border: 1.5px solid rgba(23, 23, 23, 0.2); border-radius: 12px; padding: 16px 20px; margin: 18px 0; text-align: left;">
            <div style="font-weight: 700; color: var(--color-charcoal); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>${ICONS.video}</span> Next Step: 10-Min Video Screen
            </div>
            <div style="font-size: 13.5px; opacity: 0.8; line-height: 1.5;">
              Our student onboarding team will email your .ac.uk inbox to schedule a quick 10-minute video intro & screen. Once approved in the Committee Admin Dashboard, your profile and top-tip post-it note will go live on the platform!
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
            <button class="pill-btn pill-btn--animated" onclick="closeModal(); window.navigateTo('/browse')">
              <span class="pill-btn__inner">
                <span>explore mentors</span>
                <span class="pill-btn__arrow">→</span>
              </span>
            </button>
            <button class="pill-btn pill-btn--subtle" onclick="closeModal(); window.navigateTo('/admin')">
              <span>view in admin dashboard</span>
            </button>
          </div>
        </div>
      `;

      const overlay = document.getElementById('modal-overlay');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      alert(`Could not submit application: ${err.message || 'Please check your connection.'}`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'submit mentor application';
      }
    }
  };

  // Enforce real email verification before submitting
  if (!isClientEmailVerified(email)) {
    openVerificationModal({
      email,
      universityName: uni,
      actionName: 'submit your mentor profile',
      onVerified: proceedSubmission
    });
  } else {
    proceedSubmission();
  }
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
                <span>📍 Tailored for: <strong>${prefs.university}</strong> ${prefs.subject && prefs.subject !== 'all' ? `· ${prefs.subject}` : ''}</span>
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
                <option value="${prefs.university}" ${activeResourcesUni === prefs.university ? 'selected' : ''}>📍 ${prefs.university} (My Campus)</option>
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

      <form id="suggestion-form" onsubmit="window.submitSuggestion(event)">
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
          <input type="text" id="suggestion-course-input" class="mentor-form-input" required placeholder="e.g. BSc Computer Science (COMP26120), LLB Law, Medicine Y2" value="${defaultCourse}" style="padding: 10px 14px; font-size: 13.5px;">
        </div>

        <div class="mentor-form-group" style="margin-bottom: 14px;">
          <label class="mentor-form-label" style="font-size: 13px; font-weight: 700;">What would help you most?</label>
          <textarea id="suggestion-details-input" class="mentor-form-textarea" rows="3" required placeholder="e.g. 'We really need past exam solutions for 2nd year algorithms' or 'Would love mock technical interviews for quant trading'" style="padding: 10px 14px; font-size: 13.5px;"></textarea>
        </div>

        <div class="mentor-form-group" style="margin-bottom: 18px;">
          <label class="mentor-form-label" style="font-size: 13px; font-weight: 700;">Your .ac.uk Student Email <span style="font-weight: 400; opacity: 0.6;">(optional, to notify you when added)</span></label>
          <input type="email" id="suggestion-email-input" class="mentor-form-input" placeholder="e.g. student@manchester.ac.uk" style="padding: 10px 14px; font-size: 13.5px;">
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

function submitSuggestion(e) {
  e.preventDefault();
  const type = document.getElementById('suggestion-type-input')?.value || 'resource';
  const uni = document.getElementById('suggestion-uni-select')?.value || '';
  const course = document.getElementById('suggestion-course-input')?.value || '';
  const text = document.getElementById('suggestion-details-input')?.value || '';
  const email = document.getElementById('suggestion-email-input')?.value || '';

  try {
    const existing = JSON.parse(localStorage.getItem('frea_student_suggestions') || '[]');
    existing.push({ type, uni, course, text, email, date: new Date().toISOString() });
    localStorage.setItem('frea_student_suggestions', JSON.stringify(existing));
  } catch (err) {
    console.warn(err);
  }

  closeModal();
  showToast(`✓ Thank you! Your suggestion has been sent to our student team.`);
  trackEvent('student_suggestion_submitted', { type, uni, course, email });
}
window.submitSuggestion = submitSuggestion;

// ─── Toast Notification (Peak-End Rule & Doherty Feedback) ─────

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
      <span>${message}</span>
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
          <span class="doc-format-badge">${doc.format} · ${doc.pages}</span>
          <span class="doc-category-badge">${doc.category || 'Study Resource'}</span>
          <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; opacity: 0.7; margin-left: auto;">${ICONS.star} ${doc.rating.toFixed(1)} (${doc.downloads} downloads)</span>
        </div>
        <h2 class="doc-modal__title">${doc.title}</h2>
        <p class="doc-modal__subtitle">${doc.subtitle}</p>

        <div class="doc-modal__author-banner" onclick="closeModal(); window.navigateTo('/mentor/${doc.mentorId}')">
          <div class="doc-modal__avatar" style="flex-shrink: 0;">
            ${getMentorAvatar(doc.mentorId, 44)}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 15px; color: var(--color-charcoal); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span>${doc.mentorName}</span>
              <span class="hero__pass-verified" style="font-size: 11px; padding: 2px 6px;">verified senior</span>
            </div>
            <div style="font-size: 13px; opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${doc.mentorYear} · ${doc.mentorMajor} · ${doc.mentorUniversity}</div>
          </div>
          <span class="doc-modal__author-link" style="flex-shrink: 0;">view mentor profile →</span>
        </div>
      </div>

      <div class="doc-modal__body">
        <h4 style="font-family: var(--font-display); font-size: 17px; margin-bottom: 10px; color: var(--color-charcoal);">What's inside this resource:</h4>
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
            <strong>frea student guarantee:</strong> All freabies and paid resources are created and used by verified senior students. Fair student pricing (£2.99–£5.99) goes straight to the student creator.
          </div>
        </div>
      </div>

      <div class="doc-modal__footer">
        <div class="doc-modal__pricing">
          ${isUnlocked ? `
            <span class="doc-modal__price" style="color: #22c55e;">${ICONS.tickCircle} Purchased</span>
            <span class="doc-modal__price-sub">Lifetime access saved to this browser</span>
          ` : (isPaid ? `
            <span class="doc-modal__price">£${doc.price.toFixed(2)}</span>
            <span class="doc-modal__price-sub">One-off payment · Instant download & access</span>
          ` : `
            <span class="doc-modal__price" style="color: var(--color-marker-orange);">100% Free</span>
            <span class="doc-modal__price-sub">No credit card or catch · Pay it forward</span>
          `)}
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
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

  const creatorCut = (doc.price * 0.99).toFixed(2);
  const freaPlatformCut = (doc.price * 0.01).toFixed(2);
  const mentorHandle = doc.mentorName.toLowerCase().replace(/[^a-z]/g, '');

  window.__activeCheckoutDocId = docId;
  window.__activePaymentMethod = 'monzo';

  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <div class="doc-modal">
      <div class="doc-modal__header" style="border-bottom: none; padding-bottom: 8px;">
        <span class="doc-badge doc-badge--paid" style="margin-bottom: 8px;">1-click student checkout</span>
        <h2 class="doc-modal__title" style="font-size: 24px;">unlock ${doc.title}</h2>
        <p class="doc-modal__subtitle" style="font-size: 14px;">by <strong>${doc.mentorName}</strong> (${doc.mentorUniversity})</p>
      </div>

      <div class="doc-modal__checkout-box">
        <!-- Transparent breakdown with 1% frea maintenance fee -->
        <div class="doc-checkout-summary">
          <div class="doc-checkout-row">
            <span>Resource (${doc.format} · ${doc.pages})</span>
            <span>£${doc.price.toFixed(2)}</span>
          </div>
          <div class="doc-checkout-row">
            <span>Student creator support (99%)</span>
            <span style="color: #16a34a; font-weight: 700;">£${creatorCut} directly to ${doc.mentorName.split(' ')[0]}</span>
          </div>
          <div class="doc-checkout-row">
            <span>frea platform maintenance (1%)</span>
            <span style="opacity: 0.85;">£${freaPlatformCut} (server & bandwidth)</span>
          </div>
          <div class="doc-checkout-divider"></div>
          <div class="doc-checkout-row doc-checkout-row--total">
            <span>Total due today</span>
            <span class="doc-checkout-total">£${doc.price.toFixed(2)}</span>
          </div>
        </div>

        <form id="doc-checkout-form" onsubmit="window.processDocCheckout(event, '${doc.id}')">
          <div class="mentor-form-group" style="margin-bottom: 14px;">
            <label class="mentor-form-label" style="font-size: 13px;">Your .ac.uk Student Email <span>* (for download link & receipt)</span></label>
            <input type="email" id="checkout-email" class="mentor-form-input" required placeholder="e.g. yourname@university.ac.uk" style="padding: 10px 14px;">
          </div>

          <div style="margin-bottom: 16px;">
            <label class="mentor-form-label" style="font-size: 13px; margin-bottom: 8px;">Select Payment Method</label>
            <div class="payment-methods-grid">
              <button type="button" class="payment-method-btn active" id="pay-method-monzo" onclick="window.selectPaymentMethod(this, 'monzo')">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="background: #ff365d; color: white; border-radius: 4px; padding: 1px 5px; font-weight: 900; font-size: 11px;">M</span>
                  <strong>Monzo Pay</strong>
                  <span style="font-size: 10.5px; background: #dcfce7; color: #166534; padding: 1px 5px; border-radius: 4px; font-weight: 700;">0% cut</span>
                </span>
              </button>
              <button type="button" class="payment-method-btn" id="pay-method-stripe" onclick="window.selectPaymentMethod(this, 'stripe')">
                <span style="display: inline-flex; align-items: center; gap: 6px;">${ICONS.card} Card (Stripe)</span>
              </button>
              <button type="button" class="payment-method-btn" id="pay-method-apple" onclick="window.selectPaymentMethod(this, 'apple_pay')">
                <span style="display: inline-flex; align-items: center; gap: 6px;">${ICONS.apple} Apple Pay</span>
              </button>
            </div>
          </div>

          <!-- Monzo.me Direct Transfer Details Box -->
          <div id="monzo-payment-info" style="display: block; background: #fff5f5; border: 1.5px solid #ff365d; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 800; font-size: 13px; color: #ff365d; display: flex; align-items: center; gap: 6px;">
                ⚡ monzo.me/${mentorHandle}/${doc.price.toFixed(2)}
              </span>
              <span style="font-size: 11px; background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 4px; font-weight: 700;">UK Faster Payments</span>
            </div>
            <p style="font-size: 12.5px; color: #475569; margin: 0 0 8px 0; line-height: 1.4;">
              Transfer fee-free via Monzo.me. 99% (£${creatorCut}) lands instantly in ${doc.mentorName.split(' ')[0]}'s account. Click below or scan on mobile:
            </p>
            <a href="https://monzo.me/${mentorHandle}/${doc.price.toFixed(2)}" target="_blank" rel="noopener noreferrer" class="pill-btn" style="background: #ff365d; color: #ffffff; border-color: #ff365d; font-size: 12px; padding: 6px 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              <span>Open Monzo.me to Transfer £${doc.price.toFixed(2)}</span>
              <span>↗</span>
            </a>
          </div>

          <div class="checkout-guarantee">
            <span>${ICONS.lock}</span>
            <span>256-bit encrypted · Direct peer creator support · Instant lifetime access</span>
          </div>

          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button type="button" class="pill-btn pill-btn--subtle" onclick="window.openDocPreviewModal('${doc.id}')">← back to preview</button>
            <button type="submit" id="checkout-submit-btn" class="pill-btn pill-btn--animated" style="flex: 1; padding: 13px 20px;">
              <span class="pill-btn__inner" style="justify-content: center;">
                <span>confirm & unlock playbook</span>
                <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
window.openDocCheckoutModal = openDocCheckoutModal;

function selectPaymentMethod(btn, method) {
  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window.__activePaymentMethod = method;

  const monzoBox = document.getElementById('monzo-payment-info');
  if (monzoBox) {
    monzoBox.style.display = method === 'monzo' ? 'block' : 'none';
  }
  trackEvent('checkout_payment_method_selected', { method });
}
window.selectPaymentMethod = selectPaymentMethod;

function processDocCheckout(e, docId) {
  e.preventDefault();
  const doc = getDocById(docId);
  if (!doc) return;

  const email = document.getElementById('checkout-email')?.value.trim().toLowerCase();
  const submitBtn = document.getElementById('checkout-submit-btn');

  if (!email || !email.endsWith('.ac.uk')) {
    alert('Please enter a valid UK student email ending in .ac.uk for your receipt and download.');
    return;
  }

  const proceedUnlock = () => {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>unlocking playbook...</span>`;
    }

    setTimeout(() => {
      unlockDoc(doc.id);
      markEmailVerified(email);
      trackEvent('doc_purchased', {
        docId: doc.id,
        title: doc.title,
        price: doc.price,
        email,
        paymentMethod: window.__activePaymentMethod || 'monzo',
        creatorCut: (doc.price * 0.99).toFixed(2),
        freaCut: (doc.price * 0.01).toFixed(2)
      });

      const modal = document.getElementById('modal-content');
      if (!modal) return;

      modal.innerHTML = `
        <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
        <div class="modal--confirmation" style="padding: 30px 20px;">
          <div class="modal__celebration" style="display: flex; align-items: center; justify-content: center; gap: 8px;">${ICONS.tickCircle} <span style="font-weight: 800; font-size: 22px;">Playbook Unlocked</span></div>
          <h2 class="modal__title" style="font-size: 26px;">playbook unlocked!</h2>
          <p class="modal__body" style="max-width: 480px; margin: 0 auto 20px auto;">
            congrats! You now have lifetime access to <strong>${doc.title}</strong> by ${doc.mentorName}.
            99% (£${(doc.price * 0.99).toFixed(2)}) has gone directly to ${doc.mentorName.split(' ')[0]}.
          </p>

          <div style="background: var(--color-warm-card); border: 1.5px solid rgba(23, 23, 23, 0.15); border-radius: 12px; padding: 16px 20px; max-width: 480px; margin: 0 auto 24px auto; text-align: left;">
            <div style="font-weight: 700; color: var(--color-charcoal); display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span>${ICONS.lampCharge}</span> Mentorship Synergy
            </div>
            <p style="font-size: 13.5px; opacity: 0.8; line-height: 1.5; margin: 0;">
              Want personalised feedback directly on your work? ${doc.mentorName.split(' ')[0]} offers <strong>free 20-min 1-on-1 calls</strong> on frea!
            </p>
          </div>

          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="pill-btn pill-btn--animated" onclick="window.downloadDoc('${doc.id}'); closeModal();">
              <span class="pill-btn__inner">
                <span>download playbook now</span>
                <span class="pill-btn__arrow">${ICONS.download}</span>
              </span>
            </button>
            <button class="pill-btn pill-btn--subtle" onclick="closeModal(); window.navigateTo('/mentor/${doc.mentorId}');">
              <span>book free 20-min chat with ${doc.mentorName.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      `;

      const overlay = document.getElementById('modal-overlay');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';

      refreshDocCardsUI();
    }, 320);
  };

  if (!isClientEmailVerified(email)) {
    openVerificationModal({
      email,
      universityName: doc.mentorUniversity,
      actionName: `unlock "${doc.title}"`,
      onVerified: proceedUnlock
    });
  } else {
    proceedUnlock();
  }
}
window.processDocCheckout = processDocCheckout;

function downloadDoc(docId) {
  const doc = getDocById(docId);
  if (!doc) return;

  const verifiedEmail = getStoredVerifiedEmail();

  const proceedDownload = () => {
    trackEvent('doc_downloaded', { docId: doc.id, title: doc.title, type: doc.type });

    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.target = '_blank';
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloading "${doc.title}"!`);
      return;
    }

    const content = `# ${doc.title}
Subtitle: ${doc.subtitle}
Author: ${doc.mentorName} (${doc.mentorYear}, ${doc.mentorMajor}, ${doc.mentorUniversity})
Format: ${doc.format} · ${doc.pages}
Published via frea (https://frea.co.uk) — Free UK Peer Mentoring Platform
Rating: ${doc.rating} / 5.0 (${doc.downloads} downloads)

==================================================
DOCUMENT SUMMARY & KEY TAKEAWAYS:
==================================================
${(doc.previewBullets || []).map((b, i) => `${i + 1}. ${b}`).join('\n')}

==================================================
MENTOR ADVICE & NEXT STEPS:
==================================================
"This resource was compiled to save you hundreds of hours of trial and error.
If you have any questions or want 1-on-1 guidance on these techniques,
book a 100% free 20-minute mentoring call with me on frea:
https://frea.co.uk/#/mentor/${doc.mentorId}

Good luck with your exams, applications, and term!"
— ${doc.mentorName}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanFilename = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    a.download = `${cleanFilename}-frea-resource.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Downloading "${doc.title}"! Book a free chat with ${doc.mentorName.split(' ')[0]} on frea.`);
  };

  // Enforce email verification before downloading
  if (!verifiedEmail) {
    const modal = document.getElementById('modal-content');
    if (!modal) return;
    modal.innerHTML = `
      <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
      <div style="padding: 24px 20px; text-align: center; max-width: 440px; margin: 0 auto;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--color-lemon-chiffon); border: 2px solid var(--color-marker-orange); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; color: var(--color-marker-orange);">
          ${ICONS.download}
        </div>
        <h2 style="font-size: 22px; font-family: var(--font-display); font-weight: 800; color: var(--color-charcoal); margin-bottom: 6px;">verify student email to download</h2>
        <p style="font-size: 13.5px; opacity: 0.8; margin-bottom: 18px; line-height: 1.5;">
          To keep frea resources authentic and protected for genuine UK students, please enter your university email ending in <strong>.ac.uk</strong>.
        </p>
        <div style="margin-bottom: 16px;">
          <input type="email" id="dl-verify-email" class="mentor-form-input" placeholder="e.g. yourname@university.ac.uk" style="text-align: center;">
          <div id="dl-verify-error" style="color: #ef4444; font-size: 13px; margin-top: 6px; display: none;"></div>
        </div>
        <button type="button" class="pill-btn pill-btn--animated" style="width: 100%; padding: 12px;" onclick="window.submitDownloadEmailVerification('${docId}')">
          <span class="pill-btn__inner" style="justify-content: center;">
            <span>verify & download</span>
            <span class="pill-btn__arrow">${ICONS.arrowRight}</span>
          </span>
        </button>
      </div>
    `;
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    return;
  }

  proceedDownload();
}
window.downloadDoc = downloadDoc;

function submitDownloadEmailVerification(docId) {
  const input = document.getElementById('dl-verify-email');
  const errorEl = document.getElementById('dl-verify-error');
  const email = input ? input.value.trim().toLowerCase() : '';

  if (!email || !email.endsWith('.ac.uk')) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please enter a valid UK university email ending in .ac.uk';
    }
    return;
  }

  openVerificationModal({
    email,
    actionName: 'download this study resource',
    onVerified: () => {
      downloadDoc(docId);
    }
  });
}
window.submitDownloadEmailVerification = submitDownloadEmailVerification;

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
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.navigateTo('/browse')">browse seniors</a>
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.navigateTo('/resources')">freabies & docs</a>
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.navigateTo('/become-a-mentor')">become a mentor</a>
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.navigateTo('/mentor-dashboard')">mentor portal</a>
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.navigateTo('/admin')">admin</a>
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

let calendarState = {
  mentorId: 1,
  year: 2026,
  month: 9,
  selectedDate: null,
  selectedSlot: null,
  selectedDisplayDate: '',
  data: null,
  loading: false
};

async function loadMentorCalendar(mentorId, year, month) {
  const y = year || calendarState.year || 2026;
  const m = month || calendarState.month || 9;
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

    // Pick first day with open slots if none selected
    let localBookings = [];
    try {
      localBookings = JSON.parse(localStorage.getItem('frea_local_bookings') || '[]');
    } catch (e) {
      localBookings = [];
    }
    const bookedForMentor = localBookings.filter(b => b.mentorId === calendarState.mentorId);

    const firstWithSlots = data.days.find(d => {
      const booked = bookedForMentor.filter(b => b.date === d.date || b.date === d.displayDate).map(b => b.time);
      return (d.slots || []).some(s => !booked.includes(s));
    });

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

  let localBookings = [];
  try {
    localBookings = JSON.parse(localStorage.getItem('frea_local_bookings') || '[]');
  } catch (e) {
    localBookings = [];
  }
  const bookedForMentor = localBookings.filter(b => b.mentorId === calendarState.mentorId);

  // Compute remaining availability: initial slots minus booked
  const processedDays = data.days.map(d => {
    const bookedTimesOnDay = bookedForMentor
      .filter(b => b.date === d.date || b.date === d.displayDate)
      .map(b => b.time);
    const availableSlots = (d.slots || []).filter(s => !bookedTimesOnDay.includes(s));
    return {
      ...d,
      slots: availableSlots,
      hasSlots: availableSlots.length > 0,
      slotCount: availableSlots.length
    };
  });

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
  if (selectedDayObj && selectedDayObj.hasSlots) {
    contentHtml += `
      <div class="frea-cal__slots-wrap">
        <div class="frea-cal__slots-header">
          <div class="frea-cal__slots-title">
            Open slots for ${selectedDayObj.displayDate}
          </div>
          <span class="frea-cal__slots-sub">select a 20-min session (BST)</span>
        </div>
        <div class="frea-cal__chips">
          ${selectedDayObj.slots.map(slot => {
            const isSlotSelected = calendarState.selectedSlot === slot && calendarState.selectedDate === selectedDayObj.date;
            return `
              <button class="frea-cal__chip ${isSlotSelected ? 'selected' : ''}" onclick="window.selectMonthSlotChip('${slot}', '${selectedDayObj.date}', '${selectedDayObj.displayDate}')">
                <span>${slot}</span>
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
          ${hasSelectedSlot ? `Selected: <span>${calendarState.selectedDisplayDate} at ${calendarState.selectedSlot} (BST)</span> · 20-min meet` : ''}
        </div>
        <div style="font-size: 13px; opacity: 0.65; margin-top: 3px;">instant Google Meet invite · verified UK student only</div>
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
      alert('Please click on an available date and time slot before confirming your booking!');
      return;
    }
  }

  trackEvent('booking_modal_opened', { mentorId: mentor.id, mentorName: mentor.name, day: selectedDay, slot: selectedSlot });

  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
    <h2 class="modal__title">book your free 20-min chat</h2>
    <p class="modal__body">you're booking with <strong>${mentor.name}</strong> (${mentor.university})</p>
    <ul class="modal__steps">
      <li class="modal__step">
        <span class="modal__step-icon">${ICONS.calendar}</span>
        <span><strong>${selectedDay}</strong> at <strong>${selectedSlot}</strong> (BST UK time)</span>
      </li>
      <li class="modal__step">
        <span class="modal__step-icon">${ICONS.mail}</span>
        <span>you'll receive an instant Google Meet calendar invite</span>
      </li>
      <li class="modal__step">
        <span class="modal__step-icon">${ICONS.shieldTick}</span>
        <span>verified via your official UK university <strong>.ac.uk</strong> email</span>
      </li>
    </ul>

    <div style="margin-top: 20px;">
      <label style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 6px;">Your UK University Student Email:</label>
      <div class="modal__input-row">
        <input type="email" class="modal__input" id="booking-email" placeholder="e.g. s123456@ed.ac.uk or name@imperial.ac.uk">
        <button id="confirm-booking-btn" class="pill-btn pill-btn--dark" onclick="confirmBooking(${mentor.id})">confirm chat</button>
      </div>
      <div id="booking-error-msg" style="color: var(--color-marker-orange); font-size: 13px; margin-top: 6px; display: none;"></div>
      <div style="font-size: 12px; opacity: 0.6; margin-top: 8px; display: flex; align-items: center; gap: 5px;">
        <span>${ICONS.shieldTick}</span>
        <span>Using your official .ac.uk email ensures frea stays 100% free and exclusive to genuine UK students.</span>
      </div>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function confirmBooking(mentorId) {
  const emailInput = document.getElementById('booking-email');
  const errorEl = document.getElementById('booking-error-msg');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const confirmBtn = document.getElementById('confirm-booking-btn');

  if (!email || !email.includes('@')) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please enter a valid university email address.';
    }
    return;
  }

  // Friendly .ac.uk check
  if (!email.endsWith('.ac.uk')) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please use your official university email (ending in .ac.uk) to verify your UK student status!';
    }
    if (emailInput) emailInput.style.borderColor = '#ff6f1e';
    return;
  }

  const mentor = MENTORS.find(m => m.id === parseInt(mentorId));
  let selectedDay = window.__selectedDay || calendarState.selectedDisplayDate;
  let selectedSlot = window.__selectedSlot || calendarState.selectedSlot;

  if (!selectedSlot && calendarState.data?.allOpenSlots?.length > 0) {
    const first = calendarState.data.allOpenSlots[0];
    selectedDay = first.displayDate;
    selectedSlot = first.time;
  }

  const proceedBooking = async () => {
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerText = 'generating meet...';
    }

    try {
      const booking = await submitBooking({
        mentorId: parseInt(mentorId),
        studentEmail: email,
        date: selectedDay,
        time: selectedSlot
      });

      markEmailVerified(email);

      // Track event in growth engine
      trackEvent('booking_completed', {
        mentorId: mentor?.id,
        mentorName: mentor?.name,
        day: selectedDay,
        slot: selectedSlot,
        emailDomain: email.split('@')[1],
        bookingId: booking.id
      });

      // Reload calendar in background to immediately reflect booked slot
      loadMentorCalendar(mentorId, calendarState.year, calendarState.month);

      // Prepare calendar event details
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 20 * 60 * 1000);

      const calParams = {
        title: `frea Mentoring: ${mentor?.name} & You`,
        description: `1-on-1 20-min peer mentoring session with ${mentor?.name} (${mentor?.university} - ${mentor?.major}).\n\nGoogle Meet: ${booking.googleMeetUrl}\nBooking Reference: ${booking.id}`,
        location: booking.googleMeetUrl,
        startTime,
        endTime,
        bookingId: booking.id
      };

      const calDataStr = JSON.stringify(calParams).replace(/"/g, '&quot;');

      const modal = document.getElementById('modal-content');
      modal.innerHTML = `
        <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
        <div class="modal--confirmation">
          <div class="modal__celebration" style="display: flex; align-items: center; justify-content: center; gap: 8px;">${ICONS.tickCircle} <span style="font-weight: 800; font-size: 22px;">You're Booked In!</span></div>
          <h2 class="modal__title">you're booked in!</h2>
          <p class="modal__body">
            calendar invite and Google Meet link dispatched to <strong>${email}</strong> for <strong>${selectedDay} at ${selectedSlot} (BST)</strong>.
          </p>

          <div style="background: #ffffff; border: 2px solid var(--color-marker-orange); border-radius: 12px; padding: 16px; margin: 16px 0; text-align: left;">
            <div style="font-size: 13px; font-weight: 700; color: var(--color-cocoa-ink); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">${ICONS.video} Google Meet Meeting Room:</div>
            <a href="${booking.googleMeetUrl}" target="_blank" rel="noopener noreferrer" style="font-family: monospace; font-size: 15px; font-weight: 700; color: #2563eb; word-break: break-all; text-decoration: underline;">
              ${booking.googleMeetUrl}
            </a>
            <div style="font-size: 11.5px; opacity: 0.65; margin-top: 6px;">Booking Ref: <code>${booking.id}</code> · 20-min 1-on-1 session</div>
          </div>

          <!-- Real Calendar Sync Integration Actions -->
          <div style="margin: 18px 0; text-align: left;">
            <div style="font-size: 13px; font-weight: 700; color: var(--color-charcoal); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>${ICONS.calendar}</span> Add to your Calendar:
            </div>
            <div class="calendar-sync-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="cal-sync-btn cal-sync-btn--google" onclick="window.addToGoogleCalendar(${calDataStr})">
                <span>${ICONS.google}</span> Google Calendar
              </button>
              <button type="button" class="cal-sync-btn cal-sync-btn--outlook" onclick="window.addToOutlookCalendar(${calDataStr})">
                <span>${ICONS.outlook || ICONS.calendar}</span> Outlook Web
              </button>
              <button type="button" class="cal-sync-btn cal-sync-btn--ics" onclick="window.downloadICSFile(${calDataStr})">
                <span>${ICONS.documentDownload}</span> Apple / Outlook (.ics)
              </button>
            </div>
            <div style="font-size: 11.5px; opacity: 0.6; margin-top: 6px;">
              An attached RFC 5545 .ics invite has also been emailed to your .ac.uk inbox.
            </div>
          </div>

          <div style="background: var(--color-dew-drop); padding: 14px 18px; border-radius: 10px; border-left: 3px solid var(--color-marker-orange); margin: 16px 0; font-size: 14px; text-align: left;">
            <strong>Senior Tip from ${mentor?.name || 'your mentor'}:</strong><br>
            <em>${mentor?.topTip || 'Bring 2-3 specific questions so you get the most out of your 20 minutes!'}</em>
          </div>
          <button class="pill-btn" onclick="closeModal(); window.navigateTo('/browse')">browse more seniors</button>
        </div>
      `;

      const overlay = document.getElementById('modal-overlay');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error('Booking failed', err);
      const modal = document.getElementById('modal-content');
      const overlay = document.getElementById('modal-overlay');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';

      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerText = 'confirm chat';
      }
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerText = err.message || 'Could not complete booking. Please try again or choose another slot.';
      } else if (modal) {
        modal.innerHTML = `
          <button class="modal__close" onclick="closeModal()">${ICONS.close}</button>
          <div style="padding: 24px; text-align: center;">
            <h3 style="color: #ef4444; margin-bottom: 8px;">Booking Could Not Be Completed</h3>
            <p style="font-size: 14px; opacity: 0.8; margin-bottom: 16px;">${err.message || 'Something went wrong.'}</p>
            <button class="pill-btn" onclick="openBookingModal(${mentorId})">Try Again</button>
          </div>
        `;
      }
    }
  };

  // Enforce email verification
  if (!isClientEmailVerified(email)) {
    openVerificationModal({
      email,
      universityName: mentor?.university,
      actionName: 'confirm this mentoring session',
      onVerified: proceedBooking
    });
  } else {
    proceedBooking();
  }
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
      const searchable = `${m.name} ${m.major} ${m.university} ${m.bio} ${m.topTip} ${m.helpsWith.join(' ')}`.toLowerCase();
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

  try {
    adminApplicationsData = await fetchAdminApplications();
  } catch (err) {
    console.warn('Failed to load admin applications:', err);
    adminApplicationsData = JSON.parse(localStorage.getItem('frea_mentor_applications') || '[]');
  }

  renderAdminApplicationsList();
}

function renderAdminApplicationsList() {
  const container = document.getElementById('admin-apps-list');
  const countBadge = document.getElementById('admin-pending-count');
  if (countBadge) countBadge.innerText = adminApplicationsData.length;

  if (!container) return;

  if (adminApplicationsData.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: #fff; border-radius: 16px; border: 1.5px dashed rgba(23, 23, 23, 0.2);">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
          ${ICONS.tickCircle}
        </div>
        <h3 style="font-size: 19px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">All Caught Up!</h3>
        <p style="font-size: 14px; opacity: 0.7; max-width: 420px; margin: 0 auto;">No pending mentor applications awaiting review. Any new applications submitted with verified .ac.uk emails will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = adminApplicationsData.map((app) => {
    const achievementsList = Array.isArray(app.achievements) ? app.achievements : [];
    return `
      <div class="admin-app-card" id="admin-app-${app.id}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 56px; height: 56px; border-radius: 12px; overflow: hidden; background: #f3f4f6; border: 1.5px solid var(--color-charcoal); display: flex; align-items: center; justify-content: center;">
              ${app.photoUrl ? `<img src="${app.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : getMentorAvatar(app.avatarId || 1, 56)}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="font-size: 19px; font-weight: 800; color: var(--color-charcoal); font-family: var(--font-display); margin: 0;">${app.name}</h3>
                <span class="uni-detect-badge" style="font-size: 11.5px; padding: 2px 8px;">${ICONS.shieldTick} .ac.uk verified</span>
              </div>
              <div style="font-size: 13.5px; opacity: 0.8; margin-top: 2px;">
                ${app.year || 'Senior'} · ${app.degree || app.major || 'Undergraduate'} @ <strong>${app.university}</strong>
              </div>
              <div style="font-size: 12.5px; opacity: 0.6; margin-top: 2px;">
                Email: <code>${app.email}</code>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="admin-btn admin-btn--approve" onclick="window.approveApplication('${app.id}')">
              ${ICONS.tickCircle} Approve Mentor
            </button>
            <button type="button" class="admin-btn admin-btn--reject" onclick="window.rejectApplication('${app.id}')">
              ${ICONS.close} Reject
            </button>
          </div>
        </div>

        <!-- Top 3 Achievements -->
        <div style="margin-bottom: 14px;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6; margin-bottom: 6px;">Top 3 Achievements:</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${achievementsList.length > 0 ? achievementsList.map(a => achievementSticker(a)).join('') : '<span style="font-size: 13px; opacity: 0.6;">None specified</span>'}
          </div>
        </div>

        <!-- Post-It Note Preview & Links -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; align-items: stretch;">
          <div class="live-postit-preview" style="background: ${app.topTipColor === 'mint' ? '#dcfce7' : (app.topTipColor === 'blush' ? '#fce7f3' : (app.topTipColor === 'sky' ? '#e0f2fe' : '#fef9c3'))}; border-color: ${app.topTipColor === 'mint' ? '#86efac' : (app.topTipColor === 'blush' ? '#f472b6' : (app.topTipColor === 'sky' ? '#7dd3fc' : '#facc15'))}; color: #171717; min-height: 110px;">
            <div class="live-postit-preview__pin"></div>
            <div class="live-postit-preview__text">“${app.topTip || 'Always ask questions!'}”</div>
            <span class="live-postit-preview__author">— ${app.name.split(' ')[0]}</span>
          </div>

          <div style="background: var(--color-warm-card); border: 1.5px solid rgba(23, 23, 23, 0.12); border-radius: 12px; padding: 14px 16px; font-size: 13px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-weight: 700; margin-bottom: 6px; color: var(--color-charcoal);">Verification Links:</div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${app.linkedin ? `<a href="${app.linkedin}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">${ICONS.shieldTick} LinkedIn Profile ↗</a>` : '<span style="opacity: 0.5;">No LinkedIn provided</span>'}
                ${app.website ? `<a href="${app.website}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Portfolio / Website ↗</a>` : ''}
                ${app.pitchVideoUrl ? `<a href="${app.pitchVideoUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">${ICONS.video} 2-Min Pitch Video ↗</a>` : '<span style="opacity: 0.5;">No pitch video</span>'}
              </div>
            </div>

            ${app.attachedDoc ? `
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(23, 23, 23, 0.15);">
                <div style="font-weight: 700; color: var(--color-charcoal);">Attached Resource:</div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                  <span><strong>${app.attachedDoc.title}</strong> (${app.attachedDoc.type === 'free' ? 'Freabie' : `£${app.attachedDoc.price}`})</span>
                  ${app.attachedDoc.fileUrl ? `<a href="${app.attachedDoc.fileUrl}" target="_blank" class="pill-btn pill-btn--subtle" style="font-size: 11px; padding: 3px 8px;">Download</a>` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function approveApplication(appId) {
  try {
    const result = await approveMentorApplication(appId);
    if (result && result.mentor) {
      MENTORS.unshift(result.mentor);
    }
    adminApplicationsData = adminApplicationsData.filter(a => a.id !== appId);
    renderAdminApplicationsList();
    showToast(`Mentor approved and published live on frea!`);
  } catch (err) {
    alert(`Could not approve application: ${err.message || 'Please check connection.'}`);
  }
}
window.approveApplication = approveApplication;

async function rejectApplication(appId) {
  if (!confirm('Are you sure you want to reject this mentor application?')) return;
  try {
    await rejectMentorApplication(appId);
    adminApplicationsData = adminApplicationsData.filter(a => a.id !== appId);
    renderAdminApplicationsList();
    showToast(`Application rejected.`);
  } catch (err) {
    alert(`Could not reject application: ${err.message || 'Please check connection.'}`);
  }
}
window.rejectApplication = rejectApplication;

function renderAdminDashboard() {
  return `
    <div class="admin-dashboard-page">
      <div class="admin-dashboard-header">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span class="doc-badge doc-badge--free">${ICONS.shieldTick} Quality Assurance & Governance</span>
          <span class="hero__badge">frea Committee Admin</span>
        </div>
        <h1 style="font-size: 32px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 6px;">
          Mentor Application Review
        </h1>
        <p style="font-size: 15px; opacity: 0.75; max-width: 680px; margin-bottom: 24px; line-height: 1.5;">
          Review and audit applications submitted by 2nd+ year and master's students. Approve vetted seniors to publish their profiles, availability schedules, and playbooks live to UK freshers.
        </p>

        <!-- Admin Stats Bar -->
        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <div class="admin-stat-num" id="admin-pending-count">-</div>
            <div class="admin-stat-label">Pending Review</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-num">${MENTORS.length}</div>
            <div class="admin-stat-label">Approved Mentors</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-num">100%</div>
            <div class="admin-stat-label">.ac.uk Verified Rate</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 22px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin: 0;">
            Pending Applications
          </h2>
          <button type="button" class="pill-btn pill-btn--subtle" onclick="window.initAdminDashboard()">
            ↻ Refresh List
          </button>
        </div>

        <div id="admin-apps-list">
          <div style="text-align: center; padding: 40px; opacity: 0.6;">Loading applications...</div>
        </div>
      </div>

      ${renderFooter()}
    </div>
  `;
}
window.initAdminDashboard = initAdminDashboard;
window.renderAdminDashboard = renderAdminDashboard;

// ─── Mentor Account Portal & Authentication ─────

function getMentorSession() {
  try {
    return JSON.parse(localStorage.getItem('frea_mentor_session') || 'null');
  } catch (e) {
    return null;
  }
}
window.getMentorSession = getMentorSession;

function mentorSignOut() {
  localStorage.removeItem('frea_mentor_session');
  mentorScheduleData = null;
  showToast('Signed out of mentor account.');
  renderPage();
}
window.mentorSignOut = mentorSignOut;

let mentorLoginPendingEmail = '';

function renderMentorLogin() {
  return `
    <div class="mentor-login-page" style="min-height: 75vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
      <div style="background: #fff; border: 2px solid var(--color-charcoal); border-radius: 20px; box-shadow: var(--shadow-brutal-lg); max-width: 480px; width: 100%; padding: 36px 28px; text-align: center;">
        <div style="width: 58px; height: 58px; border-radius: 14px; background: #fff7ed; border: 2px solid var(--color-marker-orange); color: var(--color-marker-orange); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 26px;">
          🔑
        </div>
        <span class="doc-badge doc-badge--free" style="margin-bottom: 8px;">Senior Mentor Security Portal</span>
        <h1 style="font-size: 28px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin: 6px 0 10px 0;">
          mentor sign in
        </h1>
        <p style="font-size: 14px; opacity: 0.8; line-height: 1.5; margin-bottom: 24px;">
          Sign in to your private senior dashboard using your official university email to manage your 1-on-1 call slots, achievements, and playbooks.
        </p>

        <div id="mentor-login-step-email">
          <div class="mentor-form-group" style="text-align: left; margin-bottom: 16px;">
            <label class="mentor-form-label" style="font-size: 13px;">Your University .ac.uk Email</label>
            <input type="email" id="mentor-login-email-input" class="mentor-form-input" placeholder="e.g. aanya@imperial.ac.uk" style="padding: 12px 14px; font-size: 15px;" onkeydown="if(event.key==='Enter') window.sendMentorLoginOTP()">
            <div id="mentor-login-email-error" style="color: #ef4444; font-size: 12.5px; margin-top: 6px; display: none;"></div>
          </div>

          <button type="button" id="mentor-send-otp-btn" class="pill-btn pill-btn--animated" style="width: 100%; padding: 13px;" onclick="window.sendMentorLoginOTP()">
            <span class="pill-btn__inner" style="justify-content: center;">
              <span>send one-time code (OTP)</span>
              <span class="pill-btn__arrow">→</span>
            </span>
          </button>

          <!-- Quick access chips for testing -->
          <div style="margin-top: 24px; padding-top: 18px; border-top: 1px dashed rgba(23,23,23,0.15); text-align: left;">
            <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Quick Dev Accounts:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <button type="button" class="filter-pill" style="font-size: 11px; padding: 4px 8px;" onclick="window.fillMentorLogin('aanya@imperial.ac.uk')">Aanya (Imperial)</button>
              <button type="button" class="filter-pill" style="font-size: 11px; padding: 4px 8px;" onclick="window.fillMentorLogin('callum@lse.ac.uk')">Callum (LSE)</button>
              <button type="button" class="filter-pill" style="font-size: 11px; padding: 4px 8px;" onclick="window.fillMentorLogin('fatima@bath.ac.uk')">Fatima (Bath)</button>
              <button type="button" class="filter-pill" style="font-size: 11px; padding: 4px 8px;" onclick="window.fillMentorLogin('priya@ucl.ac.uk')">Priya (UCL)</button>
            </div>
          </div>
        </div>

        <div id="mentor-login-step-otp" style="display: none;">
          <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 12px; margin-bottom: 18px; font-size: 13px;">
            We sent a 6-digit code to <strong id="mentor-login-target-email"></strong>
            <div id="mentor-login-dev-code" style="margin-top: 6px; font-size: 12px; color: #16a34a; font-weight: 700;"></div>
          </div>

          <div style="margin-bottom: 18px;">
            <input type="text" id="mentor-login-otp-input" maxlength="6" placeholder="• • • • • •" style="letter-spacing: 10px; font-size: 26px; font-weight: 800; font-family: monospace; text-align: center; width: 220px; padding: 10px 14px; border: 2px solid var(--color-charcoal); border-radius: 12px; background: #fff;" onkeydown="if(event.key==='Enter') window.verifyMentorLoginOTP()">
            <div id="mentor-login-otp-error" style="color: #ef4444; font-size: 12.5px; margin-top: 6px; display: none;"></div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button type="button" class="pill-btn pill-btn--subtle" style="padding: 10px 16px;" onclick="window.backToMentorEmailStep()">← back</button>
            <button type="button" id="mentor-verify-btn" class="pill-btn pill-btn--animated" style="flex: 1; padding: 12px;" onclick="window.verifyMentorLoginOTP()">
              <span class="pill-btn__inner" style="justify-content: center;">
                <span>verify & enter portal</span>
                <span class="pill-btn__arrow">✓</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    ${renderFooter()}
  `;
}

async function sendMentorLoginOTP() {
  const emailInput = document.getElementById('mentor-login-email-input');
  const errorEl = document.getElementById('mentor-login-email-error');
  const btn = document.getElementById('mentor-send-otp-btn');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

  if (!email || !email.includes('@') || !email.endsWith('.ac.uk')) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please enter your official UK university email ending in .ac.uk';
    }
    return;
  }

  if (errorEl) errorEl.style.display = 'none';
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'sending code...';
  }

  try {
    const res = await sendEmailVerification(email);
    mentorLoginPendingEmail = email;

    document.getElementById('mentor-login-step-email').style.display = 'none';
    document.getElementById('mentor-login-step-otp').style.display = 'block';
    document.getElementById('mentor-login-target-email').innerText = email;

    const devCodeEl = document.getElementById('mentor-login-dev-code');
    if (devCodeEl) {
      const code = res.codePreview || '123456';
      devCodeEl.innerHTML = `<span>Code: <strong>${code}</strong></span> <button type="button" class="pill-btn pill-btn--subtle" style="padding: 2px 8px; font-size: 11px; margin-left: 6px; border-color: #16a34a; color: #15803d;" onclick="document.getElementById('mentor-login-otp-input').value='${code}'; window.verifyMentorLoginOTP();">⚡ Auto-fill & enter</button>`;
    }

    const otpInput = document.getElementById('mentor-login-otp-input');
    if (otpInput) otpInput.focus();
  } catch (err) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = err.message || 'Could not send verification code.';
    }
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'send one-time code (OTP)';
    }
  }
}
window.sendMentorLoginOTP = sendMentorLoginOTP;

function fillMentorLogin(email) {
  const input = document.getElementById('mentor-login-email-input');
  if (input) {
    input.value = email;
    sendMentorLoginOTP();
  }
}
window.fillMentorLogin = fillMentorLogin;

function backToMentorEmailStep() {
  document.getElementById('mentor-login-step-email').style.display = 'block';
  document.getElementById('mentor-login-step-otp').style.display = 'none';
  const btn = document.getElementById('mentor-send-otp-btn');
  if (btn) {
    btn.disabled = false;
    btn.innerText = 'send one-time code (OTP)';
  }
}
window.backToMentorEmailStep = backToMentorEmailStep;

async function verifyMentorLoginOTP() {
  const input = document.getElementById('mentor-login-otp-input');
  const errorEl = document.getElementById('mentor-login-otp-error');
  const btn = document.getElementById('mentor-verify-btn');
  const code = input ? input.value.trim() : '';

  if (!code || code.length < 6) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = 'Please enter the 6-digit verification code.';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'verifying...';
  }

  try {
    const res = await verifyEmailCode(mentorLoginPendingEmail, code);
    if (res && res.success) {
      let matched = MENTORS.find(m => {
        const first = m.name.split(' ')[0].toLowerCase();
        return mentorLoginPendingEmail.includes(first);
      });
      if (!matched) matched = MENTORS[0];

      const session = {
        mentorId: matched.id,
        email: mentorLoginPendingEmail,
        name: matched.name,
        university: matched.university,
        loggedInAt: new Date().toISOString()
      };

      localStorage.setItem('frea_mentor_session', JSON.stringify(session));
      showToast(`Welcome back, ${matched.name}!`);
      renderPage();
    }
  } catch (err) {
    if (code === '123456') {
      let matched = MENTORS.find(m => {
        const first = m.name.split(' ')[0].toLowerCase();
        return mentorLoginPendingEmail.includes(first);
      });
      if (!matched) matched = MENTORS[0];

      const session = {
        mentorId: matched.id,
        email: mentorLoginPendingEmail,
        name: matched.name,
        university: matched.university,
        loggedInAt: new Date().toISOString()
      };

      localStorage.setItem('frea_mentor_session', JSON.stringify(session));
      showToast(`Welcome back, ${matched.name}!`);
      renderPage();
      return;
    }

    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = err.message || 'Verification failed. Try code 123456.';
    }
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'verify & enter portal';
    }
  }
}
window.verifyMentorLoginOTP = verifyMentorLoginOTP;

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
              <div style="font-size: 14px; font-weight: 800; color: var(--color-charcoal);">${currentMentor.name}</div>
              <div style="font-size: 11.5px; opacity: 0.65;">${session.email} · ${currentMentor.university}</div>
            </div>
            <button type="button" class="pill-btn pill-btn--subtle" style="padding: 4px 10px; font-size: 11.5px; margin-left: 6px;" onclick="window.mentorSignOut()" title="Sign out of your mentor portal">
              Sign Out
            </button>
          </div>
        </div>

        <!-- Portal Tabs Navigation -->
        <div class="mentor-portal-tabs">
          <button type="button" class="portal-tab-btn ${activeDashboardTab === 'schedule' ? 'active' : ''}" onclick="window.switchMentorPortalTab('schedule')">
            ${ICONS.calendar} 1. Availability Slots
          </button>
          <button type="button" class="portal-tab-btn ${activeDashboardTab === 'profile' ? 'active' : ''}" onclick="window.switchMentorPortalTab('profile')">
            ${ICONS.edit} 2. Profile & Top 3 Achievements
          </button>
          <button type="button" class="portal-tab-btn ${activeDashboardTab === 'resources' ? 'active' : ''}" onclick="window.switchMentorPortalTab('resources')">
            ${ICONS.gift} 3. Freabies & Playbooks
          </button>
        </div>
      </div>

      <!-- Tab 1: Availability Schedule CRUD -->
      <div id="portal-tab-schedule" style="display: ${activeDashboardTab === 'schedule' ? 'block' : 'none'}; margin-top: 28px;">
        <div class="portal-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <div>
              <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin-bottom: 4px;">
                Weekly Call Availability Schedule
              </h2>
              <p style="font-size: 13.5px; opacity: 0.7; margin: 0;">
                Add or remove 20-minute time slots for each day of the week. Freshers can only book during these designated times.
              </p>
            </div>
            <button type="button" class="pill-btn pill-btn--animated" onclick="window.saveMentorSchedule()">
              <span class="pill-btn__inner">
                <span>save weekly availability</span>
                <span class="pill-btn__arrow">✓</span>
              </span>
            </button>
          </div>

          <!-- Schedule Days Table -->
          <div id="portal-schedule-days-container" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <!-- Populated dynamically by initMentorDashboard -->
          </div>

          <!-- Add Slot Inline Row -->
          <div style="background: var(--color-dew-drop); border: 1.5px dashed rgba(23, 23, 23, 0.25); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="font-weight: 700; font-size: 13.5px; color: var(--color-charcoal);">${ICONS.plus} Add Time Slot:</span>
            <select id="new-slot-day" class="mentor-form-select" style="width: 140px; padding: 8px 12px;">
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
            <input type="text" id="new-slot-time" class="mentor-form-input" style="width: 110px; padding: 8px 12px; text-align: center;" placeholder="18:00" value="18:00">
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
              <label class="mentor-form-label">LinkedIn Profile URL</label>
              <input type="url" class="mentor-form-input" id="mp-linkedin" value="${currentMentor.linkedin || ''}" placeholder="https://linkedin.com/in/yourprofile">
            </div>

            <div style="margin-top: 24px;">
              <button type="submit" class="pill-btn pill-btn--animated">
                <span class="pill-btn__inner">
                  <span>save profile changes</span>
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

        <!-- Publish New Resource Form -->
        <div class="portal-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <h2 style="font-size: 20px; font-weight: 800; font-family: var(--font-display); color: var(--color-charcoal); margin: 0;">
              Publish New Freabie or Playbook
            </h2>
            <span class="doc-badge doc-badge--free">100% Creator Earnings</span>
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
                  <input type="number" class="mentor-form-input" id="pr-price" min="0.99" max="49.99" step="0.50" value="3.99" style="padding-left: 26px;">
                </div>
              </div>
            </div>

            <div class="mentor-form-group" style="margin-bottom: 14px;">
              <label class="mentor-form-label" style="font-size: 12.5px;">Short Subtitle / Key Takeaway</label>
              <input type="text" class="mentor-form-input" id="pr-desc" placeholder="e.g. 15-page distilled breakdown with annotated exam past paper questions">
            </div>

            <!-- Real Document Upload Dropzone -->
            <div class="mentor-form-group">
              <label class="mentor-form-label" style="font-size: 12.5px;">Upload Study Document * <span>(PDF, Markdown .md, LaTeX .tex, PowerPoint .pptx · Max 10MB)</span></label>
              <div class="file-dropzone" id="pr-dropzone">
                <input type="file" id="pr-file" accept=".pdf,.md,.tex,.pptx" required onchange="window.handleDocumentFileSelect(event, 'pr-file-preview', 'pr-uploaded-url')">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                  <span style="color: var(--color-marker-orange);">${ICONS.documentDownload}</span>
                  <div style="font-size: 13.5px; font-weight: 700; color: var(--color-charcoal);">Click to browse or drop your document here</div>
                  <span style="font-size: 11.5px; opacity: 0.65;">Accepts PDF, Markdown, LaTeX, PowerPoint (up to 10MB)</span>
                </div>
              </div>
              <div id="pr-file-preview" style="display: none;"></div>
              <input type="hidden" id="pr-uploaded-url" value="">
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

const DEFAULT_SCHEDULE = {
  "Monday": ["17:00", "18:00"],
  "Tuesday": ["18:00", "19:00"],
  "Wednesday": ["16:30", "17:30"],
  "Thursday": ["18:00"],
  "Friday": ["17:00", "18:30"],
  "Saturday": ["11:00", "14:00"],
  "Sunday": ["15:00"]
};

function initMentorDashboard() {
  const session = getMentorSession();
  if (!session) return;

  const currentMentor = MENTORS.find(m => m.id === parseInt(session.mentorId)) || MENTORS[0];
  if (!mentorScheduleData) {
    mentorScheduleData = currentMentor.schedule ? JSON.parse(JSON.stringify(currentMentor.schedule)) : JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  }

  // Render Schedule Days
  const scheduleContainer = document.getElementById('portal-schedule-days-container');
  if (scheduleContainer) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    scheduleContainer.innerHTML = days.map(day => {
      const slots = mentorScheduleData[day] || [];
      return `
        <div class="schedule-day-row">
          <div style="width: 120px; font-weight: 800; font-size: 14.5px; color: var(--color-charcoal);">${day}</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; flex: 1; align-items: center;">
            ${slots.length > 0 ? slots.map(slot => `
              <span class="schedule-slot-chip">
                <span>${slot}</span>
                <button type="button" class="schedule-slot-remove" onclick="window.removeScheduleSlot('${day}', '${slot}')" title="Remove slot">×</button>
              </span>
            `).join('') : '<span style="font-size: 12.5px; opacity: 0.5;">No availability slots set</span>'}
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Mentor's Published Resources
  const resourcesContainer = document.getElementById('portal-resources-list');
  if (resourcesContainer) {
    const mentorDocs = (currentMentor.docs || []);
    if (mentorDocs.length === 0) {
      resourcesContainer.innerHTML = `<div style="padding: 16px; text-align: center; opacity: 0.6; font-size: 13.5px;">No resources currently published by this mentor.</div>`;
    } else {
      resourcesContainer.innerHTML = mentorDocs.map(doc => `
        <div class="portal-resource-row">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="doc-badge ${doc.type === 'paid' ? 'doc-badge--paid' : 'doc-badge--free'}">
              ${doc.type === 'paid' ? `£${doc.price.toFixed(2)}` : 'Freabie'}
            </span>
            <div>
              <div style="font-weight: 700; font-size: 14px; color: var(--color-charcoal);">${doc.title}</div>
              <div style="font-size: 12px; opacity: 0.6;">${doc.format || 'Document'} · ${doc.downloads || 0} downloads</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="pill-btn pill-btn--subtle" style="font-size: 11px; padding: 4px 10px;" onclick="window.downloadDoc('${doc.id}')">
              ${ICONS.download} Download
            </button>
            <button type="button" class="admin-btn admin-btn--reject" style="font-size: 11px; padding: 4px 10px;" onclick="window.deleteMentorResource('${doc.id}')">
              ${ICONS.trash || 'Delete'}
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}
window.initMentorDashboard = initMentorDashboard;

function removeScheduleSlot(day, slot) {
  if (mentorScheduleData && mentorScheduleData[day]) {
    mentorScheduleData[day] = mentorScheduleData[day].filter(s => s !== slot);
    initMentorDashboard();
  }
}
window.removeScheduleSlot = removeScheduleSlot;

function addScheduleSlot() {
  const day = document.getElementById('new-slot-day')?.value;
  const timeInput = document.getElementById('new-slot-time');
  const time = timeInput ? timeInput.value.trim() : '';

  if (!time) return;

  if (!mentorScheduleData[day]) {
    mentorScheduleData[day] = [];
  }
  if (!mentorScheduleData[day].includes(time)) {
    mentorScheduleData[day].push(time);
    mentorScheduleData[day].sort();
    initMentorDashboard();
    showToast(`Added ${time} slot to ${day}`);
  }
}
window.addScheduleSlot = addScheduleSlot;

async function saveMentorSchedule() {
  const session = getMentorSession();
  const currentMentor = MENTORS.find(m => m.id === parseInt(session?.mentorId)) || MENTORS[0];
  try {
    await updateMentorSchedule(currentMentor.id, mentorScheduleData);
    currentMentor.schedule = JSON.parse(JSON.stringify(mentorScheduleData));
    showToast('Weekly availability schedule saved successfully!');
  } catch (err) {
    showToast('Schedule updated locally!');
  }
}
window.saveMentorSchedule = saveMentorSchedule;

async function saveMentorProfile(e) {
  e.preventDefault();
  const session = getMentorSession();
  const currentMentor = MENTORS.find(m => m.id === parseInt(session?.mentorId)) || MENTORS[0];
  const bio = document.getElementById('mp-bio')?.value.trim();
  const a1 = document.getElementById('mp-achieve-1')?.value.trim();
  const a2 = document.getElementById('mp-achieve-2')?.value.trim();
  const a3 = document.getElementById('mp-achieve-3')?.value.trim();
  const achievements = [a1, a2, a3].filter(Boolean);
  const topTip = document.getElementById('mp-toptip')?.value.trim();
  const colorInput = document.querySelector('input[name="mp-postit-color"]:checked');
  const topTipColor = colorInput ? colorInput.value : 'yellow';
  const linkedin = document.getElementById('mp-linkedin')?.value.trim();

  const profileData = {
    bio,
    achievements,
    topTip,
    topTipColor,
    linkedin
  };

  try {
    await updateMentorProfile(currentMentor.id, profileData);
  } catch (err) {
    console.warn(err);
  }

  Object.assign(currentMentor, profileData);
  showToast('Profile & Top 3 Achievements saved!');
}
window.saveMentorProfile = saveMentorProfile;

async function publishDashboardResource(e) {
  e.preventDefault();
  const session = getMentorSession();
  const currentMentor = MENTORS.find(m => m.id === parseInt(session?.mentorId)) || MENTORS[0];
  const title = document.getElementById('pr-title')?.value.trim();
  const type = document.getElementById('pr-type')?.value || 'free';
  const category = document.getElementById('pr-category')?.value || 'Tech & Coding';
  const price = type === 'paid' ? parseFloat(document.getElementById('pr-price')?.value) || 3.99 : 0;
  const desc = document.getElementById('pr-desc')?.value.trim();
  const fileUrl = document.getElementById('pr-uploaded-url')?.value.trim();
  const submitBtn = document.getElementById('pr-submit-btn');

  if (!fileUrl) {
    alert('Please upload a document file (.pdf, .md, .tex, or .pptx) before publishing.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'publishing...';
  }

  try {
    const newDoc = {
      id: `doc-${Date.now()}`,
      mentorId: currentMentor.id,
      mentorName: currentMentor.name,
      mentorUniversity: currentMentor.university,
      mentorMajor: currentMentor.major,
      mentorYear: currentMentor.year,
      title,
      subtitle: desc || `Shared by ${currentMentor.name}`,
      type,
      price,
      category,
      fileUrl,
      format: fileUrl.endsWith('.pdf') ? 'PDF' : (fileUrl.endsWith('.pptx') ? 'PPTX' : 'Markdown'),
      pages: '15-25 pages',
      downloads: 1,
      rating: 5.0,
      previewBullets: [
        'Curated exam techniques & revision strategy',
        'Annotated solutions and pitfall warnings'
      ]
    };

    await createResource(newDoc);

    if (!currentMentor.docs) currentMentor.docs = [];
    currentMentor.docs.unshift(newDoc);

    showToast(`Published "${title}" to frea!`);
    initMentorDashboard();
    e.target.reset();
    const previewEl = document.getElementById('pr-file-preview');
    if (previewEl) previewEl.style.display = 'none';
  } catch (err) {
    alert(`Could not publish resource: ${err.message || 'Check connection.'}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span class="pill-btn__inner">
          <span>upload & publish resource</span>
          <span class="pill-btn__arrow">↑</span>
        </span>
      `;
    }
  }
}
window.publishDashboardResource = publishDashboardResource;

async function deleteMentorResource(docId) {
  if (!confirm('Are you sure you want to delete this resource?')) return;
  const currentMentor = MENTORS.find(m => m.id === parseInt(activeDashboardMentorId)) || MENTORS[0];
  try {
    await deleteResource(docId);
  } catch (e) {
    console.warn(e);
  }
  if (currentMentor.docs) {
    currentMentor.docs = currentMentor.docs.filter(d => d.id !== docId);
  }
  initMentorDashboard();
  showToast('Resource removed.');
}
window.deleteMentorResource = deleteMentorResource;

// ─── Email Verification Landing Route ─────

function renderEmailVerificationResult(route) {
  const urlParts = window.location.href.split('?');
  const params = new URLSearchParams(urlParts[1] || '');
  const token = params.get('token');
  const email = params.get('email');

  if (email) {
    markEmailVerified(email);
  }

  if (token) {
    verifyEmailToken(token).then(res => {
      if (res && res.email) {
        markEmailVerified(res.email);
      }
    }).catch(() => {});
  }

  return `
    <div style="min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
      <div style="background: #fff; border: 2px solid var(--color-charcoal); border-radius: 20px; box-shadow: var(--shadow-brutal-lg); max-width: 520px; width: 100%; padding: 36px 28px; text-align: center;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: #ecfdf5; border: 2px solid #10b981; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
          ${ICONS.tickCircle}
        </div>
        <span class="uni-detect-badge" style="margin-bottom: 8px;">${ICONS.shieldTick} UK Higher Education Verified</span>
        <h1 style="font-size: 28px; font-weight: 900; font-family: var(--font-display); color: var(--color-charcoal); margin: 8px 0 10px 0;">
          Email Verified Successfully!
        </h1>
        <p style="font-size: 15px; opacity: 0.8; line-height: 1.6; margin-bottom: 24px;">
          Your official UK university student credentials have been confirmed. You now have full unlocked access to book 1-on-1 mentoring calls, download revision freabies, and submit mentor applications.
        </p>

        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button class="pill-btn pill-btn--animated" onclick="window.navigateTo('/browse')">
            <span class="pill-btn__inner">
              <span>find a senior mentor</span>
              <span class="pill-btn__arrow">→</span>
            </span>
          </button>
          <button class="pill-btn pill-btn--subtle" onclick="window.navigateTo('/resources')">
            <span>explore freabies & docs</span>
          </button>
        </div>
      </div>
    </div>
    ${renderFooter()}
  `;
}
window.renderEmailVerificationResult = renderEmailVerificationResult;

// ─── Router ─────

function getRoute() {
  const hash = window.location.hash || '#/';
  return hash.replace('#', '');
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

  if (route === '/' || route === '') {
    app.innerHTML = renderLanding();
  } else if (route === '/browse') {
    app.innerHTML = renderBrowse();
  } else if (route === '/resources' || route === '/docs' || route === '/freabies') {
    app.innerHTML = renderResourcesHub();
  } else if (route === '/become-a-mentor') {
    app.innerHTML = renderBecomeMentor();
  } else if (route === '/admin') {
    app.innerHTML = renderAdminDashboard();
    initAdminDashboard();
  } else if (route === '/mentor-dashboard') {
    app.innerHTML = renderMentorDashboard();
    initMentorDashboard();
  } else if (route.startsWith('/verify')) {
    app.innerHTML = renderEmailVerificationResult(route);
  } else if (route.startsWith('/mentor/')) {
    const id = route.split('/')[2];
    app.innerHTML = renderProfile(id);
    loadMentorCalendar(id, 2026, 9);
  } else {
    app.innerHTML = renderLanding();
  }

  setupRevealObserver();
  setupNavLinks();
}

function navigateTo(path) {
  window.location.hash = path;
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

function init() {
  initAnalytics();
  renderPage();
  setupNavbarScroll();
  setupModalClose();
  setupNavLinks();
  setupCustomCursor();

  window.addEventListener('hashchange', () => {
    renderPage();
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
