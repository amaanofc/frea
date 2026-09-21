// ─────────────────────────────────────────────
// frea — pitch video upload, serving and removal
// ─────────────────────────────────────────────
//
// Requires:  npm run server

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:3001/api';

import { localOnly } from './_local-only.mjs';
localOnly(API, { suite: 'pitch-video.e2e.mjs' });
const ORIGIN = 'http://localhost:3001';
const DB = path.join(__dirname, '..', 'server', 'data.json');

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}  ${detail}`); }
};

const readDb = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const codeFor = (e) => readDb().verificationTokens.find(t => t.email === e.toLowerCase())?.code || null;

async function call(method, p, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

async function verify(email) {
  await call('POST', '/auth/send-verification', { body: { email } });
  const r = await call('POST', '/auth/verify-code', { body: { email, code: codeFor(email) } });
  return r.json.sessionToken;
}

/**
 * A minimal WebM header. Enough for multer's MIME/extension checks and for
 * asserting the exact bytes come back out again.
 */
function fakeWebm(sizeBytes = 4096) {
  const header = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x01, 0x00, 0x00, 0x00]);
  const body = Buffer.alloc(Math.max(0, sizeBytes - header.length), 0x42);
  return Buffer.concat([header, body]);
}

const stamp = Date.now();
console.log('\nPITCH VIDEO');

const email = `pitch.mentor.${stamp}@ed.ac.uk`;
const studentToken = await verify(email);

const applied = await call('POST', '/mentors/apply', {
  token: studentToken,
  body: { name: 'Pitch Test Mentor', university: 'University of York', major: 'BA History', year: '3rd year' }
});
const token = applied.json.sessionToken;
const mentorId = applied.json.mentor.id;
ok('test mentor created', applied.status === 201, JSON.stringify(applied.json).slice(0, 120));

// ── Auth ─────────────────────────────────────────────────────────────────
{
  const anon = await fetch(`${API}/upload/pitch-video`, { method: 'POST', body: new FormData() });
  ok('anonymous upload refused', anon.status === 401, String(anon.status));

  const student = await fetch(`${API}/upload/pitch-video`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: new FormData()
  });
  // studentToken became a mentor session on apply, so use a fresh student.
  const plainStudent = await verify(`pitch.student.${stamp}@ed.ac.uk`);
  const refused = await fetch(`${API}/upload/pitch-video`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${plainStudent}` },
    body: new FormData()
  });
  ok('non-mentor upload refused', refused.status === 403, String(refused.status));
}

// ── Recorded take (webm blob, no filename) ───────────────────────────────
let videoUrl = null;
{
  const bytes = fakeWebm(8192);
  const form = new FormData();
  // Mirrors a MediaRecorder blob: codec-qualified MIME, generic name.
  form.append('video', new Blob([bytes], { type: 'video/webm;codecs=vp9,opus' }), 'pitch-1789.webm');

  const res = await fetch(`${API}/upload/pitch-video`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  });
  const json = await res.json();

  ok('recorded take uploads', res.status === 200 && json.success, JSON.stringify(json).slice(0, 140));
  ok('codec-qualified MIME accepted', json.success === true);
  ok('returns a public URL', String(json.videoUrl || '').startsWith('/uploads/pitch_videos/'), json.videoUrl);
  ok('attached to the profile automatically', json.attached === true);

  videoUrl = json.videoUrl;

  const mentor = readDb().mentors.find(m => m.id === mentorId);
  ok('mentor record carries the video', mentor.pitchVideoUrl === videoUrl, mentor.pitchVideoUrl);
}

// ── Public playback ──────────────────────────────────────────────────────
{
  // No auth header: a pitch video must be watchable by any visitor.
  const res = await fetch(`${ORIGIN}${videoUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());

  ok('video is publicly served', res.status === 200, String(res.status));
  ok('served with a video content-type',
    (res.headers.get('content-type') || '').startsWith('video/'), res.headers.get('content-type'));
  ok('bytes round-trip intact', buf.length === 8192, `${buf.length} bytes`);
  ok('WebM signature preserved', buf.slice(0, 4).toString('hex') === '1a45dfa3', buf.slice(0, 4).toString('hex'));
  ok('cached aggressively (filenames are unique)',
    (res.headers.get('cache-control') || '').includes('max-age'), res.headers.get('cache-control'));
}

// ── Digital products stay private ────────────────────────────────────────
{
  const res = await fetch(`${ORIGIN}/uploads/digital_products/anything.md`);
  ok('resource files still NOT public', res.status === 404, String(res.status));
}

// ── Rejections ───────────────────────────────────────────────────────────
{
  const form = new FormData();
  form.append('video', new Blob([Buffer.from('#!/bin/sh\necho hi')], { type: 'application/x-sh' }), 'nope.sh');
  const res = await fetch(`${API}/upload/pitch-video`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  });
  ok('non-video rejected', res.status === 400, String(res.status));

  const disguised = new FormData();
  disguised.append('video', new Blob([Buffer.from('MZ')], { type: 'application/octet-stream' }), 'malware.exe');
  const res2 = await fetch(`${API}/upload/pitch-video`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: disguised
  });
  ok('executable rejected', res2.status === 400, String(res2.status));
}

// ── Replacement and removal ──────────────────────────────────────────────
{
  const form = new FormData();
  form.append('video', new Blob([fakeWebm(2048)], { type: 'video/webm' }), 'second-take.webm');
  const res = await fetch(`${API}/upload/pitch-video`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  });
  const json = await res.json();
  ok('a retake replaces the first', json.videoUrl !== videoUrl, json.videoUrl);

  const mentor = readDb().mentors.find(m => m.id === mentorId);
  ok('profile points at the newest take', mentor.pitchVideoUrl === json.videoUrl);

  const del = await fetch(`${API}/upload/pitch-video`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
  });
  ok('mentor can remove their video', del.status === 200, String(del.status));

  const after = readDb().mentors.find(m => m.id === mentorId);
  ok('profile no longer references it', !after.pitchVideoUrl, after.pitchVideoUrl);

  const gone = await fetch(`${ORIGIN}${json.videoUrl}`);
  ok('the file itself is deleted', gone.status === 404, String(gone.status));
}

// ── Saving the profile must not wipe the video ───────────────────────────
{
  const form = new FormData();
  form.append('video', new Blob([fakeWebm(3000)], { type: 'video/webm' }), 'keep.webm');
  const up = await (await fetch(`${API}/upload/pitch-video`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  })).json();

  // The profile form no longer sends pitchVideoUrl; this proves an ordinary
  // save leaves a just-recorded take alone.
  await call('PUT', `/mentors/${mentorId}`, {
    token, body: { bio: 'Updated bio after recording', topTip: 'Still here' }
  });

  const mentor = readDb().mentors.find(m => m.id === mentorId);
  ok('profile save preserves the pitch video', mentor.pitchVideoUrl === up.videoUrl, mentor.pitchVideoUrl);

  await fetch(`${API}/upload/pitch-video`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

console.log(`\n═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail > 0 ? 1 : 0);
