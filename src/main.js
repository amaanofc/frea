// ─────────────────────────────────────────────
// frea — Main Application
// ─────────────────────────────────────────────

import './style.css';
import { MENTORS, ACHIEVEMENTS, SUBJECTS, YEAR_FILTERS, SUBJECT_MAP, TESTIMONIALS, FAQ_ITEMS } from './data.js';

// ─── SVG Sticker Icons ─────────────────────

const STICKER_SVGS = {
  lightning: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M15.5 3L7 16h6l-1 9 8.5-13h-6l1-9z" fill="#3b82f6" stroke="#171717" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  star: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 3l3.09 6.26L24 10.27l-5 4.87 1.18 6.88L14 18.77l-6.18 3.25L9 15.14l-5-4.87 6.91-1.01L14 3z" fill="#ff6f1e" stroke="#171717" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  heart: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 24s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.9A4.5 4.5 0 0 1 22 13c0 5.5-8 11-8 11z" fill="#ff66cf" stroke="#171717" stroke-width="1.5"/><circle cx="11" cy="12" r="1" fill="#171717"/><circle cx="17" cy="12" r="1" fill="#171717"/></svg>`,
  sparkle: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 3c0 6.075-4.925 11-11 11 6.075 0 11 4.925 11 11 0-6.075 4.925-11 11-11-6.075 0-11-4.925-11-11z" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/></svg>`,
  graduation: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M24 8L4 18l20 10 20-10L24 8z" fill="#3b82f6" stroke="#171717" stroke-width="2" stroke-linejoin="round"/><path d="M10 22v10c0 4 6 8 14 8s14-4 14-8V22" stroke="#171717" stroke-width="2" fill="none"/><path d="M40 18v14" stroke="#171717" stroke-width="2" stroke-linecap="round"/><circle cx="40" cy="34" r="2" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/></svg>`,
  coffee: `<svg width="44" height="44" viewBox="0 0 44 44" fill="none"><rect x="8" y="16" width="22" height="18" rx="3" fill="#f7efe9" stroke="#171717" stroke-width="2"/><path d="M30 20h4a4 4 0 010 8h-4" stroke="#171717" stroke-width="2"/><path d="M14 12c0-2 2-4 2-4s2 2 2 4M20 12c0-2 2-4 2-4s2 2 2 4" stroke="#ff6f1e" stroke-width="1.5" stroke-linecap="round"/><path d="M8 38h22" stroke="#171717" stroke-width="2" stroke-linecap="round"/></svg>`,
  book: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 4h8c2 0 2 0 2 2v18c0-2-2-2-2-2H4V4z" fill="#ff66cf" stroke="#171717" stroke-width="1.5"/><path d="M24 4h-8c-2 0-2 0-2 2v18c0-2 2-2 2-2h8V4z" fill="#ff66cf" stroke="#171717" stroke-width="1.5"/></svg>`,
  rocket: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 3c-3 4-5 9-5 14l3 3h4l3-3c0-5-2-10-5-14z" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/><circle cx="14" cy="13" r="2" fill="#fdfbf9" stroke="#171717" stroke-width="1"/><path d="M9 17l-3 4 5-1M19 17l3 4-5-1" stroke="#171717" stroke-width="1.5"/><path d="M12 20h4v4l-2 1-2-1v-4z" fill="#3b82f6" stroke="#171717" stroke-width="1"/></svg>`,
  trophy: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M9 4h10v8c0 3-2 5-5 5s-5-2-5-5V4z" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/><path d="M9 7H5c0 3 2 5 4 5M19 7h4c0 3-2 5-4 5" stroke="#171717" stroke-width="1.5"/><path d="M12 17v3M16 17v3" stroke="#171717" stroke-width="1.5"/><rect x="9" y="20" width="10" height="3" rx="1.5" fill="#f7efe9" stroke="#171717" stroke-width="1.5"/></svg>`,
  code: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M10 8L4 14l6 6M18 8l6 6-6 6" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 5l-4 18" stroke="#171717" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  flag: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M6 4v20" stroke="#171717" stroke-width="2" stroke-linecap="round"/><path d="M6 4h14l-3 5 3 5H6" fill="#22c55e" stroke="#171717" stroke-width="1.5"/></svg>`,
  briefcase: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="10" width="22" height="13" rx="2" fill="#3b82f6" stroke="#171717" stroke-width="1.5"/><path d="M10 10V7a2 2 0 012-2h4a2 2 0 012 2v3" stroke="#171717" stroke-width="1.5"/><path d="M3 16h22" stroke="#171717" stroke-width="1.5"/><circle cx="14" cy="16" r="2" fill="#fdfbf9" stroke="#171717" stroke-width="1"/></svg>`,
  medal: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="18" r="6" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/><path d="M10 4l-2 10M18 4l2 10" stroke="#171717" stroke-width="1.5"/><path d="M10 4h8" stroke="#171717" stroke-width="1.5" stroke-linecap="round"/><path d="M14 15v6M11 18h6" stroke="#fdfbf9" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  mic: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="10" y="4" width="8" height="12" rx="4" fill="#22c55e" stroke="#171717" stroke-width="1.5"/><path d="M6 14c0 4.4 3.6 8 8 8s8-3.6 8-8" stroke="#171717" stroke-width="1.5" fill="none"/><path d="M14 22v4M10 26h8" stroke="#171717" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  lightbulb: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 3a7 7 0 00-4 12.7V19a2 2 0 002 2h4a2 2 0 002-2v-3.3A7 7 0 0014 3z" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/><path d="M11 23h6M12 25h4" stroke="#171717" stroke-width="1.5" stroke-linecap="round"/><path d="M14 8v3M11 10l1 2M17 10l-1 2" stroke="#fdfbf9" stroke-width="1" stroke-linecap="round"/></svg>`,
};

