// ─────────────────────────────────────────────
// frea — Cute Bigger Custom Cursor & Touch Trail Interactions
// ─────────────────────────────────────────────

export function initCustomCursor() {
  // Check if touch device only
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // ─── Desktop Cute Cursor Follower ─────
  if (!isTouchDevice) {
    const cursor = document.createElement('div');
    cursor.className = 'cute-cursor';
    cursor.innerHTML = `
      <div class="cute-cursor__follower"></div>
      <div class="cute-cursor__dot"></div>
    `;
    document.body.appendChild(cursor);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX;
    let followerY = mouseY;
    let lastSpawnX = mouseX;
    let lastSpawnY = mouseY;
    let isHoveringInteractive = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.opacity = '1';

      // Spawn sparkle trail if moved enough (>24px)
      const dist = Math.hypot(mouseX - lastSpawnX, mouseY - lastSpawnY);
      if (dist > 28) {
        spawnSparkle(mouseX, mouseY);
        lastSpawnX = mouseX;
        lastSpawnY = mouseY;
      }
    });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });

    // Check hover states on interactive elements
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('button, a, .mentor-card, .filter-pill, .calendar-day-card, .calendar-slot-chip, input, select, textarea, .faq-item__question');
      if (target) {
        isHoveringInteractive = true;
        cursor.classList.add('cute-cursor--hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('button, a, .mentor-card, .filter-pill, .calendar-day-card, .calendar-slot-chip, input, select, textarea, .faq-item__question');
      if (target) {
        isHoveringInteractive = false;
        cursor.classList.remove('cute-cursor--hover');
      }
    });

    document.addEventListener('mousedown', () => {
      cursor.classList.add('cute-cursor--click');
      spawnClickBurst(mouseX, mouseY);
    });

    document.addEventListener('mouseup', () => {
      cursor.classList.remove('cute-cursor--click');
    });

    // Smooth spring physics for follower
    function animateCursor() {
      // Ease follower towards mouse
      followerX += (mouseX - followerX) * 0.22;
      followerY += (mouseY - followerY) * 0.22;

      cursor.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;

      requestAnimationFrame(animateCursor);
    }
    requestAnimationFrame(animateCursor);
  }

  // ─── Mobile Touch Burst & Trail Interactions ─────
  window.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (touch) {
      spawnTouchRipple(touch.clientX, touch.clientY);
      spawnClickBurst(touch.clientX, touch.clientY, 4);
    }
  }, { passive: true });

  let lastTouchX = 0;
  let lastTouchY = 0;
  window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) {
      const dist = Math.hypot(touch.clientX - lastTouchX, touch.clientY - lastTouchY);
      if (dist > 36) {
        spawnSparkle(touch.clientX, touch.clientY);
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      }
    }
  }, { passive: true });
}

// ─── Cute Schoolyard Sparkle Particles ─────

const SPARKLE_SHAPES = ['✦', '★', '⚡', '●'];
const SPARKLE_COLORS = ['#ff6f1e', '#3b82f6', '#ff66cf', '#22c55e', '#facc15'];

function spawnSparkle(x, y) {
  const particle = document.createElement('span');
  particle.className = 'cursor-sparkle';
  
  const shape = SPARKLE_SHAPES[Math.floor(Math.random() * SPARKLE_SHAPES.length)];
  const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
  
  particle.textContent = shape;
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.style.color = color;

  const size = 10 + Math.random() * 8;
  particle.style.fontSize = `${size}px`;
  
  const angle = Math.random() * Math.PI * 2;
  const distance = 8 + Math.random() * 16;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance - 8; // Float upwards slightly
  
  particle.style.setProperty('--dx', `${dx}px`);
  particle.style.setProperty('--dy', `${dy}px`);
  particle.style.setProperty('--rot', `${(Math.random() - 0.5) * 60}deg`);

  document.body.appendChild(particle);

  setTimeout(() => {
    particle.remove();
  }, 650);
}

// Click Burst
function spawnClickBurst(x, y, count = 6) {
  for (let i = 0; i < count; i++) {
    spawnSparkle(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 12);
  }
}

// Touch Ripple for Mobile
function spawnTouchRipple(x, y) {
  const ripple = document.createElement('div');
  ripple.className = 'touch-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 500);
}
