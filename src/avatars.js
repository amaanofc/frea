// ─────────────────────────────────────────────
// frea — Handcrafted Modern Vector Mentor Avatars & Photo System
// ─────────────────────────────────────────────

export const MENTOR_AVATARS = {
  // 1. Aanya Sharma (Female) — Dark shoulder lob, wireframe specs, navy knit
  1: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#e0f2fe"/>
      <!-- Torso & Navy Knit -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#1e293b" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M42 70 L50 79 L58 70" fill="#ffffff" stroke="#171717" stroke-width="1.8"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#f4c095" stroke="#171717" stroke-width="2"/>
      <!-- Back Hair -->
      <path d="M26 40 C 24 64, 28 80, 36 82 C 37 72, 36 56, 36 46" fill="#2d1b10" stroke="#171717" stroke-width="2"/>
      <path d="M74 40 C 76 64, 72 80, 64 82 C 63 72, 64 56, 64 46" fill="#2d1b10" stroke="#171717" stroke-width="2"/>
      <!-- Ears -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#f4c095" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#f4c095" stroke="#171717" stroke-width="1.8"/>
      <!-- Head -->
      <ellipse cx="50" cy="46" rx="19" ry="21" fill="#f4c095" stroke="#171717" stroke-width="2.2"/>
      <!-- Front Hair & Bangs -->
      <path d="M29 42 C 29 25, 40 18, 50 18 C 60 18, 71 25, 71 42 C 66 32, 57 28, 50 28 C 43 28, 34 32, 29 42 Z" fill="#2d1b10" stroke="#171717" stroke-width="2.2"/>
      <!-- Eyebrows -->
      <path d="M38 38 Q 42 36 46 38" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M54 38 Q 58 36 62 38" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <!-- Thin Wireframe Glasses -->
      <circle cx="41" cy="45" r="7.5" stroke="#ff6f1e" stroke-width="1.8" fill="#ffffff" fill-opacity="0.2"/>
      <circle cx="59" cy="45" r="7.5" stroke="#ff6f1e" stroke-width="1.8" fill="#ffffff" fill-opacity="0.2"/>
      <path d="M48.5 45 L 51.5 45" stroke="#ff6f1e" stroke-width="1.8"/>
      <!-- Eyes & Catchlights -->
      <circle cx="41" cy="45" r="2.4" fill="#171717"/>
      <circle cx="59" cy="45" r="2.4" fill="#171717"/>
      <circle cx="42" cy="44" r="0.8" fill="#ffffff"/>
      <circle cx="60" cy="44" r="0.8" fill="#ffffff"/>
      <!-- Smile & Cheeks -->
      <path d="M44 55 Q 50 60 56 55" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <ellipse cx="36" cy="51" rx="2.8" ry="1.4" fill="#f43f5e" opacity="0.35"/>
      <ellipse cx="64" cy="51" rx="2.8" ry="1.4" fill="#f43f5e" opacity="0.35"/>
    </svg>
  `,

  // 2. Callum Davies (Male) — Side part, olive crewneck, crisp white collar
  2: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#fef3c7"/>
      <!-- Torso & Olive Sweatshirt -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#3f6212" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M41 70 C 41 76, 59 76, 59 70" fill="#fdfbf9" stroke="#171717" stroke-width="1.8"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#e0a97c" stroke="#171717" stroke-width="2"/>
      <!-- Ears -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#e0a97c" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#e0a97c" stroke="#171717" stroke-width="1.8"/>
      <!-- Head -->
      <ellipse cx="50" cy="47" rx="19" ry="20" fill="#e0a97c" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair: Classic styled side part -->
      <path d="M30 42 C 29 26, 36 19, 50 19 C 64 19, 71 27, 71 39 C 68 33, 62 30, 52 30 C 40 30, 32 34, 30 42 Z" fill="#382314" stroke="#171717" stroke-width="2.2"/>
      <path d="M30 38 C 34 32, 42 29, 50 29" stroke="#171717" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <!-- Eyebrows -->
      <path d="M38 39 Q 43 37 47 39" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M53 39 Q 57 37 62 39" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Eyes & Catchlights -->
      <circle cx="42" cy="45" r="2.5" fill="#171717"/>
      <circle cx="58" cy="45" r="2.5" fill="#171717"/>
      <circle cx="43" cy="44" r="0.8" fill="#ffffff"/>
      <circle cx="59" cy="44" r="0.8" fill="#ffffff"/>
      <!-- Friendly confident smile -->
      <path d="M44 56 Q 50 61 56 56" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // 3. Priya Nair (Female) — High bun topknot, lavender ribbed turtleneck, gold hoops
  3: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#fce7f3"/>
      <!-- Torso & Lavender Turtleneck -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#c084fc" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="42" y="60" width="16" height="14" rx="4" fill="#a855f7" stroke="#171717" stroke-width="2"/>
      <!-- Neck -->
      <rect x="44" y="52" width="12" height="12" fill="#d99564" stroke="#171717" stroke-width="1.8"/>
      <!-- Topknot Bun -->
      <circle cx="50" cy="16" r="10" fill="#1c1917" stroke="#171717" stroke-width="2.2"/>
      <path d="M45 16 C 47 14, 53 14, 55 16" stroke="#ff6f1e" stroke-width="2" stroke-linecap="round"/>
      <!-- Ears & Gold Hoop Earrings -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#d99564" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#d99564" stroke="#171717" stroke-width="1.8"/>
      <circle cx="30" cy="51" r="3.2" stroke="#ff6f1e" stroke-width="1.8" fill="none"/>
      <circle cx="70" cy="51" r="3.2" stroke="#ff6f1e" stroke-width="1.8" fill="none"/>
      <!-- Head -->
      <ellipse cx="50" cy="46" rx="19" ry="20" fill="#d99564" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair Bangs -->
      <path d="M30 40 C 30 25, 41 22, 50 22 C 59 22, 70 25, 70 40 C 64 33, 56 31, 50 31 C 44 31, 36 33, 30 40 Z" fill="#1c1917" stroke="#171717" stroke-width="2.2"/>
      <!-- Eyebrows -->
      <path d="M38 39 Q 42 37 46 39" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M54 39 Q 58 37 62 39" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <!-- Eyes & Catchlights -->
      <circle cx="42" cy="45" r="2.4" fill="#171717"/>
      <circle cx="58" cy="45" r="2.4" fill="#171717"/>
      <circle cx="43" cy="44" r="0.8" fill="#ffffff"/>
      <circle cx="59" cy="44" r="0.8" fill="#ffffff"/>
      <!-- Cheeks & Smile -->
      <path d="M44 55 Q 50 60 56 55" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <ellipse cx="37" cy="51" rx="2.8" ry="1.4" fill="#f43f5e" opacity="0.35"/>
      <ellipse cx="63" cy="51" rx="2.8" ry="1.4" fill="#f43f5e" opacity="0.35"/>
    </svg>
  `,

  // 4. Noah Adebayo (Male) — Sharp taper fade, deep tone, bomber jacket, airpod
  4: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#dcfce7"/>
      <!-- Torso & Bomber Jacket -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#1e293b" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M43 70 L50 82 L57 70" fill="#ffffff" stroke="#171717" stroke-width="2"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#8c5836" stroke="#171717" stroke-width="2"/>
      <!-- Ears & Airpod -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#8c5836" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#8c5836" stroke="#171717" stroke-width="1.8"/>
      <rect x="68" y="47" width="3" height="6" rx="1.5" fill="#ffffff" stroke="#171717" stroke-width="1.2"/>
      <!-- Head -->
      <ellipse cx="50" cy="47" rx="19" ry="20" fill="#8c5836" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair: Clean fade -->
      <path d="M30 42 C 30 26, 38 20, 50 20 C 62 20, 70 26, 70 42 C 68 34, 60 32, 50 32 C 40 32, 32 34, 30 42 Z" fill="#18181b" stroke="#171717" stroke-width="2.2"/>
      <!-- Eyebrows -->
      <path d="M38 39 Q 43 37 47 39" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M53 39 Q 57 37 62 39" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <!-- Eyes & Catchlights -->
      <circle cx="42" cy="45" r="2.5" fill="#171717"/>
      <circle cx="58" cy="45" r="2.5" fill="#171717"/>
      <circle cx="43" cy="44" r="0.8" fill="#ffffff"/>
      <circle cx="59" cy="44" r="0.8" fill="#ffffff"/>
      <!-- Warm smirk & neat chin contour -->
      <path d="M44 56 Q 50 61 56 56" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // 5. Oliver Zhang (Male) — Neat parted hair, thin metal glasses, Oxford shirt
  5: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#ede9fe"/>
      <!-- Torso & Crisp Oxford Blue Shirt -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#2563eb" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M42 70 L50 77 L58 70" fill="#ffffff" stroke="#171717" stroke-width="1.8"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#f2c8a2" stroke="#171717" stroke-width="2"/>
      <!-- Ears -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#f2c8a2" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#f2c8a2" stroke="#171717" stroke-width="1.8"/>
      <!-- Head -->
      <ellipse cx="50" cy="47" rx="19" ry="20" fill="#f2c8a2" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair: Neat side-sweep -->
      <path d="M30 42 C 29 27, 38 21, 50 21 C 62 21, 71 27, 71 40 C 67 34, 59 31, 50 31 C 41 31, 33 34, 30 42 Z" fill="#1e1e24" stroke="#171717" stroke-width="2.2"/>
      <!-- Minimalist Rectangular Glasses -->
      <rect x="35" y="41" width="12" height="9" rx="2.5" stroke="#171717" stroke-width="1.8" fill="#ffffff" fill-opacity="0.2"/>
      <rect x="53" y="41" width="12" height="9" rx="2.5" stroke="#171717" stroke-width="1.8" fill="#ffffff" fill-opacity="0.2"/>
      <path d="M47 45 L53 45" stroke="#171717" stroke-width="1.8"/>
      <!-- Eyes & Catchlights -->
      <circle cx="41" cy="45" r="2.2" fill="#171717"/>
      <circle cx="59" cy="45" r="2.2" fill="#171717"/>
      <circle cx="42" cy="44" r="0.7" fill="#ffffff"/>
      <circle cx="60" cy="44" r="0.7" fill="#ffffff"/>
      <!-- Calm scholarly smile -->
      <path d="M44 56 Q 50 60 56 56" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // 6. Fatima Al-Zahra (Female) — Modern draped pashmina hijab, soft sage tones, natural fabric folds & warm expression
  6: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#f0fdf4"/>
      
      <!-- Torso: Elegant Ribbed Oatmeal Sweater -->
      <path d="M14 100 C 16 78, 30 70, 50 70 C 70 70, 84 78, 86 100 Z" fill="#e2d9cc" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M42 70 L50 78 L58 70" fill="#f5f0eb" stroke="#171717" stroke-width="1.8"/>

      <!-- Hijab: Back Volume & Natural Silhouette -->
      <path d="M21 44 C 21 21, 33 14, 50 14 C 67 14, 79 21, 79 44 C 79 66, 75 82, 50 82 C 25 82, 21 66, 21 44 Z" fill="#2d5a4f" stroke="#171717" stroke-width="2.2"/>
      
      <!-- Hijab: Natural Shoulder & Chest Draping -->
      <path d="M18 100 C 20 84, 30 72, 44 68 C 50 67, 56 68, 64 72 C 74 77, 80 88, 82 100 Z" fill="#2d5a4f" stroke="#171717" stroke-width="2.2"/>

      <!-- Hijab Under-cap (Clean, subtle peek at forehead) -->
      <path d="M36 34 C 42 30, 48 29, 54 31 C 59 33, 63 36, 65 40 C 61 36, 54 34, 48 34 C 42 34, 38 36, 36 34 Z" fill="#fef3c7" stroke="#171717" stroke-width="1.5"/>

      <!-- Face Oval (Warm, softly framed by fabric wrap) -->
      <path d="M34 46 C 34 33, 40 28, 50 28 C 60 28, 66 33, 66 46 C 66 59, 58 65, 50 65 C 42 65, 34 59, 34 46 Z" fill="#f4c095" stroke="#171717" stroke-width="2"/>

      <!-- Hijab Overlap & Graceful Wrap under chin -->
      <path d="M33 50 C 35 63, 42 68, 50 68 C 58 68, 67 63, 67 50 C 72 58, 69 74, 58 80 C 50 82, 42 81, 35 76 C 29 70, 29 58, 33 50 Z" fill="#366b5e" stroke="#171717" stroke-width="1.8"/>

      <!-- Elegant Flowing Fold Lines (fabric depth) -->
      <path d="M42 68 C 45 74, 52 82, 60 88" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M50 72 C 55 77, 66 84, 76 89" stroke="#171717" stroke-width="1.6" stroke-linecap="round" fill="none"/>
      <path d="M36 74 C 33 80, 29 88, 26 96" stroke="#171717" stroke-width="1.6" stroke-linecap="round" fill="none"/>

      <!-- Eyebrows (Neat, natural, softly curved) -->
      <path d="M38 39 Q 42 37 46 39" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M54 39 Q 58 37 62 39" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>

      <!-- Warm Eyes, Catchlights & Gentle Lashes -->
      <circle cx="42" cy="45" r="2.5" fill="#171717"/>
      <circle cx="58" cy="45" r="2.5" fill="#171717"/>
      <circle cx="43" cy="44" r="0.9" fill="#ffffff"/>
      <circle cx="59" cy="44" r="0.9" fill="#ffffff"/>
      <path d="M39 43 L41 42" stroke="#171717" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M61 43 L59 42" stroke="#171717" stroke-width="1.2" stroke-linecap="round"/>

      <!-- Soft Blush & Kind Smile -->
      <ellipse cx="37" cy="51" rx="2.8" ry="1.4" fill="#f43f5e" opacity="0.3"/>
      <ellipse cx="63" cy="51" rx="2.8" ry="1.4" fill="#f43f5e" opacity="0.3"/>
      <path d="M44 54 Q 50 59 56 54" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // 7. Tariq Al-Mansoor (Male) — Dark hair, neat trimmed stubble line, burgundy scrub
  7: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#ffe4e6"/>
      <!-- Torso & Medical Scrub -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#991b1b" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M40 70 L50 82 L60 70" fill="#f8fafc" stroke="#171717" stroke-width="1.8"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#cca07e" stroke="#171717" stroke-width="2"/>
      <!-- Ears -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#cca07e" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#cca07e" stroke="#171717" stroke-width="1.8"/>
      <!-- Head -->
      <ellipse cx="50" cy="47" rx="19" ry="20" fill="#cca07e" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair: Modern taper cut -->
      <path d="M30 42 C 29 26, 38 20, 50 20 C 62 20, 71 26, 71 42 C 67 34, 59 32, 50 32 C 41 32, 33 34, 30 42 Z" fill="#171717" stroke="#171717" stroke-width="2.2"/>
      <!-- Trimmed Beard Contour -->
      <path d="M34 50 C 36 64, 44 67, 50 67 C 56 67, 64 64, 66 50" stroke="#171717" stroke-width="1.6" stroke-dasharray="2 2" fill="none"/>
      <!-- Eyebrows -->
      <path d="M38 39 Q 43 37 47 39" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M53 39 Q 57 37 62 39" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <!-- Eyes & Catchlights -->
      <circle cx="42" cy="45" r="2.4" fill="#171717"/>
      <circle cx="58" cy="45" r="2.4" fill="#171717"/>
      <circle cx="43" cy="44" r="0.8" fill="#ffffff"/>
      <circle cx="59" cy="44" r="0.8" fill="#ffffff"/>
      <!-- Friendly reassuring smile -->
      <path d="M44 56 Q 50 60 56 56" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // 8. Layla Chen (Female) — Double space buns, warm amber sweater, tendril bangs (no glasses)
  8: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#ccfbf1"/>
      <!-- Torso & Mustard Knit -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#d97706" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M41 70 C 41 76, 59 76, 59 70" fill="#fef3c7" stroke="#171717" stroke-width="1.8"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#fbd5b5" stroke="#171717" stroke-width="2"/>
      <!-- Space Buns (Top Left & Top Right) -->
      <circle cx="28" cy="20" r="11" fill="#2d1b10" stroke="#171717" stroke-width="2.2"/>
      <circle cx="28" cy="20" r="9" fill="#382314"/>
      <circle cx="72" cy="20" r="11" fill="#2d1b10" stroke="#171717" stroke-width="2.2"/>
      <circle cx="72" cy="20" r="9" fill="#382314"/>
      <!-- Bun Scrunchies -->
      <ellipse cx="30" cy="28" rx="5" ry="2.5" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/>
      <ellipse cx="70" cy="28" rx="5" ry="2.5" fill="#ff6f1e" stroke="#171717" stroke-width="1.5"/>
      <!-- Ears -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#fbd5b5" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#fbd5b5" stroke="#171717" stroke-width="1.8"/>
      <!-- Head -->
      <ellipse cx="50" cy="46" rx="19" ry="20" fill="#fbd5b5" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair: Center part with cute framing tendrils -->
      <path d="M30 42 C 29 25, 38 20, 50 20 C 62 20, 71 25, 70 42 C 65 31, 57 28, 50 28 C 43 28, 35 31, 30 42 Z" fill="#2d1b10" stroke="#171717" stroke-width="2.2"/>
      <!-- Tendril bangs framing cheeks -->
      <path d="M32 40 C 31 52, 33 60, 36 62" stroke="#2d1b10" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M68 40 C 69 52, 67 60, 64 62" stroke="#2d1b10" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Eyebrows -->
      <path d="M38 38 Q 42 36 46 38" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M54 38 Q 58 36 62 38" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <!-- Eyes & Catchlights (No glasses) -->
      <circle cx="42" cy="44" r="2.5" fill="#171717"/>
      <circle cx="58" cy="44" r="2.5" fill="#171717"/>
      <circle cx="43" cy="43" r="0.9" fill="#ffffff"/>
      <circle cx="59" cy="43" r="0.9" fill="#ffffff"/>
      <!-- Joyful smile & blush -->
      <path d="M43 54 Q 50 60 57 54" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <ellipse cx="36" cy="50" rx="3" ry="1.5" fill="#f43f5e" opacity="0.4"/>
      <ellipse cx="64" cy="50" rx="3" ry="1.5" fill="#f43f5e" opacity="0.4"/>
    </svg>
  `,

  // 9. Lucas Wright (Male) — Textured brown hair, forest green vintage sweater
  9: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#e0e7ff"/>
      <!-- Torso & Forest Green Sweater -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#14532d" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M42 70 L50 77 L58 70" fill="#f8fafc" stroke="#171717" stroke-width="1.8"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#fed7aa" stroke="#171717" stroke-width="2"/>
      <!-- Ears -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#fed7aa" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#fed7aa" stroke="#171717" stroke-width="1.8"/>
      <!-- Head -->
      <ellipse cx="50" cy="47" rx="19" ry="20" fill="#fed7aa" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair: Textured wavy crop -->
      <path d="M30 42 C 28 26, 36 20, 50 20 C 64 20, 72 26, 70 42 C 67 34, 59 31, 50 31 C 41 31, 33 34, 30 42 Z" fill="#451a03" stroke="#171717" stroke-width="2.2"/>
      <!-- Eyebrows -->
      <path d="M38 39 Q 43 37 47 39" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M53 39 Q 57 37 62 39" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Eyes & Catchlights -->
      <circle cx="42" cy="45" r="2.4" fill="#171717"/>
      <circle cx="58" cy="45" r="2.4" fill="#171717"/>
      <circle cx="43" cy="44" r="0.8" fill="#ffffff"/>
      <circle cx="59" cy="44" r="0.8" fill="#ffffff"/>
      <!-- Thoughtful smile -->
      <path d="M44 56 Q 50 60 56 56" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // 10. Sophia Taylor (Female) — Curly textured hair / puff, stylish black mock-neck
  10: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#fef9c3"/>
      <!-- Torso & Black Mock Neck -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#18181b" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="42" y="60" width="16" height="12" rx="3" fill="#18181b" stroke="#171717" stroke-width="2"/>
      <!-- Neck -->
      <rect x="43" y="53" width="14" height="12" fill="#78350f" stroke="#171717" stroke-width="1.8"/>
      <!-- Hair Afro Puff / Volume behind head -->
      <circle cx="34" cy="36" r="13" fill="#18181b"/>
      <circle cx="66" cy="36" r="13" fill="#18181b"/>
      <circle cx="50" cy="24" r="13" fill="#18181b"/>
      <circle cx="30" cy="48" r="11" fill="#18181b"/>
      <circle cx="70" cy="48" r="11" fill="#18181b"/>
      <!-- Ears & Gold Studs -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#78350f" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#78350f" stroke="#171717" stroke-width="1.8"/>
      <circle cx="30" cy="49" r="1.5" fill="#f59e0b"/>
      <circle cx="70" cy="49" r="1.5" fill="#f59e0b"/>
      <!-- Head -->
      <ellipse cx="50" cy="46" rx="19" ry="20" fill="#78350f" stroke="#171717" stroke-width="2.2"/>
      <!-- Front Hairline -->
      <path d="M32 40 C 36 32, 43 30, 50 30 C 57 30, 64 32, 68 40" stroke="#171717" stroke-width="2.2" fill="none"/>
      <!-- Eyebrows -->
      <path d="M38 38 Q 42 36 46 38" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M54 38 Q 58 36 62 38" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Eyes & Catchlights -->
      <circle cx="42" cy="44" r="2.4" fill="#171717"/>
      <circle cx="58" cy="44" r="2.4" fill="#171717"/>
      <circle cx="43" cy="43" r="0.8" fill="#ffffff"/>
      <circle cx="59" cy="43" r="0.8" fill="#ffffff"/>
      <!-- Warm smile -->
      <path d="M44 55 Q 50 60 56 55" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // 11. Liam Fletcher (Male) — Energetic wavy hair, modern grey hoodie
  11: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#e2e8f0"/>
      <!-- Torso & Grey Hoodie -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#475569" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M44 71 C 44 78, 56 78, 56 71" fill="#f8fafc" stroke="#171717" stroke-width="1.8"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#fed7aa" stroke="#171717" stroke-width="2"/>
      <!-- Ears -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#fed7aa" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#fed7aa" stroke="#171717" stroke-width="1.8"/>
      <!-- Head -->
      <ellipse cx="50" cy="47" rx="19" ry="20" fill="#fed7aa" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair: Modern energetic crop -->
      <path d="M30 42 C 28 26, 36 20, 50 20 C 64 20, 72 26, 70 42 C 67 34, 59 31, 50 31 C 41 31, 33 34, 30 42 Z" fill="#b45309" stroke="#171717" stroke-width="2.2"/>
      <!-- Eyebrows -->
      <path d="M38 39 Q 43 37 47 39" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M53 39 Q 57 37 62 39" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Eyes & Catchlights -->
      <circle cx="42" cy="45" r="2.4" fill="#171717"/>
      <circle cx="58" cy="45" r="2.4" fill="#171717"/>
      <circle cx="43" cy="44" r="0.8" fill="#ffffff"/>
      <circle cx="59" cy="44" r="0.8" fill="#ffffff"/>
      <!-- Bright friendly grin -->
      <path d="M43 56 Q 50 62 57 56" stroke="#171717" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // 12. Chloe Jenkins (Female) — Sleek dark ponytail, rose-gold wire specs, sky blue cardigan
  12: (size = 80) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="mentor-avatar-svg">
      <rect width="100" height="100" rx="18" fill="#fae8ff"/>
      <!-- Torso & Sky Blue Cardigan -->
      <path d="M16 100 C 18 78, 32 70, 50 70 C 68 70, 82 78, 84 100 Z" fill="#0284c7" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M42 70 L50 79 L58 70" fill="#ffffff" stroke="#171717" stroke-width="1.8"/>
      <!-- Neck -->
      <rect x="43" y="55" width="14" height="18" rx="4" fill="#fed7aa" stroke="#171717" stroke-width="2"/>
      <!-- Ponytail at side -->
      <path d="M68 40 C 76 44, 82 56, 80 66 C 76 64, 73 52, 70 46" fill="#18181b" stroke="#171717" stroke-width="2"/>
      <circle cx="70" cy="42" r="3" fill="#ff6f1e"/>
      <!-- Ears -->
      <ellipse cx="31" cy="48" rx="3.5" ry="5" fill="#fed7aa" stroke="#171717" stroke-width="1.8"/>
      <ellipse cx="69" cy="48" rx="3.5" ry="5" fill="#fed7aa" stroke="#171717" stroke-width="1.8"/>
      <!-- Head -->
      <ellipse cx="50" cy="46" rx="19" ry="20" fill="#fed7aa" stroke="#171717" stroke-width="2.2"/>
      <!-- Hair: Sleek back -->
      <path d="M29 42 C 29 25, 40 18, 50 18 C 60 18, 71 25, 71 42 C 66 32, 57 28, 50 28 C 43 28, 34 32, 29 42 Z" fill="#18181b" stroke="#171717" stroke-width="2.2"/>
      <!-- Eyebrows -->
      <path d="M38 38 Q 42 36 46 38" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M54 38 Q 58 36 62 38" stroke="#171717" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <!-- Delicate Wireframe Specs -->
      <circle cx="41" cy="45" r="7" stroke="#e11d48" stroke-width="1.6" fill="#ffffff" fill-opacity="0.2"/>
      <circle cx="59" cy="45" r="7" stroke="#e11d48" stroke-width="1.6" fill="#ffffff" fill-opacity="0.2"/>
      <path d="M48 45 L52 45" stroke="#e11d48" stroke-width="1.6"/>
      <!-- Eyes & Catchlights -->
      <circle cx="41" cy="45" r="2.2" fill="#171717"/>
      <circle cx="59" cy="45" r="2.2" fill="#171717"/>
      <circle cx="42" cy="44" r="0.7" fill="#ffffff"/>
      <circle cx="60" cy="44" r="0.7" fill="#ffffff"/>
      <!-- Warm smile & blush -->
      <path d="M44 55 Q 50 60 56 55" stroke="#171717" stroke-width="2" stroke-linecap="round" fill="none"/>
      <ellipse cx="36" cy="51" rx="2.8" ry="1.4" fill="#f43f5e" opacity="0.35"/>
      <ellipse cx="64" cy="51" rx="2.8" ry="1.4" fill="#f43f5e" opacity="0.35"/>
    </svg>
  `
};