// ─── Sticker Decoration SVGs (for scattered placement) ─────

function stickerDecoration(type, size = 36) {
  const svgs = {
    lightning: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none"><path d="M15.5 3L7 16h6l-1 9 8.5-13h-6l1-9z" fill="#3b82f6" stroke="#171717" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    heart: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none"><path d="M14 24s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.9A4.5 4.5 0 0 1 22 13c0 5.5-8 11-8 11z" fill="#ff66cf" stroke="#171717" stroke-width="1.5"/><circle cx="11" cy="12" r="1" fill="#171717"/><circle cx="17" cy="12" r="1" fill="#171717"/></svg>`,
    star: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none"><path d="M14 3l3.09 6.26L24 10.27l-5 4.87 1.18 6.88L14 18.77l-6.18 3.25L9 15.14l-5-4.87 6.91-1.01L14 3z" fill="#ff6f1e" stroke="#171717" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    sparkle: `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none"><path d="M14 3c0 6.075-4.925 11-11 11 6.075 0 11 4.925 11 11 0-6.075 4.925-11 11-11-6.075 0-11-4.925-11-11z" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/></svg>`,
  };
  return svgs[type] || svgs.sparkle;
}

// ─── Achievement Sticker Component ─────

function achievementSticker(key) {
  const ach = ACHIEVEMENTS[key];
  if (!ach) return '';
  const icon = STICKER_SVGS[ach.icon] || '';
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

// ─── Mentor Card Component ─────

function mentorCard(mentor) {
  const initials = mentor.name.split(' ').map(n => n[0]).join('');
  return `
    <div class="mentor-card" data-mentor-id="${mentor.id}" onclick="window.navigateTo('/mentor/${mentor.id}')">
      <div class="mentor-card__label">
        <div class="mentor-card__name">${mentor.name}</div>
        <div class="mentor-card__meta">
          <span>${mentor.year}</span>
          <span class="mentor-card__meta-divider">·</span>
          <span>${mentor.major}</span>
        </div>
      </div>
      <div class="mentor-card__achievements">
        ${mentor.achievements.slice(0, 3).map(a => achievementSticker(a)).join('')}
      </div>
      <div class="mentor-card__bio">${mentor.bio}</div>
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
      <path d="M2 12c10-2 20-2 30 0M32 12l10 0M38 7l4 5-4 5" stroke="#171717" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
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
            <span class="hero__caption">hey freshers,</span>
            <h1 class="hero__title">find your<br>senior mentor</h1>
            <p class="hero__body">
              connect with seniors who've been there, done that — and book a <span class="marker-highlight">free</span> call to pick their brain.
            </p>
            <div class="hero__cta-group">
              <button class="pill-btn" onclick="window.navigateTo('/browse')">browse mentors</button>
              <span class="hero__quiet-caption">20-min calls, always free.</span>
            </div>
          </div>
          <div class="hero__visual">
            <!-- Decorative stickers -->
            <div class="sticker sticker--1" style="transform: rotate(12deg);">${stickerDecoration('lightning', 40)}</div>
            <div class="sticker sticker--2" style="transform: rotate(-8deg);">${stickerDecoration('heart', 36)}</div>
            <div class="sticker sticker--3" style="transform: rotate(15deg);">${stickerDecoration('sparkle', 32)}</div>
            <div class="sticker sticker--4" style="transform: rotate(-5deg);">${stickerDecoration('star', 34)}</div>
            <!-- Name label card -->
            <div class="hero__card">
              <div class="hero__card-label">Name</div>
              <div class="hero__card-name">Your Mentor</div>
              <div class="hero__card-fields">
                <div>
                  <div class="hero__card-field-label">Year</div>
                  <div class="hero__card-field-value">4th</div>
                </div>
                <div>
                  <div class="hero__card-field-label">Major</div>
                  <div class="hero__card-field-value">CS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="section page-container">
        <div class="how-it-works reveal">
          <div style="text-align: center; margin-bottom: 8px;">
            <span class="handwritten handwritten--rotated">it's super simple</span>
          </div>
          <h2 class="section__title" style="text-align: center;">how it works</h2>
          <div class="how-it-works__steps">
            ${howStep('I', 'browse', 'find mentors by subject, year, or achievement',
              `<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="28" cy="28" r="16" stroke="#171717" stroke-width="2.5" fill="#f7efe9"/><path d="M40 40l12 12" stroke="#171717" stroke-width="2.5" stroke-linecap="round"/><circle cx="28" cy="28" r="6" stroke="#ff6f1e" stroke-width="1.5" fill="none"/></svg>`
            )}
            ${handArrow()}
            ${howStep('II', 'connect', 'read their story and what they can help with',
              `<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="24" cy="28" r="10" stroke="#171717" stroke-width="2.5" fill="#f7efe9"/><circle cx="40" cy="28" r="10" stroke="#171717" stroke-width="2.5" fill="#f7efe9"/><path d="M32 22c-2 3-2 9 0 12" stroke="#ff6f1e" stroke-width="1.5" stroke-linecap="round"/></svg>`
            )}
            ${handArrow()}
            ${howStep('III', 'chat', 'book a free 20-min call at their available time',
              STICKER_SVGS.coffee || `<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="14" y="20" width="28" height="24" rx="4" fill="#f7efe9" stroke="#171717" stroke-width="2.5"/><path d="M42 26h6a5 5 0 010 10h-6" stroke="#171717" stroke-width="2.5"/><path d="M22 16c0-3 3-5 3-5s3 3 3 5M30 16c0-3 3-5 3-5s3 3 3 5" stroke="#ff6f1e" stroke-width="2" stroke-linecap="round"/></svg>`
            )}
          </div>
        </div>
      </section>

      <!-- Featured Mentors -->
      <section class="section page-container">
        <span class="section__caption reveal">they've actually been there</span>
        <h2 class="section__title reveal">meet your seniors</h2>
        <div class="mentor-grid" style="margin-top: 32px;">
          ${MENTORS.slice(0, 6).map(m => mentorCard(m)).join('')}
        </div>
        <div style="text-align: center; margin-top: 48px;" class="reveal">
          <button class="pill-btn" onclick="window.navigateTo('/browse')">see all mentors</button>
        </div>
      </section>

      <!-- Stats Band -->
      <section class="section page-container">
        <div class="stats-band reveal">
          <div class="stats-band__grid">
            <div class="stat-item">
              <div class="stat-item__number">500+</div>
              <div class="stat-item__label">mentors & counting</div>
            </div>
            <div class="stat-item">
              <div class="stat-item__number">12,000+</div>
              <div class="stat-item__label">chats completed</div>
            </div>
            <div class="stat-item">
              <div class="stat-item__number">4.8★</div>
              <div class="stat-item__label">average rating</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="section page-container">
        <span class="section__caption reveal">this changed everything</span>
        <h2 class="section__title reveal">what students say</h2>
        <div class="testimonials__grid" style="margin-top: 32px;">
          ${TESTIMONIALS.map(t => `
            <div class="testimonial-card reveal">
              <p class="testimonial-card__quote">${t.quote}</p>
              <div class="testimonial-card__author">
                <div class="testimonial-card__avatar">${t.name[0]}</div>
                <div>
                  <div class="testimonial-card__name">${t.name}</div>
                  <div class="testimonial-card__detail">${t.detail}</div>
                </div>
              </div>
            </div>
          `).join('')}
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

// ─── PAGE: Browse Mentors ─────

function renderBrowse() {
  return `
    <div class="page-view">
      <div class="page-container browse-header">
        <span class="section__caption">they're all here, waiting</span>
        <h1 class="section__title" style="font-size: clamp(36px, 5vw, 56px);">find your mentor</h1>

        <input type="text" class="search-input" id="mentor-search" placeholder="search by name, subject, or anything..." oninput="filterMentors()">

        <div class="filter-bar" id="subject-filters">
          ${SUBJECTS.map(s => `
            <span class="filter-tag ${s === 'all' ? 'active' : ''}" data-filter="subject" data-value="${s}" onclick="setFilter('subject', '${s}')">${s}</span>
          `).join('')}
        </div>
        <div class="filter-bar" id="year-filters">
          ${YEAR_FILTERS.map(y => `
            <span class="filter-tag ${y === 'all years' ? 'active' : ''}" data-filter="year" data-value="${y}" onclick="setFilter('year', '${y}')">${y}</span>
          `).join('')}
        </div>
      </div>

      <div class="page-container">
        <div class="mentor-grid" id="mentor-grid">
          ${MENTORS.map(m => mentorCard(m)).join('')}
        </div>
        <div id="empty-state" style="display: none;">
          <div class="empty-state">
            <div class="empty-state__icon">🤔</div>
            <div class="empty-state__text">hmm, no one here yet</div>
            <div class="empty-state__hint">try different filters or a broader search</div>
          </div>
        </div>
      </div>

      ${renderFooter()}
    </div>
  `;
}

// ─── PAGE: Mentor Profile ─────

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

  const initials = mentor.name.split(' ').map(n => n[0]).join('');

  return `
    <div class="page-view">
      <div class="page-container profile-page">
        <a class="profile-back" onclick="window.navigateTo('/browse')">← back to mentors</a>

        <div class="profile__header">
          <div class="profile__avatar-frame" style="position: relative;">
            ${initials}
            <div class="sticker" style="position: absolute; top: -16px; right: -16px; transform: rotate(12deg);">${stickerDecoration('sparkle', 28)}</div>
            <div class="sticker" style="position: absolute; bottom: -12px; left: -12px; transform: rotate(-10deg);">${stickerDecoration('star', 24)}</div>
          </div>

          <div>
            <div class="profile__info-label">
              <div class="profile__name">${mentor.name}</div>
              <div class="profile__meta">
                <span>${mentor.year}</span>
                <span class="mentor-card__meta-divider">·</span>
                <span>${mentor.major}</span>
                <span class="mentor-card__meta-divider">·</span>
                <span>${mentor.university}</span>
              </div>
            </div>
            <div class="profile__achievements">
              ${mentor.achievements.map(a => achievementSticker(a)).join('')}
            </div>
            <div class="profile__rating">
              <span class="profile__rating-stars">${starRating(mentor.rating)}</span>
              <span>${mentor.rating} rating · ${mentor.callsCompleted} chats completed</span>
            </div>
          </div>
        </div>

        <div class="profile__section">
          <h3 class="profile__section-title">about me</h3>
          <p class="profile__bio">${mentor.bio}</p>
        </div>

        <div class="profile__section">
          <h3 class="profile__section-title">i can help with</h3>
          <div class="profile__tags">
            ${mentor.helpsWith.map(t => `<span class="profile__tag">${t}</span>`).join('')}
          </div>
        </div>

        <div class="profile__section">
          <h3 class="profile__section-title">pick a time</h3>
          <span class="handwritten" style="font-size: 16px; display: block; margin-bottom: 16px;">all times are in your local timezone</span>
          <div class="availability-grid">
            ${mentor.availability.map(day => `
              <div class="availability-day">
                <div class="availability-day__label">${day.day}</div>
                ${day.slots.map(slot => `
                  <button class="time-slot" data-day="${day.day}" data-slot="${slot}" onclick="selectTimeSlot(this, '${day.day}', '${slot}')">${slot}</button>
                `).join('')}
              </div>
            `).join('')}
          </div>
          <div class="profile__book-bar" id="book-bar" style="display: none;">
            <div class="profile__book-selected" id="book-selected-text"></div>
            <button class="pill-btn" onclick="openBookingModal(${mentor.id})">book a chat!</button>
            <span class="hero__quiet-caption">you'll get a confirmation link</span>
          </div>
        </div>
      </div>

      ${renderFooter()}
    </div>
  `;
}

// ─── Footer Component ─────

function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer__inner">
        <div>
          <div class="footer__brand">frea</div>
          <div class="footer__tagline">mentoring, for free.</div>
        </div>
        <div class="footer__links">
          <a class="footer__link" href="#" onclick="event.preventDefault();">about</a>
          <a class="footer__link" href="#" onclick="event.preventDefault(); window.scrollTo({top: document.querySelector('.faq__list')?.offsetTop - 100, behavior: 'smooth'})">faq</a>
          <a class="footer__link" href="#" onclick="event.preventDefault();">become a mentor</a>
          <a class="footer__link" href="#" onclick="event.preventDefault();">contact</a>
        </div>
      </div>
      <div class="footer__bottom">
        © 2026 frea. built with ♥ for students who deserve great mentors.
      </div>
    </footer>
  `;
}

// ─── Booking Modal ─────

function openBookingModal(mentorId) {
  const mentor = MENTORS.find(m => m.id === mentorId);
  if (!mentor) return;

  const selectedDay = window.__selectedDay || '';
  const selectedSlot = window.__selectedSlot || '';

  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">✕</button>
    <h2 class="modal__title">chat booked!</h2>
    <p class="modal__body">you're all set with ${mentor.name}. here's what happens next:</p>
    <ul class="modal__steps">
      <li class="modal__step">
        <span class="modal__step-icon">📧</span>
        <span>you'll get an email with a google meet link</span>
      </li>
      <li class="modal__step">
        <span class="modal__step-icon">📅</span>
        <span>show up on <strong>${selectedDay}</strong> at <strong>${selectedSlot}</strong></span>
      </li>
      <li class="modal__step">
        <span class="modal__step-icon">💬</span>
        <span>chat for 20 mins — no pressure, no cost</span>
      </li>
    </ul>
    <div class="modal__input-row">
      <input type="email" class="modal__input" id="booking-email" placeholder="your email">
      <button class="pill-btn pill-btn--dark" onclick="confirmBooking()">i'm in!</button>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function confirmBooking() {
  const email = document.getElementById('booking-email')?.value;
  if (!email || !email.includes('@')) {
    document.getElementById('booking-email').style.borderColor = '#ff6f1e';
    document.getElementById('booking-email').setAttribute('placeholder', 'please enter a valid email');
    return;
  }

  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <button class="modal__close" onclick="closeModal()">✕</button>
    <div class="modal--confirmation">
      <div class="modal__celebration">🎉 ✨ ⚡</div>
      <h2 class="modal__title">you're in!</h2>
      <p class="modal__body">check your email for the meeting link. your mentor's looking forward to chatting with you.</p>
      <button class="pill-btn" onclick="closeModal(); window.navigateTo('/browse')">browse more mentors</button>
    </div>
  `;
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Time Slot Selection ─────

window.__selectedDay = '';
window.__selectedSlot = '';

function selectTimeSlot(el, day, slot) {
  // Deselect all
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  // Select this one
  el.classList.add('selected');

  window.__selectedDay = day;
  window.__selectedSlot = slot;

  const bookBar = document.getElementById('book-bar');
  const bookText = document.getElementById('book-selected-text');
  if (bookBar && bookText) {
    bookBar.style.display = 'flex';
    bookText.innerHTML = `selected: <span>${day} at ${slot}</span>`;
  }
}
window.selectTimeSlot = selectTimeSlot;

// ─── FAQ Toggle ─────

function toggleFaq(index) {
  const item = document.querySelector(`[data-faq="${index}"]`);
  if (item) {
    item.classList.toggle('open');
  }
}
window.toggleFaq = toggleFaq;

// ─── Filtering (Browse Page) ─────

let activeSubject = 'all';
let activeYear = 'all years';

function setFilter(type, value) {
  if (type === 'subject') {
    activeSubject = value;
    document.querySelectorAll('[data-filter="subject"]').forEach(t => {
      t.classList.toggle('active', t.dataset.value === value);
    });
  } else if (type === 'year') {
    activeYear = value;
    document.querySelectorAll('[data-filter="year"]').forEach(t => {
      t.classList.toggle('active', t.dataset.value === value);
    });
  }
  filterMentors();
}
window.setFilter = setFilter;

function filterMentors() {
  const searchInput = document.getElementById('mentor-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = MENTORS.filter(m => {
    // Subject filter
    if (activeSubject !== 'all') {
      const category = SUBJECT_MAP[m.major];
      if (category !== activeSubject) return false;
    }
    // Year filter
    if (activeYear !== 'all years') {
      if (m.year !== activeYear) return false;
    }
    // Search filter
    if (search) {
      const searchable = `${m.name} ${m.major} ${m.university} ${m.bio} ${m.helpsWith.join(' ')}`.toLowerCase();
      if (!searchable.includes(search)) return false;
    }
    return true;
  });

  const grid = document.getElementById('mentor-grid');
  const emptyState = document.getElementById('empty-state');

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

// ─── Router ─────

function getRoute() {
  const hash = window.location.hash || '#/';
  return hash.replace('#', '');
}

function renderPage() {
  const route = getRoute();
  const app = document.getElementById('app');
  if (!app) return;

  // Reset scroll
  window.scrollTo(0, 0);

  // Reset filters
  activeSubject = 'all';
  activeYear = 'all years';

  if (route === '/' || route === '') {
    app.innerHTML = renderLanding();
  } else if (route === '/browse') {
    app.innerHTML = renderBrowse();
  } else if (route.startsWith('/mentor/')) {
    const id = route.split('/')[2];
    app.innerHTML = renderProfile(id);
  } else {
    app.innerHTML = renderLanding();
  }

  // Setup scroll-reveal animations
  setupRevealObserver();
}

function navigateTo(path) {
  window.location.hash = path;
}
window.navigateTo = navigateTo;

// Make booking functions global
window.openBookingModal = openBookingModal;
window.confirmBooking = confirmBooking;
window.closeModal = closeModal;

// ─── Scroll Reveal ─────

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

// ─── Close Modal on Overlay Click ─────

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

// ─── Navigation Links ─────

function setupNavLinks() {
  document.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.navigate);
    });
  });
}

// ─── Initialize ─────

function init() {
  renderPage();
  setupNavbarScroll();
  setupModalClose();
  setupNavLinks();

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    renderPage();
  });

  // Keyboard: Escape closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
