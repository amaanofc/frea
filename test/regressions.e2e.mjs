// ─────────────────────────────────────────────
// frea — regression guards for the audited defects
// ─────────────────────────────────────────────
//
// One test per bug that shipped broken, so none of them can come back quietly.
// Requires:  npm run server
//
//   npm run test:regressions

import fs from 'fs';
import { seedIdentity } from './_identity.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:3001/api';

import { localOnly } from './_local-only.mjs';
localOnly(API, { suite: 'regressions.e2e.mjs' });
const DB = path.join(__dirname, '..', 'server', 'data.json');

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
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

async function verify(email) {
  seedIdentity(email);
  await call('POST', '/auth/send-verification', { body: { email } });
  const r = await call('POST', '/auth/verify-code', { body: { email, code: codeFor(email) } });
  return r.json.sessionToken;
}

const stamp = Date.now();

// ── Defect 1: every resource failed to download ──────────────────────────
group('DEFECT 1 — resources had no files, so every download 404\'d');
{
  const token = await verify(`reg.reader.${stamp}@ed.ac.uk`);
  const list = await call('GET', '/resources', { token });
  const resources = list.json.data;

  ok('catalogue is not empty', resources.length > 0, `${resources.length}`);

  const db = readDb();
  const all = [...db.resources];
  const versions = db.resourceVersions || [];
  const currentFile = resource => versions.some(v =>
    v.resourceId === resource.id
    && v.id === resource.currentVersionId
    && Boolean(v.fileName)
  );
  ok('every resource has a canonical current-version file',
    all.every(currentFile), `${all.filter(r => !currentFile(r)).length} missing`);
  ok('product rows do not duplicate file handles',
    all.every(r => !r.fileName), `${all.filter(r => r.fileName).length} duplicated`);

  // Signatures prove we streamed the real format, not an error page.
  const SIGNATURES = {
    PDF: (buf) => buf.slice(0, 5).toString('latin1') === '%PDF-',
    PowerPoint: (buf) => buf[0] === 0x50 && buf[1] === 0x4B, // PK zip header
    Markdown: (buf) => buf.toString('utf8').includes('#'),
    LaTeX: (buf) => buf.toString('utf8').includes('\\documentclass')
  };

  const seenFormats = new Set();

  for (const r of resources.filter(x => x.type !== 'paid')) {
    const res = await fetch(`${API}/resources/${r.id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const buf = Buffer.from(await res.arrayBuffer());

    ok(`${r.format.padEnd(11)} "${r.title}" downloads`, res.status === 200, `status ${res.status}`);

    // The real failure mode was a JSON error body, so check we got file
    // content rather than an error envelope — size alone proves nothing.
    const looksLikeError = buf.slice(0, 1).toString() === '{'
      && buf.toString('utf8', 0, 200).includes('"success"');
    ok(`${r.format.padEnd(11)} returns file content, not an error`,
      buf.length > 0 && !looksLikeError, `${buf.length} bytes`);

    const check = SIGNATURES[r.format];
    if (check) {
      ok(`${r.format.padEnd(11)} has a valid ${r.format} signature`, check(buf),
        JSON.stringify(buf.slice(0, 12).toString('latin1')));
      seenFormats.add(r.format);
    }
  }

  ok('free formats all exercised (md, tex, pdf)', seenFormats.size >= 3,
    [...seenFormats].join(', '));

  // The paid one still requires purchase — the gate did not regress.
  const paid = resources.find(r => r.type === 'paid');
  if (paid) {
    const res = await fetch(`${API}/resources/${paid.id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('paid playbook still gated behind purchase', res.status === 402, String(res.status));
  }
}

// ── Defect 2: resources from unseeded mentors were dropped ───────────────
group('DEFECT 2 — resources from a mentor outside the bundled id range');
{
  const email = `reg.newmentor.${stamp}@ed.ac.uk`;
  const token = await verify(email);

  const applied = await call('POST', '/mentors/apply', {
    token,
    body: { name: 'Regression Mentor', university: 'University of Leeds', major: 'BSc Physics', year: '3rd year' }
  });
  const mentorId = applied.json.mentor.id;
  const mentorToken = applied.json.sessionToken;

  ok('new mentor id is outside the bundled 1-13 range', mentorId > 13, `id ${mentorId}`);

  const form = new FormData();
  form.append('document', new Blob(['# Regression doc\n\nReal bytes here.'], { type: 'text/markdown' }), 'reg.md');
  const up = await (await fetch(`${API}/upload/document`, {
    method: 'POST', headers: { Authorization: `Bearer ${mentorToken}` }, body: form
  })).json();

  const created = await call('POST', '/resources', {
    token: mentorToken,
    body: { title: 'Regression Guide', type: 'free', fileName: up.fileName, format: up.format }
  });
  ok('new mentor can publish', created.status === 201);

  // The API must carry enough for the client to render it without the mentor
  // being in the bundled array — this is what the client fix relies on.
  const list = await call('GET', '/resources');
  const found = list.json.data.find(r => r.id === created.json.data.id);
  ok('resource appears in the public listing', Boolean(found));
  ok('listing carries mentorName for client-side attribution', Boolean(found?.mentorName), found?.mentorName);
  ok('listing carries mentorUniversity', Boolean(found?.mentorUniversity), found?.mentorUniversity);

  const reader = await verify(`reg.reader2.${stamp}@ed.ac.uk`);
  const dl = await fetch(`${API}/resources/${created.json.data.id}/download`, {
    headers: { Authorization: `Bearer ${reader}` }
  });
  ok('a student can download it', dl.status === 200, String(dl.status));

  globalThis.REG = { mentorId, mentorToken, email };
}

// ── Defect 2b: API-created mentors had an unrenderable profile ───────────
group('DEFECT 2b — a mentor created through the API must render');
{
  const { mentorId } = globalThis.REG;

  const profile = await call('GET', `/mentors/${mentorId}`);
  ok('profile is fetchable', profile.json.success === true);

  // renderProfile read `mentor.availability[0]`, a pre-API shape only the
  // bundled seed mentors ever had. Every real sign-up crashed the page.
  const m = profile.json.data;
  ok('record has no legacy availability field', m.availability === undefined);

  const bundle = (() => {
    const dir = path.join(__dirname, '..', 'dist', 'assets');
    const js = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
      .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0];
    return fs.readFileSync(path.join(dir, js.f), 'utf8');
  })();
  ok('bundle no longer indexes availability[0]', !bundle.includes('.availability[0]'));

  ok('mentor is bookable, which needs the profile to render',
    Object.keys(m.weeklySchedule || {}).length > 0, JSON.stringify(m.weeklySchedule));
}

// ── Defect 3: portal misattribution ──────────────────────────────────────
group('DEFECT 3 — portal must never act on another mentor\'s record');
{
  const { mentorId, mentorToken } = globalThis.REG;
  const other = readDb().mentors.find(m => m.id !== mentorId && m.email);

  if (other) {
    const write = await call('PUT', `/mentors/${other.id}`, {
      token: mentorToken, body: { bio: 'should never land' }
    });
    ok('cannot write to another mentor', write.status === 403, String(write.status));

    const fresh = readDb().mentors.find(m => m.id === other.id);
    ok('their bio is untouched', fresh.bio !== 'should never land');
  }

  const own = await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken, body: { bio: 'my own bio' }
  });
  ok('can write to own record', own.json.success === true);
}