/**
 * Render mentor avatar: Supports custom user-uploaded photo URL or vector SVG illustration
 * @param {number|object} mentorOrId - Mentor ID or mentor object
 * @param {number} size - Dimension in px (default 80)
 * @param {string|null} photoUrl - Optional direct photo URL or base64 data string
 */
export function getMentorAvatar(mentorOrId, size = 80, photoUrl = null) {
  let mentorId = 1;
  let resolvedPhoto = photoUrl;

  if (typeof mentorOrId === 'object' && mentorOrId !== null) {
    mentorId = mentorOrId.id || 1;
    resolvedPhoto = mentorOrId.photoUrl || resolvedPhoto;
  } else if (typeof mentorOrId === 'number') {
    mentorId = mentorOrId;
  }

  // If user uploaded a custom profile picture, render high-res image
  if (resolvedPhoto && typeof resolvedPhoto === 'string' && (resolvedPhoto.startsWith('data:') || resolvedPhoto.startsWith('http') || resolvedPhoto.startsWith('/'))) {
    return `<img src="${resolvedPhoto}" alt="Mentor avatar" class="mentor-avatar-img" width="${size}" height="${size}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block;" loading="lazy">`;
  }

  // Otherwise, render standard clean vector SVG
  const avatarFn = MENTOR_AVATARS[mentorId];
  if (avatarFn) {
    return avatarFn(size);
  }
  return MENTOR_AVATARS[1](size);
}
