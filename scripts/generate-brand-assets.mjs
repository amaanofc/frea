// ─────────────────────────────────────────────
// frea — social preview image and favicon
// ─────────────────────────────────────────────
//
//   npm run assets
//
// index.html referenced og-preview.png and favicon.svg, but neither existed —
// so every WhatsApp, Discord and LinkedIn share rendered a blank card. For a
// platform that spreads between coursemates, that is a real growth leak.
//
// Authored as SVG here and rasterised to PNG, because no major social platform
// accepts SVG for og:image.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Brand values, matching src/style.css.
const CREAM = '#fdfbf9';
const CHARCOAL = '#171717';
const ORANGE = '#ff6f1e';
const LEMON = '#fef9c3';

/** The notebook mark used in the navbar, as standalone SVG. */
const logoMark = (x, y, scale) => `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="7" y="6" width="28" height="30" rx="7" fill="${CREAM}" stroke="${CHARCOAL}" stroke-width="2.5"/>
    <path d="M22 6v11l4-3.5 4 3.5V6" fill="${ORANGE}" stroke="${CHARCOAL}" stroke-width="1.8"/>
    <circle cx="19.5" cy="22.5" r="1.6" fill="${CHARCOAL}"/>
    <circle cx="28.5" cy="22.5" r="1.6" fill="${CHARCOAL}"/>
    <path d="M21 26.5c1.8 2.5 5.2 2.5 7 0" stroke="${CHARCOAL}" stroke-width="1.8" stroke-linecap="round"/>
  </g>
`;

// ─── Social preview, 1200×630 (the size every platform crops to) ───

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Faint ruled paper, echoing the notebook feel of the product -->
    <pattern id="rule" width="1200" height="38" patternUnits="userSpaceOnUse">
      <line x1="0" y1="37.5" x2="1200" y2="37.5" stroke="${CHARCOAL}" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="${CREAM}"/>
  <rect width="1200" height="630" fill="url(#rule)"/>
  <rect x="0" y="0" width="1200" height="12" fill="${ORANGE}"/>

  ${logoMark(78, 68, 1.5)}
  <text x="150" y="112" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-weight="700" fill="${CHARCOAL}" letter-spacing="-1.5">frea<tspan fill="${ORANGE}">.</tspan></text>

  <!-- Kept clear of the sticky note at x=872; serif at this size runs wide. -->
  <text x="78" y="252" font-family="Georgia, 'Times New Roman', serif" font-size="70" font-weight="700" fill="${CHARCOAL}" letter-spacing="-2">Free peer mentoring</text>
  <text x="78" y="334" font-family="Georgia, 'Times New Roman', serif" font-size="70" font-weight="700" fill="${CHARCOAL}" letter-spacing="-2">for UK students.</text>

  <text x="78" y="412" font-family="Helvetica, Arial, sans-serif" font-size="29" fill="${CHARCOAL}" fill-opacity="0.72">Book a free 20-minute chat with a senior</text>
  <text x="78" y="452" font-family="Helvetica, Arial, sans-serif" font-size="29" fill="${CHARCOAL}" fill-opacity="0.72">who already did what you are trying to do.</text>

  <!-- Sticky note, tilted, the way they appear throughout the product -->
  <g transform="translate(872 196) rotate(6)">
    <rect x="0" y="0" width="252" height="216" rx="6" fill="${LEMON}" stroke="${CHARCOAL}" stroke-width="2.5"/>
    <rect x="96" y="-11" width="62" height="22" rx="3" fill="${CREAM}" fill-opacity="0.85" stroke="${CHARCOAL}" stroke-width="1.5"/>
    <text x="24" y="62" font-family="Georgia, serif" font-size="26" font-style="italic" fill="${CHARCOAL}">“ask the</text>
    <text x="24" y="100" font-family="Georgia, serif" font-size="26" font-style="italic" fill="${CHARCOAL}">person who</text>
    <text x="24" y="138" font-family="Georgia, serif" font-size="26" font-style="italic" fill="${CHARCOAL}">already did it”</text>
    <text x="24" y="186" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="${CHARCOAL}" fill-opacity="0.6">— every mentor on frea</text>
  </g>

  <!-- Pill sized from the text, not guessed: 29 characters of bold Helvetica
       at 21px needs roughly 330px plus padding. -->
  <g transform="translate(78 518)">
    <rect x="0" y="0" width="386" height="54" rx="27" fill="${CHARCOAL}"/>
    <text x="28" y="35" font-family="Helvetica, Arial, sans-serif" font-size="21" font-weight="700" fill="${CREAM}">verified .ac.uk students only</text>
  </g>
  <text x="492" y="553" font-family="Helvetica, Arial, sans-serif" font-size="25" font-weight="700" fill="${ORANGE}">joinfrea.com</text>
</svg>`;

// ─── Favicon ───

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect x="15" y="12" width="70" height="76" rx="14" fill="${CREAM}" stroke="${CHARCOAL}" stroke-width="6"/>
  <path d="M50 12v26l10-8 10 8V12" fill="${ORANGE}" stroke="${CHARCOAL}" stroke-width="4"/>
  <circle cx="40" cy="56" r="5" fill="${CHARCOAL}"/>
  <circle cx="64" cy="56" r="5" fill="${CHARCOAL}"/>
  <path d="M44 68c3 5 13 5 16 0" stroke="${CHARCOAL}" stroke-width="5" stroke-linecap="round"/>
</svg>`;

const outputs = [];

fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg, 'utf8');
outputs.push(['favicon.svg', fs.statSync(path.join(PUBLIC_DIR, 'favicon.svg')).size]);

await sharp(Buffer.from(ogSvg)).png({ quality: 90 }).toFile(path.join(PUBLIC_DIR, 'og-preview.png'));
outputs.push(['og-preview.png', fs.statSync(path.join(PUBLIC_DIR, 'og-preview.png')).size]);

// Apple touch icon, for a student who saves frea to their home screen.
await sharp(Buffer.from(faviconSvg))
  .resize(180, 180)
  .flatten({ background: CREAM })
  .png()
  .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
outputs.push(['apple-touch-icon.png', fs.statSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png')).size]);

// Standard PNG favicon for browsers that ignore SVG.
await sharp(Buffer.from(faviconSvg))
  .resize(32, 32)
  .png()
  .toFile(path.join(PUBLIC_DIR, 'favicon-32.png'));
outputs.push(['favicon-32.png', fs.statSync(path.join(PUBLIC_DIR, 'favicon-32.png')).size]);

console.log('Brand assets written to public/\n');
for (const [name, size] of outputs) {
  console.log(`  ${name.padEnd(22)} ${(size / 1024).toFixed(1)} KB`);
}
console.log('\nVite copies public/ into dist/ on build.');
