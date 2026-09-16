// ─────────────────────────────────────────────
// frea — Curved Loop Ribbon & Interactive Line Animation
// Inspired by Voldog / Wispr Flow curved loop UI
// ─────────────────────────────────────────────

import gsap from 'gsap';

export function renderCurvedRibbon() {
  return `
    <div class="curved-ribbon-container">
      <svg class="curved-ribbon-svg" viewBox="0 0 1100 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Marker Orange Gradient -->
          <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ff8533" />
            <stop offset="45%" stop-color="#ff6f1e" />
            <stop offset="70%" stop-color="#ea580c" />
            <stop offset="100%" stop-color="#ff8533" />
          </linearGradient>

          <!-- Soft Shadow Filter for 3D tactile feel -->
          <filter id="ribbonShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#171717" flood-opacity="0.08" />
          </filter>
        </defs>

        <!-- Background guide dashed trail -->
        <path
          d="M 50 140 C 220 140, 360 40, 520 80 C 660 115, 780 20, 800 120 C 815 195, 720 220, 680 150 C 645 90, 720 30, 850 70 C 950 100, 1020 140, 1080 140"
          stroke="rgba(23, 23, 23, 0.08)"
          stroke-width="12"
          stroke-linecap="round"
          stroke-dasharray="6 8"
        />

        <!-- Main Thick Fluid Curved Ribbon with Loop-de-Loop -->
        <path
          id="ribbon-flow-path"
          class="curved-ribbon-path"
          d="M 50 140 C 220 140, 360 40, 520 80 C 660 115, 780 20, 800 120 C 815 195, 720 220, 680 150 C 645 90, 720 30, 850 70 C 950 100, 1020 140, 1080 140"
          stroke="url(#ribbonGrad)"
          stroke-width="14"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#ribbonShadow)"
        />

        <!-- Inner Hand-stitched Line along the Ribbon -->
        <path
          id="ribbon-stitch-path"
          class="curved-ribbon-stitch"
          d="M 50 140 C 220 140, 360 40, 520 80 C 660 115, 780 20, 800 120 C 815 195, 720 220, 680 150 C 645 90, 720 30, 850 70 C 950 100, 1020 140, 1080 140"
          stroke="#fdfbf9"
          stroke-width="2.5"
          stroke-dasharray="8 8"
          stroke-linecap="round"
        />
      </svg>

      <!-- Rotating Circular Seal / Badge Attached to the Ribbon Loop (Voldog / Wispr style) -->
      <div class="spinning-loop-badge" id="spinning-loop-badge">
        <svg class="spinning-badge-svg" viewBox="0 0 160 160">
          <defs>
            <path id="textPathLoop" d="M 80, 80 m -60, 0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0" />
          </defs>
          <circle cx="80" cy="80" r="58" fill="#fef08a" stroke="#ca8a04" stroke-width="2.2" />
          <circle cx="80" cy="80" r="38" fill="#ffffff" stroke="#171717" stroke-width="2" />
          <text font-family="'Fraunces', serif" font-weight="700" font-size="20" fill="#171717" text-anchor="middle" dominant-baseline="central" x="80" y="80">frea</text>
          <text class="spinning-text" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="10.5" fill="#713f12" letter-spacing="2.5">
            <textPath href="#textPathLoop" startOffset="0%">
              • BY STUDENTS • FOR STUDENTS • 100% FREE • UK •
            </textPath>
          </text>
        </svg>
      </div>

      <!-- Floating Playful Annotation Pill -->
      <div class="ribbon-annotation-pill" id="ribbon-pill">
        <span class="ribbon-annotation-dot"></span>
        <span>always 100% free · zero corporate recruiters</span>
      </div>
    </div>
  `;
}

export function initCurvedRibbonAnimation() {
  const path = document.getElementById('ribbon-flow-path');
  const stitch = document.getElementById('ribbon-stitch-path');
  const badge = document.getElementById('spinning-loop-badge');
  const pill = document.getElementById('ribbon-pill');

  if (!path) return;

  // Initial draw-in animation using stroke-dashoffset
  const length = path.getTotalLength ? path.getTotalLength() : 1800;

  gsap.set([path, stitch], {
    strokeDasharray: length,
    strokeDashoffset: length
  });

  // Animate line drawing into view
  gsap.to([path, stitch], {
    strokeDashoffset: 0,
    duration: 2.4,
    ease: 'power2.out',
    scrollTrigger: undefined // Trigger directly
  });

  // Continuous subtle spinning rotation on the badge
  if (badge) {
    gsap.to(badge.querySelector('.spinning-text'), {
      rotation: 360,
      transformOrigin: '80px 80px',
      repeat: -1,
      duration: 16,
      ease: 'none'
    });

    // Gentle floating bob
    gsap.to(badge, {
      y: -6,
      rotation: 4,
      repeat: -1,
      yoyo: true,
      duration: 2.8,
      ease: 'sine.inOut'
    });
  }

  // Mouse hover interaction: wiggle / pulse
  const container = document.querySelector('.curved-ribbon-container');
  if (container) {
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(path, {
        strokeWidth: 16,
        duration: 0.3
      });

      if (badge) {
        gsap.to(badge, {
          x: relX * 24,
          y: relY * 20,
          duration: 0.4,
          ease: 'power1.out'
        });
      }
    });

    container.addEventListener('mouseleave', () => {
      gsap.to(path, {
        strokeWidth: 14,
        duration: 0.4
      });
      if (badge) {
        gsap.to(badge, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)'
        });
      }
    });
  }
}
