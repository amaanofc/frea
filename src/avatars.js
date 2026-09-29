// ─────────────────────────────────────────────
// frea — mentor avatars
// ─────────────────────────────────────────────
//
// A mentor is either their own photo or their initials. Nothing else.
//
// There used to be twelve hand-drawn SVG portraits and a picker to choose
// between them, and it was wrong in three ways at once. The renderer resolved
// the illustration from the mentor's database id rather than the avatarId they
// picked, so the picker did nothing — you chose #7, saw #7 in the preview, and
// your card showed something else. There were only twelve, keyed 1–12 for the
// seed mentors, so every mentor who actually signed up fell through to
// MENTOR_AVATARS[1] and wore one specific stranger's face. And on a page whose
// entire job is deciding whether to trust a stranger, an illustration that
// asserts a gender, a skin tone and in one case a headscarf is not a neutral
// placeholder — it is a claim about a person, made by us, at random.
//
// Initials cannot be wrong about anybody.

import { escapeHtml } from './escape.js';

/**
 * The four sticker colours the rest of the site uses. Every pair clears 7:1
 * against its own ground.
 */
const TINTS = [
  { bg: '#ffd9c2', ink: '#7c2d12' },
  { bg: '#cdeed8', ink: '#14532d' },
  { bg: '#ffd7ec', ink: '#9d174d' },
  { bg: '#d3e3ff', ink: '#1e3a8a' }
];

/**
 * Up to two letters: first name and last name, or the first letter alone.
 *
 * Array.from rather than [0] because a name can begin with a character outside
 * the basic plane, and indexing a string would take half a surrogate pair and
 * render a replacement glyph.
 */
export function initialsFor(name) {
  const words = String(name == null ? '' : name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';

  const first = Array.from(words[0])[0] || '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] || '') : '';
  return (first + last).toUpperCase();
}

/**
 * Picks a tint from the name.
 *
 * From the name rather than the mentor's `color` field, even though that field
 * exists: it is derived from the post-it colour at signup, which almost
 * everyone leaves at the default, so a browse page of mentors who did not pick
 * one comes out entirely in a single colour. Hashing spreads them.
 *
 * Not random — the same name must get the same tint on every render, or a
 * mentor's avatar changes colour as you move between pages.
 */
function tintFor(name) {
  let hash = 0;
  for (const ch of String(name || '')) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}

/** Only ever a path this server minted. Anything else renders as initials. */
function usablePhoto(url) {
  return /^\/uploads\/mentor_photos\/photo-\d+-\d+-[0-9a-f]{8}\.webp$/.test(String(url || ''));
}

/**
 * Renders a mentor's avatar at `size` px.
 *
 * @param {object|string} person - A mentor-shaped object ({ name, photoUrl })
 *   or just a display name. It takes a name, not an id: initials cannot be
 *   derived from a primary key, which is what the old signature quietly
 *   papered over.
 * @param {number} size - Edge length in px.
 * @param {string|null} photoUrl - Overrides person.photoUrl when the caller
 *   holds the photo separately.
 */
export function getMentorAvatar(person, size = 80, photoUrl = null) {
  const isObject = typeof person === 'object' && person !== null;
  const name = isObject ? person.name : person;
  const photo = photoUrl || (isObject ? person.photoUrl : null);

  if (usablePhoto(photo)) {
    // Escaped even though usablePhoto has already rejected anything but our
    // own filename shape. The check is the guard; this is the sink, and the
    // sink is where the rule applies.
    // alt is empty on purpose: every avatar on the site sits next to the
    // mentor's name in text, so a caption here is read out twice.
    return `<img src="${escapeHtml(photo)}" alt=""
      width="${size}" height="${size}" loading="lazy" decoding="async"
      style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block;">`;
  }

  const tint = tintFor(name);
  const initials = initialsFor(name);

  // Sized off the box rather than a fixed scale, so a 28px doc-card avatar and
  // a 180px profile avatar are the same design and not two.
  //
  // Handed over as a custom property rather than as font-size directly. Every
  // avatar container is a fixed pixel box, so this is right for all of them —
  // except the profile frame, which the stylesheet shrinks on a phone. An
  // inline font-size would beat that media query and leave 68px initials in a
  // 96px box; a custom property lets a stylesheet rule win where it needs to.
  const fontSize = Math.round(size * (initials.length > 1 ? 0.38 : 0.46));

  return `<span class="mentor-initials" aria-hidden="true"
    style="background: ${tint.bg}; color: ${tint.ink}; --avatar-initials-size: ${fontSize}px;"
    >${escapeHtml(initials)}</span>`;
}
