// ─────────────────────────────────────────────
// frea — Main Application (UK Student Peer-to-Peer Mentoring)
// ─────────────────────────────────────────────

import './style.css';
import { MENTORS, ACHIEVEMENTS, SUBJECTS, YEAR_FILTERS, SUBJECT_MAP, UK_UNIVERSITIES, TESTIMONIALS, FAQ_ITEMS } from './data.js';
import { getMentorAvatar } from './avatars.js';
import { initAnalytics, trackEvent, getGrowthMetrics } from './analytics.js';
import { fetchMentors, fetchMentor, fetchMonthlySlots, submitBooking, submitMentorApplication, fetchStats } from './api.js';

// ─── Live Questions Ticker (100% Authentic UK Student Queries) ─────

const LIVE_QUESTIONS = [
  { q: "can someone roast my CV before Friday's spring week deadline?", tag: "Finance @ LSE" },
  { q: "how do i recover from a 2:2 in 1st year exams?", tag: "Mech Eng @ Bristol" },
  { q: "how did you land a Y Combinator interview as a student?", tag: "CS @ Imperial" },
  { q: "what actually goes on a 1st year tech CV with zero experience?", tag: "Computing @ Bath" },
  { q: "switching from Psychology to UX Research — where do i start?", tag: "HCI @ UCL" },
  { q: "non-Russell Group student trying to break into quant — be real with me", tag: "Maths @ Warwick" },
  { q: "how to prep for Watson Glaser and magic circle vacation schemes?", tag: "Law @ Oxford" },
  { q: "how did you get your undergraduate research paper published?", tag: "Biochem @ Cambridge" },
];

// ─── Goal / Intent Filters for Browse ─────

const GOAL_FILTERS = [
  { id: "all", label: "✨ all goals" },
  { id: "cv-roast", label: "📄 roast my cv" },
  { id: "interview", label: "💼 interview prep" },
  { id: "gpa-recovery", label: "📈 1st year comeback" },
  { id: "startup", label: "🚀 student startups" },
  { id: "switching", label: "🔄 switching fields" },
  { id: "research", label: "🔬 research papers" },
];

const GOAL_KEYWORD_MAP = {
  "cv-roast": ["cv", "resume", "spring week", "portfolio", "review"],
  "interview": ["interview", "spring week", "internship", "prep", "assessment centre"],
  "gpa-recovery": ["exam", "revision", "active recall", "first-class", "recovery"],
  "startup": ["startup", "projects", "yc", "founder", "hackathon"],
  "switching": ["switching", "transition", "non-design", "portfolio"],
  "research": ["research", "paper", "dissertation", "phd", "crick", "thesis"],
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
  const ach = ACHIEVEMENTS[key];
  if (!ach) return '';
  const icon = STICKER_SVGS[ach.icon] || STICKER_SVGS.star;
  return `<span class="achievement-sticker achievement-sticker--${ach.color}">
    <span class="sticker-svg">${icon}</span>
    ${ach.label}
  </span>`;
}

// ─── Star Rating ─────