// ── Defect 4: fee copy contradicted the real rate ────────────────────────
group('DEFECT 4 — one source of truth for the fee');
{
  const cfg = await call('GET', '/payments/config');
  ok('server reports the fee rate', typeof cfg.json.data.feeRatePercent === 'number',
    String(cfg.json.data.feeRatePercent));

  const bundle = (() => {
    const dir = path.join(__dirname, '..', 'dist', 'assets');
    const js = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
      .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0];
    return fs.readFileSync(path.join(dir, js.f), 'utf8');
  })();

  ok('no hardcoded "99% Creator Earnings" in the bundle', !bundle.includes('99% Creator Earnings'));
  ok('no hardcoded "1% Frea Fee" in the bundle', !bundle.includes('1% Frea Fee'));
  ok('no "takes just 1%" copy in the bundle', !bundle.includes('takes just 1%'));
  ok('bundle derives the rate from config', bundle.includes('feeRatePercent'));
}

// ── Defect 5: stored XSS ─────────────────────────────────────────────────
group('DEFECT 5 — mentor-supplied text must render inert');
{
  const { mentorId, mentorToken } = globalThis.REG;
  const payload = '<img src=x onerror=alert(1)>';

  const saved = await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken,
    body: { bio: `Bio ${payload}`, topTip: `Tip ${payload}` }
  });
  ok('payload is stored verbatim, not silently mangled',
    saved.json.data.bio.includes('<img'), saved.json.data.bio);

  // The defence is at render: the bundle must escape these fields.
  const bundle = (() => {
    const dir = path.join(__dirname, '..', 'dist', 'assets');
    const js = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
      .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0];
    return fs.readFileSync(path.join(dir, js.f), 'utf8');
  })();

  ok('bundle contains an HTML escaper', /replace\(\/&\/g/.test(bundle) || bundle.includes('&amp;'));

  const control = await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken, body: { bio: 'a'.repeat(5000) }
  });
  ok('over-long bio is capped server-side', control.json.data.bio.length <= 1200,
    String(control.json.data.bio.length));

  const nulled = await call('PUT', `/mentors/${mentorId}`, {
    token: mentorToken, body: { topTip: 'clean tip​here' }
  });
  ok('control and zero-width characters stripped',
    !/[ ​]/.test(nulled.json.data.topTip), JSON.stringify(nulled.json.data.topTip));
}

// ── Tidy up what this run created ────────────────────────────────────────
{
  const { mentorToken, cleanup = [] } = globalThis.REG || {};
  for (const id of cleanup) {
    await call('DELETE', `/resources/${id}`, { token: mentorToken });
  }
}

console.log(`\n═══ ${pass} passed, ${fail} failed ═══\n`);
process.exit(fail > 0 ? 1 : 0);