function starRating(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '★'.repeat(full);
  if (half) stars += '½';
  return stars;
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
      <span>📹 Mentor submitted external video pitch:</span>
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
          ${getMentorAvatar(mentor.id, 52)}
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
          <span class="mentor-card__postit-label">senior tip 📌</span>
        </div>
        <p class="mentor-card__postit-quote">${mentor.topTip}</p>
      </div>

      <div class="mentor-card__achievements">
        ${mentor.achievements.slice(0, 3).map(a => achievementSticker(a)).join('')}
      </div>
      <div class="mentor-card__bio">“${mentor.bio}”</div>
      <div class="mentor-card__footer">
        <div class="mentor-card__stats">
          <span>${starRating(mentor.rating)}</span> ${mentor.rating} · ${mentor.callsCompleted} chats
        </div>
        <button class="pill-btn pill-btn--small" onclick="event.stopPropagation(); window.navigateTo('/mentor/${mentor.id}')">book a chat</button>
      </div>
    </div>
  `;
}

// ─── Hand-drawn Arrow SVG ─────

function handArrow() {
  return `<div class="how-arrow">
    <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
      <path d="M2 12c10-2 20-2 30 0M32 12l10 0M38 7l4 5-4 5" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>
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
  return `
    <div class="page-view">
      <!-- Hero -->
      <section class="hero page-container">
        <div class="hero__grid">
          <div class="hero__content">
            <span class="hero__caption">psst... stop stressing over cold emails ✍️</span>
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
                    <span>🎓</span>
                  </span>
                </button>
              </div>
              <span class="hero__quiet-caption">☕ 20-min Google Meets · no sign-up fees · always free for UK students</span>
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
                    <span class="hero__pass-badge">🎓 Senior Student Pass · 2026</span>
                    <span class="hero__pass-verified">✓ verified</span>
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
                      <span class="hero__pass-tag hero__pass-tag--orange">🚀 YC S23 Alumni</span>
                      <span class="hero__pass-tag hero__pass-tag--blue">⚡ Stripe Offer</span>
                    </div>
                  </div>
                </div>
                <div class="hero__pass-quote">
                  “happy to roast your tech CV, do mock technical screens, or chat about getting into YC as an undergrad.”
                </div>
                <div class="hero__pass-footer">
                  <span style="color: var(--color-marker-orange); font-weight: 700;">★★★★★ 4.9 (47 chats)</span>
                  <span style="opacity: 0.6; font-size: 12px;">usually replies in 2h</span>
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

      <!-- Section 1: Disciplines Velocity Band -->
      <section class="velocity-strip-section">
        <div class="velocity-band">
          <!-- Row 1: Core Disciplines (Moving Left) -->
          <div class="velocity-band__row">
            <div class="velocity-band__track">
              <span class="velocity-word">Tech</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Engineering</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Law</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Medicine</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Maths</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Finance</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Economics</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Architecture</span>
              <span class="velocity-sep">✦</span>
              <!-- Seamless Loop Clone -->
              <span class="velocity-word">Tech</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Engineering</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Law</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Medicine</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Maths</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Finance</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Economics</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Architecture</span>
              <span class="velocity-sep">✦</span>
            </div>
          </div>
          <!-- Row 2: Sub-disciplines & Notes (Moving Right) -->
          <div class="velocity-band__row">
            <div class="velocity-band__track velocity-band__track--reverse">
              <span class="velocity-word velocity-word--subtle">...and many more degrees & subjects</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Computer Science</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Physics</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Biochemistry</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">PPE</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Data Science</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word velocity-word--highlight">100% free senior advice</span>
              <span class="velocity-sep">✦</span>
              <!-- Seamless Loop Clone -->
              <span class="velocity-word velocity-word--subtle">...and many more degrees & subjects</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">Computer Science</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Physics</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Biochemistry</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">PPE</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Data Science</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word velocity-word--highlight">100% free senior advice</span>
              <span class="velocity-sep">✦</span>
            </div>
          </div>
        </div>
      </section>

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
              <div class="mission-card__icon">☕</div>
              <h3 class="mission-card__title">honest peer talk</h3>
              <p class="mission-card__desc">unfiltered truth about course modules, revision methods, and how assessment centres actually work.</p>
            </div>
            <div class="mission-card">
              <div class="mission-card__icon">💸</div>
              <h3 class="mission-card__title">100% free, always</h3>
              <p class="mission-card__desc">zero hidden fees or subscription traps. built by UK students, for UK students with an active .ac.uk email.</p>
            </div>
            <div class="mission-card">
              <div class="mission-card__icon">🛡️</div>
              <h3 class="mission-card__title">vetted seniors</h3>
              <p class="mission-card__desc">every mentor is verified with their university email, verified on LinkedIn, and screened before joining.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: "Built by students, for students" Pride & University Band -->
      <section class="velocity-strip-section velocity-strip-section--secondary">
        <div class="velocity-band">
          <!-- Row 1: Platform Ethos & Pride (Moving Left) -->
          <div class="velocity-band__row">
            <div class="velocity-band__track">
              <span class="velocity-word velocity-word--highlight">built by students, for students</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">100% free</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">zero corporate cringe</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">unfiltered advice</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">caffeinated 20-min chats</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">insider playbooks</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word velocity-word--subtle">the unwritten rules</span>
              <span class="velocity-sep">✦</span>
              <!-- Seamless Loop Clone -->
              <span class="velocity-word velocity-word--highlight">built by students, for students</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">100% free</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">zero corporate cringe</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">unfiltered advice</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">caffeinated 20-min chats</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word">insider playbooks</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word velocity-word--subtle">the unwritten rules</span>
              <span class="velocity-sep">✦</span>
            </div>
          </div>
          <!-- Row 2: Top UK Universities & Real Seniors (Moving Right) -->
          <div class="velocity-band__row">
            <div class="velocity-band__track velocity-band__track--reverse">
              <span class="velocity-word">Imperial</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">LSE</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Oxford</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">UCL</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Cambridge</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Bristol</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Edinburgh</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Warwick</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Manchester</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">King's College</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word velocity-word--subtle">elder peers who actually care</span>
              <span class="velocity-sep">✦</span>
              <!-- Seamless Loop Clone -->
              <span class="velocity-word">Imperial</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">LSE</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Oxford</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">UCL</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Cambridge</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Bristol</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Edinburgh</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Warwick</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">Manchester</span>
              <span class="velocity-sep">·</span>
              <span class="velocity-word">King's College</span>
              <span class="velocity-sep">✦</span>
              <span class="velocity-word velocity-word--subtle">elder peers who actually care</span>
              <span class="velocity-sep">✦</span>
            </div>
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
                <option value="${u === 'All UK Universities' ? 'all' : u}">${u}</option>
              `).join('')}
            </select>

            <div class="filter-hub__count-badge" id="match-count-badge">
              12 verified seniors
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
            <div class="empty-state__icon">🤔</div>
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
            ${getMentorAvatar(mentor.id, 180)}
            <div class="sticker" style="position: absolute; top: -14px; right: -14px; transform: rotate(12deg);">${stickerDecoration('sparkle', 28)}</div>
            <div class="sticker" style="position: absolute; bottom: -10px; left: -10px; transform: rotate(-10deg);">${stickerDecoration('star', 24)}</div>
          </div>

          <div>
            <div class="profile__info-label">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <span class="hero__pass-verified">✓ verified mentor</span>
                ${mentor.linkedin ? `
                  <a href="${mentor.linkedin}" target="_blank" rel="noopener noreferrer" class="profile__linkedin-badge" title="Verified LinkedIn Profile">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.64 1.64 0 0 0-1.66 1.64 1.63 1.63 0 0 0 1.66 1.63 1.63 1.63 0 0 0 1.65-1.63A1.64 1.64 0 0 0 7.83 6.2Z"/></svg>
                    <span>LinkedIn verified ✓</span>
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
                    <span>🔗</span>
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
              <span class="mentor-card__postit-label" style="font-size: 16px;">senior tip for freshers 📌</span>
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
              <h3 class="profile__section-title" style="margin-bottom: 0;">2-min mentor pitch 📹</h3>
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

        <!-- Interactive Clean Vanilla Month Calendar -->
        <div class="profile__section">
          <h3 class="profile__section-title">pick a date & time</h3>
          <span class="handwritten" style="font-size: 20px; display: block; margin-bottom: 16px;">all sessions are 20-min Google Meets · 100% free · select an orange day, then choose your time</span>

          <div id="profile-calendar-root" class="frea-cal-root">
            <div style="text-align: center; padding: 40px 20px; opacity: 0.7;">
              <span style="font-size: 26px;">📅</span>
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
          <span>🛡️</span>
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

          <div class="mentor-form-group">
            <label class="mentor-form-label">Official Student Email <span>* (must end in .ac.uk)</span></label>
            <input type="email" class="mentor-form-input" id="bm-email" required placeholder="e.g. yourname@imperial.ac.uk or s123456@ed.ac.uk">
            <span style="font-size: 12px; opacity: 0.6; display: block; margin-top: 4px;">We use .ac.uk validation to keep the platform free from commercial recruiters.</span>
          </div>

          <!-- LinkedIn Verification URL -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">LinkedIn Profile URL <span>(strongly encouraged · unlocks verified badge)</span></label>
            <input type="url" class="mentor-form-input" id="bm-linkedin" placeholder="https://www.linkedin.com/in/yourprofile">
            <span style="font-size: 12px; opacity: 0.6; display: block; margin-top: 4px;">Adding your LinkedIn profile unlocks the "LinkedIn verified ✓" trust badge on your profile.</span>
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
              <span style="font-size: 22px;">🤝</span>
              <div style="font-size: 13.5px; line-height: 1.5; color: var(--color-cocoa-ink);">
                <strong>Quality Assurance & Video Screen:</strong> To keep frea authentic and safe for UK freshers, our student team schedules a friendly 10-minute video intro with every applicant before profiles go live.
              </div>
            </div>
          </div>

          <!-- Achievements Selection -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">What successes have you achieved? <span>(select all that apply)</span></label>
            <div class="mentor-achieve-grid" id="bm-achievements">
              <label class="mentor-achieve-choice"><input type="checkbox" value="spring_week"> ⚡ Spring Week Alum</label>
              <label class="mentor-achieve-choice"><input type="checkbox" value="summer_analyst"> 💼 Summer Analyst / Intern</label>
              <label class="mentor-achieve-choice"><input type="checkbox" value="first_class"> 🏆 First-Class Honours (1st)</label>
              <label class="mentor-achieve-choice"><input type="checkbox" value="placement_year"> 🏎️ Placement Year / Year in Industry</label>
              <label class="mentor-achieve-choice"><input type="checkbox" value="hackathon_winner"> 🚀 Hackathon 1st Place</label>
              <label class="mentor-achieve-choice"><input type="checkbox" value="startup_founder"> 💡 Founded a Startup</label>
              <label class="mentor-achieve-choice"><input type="checkbox" value="society_president"> 🚩 Society Committee / President</label>
              <label class="mentor-achieve-choice"><input type="checkbox" value="published_paper"> 🔬 Published Research Paper</label>
            </div>
          </div>

          <!-- Live Post-It Note Preview -->
          <div class="mentor-form-group">
            <label class="mentor-form-label">Your Top Tip for Freshers <span>* (appears on your post-it note!)</span></label>
            <div class="live-postit-preview-wrap">
              <div>
                <textarea class="mentor-form-textarea" id="bm-toptip" rows="3" required placeholder="e.g. don't grind 500 leetcodes. pick 2 projects you can passionately defend for 20 mins." oninput="updateLivePostit(this.value)"></textarea>
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
                    “don't grind 500 leetcodes. pick 2 projects you can passionately defend for 20 mins.”
                  </div>
                  <span class="live-postit-preview__author" id="live-postit-author">— you @ google meet</span>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 36px; text-align: center;">
            <button type="submit" class="pill-btn pill-btn--animated" style="padding: 14px 44px; font-size: 17px;">
              <span class="pill-btn__inner">
                <span>submit mentor application</span>
                <span class="pill-btn__arrow">🚀</span>
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
  if (textEl) {
    textEl.innerText = val.trim() ? `“${val.trim()}”` : `“your senior advice here...”`;
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

async function handleBecomeMentorSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('bm-name')?.value;
  const uni = document.getElementById('bm-uni')?.value;
  const major = document.getElementById('bm-major')?.value;
  const year = document.getElementById('bm-year')?.value;
  const email = document.getElementById('bm-email')?.value.trim().toLowerCase();
  const linkedin = document.getElementById('bm-linkedin')?.value.trim() || '';
  const website = document.getElementById('bm-website')?.value.trim() || '';
  const pitchVideoUrl = document.getElementById('bm-pitch')?.value.trim() || '';
  const topTip = document.getElementById('bm-toptip')?.value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Strict .ac.uk validation
  if (!email || !email.endsWith('.ac.uk')) {
    alert('⚠️ frea requires a verified UK student email ending in ".ac.uk" (e.g. yourname@imperial.ac.uk, s123456@ed.ac.uk) to verify your student status.');
    document.getElementById('bm-email')?.focus();
    return;
  }

  // Get selected achievements
  const achievements = Array.from(document.querySelectorAll('#bm-achievements input:checked')).map(cb => cb.value);
  const colorInput = document.querySelector('input[name="postit-color"]:checked');
  const topTipColor = colorInput ? colorInput.value : 'yellow';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'submitting... 🚀';
  }

  try {
    await submitMentorApplication({
      name,
      university: uni,
      degree: major,
      year,
      email,
      linkedin,
      website,
      pitchVideoUrl,
      achievements,
      topTip,
      topTipColor
    });

    // Track Growth Event
    trackEvent('mentor_application_submitted', {
      name,
      university: uni,
      major,
      year,
      emailDomain: email.split('@')[1]
    });

    // Save to localStorage for client caching
    try {
      const apps = JSON.parse(localStorage.getItem('frea_mentor_applications') || '[]');
      apps.push({ name, uni, major, year, email, linkedin, website, pitchVideoUrl, topTip, submittedAt: new Date().toISOString() });
      localStorage.setItem('frea_mentor_applications', JSON.stringify(apps));
    } catch (err) {
      console.warn(err);
    }

    // Open confirmation modal with interview screening notice
    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <button class="modal__close" onclick="closeModal()">✕</button>
      <div class="modal--confirmation">
        <div class="modal__celebration">🎓 ☕ 🌟</div>
        <h2 class="modal__title">application received!</h2>
        <p class="modal__body">
          thank you, <strong>${name}</strong>! We've sent a verification link to <strong>${email}</strong>.
        </p>

        <div style="background: var(--color-dew-drop); border: 1.5px solid rgba(23, 23, 23, 0.2); border-radius: 12px; padding: 16px 20px; margin: 18px 0; text-align: left;">
          <div style="font-weight: 700; color: var(--color-charcoal); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>🤝</span> Next Step: 10-Min Video Screen
          </div>
          <div style="font-size: 13.5px; opacity: 0.8; line-height: 1.5;">
            Our student onboarding team will email your .ac.uk inbox to schedule a quick 10-minute video intro & screen. Once completed, your profile and top-tip post-it note will go live on the platform!
          </div>
        </div>

        <div style="margin-top: 20px;">
          <button class="pill-btn pill-btn--animated" onclick="closeModal(); window.navigateTo('/browse')">
            <span class="pill-btn__inner">
              <span>explore other seniors</span>
              <span class="pill-btn__arrow">→</span>
            </span>
          </button>
        </div>
      </div>
    `;

    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    alert(`⚠️ Could not submit application: ${err.message || 'Please check your connection.'}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'submit mentor application 🚀';
    }
  }
}
window.handleBecomeMentorSubmit = handleBecomeMentorSubmit;

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
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.navigateTo('/become-a-mentor')">become a mentor 🎓</a>
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.scrollTo({top: document.querySelector('.faq__list')?.offsetTop - 100, behavior: 'smooth'})">faq</a>
        </div>
      </div>
      <div class="footer__bottom" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <span>© 2026 frea. built with ♥ for UK university students who deserve honest guidance.</span>
        <span style="opacity: 0.85; font-size: 13px;">🛡️ .ac.uk verified · Jisc educational governance</span>
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
        <span style="font-size: 32px; display: block; margin-bottom: 8px;">📅</span>
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

  // Days in month
  processedDays.forEach(day => {
    const isSelected = selectedDayObj && selectedDayObj.date === day.date;
    const hasSlots = day.hasSlots;

    let cellClass = 'frea-cal__cell';
    if (isSelected) {
      cellClass += ' frea-cal__cell--selected';
    } else if (hasSlots) {
      cellClass += ' frea-cal__cell--available';
    } else {
      cellClass += ' frea-cal__cell--unavailable';
    }

    contentHtml += `
      <div class="${cellClass}" onclick="window.selectCalendarMonthCell('${day.date}')" title="${hasSlots ? `${day.slotCount} open slot(s) on ${day.displayDate}` : `No availability on ${day.displayDate}`}">
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
          <span>confirm chat 🚀</span>
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

  const selectedDay = window.__selectedDay || calendarState.selectedDisplayDate || '';
  const selectedSlot = window.__selectedSlot || calendarState.selectedSlot || '';

  if (!selectedSlot) {
    alert('Please click on an available time slot before confirming your booking!');
    return;
  }

  trackEvent('booking_modal_opened', { mentorId: mentor.id, mentorName: mentor.name, day: selectedDay, slot: selectedSlot });

  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">✕</button>
    <h2 class="modal__title">book your free 20-min chat</h2>
    <p class="modal__body">you're booking with <strong>${mentor.name}</strong> (${mentor.university})</p>
    <ul class="modal__steps">
      <li class="modal__step">
        <span class="modal__step-icon">📅</span>
        <span><strong>${selectedDay}</strong> at <strong>${selectedSlot}</strong> (BST UK time)</span>
      </li>
      <li class="modal__step">
        <span class="modal__step-icon">📧</span>
        <span>you'll receive an instant Google Meet calendar invite</span>
      </li>
      <li class="modal__step">
        <span class="modal__step-icon">🛡️</span>
        <span>verified via your official UK university <strong>.ac.uk</strong> email</span>
      </li>
    </ul>

    <div style="margin-top: 20px;">
      <label style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 6px;">Your UK University Student Email:</label>
      <div class="modal__input-row">
        <input type="email" class="modal__input" id="booking-email" placeholder="e.g. s123456@ed.ac.uk or name@imperial.ac.uk">
        <button id="confirm-booking-btn" class="pill-btn pill-btn--dark" onclick="confirmBooking(${mentor.id})">confirm chat 🚀</button>
      </div>
      <div id="booking-error-msg" style="color: var(--color-marker-orange); font-size: 13px; margin-top: 6px; display: none;"></div>
      <div style="font-size: 12px; opacity: 0.6; margin-top: 8px;">
        💡 Using your official .ac.uk email ensures frea stays 100% free and exclusive to genuine UK students.
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
      errorEl.innerText = '⚠️ Please use your official university email (ending in .ac.uk) to verify your UK student status!';
    }
    if (emailInput) emailInput.style.borderColor = '#ff6f1e';
    return;
  }

  const mentor = MENTORS.find(m => m.id === parseInt(mentorId));
  const selectedDay = window.__selectedDay || calendarState.selectedDisplayDate;
  const selectedSlot = window.__selectedSlot || calendarState.selectedSlot;

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerText = 'generating meet... ⏳';
  }

  try {
    const booking = await submitBooking({
      mentorId: parseInt(mentorId),
      studentEmail: email,
      date: selectedDay,
      time: selectedSlot
    });

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

    const modal = document.getElementById('modal-content');
    modal.innerHTML = `
      <button class="modal__close" onclick="closeModal()">✕</button>
      <div class="modal--confirmation">
        <div class="modal__celebration">🎉 ☕ ⚡</div>
        <h2 class="modal__title">you're booked in!</h2>
        <p class="modal__body">
          calendar invite and Google Meet link sent to <strong>${email}</strong> for <strong>${selectedDay} at ${selectedSlot} (BST)</strong>.
        </p>

        <div style="background: #ffffff; border: 2px solid var(--color-marker-orange); border-radius: 12px; padding: 16px; margin: 16px 0; text-align: left;">
          <div style="font-size: 13px; font-weight: 700; color: var(--color-cocoa-ink); margin-bottom: 4px;">📹 Google Meet Meeting Room:</div>
          <a href="${booking.googleMeetUrl}" target="_blank" rel="noopener noreferrer" style="font-family: monospace; font-size: 15px; font-weight: 700; color: #2563eb; word-break: break-all; text-decoration: underline;">
            ${booking.googleMeetUrl}
          </a>
          <div style="font-size: 11.5px; opacity: 0.65; margin-top: 6px;">Booking Ref: <code>${booking.id}</code> · 20-min 1-on-1 session</div>
        </div>

        <div style="background: var(--color-dew-drop); padding: 14px 18px; border-radius: 10px; border-left: 3px solid var(--color-marker-orange); margin: 16px 0; font-size: 14px; text-align: left;">
          <strong>Senior Tip from ${mentor?.name || 'your mentor'}:</strong><br>
          <em>${mentor?.topTip || 'Bring 2-3 specific questions so you get the most out of your 20 minutes!'}</em>
        </div>
        <button class="pill-btn" onclick="closeModal(); window.navigateTo('/browse')">browse more seniors</button>
      </div>
    `;
  } catch (err) {
    console.error('Booking failed', err);
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerText = 'confirm chat 🚀';
    }
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = `⚠️ ${err.message || 'Could not complete booking. Please try again or choose another slot.'}`;
    }
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

  // Reset filters
  activeGoal = 'all';
  activeSubject = 'all';
  activeYear = 'all years';
  activeUniversity = 'all';

  if (route === '/' || route === '') {
    app.innerHTML = renderLanding();
  } else if (route === '/browse') {
    app.innerHTML = renderBrowse();
  } else if (route === '/become-a-mentor') {
    app.innerHTML = renderBecomeMentor();
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
      navigateTo(el.dataset.navigate);
    };
  });
}

// ─── Initialize ─────

function init() {
  initAnalytics();
  renderPage();
  setupNavbarScroll();
  setupModalClose();
  setupNavLinks();

  window.addEventListener('hashchange', () => {
    renderPage();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
